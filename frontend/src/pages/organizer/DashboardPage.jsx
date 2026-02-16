import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { 
  Calendar, Users, Ticket, TrendingUp, Plus, 
  LogOut, User, LayoutDashboard, UserCircle, PlayCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const OrganizerDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await organizerAPI.getDashboard();
      const { events, analytics } = response.data;
      
      // Compute stats from raw events data
      const totalEvents = events?.length || 0;
      const publishedEvents = events?.filter(e => e.status === 'Published').length || 0;
      
      // Events by status breakdown
      const statusCounts = {};
      events?.forEach(e => {
        statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
      });
      const eventsByStatus = Object.entries(statusCounts).map(([_id, count]) => ({ _id, count }));

      setStats({
        totalEvents,
        publishedEvents,
        totalRegistrations: analytics?.totalRegistrations || 0,
        attendanceMarked: analytics?.totalAttendance || 0,
        eventsByStatus,
        events,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Felicity Organizer</h1>
              <p className="text-sm text-gray-600">Event Management Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/organizer/events')}
                className="btn-secondary"
              >
                My Events
              </button>
              <button
                onClick={() => navigate('/organizer/events/create')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Create Event
              </button>
              <button
                onClick={() => navigate('/organizer/profile')}
                className="btn-secondary"
              >
                <UserCircle className="w-4 h-4 mr-1 inline" />
                Profile
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.organizerName || user?.firstName}!
          </h2>
          <p className="text-gray-600">
            Here's an overview of your events and registrations
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Events */}
              <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm">Total Events</p>
                    <p className="text-4xl font-bold mt-1">{stats.totalEvents}</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-blue-100">
                  Across all categories
                </p>
              </div>

              {/* Published Events */}
              <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-green-100 text-sm">Published</p>
                    <p className="text-4xl font-bold mt-1">{stats.publishedEvents}</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-green-100">
                  Live and accepting registrations
                </p>
              </div>

              {/* Total Registrations */}
              <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-purple-100 text-sm">Total Registrations</p>
                    <p className="text-4xl font-bold mt-1">{stats.totalRegistrations}</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-purple-100">
                  Across all your events
                </p>
              </div>

              {/* Attendance Marked */}
              <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-orange-100 text-sm">Attendance Marked</p>
                    <p className="text-4xl font-bold mt-1">{stats.attendanceMarked}</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                    <Ticket className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-orange-100">
                  Participants checked in
                </p>
              </div>
            </div>

            {/* Event Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Events by Status */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Events by Status
                </h3>
                <div className="space-y-3">
                  {stats.eventsByStatus?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item._id === 'Draft' ? 'bg-yellow-500' :
                          item._id === 'Published' ? 'bg-blue-500' :
                          item._id === 'Completed' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="font-medium text-gray-900">{item._id}</span>
                      </div>
                      <span className="text-2xl font-bold text-primary-600">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/organizer/events/create')}
                    className="w-full btn-primary text-left flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Plus className="w-5 h-5 mr-3" />
                      Create New Event
                    </span>
                    <span className="text-sm opacity-75">→</span>
                  </button>
                  <button
                    onClick={() => navigate('/organizer/events')}
                    className="w-full btn-secondary text-left flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Calendar className="w-5 h-5 mr-3" />
                      Manage My Events
                    </span>
                    <span className="text-sm opacity-75">→</span>
                  </button>
                  <button
                    onClick={() => navigate('/organizer/registrations')}
                    className="w-full btn-secondary text-left flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Users className="w-5 h-5 mr-3" />
                      View Registrations
                    </span>
                    <span className="text-sm opacity-75">→</span>
                  </button>
                  <button
                    onClick={() => navigate('/organizer/attendance')}
                    className="w-full btn-secondary text-left flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <Ticket className="w-5 h-5 mr-3" />
                      Mark Attendance
                    </span>
                    <span className="text-sm opacity-75">→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Information */}
            {user?.category && (
              <div className="card bg-primary-50 border-2 border-primary-600">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-600 rounded-lg">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Category</p>
                    <p className="text-xl font-semibold text-gray-900">{user.category}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboardPage;
