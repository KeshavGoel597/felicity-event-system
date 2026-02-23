import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { Calendar, Ticket, ShoppingBag, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await participantAPI.getDashboard();
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', icon: Calendar },
    { key: 'normal', label: 'Normal', icon: Ticket },
    { key: 'merchandise', label: 'Merchandise', icon: ShoppingBag },
    { key: 'completed', label: 'Completed', icon: CheckCircle },
    { key: 'cancelledRejected', label: 'Cancelled / Rejected', icon: XCircle },
  ];

  const getTabData = () => {
    if (!data) return [];
    if (activeTab === 'upcoming') return data.upcomingEvents || [];
    return data.participationHistory?.[activeTab] || [];
  };

  const tabData = getTabData();

  if (loading) return <LoadingSpinner fullScreen />;

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
            Back to Browse Events
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            My Events Dashboard
          </h2>
          <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors text-sm ${
                  activeTab === tab.key
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {tabData.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events here</h3>
            <p className="text-gray-600 mb-4">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming events. Browse events to register!"
                : 'No events in this category yet.'}
            </p>
            {activeTab === 'upcoming' && (
              <button onClick={() => navigate('/participant/events')} className="btn-primary">
                Browse Events
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabData.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 line-clamp-2">
                    {item.eventName}
                  </h4>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-2 ${
                      item.participationStatus === 'Registered'
                        ? 'bg-green-100 text-green-700'
                        : item.participationStatus === 'Completed'
                        ? 'bg-blue-100 text-blue-700'
                        : item.participationStatus === 'Cancelled'
                        ? 'bg-red-100 text-red-700'
                        : item.participationStatus === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item.participationStatus}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  By {item.organizerName}
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(item.eventStartDate).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded mb-3">
                  {item.eventType}
                </span>

                {item.ticketId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Ticket:{' '}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/participant/registrations');
                      }}
                      className="font-mono font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                      title="View in My Registrations"
                    >
                      {item.ticketId}
                    </button>
                  </p>
                )}

                {item.eventStatus && (
                  <p className="text-xs text-gray-500 mt-1">
                    Event Status: <span className="font-medium">{item.eventStatus}</span>
                  </p>
                )}

                <div className="mt-3 pt-3 border-t flex gap-2">
                  <button
                    onClick={() => navigate(`/participant/events/${item.eventId}`)}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Event
                  </button>
                  <button
                    onClick={() => navigate('/participant/registrations')}
                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                  >
                    My Registrations
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

export default DashboardPage;
