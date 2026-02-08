import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import Alert from '../components/Alert';
import { Key, Send, ArrowLeft } from 'lucide-react';

const OrganizerPasswordResetPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.reason) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await authAPI.requestPasswordReset(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit password reset request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your password reset request has been submitted successfully. 
              An admin will review your request and you'll receive an email with further instructions.
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">Organizer Account Password Reset</p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Password Reset
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="input-field h-32"
              placeholder="Please explain why you need to reset your password (e.g., forgot password, security concern, etc.)"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be reviewed by an admin before approval
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your request will be reviewed by an admin. 
            Once approved, you'll receive a temporary password via email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrganizerPasswordResetPage;
