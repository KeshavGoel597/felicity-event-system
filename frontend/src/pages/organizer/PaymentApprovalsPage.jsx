import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, CheckCircle, XCircle, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';

const PaymentApprovalsPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentData, setPaymentData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, paymentsRes] = await Promise.all([
        organizerAPI.getEventById(eventId),
        organizerAPI.getPendingPayments(eventId),
      ]);
      
      setEvent(eventRes.data.event);
      setPaymentData(paymentsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) return;

    try {
      setActionLoading(true);
      await organizerAPI.approvePayment(registrationId);
      setSuccess('Payment approved successfully!');
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (registrationId) => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      await organizerAPI.rejectPayment(registrationId, { reason: rejectReason });
      setSuccess('Payment rejected');
      setShowRejectModal(null);
      setRejectReason('');
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject payment');
    } finally {
      setActionLoading(false);
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
              onClick={() => navigate(`/organizer/events`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-600" />
                Payment Approvals
              </h1>
              <p className="text-sm text-gray-600">{event?.eventName}</p>
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

        {/* Stats */}
        {paymentData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {paymentData.stats.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {paymentData.stats.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {paymentData.stats.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        )}

        {/* Pending Payments List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Pending Payment Approvals</h2>
          </div>

          {paymentData?.payments.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending payments</p>
            </div>
          ) : (
            <div className="divide-y">
              {paymentData?.payments.map((payment) => (
                <div key={payment.registrationId} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Payment Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {payment.participant.name}
                          </h3>
                          <p className="text-sm text-gray-600">{payment.participant.email}</p>
                          <p className="text-sm text-gray-600">{payment.participant.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Ticket ID</p>
                          <p className="font-mono text-sm font-medium">{payment.ticketId}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium mb-2">Items Purchased:</h4>
                        <ul className="space-y-2">
                          {payment.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.itemName} 
                                {item.selectedSize && ` (${item.selectedSize})`} 
                                × {item.quantity}
                              </span>
                              <span className="font-medium">₹{item.price * item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                          <span>Total Amount:</span>
                          <span>₹{payment.totalAmount}</span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        <p>Registered: {new Date(payment.registrationDate).toLocaleString()}</p>
                        <p>Proof Uploaded: {new Date(payment.uploadedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Payment Proof */}
                    <div className="md:w-80">
                      <p className="text-sm font-medium mb-2">Payment Proof:</p>
                      <div
                        className="relative border-2 border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-primary-500 transition-colors"
                        onClick={() => setSelectedImage(payment.paymentProof)}
                      >
                        <img
                          src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${payment.paymentProof}`}
                          alt="Payment Proof"
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => handleApprove(payment.registrationId)}
                          disabled={actionLoading}
                          className="w-full btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Payment
                        </button>
                        <button
                          onClick={() => setShowRejectModal(payment.registrationId)}
                          disabled={actionLoading}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selectedImage}`}
              alt="Payment Proof"
              className="max-w-full max-h-screen object-contain"
            />
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Payment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this payment:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field w-full h-32"
              placeholder="e.g., Screenshot is unclear, Payment details don't match, etc."
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

export default PaymentApprovalsPage;
