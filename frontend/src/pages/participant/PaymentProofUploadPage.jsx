import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const PaymentProofUploadPage = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registration, setRegistration] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchRegistration();
  }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const response = await participantAPI.getRegistrationById(registrationId);
      setRegistration(response.data.data);
      
      // If payment proof already exists, show it
      if (response.data.data.paymentProof) {
        setPreviewUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${response.data.data.paymentProof}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registration details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile && !registration.paymentProof) {
      setError('Please select a file to upload');
      return;
    }

    if (!selectedFile && registration.paymentProof) {
      setError('No new file selected. Current proof is already uploaded.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const formData = new FormData();
      formData.append('paymentProof', selectedFile);

      await participantAPI.uploadPaymentProof(registrationId, formData);
      
      setSuccess('Payment proof uploaded successfully! Waiting for organizer approval.');
      setSelectedFile(null);
      
      // Refresh registration data
      await fetchRegistration();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Pending Approval</span>
          </div>
        );
      case 'Paid':
        return (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Approved</span>
          </div>
        );
      case 'Rejected':
        return (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full">
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">{status}</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Registration not found</p>
          <button
            onClick={() => navigate('/participant/registrations')}
            className="mt-4 btn-primary"
          >
            Go to Registrations
          </button>
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
              onClick={() => navigate('/participant/registrations')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Upload Payment Proof</h1>
              <p className="text-sm text-gray-600">{registration.eventId?.eventName || 'Event'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
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

        {/* Registration Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Registration Details</h2>
            {getStatusBadge(registration.paymentStatus)}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ticket ID:</span>
              <span className="font-mono font-medium">{registration.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹{registration.totalAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registration Date:</span>
              <span>{new Date(registration.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Items List */}
          {registration.merchandiseItems && registration.merchandiseItems.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Items Purchased:</h3>
              <ul className="space-y-2">
                {registration.merchandiseItems.map((item, idx) => (
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
            </div>
          )}

          {/* Rejection Reason */}
          {registration.paymentStatus === 'Rejected' && registration.paymentRejectionReason && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Payment Rejected</p>
                  <p className="text-sm text-red-700 mt-1">{registration.paymentRejectionReason}</p>
                  <p className="text-xs text-red-600 mt-2">Please upload a new payment proof</p>
                </div>
              </div>
            </div>
          )}

          {/* Approval Info */}
          {registration.paymentStatus === 'Paid' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Payment Approved</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment has been verified and approved
                  </p>
                  {registration.paymentApprovedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Approved on {new Date(registration.paymentApprovedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {registration.paymentStatus !== 'Paid' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Payment Screenshot</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Please upload a clear screenshot/photo of your payment transaction. Supported formats: JPG, PNG, PDF (Max: 5MB)
              </p>
            </div>

            {/* File Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Payment Proof
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedFile ? 'Preview' : 'Current Payment Proof'}
                </label>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Payment proof preview"
                    className="w-full max-h-96 object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}

            {/* Upload Info */}
            {registration.paymentProofUploadedAt && (
              <p className="text-xs text-gray-500 mb-4">
                Last uploaded: {new Date(registration.paymentProofUploadedAt).toLocaleString()}
              </p>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || (!selectedFile && registration.paymentProof)}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : selectedFile ? 'Upload Payment Proof' : 'Select a file to upload'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Upload a clear screenshot of your payment transaction</li>
            <li>Make sure transaction details are visible (amount, date, reference number)</li>
            <li>Accepted formats: JPG, PNG, PDF (Max size: 5MB)</li>
            <li>Your proof will be reviewed by the event organizer</li>
            <li>You'll receive an email once your payment is approved or rejected</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofUploadPage;
