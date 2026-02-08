import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    // If participant hasn't completed onboarding, redirect to onboarding
    if (user?.role === 'participant' && !user?.isOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }

    // Redirect to role-specific dashboard
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'organizer':
        return <Navigate to="/organizer/dashboard" replace />;
      case 'participant':
        return <Navigate to="/participant/events" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PublicRoute;
