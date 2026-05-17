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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pluginData, setPluginData] = useState<PluginFile | null>(null);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const validatePlugin = (data: any): data is PluginFile => {
    setValidationError(null);

    if (!data || typeof data !== 'object') {
      setValidationError('Invalid JSON format');
      return false;
    }

    if (!data.name || typeof data.name !== 'string') {
      setValidationError('Missing or invalid "name" field (must be a string)');
      return false;
    }

    if (!/^[a-z0-9-]+$/i.test(data.name)) {
      setValidationError('Plugin name can only contain letters, numbers, and hyphens');
      return false;
    }

    if (!data.description || typeof data.description !== 'string') {
      setValidationError('Missing or invalid "description" field (must be a string)');
      return false;
    }

    if (!data.code || typeof data.code !== 'string') {
      setValidationError('Missing or invalid "code" field (must be a string)');
      return false;
    }

    if (!Array.isArray(data.params)) {
      setValidationError('Missing or invalid "params" field (must be an array)');
      return false;
    }

    for (let i = 0; i < data.params.length; i++) {
      const param = data.params[i];
      if (!param.name || typeof param.name !== 'string') {
        setValidationError(`Parameter ${i}: missing or invalid "name"`);
        return false;
      }
      if (!['string', 'number', 'boolean'].includes(param.type)) {
        setValidationError(`Parameter ${i}: type must be "string", "number", or "boolean"`);
        return false;
      }
      if (!param.description || typeof param.description !== 'string') {
        setValidationError(`Parameter ${i}: missing or invalid "description"`);
        return false;
      }
      if (typeof param.required !== 'boolean') {
        setValidationError(`Parameter ${i}: "required" must be true or false`);
        return false;
      }
    }

    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (validatePlugin(json)) {
          setPluginData(json);
        }
      } catch (err) {
        setValidationError('Invalid JSON file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pluginData) return;

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
          name: pluginData.name,
          description: pluginData.description,
          code: pluginData.code,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          parameters: pluginData.params,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish plugin');
      }

      const data = await response.json();
      alert('Plugin submitted for review! An admin will approve it soon.');
      navigate(`/plugins/${data.author}/${data.name}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const downloadExample = () => {
    const example: PluginFile = {
      name: "examplePlugin",
      description: "An example plugin that demonstrates the format",
      params: [
        {
          name: "message",
          type: "string",
          description: "A message to display",
          required: true
        }
      ],
      code: "// Your plugin code here\n// Use Node.js built-ins only\nreturn { result: `Hello, ${message}!` };"
    };

    const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example-plugin.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Publish Plugin</h1>
          <p className="text-slate-400">Share your custom tool with the Uber CLI community</p>
        </div>

        {/* How to Create a Plugin */}
        <div className="mb-8 p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-4">📝 How to Create a Plugin</h2>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">1.</span>
              <div>
                <strong>In Uber CLI:</strong> Run <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">uber</code> and type <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">/plugins</code>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">2.</span>
              <div>
                <strong>Create Tool:</strong> Select "+ New tool" and describe what you want (e.g., "Fetch weather from wttr.in")
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">3.</span>
              <div>
                <strong>AI Generates:</strong> The AI will generate the plugin code for you
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">4.</span>
              <div>
                <strong>Export:</strong> Find your plugin in <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">.ubercli/plugins.json</code> in the tools array
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">5.</span>
              <div>
                <strong>Format:</strong> Extract the tool object and save as a JSON file with this structure:
                <pre className="mt-2 p-3 bg-black/30 rounded text-xs overflow-x-auto">
{`{
  "name": "yourPluginName",
  "description": "What it does",
  "params": [
    {
      "name": "paramName",
      "type": "string",
      "description": "What this param is for",
      "required": true
    }
  ],
  "code": "// Your JavaScript code here"
}`}
                </pre>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">6.</span>
              <div>
                <strong>Upload:</strong> Upload the JSON file below to publish it!
              </div>
            </div>
          </div>
          <button
            onClick={downloadExample}
            className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm hover:bg-cyan-500/30 transition"
          >
            ⬇ Download Example Plugin
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {validationError && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
            <strong>Validation Error:</strong> {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-white font-semibold mb-2">Plugin JSON File *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-6 py-12 bg-[#0d0d24]/60 border-2 border-dashed border-cyan-500/30 rounded-xl hover:border-cyan-500/50 hover:bg-[#0d0d24]/80 transition text-center"
            >
              <div className="text-6xl mb-4">📁</div>
              <div className="text-white font-semibold mb-2">
                {pluginData ? '✓ Plugin Loaded' : 'Click to Upload Plugin JSON'}
              </div>
              <div className="text-slate-500 text-sm">
                {pluginData ? pluginData.name : 'Select a .json file containing your plugin'}
              </div>
            </button>
          </div>

          {/* Preview */}
          {pluginData && (
            <div className="p-6 bg-[#0d0d24]/60 border border-cyan-500/12 rounded-xl">
              <h3 className="text-white font-bold mb-4">Plugin Preview</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span>
                  <span className="text-white ml-2 font-mono">{pluginData.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Description:</span>
                  <span className="text-white ml-2">{pluginData.description}</span>
                </div>
                <div>
                  <span className="text-slate-500">Parameters:</span>
                  <span className="text-white ml-2">{pluginData.params.length}</span>
                </div>
                {pluginData.params.length > 0 && (
                  <div className="ml-4 space-y-1">
                    {pluginData.params.map((param, i) => (
                      <div key={i} className="text-xs text-slate-400">
                        • {param.name} ({param.type}) - {param.required ? 'required' : 'optional'}
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Code:</span>
                  <pre className="mt-2 p-3 bg-[#050510] border border-cyan-500/20 rounded-lg text-white text-xs overflow-x-auto max-h-48">
                    {pluginData.code}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {pluginData && (
            <div>
              <label className="block text-white font-semibold mb-2">Tags (Optional)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="weather, api, automation (comma-separated)"
                className="w-full px-4 py-3 bg-[#0d0d24]/60 border border-cyan-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          )}

          {/* Submit */}
          {pluginData && (
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPluginData(null);
                  setTags('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/12 text-slate-200 hover:bg-white/9 transition"
              >
                Clear
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
