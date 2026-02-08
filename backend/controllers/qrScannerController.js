const Registration = require('../models/Registration');
const Event = require('../models/Event');

/**
 * @desc    Mark attendance by scanning QR code
 * @route   POST /api/organizer/events/:eventId/scan-qr
 * @access  Private (Organizer only)
 */
const markAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { qrData, manualOverride } = req.body;

    // Validate QR data
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required',
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format',
      });
    }

    const { ticketId, eventId: qrEventId, participantId } = parsedData;

    // Check if event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to scan QR codes for this event',
      });
    }

    // Verify event ID matches OR manual override is enabled
    if (qrEventId !== eventId) {
      if (!manualOverride) {
        return res.status(400).json({
          success: false,
          message: 'QR code is for a different event. Enable manual override to proceed.',
          requiresOverride: true,
          qrEventId,
          expectedEventId: eventId,
        });
      }

      // Log manual override usage
      console.warn('🔴 MANUAL OVERRIDE USED:', {
        timestamp: new Date().toISOString(),
        organizerId: req.user._id,
        organizerEmail: req.user.email,
        eventId,
        qrEventId,
        ticketId,
        reason: 'QR code event mismatch - manual override applied',
      });
    }

    // Find registration by ticket ID
    const registration = await Registration.findOne({
      ticketId,
      eventId: manualOverride ? { $in: [eventId, qrEventId] } : eventId,
      participantId,
    }).populate('participantId', 'firstName lastName email rollNumber');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Check if already marked
    if (registration.attendanceMarked) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked',
        markedAt: registration.attendanceTimestamp,
        participant: {
          name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
          email: registration.participantId.email,
        },
      });
    }

    // Mark attendance
    registration.attendanceMarked = true;
    registration.attendanceTimestamp = new Date();
    registration.manualOverride = manualOverride || false;
    registration.overrideBy = manualOverride ? req.user._id : null;
    await registration.save();

    // Log audit trail
    if (manualOverride) {
      console.log('📝 AUDIT LOG - Manual Override Attendance:', {
        timestamp: new Date().toISOString(),
        action: 'MANUAL_ATTENDANCE_OVERRIDE',
        organizerId: req.user._id,
        organizerEmail: req.user.email,
        eventId,
        ticketId,
        participantId,
        participantName: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        reason: 'QR event mismatch',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      manualOverride: manualOverride || false,
      registration: {
        ticketId: registration.ticketId,
        participantName: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        email: registration.participantId.email,
        rollNumber: registration.participantId.rollNumber,
        registrationType: registration.registrationType,
        markedAt: registration.attendanceTimestamp,
      },
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get attendance statistics for an event
 * @route   GET /api/organizer/events/:eventId/attendance
 * @access  Private (Organizer only)
 */
const getAttendanceStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view attendance for this event',
      });
    }

    // Get all registrations
    const totalRegistrations = await Registration.countDocuments({
      eventId,
      participationStatus: 'Registered',
    });

    // Get attended count
    const attendedCount = await Registration.countDocuments({
      eventId,
      participationStatus: 'Registered',
      attendanceMarked: true,
    });

    // Get detailed attendance list
    const attendanceList = await Registration.find({
      eventId,
      participationStatus: 'Registered',
    })
      .populate('participantId', 'firstName lastName email rollNumber')
      .select('ticketId attendanceMarked attendanceTimestamp registrationType')
      .sort({ attendanceTimestamp: -1 });

    res.status(200).json({
      success: true,
      stats: {
        totalRegistrations,
        attendedCount,
        absentCount: totalRegistrations - attendedCount,
        attendanceRate: totalRegistrations > 0 
          ? ((attendedCount / totalRegistrations) * 100).toFixed(2) 
          : 0,
      },
      attendanceList: attendanceList.map(reg => ({
        ticketId: reg.ticketId,
        participantName: reg.participantId 
          ? `${reg.participantId.firstName} ${reg.participantId.lastName}` 
          : 'N/A',
        email: reg.participantId?.email || 'N/A',
        rollNumber: reg.participantId?.rollNumber || 'N/A',
        registrationType: reg.registrationType,
        attended: reg.attendanceMarked,
        markedAt: reg.attendanceTimestamp || null,
      })),
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Manually mark/unmark attendance
 * @route   PUT /api/organizer/events/:eventId/attendance/:registrationId
 * @access  Private (Organizer only)
 */
const toggleAttendance = async (req, res) => {
  try {
    const { eventId, registrationId } = req.params;
    const { attendanceMarked } = req.body;

    // Check if event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify attendance for this event',
      });
    }

    // Find and update registration
    const registration = await Registration.findOne({
      _id: registrationId,
      eventId,
    }).populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    registration.attendanceMarked = attendanceMarked;
    registration.attendanceTimestamp = attendanceMarked ? new Date() : null;
    await registration.save();

    res.status(200).json({
      success: true,
      message: `Attendance ${attendanceMarked ? 'marked' : 'unmarked'} successfully`,
      registration: {
        ticketId: registration.ticketId,
        participantName: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        attended: registration.attendanceMarked,
        markedAt: registration.attendanceTimestamp,
      },
    });
  } catch (error) {
    console.error('Toggle attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  markAttendance,
  getAttendanceStats,
  toggleAttendance,
};
