import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Profile {
  id: string;
  author: string;
  name: string;
  description: string;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  plugin_count: number;
  created_at: string;
}

export default function MyProfiles() {
  const { user, token } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profiles/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setProfiles(data.profiles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, token]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400">Please sign in to view your profiles</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      approved: 'bg-green-500/20 text-green-400 border-green-500/50',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/50',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Profiles</h1>
            <p className="text-gray-400">Manage your plugin profile collections</p>
          </div>
          <Link
            to="/publish-profile"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            + Create Profile
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading your profiles...</div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-white mb-2">No profiles yet</h2>
            <p className="text-gray-400 mb-6">Create your first plugin profile collection</p>
            <Link
              to="/publish-profile"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Create Your First Profile
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{profile.name}</h3>
                    <p className="text-sm text-gray-500">by {profile.author}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold border rounded-full ${getStatusBadge(profile.status)}`}>
                    {profile.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{profile.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {profile.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                      +{profile.tags.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-800 pt-4">
                  <span>🔌 {profile.plugin_count} plugins</span>
                  <span>⬇️ {profile.downloads} downloads</span>
                </div>

                {profile.status === 'approved' && (
                  <Link
                    to={`/profiles/${profile.author}/${profile.name}`}
                    className="mt-4 block text-center px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition text-sm font-semibold"
                  >
                    View Profile
                  </Link>
                )}

                {profile.status === 'pending' && (
                  <div className="mt-4 text-center text-xs text-yellow-400">
                    ⏳ Awaiting admin approval
                  </div>
                )}

                {profile.status === 'rejected' && (
                  <div className="mt-4 text-center text-xs text-red-400">
                    ❌ Rejected - Please contact support
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
