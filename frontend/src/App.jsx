import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import OrganizerPasswordResetPage from './pages/OrganizerPasswordResetPage';

// Participant Pages
import ParticipantEventsPage from './pages/participant/EventsPage';
import ParticipantEventDetailsPage from './pages/participant/EventDetailsPage';
import ParticipantEventRegistrationPage from './pages/participant/EventRegistrationPage';
import ParticipantRegistrationsPage from './pages/participant/RegistrationsPage';
import ParticipantPaymentProofUploadPage from './pages/participant/PaymentProofUploadPage';
import ParticipantDiscussionForumPage from './pages/participant/DiscussionForumPage';
import ParticipantFeedbackPage from './pages/participant/FeedbackPage';

// Organizer Pages
import OrganizerDashboardPage from './pages/organizer/DashboardPage';
import OrganizerEventsPage from './pages/organizer/EventsPage';
import OrganizerCreateEditEventPage from './pages/organizer/CreateEditEventPage';
import OrganizerQRScannerPage from './pages/organizer/QRScannerPage';
import OrganizerAttendanceListPage from './pages/organizer/AttendanceListPage';
import OrganizerPaymentApprovalsPage from './pages/organizer/PaymentApprovalsPage';
import OrganizerFeedbackViewPage from './pages/organizer/FeedbackViewPage';
import OrganizerDiscussionPage from './pages/organizer/OrganizerDiscussionPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminOrganizersPage from './pages/admin/OrganizersPage';
import AdminEventsPage from './pages/admin/EventsPage';
import AdminPasswordResetRequestsPage from './pages/admin/PasswordResetRequestsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/organizer/reset-password" element={<PublicRoute><OrganizerPasswordResetPage /></PublicRoute>} />

          {/* Onboarding Route - Protected but allows unonboarded participants */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <OnboardingPage />
              </ProtectedRoute>
            } 
          />

          {/* Participant Routes */}
          <Route 
            path="/participant/events" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantEventsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/events/:eventId" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantEventDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/events/:eventId/register" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantEventRegistrationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/registrations" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantRegistrationsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/registrations/:registrationId/payment-proof" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantPaymentProofUploadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/events/:eventId/discussion" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantDiscussionForumPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/participant/events/:eventId/feedback" 
            element={
              <ProtectedRoute allowedRoles={['participant']}>
                <ParticipantFeedbackPage />
              </ProtectedRoute>
            } 
          />

          {/* Organizer Routes */}
          <Route 
            path="/organizer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerEventsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/create" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerCreateEditEventPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/:eventId/edit" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerCreateEditEventPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/:eventId/qr-scanner" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerQRScannerPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/:eventId/attendance" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerAttendanceListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/:eventId/payment-approvals" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerPaymentApprovalsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/:eventId/feedback" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerFeedbackViewPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/events/:eventId/discussion" 
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDiscussionPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/organizers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOrganizersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/events" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEventsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/password-reset-requests" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPasswordResetRequestsPage />
              </ProtectedRoute>
            } 
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
