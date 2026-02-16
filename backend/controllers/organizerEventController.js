const Event = require('../models/Event');
const Registration = require('../models/Registration');
const { sendDiscordNotification } = require('../utils/discordService');
const { Parser } = require('json2csv');

/**
 * @desc    Create event in draft mode
 * @route   POST /api/organizer/events/create
 * @access  Private (Organizer only)
 */
const createEvent = async (req, res) => {
  try {
    const { eventName, eventType } = req.body;

    // Validate required fields
    if (!eventName || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event name and event type are required',
      });
    }

    // Validate event type
    if (!['Normal', 'Merchandise'].includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Event type must be either Normal or Merchandise',
      });
    }

    // Create event in draft mode
    const event = new Event({
      eventName,
      eventType,
      organizerId: req.user._id,
      status: 'Draft',
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created as draft',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/organizer/events/:eventId
 * @access  Private (Organizer only)
 */
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to logged-in organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Check event status and apply editing rules
    if (['Ongoing', 'Completed', 'Closed'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit event in ${event.status} status. Use status change endpoint instead.`,
      });
    }

    // Check if trying to modify locked custom form
    if (req.body.customForm && event.isFormLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify custom form after first registration. The form has been locked to protect existing participant data.',
      });
    }

    if (event.status === 'Draft') {
      // Allow editing ALL fields for draft events
      const allowedUpdates = [
        'eventName',
        'eventDescription',
        'eventType',
        'eligibility',
        'registrationDeadline',
        'eventStartDate',
        'eventEndDate',
        'location',
        'registrationFee',
        'registrationLimit',
        'customForm',
        'merchandiseItems',
        'eventBanner',
      ];

      allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) {
          event[field] = req.body[field];
        }
      });
    } else if (event.status === 'Published') {
      // For published events, only allow specific fields

      // 1. eventDescription
      if (req.body.eventDescription !== undefined) {
        event.eventDescription = req.body.eventDescription;
      }

      // 2. registrationDeadline - can only extend, not shorten
      if (req.body.registrationDeadline) {
        const newDeadline = new Date(req.body.registrationDeadline);
        const currentDeadline = new Date(event.registrationDeadline);

        if (newDeadline < currentDeadline) {
          return res.status(400).json({
            success: false,
            message: 'Cannot shorten registration deadline for published event',
          });
        }

        event.registrationDeadline = newDeadline;
      }

      // 3. registrationLimit - can only increase, not decrease
      if (req.body.registrationLimit) {
        if (req.body.registrationLimit < event.registrationLimit) {
          return res.status(400).json({
            success: false,
            message: 'Cannot decrease participant limit for published event',
          });
        }

        event.registrationLimit = req.body.registrationLimit;
      }

      // Reject any other field updates
      const attemptedUpdates = Object.keys(req.body);
      const allowedForPublished = [
        'eventDescription',
        'registrationDeadline',
        'registrationLimit',
      ];

      const illegalUpdates = attemptedUpdates.filter(
        (key) => !allowedForPublished.includes(key)
      );

      if (illegalUpdates.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot edit fields: ${illegalUpdates.join(', ')} for published event`,
        });
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Publish event
 * @route   POST /api/organizer/events/:eventId/publish
 * @access  Private (Organizer only)
 */
const publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate(
      'organizerId',
      'organizerName discordWebhook'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to organizer
    if (event.organizerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this event',
      });
    }

    // Check event status is 'Draft'
    if (event.status !== 'Draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot publish event in ${event.status} status`,
      });
    }

    // Validate all required fields
    const requiredFields = [
      'eventName',
      'eventDescription',
      'eventType',
      'eligibility',
      'registrationDeadline',
      'eventStartDate',
      'eventEndDate',
      'registrationFee',
    ];

    const missingFields = requiredFields.filter((field) => !event[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Event type specific validations
    if (event.eventType === 'Normal') {
      if (!event.customForm || event.customForm.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Normal events must have at least one custom form field',
        });
      }
    } else if (event.eventType === 'Merchandise') {
      if (!event.merchandiseItems || event.merchandiseItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Merchandise events must have at least one merchandise item',
        });
      }

      // Validate each merchandise item
      for (const item of event.merchandiseItems) {
        if (!item.itemName || item.price === undefined || item.stockQuantity === undefined) {
          return res.status(400).json({
            success: false,
            message: 'All merchandise items must have name, price, and stock',
          });
        }

        if (item.price < 0 || item.stockQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: 'Price and stock cannot be negative',
          });
        }
      }
    }

    // Date validations
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    const startDate = new Date(event.eventStartDate);
    const endDate = new Date(event.eventEndDate);

    if (deadline <= now) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline must be in the future',
      });
    }

    if (deadline >= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline must be before event start date',
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Event end date must be after start date',
      });
    }

    // Update status to Published
    event.status = 'Published';
    await event.save();

    // Send Discord notification if webhook is configured
    if (event.organizerId.discordWebhook) {
      try {
        const registrationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/participant/events/${event._id}`;
        
        await sendDiscordNotification(
          event.organizerId.discordWebhook,
          {
            eventName: event.eventName,
            eventDescription: event.eventDescription,
            eventType: event.eventType,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            registrationDeadline: event.registrationDeadline,
            registrationFee: event.registrationFee,
            eligibility: event.eligibility,
            location: event.location,
          },
          registrationLink
        );
        
        console.log(`✅ Discord notification sent for event: ${event.eventName}`);
      } catch (discordError) {
        console.error('Discord notification failed:', discordError);
        // Don't fail the publish if Discord fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Event published successfully',
      event,
    });
  } catch (error) {
    console.error('Publish event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Change event status
 * @route   PUT /api/organizer/events/:eventId/status
 * @access  Private (Organizer only)
 */
const changeEventStatus = async (req, res) => {
  try {
    const { newStatus } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: 'New status is required',
      });
    }

    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change this event status',
      });
    }

    // Validate status transitions
    const currentStatus = event.status;

    const validTransitions = {
      Published: ['Ongoing', 'Closed'],
      Ongoing: ['Completed', 'Closed'],
      Draft: ['Closed'],
      Completed: ['Closed'],
    };

    // Allow closing from any status
    if (newStatus === 'Closed') {
      event.status = newStatus;
    } else {
      // Check if transition is valid
      const allowedStatuses = validTransitions[currentStatus] || [];

      if (!allowedStatuses.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${currentStatus} to ${newStatus}`,
        });
      }

      event.status = newStatus;
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event status updated successfully',
      event,
    });
  } catch (error) {
    console.error('Change event status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get event details for organizer
 * @route   GET /api/organizer/events/:eventId/details
 * @access  Private (Organizer only)
 */
const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this event',
      });
    }

    // Calculate analytics
    const registrations = await Registration.find({ eventId: event._id });

    const totalRegistrations = registrations.length;
    const paidRegistrations = registrations.filter(
      (r) => r.paymentStatus === 'Paid'
    ).length;
    const revenue = paidRegistrations * (event.registrationFee || 0);
    const attendance = registrations.filter((r) => r.attendanceMarked).length;

    const analytics = {
      totalRegistrations,
      paidRegistrations,
      revenue,
      attendance,
      teamCompletion: null, // For future implementation
    };

    res.status(200).json({
      success: true,
      event,
      analytics,
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Add or update custom form
 * @route   PUT /api/organizer/events/:eventId/custom-form
 * @access  Private (Organizer only)
 */
const updateCustomForm = async (req, res) => {
  try {
    const { customForm } = req.body;

    if (!customForm || !Array.isArray(customForm)) {
      return res.status(400).json({
        success: false,
        message: 'Custom form must be an array',
      });
    }

    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Check event type is Normal
    if (event.eventType !== 'Normal') {
      return res.status(400).json({
        success: false,
        message: 'Custom forms are only for Normal event types',
      });
    }

    // Check if form is locked
    if (event.isFormLocked) {
      return res.status(400).json({
        success: false,
        message: 'Form is locked. Cannot edit after first registration.',
      });
    }

    // Validate each field
    const validFieldTypes = [
      'text',
      'textarea',
      'number',
      'email',
      'date',
      'dropdown',
      'checkbox',
      'radio',
      'file',
    ];

    for (let i = 0; i < customForm.length; i++) {
      const field = customForm[i];

      if (!field.fieldType || !validFieldTypes.includes(field.fieldType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid field type at index ${i}`,
        });
      }

      if (!field.fieldLabel) {
        return res.status(400).json({
          success: false,
          message: `Field label is required at index ${i}`,
        });
      }

      if (['dropdown', 'checkbox', 'radio'].includes(field.fieldType)) {
        if (!field.options || !Array.isArray(field.options) || field.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Field at index ${i} must have at least 2 options`,
          });
        }
      }

      if (field.order === undefined) {
        return res.status(400).json({
          success: false,
          message: `Field order is required at index ${i}`,
        });
      }
    }

    event.customForm = customForm;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Custom form updated successfully',
      customForm: event.customForm,
    });
  } catch (error) {
    console.error('Update custom form error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get participants for an event
 * @route   GET /api/organizer/events/:eventId/participants
 * @access  Private (Organizer only)
 */
const getParticipants = async (req, res) => {
  try {
    const { search, paymentFilter, attendanceFilter } = req.query;

    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view participants for this event',
      });
    }

    // Build query
    let query = { eventId: event._id };

    if (paymentFilter) {
      query.paymentStatus = paymentFilter;
    }

    if (attendanceFilter === 'true') {
      query.attendanceMarked = true;
    } else if (attendanceFilter === 'false') {
      query.attendanceMarked = false;
    }

    // Find registrations
    const registrations = await Registration.find(query).populate(
      'participantId',
      'firstName lastName email'
    );

    // Apply search filter
    let participants = registrations.map((reg) => ({
      participantName: reg.participantId
        ? `${reg.participantId.firstName} ${reg.participantId.lastName}`
        : 'N/A',
      email: reg.participantId?.email || 'N/A',
      registrationDate: reg.registrationDate,
      paymentStatus: reg.paymentStatus,
      teamName: reg.teamName || 'N/A',
      attendance: reg.attendanceMarked ? 'Yes' : 'No',
      ticketId: reg.ticketId,
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      participants = participants.filter(
        (p) =>
          p.participantName.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Export participants as CSV
 * @route   GET /api/organizer/events/:eventId/export-csv
 * @access  Private (Organizer only)
 */
const exportParticipantsCSV = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify event belongs to organizer
    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export participants for this event',
      });
    }

    // Get all registrations
    const registrations = await Registration.find({ eventId: event._id }).populate(
      'participantId',
      'firstName lastName email contactNumber'
    );

    const participants = registrations.map((reg) => {
      // Format merchandise details if exists
      let merchandiseDetails = 'N/A';
      if (reg.merchandiseDetails && reg.merchandiseDetails.length > 0) {
        merchandiseDetails = reg.merchandiseDetails
          .map(item => {
            const variant = item.color || item.size || item.variant || '';
            return `${item.itemName} (${variant}) x${item.quantity}`;
          })
          .join('; ');
      }

      return {
        'Participant Name': reg.participantId
          ? `${reg.participantId.firstName} ${reg.participantId.lastName}`
          : 'N/A',
        'Email': reg.participantId?.email || 'N/A',
        'Contact Number': reg.participantId?.contactNumber || 'N/A',
        'Registration Type': reg.registrationType || 'N/A',
        'Registration Date': new Date(reg.registrationDate).toLocaleString(),
        'Payment Status': reg.paymentStatus,
        'Participation Status': reg.participationStatus || 'N/A',
        'Team Name': reg.teamName || 'N/A',
        'Merchandise Details': merchandiseDetails,
        'Attendance': reg.attendanceMarked ? 'Yes' : 'No',
        'Ticket ID': reg.ticketId,
      };
    });

    // Convert to CSV
    const parser = new Parser();
    const csv = parser.parse(participants);

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${event.eventName}-participants.csv"`
    );

    res.status(200).send(csv);
  } catch (error) {
    console.error('Export participants CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  createEvent,
  updateEvent,
  publishEvent,
  changeEventStatus,
  getEventDetails,
  updateCustomForm,
  getParticipants,
  exportParticipantsCSV,
};
