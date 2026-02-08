import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, QrCode, CheckCircle, XCircle, Users } from 'lucide-react';

const QRScannerPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanner, setScanner] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);

  useEffect(() => {
    fetchEventDetails();
    fetchAttendanceStats();
    initializeScanner();

    return () => {
      // Cleanup scanner on unmount
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getEventById(eventId);
      setEvent(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const response = await organizerAPI.getAttendanceStats(eventId);
      setAttendanceStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch attendance stats:', err);
    }
  };

  const initializeScanner = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    try {
      setError('');
      setSuccess('');
      setScanResult({ scanning: true });

      const response = await organizerAPI.markAttendance(eventId, {
        qrData: decodedText,
      });

      setScanResult({
        success: true,
        data: response.data.registration,
      });
      setSuccess(`Attendance marked for ${response.data.registration.participantName}`);
      
      // Refresh stats
      fetchAttendanceStats();

      // Clear result after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setSuccess('');
      }, 3000);

    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to mark attendance';
      setError(errorMsg);
      setScanResult({
        success: false,
        error: errorMsg,
        data: err.response?.data?.participant,
      });
    }
  };

  const onScanError = (errorMessage) => {
    // Suppress continuous scan errors in console
    // console.log(errorMessage);
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
                <QrCode className="w-7 h-7 text-primary-600" />
                QR Scanner
              </h1>
              <p className="text-sm text-gray-600">{event?.eventName}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Alerts */}
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}
          {success && (
            <Alert type="success" message={success} onClose={() => setSuccess('')} />
          )}

          {/* Attendance Stats */}
          {attendanceStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Registered</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {attendanceStats.totalRegistrations}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attended</p>
                    <p className="text-2xl font-bold text-green-600">
                      {attendanceStats.attendedCount}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">
                      {attendanceStats.absentCount}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {attendanceStats.attendanceRate}%
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center bg-purple-100 rounded-full">
                    <span className="text-purple-600 font-bold text-sm">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Scan Participant QR Code</h2>
            
            <div className="mb-6">
              <div 
                id="qr-reader" 
                className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
              />
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className={`p-4 rounded-lg ${
                scanResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {scanResult.success ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      scanResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {scanResult.success ? 'Attendance Marked!' : 'Scan Failed'}
                    </h3>
                    {scanResult.data && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p><strong>Name:</strong> {scanResult.data.participantName || scanResult.data.name}</p>
                        <p><strong>Email:</strong> {scanResult.data.email}</p>
                        {scanResult.data.rollNumber && (
                          <p><strong>Roll Number:</strong> {scanResult.data.rollNumber}</p>
                        )}
                        {scanResult.data.markedAt && (
                          <p><strong>Marked At:</strong> {new Date(scanResult.data.markedAt).toLocaleString()}</p>
                        )}
                      </div>
                    )}
                    {scanResult.error && (
                      <p className="mt-1 text-sm text-red-700">{scanResult.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Allow camera access when prompted</li>
                <li>Hold the participant's QR code in front of the camera</li>
                <li>The QR code will be scanned automatically</li>
                <li>Attendance will be marked instantly</li>
                <li>Each QR code can only be scanned once</li>
              </ul>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => navigate(`/organizer/events/${eventId}/attendance`)}
                className="btn-secondary flex-1"
              >
                View Full Attendance List
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerPage;
