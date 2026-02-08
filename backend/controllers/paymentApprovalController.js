const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

/**
 * @desc    Upload payment proof for merchandise
 * @route   POST /api/participant/registrations/:registrationId/payment-proof
 * @access  Private (Participant only)
 */
const uploadPaymentProof = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const participantId = req.user._id;

    // Get uploaded file path
    const paymentProof = req.file ? `/uploads/${req.file.filename}` : null;

    if (!paymentProof) {
      return res.status(400).json({
        success: false,
        message: 'Payment proof image is required',
      });
    }

    // Find registration
    const registration = await Registration.findOne({
      _id: registrationId,
      participantId,
      registrationType: 'Merchandise',
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Merchandise registration not found',
      });
    }

    // Check if already approved
    if (registration.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already approved',
      });
    }

    // Update payment proof
    registration.paymentProof = paymentProof;
    registration.paymentProofUploadedAt = new Date();
    registration.paymentStatus = 'Pending'; // Reset to pending if re-uploading
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully. Awaiting organizer approval.',
      registration,
    });
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get pending payment approvals for organizer's events
 * @route   GET /api/organizer/events/:eventId/payment-approvals
 * @access  Private (Organizer only)
 */
const getPendingPayments = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event ownership
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
        message: 'Not authorized to view payment approvals for this event',
      });
    }

    // Get pending payments
    const pendingPayments = await Registration.find({
      eventId,
      registrationType: 'Merchandise',
      paymentStatus: 'Pending',
      paymentProof: { $exists: true, $ne: null },
    })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ paymentProofUploadedAt: -1 });

    // Get approved/rejected counts
    const approvedCount = await Registration.countDocuments({
      eventId,
      registrationType: 'Merchandise',
      paymentStatus: 'Paid',
    });

    const rejectedCount = await Registration.countDocuments({
      eventId,
      registrationType: 'Merchandise',
      paymentStatus: 'Rejected',
    });

    res.status(200).json({
      success: true,
      stats: {
        pending: pendingPayments.length,
        approved: approvedCount,
        rejected: rejectedCount,
      },
      payments: pendingPayments.map(reg => ({
        registrationId: reg._id,
        ticketId: reg.ticketId,
        participant: {
          name: `${reg.participantId.firstName} ${reg.participantId.lastName}`,
          email: reg.participantId.email,
          phone: reg.participantId.contactNumber,
        },
        items: reg.merchandiseDetails,
        totalAmount: reg.merchandiseDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        paymentProof: reg.paymentProof,
        uploadedAt: reg.paymentProofUploadedAt,
        registrationDate: reg.registrationDate,
      })),
    });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve payment
 * @route   PUT /api/organizer/registrations/:registrationId/approve-payment
 * @access  Private (Organizer only)
 */
const approvePayment = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Find registration
    const registration = await Registration.findById(registrationId)
      .populate('eventId', 'eventName organizerId merchandiseItems')
      .populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Verify organizer owns the event
    if (registration.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this payment',
      });
    }

    // Check if already approved
    if (registration.paymentStatus === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already approved',
      });
    }

    // TIER A WORKFLOW: Decrement stock on approval
    const Event = require('../models/Event');
    const mongoose = require('mongoose');
    const { generateQRCode } = require('../utils/qrCodeGenerator');
    
    // Start transaction for atomic stock update
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Decrement stock for each merchandise item
      for (const item of registration.merchandiseDetails) {
        const updatedEvent = await Event.findOneAndUpdate(
          {
            _id: registration.eventId._id,
            'merchandiseItems._id': item.itemId,
            'merchandiseItems.stockQuantity': { $gte: item.quantity }, // Atomic stock check
          },
          {
            $inc: { 'merchandiseItems.$.stockQuantity': -item.quantity }, // Atomic decrement
          },
          { 
            new: true,
            session // Use transaction session
          }
        );

        if (!updatedEvent) {
          // Stock was insufficient - abort transaction
          await session.abortTransaction();
          session.endSession();
          
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.itemName}. Cannot approve payment.`,
          });
        }
      }

      // Increment currentRegistrations
      await Event.findByIdAndUpdate(
        registration.eventId._id,
        { $inc: { currentRegistrations: 1 } },
        { session }
      );

      // Commit the transaction - all stock updates succeeded
      await session.commitTransaction();
      session.endSession();

    } catch (error) {
      // Rollback on any error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }

    // Generate QR code now that payment is approved
    const Organizer = require('../models/Organizer');
    const organizer = await Organizer.findById(registration.eventId.organizerId);
    
    const totalAmount = registration.merchandiseDetails.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    const qrData = JSON.stringify({
      ticketId: registration.ticketId,
      eventId: registration.eventId._id,
      participantId: registration.participantId._id,
      eventName: registration.eventId.eventName,
      items: registration.merchandiseDetails,
      totalAmount,
      organizerName: organizer ? organizer.organizerName : 'Organizer',
    });

    const qrCode = await generateQRCode(qrData);

    // Update registration: approve payment, add QR code, change status
    registration.paymentStatus = 'Paid';
    registration.participationStatus = 'Registered'; // Change from Pending to Registered
    registration.qrCode = qrCode; // Add QR code
    registration.paymentApprovedBy = req.user._id;
    registration.paymentApprovedAt = new Date();
    await registration.save();

    // Send email notification to participant with QR code
    try {
      const itemsList = registration.merchandiseDetails
        .map(
          (item) =>
            `${item.itemName}${item.selectedSize ? ` (Size: ${item.selectedSize})` : ''}${item.selectedColor ? ` (Color: ${item.selectedColor})` : ''}${item.selectedVariant ? ` (Variant: ${item.selectedVariant})` : ''} x${item.quantity} - ₹${item.price * item.quantity}`
        )
        .join(', ');

      await sendEmail(
        registration.participantId.email,
        'Payment Approved - Merchandise Purchase',
        `
Dear ${registration.participantId.firstName},

Your payment for merchandise purchase has been approved!

Event: ${registration.eventId.eventName}
Ticket ID: ${registration.ticketId}
Items: ${itemsList}
Total Amount: ₹${totalAmount}

Your ticket with QR code is ready! Please find it below or in your dashboard.

Thank you!
Felicity Team
        `,
        `
<html>
  <body>
    <h2>Payment Approved!</h2>
    <p>Dear ${registration.participantId.firstName},</p>
    <p>Your payment for merchandise purchase has been approved!</p>
    <p><strong>Event:</strong> ${registration.eventId.eventName}</p>
    <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
    <p><strong>Items:</strong> ${itemsList}</p>
    <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
    <p><strong>Status:</strong> Payment Approved ✅</p>
    
    <h3>Your QR Code Ticket:</h3>
    <img src="${qrCode}" alt="QR Code Ticket" style="max-width: 300px;" />
    
    <p>You can also access your ticket from your registrations page.</p>
    <p>Thank you!<br/>Felicity Team</p>
  </body>
</html>
        `
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Payment approved successfully. Stock decremented and QR code generated.',
      registration,
    });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Reject payment
 * @route   PUT /api/organizer/registrations/:registrationId/reject-payment
 * @access  Private (Organizer only)
 */
const rejectPayment = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Find registration
    const registration = await Registration.findById(registrationId)
      .populate('eventId', 'eventName organizerId')
      .populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Verify organizer owns the event
    if (registration.eventId.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this payment',
      });
    }

    // Reject payment (no stock changes needed since stock wasn't decremented yet)
    registration.paymentStatus = 'Rejected';
    registration.participationStatus = 'Rejected'; // Also update participation status
    registration.paymentRejectionReason = reason;
    await registration.save();

    // Send email notification to participant
    try {
      await sendEmail(
        registration.participantId.email,
        'Payment Rejected - Merchandise Purchase',
        `
Dear ${registration.participantId.firstName},

Your payment proof for merchandise purchase has been rejected.

Event: ${registration.eventId.eventName}
Ticket ID: ${registration.ticketId}
Reason: ${reason}

Please upload a valid payment proof to complete your purchase.

Thank you!
Felicity Team
        `,
        `
<html>
  <body>
    <h2>Payment Rejected</h2>
    <p>Dear ${registration.participantId.firstName},</p>
    <p>Your payment proof for merchandise purchase has been rejected.</p>
    <p><strong>Event:</strong> ${registration.eventId.eventName}</p>
    <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please upload a valid payment proof to complete your purchase.</p>
    <p>Thank you!<br/>Felicity Team</p>
  </body>
</html>
        `
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Payment rejected',
      registration,
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  uploadPaymentProof,
  getPendingPayments,
  approvePayment,
  rejectPayment,
};
