import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, CheckCircle, XCircle, Clock, Key } from 'lucide-react';

const PasswordResetRequestsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPasswordResetRequests();
      setRequests(response.data.data);
      setStats(response.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load password reset requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this password reset? A temporary password will be generated and sent to the organizer.')) return;

    try {
      setActionLoading(true);
      const response = await adminAPI.approvePasswordReset(requestId);
      setSuccess('Password reset approved! Temporary password sent to organizer.');
      setShowTempPassword(response.data.data.temporaryPassword);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve password reset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (requestId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await adminAPI.rejectPasswordReset(requestId, { reason: rejectReason });
      setSuccess('Password reset request rejected');
      setShowRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'Pending');
  const processedRequests = requests.filter(r => r.status !== 'Pending');

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
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-7 h-7 text-blue-600" />
                Password Reset Requests
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          </div>
        )}

        {/* Temporary Password Modal */}
        {showTempPassword && (
          <div className="mb-6 bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Temporary Password Generated</h3>
                <p className="text-sm text-blue-800 mb-3">
                  This temporary password has been sent to the organizer's email:
                </p>
                <div className="bg-white p-4 rounded border-2 border-blue-300">
                  <p className="text-xs text-gray-600 mb-1">Temporary Password:</p>
                  <p className="text-2xl font-mono font-bold text-blue-600">{showTempPassword}</p>
                </div>
              </div>
              <button
                onClick={() => setShowTempPassword(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending requests</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingRequests.map((request) => (
                <div key={request._id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {request.organizer.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">{request.organizer.email}</p>
                      <p className="text-sm text-gray-600 mb-3">{request.organizer.organizationName}</p>
                      
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <p className="text-xs text-gray-500 mb-1">Reason for Reset:</p>
                        <p className="text-sm text-gray-900">{request.reason}</p>
                      </div>
                      
                      <p className="text-xs text-gray-500">
                        Requested on {new Date(request.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <button
                        onClick={() => handleApprove(request._id)}
                        disabled={actionLoading}
                        className="btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(request._id)}
                        disabled={actionLoading}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Request History</h2>
            </div>

            <div className="divide-y max-h-96 overflow-y-auto">
              {processedRequests.map((request) => (
                <div key={request._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{request.organizer.name}</h3>
                        {request.status === 'Approved' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                            Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.organizer.email}</p>
                      
                      {request.rejectionReason && (
                        <div className="bg-red-50 rounded p-2 mb-2">
                          <p className="text-xs text-red-600">Rejection Reason:</p>
                          <p className="text-sm text-red-800">{request.rejectionReason}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        {request.status} on {new Date(request.reviewedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Password Reset Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this request:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field w-full h-32"
              placeholder="e.g., Insufficient verification, Need more information, etc."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectSubmit(showRejectModal)}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequestsPage;
