import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

interface PluginFile {
  name: string;
  description: string;
  params: PluginParameter[];
  code: string;
}

export default function Publish() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [tags, setTags] = useState('');
  const [parameters, setParameters] = useState<PluginParameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !token) {
    return (
      <div className="min-h-screen py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">Sign in Required</h1>
          <p className="text-slate-400 mb-6">You need to sign in with GitHub to publish plugins</p>
          <a
            href={`https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/callback')}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Sign in with GitHub
          </a>
        </div>
      </div>
    );
  }

  const addParameter = () => {
    setParameters([...parameters, { name: '', type: 'string', description: '', required: false }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: keyof PluginParameter, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/plugins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          code,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          parameters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish plugin');
      }

      const data = await response.json();
      navigate(`/plugins/${data.author}/${data.name}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Publish Plugin</h1>
          <p className="text-slate-400">Share your tool with the Uber CLI community</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plugin Name */}
          <div>
            <label className="block text-white font-semibold mb-2">Plugin Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-awesome-plugin"
              pattern="[a-z0-9-]+"
              required
              className="w-full px-4 py-3 bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
            <p className="text-slate-500 text-sm mt-1">Lowercase letters, numbers, and hyphens only</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your plugin do?"
              required
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-none"
            />
            <p className="text-slate-500 text-sm mt-1">{description.length}/500 characters</p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-white font-semibold mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="weather, api, automation (comma-separated)"
              className="w-full px-4 py-3 bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          {/* Parameters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-white font-semibold">Parameters</label>
              <button
                type="button"
                onClick={addParameter}
                className="px-3 py-1 text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition"
              >
                + Add Parameter
              </button>
            </div>
            
            {parameters.length === 0 ? (
              <p className="text-slate-500 text-sm">No parameters defined</p>
            ) : (
              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <div key={index} className="p-4 bg-[#0d0d24]/60 border border-cyan-500/12 rounded-xl">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        placeholder="Parameter name"
                        className="px-3 py-2 bg-[#050510] border border-cyan-500/20 rounded-lg text-white text-sm"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter(index, 'type', e.target.value)}
                        className="px-3 py-2 bg-[#050510] border border-cyan-500/20 rounded-lg text-white text-sm"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={param.description}
                      onChange={(e) => updateParameter(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 bg-[#050510] border border-cyan-500/20 rounded-lg text-white text-sm mb-3"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm text-slate-400">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => updateParameter(index, 'required', e.target.checked)}
                          className="rounded"
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => removeParameter(index)}
                        className="text-red-400 text-sm hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Code */}
          <div>
            <label className="block text-white font-semibold mb-2">Plugin Code *</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="export default async function myPlugin(params) { ... }"
              required
              rows={12}
              className="w-full px-4 py-3 bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-none font-mono text-sm"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Publishing...' : 'Publish Plugin'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/registry')}
              className="px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/12 text-slate-200 hover:bg-white/9 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
