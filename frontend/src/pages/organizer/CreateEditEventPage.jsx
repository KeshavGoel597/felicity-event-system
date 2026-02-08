import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Plus, X, Save } from 'lucide-react';

const CreateEditEventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(eventId);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'Normal',
    category: '',
    eventDate: '',
    registrationDeadline: '',
    location: '',
    maxParticipants: '',
    registrationFee: 0,
    rules: '',
    bannerImage: '',
    customFormFields: [],
    merchandiseItems: [],
  });

  const categories = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Competition', 'Other'];

  useEffect(() => {
    if (isEditMode) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getEventById(eventId);
      const event = response.data.data;
      
      // Format dates for input fields
      setFormData({
        ...event,
        eventDate: new Date(event.eventDate).toISOString().slice(0, 16),
        registrationDeadline: new Date(event.registrationDeadline).toISOString().slice(0, 16),
        customFormFields: event.customFormFields || [],
        merchandiseItems: event.merchandiseItems || [],
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  // Custom Form Fields Management
  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFormFields: [
        ...prev.customFormFields,
        { label: '', type: 'text', required: false },
      ],
    }));
  };

  const updateCustomField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customFormFields: prev.customFormFields.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFormFields: prev.customFormFields.filter((_, i) => i !== index),
    }));
  };

  // Merchandise Items Management
  const addMerchandiseItem = () => {
    setFormData(prev => ({
      ...prev,
      merchandiseItems: [
        ...prev.merchandiseItems,
        { name: '', description: '', price: 0 },
      ],
    }));
  };

  const updateMerchandiseItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      merchandiseItems: prev.merchandiseItems.map((item, i) =>
        i === index ? { ...item, [field]: field === 'price' ? Number(value) : value } : item
      ),
    }));
  };

  const removeMerchandiseItem = (index) => {
    setFormData(prev => ({
      ...prev,
      merchandiseItems: prev.merchandiseItems.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Event name is required');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!formData.category) {
      setError('Category is required');
      return false;
    }
    if (!formData.eventDate) {
      setError('Event date is required');
      return false;
    }
    if (!formData.registrationDeadline) {
      setError('Registration deadline is required');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }
    if (!formData.maxParticipants || formData.maxParticipants < 1) {
      setError('Max participants must be at least 1');
      return false;
    }
    if (formData.eventType === 'Merchandise' && formData.merchandiseItems.length === 0) {
      setError('At least one merchandise item is required for Merchandise events');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const submitData = {
        ...formData,
        customFormFields: formData.customFormFields.filter(f => f.label.trim()),
        merchandiseItems: formData.eventType === 'Merchandise' 
          ? formData.merchandiseItems.filter(m => m.name.trim())
          : undefined,
      };

      if (isEditMode) {
        await organizerAPI.updateEvent(eventId, submitData);
      } else {
        await organizerAPI.createEvent(submitData);
      }

      navigate('/organizer/events');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/organizer/events')}
            className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to My Events
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isEditMode ? 'Update event details' : 'Fill in the details to create a new event'}
          </p>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Event Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., Tech Talk on AI"
                  />
                </div>

                <div>
                  <label className="label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field"
                    rows={4}
                    required
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Event Type *</label>
                    <select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value="Normal">Normal Event</option>
                      <option value="Merchandise">Merchandise Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Location */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Date & Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Event Date & Time *</label>
                  <input
                    type="datetime-local"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">Registration Deadline *</label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="label">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., Auditorium, IIIT Hyderabad"
                  />
                </div>
              </div>
            </div>

            {/* Capacity & Fees */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Capacity & Fees</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Max Participants *</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="label">Registration Fee (₹)</label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={formData.registrationFee}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Rules & Banner */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Rules & Guidelines</label>
                  <textarea
                    name="rules"
                    value={formData.rules}
                    onChange={handleChange}
                    className="input-field"
                    rows={4}
                    placeholder="Add any rules or guidelines for participants..."
                  />
                </div>

                <div>
                  <label className="label">Banner Image URL</label>
                  <input
                    type="url"
                    name="bannerImage"
                    value={formData.bannerImage}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Custom Form Fields */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Custom Form Fields</h2>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="btn-secondary text-sm"
                  disabled={formData.customFormLocked}
                >
                  <Plus className="w-4 h-4 mr-1 inline" />
                  Add Field
                </button>
              </div>

              {formData.customFormLocked && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 text-sm flex items-center">
                    <span className="mr-2">🔒</span>
                    <strong>Custom form is locked.</strong> The form cannot be modified because participants have already registered. This protects existing participant data.
                  </p>
                </div>
              )}

              {formData.customFormFields.length === 0 ? (
                <p className="text-gray-600 text-sm">
                  No custom fields added. Click "Add Field" to collect additional information from participants.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.customFormFields.map((field, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="label text-sm">Field Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                            className="input-field"
                            placeholder="e.g., T-shirt Size"
                            disabled={formData.customFormLocked}
                          />
                        </div>
                        <div>
                          <label className="label text-sm">Field Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                            className="input-field"
                            disabled={formData.customFormLocked}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="textarea">Textarea</option>
                            <option value="file">File Upload</option>
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                              className="w-4 h-4"
                              disabled={formData.customFormLocked}
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeCustomField(index)}
                            className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={formData.customFormLocked}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Merchandise Items (only for Merchandise events) */}
            {formData.eventType === 'Merchandise' && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Merchandise Items *</h2>
                  <button
                    type="button"
                    onClick={addMerchandiseItem}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1 inline" />
                    Add Item
                  </button>
                </div>

                {formData.merchandiseItems.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    No merchandise items added. Add at least one item for merchandise events.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.merchandiseItems.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="label text-sm">Item Name</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateMerchandiseItem(index, 'name', e.target.value)}
                              className="input-field"
                              placeholder="e.g., Event T-Shirt"
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateMerchandiseItem(index, 'description', e.target.value)}
                              className="input-field"
                              placeholder="Optional"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <label className="label text-sm">Price (₹)</label>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updateMerchandiseItem(index, 'price', e.target.value)}
                                className="input-field"
                                min="0"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMerchandiseItem(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/organizer/events')}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-primary"
              >
                <Save className="w-4 h-4 mr-2 inline" />
                {submitting 
                  ? 'Saving...' 
                  : isEditMode 
                  ? 'Update Event' 
                  : 'Create Event'}
              </button>
            </div>

            {!isEditMode && (
              <p className="text-sm text-gray-600 text-center">
                Note: Your event will be saved as a draft. You can publish it later from the My Events page.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEditEventPage;
