import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, QrCode, CheckCircle, XCircle, Download } from 'lucide-react';

const AttendanceListPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [filter, setFilter] = useState('all'); // all, attended, absent

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, attendanceRes] = await Promise.all([
        organizerAPI.getEventById(eventId),
        organizerAPI.getAttendanceStats(eventId),
      ]);
      
      setEvent(eventRes.data.data);
      setAttendanceData(attendanceRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (registrationId, currentStatus) => {
    try {
      await organizerAPI.toggleAttendance(eventId, registrationId, {
        attendanceMarked: !currentStatus,
      });
      setSuccess(`Attendance ${!currentStatus ? 'marked' : 'unmarked'} successfully`);
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update attendance');
    }
  };

  const filteredList = attendanceData?.attendanceList.filter(item => {
    if (filter === 'attended') return item.attended;
    if (filter === 'absent') return !item.attended;
    return true;
  }) || [];

  const downloadCSV = () => {
    const headers = ['Ticket ID', 'Name', 'Email', 'Roll Number', 'Type', 'Attended', 'Marked At'];
    const rows = attendanceData.attendanceList.map(item => [
      item.ticketId,
      item.participantName,
      item.email,
      item.rollNumber || 'N/A',
      item.registrationType,
      item.attended ? 'Yes' : 'No',
      item.markedAt ? new Date(item.markedAt).toLocaleString() : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${event?.eventName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <h1 className="text-2xl font-bold text-gray-900">Attendance List</h1>
              <p className="text-sm text-gray-600">{event?.eventName}</p>
            </div>
            <button
              onClick={() => navigate(`/organizer/events/${eventId}/qr-scanner`)}
              className="btn-primary flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Open Scanner
            </button>
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
        {attendanceData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">Total Registered</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendanceData.stats.totalRegistrations}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
              <p className="text-sm text-gray-600">Attended</p>
              <p className="text-2xl font-bold text-green-600">
                {attendanceData.stats.attendedCount}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600">
                {attendanceData.stats.absentCount}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {attendanceData.stats.attendanceRate}%
              </p>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({attendanceData?.attendanceList.length || 0})
              </button>
              <button
                onClick={() => setFilter('attended')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'attended'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Attended ({attendanceData?.stats.attendedCount || 0})
              </button>
              <button
                onClick={() => setFilter('absent')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'absent'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Absent ({attendanceData?.stats.absentCount || 0})
              </button>
            </div>

            <button
              onClick={downloadCSV}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marked At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredList.map((item) => (
                  <tr key={item.ticketId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.ticketId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.participantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.registrationType === 'Normal'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {item.registrationType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.attended ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Attended</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Absent</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.markedAt ? new Date(item.markedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleAttendance(item.ticketId, item.attended)}
                        className={`px-3 py-1 rounded-lg text-white transition-colors ${
                          item.attended
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {item.attended ? 'Unmark' : 'Mark'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredList.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No registrations found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceListPage;
