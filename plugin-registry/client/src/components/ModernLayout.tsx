import { Link, useLocation } from 'react-router-dom';
import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/animations.css';

interface ModernLayoutProps {
  children: ReactNode;
}

export default function ModernLayout({ children }: ModernLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleSignIn = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-float-gentle"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-float-slow delay-300"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse-glow delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle-float ${15 + Math.random() * 10}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-purple-500/20 shadow-lg shadow-purple-500/10' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <span className="text-xl font-bold text-white">ZAL</span>
                </div>
              </div>
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">CLI</span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/') ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Home
                {isActive('/') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/registry" 
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/registry') ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Plugins
                {isActive('/registry') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/profiles" 
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/profiles') ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Profiles
                {isActive('/profiles') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                )}
              </Link>
              <Link 
                to="/contact" 
                className={`text-sm font-medium transition-all relative group ${
                  isActive('/contact') ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Contact
                {isActive('/contact') && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></span>
                )}
              </Link>
            </nav>
            
            {/* User Menu / Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/40 group-hover:shadow-purple-500/60 transition-all">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white">{user.username}</span>
                  <svg className={`w-4 h-4 text-purple-300 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-64 bg-[#12121a]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden animate-scale-in z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-purple-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{user.username}</div>
                          <div className="text-xs text-purple-300">ZAL Developer</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-2 space-y-1">
                      <Link
                        to="/publish"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-purple-500/20 hover:text-white rounded-xl transition-all group"
                      >
                        <span className="text-lg">📦</span>
                        <span>Publish Plugin</span>
                        <svg className="w-4 h-4 ml-auto text-slate-500 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link
                        to="/publish-profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-purple-500/20 hover:text-white rounded-xl transition-all group"
                      >
                        <span className="text-lg">📋</span>
                        <span>Create Profile</span>
                        <svg className="w-4 h-4 ml-auto text-slate-500 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link
                        to="/my-plugins"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-purple-500/20 hover:text-white rounded-xl transition-all group"
                      >
                        <span className="text-lg">🔧</span>
                        <span>My Plugins</span>
                        <svg className="w-4 h-4 ml-auto text-slate-500 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <Link
                        to="/my-profiles"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-purple-500/20 hover:text-white rounded-xl transition-all group"
                      >
                        <span className="text-lg">�</span>
                        <span>My Profiles</span>
                        <svg className="w-4 h-4 ml-auto text-slate-500 group-hover:text-purple-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      
                      {user.isAdmin && (
                        <>
                          <div className="my-2 border-t border-purple-500/20"></div>
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300 rounded-xl transition-all group"
                          >
                            <span className="text-lg">⚡</span>
                            <span>Admin Panel</span>
                            <svg className="w-4 h-4 ml-auto text-yellow-500 group-hover:text-yellow-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </>
                      )}
                      
                      <div className="my-2 border-t border-purple-500/20"></div>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all group"
                      >
                        <span className="text-lg">🚪</span>
                        <span>Sign Out</span>
                        <svg className="w-4 h-4 ml-auto text-red-500 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium text-sm shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Sign in with GitHub</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-32 border-t border-purple-500/10 bg-[#12121a]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg opacity-50"></div>
                  <div className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                    <span className="text-xl font-bold text-white">ZAL</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-400">CLI</span>
              </div>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                Inspired by Zal, the legendary Persian hero. A terminal assistant that connects humans with AI, 
                ideas with execution, and developers with each other. Wisdom over force.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/" className="text-slate-400 hover:text-purple-400 transition-colors">Home</Link></li>
                <li><Link to="/registry" className="text-slate-400 hover:text-purple-400 transition-colors">Browse Plugins</Link></li>
                <li><Link to="/profiles" className="text-slate-400 hover:text-purple-400 transition-colors">Browse Profiles</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-purple-400 transition-colors">Contact</Link></li>
                <li><a href="https://github.com/ubercodex/zalcli#readme" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-purple-400 transition-colors">Documentation</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm">Community</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="https://github.com/ubercodex/zalcli" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-purple-400 transition-colors">GitHub</a></li>
                <li><a href="https://github.com/ubercodex/zalcli/issues" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-purple-400 transition-colors">Issues</a></li>
                <li><a href="https://github.com/ubercodex/zalcli/discussions" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-purple-400 transition-colors">Discussions</a></li>
                <li><a href="mailto:support@zalcli.com" className="text-slate-400 hover:text-purple-400 transition-colors">Email</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-purple-500/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <div className="text-slate-500">
              © 2026 ZAL CLI. Released under the MIT License.
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span>Built with</span>
              <span className="text-pink-500 animate-pulse-glow">❤️</span>
              <span>for you</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
