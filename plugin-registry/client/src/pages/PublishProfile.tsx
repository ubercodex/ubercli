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
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);
  const [availablePlugins, setAvailablePlugins] = useState<Plugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
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
  }, [user, token, navigate]);

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
            pluginIds: selectedPlugins,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      navigate('/my-plugins');
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Create Profile</h1>
          <p className="text-gray-400">
            Create a curated collection of plugins for a specific use case
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profile Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              placeholder="e.g., webdev, data-science, devops"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Use lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={500}
              rows={4}
              placeholder="Describe what this profile is for and who should use it..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              {description.length}/500 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="web, development, frontend (comma-separated)"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Add up to 10 tags, separated by commas
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">
                Select Plugins * ({selectedPlugins.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-xs px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition"
                >
                  Select All Shown
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins by name, author, or description..."
              className="w-full px-4 py-2 mb-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
            />
            
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
              {availablePlugins.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
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
                      className="flex items-start gap-3 p-3 hover:bg-gray-800 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlugins.includes(plugin.id)}
                        onChange={() => togglePlugin(plugin.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-white">{plugin.name}</div>
                        <div className="text-sm text-gray-400">{plugin.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          by {plugin.author} • v{plugin.version}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
          <h3 className="font-semibold text-blue-400 mb-2">📝 Profile Guidelines</h3>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• Choose a clear, descriptive name</li>
            <li>• Select 5-10 related plugins that work well together</li>
            <li>• Write a helpful description explaining the use case</li>
            <li>• Add relevant tags for discoverability</li>
            <li>• Your profile will be reviewed before being published</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
