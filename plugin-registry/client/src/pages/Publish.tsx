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

    if (!/^[a-z0-9-]+$/.test(data.name)) {
      setValidationError('Plugin name must be lowercase letters, numbers, and hyphens only (e.g., "example-plugin" not "examplePlugin")');
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

        {/* Quick Export Tip */}
        <div className="mb-6 p-5 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border-2 border-green-500/40 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚡</div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Quick Export from CLI</h3>
              <p className="text-slate-300 text-sm mb-3">
                Already created a plugin in Uber CLI? Export it instantly!
              </p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="text-slate-400">In CLI:</span>
                <code className="px-3 py-1.5 bg-black/40 rounded text-cyan-400 font-mono">/plugins</code>
                <span className="text-slate-400">→</span>
                <code className="px-3 py-1.5 bg-black/40 rounded text-cyan-400 font-mono">Manage Tools</code>
                <span className="text-slate-400">→ Select your tool →</span>
                <kbd className="px-3 py-1.5 bg-gradient-to-br from-green-500/30 to-green-600/30 border border-green-500/50 rounded text-green-300 font-bold shadow-lg">E</kbd>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                💾 The JSON file will be saved to your workspace root. Upload it below!
              </p>
            </div>
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!pluginData ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5 rounded-2xl blur-xl"></div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full px-8 py-16 bg-[#0d0d24]/80 backdrop-blur-xl border-2 border-dashed border-cyan-500/30 rounded-2xl hover:border-cyan-500/60 hover:bg-[#0d0d24]/90 transition-all text-center group"
                >
                  <div className="mb-6 group-hover:scale-110 transition-transform">
                    <svg className="w-20 h-20 mx-auto text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="text-white font-bold text-2xl mb-3">Upload Your Plugin</div>
                  <div className="text-slate-400 text-base mb-6 max-w-md mx-auto">
                    Click here or drag and drop your plugin JSON file to get started
                  </div>
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-semibold">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                  </div>
                  <div className="mt-6 text-slate-500 text-sm">
                    Supports: .json files only
                  </div>
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-cyan-500/5 rounded-2xl blur-xl"></div>
                <div className="relative p-6 bg-[#0d0d24]/80 backdrop-blur-xl border-2 border-green-500/30 rounded-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-green-400 font-bold text-lg">Plugin Loaded Successfully</div>
                        <div className="text-slate-400 text-sm">Ready to publish</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPluginData(null);
                        setTags('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="text-white font-mono text-lg">{pluginData.name}</div>
                </div>
              </div>
            )}
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
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting for Review...
                </span>
              ) : (
                'Submit for Review'
              )}
            </button>
          )}
        </form>

        {/* Detailed Instructions */}
        <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-2xl">
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
                <strong>Manage Tools:</strong> Select "Manage Tools" from the plugins menu
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">3.</span>
              <div>
                <strong>Create Tool:</strong> Navigate to the bottom and select "+ New tool", then describe what you want (e.g., "I want to know the price of gold")
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">4.</span>
              <div>
                <strong>AI Generates:</strong> The AI will generate the plugin code for you
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">5.</span>
              <div>
                <strong>Export:</strong> Navigate back to your tool in the list and press <code className="px-2 py-1 bg-black/30 rounded text-cyan-400">E</code> to export it as a JSON file
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-cyan-400 font-bold">6.</span>
              <div>
                <strong>Verify Format:</strong> The exported JSON file should have this structure:
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
              <span className="text-cyan-400 font-bold">7.</span>
              <div>
                <strong>Upload:</strong> Upload the JSON file above to publish it!
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
      </div>
    </div>
  );
}
