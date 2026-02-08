const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  // Anonymous - no participant reference
  submittedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
feedbackSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
