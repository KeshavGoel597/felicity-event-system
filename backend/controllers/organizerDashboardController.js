const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const { sendDiscordNotification } = require('../utils/discordService');

/**
 * @desc    Get organizer dashboard with events and analytics
 * @route   GET /api/organizer/dashboard
 * @access  Private (Organizer only)
 */
const getDashboard = async (req, res) => {
  try {
    // Find all events created by logged-in organizer
    const events = await Event.find({ organizerId: req.user._id })
      .select('eventName eventType status eventStartDate eventEndDate registrationFee currentRegistrations registrationLimit eligibility eventDescription merchandiseItems purchaseLimitPerParticipant')
      .sort({ createdAt: -1 });

    // Auto-compute event statuses based on dates
    await Event.autoUpdateStatuses(events);

    // Augment each event with actual registration counts from Registration collection
    const eventIds = events.map((e) => e._id);
    const regCounts = await Registration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      {
        $group: {
          _id: '$eventId',
          totalRegistrations: { $sum: 1 },
          paidRegistrations: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, 1, 0] },
          },
          pendingRegistrations: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'Pending'] }, 1, 0] },
          },
        },
      },
    ]);

    const regCountMap = {};
    for (const rc of regCounts) {
      regCountMap[rc._id.toString()] = rc;
    }

    // Convert to plain objects for augmentation
    const eventsData = events.map((event) => {
      const obj = event.toObject();
      const rc = regCountMap[obj._id.toString()];
      obj.actualRegistrations = rc ? rc.totalRegistrations : 0;
      obj.paidRegistrations = rc ? rc.paidRegistrations : 0;
      obj.pendingRegistrations = rc ? rc.pendingRegistrations : 0;
      return obj;
    });

    // Calculate analytics for COMPLETED events only
    const completedEvents = await Event.find({
      organizerId: req.user._id,
      status: 'Completed',
    }).select('_id registrationFee eventType');

    const completedEventIds = completedEvents.map((e) => e._id);

    let totalRegistrations = 0;
    let totalRevenue = 0;
    let totalAttendance = 0;

    if (completedEventIds.length > 0) {
      // Get all registrations for completed events
      const registrations = await Registration.find({
        eventId: { $in: completedEventIds },
      });

      totalRegistrations = registrations.length;

      // Calculate attendance
      totalAttendance = registrations.filter((r) => r.attendanceMarked).length;

      // Calculate revenue: for merchandise events, sum item prices; for normal events use registrationFee
      for (const registration of registrations) {
        if (registration.paymentStatus === 'Paid') {
          const event = completedEvents.find(
            (e) => e._id.toString() === registration.eventId.toString()
          );
          if (event) {
            if (event.eventType === 'Merchandise' && registration.merchandiseDetails && registration.merchandiseDetails.length > 0) {
              totalRevenue += registration.merchandiseDetails.reduce(
                (sum, item) => sum + (item.price * item.quantity), 0
              );
            } else {
              totalRevenue += event.registrationFee || 0;
            }
          }
        }
      }
    }

    const averageAttendanceRate =
      totalRegistrations > 0
        ? ((totalAttendance / totalRegistrations) * 100).toFixed(2)
        : 0;

    res.status(200).json({
      success: true,
      events: eventsData,
      analytics: {
        totalRegistrations,
        totalRevenue,
        totalAttendance,
        averageAttendanceRate: parseFloat(averageAttendanceRate),
      },
    });
  } catch (error) {
    console.error('Get organizer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get organizer profile
 * @route   GET /api/organizer/profile
 * @access  Private (Organizer only)
 */
const getProfile = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      organizer,
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update organizer profile
 * @route   PUT /api/organizer/profile
 * @access  Private (Organizer only)
 */
const updateProfile = async (req, res) => {
  try {
    const {
      organizerName,
      category,
      description,
      contactEmail,
      contactNumber,
      discordWebhook,
    } = req.body;

    const organizer = await Organizer.findById(req.user._id);

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    // Update allowed fields
    if (organizerName) organizer.organizerName = organizerName;
    if (category) organizer.category = category;
    if (description !== undefined) organizer.description = description;
    if (contactEmail !== undefined) organizer.contactEmail = contactEmail;
    if (contactNumber !== undefined) organizer.contactNumber = contactNumber;
    if (discordWebhook !== undefined) organizer.discordWebhook = discordWebhook;

    await organizer.save();

    // Return updated organizer without password
    const updatedOrganizer = await Organizer.findById(organizer._id).select(
      '-password'
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      organizer: updatedOrganizer,
    });
  } catch (error) {
    console.error('Update organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ongoing events
 * @route   GET /api/organizer/events/ongoing
 * @access  Private (Organizer only)
 */
const getOngoingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organizerId: req.user._id,
      status: 'Ongoing',
    }).sort({ eventStartDate: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Get ongoing events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  getOngoingEvents,
};
