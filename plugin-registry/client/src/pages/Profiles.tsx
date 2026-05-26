import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Profile {
  id: string;
  author: string;
  name: string;
  description: string;
  tags: string[];
  downloads: number;
  plugin_count: number;
  created_at: string;
}

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/profiles`)
      .then(res => res.json())
      .then(data => {
        setProfiles(data.profiles || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Plugin Profiles</h1>
          <p className="text-xl text-gray-400">
            Curated collections of plugins for specific use cases
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading profiles...</div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm ? 'No profiles found matching your search' : 'No profiles available yet'}
            </div>
            <Link to="/publish-profile" className="text-purple-400 hover:text-purple-300">
              Be the first to create a profile →
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfiles.map(profile => (
              <Link
                key={profile.id}
                to={`/profiles/${profile.author}/${profile.name}`}
                className="group bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-purple-500 transition"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition mb-2">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-gray-500">by {profile.author}</p>
                </div>

                <p className="text-gray-400 mb-4 line-clamp-2">
                  {profile.description}
                </p>

                {profile.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {profile.tags.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{profile.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{profile.plugin_count} plugins</span>
                  <span>{profile.downloads.toLocaleString()} downloads</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
