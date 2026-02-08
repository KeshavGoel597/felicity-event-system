import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Star, Send } from 'lucide-react';

const FeedbackPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [event, setEvent] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
  });

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, statsRes] = await Promise.all([
        participantAPI.getEventDetails(eventId),
        participantAPI.getFeedbackStats(eventId),
      ]);
      
      setEvent(eventRes.data.data);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await participantAPI.submitFeedback(eventId, formData);
      setSubmitted(true);
      // Refresh stats
      const statsRes = await participantAPI.getFeedbackStats(eventId);
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/participant/events/${eventId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Event Feedback</h1>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your anonymous feedback has been submitted successfully.
            </p>
            <button
              onClick={() => navigate(`/participant/events/${eventId}`)}
              className="btn-primary"
            >
              Back to Event Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/participant/events/${eventId}`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Event Feedback</h1>
              <p className="text-sm text-gray-600">{event?.eventName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Current Stats */}
        {stats && stats.count > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Current Ratings</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary-600">{stats.avgRating}</p>
                <p className="text-sm text-gray-600">Average Rating</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex-1 flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-600 w-8">{star} ★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{
                            width: `${stats.count > 0 ? (stats.distribution[star] / stats.count) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-8">{stats.distribution[star]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Based on {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        )}

        {/* Feedback Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Share Your Feedback</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate this event?
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        formData.rating >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {formData.rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {formData.rating === 1 && 'Poor'}
                  {formData.rating === 2 && 'Fair'}
                  {formData.rating === 3 && 'Good'}
                  {formData.rating === 4 && 'Very Good'}
                  {formData.rating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                className="input-field h-32"
                placeholder="Share your thoughts about the event..."
                maxLength="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.comment.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>

          {/* Anonymous Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              🔒 <strong>Anonymous Feedback:</strong> Your feedback is completely anonymous. 
              We do not store any information that could identify you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
