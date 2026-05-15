import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Plugin {
  id: string;
  author: string;
  name: string;
  description: string;
  downloads: number;
  tags: string[];
}

export default function Browse() {
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
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              UBER CLI
            </div>
            <span className="text-gray-500">Plugin Registry</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-white">Browse Plugins</h1>
        
        <input
          type="text"
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-6 py-4 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
        />

        {loading ? (
          <div className="text-center py-32 text-gray-500">Loading plugins...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 text-gray-500">
            {search ? 'No plugins found matching your search' : 'No plugins available yet. Be the first to publish!'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filtered.map(plugin => (
              <Link
                key={plugin.id}
                to={`/plugins/${plugin.author}/${plugin.name}`}
                className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-purple-500 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition">
                      {plugin.name}
                    </h3>
                    <p className="text-sm text-gray-500">by {plugin.author}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    ↓ {plugin.downloads.toLocaleString()}
                  </div>
                </div>
                <p className="text-gray-400 mb-4 line-clamp-2">{plugin.description}</p>
                <div className="flex flex-wrap gap-2">
                  {plugin.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
