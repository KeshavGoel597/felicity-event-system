import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Save, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const OrganizerProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    organizerName: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhook: '',
  });

  const categories = [
    'Technical', 'Cultural', 'Sports', 'Literary', 'Arts', 'Gaming', 'Social', 'Academic', 'Other',
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getProfile();
      const org = response.data.organizer;
      setProfile(org);
      setFormData({
        organizerName: org.organizerName || '',
        category: org.category || '',
        description: org.description || '',
        contactEmail: org.contactEmail || '',
        contactNumber: org.contactNumber || '',
        discordWebhook: org.discordWebhook || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await organizerAPI.updateProfile(formData);
      setSuccess('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/organizer/dashboard')}
            className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Organizer Profile</h2>

        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

        {/* Non-editable */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Login Email (non-editable)</h3>
          <p className="font-medium text-gray-900">{profile?.loginEmail}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Organizer Name</label>
            <input
              type="text"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows={4}
              placeholder="Describe your club or organization..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Discord Webhook */}
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">Discord Webhook</h3>
            </div>
            <p className="text-sm text-indigo-700 mb-3">
              When you publish a new event, a notification will be automatically sent to your Discord channel via this webhook.
            </p>
            <input
              type="url"
              name="discordWebhook"
              value={formData.discordWebhook}
              onChange={handleChange}
              className="input-field"
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            <Save className="w-4 h-4 mr-2 inline" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizerProfilePage;
