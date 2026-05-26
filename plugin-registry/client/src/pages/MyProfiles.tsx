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
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profiles/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        const profiles = (data.profiles || []).map((p: any) => ({
          ...p,
          tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
        }));
        setProfiles(profiles);
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

  const handleDelete = async (profileId: string, profileName: string) => {
    if (!confirm(`Are you sure you want to delete "${profileName}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(profileId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profiles/${profileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setProfiles(prev => prev.filter(p => p.id !== profileId));
      } else {
        alert('Failed to delete profile');
      }
    } catch (error) {
      alert('Failed to delete profile');
    } finally {
      setDeleting(null);
    }
  };

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
                  <span>👁️ {profile.downloads} views</span>
                </div>

                <div className="mt-4 flex gap-2">
                  {profile.status === 'approved' && (
                    <Link
                      to={`/profiles/${profile.author}/${profile.name}`}
                      className="flex-1 text-center px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition text-sm font-semibold"
                    >
                      View
                    </Link>
                  )}
                  
                  <Link
                    to={`/edit-profile/${profile.id}`}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition text-sm font-semibold"
                  >
                    ✏️
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    disabled={deleting === profile.id}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === profile.id ? '...' : '🗑️'}
                  </button>
                </div>

                {profile.status === 'pending' && (
                  <div className="mt-2 text-center text-xs text-yellow-400">
                    ⏳ Awaiting admin approval
                  </div>
                )}

                {profile.status === 'rejected' && (
                  <div className="mt-2 text-center text-xs text-red-400">
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
