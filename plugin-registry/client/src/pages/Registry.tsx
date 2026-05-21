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
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-4 py-2 mb-4 bg-violet-500/8 text-violet-400 border border-violet-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            Plugin Registry
          </div>
          <h1 className="text-5xl font-black mb-4 text-white">
            Discover <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Plugins</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Browse community-built tools to extend your Uber CLI. Find plugins for APIs, automation, databases, and more.
          </p>
        </div>
        
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by name, author, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-6 py-4 bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition backdrop-blur-xl"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-32 text-slate-500">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
            <div>Loading plugins...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {search ? (
              <>
                <div className="text-7xl mb-6">🔍</div>
                <h2 className="text-2xl font-bold text-white mb-3">No plugins found</h2>
                <p className="text-slate-400 text-lg mb-8">
                  No plugins match "{search}"
                </p>
                <button
                  onClick={() => setSearch('')}
                  className="px-6 py-3 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/30 transition"
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
                  The registry is waiting for its first approved plugin. Create a tool in Uber CLI and publish it here!
                </p>
                
                <div className="bg-[#0d0d24]/60 backdrop-blur-xl border border-cyan-500/12 rounded-2xl p-8 mb-8">
                  <h3 className="text-white font-bold mb-4 text-left">How to publish a plugin:</h3>
                  <div className="space-y-3 text-left text-sm text-slate-300">
                    <div className="flex gap-3">
                      <span className="text-cyan-400">1.</span>
                      <span>Create a tool in Uber CLI using <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">/plugins</code></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-400">2.</span>
                      <span>Export it from <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">.ubercli/plugins.json</code></span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-400">3.</span>
                      <span>Upload the JSON file to the registry</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-cyan-400">4.</span>
                      <span>Wait for admin approval</span>
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
                    href="https://github.com/ubercodex/ubercli#readme"
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
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">
                        {plugin.name}
                      </h3>
                      <p className="text-sm text-slate-500">by {plugin.author}</p>
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
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
