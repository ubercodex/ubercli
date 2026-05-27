import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Plugin {
  id: string;
  name: string;
  author: string;
  description: string;
  version: string;
}

export default function PublishProfile() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Fetch approved plugins
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/plugins?status=approved`)
      .then(res => res.json())
      .then(data => {
        setAvailablePlugins(data.plugins || []);
      })
      .catch(() => {
        setError('Failed to load plugins');
      });
  }, [user, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (selectedPlugins.length === 0) {
      setError('Please select at least one plugin');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            systemPrompt: systemPrompt.trim() || undefined,
            pluginIds: selectedPlugins,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      navigate('/my-profiles');
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const togglePlugin = (pluginId: string) => {
    setSelectedPlugins(prev =>
      prev.includes(pluginId)
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = availablePlugins
      .filter(plugin => 
        searchQuery === '' ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(p => p.id);
    setSelectedPlugins(prev => [...new Set([...prev, ...filteredIds])]);
  };

  const clearAll = () => {
    setSelectedPlugins([]);
  };

  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center animate-scale-in">
          <div className="mb-8 text-7xl animate-pulse-glow">🔒</div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight pb-2">
            Login Required
          </h1>
          <p className="text-slate-400 mb-8 text-lg">
            You need to sign in with GitHub to create a profile.
          </p>
          <button
            onClick={() => {
              const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
              const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
              window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
            }}
            className="relative group inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
              Sign in with GitHub
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12 text-center animate-fade-in-down">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-2">
            Create Profile
          </h1>
          <p className="text-xl text-slate-400">
            Create a curated collection of plugins for a specific use case
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 backdrop-blur-xl animate-scale-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in-up">
          {/* Profile Name */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Profile Name *
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl blur group-focus-within:blur-lg transition-all"></div>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setName(value);
                }}
                onBlur={(e) => {
                  const cleaned = e.target.value.replace(/--+/g, '-').replace(/^-+|-+$/g, '');
                  setName(cleaned);
                }}
                required
                maxLength={100}
                pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                placeholder="e.g., webdev, data-science, devops"
                className="relative w-full px-4 py-3 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Kebab-case only: lowercase, numbers, hyphens (e.g., my-awesome-profile)
            </p>
          </div>

          {/* Description */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Description *
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl blur group-focus-within:blur-lg transition-all"></div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={500}
                rows={4}
                placeholder="Describe what this profile is for and who should use it..."
                className="relative w-full px-4 py-3 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {description.length}/500 characters
            </p>
          </div>

          {/* Tags */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Tags
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl blur group-focus-within:blur-lg transition-all"></div>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="web, development, frontend (comma-separated)"
                className="relative w-full px-4 py-3 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Add up to 10 tags, separated by commas
            </p>
          </div>

          {/* System Prompt */}
          <div className="relative group">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              System Prompt (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-xl blur group-focus-within:blur-lg transition-all"></div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                maxLength={20000}
                rows={6}
                placeholder="Add custom instructions for the AI when using this profile...&#10;&#10;Example: Focus on Windows system administration tasks. Prioritize PowerShell solutions. Always explain security implications."
                className="relative w-full px-4 py-3 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm resize-none"
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {systemPrompt.length}/20000 characters • This extends the base AI behavior with profile-specific instructions
            </p>
          </div>

          {/* Plugin Selection */}
          <div className="relative group">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-300">
                Select Plugins * ({selectedPlugins.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-xs px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
                >
                  Select All Shown
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plugins by name, author, or description..."
                className="w-full px-4 py-2.5 bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4 max-h-96 overflow-y-auto">
              {availablePlugins.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  No approved plugins available
                </p>
              ) : (
                <div className="space-y-2">
                  {availablePlugins
                    .filter(plugin => 
                      searchQuery === '' ||
                      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      plugin.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(plugin => (
                    <label
                      key={plugin.id}
                      className="flex items-start gap-3 p-3 hover:bg-purple-500/10 rounded-lg cursor-pointer transition-all group/item"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlugins.includes(plugin.id)}
                        onChange={() => togglePlugin(plugin.id)}
                        className="mt-1 w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500/50"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white group-hover/item:text-purple-300 transition-colors">{plugin.name}</div>
                        <div className="text-sm text-slate-400 mt-0.5">{plugin.description}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          by {plugin.author} • v{plugin.version}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : 'Create Profile'}
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Guidelines */}
        <div className="mt-12 p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl backdrop-blur-xl animate-fade-in-up delay-200">
          <h3 className="font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <span>📝</span>
            <span>Profile Guidelines</span>
          </h3>
          <ul className="text-sm text-cyan-200/80 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Choose a clear, descriptive name</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Select 5-10 related plugins that work well together</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Write a helpful description explaining the use case</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Add relevant tags for discoverability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Your profile will be reviewed before being published</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
