import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    participantType: 'IIIT', // IIIT or Non-IIIT
    // IIIT-specific fields
    rollNumber: '',
    // Non-IIIT-specific fields
    collegeName: '',
    city: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleTypeSelection = (type) => {
    setFormData({
      ...formData,
      participantType: type,
      // Clear fields for other type
      rollNumber: type === 'IIIT' ? formData.rollNumber : '',
      collegeName: type === 'Non-IIIT' ? formData.collegeName : '',
      city: type === 'Non-IIIT' ? formData.city : '',
    });
    setStep(2);
  };

  const validate = () => {
    const newErrors = {};

    if (formData.participantType === 'IIIT') {
      if (!formData.rollNumber.trim()) {
        newErrors.rollNumber = 'Roll number is required';
      }
    } else {
      if (!formData.collegeName.trim()) {
        newErrors.collegeName = 'College name is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const onboardingData = {
      participantType: formData.participantType,
    };

    if (formData.participantType === 'IIIT') {
      onboardingData.rollNumber = formData.rollNumber;
    } else {
      onboardingData.collegeName = formData.collegeName;
      onboardingData.city = formData.city;
    }

    const result = await completeOnboarding(onboardingData);

    setLoading(false);

    if (result.success) {
      // Redirect to events page
      navigate('/participant/events');
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tell us a bit more about yourself
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-center text-gray-700 font-medium">
              Are you a student of IIIT Hyderabad?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleTypeSelection('IIIT')}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🎓</div>
                  <div className="font-semibold">Yes, I'm from IIIT</div>
                </div>
              </button>
              <button
                onClick={() => handleTypeSelection('Non-IIIT')}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-primary-600 hover:bg-primary-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🌍</div>
                  <div className="font-semibold">No, I'm from outside</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {errors.submit}
              </div>
            )}

            <div className="space-y-4">
              {formData.participantType === 'IIIT' ? (
                <div>
                  <label htmlFor="rollNumber" className="label">
                    Roll Number
                  </label>
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className={`input-field ${errors.rollNumber ? 'input-error' : ''}`}
                    placeholder="e.g., 2021101001"
                  />
                  {errors.rollNumber && (
                    <p className="error-message">{errors.rollNumber}</p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="collegeName" className="label">
                      College Name
                    </label>
                    <input
                      id="collegeName"
                      name="collegeName"
                      type="text"
                      required
                      value={formData.collegeName}
                      onChange={handleChange}
                      className={`input-field ${errors.collegeName ? 'input-error' : ''}`}
                      placeholder="Your college name"
                    />
                    {errors.collegeName && (
                      <p className="error-message">{errors.collegeName}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="city" className="label">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className={`input-field ${errors.city ? 'input-error' : ''}`}
                      placeholder="Your city"
                    />
                    {errors.city && <p className="error-message">{errors.city}</p>}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 btn-secondary"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
