const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Discussion = require('../models/Discussion');
const Registration = require('../models/Registration');

let io;

/**
 * Initialize Socket.io server
 */
const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user (participant or organizer)
      let user = await User.findById(decoded.id);
      if (!user) {
        user = await Organizer.findById(decoded.id);
      }

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.user = user;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Join event discussion room
    socket.on('join-discussion', async ({ eventId }) => {
      try {
        // Verify user can access this discussion
        if (socket.userRole === 'participant') {
          const registration = await Registration.findOne({
            eventId,
            participantId: socket.userId,
          });

          if (!registration) {
            socket.emit('error', { message: 'You must be registered for this event to join discussion' });
            return;
          }
        }

        // Join room
        socket.join(`event-${eventId}`);
        console.log(`User ${socket.userId} joined discussion room: event-${eventId}`);
        
        socket.emit('joined-discussion', { eventId, message: 'Successfully joined discussion' });
      } catch (error) {
        console.error('Join discussion error:', error);
        socket.emit('error', { message: 'Failed to join discussion' });
      }
    });

    // Leave discussion room
    socket.on('leave-discussion', ({ eventId }) => {
      socket.leave(`event-${eventId}`);
      console.log(`User ${socket.userId} left discussion room: event-${eventId}`);
    });

    // Send message
    socket.on('send-message', async ({ eventId, message }) => {
      try {
        // Verify user can send messages
        let isOrganizer = false;
        
        if (socket.userRole === 'participant') {
          const registration = await Registration.findOne({
            eventId,
            participantId: socket.userId,
          });

          if (!registration) {
            socket.emit('error', { message: 'You must be registered to send messages' });
            return;
          }
        } else if (socket.userRole === 'organizer') {
          isOrganizer = true;
        }

        // Create discussion message
        const discussion = await Discussion.create({
          event: eventId,
          participant: socket.userId,
          message: message.trim(),
          isOrganizer,
        });

        // Populate user details
        await discussion.populate('participant', 'firstName lastName email');

        // Broadcast to all users in the room
        io.to(`event-${eventId}`).emit('new-message', {
          _id: discussion._id,
          event: discussion.event,
          participant: discussion.participant,
          message: discussion.message,
          isOrganizer: discussion.isOrganizer,
          createdAt: discussion.createdAt,
        });

        console.log(`Message sent in event-${eventId} by user ${socket.userId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Delete message
    socket.on('delete-message', async ({ eventId, messageId }) => {
      try {
        const discussion = await Discussion.findById(messageId);

        if (!discussion) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Only message owner can delete
        if (discussion.participant.toString() !== socket.userId) {
          socket.emit('error', { message: 'Not authorized to delete this message' });
          return;
        }

        await discussion.deleteOne();

        // Broadcast deletion to all users in the room
        io.to(`event-${eventId}`).emit('message-deleted', { messageId });

        console.log(`Message ${messageId} deleted from event-${eventId}`);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ eventId, isTyping }) => {
      socket.to(`event-${eventId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.firstName
          ? `${socket.user.firstName} ${socket.user.lastName}`
          : socket.user.organizerName || 'Unknown',
        isTyping,
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
