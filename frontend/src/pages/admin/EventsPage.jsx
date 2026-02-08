import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search, Filter, Eye } from 'lucide-react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EventCard from '../../components/EventCard';

const AdminEventsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const statusOptions = ['all', 'Draft', 'Published', 'Completed', 'Cancelled'];
  const categoryOptions = ['all', 'Technical', 'Cultural', 'Sports', 'Literary', 'Social', 'Academic', 'Other'];

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllEvents();
      setEvents(response.data.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.eventDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.organizerId?.organizerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-700';
      case 'Draft':
        return 'bg-gray-100 text-gray-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Platform Events</h1>
              <p className="text-sm text-gray-600 mt-1">Monitor and oversee all events on the platform</p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events or organizers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total Events: <strong>{events.length}</strong></span>
              <span>•</span>
              <span>Filtered: <strong>{filteredEvents.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No events found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div key={event._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{event.eventName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {event.category}
                      </span>
                      {event.eventType === 'Merchandise' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Merchandise
                        </span>
                      )}
                    </div>

                    <p className="text-gray-600 mb-3 line-clamp-2">{event.eventDescription}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Organizer:</span>
                        <p className="font-medium text-gray-900">{event.organizerId?.organizerName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Event Date:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(event.eventStartDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Registrations:</span>
                        <p className="font-medium text-gray-900">
                          {event.currentRegistrations || 0} / {event.registrationLimit || '∞'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Fee:</span>
                        <p className="font-medium text-gray-900">
                          {event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/participant/events/${event._id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventsPage;
