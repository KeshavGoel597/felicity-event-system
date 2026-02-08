const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant ID is required'],
    },
    registrationType: {
      type: String,
      enum: {
        values: ['Normal', 'Merchandise'],
        message: 'Registration type must be either Normal or Merchandise',
      },
      required: [true, 'Registration type is required'],
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Paid', 'Failed', 'Rejected'],
        message: 'Invalid payment status',
      },
      default: 'Paid', // For core features, payments are auto-marked as Paid
    },
    paymentProof: {
      type: String, // URL to uploaded payment screenshot
    },
    paymentProofUploadedAt: {
      type: Date,
    },
    paymentApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer',
    },
    paymentApprovedAt: {
      type: Date,
    },
    paymentRejectionReason: {
      type: String,
    },
    participationStatus: {
      type: String,
      enum: {
        values: ['Registered', 'Cancelled', 'Rejected', 'Completed'],
        message: 'Invalid participation status',
      },
      default: 'Registered',
    },
    ticketId: {
      type: String,
      required: [true, 'Ticket ID is required'],
    },
    qrCode: {
      type: String, // Base64 encoded QR code image
    },
    
    // For Normal Event registrations
    customFormResponses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // Stores key-value pairs of form responses
    },
    
    // For Merchandise registrations
    merchandiseDetails: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        itemName: {
          type: String,
        },
        selectedSize: {
          type: String,
        },
        selectedColor: {
          type: String,
        },
        selectedVariant: {
          type: String,
        },
        quantity: {
          type: Number,
          min: [1, 'Quantity must be at least 1'],
        },
        price: {
          type: Number,
          min: [0, 'Price cannot be negative'],
        },
      },
    ],
    
    // Attendance tracking (for QR Scanner feature)
    attendanceMarked: {
      type: Boolean,
      default: false,
    },
    attendanceTimestamp: {
      type: Date,
    },
    
    // Team name for team events (future use)
    teamName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate registrations
registrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });

// Index for faster queries - removed duplicate ticketId index since it's not unique anymore
registrationSchema.index({ participantId: 1, registrationDate: -1 });
registrationSchema.index({ eventId: 1, participationStatus: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
