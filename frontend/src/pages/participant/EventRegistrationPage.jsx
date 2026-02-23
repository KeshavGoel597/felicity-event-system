import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { participantAPI, uploadAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Alert from '../../components/Alert';
import { ArrowLeft, Upload, X, CheckCircle } from 'lucide-react';
import { formatCurrency, validateFileSize, validateFileType } from '../../utils/helpers';

const EventRegistrationPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    customFormResponses: {},
    merchandiseSelections: [],
  });

  const [fileUploads, setFileUploads] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await participantAPI.getEventDetails(eventId);
      setEvent(response.data.data);
      
      // Initialize form data
      if (response.data.data.eventType === 'Merchandise') {
        setFormData(prev => ({
          ...prev,
          merchandiseSelections: response.data.data.merchandiseItems?.map(item => ({
            merchandiseId: item._id,
            itemName: item.itemName,
            quantity: 0,
            price: item.price,
            sizes: item.sizes || [],
            colors: item.colors || [],
            variants: item.variants || [],
            selectedSize: '',
            selectedColor: '',
            selectedVariant: '',
          })) || [],
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFieldChange = (fieldLabel, value) => {
    setFormData(prev => ({
      ...prev,
      customFormResponses: {
        ...prev.customFormResponses,
        [fieldLabel]: value,
      },
    }));
  };

  const handleFileChange = async (fieldLabel, file) => {
    if (!file) {
      setFileUploads(prev => {
        const updated = { ...prev };
        delete updated[fieldLabel];
        return updated;
      });
      return;
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 
                          'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'text/plain'];
    
    if (!validateFileType(file, allowedTypes)) {
      setError('Invalid file type. Allowed: JPEG, PNG, PDF, DOC, DOCX, TXT');
      return;
    }

    if (!validateFileSize(file, 5)) {
      setError('File size must be less than 5MB');
      return;
    }

    // Upload file
    try {
      setUploadProgress(prev => ({ ...prev, [fieldLabel]: 'uploading' }));
      const response = await uploadAPI.uploadFile(file, 'file');
      const filePath = response.data.data.filePath;
      
      setFileUploads(prev => ({ ...prev, [fieldLabel]: filePath }));
      setUploadProgress(prev => ({ ...prev, [fieldLabel]: 'success' }));
      
      // Add to form data
      handleCustomFieldChange(fieldLabel, filePath);
    } catch (err) {
      setError(err.response?.data?.message || 'File upload failed');
      setUploadProgress(prev => ({ ...prev, [fieldLabel]: 'error' }));
    }
  };

  const handleMerchandiseFieldChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      merchandiseSelections: prev.merchandiseSelections.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleMerchandiseQuantityChange = (index, quantity) => {
    setFormData(prev => ({
      ...prev,
      merchandiseSelections: prev.merchandiseSelections.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(0, parseInt(quantity) || 0) } : item
      ),
    }));
  };

  const calculateTotal = () => {
    let total = event.registrationFee || 0;
    
    if (event.eventType === 'Merchandise') {
      const merchandiseTotal = formData.merchandiseSelections.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      total += merchandiseTotal;
    }
    
    return total;
  };

  const validateForm = () => {
    // Check required custom fields
    if (event.customForm) {
      for (const field of event.customForm) {
        if (field.isRequired) {
          const value = formData.customFormResponses[field.fieldLabel];
          if (value === undefined || value === null || value === '') {
            setError(`${field.fieldLabel} is required`);
            return false;
          }
          // For checkbox fields, check if array is empty
          if (Array.isArray(value) && value.length === 0) {
            setError(`${field.fieldLabel} is required`);
            return false;
          }
        }
      }
    }

    // Check merchandise selections
    if (event.eventType === 'Merchandise') {
      const totalItems = formData.merchandiseSelections.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      if (totalItems === 0) {
        setError('Please select at least one merchandise item');
        return false;
      }

      // Validate size/color/variant selections for items with quantity > 0
      for (const item of formData.merchandiseSelections) {
        if (item.quantity > 0) {
          if (item.sizes && item.sizes.length > 0 && !item.selectedSize) {
            setError(`Please select a size for ${item.itemName}`);
            return false;
          }
          if (item.colors && item.colors.length > 0 && !item.selectedColor) {
            setError(`Please select a color for ${item.itemName}`);
            return false;
          }
          if (item.variants && item.variants.length > 0 && !item.selectedVariant) {
            setError(`Please select a variant for ${item.itemName}`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (event.eventType === 'Merchandise') {
        // Build items array for merchandise endpoint
        const items = formData.merchandiseSelections
          .filter(item => item.quantity > 0)
          .map((item) => ({
            merchandiseId: item.merchandiseId,
            quantity: item.quantity,
            size: item.selectedSize || undefined,
            color: item.selectedColor || undefined,
            variant: item.selectedVariant || undefined,
          }));

        await participantAPI.purchaseMerchandise(eventId, { items });
      } else {
        // Normal event registration
        const registrationData = {
          formResponses: formData.customFormResponses,
        };
        await participantAPI.registerForEvent(eventId, registrationData);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Alert type="error" message="Event not found" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {event.eventType === 'Merchandise' ? 'Order Placed!' : 'Registration Successful!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {event.eventType === 'Merchandise' 
              ? `Your merchandise order for ${event.eventName} has been placed. Please upload payment proof from your registrations page. Your ticket with QR code will be issued after payment approval.`
              : `You've successfully registered for ${event.eventName}. Check your email for confirmation and QR code.`
            }
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/participant/registrations')}
              className="btn-primary w-full"
            >
              View My Registrations
            </button>
            <button
              onClick={() => navigate('/participant/events')}
              className="btn-secondary w-full"
            >
              Browse More Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(`/participant/events/${eventId}`)}
            className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Event Details
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register for {event.eventName}
          </h1>
          <p className="text-gray-600 mb-8">
            Fill out the form below to complete your registration
          </p>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Custom Form Fields */}
            {event.customForm && event.customForm.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Additional Information
                </h2>
                <div className="space-y-4">
                  {event.customForm.map((field, index) => (
                    <div key={index}>
                      <label className="label">
                        {field.fieldLabel}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          required={field.isRequired}
                          value={formData.customFormResponses[field.fieldLabel] || ''}
                          onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                          className="input-field"
                        />
                      )}

                      {field.fieldType === 'number' && (
                        <input
                          type="number"
                          required={field.isRequired}
                          value={formData.customFormResponses[field.fieldLabel] || ''}
                          onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                          className="input-field"
                        />
                      )}

                      {field.fieldType === 'textarea' && (
                        <textarea
                          required={field.isRequired}
                          value={formData.customFormResponses[field.fieldLabel] || ''}
                          onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                          className="input-field"
                          rows={4}
                        />
                      )}

                      {field.fieldType === 'dropdown' && (
                        <select
                          required={field.isRequired}
                          value={formData.customFormResponses[field.fieldLabel] || ''}
                          onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                          className="input-field"
                        >
                          <option value="">Select an option</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.fieldType === 'checkbox' && (
                        <div className="space-y-2">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(formData.customFormResponses[field.fieldLabel] || []).includes(opt)}
                                onChange={(e) => {
                                  const current = formData.customFormResponses[field.fieldLabel] || [];
                                  const updated = e.target.checked
                                    ? [...current, opt]
                                    : current.filter(v => v !== opt);
                                  handleCustomFieldChange(field.fieldLabel, updated);
                                }}
                                className="w-4 h-4 text-primary-600 rounded"
                              />
                              <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.fieldType === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`radio-${field.fieldLabel}`}
                                value={opt}
                                checked={formData.customFormResponses[field.fieldLabel] === opt}
                                onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                                className="w-4 h-4 text-primary-600"
                                required={field.isRequired}
                              />
                              <span className="text-sm text-gray-700">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.fieldType === 'email' && (
                        <input
                          type="email"
                          required={field.isRequired}
                          value={formData.customFormResponses[field.fieldLabel] || ''}
                          onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                          className="input-field"
                          placeholder="Enter email address"
                        />
                      )}

                      {field.fieldType === 'date' && (
                        <input
                          type="date"
                          required={field.isRequired}
                          value={formData.customFormResponses[field.fieldLabel] || ''}
                          onChange={(e) => handleCustomFieldChange(field.fieldLabel, e.target.value)}
                          className="input-field"
                        />
                      )}

                      {field.fieldType === 'file' && (
                        <div>
                          <input
                            type="file"
                            required={field.isRequired}
                            onChange={(e) => handleFileChange(field.fieldLabel, e.target.files[0])}
                            className="input-field"
                            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                          />
                          {uploadProgress[field.fieldLabel] === 'uploading' && (
                            <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                          )}
                          {uploadProgress[field.fieldLabel] === 'success' && (
                            <p className="text-sm text-green-600 mt-1 flex items-center">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Uploaded successfully
                            </p>
                          )}
                          {uploadProgress[field.fieldLabel] === 'error' && (
                            <p className="text-sm text-red-600 mt-1">Upload failed</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Max size: 5MB. Allowed: JPEG, PNG, PDF, DOC, DOCX, TXT
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merchandise Selection */}
            {event.eventType === 'Merchandise' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Select Merchandise
                </h2>
                <div className="space-y-3">
                  {formData.merchandiseSelections.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.itemName}</p>
                          <p className="text-sm text-primary-600 font-semibold">
                            {formatCurrency(item.price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-gray-600">Quantity:</label>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleMerchandiseQuantityChange(index, e.target.value)}
                            className="w-20 input-field"
                          />
                          {item.quantity > 0 && (
                            <span className="text-sm font-medium text-gray-900">
                              = {formatCurrency(item.price * item.quantity)}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Size / Color / Variant selectors */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {item.sizes && item.sizes.length > 0 && (
                          <div>
                            <label className="label text-sm">Size</label>
                            <select
                              value={item.selectedSize || ''}
                              onChange={(e) => handleMerchandiseFieldChange(index, 'selectedSize', e.target.value)}
                              className="input-field"
                            >
                              <option value="">Select size</option>
                              {item.sizes.map((s, i) => (
                                <option key={i} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {item.colors && item.colors.length > 0 && (
                          <div>
                            <label className="label text-sm">Color</label>
                            <select
                              value={item.selectedColor || ''}
                              onChange={(e) => handleMerchandiseFieldChange(index, 'selectedColor', e.target.value)}
                              className="input-field"
                            >
                              <option value="">Select color</option>
                              {item.colors.map((c, i) => (
                                <option key={i} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        {item.variants && item.variants.length > 0 && (
                          <div>
                            <label className="label text-sm">Variant</label>
                            <select
                              value={item.selectedVariant || ''}
                              onChange={(e) => handleMerchandiseFieldChange(index, 'selectedVariant', e.target.value)}
                              className="input-field"
                            >
                              <option value="">Select variant</option>
                              {item.variants.map((v, i) => (
                                <option key={i} value={v}>{v}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div className="card bg-primary-50 border-2 border-primary-600">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Registration Summary
              </h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-700">
                  <span>Event:</span>
                  <span className="font-medium">{event.eventName}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Registration Fee:</span>
                  <span className="font-medium">{formatCurrency(event.registrationFee || 0)}</span>
                </div>
                {event.eventType === 'Merchandise' && (
                  <>
                    {formData.merchandiseSelections
                      .filter(item => item.quantity > 0)
                      .map((item, index) => (
                        <div key={index} className="flex justify-between text-gray-700">
                          <span>{item.itemName} x {item.quantity}:</span>
                          <span className="font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                  </>
                )}
                <div className="border-t-2 border-primary-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary"
              >
                {submitting ? 'Processing...' : `Pay ${formatCurrency(calculateTotal())} & Register`}
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                By registering, you agree to the event rules and regulations
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationPage;
