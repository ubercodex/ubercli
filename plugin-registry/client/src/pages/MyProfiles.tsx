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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="text-7xl mb-6 animate-pulse-glow">🔒</div>
          <h2 className="text-3xl font-bold text-white mb-4">Login Required</h2>
          <p className="text-slate-400 text-lg">Please sign in to view your profiles</p>
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
    <div className="min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12 animate-fade-in-down">
          <div>
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight pb-2">My Profiles</h1>
            <p className="text-slate-400 text-xl">Manage your plugin profile collections</p>
          </div>
          <Link
            to="/publish-profile"
            className="relative group inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
              + Create Profile
            </div>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <div className="text-slate-400">Loading your profiles...</div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="text-8xl mb-6 animate-pulse-glow">📋</div>
            <h2 className="text-3xl font-bold text-white mb-4">No profiles yet</h2>
            <p className="text-slate-400 text-lg mb-8">Create your first plugin profile collection</p>
            <Link
              to="/publish-profile"
              className="relative group inline-block"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all">
                Create Your First Profile
              </div>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="bg-[#12121a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/20 transition-all group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{profile.name}</h3>
                    <p className="text-sm text-slate-500">by {profile.author}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold border rounded-xl ${getStatusBadge(profile.status)}`}>
                    {profile.status}
                  </span>
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{profile.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                  {profile.tags.length > 3 && (
                    <span className="px-3 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-lg">
                      +{profile.tags.length - 3}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500 border-t border-purple-500/20 pt-4">
                  <span>🔌 {profile.plugin_count} plugins</span>
                  <span>👁️ {profile.downloads} views</span>
                </div>

                <div className="mt-4 flex gap-2">
                  {profile.status === 'approved' && (
                    <Link
                      to={`/profiles/${profile.author}/${profile.name}`}
                      className="flex-1 text-center px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all text-sm font-semibold"
                    >
                      View
                    </Link>
                  )}
                  
                  <Link
                    to={`/edit-profile/${profile.id}`}
                    className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl hover:bg-cyan-500/30 transition-all text-sm font-semibold"
                  >
                    ✏️
                  </Link>
                  
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    disabled={deleting === profile.id}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-500/30 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === profile.id ? '...' : '🗑️'}
                  </button>
                </div>

                {profile.status === 'pending' && (
                  <div className="mt-3 text-center text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg py-2">
                    ⏳ Awaiting admin approval
                  </div>
                )}

                {profile.status === 'rejected' && (
                  <div className="mt-3 text-center text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg py-2">
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
