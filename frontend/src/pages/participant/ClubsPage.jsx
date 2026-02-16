import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { Search, ArrowLeft, Heart, HeartOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const ClubsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [followedClubs, setFollowedClubs] = useState([]);

  const categories = [
    'Technical', 'Cultural', 'Sports', 'Literary', 'Arts', 'Gaming', 'Social', 'Academic', 'Other',
  ];

  useEffect(() => {
    fetchOrganizers();
    fetchFollowed();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizers', { params: { search, category: categoryFilter } });
      setOrganizers(response.data.organizers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowed = async () => {
    try {
      const response = await participantAPI.getProfile();
      const clubs = response.data.user?.followedClubs || [];
      setFollowedClubs(clubs.map((c) => (typeof c === 'object' ? c._id : c)));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrganizers();
  }, [search, categoryFilter]);

  const handleFollow = async (organizerId) => {
    try {
      const newFollowed = [...followedClubs, organizerId];
      setFollowedClubs(newFollowed);
      await participantAPI.updatePreferences({ followedClubs: newFollowed });
      setSuccess('Club followed!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to follow club');
      setFollowedClubs((prev) => prev.filter((id) => id !== organizerId));
    }
  };

  const handleUnfollow = async (organizerId) => {
    try {
      const newFollowed = followedClubs.filter((id) => id !== organizerId);
      setFollowedClubs(newFollowed);
      await participantAPI.updatePreferences({ followedClubs: newFollowed });
      setSuccess('Club unfollowed');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unfollow club');
      setFollowedClubs((prev) => [...prev, organizerId]);
    }
  };

  const isFollowed = (id) => followedClubs.includes(id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/participant/events')}
            className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Events
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Clubs & Organizers</h2>
          <p className="text-gray-600">Follow clubs to get personalized event recommendations</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-full md:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : organizers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold text-gray-900">No clubs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizers.map((org) => (
              <div
                key={org._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{org.organizerName}</h3>
                    <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full mt-1">
                      {org.category}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      isFollowed(org._id) ? handleUnfollow(org._id) : handleFollow(org._id)
                    }
                    className={`p-2 rounded-full transition-colors ${
                      isFollowed(org._id)
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={isFollowed(org._id) ? 'Unfollow' : 'Follow'}
                  >
                    {isFollowed(org._id) ? (
                      <Heart className="w-5 h-5 fill-current" />
                    ) : (
                      <Heart className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {org.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{org.description}</p>
                )}

                {org.contactEmail && (
                  <p className="text-xs text-gray-500 mb-1">📧 {org.contactEmail}</p>
                )}

                <button
                  onClick={() => navigate(`/participant/clubs/${org._id}`)}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsPage;
