import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ENDPOINTS ============

export const authAPI = {
  // Participant signup
  signup: (data) => api.post('/auth/signup', data),
  
  // Participant login
  login: (data) => api.post('/auth/login', data),
  
  // Participant onboarding (IIIT/Non-IIIT specific data)
  onboarding: (data) => api.post('/auth/onboarding', data),
  
  // Organizer login
  organizerLogin: (data) => api.post('/auth/organizer/login', data),
  
  // Admin login
  adminLogin: (data) => api.post('/auth/admin/login', data),
  
  // Request password reset (organizer)
  requestPasswordReset: (data) => api.post('/auth/organizer/request-password-reset', data),
  
  // Get current user profile
  getProfile: () => api.get('/auth/me'),
  
  // Logout (client-side only, no backend endpoint needed)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ============ PARTICIPANT ENDPOINTS ============

export const participantAPI = {
  // Get all events (with filters)
  getEvents: (params) => api.get('/participant/events', { params }),
  
  // Get trending events (Top 5/24h)
  getTrendingEvents: () => api.get('/events/trending'),
  
  // Search events
  searchEvents: (params) => api.get('/participant/events/search', { params }),
  
  // Get event details
  getEventDetails: (eventId) => api.get(`/participant/events/${eventId}`),
  
  // Register for event
  registerForEvent: (eventId, data) => api.post(`/participant/events/${eventId}/register`, data),
  
  // Get my registrations
  getMyRegistrations: (params) => api.get('/participant/registrations', { params }),
  
  // Get registration details
  getRegistrationDetails: (registrationId) => api.get(`/participant/registrations/${registrationId}`),
  
  // Get QR code
  getQRCode: (registrationId) => api.get(`/participant/registrations/${registrationId}/qr`),
  
  // Get my purchased merchandise
  getMyMerchandise: () => api.get('/participant/merchandise'),
  
  // Get registration by ID
  getRegistrationById: (registrationId) => api.get(`/participant/registrations/${registrationId}`),
  
  // Upload payment proof
  uploadPaymentProof: (registrationId, formData) => api.post(`/participant/registrations/${registrationId}/payment-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Feedback
  submitFeedback: (eventId, data) => api.post(`/participant/events/${eventId}/feedback`, data),
  getFeedbackStats: (eventId) => api.get(`/participant/events/${eventId}/feedback-stats`),
  
  // Discussions
  postMessage: (eventId, data) => api.post(`/participant/events/${eventId}/discussions`, data),
  getDiscussions: (eventId) => api.get(`/participant/events/${eventId}/discussions`),
  deleteMessage: (discussionId) => api.delete(`/participant/discussions/${discussionId}`),
};

// ============ ORGANIZER ENDPOINTS ============

export const organizerAPI = {
  // Dashboard stats
  getDashboard: () => api.get('/organizer/dashboard'),
  
  // Get registrations for my events
  getEventRegistrations: (params) => api.get('/organizer/registrations', { params }),
  
  // Export registrations as CSV
  exportRegistrations: (eventId) => api.get(`/organizer/registrations/export/${eventId}`, {
    responseType: 'blob',
  }),
  
  // Mark attendance
  markAttendance: (data) => api.post('/organizer/registrations/mark-attendance', data),
  
  // Event management
  createEvent: (data) => api.post('/organizer/events', data),
  getMyEvents: (params) => api.get('/organizer/events', { params }),
  getEventById: (eventId) => api.get(`/organizer/events/${eventId}`),
  updateEvent: (eventId, data) => api.put(`/organizer/events/${eventId}`, data),
  deleteEvent: (eventId) => api.delete(`/organizer/events/${eventId}`),
  
  // Event status management
  publishEvent: (eventId) => api.patch(`/organizer/events/${eventId}/publish`),
  cancelEvent: (eventId) => api.patch(`/organizer/events/${eventId}/cancel`),
  completeEvent: (eventId) => api.patch(`/organizer/events/${eventId}/complete`),
  
  // QR Scanner & Attendance
  markAttendance: (eventId, data) => api.post(`/organizer/events/${eventId}/scan-qr`, data),
  getAttendanceStats: (eventId) => api.get(`/organizer/events/${eventId}/attendance`),
  toggleAttendance: (eventId, registrationId, data) => api.put(`/organizer/events/${eventId}/attendance/${registrationId}`, data),
  
  // Payment Approvals
  getPendingPayments: (eventId) => api.get(`/organizer/events/${eventId}/payment-approvals`),
  approvePayment: (registrationId) => api.put(`/organizer/registrations/${registrationId}/approve-payment`),
  rejectPayment: (registrationId, data) => api.put(`/organizer/registrations/${registrationId}/reject-payment`, data),
  
  // Feedback
  getEventFeedback: (eventId) => api.get(`/organizer/events/${eventId}/feedback`),
  
  // Discussions
  postOrganizerMessage: (eventId, data) => api.post(`/organizer/events/${eventId}/discussions`, data),
  getOrganizerDiscussions: (eventId) => api.get(`/organizer/events/${eventId}/discussions`),
};

// ============ ADMIN ENDPOINTS ============

export const adminAPI = {
  // Dashboard stats
  getDashboard: () => api.get('/admin/dashboard'),
  
  // Organizer management
  createOrganizer: (data) => api.post('/admin/organizers/create', data),
  getPendingOrganizers: () => api.get('/admin/organizers/pending'),
  approveOrganizer: (organizerId) => api.patch(`/admin/organizers/${organizerId}/approve`),
  rejectOrganizer: (organizerId) => api.delete(`/admin/organizers/${organizerId}`),
  getAllOrganizers: (params) => api.get('/admin/organizers', { params }),
  getOrganizerById: (organizerId) => api.get(`/admin/organizers/${organizerId}`),
  deleteOrganizer: (organizerId) => api.delete(`/admin/organizers/${organizerId}`),
  disableOrganizer: (organizerId) => api.put(`/admin/organizers/${organizerId}/disable`),
  enableOrganizer: (organizerId) => api.put(`/admin/organizers/${organizerId}/enable`),
  
  // Event management
  getAllEvents: (params) => api.get('/admin/events', { params }),
  deleteEvent: (eventId) => api.delete(`/admin/events/${eventId}`),
  
  // Password Reset Requests
  getPasswordResetRequests: (params) => api.get('/admin/password-reset-requests', { params }),
  approvePasswordReset: (requestId) => api.put(`/admin/password-reset-requests/${requestId}/approve`),
  rejectPasswordReset: (requestId, data) => api.put(`/admin/password-reset-requests/${requestId}/reject`, data),
};

// ============ FILE UPLOAD ENDPOINTS ============

export const uploadAPI = {
  // Upload single file
  uploadFile: (file, fieldName = 'file') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Upload multiple files
  uploadFiles: (files, fieldName = 'files') => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append(fieldName, file);
    });
    return api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
