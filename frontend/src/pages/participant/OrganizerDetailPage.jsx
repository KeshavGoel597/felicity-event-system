import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import EventCard from '../../components/EventCard';
import { ArrowLeft, Mail, Phone, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { participantAPI } from '../../services/api';
import api from '../../services/api';

const OrganizerDetailPage = () => {
  const { organizerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowed, setIsFollowed] = useState(false);
  const [followedClubs, setFollowedClubs] = useState([]);

  useEffect(() => {
    fetchOrganizerDetails();
    fetchFollowStatus();
  }, [organizerId]);

  const fetchOrganizerDetails = async () => {
    try {
      setLoading(true);
      const [orgRes, eventsRes] = await Promise.all([
        api.get(`/organizers/${organizerId}`),
        api.get(`/organizers/${organizerId}/events`),
      ]);
      setOrganizer(orgRes.data.organizer);
      setEvents(eventsRes.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organizer details');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowStatus = async () => {
    try {
      const response = await participantAPI.getProfile();
      const clubs = response.data.user?.followedClubs || [];
      const ids = clubs.map((c) => (typeof c === 'object' ? c._id : c));
      setFollowedClubs(ids);
      setIsFollowed(ids.includes(organizerId));
    } catch (err) {
      // ignore
    }
  };

  const handleToggleFollow = async () => {
    try {
      let newFollowed;
      if (isFollowed) {
        newFollowed = followedClubs.filter((id) => id !== organizerId);
      } else {
        newFollowed = [...followedClubs, organizerId];
      }
      setIsFollowed(!isFollowed);
      setFollowedClubs(newFollowed);
      await participantAPI.updatePreferences({ followedClubs: newFollowed });
    } catch (err) {
      setIsFollowed(isFollowed);
      setError(err.response?.data?.message || 'Failed to update follow');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error" message={error} />
          <button onClick={() => navigate('/participant/clubs')} className="btn-primary w-full mt-4">
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  if (!organizer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/participant/clubs')}
            className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Clubs
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Organizer Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{organizer.organizerName}</h2>
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                {organizer.category}
              </span>
            </div>
            <button
              onClick={handleToggleFollow}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFollowed
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFollowed ? 'fill-current' : ''}`} />
              {isFollowed ? 'Unfollow' : 'Follow'}
            </button>
          </div>

          {organizer.description && (
            <p className="text-gray-600 mt-4">{organizer.description}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            {organizer.contactEmail && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {organizer.contactEmail}
              </div>
            )}
            {organizer.contactNumber && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {organizer.contactNumber}
              </div>
            )}
          </div>
        </div>

        {/* Events by this organizer */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Events by {organizer.organizerName} ({events.length})
        </h3>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-600">No published events from this organizer yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onClick={() => navigate(`/participant/events/${event._id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDetailPage;
