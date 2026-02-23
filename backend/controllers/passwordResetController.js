const PasswordResetRequest = require('../models/PasswordResetRequest');
const Organizer = require('../models/Organizer');
const { sendEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// @desc    Submit password reset request (Organizer)
// @route   POST /api/auth/organizer/request-password-reset
// @access  Public (no auth required - organizer forgot password)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email, reason } = req.body;

    // Validate input
    if (!email || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Email and reason are required',
      });
    }

    // Check if organizer exists
    const organizer = await Organizer.findOne({ loginEmail: email });
    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found with this email',
      });
    }

    // Check if organizer already has a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizer: organizer._id,
      status: 'Pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request. Please wait for admin approval.',
      });
    }

    // Create new reset request
    const resetRequest = await PasswordResetRequest.create({
      organizer: organizer._id,
      reason,
    });

    // Send confirmation email to organizer (non-blocking - don't await)
    sendEmail({
      to: organizer.loginEmail,
      subject: 'Password Reset Request Received',
      html: `
        <h2>Password Reset Request</h2>
        <p>Dear ${organizer.organizerName},</p>
        <p>Your password reset request has been received and is pending admin approval.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You will receive an email once your request is reviewed by the admin.</p>
        <p>Thank you for your patience.</p>
      `,
    }).catch(err => console.error('Failed to send reset request confirmation email:', err));

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully. Please wait for admin approval.',
      data: resetRequest,
    });
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit password reset request',
      error: error.message,
    });
  }
};

// @desc    Get all password reset requests (Admin)
// @route   GET /api/admin/password-reset-requests
// @access  Private (Admin only)
exports.getPasswordResetRequests = async (req, res) => {
  try {
    const { status } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }

    // Get requests with organizer details
    const requests = await PasswordResetRequest.find(filter)
      .populate('organizer', 'organizerName loginEmail category contactNumber')
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      pending: await PasswordResetRequest.countDocuments({ status: 'Pending' }),
      approved: await PasswordResetRequest.countDocuments({ status: 'Approved' }),
      rejected: await PasswordResetRequest.countDocuments({ status: 'Rejected' }),
    };

    res.status(200).json({
      success: true,
      count: requests.length,
      stats,
      data: requests,
    });
  } catch (error) {
    console.error('Error in getPasswordResetRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch password reset requests',
      error: error.message,
    });
  }
};

// @desc    Approve password reset request (Admin)
// @route   PUT /api/admin/password-reset-requests/:requestId/approve
// @access  Private (Admin only)
exports.approvePasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { comments } = req.body || {};

    // Find the request
    const resetRequest = await PasswordResetRequest.findById(requestId).populate('organizer');
    
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found',
      });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed',
      });
    }

    // Generate temporary password (8 characters)
    const temporaryPassword = crypto.randomBytes(4).toString('hex');
    
    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    // Update organizer's password
    await Organizer.findByIdAndUpdate(resetRequest.organizer._id, {
      password: hashedPassword,
    });

    // Update reset request
    resetRequest.status = 'Approved';
    resetRequest.reviewedBy = req.user._id;
    resetRequest.reviewedAt = new Date();
    resetRequest.temporaryPassword = temporaryPassword; // Store plain text (only for admin reference)
    if (comments) resetRequest.adminComments = comments;
    await resetRequest.save();

    // Send email to organizer with temporary password
    await sendEmail({
      to: resetRequest.organizer.loginEmail,
      subject: 'Password Reset Approved - Temporary Password',
      html: `
        <h2>Password Reset Approved</h2>
        <p>Dear ${resetRequest.organizer.organizerName},</p>
        <p>Your password reset request has been approved by the admin.</p>
        ${comments ? `
        <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #3b82f6;">
          <p style="margin: 0;"><strong>Admin Comments:</strong></p>
          <p style="margin: 8px 0;">${comments}</p>
        </div>
        ` : ''}
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Temporary Password:</strong></p>
          <p style="font-size: 20px; font-family: monospace; color: #1f2937; margin: 8px 0;"><strong>${temporaryPassword}</strong></p>
        </div>
        <p><strong>Important:</strong></p>
        <ul>
          <li>Please login with this temporary password immediately</li>
          <li>Change your password after logging in for security</li>
          <li>This temporary password is valid until you change it</li>
        </ul>
        <p>If you did not request this password reset, please contact the admin immediately.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset approved. Temporary password sent to organizer.',
      data: {
        requestId: resetRequest._id,
        temporaryPassword, // Include in response for admin to see
      },
    });
  } catch (error) {
    console.error('Error in approvePasswordReset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve password reset',
      error: error.message,
    });
  }
};

// @desc    Reject password reset request (Admin)
// @route   PUT /api/admin/password-reset-requests/:requestId/reject
// @access  Private (Admin only)
exports.rejectPasswordReset = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    // Find the request
    const resetRequest = await PasswordResetRequest.findById(requestId).populate('organizer');
    
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found',
      });
    }

    if (resetRequest.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed',
      });
    }

    // Update reset request
    resetRequest.status = 'Rejected';
    resetRequest.reviewedBy = req.user._id;
    resetRequest.reviewedAt = new Date();
    resetRequest.rejectionReason = reason;
    await resetRequest.save();

    // Send email to organizer
    await sendEmail({
      to: resetRequest.organizer.loginEmail,
      subject: 'Password Reset Request Rejected',
      html: `
        <h2>Password Reset Request Rejected</h2>
        <p>Dear ${resetRequest.organizer.organizerName},</p>
        <p>Your password reset request has been rejected by the admin.</p>
        <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 8px 0;">${reason}</p>
        </div>
        <p>If you believe this is an error or have questions, please contact the admin directly.</p>
        <p>You can submit a new password reset request if needed.</p>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset request rejected',
      data: resetRequest,
    });
  } catch (error) {
    console.error('Error in rejectPasswordReset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject password reset',
      error: error.message,
    });
  }
};

// @desc    Get organizer's own reset requests
// @route   GET /api/organizer/password-reset-requests
// @access  Private (Organizer only)
exports.getMyResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({
      organizer: req.user._id,
    })
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Error in getMyResetRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reset requests',
      error: error.message,
    });
  }
};
