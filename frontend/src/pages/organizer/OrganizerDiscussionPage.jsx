import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Send, MessageCircle, Crown } from 'lucide-react';

const OrganizerDiscussionPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [event, setEvent] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchData();
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchDiscussions, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [discussions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, discussionsRes] = await Promise.all([
        organizerAPI.getEventById(eventId),
        organizerAPI.getOrganizerDiscussions(eventId),
      ]);
      
      setEvent(eventRes.data.data);
      setDiscussions(discussionsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const response = await organizerAPI.getOrganizerDiscussions(eventId);
      setDiscussions(response.data.data);
    } catch (err) {
      console.error('Failed to refresh discussions:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      setSending(true);
      await organizerAPI.postOrganizerMessage(eventId, { message: newMessage });
      setNewMessage('');
      setSuccess('Message posted!');
      setTimeout(() => setSuccess(''), 2000);
      fetchDiscussions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post message');
    } finally {
      setSending(false);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
                <MessageCircle className="w-7 h-7 text-primary-600" />
                Discussion Forum (Organizer View)
              </h1>
              <p className="text-sm text-gray-600">{event?.eventName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        {/* Alerts */}
        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-4">
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 bg-white rounded-lg shadow-sm mb-4 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {discussions.length} {discussions.length === 1 ? 'message' : 'messages'}
            </p>
            <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              <Crown className="w-4 h-4" />
              <span>You are the organizer</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '400px' }}>
            {discussions.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No messages yet</p>
              </div>
            ) : (
              discussions.map((discussion) => {
                const isOwnMessage = discussion.participant._id === currentUser?.id;
                
                return (
                  <div
                    key={discussion._id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-purple-600 text-white'
                          : discussion.isOrganizer
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {discussion.isOrganizer && <Crown className="w-4 h-4" />}
                        <p className={`text-xs font-semibold ${
                          isOwnMessage
                            ? 'text-purple-100'
                            : discussion.isOrganizer
                            ? 'text-purple-700'
                            : 'text-gray-600'
                        }`}>
                          {discussion.participant.name}
                          {discussion.isOrganizer && ' (Organizer)'}
                          {isOwnMessage && ' (You)'}
                        </p>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{discussion.message}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage
                          ? 'text-purple-200'
                          : discussion.isOrganizer
                          ? 'text-purple-600'
                          : 'text-gray-500'
                      }`}>
                        {new Date(discussion.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message as organizer..."
              className="flex-1 input-field resize-none"
              rows="3"
              maxLength="2000"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors self-end disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {newMessage.length}/2000 characters • Your messages will be marked as "Organizer"
          </p>
        </form>

        {/* Info */}
        <div className="bg-purple-50 rounded-lg p-3 mt-4">
          <p className="text-xs text-purple-800">
            👑 You're viewing and participating as the event organizer. Messages auto-refresh every 5 seconds.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDiscussionPage;
