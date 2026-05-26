#!/bin/bash
# ZAL Plugin Registry Management Script
# One command to rule them all

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/var/www/zalcli-registry"

show_help() {
    cat << EOF
🚀 ZAL Plugin Registry Management

Usage: sudo ./manage.sh <command>

Commands:
  deploy <domain> <email>  - Initial deployment
  update                   - Full update (code + dependencies)
  quick-update             - Quick update (code only, faster)
  update-packages          - Update npm packages only
  restart                  - Restart the service
  rebuild                  - Rebuild server and client
  logs                     - View real-time logs
  status                   - Check service status
  backup                   - Backup database
  restore <file>           - Restore database from backup
  nginx-fix                - Fix Nginx SPA routing
  error-pages              - Setup custom error pages
  env-edit                 - Edit environment variables
  help                     - Show this help

Examples:
  sudo ./manage.sh deploy zalcli.com admin@example.com
  sudo ./manage.sh quick-update
  sudo ./manage.sh logs
  sudo ./manage.sh backup

EOF
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        echo "❌ Please run as root (use sudo)"
        exit 1
    fi
}

case "${1:-help}" in
    deploy)
        check_root
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "❌ Usage: sudo ./manage.sh deploy <domain> <email>"
            exit 1
        fi
        chmod +x "$SCRIPT_DIR/deploy.sh"
        "$SCRIPT_DIR/deploy.sh" "$2" "$3"
        ;;
    
    update)
        check_root
        chmod +x "$SCRIPT_DIR/update.sh"
        "$SCRIPT_DIR/update.sh"
        ;;
    
    quick-update)
        check_root
        chmod +x "$SCRIPT_DIR/quick-update.sh"
        "$SCRIPT_DIR/quick-update.sh"
        ;;
    
    update-packages)
        check_root
        chmod +x "$SCRIPT_DIR/update-packages.sh"
        "$SCRIPT_DIR/update-packages.sh"
        ;;
    
    restart)
        check_root
        echo "🔄 Restarting service..."
        systemctl restart zalcli-registry
        systemctl status zalcli-registry --no-pager -l | head -15
        ;;
    
    rebuild)
        check_root
        echo "🔨 Rebuilding server..."
        cd "$APP_DIR/server"
        npm run build
        
        echo "🔨 Rebuilding client..."
        cd "$APP_DIR/client"
        npm run build
        
        echo "🔄 Restarting..."
        systemctl restart zalcli-registry
        systemctl reload nginx
        
        echo "✅ Rebuild complete!"
        ;;
    
    logs)
        echo "📜 Viewing logs (Ctrl+C to exit)..."
        journalctl -u zalcli-registry -f
        ;;
    
    status)
        systemctl status zalcli-registry --no-pager -l
        echo ""
        echo "📊 Recent logs:"
        journalctl -u zalcli-registry -n 10 --no-pager
        ;;
    
    backup)
        check_root
        BACKUP_FILE="$APP_DIR/server/data/registry.db.backup-$(date +%Y%m%d-%H%M%S)"
        echo "💾 Creating backup..."
        cp "$APP_DIR/server/data/registry.db" "$BACKUP_FILE"
        echo "✅ Backup created: $BACKUP_FILE"
        ls -lh "$BACKUP_FILE"
        ;;
    
    restore)
        check_root
        if [ -z "$2" ]; then
            echo "❌ Usage: sudo ./manage.sh restore <backup-file>"
            echo ""
            echo "Available backups:"
            ls -lh "$APP_DIR/server/data/"*.backup-* 2>/dev/null || echo "No backups found"
            exit 1
        fi
        echo "⚠️  This will replace the current database!"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            systemctl stop zalcli-registry
            cp "$2" "$APP_DIR/server/data/registry.db"
            systemctl start zalcli-registry
            echo "✅ Database restored!"
        fi
        ;;
    
    nginx-fix)
        check_root
        chmod +x "$SCRIPT_DIR/fix-nginx.sh"
        "$SCRIPT_DIR/fix-nginx.sh"
        ;;
    
    error-pages)
        check_root
        chmod +x "$SCRIPT_DIR/setup-error-pages.sh"
        "$SCRIPT_DIR/setup-error-pages.sh"
        ;;
    
    env-edit)
        check_root
        echo "Select environment file to edit:"
        echo "1) Server (.env)"
        echo "2) Client (.env)"
        read -p "Choice (1-2): " choice
        
        case $choice in
            1)
                nano "$APP_DIR/server/.env"
                echo "🔄 Restarting service..."
                systemctl restart zalcli-registry
                ;;
            2)
                nano "$APP_DIR/client/.env"
                echo "🔨 Rebuilding client..."
                cd "$APP_DIR/client"
                npm run build
                ;;
            *)
                echo "Invalid choice"
                exit 1
                ;;
        esac
        ;;
    
    help|--help|-h)
        show_help
        ;;
    
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
