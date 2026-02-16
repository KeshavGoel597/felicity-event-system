const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Registration = require('../models/Registration');

/**
 * @desc    Get participant profile
 * @route   GET /api/participant/profile
 * @access  Private (Participant only)
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followedClubs', 'organizerName category')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update participant profile
 * @route   PUT /api/participant/profile
 * @access  Private (Participant only)
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, contactNumber, collegeName } = req.body;

    // Find user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update allowed fields only
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (contactNumber) user.contactNumber = contactNumber;
    if (collegeName !== undefined) user.collegeName = collegeName;

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(user._id)
      .populate('followedClubs', 'organizerName category')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update participant preferences (areas of interest, followed clubs)
 * @route   PUT /api/participant/preferences
 * @access  Private (Participant only)
 */
const updatePreferences = async (req, res) => {
  try {
    const { areasOfInterest, followedClubs } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update areas of interest
    if (areasOfInterest !== undefined) {
      if (!Array.isArray(areasOfInterest)) {
        return res.status(400).json({
          success: false,
          message: 'Areas of interest must be an array',
        });
      }
      user.areasOfInterest = areasOfInterest;
    }

    // Update followed clubs
    if (followedClubs !== undefined) {
      if (!Array.isArray(followedClubs)) {
        return res.status(400).json({
          success: false,
          message: 'Followed clubs must be an array',
        });
      }

      // Verify all organizer IDs exist and are approved
      if (followedClubs.length > 0) {
        const organizers = await Organizer.find({
          _id: { $in: followedClubs },
          isApproved: true,
        });

        if (organizers.length !== followedClubs.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more organizer IDs are invalid or not approved',
          });
        }
      }

      user.followedClubs = followedClubs;
    }

    await user.save();

    // Return updated user
    const updatedUser = await User.findById(user._id)
      .populate('followedClubs', 'organizerName category')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Change participant password
 * @route   POST /api/participant/change-password
 * @access  Private (Participant only)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password',
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Find user with password field
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordMatch = await user.matchPassword(currentPassword);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get participant dashboard
 * @route   GET /api/participant/dashboard
 * @access  Private (Participant only)
 */
const getDashboard = async (req, res) => {
  try {
    const currentDate = new Date();

    // Fetch all registrations for the logged-in participant
    const registrations = await Registration.find({
      participantId: req.user._id,
    })
      .populate({
        path: 'eventId',
        select: 'eventName eventType eventStartDate eventEndDate organizerId',
        populate: {
          path: 'organizerId',
          select: 'organizerName',
        },
      })
      .sort({ registrationDate: -1 });

    // Categorize registrations
    const upcomingEvents = [];
    const participationHistory = {
      normal: [],
      merchandise: [],
      completed: [],
      cancelledRejected: [],
    };

    registrations.forEach((registration) => {
      // Skip if event was deleted
      if (!registration.eventId) return;

      const regData = {
        _id: registration._id,
        eventName: registration.eventId.eventName,
        eventType: registration.eventId.eventType,
        organizerName: registration.eventId.organizerId?.organizerName || 'Unknown',
        eventStartDate: registration.eventId.eventStartDate,
        eventEndDate: registration.eventId.eventEndDate,
        registrationDate: registration.registrationDate,
        participationStatus: registration.participationStatus,
        ticketId: registration.ticketId,
        teamName: registration.teamName,
      };

      // Upcoming events: Registered AND event hasn't started yet
      if (
        registration.participationStatus === 'Registered' &&
        registration.eventId.eventStartDate > currentDate
      ) {
        upcomingEvents.push(regData);
      }

      // Categorize by type and status
      if (registration.participationStatus === 'Completed') {
        participationHistory.completed.push(regData);
      } else if (['Cancelled', 'Rejected'].includes(registration.participationStatus)) {
        participationHistory.cancelledRejected.push(regData);
      } else if (registration.registrationType === 'Normal') {
        participationHistory.normal.push(regData);
      } else if (registration.registrationType === 'Merchandise') {
        participationHistory.merchandise.push(regData);
      }
    });

    res.status(200).json({
      success: true,
      upcomingEvents,
      participationHistory,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all registrations for the logged-in participant
 * @route   GET /api/participant/registrations
 * @access  Private (Participant only)
 */
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      participantId: req.user._id,
    })
      .populate({
        path: 'eventId',
        select: 'eventName eventType eventStartDate eventEndDate location organizerId registrationFee',
        populate: {
          path: 'organizerId',
          select: 'organizerName',
        },
      })
      .sort({ registrationDate: -1 });

    const data = registrations.map((reg) => ({
      _id: reg._id,
      event: reg.eventId ? {
        _id: reg.eventId._id,
        eventName: reg.eventId.eventName,
        eventType: reg.eventId.eventType,
        eventStartDate: reg.eventId.eventStartDate,
        eventEndDate: reg.eventId.eventEndDate,
        location: reg.eventId.location,
        registrationFee: reg.eventId.registrationFee,
        organizerName: reg.eventId.organizerId?.organizerName || 'Unknown',
      } : null,
      registrationType: reg.registrationType,
      registrationDate: reg.registrationDate,
      participationStatus: reg.participationStatus,
      paymentStatus: reg.paymentStatus,
      ticketId: reg.ticketId,
      qrCode: reg.qrCode,
      merchandiseDetails: reg.merchandiseDetails,
      attendanceMarked: reg.attendanceMarked,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single registration by ID
 * @route   GET /api/participant/registrations/:registrationId
 * @access  Private (Participant only)
 */
const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.registrationId,
      participantId: req.user._id,
    }).populate({
      path: 'eventId',
      select: 'eventName eventType eventStartDate eventEndDate location organizerId registrationFee',
      populate: {
        path: 'organizerId',
        select: 'organizerName',
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Get registration by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updatePreferences,
  changePassword,
  getDashboard,
  getMyRegistrations,
  getRegistrationById,
};
