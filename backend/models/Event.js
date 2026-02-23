const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
    },
    eventDescription: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: {
        values: ['Normal', 'Merchandise'],
        message: 'Event type must be either Normal or Merchandise',
      },
      required: [true, 'Event type is required'],
    },
    eligibility: {
      type: String,
      enum: {
        values: ['IIIT Only', 'Open to All'],
        message: 'Eligibility must be either "IIIT Only" or "Open to All"',
      },
    },
    registrationDeadline: {
      type: Date,
    },
    eventStartDate: {
      type: Date,
    },
    eventEndDate: {
      type: Date,
    },
    registrationLimit: {
      type: Number,
      min: [1, 'Registration limit must be at least 1'],
    },
    registrationFee: {
      type: Number,
      required: [true, 'Registration fee is required'],
      min: [0, 'Registration fee cannot be negative'],
      default: 0,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer',
      required: [true, 'Organizer ID is required'],
    },
    eventTags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
        message: 'Invalid event status',
      },
      default: 'Draft',
    },
    currentRegistrations: {
      type: Number,
      default: 0,
      min: [0, 'Current registrations cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
    },
    
    // Fields specific to Normal Events
    customForm: [
      {
        fieldType: {
          type: String,
          enum: ['text', 'textarea', 'number', 'email', 'date', 'dropdown', 'checkbox', 'radio', 'file'],
        },
        fieldLabel: {
          type: String,
          required: true,
        },
        isRequired: {
          type: Boolean,
          default: false,
        },
        options: {
          type: [String], // For dropdown, checkbox, radio
        },
        placeholder: {
          type: String,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    isFormLocked: {
      type: Boolean,
      default: false,
    },
    
    // Fields specific to Merchandise Events
    merchandiseItems: [
      {
        itemName: {
          type: String,
          required: true,
        },
        sizes: {
          type: [String],
          default: [],
        },
        colors: {
          type: [String],
          default: [],
        },
        variants: {
          type: [String],
          default: [],
        },
        stockQuantity: {
          type: Number,
          required: true,
          min: [0, 'Stock quantity cannot be negative'],
        },
        price: {
          type: Number,
          required: true,
          min: [0, 'Price cannot be negative'],
        },
      },
    ],
    purchaseLimitPerParticipant: {
      type: Number,
      min: [1, 'Purchase limit must be at least 1'],
    },
  },
  {
    timestamps: true,
  }
);

// Validation: eventEndDate must be after eventStartDate
eventSchema.pre('save', function () {
  if (this.eventStartDate && this.eventEndDate) {
    if (this.eventEndDate <= this.eventStartDate) {
      throw new Error('Event end date must be after event start date');
    }
  }
  
  if (this.registrationDeadline && this.eventStartDate) {
    if (this.registrationDeadline >= this.eventStartDate) {
      throw new Error('Registration deadline must be before event start date');
    }
  }
});

// Index for faster queries
eventSchema.index({ status: 1, eventStartDate: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ eventType: 1 });

/**
 * Auto-compute event status based on dates.
 * - Draft stays Draft (manual publish required)
 * - Published → Ongoing if eventStartDate <= now
 * - Ongoing → Completed if eventEndDate <= now
 * - Closed stays Closed (manual override)
 */
eventSchema.methods.computeStatus = function () {
  if (this.status === 'Draft' || this.status === 'Closed') return this.status;
  const now = new Date();
  if (this.eventEndDate && now >= this.eventEndDate) {
    return 'Completed';
  }
  if (this.eventStartDate && now >= this.eventStartDate) {
    return 'Ongoing';
  }
  return this.status; // remains Published
};

/**
 * Static helper: auto-update statuses for a set of events in-place.
 */
eventSchema.statics.autoUpdateStatuses = async function (events) {
  const bulkOps = [];
  for (const event of events) {
    const newStatus = event.computeStatus ? event.computeStatus() : null;
    if (newStatus && newStatus !== event.status) {
      event.status = newStatus;
      bulkOps.push({
        updateOne: {
          filter: { _id: event._id },
          update: { $set: { status: newStatus } },
        },
      });
    }
  }
  if (bulkOps.length > 0) {
    await mongoose.model('Event').bulkWrite(bulkOps);
  }
  return events;
};

module.exports = mongoose.model('Event', eventSchema);
