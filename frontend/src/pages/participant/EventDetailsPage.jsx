import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { 
  Calendar, MapPin, Users, IndianRupee, Clock, Tag, 
  ArrowLeft, Share2, Ticket 
} from 'lucide-react';
import { formatDate, formatDateTime, formatCurrency, getStatusBadgeClass } from '../../utils/helpers';

const EventDetailsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await participantAPI.getEventDetails(eventId);
      setEvent(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    navigate(`/participant/events/${eventId}/register`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.eventName,
          text: event.eventDescription,
          url: url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert type="error" message={error} />
          <button
            onClick={() => navigate('/participant/events')}
            className="btn-primary w-full mt-4"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const registrationCount = event.actualRegistrations ?? event.currentRegistrations ?? 0;
  const spotsLeft = (event.registrationLimit || Infinity) - registrationCount;
  const isFull = event.registrationLimit ? spotsLeft <= 0 : false;
  const canRegister = ['Published', 'Ongoing'].includes(event.status) && !isFull;

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

      {/* Event Banner */}
      {event.bannerImage ? (
        <div className="w-full h-96 bg-gray-200">
          <img
            src={event.bannerImage}
            alt={event.eventName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-96 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
          <h1 className="text-white text-6xl font-bold">{event.eventName?.charAt(0)}</h1>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Status */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-4xl font-bold text-gray-900">{event.eventName}</h1>
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share event"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={getStatusBadgeClass(event.status)}>{event.status}</span>
                <span className="badge badge-info">{event.eventType}</span>
                <span className="badge bg-purple-100 text-purple-800">{event.eligibility}</span>
                {event.eventTags && event.eventTags.length > 0 && event.eventTags.map((tag, idx) => (
                  <span key={idx} className="badge bg-gray-100 text-gray-700">{tag}</span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">About this Event</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{event.eventDescription}</p>
            </div>

            {/* Rules (if any) */}
            {event.rules && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Rules & Guidelines</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{event.rules}</p>
              </div>
            )}

            {/* Custom Form Fields (if any) */}
            {event.customForm && event.customForm.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Additional Information Required
                </h2>
                <p className="text-gray-600 mb-4">
                  You'll need to provide the following information during registration:
                </p>
                <ul className="space-y-2">
                  {event.customForm.map((field, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary-600 font-bold">•</span>
                      <div>
                        <span className="font-medium text-gray-900">
                          {field.fieldLabel}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">({field.fieldType})</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Merchandise Items (if applicable) */}
            {event.eventType === 'Merchandise' && event.merchandiseItems && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Available Merchandise
                </h2>
                <div className="space-y-3">
                  {event.merchandiseItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.itemName}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                        <p className={`text-xs mt-1 ${item.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
                        </p>
                        {item.sizes && item.sizes.length > 0 && (
                          <p className="text-xs text-gray-500">Sizes: {item.sizes.join(', ')}</p>
                        )}
                        {item.colors && item.colors.length > 0 && (
                          <p className="text-xs text-gray-500">Colors: {item.colors.join(', ')}</p>
                        )}
                      </div>
                      <p className="font-semibold text-primary-600">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
                {event.purchaseLimitPerParticipant && (
                  <p className="text-sm text-gray-500 mt-2">
                    Purchase limit: {event.purchaseLimitPerParticipant} items per participant
                  </p>
                )}
              </div>
            )}

            {/* Organizer Info */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Organized By</h2>
              <p className="text-gray-700">{event.organizerId?.organizerName || 'Felicity Team'}</p>
              {event.organizerId?.category && (
                <p className="text-sm text-gray-600 mt-1">
                  Category: {event.organizerId.category}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="card bg-primary-50 border-2 border-primary-600">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Registration
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-5 h-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Event Date</p>
                    <p className="font-medium">{formatDateTime(event.eventStartDate)}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <Clock className="w-5 h-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Registration Deadline</p>
                    <p className="font-medium">{formatDate(event.registrationDeadline)}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <MapPin className="w-5 h-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center text-gray-700">
                  <Users className="w-5 h-5 mr-3 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">Participants</p>
                    <p className="font-medium">
                      {registrationCount} / {event.registrationLimit || '∞'} registered
                    </p>
                  </div>
                </div>

                {event.registrationFee > 0 && (
                  <div className="flex items-center text-gray-700">
                    <IndianRupee className="w-5 h-5 mr-3 text-primary-600" />
                    <div>
                      <p className="text-sm text-gray-600">Registration Fee</p>
                      <p className="font-semibold text-lg text-primary-600">
                        {formatCurrency(event.registrationFee)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Availability Status */}
              {isFull ? (
                <div className="bg-red-100 text-red-700 font-medium px-4 py-3 rounded-lg text-center mb-4">
                  Event Full
                </div>
              ) : spotsLeft <= 10 ? (
                <div className="bg-yellow-100 text-yellow-700 font-medium px-4 py-3 rounded-lg text-center mb-4">
                  Only {spotsLeft} spots left!
                </div>
              ) : (
                <div className="bg-green-100 text-green-700 font-medium px-4 py-3 rounded-lg text-center mb-4">
                  {spotsLeft} spots available
                </div>
              )}

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={!canRegister}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Ticket className="w-5 h-5 mr-2 inline" />
                {!['Published', 'Ongoing'].includes(event.status)
                  ? `Event ${event.status}`
                  : isFull
                  ? 'Event Full'
                  : 'Register Now'}
              </button>

              {event.status === 'Published' && !isFull && (
                <p className="text-xs text-gray-600 text-center mt-2">
                  Secure your spot before it's too late!
                </p>
              )}
            </div>

            {/* Quick Info Card */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{formatDate(event.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">{formatDate(event.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage;
