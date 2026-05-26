import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Plugin {
  id: string;
  author: string;
  name: string;
  version: string;
  description: string;
  code: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  createdAt: string;
}

interface Stats {
  totalPlugins: number;
  pendingPlugins: number;
  approvedPlugins: number;
  rejectedPlugins: number;
  totalDownloads: number;
  totalUsers: number;
  totalProfiles?: number;
  pendingProfiles?: number;
  approvedProfiles?: number;
  profileDownloads?: number;
}

type Tab = 'pending' | 'approved' | 'rejected' | 'all' | 'stats';

export default function AdminPanel() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    fetchData();
  }, [token, navigate, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      
      // Create abort controller with 30 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      if (activeTab === 'stats') {
        const [pluginStatsRes, profileStatsRes] = await Promise.all([
          fetch(`${apiUrl}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal,
          }),
          fetch(`${apiUrl}/admin/profile-stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
            signal: controller.signal,
          }),
        ]);
        clearTimeout(timeoutId);
        
        if (pluginStatsRes.ok && profileStatsRes.ok) {
          const pluginData = await pluginStatsRes.json();
          const profileData = await profileStatsRes.json();
          setStats({
            ...pluginData,
            totalProfiles: profileData.total || 0,
            pendingProfiles: profileData.pending || 0,
            approvedProfiles: profileData.approved || 0,
            profileDownloads: profileData.total_downloads || 0,
          });
        }
      } else {
        const endpoint = activeTab === 'all' 
          ? `${apiUrl}/admin/plugins`
          : `${apiUrl}/admin/plugins?status=${activeTab}`;
        
        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setPlugins(data.plugins || []);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.error('Request timeout - server took too long to respond');
        alert('⚠️ Request timeout. The server is taking too long to respond. Please try again.');
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this plugin?')) return;
    await updatePluginStatus(id, 'approve');
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this plugin?')) return;
    await updatePluginStatus(id, 'reject');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Permanently delete this plugin? This cannot be undone!')) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/admin/plugins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete plugin');

      alert('✅ Plugin deleted!');
      setSelectedPlugin(null);
      fetchData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const updatePluginStatus = async (id: string, action: 'approve' | 'reject') => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/admin/plugins/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`Failed to ${action} plugin`);

      alert(`✅ Plugin ${action}d!`);
      setSelectedPlugin(null);
      fetchData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'approved', label: 'Approved', icon: '✅' },
    { id: 'rejected', label: 'Rejected', icon: '❌' },
    { id: 'all', label: 'All Plugins', icon: '📦' },
    { id: 'stats', label: 'Statistics', icon: '📊' },
  ];

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">⚡ Admin Panel</h1>
            <p className="text-slate-400">Manage plugins, users, and system settings</p>
          </div>
          <Link
            to="/"
            className="px-4 py-2 bg-white/5 border border-white/12 text-slate-200 rounded-lg hover:bg-white/9 transition"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/9'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'stats' ? (
          /* Statistics View */
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-xl p-6">
                <div className="text-3xl mb-2">📦</div>
                <div className="text-4xl font-bold text-white mb-1">{stats?.totalPlugins || 0}</div>
                <div className="text-cyan-400 font-semibold">Total Plugins</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-6">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-4xl font-bold text-white mb-1">{stats?.totalProfiles || 0}</div>
                <div className="text-purple-400 font-semibold">Total Profiles</div>
              </div>
              <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-xl p-6">
                <div className="text-3xl mb-2">👤</div>
                <div className="text-4xl font-bold text-white mb-1">{stats?.totalUsers || 0}</div>
                <div className="text-violet-400 font-semibold">Total Users</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-6">
                <div className="text-3xl mb-2">⬇️</div>
                <div className="text-4xl font-bold text-white mb-1">{(stats?.totalDownloads || 0) + (stats?.profileDownloads || 0)}</div>
                <div className="text-green-400 font-semibold">Total Downloads</div>
              </div>
            </div>

            {/* Plugin Stats */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">🔌 Plugin Statistics</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#0d0d24]/60 border border-yellow-500/20 rounded-xl p-6">
                  <div className="text-2xl mb-2">⏳</div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{stats?.pendingPlugins || 0}</div>
                  <div className="text-slate-400">Pending Review</div>
                </div>
                <div className="bg-[#0d0d24]/60 border border-green-500/20 rounded-xl p-6">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="text-3xl font-bold text-green-400 mb-1">{stats?.approvedPlugins || 0}</div>
                  <div className="text-slate-400">Approved</div>
                </div>
                <div className="bg-[#0d0d24]/60 border border-red-500/20 rounded-xl p-6">
                  <div className="text-2xl mb-2">❌</div>
                  <div className="text-3xl font-bold text-red-400 mb-1">{stats?.rejectedPlugins || 0}</div>
                  <div className="text-slate-400">Rejected</div>
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">📋 Profile Statistics</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#0d0d24]/60 border border-yellow-500/20 rounded-xl p-6">
                  <div className="text-2xl mb-2">⏳</div>
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{stats?.pendingProfiles || 0}</div>
                  <div className="text-slate-400">Pending Review</div>
                </div>
                <div className="bg-[#0d0d24]/60 border border-green-500/20 rounded-xl p-6">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="text-3xl font-bold text-green-400 mb-1">{stats?.approvedProfiles || 0}</div>
                  <div className="text-slate-400">Approved</div>
                </div>
                <div className="bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl p-6">
                  <div className="text-2xl mb-2">⬇️</div>
                  <div className="text-3xl font-bold text-cyan-400 mb-1">{stats?.profileDownloads || 0}</div>
                  <div className="text-slate-400">Profile Downloads</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Plugins View */
          <>
            {plugins.length === 0 ? (
              <div className="text-center py-32">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-slate-400 text-lg">No plugins found</div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Plugin List */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {activeTab === 'all' ? 'All' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Plugins ({plugins.length})
                  </h2>
                  {plugins.map(plugin => (
                    <button
                      key={plugin.id}
                      onClick={() => setSelectedPlugin(plugin)}
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        selectedPlugin?.id === plugin.id
                          ? 'bg-cyan-500/20 border-cyan-500/50'
                          : 'bg-[#0d0d24]/60 border-cyan-500/12 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-bold">{plugin.name}</h3>
                          <p className="text-sm text-slate-500">by {plugin.author}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(plugin.status)}`}>
                            {plugin.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(plugin.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm line-clamp-2">{plugin.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-wrap gap-2">
                          {plugin.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">👁️ {plugin.downloads}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Plugin Detail */}
                {selectedPlugin ? (
                  <div className="bg-[#0d0d24]/60 border border-cyan-500/12 rounded-xl p-6 sticky top-24 h-fit">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">{selectedPlugin.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedPlugin.status)}`}>
                        {selectedPlugin.status}
                      </span>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-slate-500 text-sm">Author</label>
                        <p className="text-white">{selectedPlugin.author}</p>
                      </div>
                      <div>
                        <label className="text-slate-500 text-sm">Description</label>
                        <p className="text-white">{selectedPlugin.description}</p>
                      </div>
                      <div>
                        <label className="text-slate-500 text-sm">Stats</label>
                        <div className="flex gap-4 mt-1">
                          <span className="text-white">👁️ {selectedPlugin.downloads} views</span>
                          <span className="text-white">v{selectedPlugin.version}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 text-sm">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedPlugin.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-slate-500 text-sm">Code</label>
                        <div className="mt-2 rounded-lg overflow-hidden border border-cyan-500/20 max-h-96 overflow-y-auto">
                          <SyntaxHighlighter
                            language="javascript"
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              fontSize: '0.75rem',
                              background: '#050510',
                            }}
                            showLineNumbers
                          >
                            {selectedPlugin.code}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {selectedPlugin.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(selectedPlugin.id)}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(selectedPlugin.id)}
                            className="flex-1 px-4 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                      {selectedPlugin.status === 'rejected' && (
                        <button
                          onClick={() => handleApprove(selectedPlugin.id)}
                          className="w-full px-4 py-3 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 transition"
                        >
                          ✓ Approve
                        </button>
                      )}
                      {selectedPlugin.status === 'approved' && (
                        <button
                          onClick={() => handleReject(selectedPlugin.id)}
                          className="w-full px-4 py-3 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition"
                        >
                          ✗ Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(selectedPlugin.id)}
                        className="w-full px-4 py-3 rounded-xl font-semibold bg-red-900/50 text-red-400 border border-red-500/30 hover:bg-red-900/70 transition"
                      >
                        🗑️ Delete Permanently
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0d0d24]/60 border border-cyan-500/12 rounded-xl p-6 flex items-center justify-center h-64">
                    <p className="text-slate-500">Select a plugin to review</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
