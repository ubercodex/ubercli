import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  profileCount?: number;
  tags: string[];
  createdAt: string;
  versionCount?: number;
  pendingVersions?: number;
}

export default function MyPlugins() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
      return;
    }

    fetchMyPlugins();
  }, [user, token, navigate]);

  const fetchMyPlugins = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/plugins?author=${user?.username}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch plugins');

      const data = await response.json();
      setPlugins(data.plugins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  const handleDelete = async (pluginName: string, status: string, profileCount: number) => {
    // Only check profile usage for approved plugins
    if (status === 'approved' && profileCount > 0) {
      alert(`Cannot delete this approved plugin. It is used in ${profileCount} profile${profileCount > 1 ? 's' : ''}. Remove it from all profiles before deleting.`);
      return;
    }

    const statusText = status === 'pending' ? 'pending' : status === 'rejected' ? 'rejected' : 'approved';
    if (!confirm(`Are you sure you want to delete "${pluginName}" (${statusText})? This action cannot be undone.`)) {
      return;
    }

    setDeleting(pluginName);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/plugins/${user?.username}/${pluginName}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete plugin');
      }

      setPlugins(plugins.filter(p => p.name !== pluginName));
      alert('Plugin deleted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to delete plugin');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 animate-fade-in-down">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-2">My Plugins</h1>
          <p className="text-slate-400 text-xl">Manage your published plugins</p>
        </div>

        {plugins.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 rounded-3xl blur-2xl"></div>
                <div className="relative text-8xl mb-6">📦</div>
              </div>
              <h2 className="text-3xl font-black text-white mb-4">No Published Plugins Yet</h2>
              <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                You haven't published any plugins yet. Create a tool in ZAL, export it with the <kbd className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-400 font-mono">E</kbd> key, and upload it!
              </p>
              
              <div className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 mb-8">
                <h3 className="text-white font-bold mb-4 text-left text-xl">Quick Start:</h3>
                <div className="space-y-3 text-left text-sm text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-purple-400 font-bold">1.</span>
                    <span>Open ZAL and type <code className="px-2 py-1 bg-black/30 rounded text-purple-400">/plugins</code></span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-purple-400 font-bold">2.</span>
                    <span>Select "+ New tool" and describe what you want to create</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-purple-400 font-bold">3.</span>
                    <span>AI will generate the plugin code for you</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-purple-400 font-bold">4.</span>
                    <span>Export from <code className="px-2 py-1 bg-black/30 rounded text-purple-400">.zal/plugins.json</code> and upload here</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/publish"
                  className="relative group inline-block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
                    📤 Publish Your First Plugin
                  </div>
                </Link>
                <a
                  href="https://github.com/ubercodex/zalcli#readme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-slate-700/50 border border-slate-600/50 text-slate-200 font-semibold rounded-xl hover:bg-slate-700 transition-all"
                >
                  📖 Read Guide
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between animate-fade-in-up">
              <div className="text-slate-500 text-sm">
                {plugins.length} {plugins.length === 1 ? 'plugin' : 'plugins'}
              </div>
              <Link
                to="/publish"
                className="px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl text-sm hover:bg-purple-500/30 transition-all font-medium"
              >
                + New Plugin
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plugins.map(plugin => (
                <div
                  key={plugin.id}
                  className="p-6 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl font-bold text-white">
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
                      <p className="text-sm text-slate-500">v{plugin.version}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1 ${getStatusColor(plugin.status)}`}>
                      <span>{getStatusIcon(plugin.status)}</span>
                      <span className="capitalize">{plugin.status}</span>
                    </div>
                  </div>

                  <p className="text-slate-400 mb-4 line-clamp-2 text-sm">{plugin.description}</p>

                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {plugin.downloads.toLocaleString()} views
                    </div>
                    <div className="text-xs">
                      📂 {plugin.profileCount || 0} profiles
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {plugin.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-lg">
                        {tag}
                      </span>
                    ))}
                    {plugin.tags.length > 3 && (
                      <span className="px-2 py-1 text-slate-500 text-xs">
                        +{plugin.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-purple-500/20">
                    <Link
                      to={`/plugins/${user?.username}/${plugin.name}`}
                      className="flex-1 text-center px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all text-sm font-semibold"
                    >
                      View
                    </Link>
                    <Link
                      to={`/edit-plugin/${user?.username}/${plugin.name}`}
                      className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl hover:bg-cyan-500/30 transition-all text-sm font-semibold"
                    >
                      ✏️
                    </Link>
                    <button
                      onClick={() => handleDelete(plugin.name, plugin.status, plugin.profileCount || 0)}
                      disabled={deleting === plugin.name}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === plugin.name ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
