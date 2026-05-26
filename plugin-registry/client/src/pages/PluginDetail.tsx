import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Plugin {
  id: string;
  author: string;
  name: string;
  version: string;
  description: string;
  code: string;
  parameters: Array<{ name: string; type: string; description: string; required: boolean }>;
  tags: string[];
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

export default function PluginDetail() {
  const { author, name } = useParams<{ author: string; name: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/plugins/${author}/${name}`)
      .then(res => res.json())
      .then(data => {
        setPlugin(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [author, name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Plugin not found</div>
          <Link to="/browse" className="text-purple-400 hover:text-purple-300">
            ← Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ZAL
            </div>
            <span className="text-gray-500">Plugin Registry</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-500 hover:text-white mb-6 inline-flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">{plugin.name}</h1>
          <p className="text-xl text-gray-400">by {plugin.author}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">Version</div>
            <div className="text-lg font-semibold text-white">{plugin.version}</div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">Views</div>
            <div className="text-lg font-semibold text-white">{plugin.downloads.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">Updated</div>
            <div className="text-lg font-semibold text-white">
              {new Date(plugin.updatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
          <p className="text-gray-300">{plugin.description}</p>
        </div>

        {plugin.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {plugin.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {plugin.parameters.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Parameters</h2>
            <div className="space-y-4">
              {plugin.parameters.map(param => (
                <div key={param.name} className="border-l-2 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-purple-400">{param.name}</span>
                    <span className="text-xs text-gray-500">{param.type}</span>
                    {param.required && (
                      <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">required</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
          <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm">
            <span className="text-purple-400">zal /plugins install {author}-{plugin.name}</span>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Source Code</h2>
          <div className="rounded-lg overflow-hidden">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                fontSize: '0.875rem',
                background: '#0a0a0f',
              }}
              showLineNumbers
            >
              {plugin.code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    </div>
  );
}
