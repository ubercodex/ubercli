import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Reveal animation on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#03030d] text-slate-200 font-sans">
      {/* Stars Background */}
      <div className="stars fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-0.5 h-0.5 rounded-full bg-white shadow-[120px_40px_#fff,300px_180px_#c7d2fe,480px_60px_#fff,640px_220px_#a5f3fc,800px_90px_#fff,960px_300px_#fff,80px_400px_#c7d2fe,260px_480px_#fff,440px_360px_#a5f3fc,620px_440px_#fff,740px_380px_#fff,900px_460px_#c7d2fe,1040px_200px_#fff,1100px_350px_#a5f3fc,200px_550px_#fff,380px_600px_#fff,560px_520px_#c7d2fe,720px_580px_#fff,880px_540px_#fff,1020px_480px_#a5f3fc] animate-pulse"></div>
      </div>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#03030d]/85 backdrop-blur-xl border-b border-cyan-500/8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-600">
            <span className="text-white font-bold text-sm font-mono">U</span>
          </div>
          <span className="font-bold text-white tracking-tight">Uber CLI</span>
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
            Plugin Registry
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/browse" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors hidden sm:block">Browse</Link>
          <a href="https://github.com/ubercodex/ubercli/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors hidden sm:block">Issues</a>
          <a href="#contact" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors hidden sm:block">Contact</a>
          <a
            href="https://github.com/ubercodex/ubercli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/6 border border-white/10 text-slate-200 hover:bg-white/10 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-6">
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none bg-gradient-radial from-cyan-500/8 to-transparent blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none bg-gradient-radial from-violet-600/8 to-transparent blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-cyan-500/8 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Open Source · Community Powered
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
              <span className="text-white">Plugin</span><br/>
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Registry</span><br/>
              <span className="text-white">for Uber CLI</span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
              Discover and share custom AI tools for Uber CLI. Describe what you need, AI generates the code, and you can publish it here for everyone.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/browse"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
              >
                Browse Plugins →
              </Link>
              <a
                href="https://github.com/ubercodex/ubercli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-white/5 border border-white/12 text-slate-200 hover:bg-white/9 transition-all"
              >
                Documentation
              </a>
            </div>

            <div className="mt-10 flex items-center gap-4 flex-wrap">
              <span className="text-slate-600 text-xs uppercase tracking-widest font-semibold">Works with</span>
              <span className="px-3 py-1 text-xs font-semibold bg-cyan-500/8 text-cyan-400 border border-cyan-500/20 rounded-full">Anthropic</span>
              <span className="px-3 py-1 text-xs font-semibold bg-indigo-500/8 text-indigo-400 border border-indigo-500/20 rounded-full">Google</span>
              <span className="px-3 py-1 text-xs font-semibold bg-violet-500/8 text-violet-400 border border-violet-500/20 rounded-full">OpenAI</span>
            </div>
          </div>

          {/* Terminal mockup */}
          <div className="animate-float">
            <div className="bg-[#050510] border border-cyan-500/25 rounded-xl overflow-hidden shadow-2xl shadow-cyan-500/8">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-cyan-500/12 bg-cyan-500/3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-2 text-xs text-slate-500 font-mono">uber /plugins</span>
              </div>
              <div className="p-5 font-mono text-sm leading-7">
                <div><span className="text-slate-500">$</span> <span className="text-cyan-400">uber</span></div>
                <div className="text-slate-500 text-xs">Uber CLI v0.1.2 · claude-sonnet-4-5</div>
                <div className="mt-2"><span className="text-slate-500">&gt;</span> <span className="text-white">/plugins</span></div>
                <div className="text-slate-500 text-xs mt-1">→ + New tool</div>
                <div className="mt-2 text-slate-300 text-xs">Describe what the tool should do:</div>
                <div className="text-violet-400 text-xs">Fetch weather data from wttr.in API</div>
                <div className="mt-1 text-slate-500 text-xs">⟳ Generating with AI...</div>
                <div className="text-cyan-400 text-xs mt-1">✓ <span className="text-slate-300">Created</span> <span className="text-green-400">getWeather.ts</span></div>
                <div className="mt-2 text-slate-300 text-xs">Tool ready! Now you can ask about weather.</div>
                <div className="mt-3"><span className="text-slate-500">&gt;</span> <span className="animate-blink text-cyan-400">▌</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="py-4 overflow-hidden border-y border-cyan-500/8 bg-cyan-500/2">
        <div className="flex gap-12 animate-scroll-left whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-12">
              <span className="text-cyan-500/60 text-xs font-mono tracking-widest uppercase">AI-Generated Tools</span>
              <span className="text-slate-600">·</span>
              <span className="text-violet-500/60 text-xs font-mono tracking-widest uppercase">Plugin System</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-500/60 text-xs font-mono tracking-widest uppercase">Tool Profiles</span>
              <span className="text-slate-600">·</span>
              <span className="text-violet-500/60 text-xs font-mono tracking-widest uppercase">Multi-Provider</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-500/60 text-xs font-mono tracking-widest uppercase">Open Source</span>
              <span className="text-slate-600">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* What is Uber CLI */}
      <section id="about" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 reveal opacity-0 translate-y-5 transition-all duration-600">
            <div className="inline-block px-4 py-2 mb-4 bg-cyan-500/8 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
              What is Uber CLI
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Your terminal. Supercharged.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              An AI-powered terminal assistant built with Ink and TypeScript. Chat with multiple LLM providers, 
              create custom tools with AI, and manage tool profiles — all from your terminal.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🤖', title: 'Multi-Provider AI', desc: 'Switch between multiple AI providers and models. Configure your preferred provider and start chatting.' },
              { icon: '🔌', title: 'Plugin System', desc: 'Create custom tools by describing what you want. AI generates the code for you.' },
              { icon: '📦', title: 'Tool Profiles', desc: 'Group tools into named profiles. Activate a profile to restrict AI to only those tools.' },
              { icon: '💾', title: 'Workspace Memory', desc: 'Two-layer memory system: shared baseline + per-branch overlay for git repos.' },
              { icon: '🎨', title: 'Multiple Themes', desc: 'Choose from multiple color themes to customize your terminal experience.' },
              { icon: '🔐', title: 'Encrypted Keys', desc: 'API keys stored with strong encryption, derived from your machine identity.' },
            ].map((feature, i) => (
              <div key={i} className="reveal opacity-0 translate-y-5 transition-all duration-600 bg-[#0d0d24]/60 backdrop-blur-xl border border-cyan-500/12 rounded-2xl p-6 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plugin Registry Section */}
      <section id="registry" className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-violet-600/6 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16 reveal opacity-0 translate-y-5 transition-all duration-600">
            <div className="inline-block px-4 py-2 mb-4 bg-violet-500/8 text-violet-400 border border-violet-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
              Plugin Registry
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Build once.<br/>
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Share everywhere.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Share your AI-generated tools with the community. Discover plugins built by developers worldwide 
              and extend your CLI with new capabilities.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5 reveal opacity-0 translate-y-5 transition-all duration-600">
              {[
                { emoji: '📦', title: 'Easy Discovery', desc: 'Browse and search community-built tools. Find the perfect plugin for your workflow.' },
                { emoji: '🚀', title: 'Simple Publishing', desc: 'Share your AI-generated tools with the community. Help others extend their CLI.' },
                { emoji: '🔍', title: 'Searchable Registry', desc: 'Filter by tags, author, or description. Find exactly what you need.' },
                { emoji: '📊', title: 'Community Stats', desc: 'See popular plugins and track downloads. Discover what the community loves.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-violet-500/15 border border-violet-500/25">
                    <span className="text-sm">{item.emoji}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="reveal opacity-0 translate-y-5 transition-all duration-600">
              <Link
                to="/browse"
                className="block bg-[#0d0d24]/60 backdrop-blur-xl border border-violet-500/25 rounded-2xl p-8 hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/20 transition-all group"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">Explore Plugins</h3>
                  <svg className="w-6 h-6 text-violet-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-6">
                  Browse community-built plugins. Discover tools for APIs, databases, automation, and more.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Weather', 'Database', 'API', 'Automation', 'DevOps', 'Utilities'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-violet-500/10 text-violet-300 text-xs rounded-full border border-violet-500/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 reveal opacity-0 translate-y-5 transition-all duration-600">
            <div className="inline-block px-4 py-2 mb-4 bg-green-500/8 text-green-400 border border-green-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
              Get in Touch
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">Need help? Found a bug?</h2>
            <p className="text-slate-400 text-lg">We're here to help. Choose your preferred way to reach out.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 reveal opacity-0 translate-y-5 transition-all duration-600">
            <a
              href="https://github.com/ubercodex/ubercli/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0d0d24]/60 backdrop-blur-xl border border-cyan-500/12 rounded-2xl p-8 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-2 group-hover:text-cyan-400 transition-colors">GitHub Issues</h3>
                  <p className="text-slate-400 text-sm">Report bugs, request features, or ask technical questions on our GitHub repository.</p>
                </div>
              </div>
            </a>

            <a
              href="mailto:support@ubercli.com"
              className="bg-[#0d0d24]/60 backdrop-blur-xl border border-violet-500/12 rounded-2xl p-8 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20 flex-shrink-0">
                  <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold mb-2 group-hover:text-violet-400 transition-colors">Email Support</h3>
                  <p className="text-slate-400 text-sm">For private inquiries, partnership opportunities, or general questions, drop us an email.</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-cyan-500/8 bg-[#0d0d24]/30 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-cyan-500 to-violet-600">
                <span className="text-white font-bold text-sm font-mono">U</span>
              </div>
              <div>
                <div className="font-bold text-white">Uber CLI</div>
                <div className="text-xs text-slate-500">Plugin Registry</div>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/browse" className="hover:text-cyan-400 transition-colors">Browse</Link>
              <a href="https://github.com/ubercodex/ubercli" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>
              <a href="https://github.com/ubercodex/ubercli/issues" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Issues</a>
              <a href="#contact" className="hover:text-cyan-400 transition-colors">Contact</a>
            </div>
            <div className="text-xs text-slate-600">
              © 2026 Uber CLI. MIT License.
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-fade-up { animation: fade-up 0.6s ease-out both; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-blink { animation: blink 1.1s step-end infinite; }
        .animate-scroll-left { animation: scroll-left 28s linear infinite; width: max-content; }
        .reveal.visible { opacity: 1 !important; transform: translateY(0) !important; }
        .bg-gradient-radial { background: radial-gradient(var(--tw-gradient-stops)); }
      `}</style>
    </div>
  );
}
