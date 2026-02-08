const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDatabase = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDatabase();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/participant', require('./routes/participantRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/organizers', require('./routes/organizerRoutes'));
app.use('/api/organizer', require('./routes/organizerDashboardRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Home route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Felicity Event Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
    },
  });
});

// 404 handler - route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

// Initialize Socket.io for real-time discussions
const { initializeSocket } = require('./config/socket');
initializeSocket(server);
console.log('🔌 Socket.io initialized for real-time discussions');

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  // Close server and exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
