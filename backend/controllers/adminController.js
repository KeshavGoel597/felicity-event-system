const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get admin dashboard with statistics and recent activities
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin only)
 */
const getDashboard = async (req, res) => {
  try {
    // Count total participants
    const totalParticipants = await User.countDocuments();

    // Count total organizers
    const totalOrganizers = await Organizer.countDocuments();

    // Count total events (all statuses)
    const totalEvents = await Event.countDocuments();

    // Get recent activities (last 10 of each type, then merge and sort)
    
    // Recent participant registrations
    const recentRegistrations = await Registration.find()
      .sort({ registrationDate: -1 })
      .limit(10)
      .populate('participantId', 'firstName lastName email')
      .populate('eventId', 'eventName')
      .lean();

    const registrationActivities = recentRegistrations.map((reg) => ({
      type: 'registration',
      date: reg.registrationDate,
      description: `${reg.participantId?.firstName || 'User'} ${reg.participantId?.lastName || ''} registered for ${reg.eventId?.eventName || 'an event'}`,
      participant: reg.participantId
        ? `${reg.participantId.firstName} ${reg.participantId.lastName}`
        : 'Unknown',
      event: reg.eventId?.eventName || 'Unknown Event',
    }));

    // Recent event creations
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('organizerId', 'organizerName')
      .lean();

    const eventActivities = recentEvents.map((event) => ({
      type: 'event',
      date: event.createdAt,
      description: `New event "${event.eventName}" created by ${event.organizerId?.organizerName || 'Unknown Organizer'}`,
      eventName: event.eventName,
      organizer: event.organizerId?.organizerName || 'Unknown',
      status: event.status,
    }));

    // Recent organizer creations
    const recentOrganizers = await Organizer.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const organizerActivities = recentOrganizers.map((org) => ({
      type: 'organizer',
      date: org.createdAt,
      description: `New organizer "${org.organizerName}" (${org.category}) created`,
      organizerName: org.organizerName,
      category: org.category,
    }));

    // Merge all activities and sort by date (newest first)
    const allActivities = [
      ...registrationActivities,
      ...eventActivities,
      ...organizerActivities,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Take top 10 recent activities
    const recentActivities = allActivities.slice(0, 10);

    res.status(200).json({
      success: true,
      totalParticipants,
      totalOrganizers,
      totalEvents,
      recentActivities,
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Create a new organizer
 * @route   POST /api/admin/organizers/create
 * @access  Private (Admin only)
 */
const createOrganizer = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
    } = req.body;

    // Validate required fields
    if (!organizerName || !category) {
      return res.status(400).json({
        success: false,
        message: 'Organizer name and category are required',
      });
    }

    // Auto-generate login email from organizer name
    // e.g. "Tech Club" -> "techclub@felicity.iiit.ac.in"
    const generateLoginEmail = (name) => {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .substring(0, 20);
      return `${slug}@felicity.iiit.ac.in`;
    };

    let orgLoginEmail = generateLoginEmail(organizerName);

    // Ensure uniqueness by appending a number if needed
    let existingOrganizer = await Organizer.findOne({ loginEmail: orgLoginEmail });
    let counter = 1;
    while (existingOrganizer) {
      orgLoginEmail = generateLoginEmail(organizerName + counter);
      existingOrganizer = await Organizer.findOne({ loginEmail: orgLoginEmail });
      counter++;
    }

    // Generate random password (8-12 characters)
    const generatePassword = () => {
      const length = Math.floor(Math.random() * 5) + 8; // 8-12 characters
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*';
      const allChars = uppercase + lowercase + numbers + symbols;

      let password = '';
      // Ensure at least one of each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];

      // Fill the rest randomly
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }

      // Shuffle the password
      return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
    };

    const generatedPassword = generatePassword();

    // Create organizer
    const organizer = new Organizer({
      organizerName,
      category,
      description: description || '',
      loginEmail: orgLoginEmail,
      contactEmail: contactEmail || orgLoginEmail,
      contactNumber: contactNumber || '',
      password: generatedPassword, // Will be hashed by pre-save hook
      isApproved: true,
      createdBy: req.user._id,
    });

    await organizer.save();

    res.status(201).json({
      success: true,
      message: 'Organizer created successfully',
      organizer: {
        _id: organizer._id,
        organizerName: organizer.organizerName,
        category: organizer.category,
        loginEmail: organizer.loginEmail,
        contactEmail: organizer.contactEmail,
      },
      credentials: {
        loginEmail: orgLoginEmail,
        password: generatedPassword, // Return plain password only once
      },
      warning:
        'IMPORTANT: Save these credentials securely. Password cannot be retrieved later.',
    });
  } catch (error) {
    console.error('Create organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all organizers
 * @route   GET /api/admin/organizers
 * @access  Private (Admin only)
 */
const getAllOrganizers = async (req, res) => {
  try {
    const organizers = await Organizer.find()
      .select(
        'organizerName category loginEmail contactEmail isApproved createdAt'
      )
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    console.error('Get all organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get organizer details
 * @route   GET /api/admin/organizers/:organizerId
 * @access  Private (Admin only)
 */
const getOrganizerDetails = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId)
      .select('-password')
      .lean();

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    // Count events created by this organizer
    const eventCount = await Event.countDocuments({
      organizerId: organizer._id,
    });

    res.status(200).json({
      success: true,
      organizer: {
        ...organizer,
        eventCount,
      },
    });
  } catch (error) {
    console.error('Get organizer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Disable organizer account
 * @route   PUT /api/admin/organizers/:organizerId/disable
 * @access  Private (Admin only)
 */
const disableOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (!organizer.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Organizer is already disabled',
      });
    }

    organizer.isApproved = false;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Organizer disabled successfully',
      organizer: {
        _id: organizer._id,
        organizerName: organizer.organizerName,
        isApproved: organizer.isApproved,
      },
    });
  } catch (error) {
    console.error('Disable organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Enable organizer account
 * @route   PUT /api/admin/organizers/:organizerId/enable
 * @access  Private (Admin only)
 */
const enableOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (organizer.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Organizer is already enabled',
      });
    }

    organizer.isApproved = true;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Organizer enabled successfully',
      organizer: {
        _id: organizer._id,
        organizerName: organizer.organizerName,
        isApproved: organizer.isApproved,
      },
    });
  } catch (error) {
    console.error('Enable organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete organizer (soft delete - disable recommended)
 * @route   DELETE /api/admin/organizers/:organizerId
 * @access  Private (Admin only)
 */
const deleteOrganizer = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    // Check if organizer has events
    const eventCount = await Event.countDocuments({
      organizerId: organizer._id,
    });

    if (eventCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete organizer with ${eventCount} events. Consider disabling instead.`,
        recommendation: 'Use PUT /api/admin/organizers/:id/disable',
      });
    }

    // Delete organizer
    await Organizer.findByIdAndDelete(req.params.organizerId);

    res.status(200).json({
      success: true,
      message: 'Organizer deleted successfully',
    });
  } catch (error) {
    console.error('Delete organizer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset organizer password
 * @route   PUT /api/admin/organizers/:organizerId/reset-password
 * @access  Private (Admin only)
 */
const resetOrganizerPassword = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    // Generate new random password
    const generatePassword = () => {
      const length = Math.floor(Math.random() * 5) + 8;
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*';
      const allChars = uppercase + lowercase + numbers + symbols;

      let password = '';
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += numbers[Math.floor(Math.random() * numbers.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];

      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }

      return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
    };

    const newPassword = generatePassword();

    // Update password (will be hashed by pre-save hook)
    organizer.password = newPassword;
    await organizer.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      organizer: {
        _id: organizer._id,
        organizerName: organizer.organizerName,
        loginEmail: organizer.loginEmail,
      },
      credentials: {
        loginEmail: organizer.loginEmail,
        newPassword: newPassword,
      },
      warning: 'IMPORTANT: Save this password securely. It cannot be retrieved later.',
    });
  } catch (error) {
    console.error('Reset organizer password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all events (for admin monitoring)
 * @route   GET /api/admin/events
 * @access  Private (Admin only)
 */
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizerId', 'organizerName category')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  createOrganizer,
  getAllOrganizers,
  getOrganizerDetails,
  disableOrganizer,
  enableOrganizer,
  deleteOrganizer,
  resetOrganizerPassword,
  getAllEvents,
};
