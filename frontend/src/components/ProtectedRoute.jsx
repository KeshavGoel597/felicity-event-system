import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if organizer is disabled
  if (user?.role === 'organizer' && user?.status === 'Disabled') {
    // Clear auth and redirect to login
    return <Navigate to="/login" state={{ error: 'Your organizer account has been disabled. Please contact admin.' }} replace />;
  }

  // Check if user needs to complete onboarding (for participants)
  if (user?.role === 'participant' && !user?.isOnboarded) {
    // Allow access to onboarding page
    if (location.pathname === '/onboarding') {
      return children;
    }
    // Redirect to onboarding if not completed
    return <Navigate to="/onboarding" replace />;
  }

  // Check role-based access if allowedRoles specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getDashboardPath(user?.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Helper function to get dashboard path based on role
const getDashboardPath = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'organizer':
      return '/organizer/dashboard';
    case 'participant':
      return '/participant/events';
    default:
      return '/';
  }
};

export default ProtectedRoute;
