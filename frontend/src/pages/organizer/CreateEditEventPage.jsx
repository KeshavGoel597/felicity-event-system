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
    eventName: '',
    eventDescription: '',
    eventType: 'Normal',
    eligibility: 'Open to All',
    eventStartDate: '',
    eventEndDate: '',
    registrationDeadline: '',
    location: '',
    registrationLimit: '',
    registrationFee: 0,
    eventTags: [],
    customForm: [],
    merchandiseItems: [],
    purchaseLimitPerParticipant: '',
  });

  const eligibilityOptions = ['Open to All', 'IIIT Only'];

  useEffect(() => {
    if (isEditMode) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getEventById(eventId);
      const event = response.data.event;

      // Format dates for datetime-local input using LOCAL time (not UTC)
      const toLocalDatetime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        // Build YYYY-MM-DDTHH:MM in local timezone
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      setFormData({
        ...event,
        eventStartDate: toLocalDatetime(event.eventStartDate),
        eventEndDate: toLocalDatetime(event.eventEndDate),
        registrationDeadline: toLocalDatetime(event.registrationDeadline),
        customForm: event.customForm || [],
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
      customForm: [
        ...prev.customForm,
        { fieldLabel: '', fieldType: 'text', isRequired: false, options: [], order: prev.customForm.length },
      ],
    }));
  };

  const updateCustomField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customForm: prev.customForm.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customForm: prev.customForm.filter((_, i) => i !== index),
    }));
  };

  // Merchandise Items Management
  const addMerchandiseItem = () => {
    setFormData(prev => ({
      ...prev,
      merchandiseItems: [
        ...prev.merchandiseItems,
        { itemName: '', price: 0, stockQuantity: 0, sizes: [], colors: [], variants: [] },
      ],
    }));
  };

  const updateMerchandiseItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      merchandiseItems: prev.merchandiseItems.map((item, i) =>
        i === index ? { ...item, [field]: ['price', 'stockQuantity'].includes(field) ? Number(value) : value } : item
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
    if (!formData.eventName?.trim()) {
      setError('Event name is required');
      return false;
    }
    if (!formData.eventType) {
      setError('Event type is required');
      return false;
    }
    // For creating, we only need name and type (draft mode)
    // Full validation happens on publish (backend)
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const submitData = {
        eventName: formData.eventName,
        eventDescription: formData.eventDescription,
        eventType: formData.eventType,
        eligibility: formData.eligibility,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        registrationDeadline: formData.registrationDeadline,
        location: formData.location,
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : undefined,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        eventTags: formData.eventTags,
      };

      // Include custom form or merchandise items based on event type
      if (formData.eventType === 'Normal') {
        submitData.customForm = formData.customForm.filter(f => f.fieldLabel?.trim());
      } else if (formData.eventType === 'Merchandise') {
        submitData.merchandiseItems = formData.merchandiseItems.filter(m => m.itemName?.trim());
        if (formData.purchaseLimitPerParticipant) {
          submitData.purchaseLimitPerParticipant = parseInt(formData.purchaseLimitPerParticipant);
        }
      }

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
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleChange}
                    className="input-field"
                    required
                    placeholder="e.g., Tech Talk on AI"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    name="eventDescription"
                    value={formData.eventDescription}
                    onChange={handleChange}
                    className="input-field"
                    rows={4}
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
                    <label className="label">Eligibility</label>
                    <select
                      name="eligibility"
                      value={formData.eligibility}
                      onChange={handleChange}
                      className="input-field"
                    >
                      {eligibilityOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
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
                  <label className="label">Event Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="eventStartDate"
                    value={formData.eventStartDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Event End Date & Time</label>
                  <input
                    type="datetime-local"
                    name="eventEndDate"
                    value={formData.eventEndDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="input-field"
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
                  <label className="label">Registration Limit</label>
                  <input
                    type="number"
                    name="registrationLimit"
                    value={formData.registrationLimit}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    placeholder="Leave empty for unlimited"
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

              {/* Event Tags */}
              <div className="mt-4">
                <label className="label">Event Tags (comma-separated)</label>
                <input
                  type="text"
                  value={(formData.eventTags || []).join(', ')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    eventTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                  }))}
                  className="input-field"
                  placeholder="e.g., hackathon, AI, workshop, beginner-friendly"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tags help participants discover your event through search and filtering
                </p>
              </div>
            </div>

            {/* Custom Form Fields (for Normal events) */}
            {formData.eventType === 'Normal' && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Custom Form Fields</h2>
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="btn-secondary text-sm"
                    disabled={formData.isFormLocked}
                  >
                    <Plus className="w-4 h-4 mr-1 inline" />
                    Add Field
                  </button>
                </div>

                {formData.isFormLocked && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm flex items-center">
                      <span className="mr-2">🔒</span>
                      <strong>Custom form is locked.</strong> The form cannot be modified because participants have already registered.
                    </p>
                  </div>
                )}

                {formData.customForm.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    No custom fields added. Click "Add Field" to collect additional information from participants.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.customForm.map((field, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="label text-sm">Field Label</label>
                            <input
                              type="text"
                              value={field.fieldLabel}
                              onChange={(e) => updateCustomField(index, 'fieldLabel', e.target.value)}
                              className="input-field"
                              placeholder="e.g., T-shirt Size"
                              disabled={formData.isFormLocked}
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Field Type</label>
                            <select
                              value={field.fieldType}
                              onChange={(e) => updateCustomField(index, 'fieldType', e.target.value)}
                              className="input-field"
                              disabled={formData.isFormLocked}
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="number">Number</option>
                              <option value="email">Email</option>
                              <option value="date">Date</option>
                              <option value="dropdown">Dropdown</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="radio">Radio</option>
                              <option value="file">File Upload</option>
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={field.isRequired}
                                onChange={(e) => updateCustomField(index, 'isRequired', e.target.checked)}
                                className="w-4 h-4"
                                disabled={formData.isFormLocked}
                              />
                              <span className="text-sm text-gray-700">Required</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeCustomField(index)}
                              className="ml-auto p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={formData.isFormLocked}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {['dropdown', 'checkbox', 'radio'].includes(field.fieldType) && (
                          <div className="mt-3">
                            <label className="label text-sm">Options (semicolon-separated)</label>
                            <input
                              type="text"
                              value={field._rawOptions !== undefined ? field._rawOptions : (field.options || []).join('; ')}
                              onChange={(e) => {
                                const raw = e.target.value;
                                // Store raw text for editing, parse options for data
                                const parsed = raw.split(';').map(o => o.trim()).filter(Boolean);
                                updateCustomField(index, 'options', parsed);
                                updateCustomField(index, '_rawOptions', raw);
                              }}
                              onBlur={(e) => {
                                // On blur, clean up: re-join parsed options
                                const parsed = (field.options || []).filter(Boolean);
                                updateCustomField(index, '_rawOptions', undefined);
                                updateCustomField(index, 'options', parsed);
                              }}
                              className="input-field"
                              placeholder="e.g., Option A; Option B; Option C"
                              disabled={formData.isFormLocked}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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

                {/* Purchase Limit */}
                <div className="mb-4">
                  <label className="label">Purchase Limit Per Participant</label>
                  <input
                    type="number"
                    name="purchaseLimitPerParticipant"
                    value={formData.purchaseLimitPerParticipant}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    placeholder="Leave empty for unlimited"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum total items a single participant can purchase
                  </p>
                </div>

                {formData.merchandiseItems.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    No merchandise items added. Add at least one item for merchandise events.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.merchandiseItems.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="label text-sm">Item Name</label>
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => updateMerchandiseItem(index, 'itemName', e.target.value)}
                              className="input-field"
                              placeholder="e.g., Event T-Shirt"
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Price (₹)</label>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateMerchandiseItem(index, 'price', e.target.value)}
                              className="input-field"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Stock Quantity</label>
                            <input
                              type="number"
                              value={item.stockQuantity}
                              onChange={(e) => updateMerchandiseItem(index, 'stockQuantity', e.target.value)}
                              className="input-field"
                              min="0"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeMerchandiseItem(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                          <div>
                            <label className="label text-sm">Sizes (comma-separated)</label>
                            <input
                              type="text"
                              value={(item.sizes || []).join(', ')}
                              onChange={(e) => updateMerchandiseItem(index, 'sizes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              className="input-field"
                              placeholder="e.g., S, M, L, XL"
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Colors (comma-separated)</label>
                            <input
                              type="text"
                              value={(item.colors || []).join(', ')}
                              onChange={(e) => updateMerchandiseItem(index, 'colors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              className="input-field"
                              placeholder="e.g., Red, Blue, Black"
                            />
                          </div>
                          <div>
                            <label className="label text-sm">Variants (comma-separated)</label>
                            <input
                              type="text"
                              value={(item.variants || []).join(', ')}
                              onChange={(e) => updateMerchandiseItem(index, 'variants', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              className="input-field"
                              placeholder="e.g., V-Neck, Round Neck"
                            />
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
