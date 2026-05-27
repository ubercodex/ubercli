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
  model?: string;
  downloads: number;
  profileCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function PluginDetail() {
  const { author, name } = useParams<{ author: string; name: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [availableVersions, setAvailableVersions] = useState<Array<{version: string; status: string}>>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    
    // Fetch plugin with latest version
    fetch(`${apiUrl}/plugins/${author}/${name}`)
      .then(res => res.json())
      .then(data => {
        setPlugin(data);
        setSelectedVersion(data.version);
        setLoading(false);
        
        // Fetch all versions for dropdown
        fetch(`${apiUrl}/plugins/${author}/${name}/versions`)
          .then(res => res.json())
          .then(versions => setAvailableVersions(versions))
          .catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [author, name]);
  
  // Fetch specific version when dropdown changes
  useEffect(() => {
    if (selectedVersion && plugin && selectedVersion !== plugin.version) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      fetch(`${apiUrl}/plugins/${author}/${name}?version=${selectedVersion}`)
        .then(res => res.json())
        .then(data => setPlugin(data))
        .catch(() => {});
    }
  }, [selectedVersion, author, name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="text-6xl mb-6 animate-pulse-glow">🔍</div>
          <div className="text-slate-400 mb-6 text-lg">Plugin not found</div>
          <Link 
            to="/registry" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="group inline-flex items-center gap-2 text-slate-400 hover:text-purple-400 mb-8 transition-colors animate-fade-in-down"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-12 animate-fade-in-up">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-2">
            {plugin.name}
          </h1>
          <p className="text-2xl text-slate-400 mb-4">by {plugin.author}</p>
          
          {availableVersions.length > 1 && (
            <div className="inline-block">
              <label className="text-sm text-slate-500 mb-2 block">Select Version:</label>
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-4 py-2 bg-[#0a0a0f] border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer hover:border-purple-500/50 transition-colors"
              >
                {availableVersions.map((v: any) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} {v.status === 'pending' && '(⏳ pending)'} {v.status === 'rejected' && '(❌ rejected)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12 animate-fade-in-up delay-100">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
              <div className="text-sm text-slate-500 mb-2">Version</div>
              <div className="text-2xl font-bold text-white">{plugin.version}</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
              <div className="text-sm text-slate-500 mb-2">Views</div>
              <div className="text-2xl font-bold text-white">{plugin.downloads.toLocaleString()}</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
              <div className="text-sm text-slate-500 mb-2">Used in Profiles</div>
              <div className="text-2xl font-bold text-white">{plugin.profileCount || 0}</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative p-6 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl">
              <div className="text-sm text-slate-500 mb-2">Updated</div>
              <div className="text-2xl font-bold text-white">
                {new Date(plugin.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Model Badge (if available) */}
        {plugin.model && (
          <div className="mb-8 animate-fade-in-up delay-150">
            <div className="relative group inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative px-6 py-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="text-xs text-slate-500">Generated with</div>
                    <div className="text-lg font-bold text-cyan-300">{plugin.model}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 mb-8 animate-fade-in-up delay-200">
          <h2 className="text-3xl font-bold text-white mb-4">Description</h2>
          <p className="text-slate-300 text-lg leading-relaxed">{plugin.description}</p>
        </div>

        {/* Tags */}
        {plugin.tags.length > 0 && (
          <div className="mb-8 animate-fade-in-up delay-300">
            <h3 className="text-xl font-semibold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-3">
              {plugin.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-xl text-sm font-medium hover:bg-purple-500/20 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Parameters */}
        {plugin.parameters.length > 0 && (
          <div className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 mb-8 animate-fade-in-up delay-400">
            <h2 className="text-3xl font-bold text-white mb-6">Parameters</h2>
            <div className="space-y-6">
              {plugin.parameters.map(param => (
                <div key={param.name} className="relative pl-6 border-l-2 border-purple-500/50 hover:border-purple-500 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-lg text-purple-400 font-semibold">{param.name}</span>
                    <span className="text-sm px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded">{param.type}</span>
                    {param.required && (
                      <span className="text-xs bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full font-medium">required</span>
                    )}
                  </div>
                  <p className="text-slate-400">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Installation */}
        <div className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 mb-8 animate-fade-in-up delay-500">
          <h2 className="text-3xl font-bold text-white mb-6">Installation</h2>
          
          <div className="mb-4">
            <p className="text-slate-400 text-sm mb-2">Install latest version (v{plugin.version}):</p>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-[#0a0a0f] rounded-xl p-6 font-mono text-base border border-purple-500/30">
                <span className="text-purple-400">zal /plugins install {author}-{plugin.name}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-400 text-sm mb-2">Or install specific version:</p>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-violet-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-[#0a0a0f] rounded-xl p-6 font-mono text-base border border-cyan-500/30">
                <span className="text-cyan-400">zal /plugins install {author}-{plugin.name}@{plugin.version}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Source Code */}
        <div className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 animate-fade-in-up delay-500">
          <h2 className="text-3xl font-bold text-white mb-6">Source Code</h2>
          <div className="rounded-xl overflow-hidden border border-purple-500/30">
            <SyntaxHighlighter
              language="javascript"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                padding: '2rem',
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
