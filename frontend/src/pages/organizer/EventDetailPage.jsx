import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import {
  ArrowLeft, Edit, Users, Calendar, MapPin, Ticket,
  DollarSign, Send, CheckCircle, XCircle, QrCode,
  ClipboardList, MessageSquare, Star, Download, Clock,
} from 'lucide-react';
import { formatDate, getStatusBadgeClass } from '../../utils/helpers';

const OrganizerEventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (activeTab === 'participants') {
      fetchParticipants();
    }
  }, [activeTab]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getEventById(eventId);
      setEvent(response.data.event);
      setAnalytics(response.data.analytics);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await organizerAPI.getParticipants(eventId);
      setParticipants(response.data.participants || []);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this event?')) return;
    try {
      await organizerAPI.publishEvent(eventId);
      setSuccess('Event published successfully');
      fetchEventDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this event as completed?')) return;
    try {
      await organizerAPI.changeEventStatus(eventId, { newStatus: 'Completed' });
      setSuccess('Event marked as completed');
      fetchEventDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete event');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this event?')) return;
    try {
      await organizerAPI.changeEventStatus(eventId, { newStatus: 'Closed' });
      setSuccess('Event cancelled');
      fetchEventDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel event');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await organizerAPI.exportParticipantsCSV(eventId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.eventName}-participants.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  const filteredParticipants = search
    ? participants.filter(
        (p) =>
          p.participantName.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      )
    : participants;

  if (loading) return <LoadingSpinner fullScreen />;
  if (!event) return <div className="p-8 text-center text-gray-600">Event not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/organizer/events')}
              className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to My Events
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/organizer/events/${eventId}/edit`)}
                className="btn-secondary text-sm"
              >
                <Edit className="w-4 h-4 mr-1 inline" />
                Edit
              </button>
              {event.status === 'Draft' && (
                <button onClick={handlePublish} className="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                  <Send className="w-4 h-4 mr-1 inline" />
                  Publish
                </button>
              )}
              {event.status === 'Published' && (
                <>
                  <button onClick={handleComplete} className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    <CheckCircle className="w-4 h-4 mr-1 inline" />
                    Complete
                  </button>
                  <button onClick={handleCancel} className="px-3 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors">
                    <XCircle className="w-4 h-4 mr-1 inline" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && <div className="mb-6"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
        {success && <div className="mb-6"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}

        {/* Event Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{event.eventName}</h1>
            <span className={getStatusBadgeClass(event.status)}>{event.status}</span>
          </div>
          <p className="text-gray-600">{event.eventDescription}</p>
        </div>

        {/* Quick Actions for Merchandise Events */}
        {event.eventType === 'Merchandise' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">Merchandise Event</p>
              <p className="text-sm text-yellow-700">Manage payment approvals for this merchandise event</p>
            </div>
            <button
              onClick={() => navigate(`/organizer/events/${event._id}/payment-approvals`)}
              className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <DollarSign className="w-4 h-4 mr-1 inline" />
              Payment Approvals
            </button>
          </div>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="card text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{analytics.totalRegistrations}</p>
              <p className="text-sm text-gray-600">Registrations</p>
            </div>
            <div className="card text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">₹{analytics.revenue}</p>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
            <div className="card text-center">
              <Ticket className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{analytics.paidRegistrations}</p>
              <p className="text-sm text-gray-600">Paid</p>
            </div>
            {analytics.pendingRegistrations > 0 && (
              <div className="card text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-gray-900">{analytics.pendingRegistrations}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            )}
            <div className="card text-center">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-gray-900">{analytics.attendance}</p>
              <p className="text-sm text-gray-600">Attended</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { key: 'details', label: 'Event Details' },
            { key: 'participants', label: `Participants (${analytics?.totalRegistrations || 0})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{formatDate(event.eventStartDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium">{formatDate(event.eventEndDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Registration Deadline</p>
                    <p className="font-medium">{formatDate(event.registrationDeadline)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{event.location || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Registration Fee</p>
                    <p className="font-medium">{event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Registration Limit</p>
                    <p className="font-medium">{event.registrationLimit || 'Unlimited'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Event Type</p>
                  <span className="badge badge-info">{event.eventType}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Eligibility</p>
                  <span className="badge bg-purple-100 text-purple-800">{event.eligibility}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate(`/organizer/events/${eventId}/qr-scanner`)}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <QrCode className="w-5 h-5" />
                  QR Scanner
                </button>
                <button
                  onClick={() => navigate(`/organizer/events/${eventId}/attendance`)}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <ClipboardList className="w-5 h-5" />
                  Attendance List
                </button>
                <button
                  onClick={() => navigate(`/organizer/events/${eventId}/payment-approvals`)}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <DollarSign className="w-5 h-5" />
                  Payment Approvals
                </button>
                <button
                  onClick={() => navigate(`/organizer/events/${eventId}/feedback`)}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <Star className="w-5 h-5" />
                  Feedback
                </button>
                <button
                  onClick={() => navigate(`/organizer/events/${eventId}/discussion`)}
                  className="w-full btn-secondary text-left flex items-center gap-3"
                >
                  <MessageSquare className="w-5 h-5" />
                  Discussion Forum
                </button>
              </div>
            </div>

            {/* Custom Form Fields */}
            {event.eventType === 'Normal' && event.customForm && event.customForm.length > 0 && (
              <div className="card lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Form Fields</h3>
                <div className="space-y-2">
                  {event.customForm.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{field.fieldLabel}</span>
                        <span className="ml-2 text-sm text-gray-500">({field.fieldType})</span>
                      </div>
                      {field.isRequired && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Required</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merchandise Items */}
            {event.eventType === 'Merchandise' && event.merchandiseItems && event.merchandiseItems.length > 0 && (
              <div className="card lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Merchandise Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 pr-4 text-sm text-gray-600">Item</th>
                        <th className="py-2 pr-4 text-sm text-gray-600">Price</th>
                        <th className="py-2 pr-4 text-sm text-gray-600">Stock</th>
                        <th className="py-2 pr-4 text-sm text-gray-600">Sizes</th>
                        <th className="py-2 text-sm text-gray-600">Colors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.merchandiseItems.map((item, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{item.itemName}</td>
                          <td className="py-3 pr-4">₹{item.price}</td>
                          <td className="py-3 pr-4">{item.stockQuantity}</td>
                          <td className="py-3 pr-4">{(item.sizes || []).join(', ') || '—'}</td>
                          <td className="py-3">{(item.colors || []).join(', ') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div>
            {/* Search & Export */}
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field max-w-sm"
              />
              <button onClick={handleExportCSV} className="btn-secondary text-sm">
                <Download className="w-4 h-4 mr-1 inline" />
                Export CSV
              </button>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No participants yet</h3>
                <p className="text-gray-600">Participants will appear here once they register.</p>
              </div>
            ) : (
              <div className="card overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-sm font-medium text-gray-600">#</th>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-600">Name</th>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-600">Email</th>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-600">Registered On</th>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-600">Payment</th>
                      <th className="py-3 pr-4 text-sm font-medium text-gray-600">Attendance</th>
                      <th className="py-3 text-sm font-medium text-gray-600">Ticket ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((p, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4 text-sm">{i + 1}</td>
                        <td className="py-3 pr-4 font-medium">{p.participantName}</td>
                        <td className="py-3 pr-4 text-sm text-gray-600">{p.email}</td>
                        <td className="py-3 pr-4 text-sm">{formatDate(p.registrationDate)}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            p.paymentStatus === 'Paid'
                              ? 'bg-green-100 text-green-700'
                              : p.paymentStatus === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm">{p.attendance}</td>
                        <td className="py-3 text-sm text-gray-500 font-mono">{p.ticketId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEventDetailPage;
