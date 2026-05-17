import { Link, useLocation } from 'react-router-dom';
import { ReactNode, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleSignIn = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  return (
    <div className="min-h-screen bg-[#03030d] text-slate-200 font-sans flex flex-col">
      {/* Stars Background */}
      <div className="stars fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white shadow-[120px_40px_#fff,300px_180px_#c7d2fe,480px_60px_#fff,640px_220px_#a5f3fc,800px_90px_#fff,960px_300px_#fff,80px_400px_#c7d2fe,260px_480px_#fff,440px_360px_#a5f3fc,620px_440px_#fff,740px_380px_#fff,900px_460px_#c7d2fe,1040px_200px_#fff,1100px_350px_#a5f3fc,200px_550px_#fff,380px_600px_#fff,560px_520px_#c7d2fe,720px_580px_#fff,880px_540px_#fff,1020px_480px_#a5f3fc] animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#03030d]/85 backdrop-blur-xl border-b border-cyan-500/8">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-600 group-hover:shadow-lg group-hover:shadow-cyan-500/30 transition-all">
              <span className="text-white font-bold text-sm font-mono">U</span>
            </div>
            <div>
              <div className="font-bold text-white tracking-tight">Uber CLI</div>
              <div className="text-xs text-slate-500">Plugin Registry</div>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/" 
              className={`text-sm transition-colors ${isActive('/') ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-cyan-400'}`}
            >
              Home
            </Link>
            <Link 
              to="/registry" 
              className={`text-sm transition-colors ${isActive('/registry') ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-cyan-400'}`}
            >
              Registry
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm transition-colors ${isActive('/contact') ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-cyan-400'}`}
            >
              Contact
            </Link>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/6 border border-white/10 text-slate-200 hover:bg-white/10 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  {user.username}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#0d0d24] border border-cyan-500/20 rounded-xl shadow-xl overflow-hidden">
                    <Link
                      to="/publish"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm text-slate-200 hover:bg-cyan-500/10 transition"
                    >
                      Publish Plugin
                    </Link>
                    <Link
                      to="/my-plugins"
                      onClick={() => setShowUserMenu(false)}
                      className="block px-4 py-3 text-sm text-slate-200 hover:bg-cyan-500/10 transition"
                    >
                      My Plugins
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Sign in
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/8 bg-[#0d0d24]/30 py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-600">
                  <span className="text-white font-bold text-sm font-mono">U</span>
                </div>
                <div>
                  <div className="font-bold text-white">Uber CLI</div>
                  <div className="text-xs text-slate-500">Plugin Registry</div>
                </div>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                An AI-powered terminal assistant with multi-provider support, custom tool creation, 
                and a community-driven plugin ecosystem.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-slate-400 hover:text-cyan-400 transition-colors">Home</Link></li>
                <li><Link to="/registry" className="text-slate-400 hover:text-cyan-400 transition-colors">Browse Registry</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact</Link></li>
                <li><a href="https://github.com/ubercodex/ubercli#readme" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">Documentation</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-white font-semibold mb-3 text-sm">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://github.com/ubercodex/ubercli" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">GitHub</a></li>
                <li><a href="https://github.com/ubercodex/ubercli/issues" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">Issues</a></li>
                <li><a href="https://github.com/ubercodex/ubercli/discussions" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition-colors">Discussions</a></li>
                <li><a href="mailto:support@ubercli.com" className="text-slate-400 hover:text-cyan-400 transition-colors">Email</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-cyan-500/8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div>© 2026 Uber CLI. Released under the MIT License.</div>
            <div className="flex items-center gap-4">
              <span>Built with ❤️ by the community</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
