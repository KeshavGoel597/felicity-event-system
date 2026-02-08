import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Star, TrendingUp } from 'lucide-react';

const FeedbackViewPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, feedbackRes] = await Promise.all([
        organizerAPI.getEventById(eventId),
        organizerAPI.getEventFeedback(eventId),
      ]);
      
      setEvent(eventRes.data.data);
      setFeedbackData(feedbackRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
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
              onClick={() => navigate('/organizer/events')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-primary-600" />
                Event Feedback
              </h1>
              <p className="text-sm text-gray-600">{event?.eventName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Average Rating */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Average Rating</h2>
            <div className="text-center">
              <div className="text-6xl font-bold text-primary-600 mb-2">
                {feedbackData?.avgRating || '0.0'}
              </div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= Math.round(feedbackData?.avgRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-600">
                Based on {feedbackData?.count || 0} {feedbackData?.count === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Rating Distribution</h2>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-12">{star} stars</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-yellow-400 h-4 rounded-full transition-all"
                      style={{
                        width: `${
                          feedbackData?.count > 0
                            ? (feedbackData.distribution[star] / feedbackData.count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {feedbackData?.distribution[star] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Individual Feedback */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Individual Feedback</h2>
          </div>

          {feedbackData?.data.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No feedback received yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {feedbackData?.data.map((feedback, index) => (
                <div key={feedback._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500">
                        Feedback #{feedbackData.data.length - index}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= feedback.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {feedback.comment && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{feedback.comment}</p>
                    </div>
                  )}
                  
                  {!feedback.comment && (
                    <p className="text-gray-400 italic text-sm">No comment provided</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-800">
            🔒 All feedback is anonymous. Participant identities are not stored or tracked.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackViewPage;
