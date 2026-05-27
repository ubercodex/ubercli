import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Plugin {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
  downloads: number;
  tags: string[];
  createdAt: string;
  versionCount?: number;
  pendingVersions?: number;
}

export default function Registry() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/plugins`)
      .then(res => res.json())
      .then(data => {
        setPlugins(data.plugins || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = plugins.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in-down">
          <div className="inline-block px-4 py-2 mb-4 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-full text-xs font-semibold uppercase tracking-wider">
            Plugin Registry
          </div>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-2">
            Discover Plugins
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl">
            Browse community-built tools to extend ZAL. Find plugins for APIs, automation, databases, and more.
          </p>
        </div>
        
        {/* Search */}
        <div className="mb-12 max-w-2xl mx-auto animate-fade-in-up">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <input
              type="text"
              placeholder="Search by name, author, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="relative w-full px-6 py-4 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <div className="text-slate-400">Loading plugins...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            {search ? (
              <>
                <div className="text-7xl mb-6 animate-pulse-glow">🔍</div>
                <h2 className="text-3xl font-bold text-white mb-3">No plugins found</h2>
                <p className="text-slate-400 text-lg mb-8">
                  No plugins match "{search}"
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="px-6 py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-3xl blur-2xl"></div>
                  <div className="relative text-8xl mb-6">🚀</div>
                </div>
                <h2 className="text-3xl font-black text-white mb-4">No Approved Plugins Yet</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                  The registry is waiting for its first approved plugin. Create a tool in ZAL and publish it here!
                </p>
                
                <div className="bg-[#0d0d24]/60 backdrop-blur-xl border border-cyan-500/12 rounded-2xl p-8 mb-8">
                  <h3 className="text-white font-bold mb-4 text-left">Quick Start:</h3>
                  <div className="space-y-3 text-left text-sm text-slate-300">
                    <div className="flex gap-3">
                      <span className="text-cyan-400 font-bold">1.</span>
                      <span>Open ZAL and type <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">/plugins</code></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-400 font-bold">2.</span>
                      <span>Select "+ New tool" and describe what you want to create</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-400 font-bold">3.</span>
                      <span>AI will generate the plugin code for you</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-400 font-bold">4.</span>
                      <span>Export from <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">.zal/plugins.json</code> and upload here</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-xl text-left">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">⚡</div>
                      <div>
                        <p className="text-white font-semibold text-sm mb-1">Quick Export Tip</p>
                        <p className="text-slate-300 text-xs mb-2">In the CLI, select your tool and press <kbd className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 font-mono font-bold">E</kbd> to export instantly!</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                          <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">/plugins</code>
                          <span>→</span>
                          <span>Manage Tools</span>
                          <span>→ Select tool →</span>
                          <kbd className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-green-400 font-bold">E</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/publish"
                    className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/30 transition"
                  >
                    📤 Publish Your Plugin
                  </Link>
                  <a
                    href="https://github.com/ubercodex/zalcli#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 bg-white/5 border border-white/12 text-slate-200 font-semibold rounded-xl hover:bg-white/9 transition"
                  >
                    📖 Read Documentation
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 text-slate-500 text-sm">
              {filtered.length} {filtered.length === 1 ? 'plugin' : 'plugins'} found
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(plugin => (
                <Link
                  key={plugin.id}
                  to={`/plugins/${plugin.author}/${plugin.name}`}
                  className="p-6 bg-[#0d0d24]/60 backdrop-blur-xl border border-cyan-500/12 rounded-2xl hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                          {plugin.name}
                        </h3>
                        {plugin.versionCount && plugin.versionCount > 1 && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30 font-semibold">
                            {plugin.versionCount} versions
                          </span>
                        )}
                        {plugin.pendingVersions && plugin.pendingVersions > 0 && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30 font-semibold">
                            {plugin.pendingVersions} pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">by {plugin.author}</p>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-1 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {plugin.downloads.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-slate-400 mb-4 line-clamp-2 text-sm">{plugin.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {plugin.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full border border-cyan-500/20">
                        {tag}
                      </span>
                    ))}
                    {plugin.tags.length > 3 && (
                      <span className="px-2 py-1 text-slate-500 text-xs">
                        +{plugin.tags.length - 3}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
