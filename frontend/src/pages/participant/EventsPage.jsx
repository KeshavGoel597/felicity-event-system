import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import EventCard from '../../components/EventCard';
import EventFilters from '../../components/EventFilters';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ParticipantEventsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    eventType: '',
    status: 'Published', // Default to only show published events
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEvents: 0,
    limit: 12,
  });

  // Fetch events
  const fetchEvents = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: pagination.limit,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await participantAPI.getEvents(params);
      const { events: fetchedEvents, pagination: paginationData } = response.data.data;

      setEvents(fetchedEvents);
      setPagination({
        currentPage: paginationData.currentPage,
        totalPages: paginationData.totalPages,
        totalEvents: paginationData.totalEvents,
        limit: paginationData.limit,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents();
    fetchTrendingEvents();
  }, []);

  // Fetch trending events
  const fetchTrendingEvents = async () => {
    try {
      const response = await participantAPI.getTrendingEvents();
      setTrendingEvents(response.data.events || []);
    } catch (err) {
      console.error('Failed to fetch trending events:', err);
      // Don't show error to user for trending - it's not critical
    }
  };

  const handleSearch = () => {
    fetchEvents(1); // Reset to page 1 when searching
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleReset = () => {
    setFilters({
      search: '',
      category: '',
      eventType: '',
      status: 'Published',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => fetchEvents(1), 0);
  };

  const handlePageChange = (page) => {
    fetchEvents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEventClick = (eventId) => {
    navigate(`/participant/events/${eventId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Felicity</h1>
              <p className="text-sm text-gray-600">Event Management System</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/participant/registrations')}
                className="btn-secondary"
              >
                My Registrations
              </button>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">{user?.name}</span>
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse Events</h2>
          <p className="text-gray-600">
            Discover and register for exciting events at Felicity
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Filters */}
        <EventFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        {/* Trending Events Section */}
        {trendingEvents.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔥</span>
              <h3 className="text-xl font-bold text-gray-900">Trending Now</h3>
              <span className="text-sm text-gray-600">(Top 5 / Last 24h)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {trendingEvents.map((event, index) => (
                <div
                  key={event._id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-orange-300"
                  onClick={() => handleEventClick(event._id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {event.registrationCount || 0} registrations
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {event.eventName}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2">
                    {new Date(event.eventStartDate).toLocaleDateString()}
                  </p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                    {event.eventType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Info */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {events.length} of {pagination.totalEvents} events
            {filters.search && ` for "${filters.search}"`}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner />
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or check back later for new events
            </p>
            <button onClick={handleReset} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          /* Event Grid */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onClick={() => handleEventClick(event._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ParticipantEventsPage;
