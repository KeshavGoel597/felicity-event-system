const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const mongoose = require('mongoose');
const { generateQRCode } = require('../utils/qrCodeGenerator');
const { sendEmail } = require('../utils/emailService');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Register for a normal event
 * @route   POST /api/registrations/event/:eventId
 * @access  Private (Participant only)
 */
const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { formResponses } = req.body;
    const participantId = req.user._id;

    // Fetch participant data for eligibility check
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId).populate(
      'organizerId',
      'organizerName'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check if event is published or ongoing
    if (!['Published', 'Ongoing'].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: 'Event is not available for registration',
      });
    }

    // Check if event type is Normal
    if (event.eventType !== 'Normal') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is for normal events only',
      });
    }

    // Check eligibility - IIIT Only events require IIIT participants
    if (event.eligibility === 'IIIT Only' && participant.participantType !== 'IIIT') {
      return res.status(403).json({
        success: false,
        message: 'This event is only open to IIIT participants',
      });
    }

    // Check if registration is still open
    const now = new Date();
    if (now > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed',
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      participantId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this event',
      });
    }

    // Check if event is full - FIX: use registrationLimit and participationStatus
    const registrationCount = await Registration.countDocuments({
      eventId,
      participationStatus: 'Registered',
    });

    if (event.registrationLimit && registrationCount >= event.registrationLimit) {
      return res.status(400).json({
        success: false,
        message: 'Event is full',
      });
    }

    // Validate custom form responses if form exists
    if (event.customForm && event.customForm.length > 0) {
      for (const field of event.customForm) {
        if (field.isRequired && (!formResponses || !formResponses[field.fieldLabel])) {
          return res.status(400).json({
            success: false,
            message: `${field.fieldLabel} is required`,
          });
        }
      }
    }

    // Create registration
    const ticketId = `TICKET-${uuidv4()}`;
    const qrData = JSON.stringify({
      ticketId,
      eventId: event._id,
      participantId,
      eventName: event.eventName,
      organizerName: event.organizerId.organizerName,
    });

    const qrCode = await generateQRCode(qrData);

    const registration = new Registration({
      eventId,
      participantId,
      registrationType: 'Normal',
      ticketId,
      qrCode,
      participationStatus: 'Registered',
      registrationDate: new Date(),
      customFormResponses: formResponses || {},
    });

    await registration.save();

    // Increment currentRegistrations
    event.currentRegistrations += 1;

    // Lock custom form after first registration (if event has custom form)
    if (event.customForm && event.customForm.length > 0 && !event.isFormLocked) {
      event.isFormLocked = true;
    }
    
    await event.save();

    // Populate registration for email
    await registration.populate('participantId', 'firstName lastName email');

    // Send confirmation email
    try {
      const emailSubject = `Registration Confirmation - ${event.eventName}`;
      const emailText = `
Dear ${registration.participantId.firstName} ${registration.participantId.lastName},

You have successfully registered for ${event.eventName} organized by ${event.organizerId.organizerName}.

Event Details:
- Event Name: ${event.eventName}
- Date: ${new Date(event.eventStartDate).toLocaleDateString()}
- Location: ${event.location || 'TBA'}

Your Ticket ID: ${ticketId}

Please find your QR code ticket attached to this email or access it from your dashboard.

Thank you for registering!

Best regards,
Felicity Team
      `;

      const emailHtml = `
<html>
  <body>
    <h2>Registration Confirmation</h2>
    <p>Dear ${registration.participantId.firstName} ${registration.participantId.lastName},</p>
    <p>You have successfully registered for <strong>${event.eventName}</strong> organized by <strong>${event.organizerId.organizerName}</strong>.</p>
    
    <h3>Event Details:</h3>
    <ul>
      <li><strong>Event Name:</strong> ${event.eventName}</li>
      <li><strong>Date:</strong> ${new Date(event.eventStartDate).toLocaleDateString()}</li>
      <li><strong>Location:</strong> ${event.location || 'TBA'}</li>
    </ul>
    
    <p><strong>Your Ticket ID:</strong> ${ticketId}</p>
    <p>Please find your QR code ticket below:</p>
    <img src="${qrCode}" alt="QR Code Ticket" style="max-width: 300px;" />
    
    <p>You can also access your ticket from your dashboard.</p>
    
    <p>Thank you for registering!</p>
    <p>Best regards,<br/>Felicity Team</p>
  </body>
</html>
      `;

      await sendEmail(
        registration.participantId.email,
        emailSubject,
        emailText,
        emailHtml
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the registration if email fails
    }

    // Return populated registration (Registration has no organizerId field — populate via eventId)
    await registration.populate({
      path: 'eventId',
      populate: { path: 'organizerId', select: 'organizerName' },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for event',
      registration,
    });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Purchase merchandise
 * @route   POST /api/registrations/merchandise/:eventId
 * @access  Private (Participant only)
 */
const purchaseMerchandise = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { items } = req.body;
    const participantId = req.user._id;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide items to purchase',
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId).populate(
      'organizerId',
      'organizerName'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Merchandise event not found',
      });
    }

    // Check if event type is Merchandise
    if (event.eventType !== 'Merchandise') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is for merchandise only',
      });
    }

    // Check if merchandise is still available
    const now = new Date();
    if (now > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Purchase deadline has passed',
      });
    }

    // Check for duplicate purchase
    const existingPurchase = await Registration.findOne({
      eventId,
      participantId,
      registrationType: 'Merchandise',
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased from this merchandise event',
      });
    }

    // Validate all items and calculate total BEFORE modifying stock
    let totalAmount = 0;
    let totalQuantity = 0;
    const merchandiseItems = [];

    // FIX Issue 35: Get pending order quantities to reserve stock properly
    // Find all pending/paid registrations for this event to compute reserved quantities per item
    const existingOrders = await Registration.find({
      eventId,
      registrationType: 'Merchandise',
      paymentStatus: { $in: ['Pending', 'Paid'] },
    }).select('merchandiseDetails');

    // Build a map: itemId → total reserved quantity (pending + approved orders)
    const reservedQuantityMap = {};
    for (const order of existingOrders) {
      if (order.merchandiseDetails) {
        for (const detail of order.merchandiseDetails) {
          const key = detail.itemId.toString();
          reservedQuantityMap[key] = (reservedQuantityMap[key] || 0) + detail.quantity;
        }
      }
    }

    for (const item of items) {
      const { merchandiseId, quantity, size, color, variant } = item;

      // FIX: Use merchandiseItems instead of merchandiseDetails
      const merch = event.merchandiseItems.find(
        (m) => m._id.toString() === merchandiseId
      );

      if (!merch) {
        return res.status(400).json({
          success: false,
          message: `Merchandise item ${merchandiseId} not found`,
        });
      }

      // FIX Issue 35: Check available stock = physical stock - reserved (pending+approved) quantities
      const reservedQty = reservedQuantityMap[merch._id.toString()] || 0;
      const availableStock = merch.stockQuantity - reservedQty;
      if (availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${merch.itemName}. Only ${Math.max(0, availableStock)} available.`,
        });
      }

      // Check if size is required and valid
      if (merch.sizes && merch.sizes.length > 0) {
        if (!size) {
          return res.status(400).json({
            success: false,
            message: `Size is required for ${merch.itemName}`,
          });
        }
        if (!merch.sizes.includes(size)) {
          return res.status(400).json({
            success: false,
            message: `Invalid size for ${merch.itemName}`,
          });
        }
      }

      // Check if color is required and valid
      if (merch.colors && merch.colors.length > 0) {
        if (!color) {
          return res.status(400).json({
            success: false,
            message: `Color is required for ${merch.itemName}`,
          });
        }
        if (!merch.colors.includes(color)) {
          return res.status(400).json({
            success: false,
            message: `Invalid color for ${merch.itemName}`,
          });
        }
      }

      // Check if variant is required and valid
      if (merch.variants && merch.variants.length > 0) {
        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Variant is required for ${merch.itemName}`,
          });
        }
        if (!merch.variants.includes(variant)) {
          return res.status(400).json({
            success: false,
            message: `Invalid variant for ${merch.itemName}`,
          });
        }
      }

      const itemTotal = merch.price * quantity;
      totalAmount += itemTotal;
      totalQuantity += quantity;

      // Add to merchandise details
      merchandiseItems.push({
        itemId: merch._id,
        itemName: merch.itemName,
        selectedSize: size || undefined,
        selectedColor: color || undefined,
        selectedVariant: variant || undefined,
        quantity: quantity,
        price: merch.price,
      });
    }

    // Check purchase limit
    if (event.purchaseLimitPerParticipant && totalQuantity > event.purchaseLimitPerParticipant) {
      return res.status(400).json({
        success: false,
        message: `Total quantity (${totalQuantity}) exceeds purchase limit of ${event.purchaseLimitPerParticipant}`,
      });
    }

    // TIER A WORKFLOW: Do NOT decrement stock yet
    // Stock will only be decremented when organizer approves the payment
    // We've already validated that stock exists above

    // Generate ticket ID (QR code will be generated on approval)
    const ticketId = `MERCH-${uuidv4()}`;

    // Create registration with Pending status and NO QR code
    const registration = new Registration({
      eventId,
      participantId,
      registrationType: 'Merchandise',
      ticketId,
      qrCode: null, // QR code will be generated on approval
      merchandiseDetails: merchandiseItems,
      participationStatus: 'Pending', // Not 'Registered' - waiting for payment approval
      paymentStatus: 'Pending', // Awaiting organizer approval
      registrationDate: new Date(),
    });

    await registration.save();

    // Populate for email
    await registration.populate('participantId', 'firstName lastName email');

    // Send initial confirmation email (without QR code - will be sent on approval)
    try {
      const itemsList = merchandiseItems
        .map(
          (item) =>
            `- ${item.itemName}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}${item.selectedColor ? ` (Color: ${item.selectedColor})` : ''}${item.selectedVariant ? ` (Variant: ${item.selectedVariant})` : ''} x${item.quantity} - ₹${item.price * item.quantity}`
        )
        .join('\n');

      const emailSubject = `Merchandise Order Received - ${event.eventName}`;
      const emailText = `
Dear ${registration.participantId.firstName} ${registration.participantId.lastName},

Thank you for your merchandise order from ${event.eventName}.

Items Ordered:
${itemsList}

Total Amount: ₹${totalAmount}
Your Order ID: ${ticketId}

NEXT STEPS:
1. Please upload your payment proof through your dashboard
2. The organizer will verify your payment
3. Once approved, you will receive your ticket with QR code via email

You can upload payment proof from your registrations page.

Thank you!
Felicity Team
      `;

      const emailHtml = `
<html>
  <body>
    <h2>Merchandise Order Received</h2>
    <p>Dear ${registration.participantId.firstName} ${registration.participantId.lastName},</p>
    <p>Thank you for your merchandise order from <strong>${event.eventName}</strong>.</p>
    
    <h3>Items Ordered:</h3>
    <ul>
      ${merchandiseItems.map((item) => `<li>${item.itemName}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}${item.selectedColor ? ` (Color: ${item.selectedColor})` : ''}${item.selectedVariant ? ` (Variant: ${item.selectedVariant})` : ''} x${item.quantity} - ₹${item.price * item.quantity}</li>`).join('')}
    </ul>
    
    <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
    <p><strong>Your Order ID:</strong> ${ticketId}</p>
    
    <h3>Next Steps:</h3>
    <ol>
      <li>Upload your payment proof through your dashboard</li>
      <li>The organizer will verify your payment</li>
      <li>Once approved, you will receive your ticket with QR code via email</li>
    </ol>
    
    <p>You can upload payment proof from your registrations page.</p>
    
    <p>Thank you!<br/>Felicity Team</p>
  </body>
</html>
      `;

      await sendEmail(
        registration.participantId.email,
        emailSubject,
        emailText,
        emailHtml
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the purchase if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Merchandise order placed successfully. Please upload payment proof to complete your purchase.',
      registration,
      nextSteps: {
        step1: 'Upload payment proof',
        step2: 'Wait for organizer approval',
        step3: 'Receive ticket with QR code',
      },
    });
  } catch (error) {
    console.error('Purchase merchandise error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel registration
 * @route   DELETE /api/registrations/:registrationId
 * @access  Private (Participant only)
 */
const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(
      req.params.registrationId
    ).populate('eventId');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Check if registration belongs to the user
    if (registration.participantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this registration',
      });
    }

    // Check if already cancelled
    if (registration.participationStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Registration is already cancelled',
      });
    }

    // Check if event has already ended
    const now = new Date();
    if (now > new Date(registration.eventId.eventEndDate)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel registration for a completed event',
      });
    }

    // Update registration status
    registration.participationStatus = 'Cancelled';
    await registration.save();

    // Decrement currentRegistrations on the event (only if it was counted)
    if (registration.eventId && registration.eventId.currentRegistrations > 0) {
      // For merchandise, currentRegistrations is only incremented on approval
      // So only decrement if payment was approved (Paid)
      if (registration.registrationType === 'Merchandise') {
        if (registration.paymentStatus === 'Paid') {
          registration.eventId.currentRegistrations -= 1;
          await registration.eventId.save();

          // Also re-increment stock for approved merchandise orders
          if (registration.merchandiseDetails && registration.merchandiseDetails.length > 0) {
            for (const item of registration.merchandiseDetails) {
              await Event.findOneAndUpdate(
                { _id: registration.eventId._id, 'merchandiseItems._id': item.itemId },
                { $inc: { 'merchandiseItems.$.stockQuantity': item.quantity } }
              );
            }
          }
        }
      } else {
        // Normal event — always decrement
        registration.eventId.currentRegistrations -= 1;
        await registration.eventId.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      registration,
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get ticket by ticket ID
 * @route   GET /api/registrations/ticket/:ticketId
 * @access  Private (Participant only)
 */
const getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const participantId = req.user._id;

    // Find registration by ticketId and participantId
    const registration = await Registration.findOne({
      ticketId,
      participantId,
    })
      .populate('eventId', 'eventName eventStartDate eventEndDate location')
      .populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  registerForEvent,
  purchaseMerchandise,
  cancelRegistration,
  getTicket,
};
