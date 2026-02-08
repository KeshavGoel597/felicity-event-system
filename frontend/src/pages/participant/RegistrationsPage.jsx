import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { 
  Calendar, MapPin, Ticket, Download, Eye, ArrowLeft, 
  LogOut, User, Filter 
} from 'lucide-react';
import { 
  formatDate, formatCurrency, getRegistrationStatusBadgeClass 
} from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const ParticipantRegistrationsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await participantAPI.getMyRegistrations();
      setRegistrations(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQR = async (registrationId) => {
    try {
      const response = await participantAPI.getQRCode(registrationId);
      setSelectedQR({
        id: registrationId,
        qrCode: response.data.data.qrCode,
        ticketId: response.data.data.ticketId,
      });
    } catch (err) {
      setError('Failed to load QR code');
    }
  };

  const handleDownloadQR = (qrCode, ticketId) => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `ticket-${ticketId}.png`;
    link.click();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getFilteredRegistrations = () => {
    if (filter === 'all') return registrations;
    
    const now = new Date();
    
    return registrations.filter(reg => {
      const eventDate = new Date(reg.event?.eventDate);
      
      switch (filter) {
        case 'upcoming':
          return eventDate > now && reg.registrationStatus !== 'Cancelled';
        case 'past':
          return eventDate < now || reg.registrationStatus === 'Attended';
        case 'cancelled':
          return reg.registrationStatus === 'Cancelled';
        default:
          return true;
      }
    });
  };

  const filteredRegistrations = getFilteredRegistrations();

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
                onClick={() => navigate('/participant/events')}
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-primary-600">My Registrations</h1>
                <p className="text-sm text-gray-600">View and manage your event registrations</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All', count: registrations.length },
            { key: 'upcoming', label: 'Upcoming', count: getFilteredRegistrations().filter(r => filter === 'all').length },
            { key: 'past', label: 'Past', count: 0 },
            { key: 'cancelled', label: 'Cancelled', count: registrations.filter(r => r.registrationStatus === 'Cancelled').length },
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

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No registrations found
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't registered for any events yet"
                : `No ${filter} registrations`}
            </p>
            <button
              onClick={() => navigate('/participant/events')}
              className="btn-primary"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRegistrations.map((registration) => (
              <div key={registration._id} className="card">
                {/* Event Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {registration.event?.name}
                    </h3>
                    <span className={getRegistrationStatusBadgeClass(registration.registrationStatus)}>
                      {registration.registrationStatus}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="w-4 h-4 mr-2 text-primary-600" />
                      <span>{formatDate(registration.event?.eventDate)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mr-2 text-primary-600" />
                      <span>{registration.event?.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <Ticket className="w-4 h-4 mr-2 text-primary-600" />
                      <span>
                        Ticket:{' '}
                        {registration.qrCode ? (
                          <button
                            onClick={() => setSelectedQR({
                              qrCode: registration.qrCode,
                              ticketId: registration.ticketId,
                              eventName: registration.event?.eventName || 'Event',
                            })}
                            className="font-mono font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                            title="Click to view QR code"
                          >
                            {registration.ticketId}
                          </button>
                        ) : (
                          <span className="font-mono">{registration.ticketId}</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {registration.amountPaid > 0 && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      Amount Paid:{' '}
                      <span className="font-semibold text-green-700">
                        {formatCurrency(registration.amountPaid)}
                      </span>
                    </p>
                  </div>
                )}

                {/* Merchandise Details */}
                {registration.merchandiseDetails && registration.merchandiseDetails.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Merchandise:</p>
                    <div className="space-y-1">
                      {registration.merchandiseDetails.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{item.name} x {item.quantity}</span>
                          <span>{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attendance */}
                {registration.attendanceMarked && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">
                      ✓ Attendance marked on {formatDate(registration.attendanceMarkedAt)}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewQR(registration._id)}
                    className="flex-1 btn-primary text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1 inline" />
                    View QR Code
                  </button>
                  <button
                    onClick={() => navigate(`/participant/events/${registration.event?._id}`)}
                    className="flex-1 btn-secondary text-sm"
                  >
                    Event Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQR(null)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Your Event Ticket
            </h3>
            <div className="bg-gray-50 p-6 rounded-lg mb-4">
              <img
                src={selectedQR.qrCode}
                alt="QR Code"
                className="w-full max-w-xs mx-auto"
              />
            </div>
            <p className="text-center text-gray-700 mb-6">
              Ticket ID:{' '}
              <span className="font-mono font-semibold">{selectedQR.ticketId}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDownloadQR(selectedQR.qrCode, selectedQR.ticketId)}
                className="flex-1 btn-primary"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Download
              </button>
              <button
                onClick={() => setSelectedQR(null)}
                className="flex-1 btn-secondary"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Show this QR code at the event for attendance marking
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantRegistrationsPage;
