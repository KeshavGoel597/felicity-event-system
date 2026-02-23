import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { 
  Plus, Edit, Trash2, Eye, Send, XCircle, CheckCircle,
  Calendar, Users, ArrowLeft, LogOut, User
} from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const OrganizerEventsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await organizerAPI.getMyEvents();
      setEvents(response.data.events || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId) => {
    if (!confirm('Are you sure you want to publish this event? It will be visible to all participants.')) {
      return;
    }

    try {
      await organizerAPI.publishEvent(eventId);
      setSuccess('Event published successfully');
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleCancel = async (eventId) => {
    if (!confirm('Are you sure you want to cancel this event? All registrations will be notified.')) {
      return;
    }

    try {
      await organizerAPI.changeEventStatus(eventId, { newStatus: 'Closed' });
      setSuccess('Event cancelled successfully');
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel event');
    }
  };

  const handleComplete = async (eventId) => {
    if (!confirm('Mark this event as completed?')) {
      return;
    }

    try {
      await organizerAPI.changeEventStatus(eventId, { newStatus: 'Completed' });
      setSuccess('Event marked as completed');
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await organizerAPI.changeEventStatus(eventId, { newStatus: 'Closed' });
      setSuccess('Event closed successfully');
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getFilteredEvents = () => {
    if (filter === 'all') return events;
    return events.filter(event => event.status.toLowerCase() === filter.toLowerCase());
  };

  const filteredEvents = getFilteredEvents();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/organizer/dashboard')}
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-primary-600">My Events</h1>
                <p className="text-sm text-gray-600">Manage all your events</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/organizer/events/create')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Create Event
              </button>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">{user?.organizerName || user?.firstName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All Events', count: events.length },
            { key: 'draft', label: 'Drafts', count: events.filter(e => e.status === 'Draft').length },
            { key: 'published', label: 'Published', count: events.filter(e => e.status === 'Published').length },
            { key: 'ongoing', label: 'Ongoing', count: events.filter(e => e.status === 'Ongoing').length },
            { key: 'completed', label: 'Completed', count: events.filter(e => e.status === 'Completed').length },
            { key: 'closed', label: 'Closed', count: events.filter(e => e.status === 'Closed').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-sm">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't created any events yet"
                : `No ${filter} events`}
            </p>
            <button
              onClick={() => navigate('/organizer/events/create')}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {event.eventName}
                      </h3>
                      <span className={getStatusBadgeClass(event.status)}>
                        {event.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {event.eventDescription}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-primary-600" />
                        <span>{formatDate(event.eventStartDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1 text-primary-600" />
                        <span>
                          {event.actualRegistrations ?? event.currentRegistrations ?? 0} / {event.registrationLimit || '∞'} registered
                          {event.pendingRegistrations > 0 && (
                            <span className="text-yellow-600 ml-1">({event.pendingRegistrations} pending)</span>
                          )}
                        </span>
                      </div>
                      <span className="badge badge-info">{event.eventType}</span>
                      <span className="badge bg-purple-100 text-purple-800">{event.eligibility}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate(`/organizer/events/${event._id}`)}
                      className="btn-secondary text-sm"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 mr-1 inline" />
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/organizer/events/${event._id}/edit`)}
                      className="btn-secondary text-sm"
                      title="Edit Event"
                    >
                      <Edit className="w-4 h-4 mr-1 inline" />
                      Edit
                    </button>

                    {event.status === 'Draft' && (
                      <button
                        onClick={() => handlePublish(event._id)}
                        className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        title="Publish Event"
                      >
                        <Send className="w-4 h-4 mr-1 inline" />
                        Publish
                      </button>
                    )}

                    {event.status === 'Published' && (
                      <>
                        <button
                          onClick={() => handleComplete(event._id)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircle className="w-4 h-4 mr-1 inline" />
                          Complete
                        </button>
                        <button
                          onClick={() => handleCancel(event._id)}
                          className="px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                          title="Cancel Event"
                        >
                          <XCircle className="w-4 h-4 mr-1 inline" />
                          Cancel
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(event._id)}
                      className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEventsPage;
