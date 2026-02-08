const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  isOrganizer: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  pinnedAt: {
    type: Date,
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // For threaded discussions (future enhancement)
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
  },
}, {
  timestamps: true,
});

// Index for faster queries
discussionSchema.index({ event: 1, createdAt: -1 });
discussionSchema.index({ participant: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);
