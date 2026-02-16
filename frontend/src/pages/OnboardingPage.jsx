import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizerAPI } from '../services/api';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { completeOnboarding, user } = useAuth();

  const [formData, setFormData] = useState({
    areasOfInterest: [],
    followedClubs: [],
  });
  const [organizers, setOrganizers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const interestCategories = [
    'Technical',
    'Cultural',
    'Sports',
    'Literary',
    'Arts',
    'Gaming',
    'Social',
    'Academic',
    'Other',
  ];

  useEffect(() => {
    // If already onboarded, redirect
    if (user?.isOnboarded) {
      navigate('/participant/events');
    }
  }, [user, navigate]);

  const toggleInterest = (category) => {
    setFormData(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(category)
        ? prev.areasOfInterest.filter(c => c !== category)
        : [...prev.areasOfInterest, category],
    }));
  };

  const toggleClub = (clubId) => {
    setFormData(prev => ({
      ...prev,
      followedClubs: prev.followedClubs.includes(clubId)
        ? prev.followedClubs.filter(c => c !== clubId)
        : [...prev.followedClubs, clubId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const result = await completeOnboarding({
      areasOfInterest: formData.areasOfInterest,
      followedClubs: formData.followedClubs,
    });

    setLoading(false);

    if (result.success) {
      navigate('/participant/events');
    } else {
      setErrors({ submit: result.error });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Felicity!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tell us what you're interested in so we can personalize your experience
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          {/* Areas of Interest */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your areas of interest
            </label>
            <div className="grid grid-cols-2 gap-3">
              {interestCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleInterest(category)}
                  className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.areasOfInterest.includes(category)
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-700 hover:border-primary-400'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/participant/events')}
              className="flex-1 btn-secondary"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
