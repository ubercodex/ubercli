import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

interface Plugin {
  id: string;
  author: string;
  name: string;
  description: string;
  version: string;
}

interface Profile {
  id: string;
  author: string;
  name: string;
  description: string;
  tags: string[];
  downloads: number;
  plugins: Plugin[];
  created_at: string;
  updated_at: string;
}

export default function ProfileDetail() {
  const { author, name } = useParams<{ author: string; name: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profiles/${author}/${name}`)
      .then(res => res.json())
      .then(data => {
        const profile = {
          ...data,
          tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : data.tags,
        };
        setProfile(profile);
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Profile not found</div>
          <Link to="/profiles" className="text-purple-400 hover:text-purple-300">
            ← Back to profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-500 hover:text-white mb-6 inline-flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">{profile.name}</h1>
          <p className="text-xl text-gray-400">by {profile.author}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">Plugins</div>
            <div className="text-lg font-semibold text-white">{profile.plugins.length}</div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">Views</div>
            <div className="text-lg font-semibold text-white">{profile.downloads.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <div className="text-sm text-gray-500">Updated</div>
            <div className="text-lg font-semibold text-white">
              {new Date(profile.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
          <p className="text-gray-300">{profile.description}</p>
        </div>

        {profile.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {profile.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Installation</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 mb-2">Install this profile:</p>
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm">
                <span className="text-purple-400">zal /profiles install {author}-{profile.name.toLowerCase().replace(/\s+/g, '-')}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-400 mb-2">Install and set as default:</p>
              <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm">
                <span className="text-purple-400">zal /profiles install-default {author}-{profile.name.toLowerCase().replace(/\s+/g, '-')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Included Plugins ({profile.plugins.length})</h2>
          <div className="space-y-3">
            {profile.plugins.map((plugin, index) => (
              <Link
                key={plugin.id}
                to={`/plugins/${plugin.author}/${plugin.name}`}
                className="block p-4 bg-gray-950 border border-gray-800 rounded-lg hover:border-purple-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-500 text-sm">#{index + 1}</span>
                      <h3 className="font-semibold text-white">{plugin.name}</h3>
                      <span className="text-xs text-gray-500">v{plugin.version}</span>
                    </div>
                    <p className="text-sm text-gray-400">{plugin.description}</p>
                  </div>
                  <span className="text-purple-400 text-sm ml-4">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
