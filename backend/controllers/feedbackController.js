const Feedback = require('../models/Feedback');
const Event = require('../models/Event');

// @desc    Submit anonymous feedback for an event
// @route   POST /api/participant/events/:eventId/feedback
// @access  Public (anonymous)
exports.submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // TIER C REQUIREMENT: Only allow feedback for COMPLETED events
    if (event.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for completed events',
      });
    }

    // Create feedback (anonymous - no participant ID)
    const feedback = await Feedback.create({
      event: eventId,
      rating,
      comment: comment || '',
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback,
    });
  } catch (error) {
    console.error('Error in submitFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message,
    });
  }
};

// @desc    Get all feedback for an event (Organizer)
// @route   GET /api/organizer/events/:eventId/feedback
// @access  Private (Organizer only)
exports.getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify organizer owns the event
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
        message: 'Not authorized to view feedback for this event',
      });
    }

    // Get all feedback
    const feedbacks = await Feedback.find({ event: eventId }).sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : 0;

    // Rating distribution
    const distribution = {
      1: feedbacks.filter(f => f.rating === 1).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      5: feedbacks.filter(f => f.rating === 5).length,
    };

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      avgRating,
      distribution,
      data: feedbacks,
    });
  } catch (error) {
    console.error('Error in getEventFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message,
    });
  }
};

// @desc    Get feedback stats for event (Public - for participants to see)
// @route   GET /api/participant/events/:eventId/feedback-stats
// @access  Public
exports.getFeedbackStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const feedbacks = await Feedback.find({ event: eventId });

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(1) : 0;

    const distribution = {
      1: feedbacks.filter(f => f.rating === 1).length,
      2: feedbacks.filter(f => f.rating === 2).length,
      3: feedbacks.filter(f => f.rating === 3).length,
      4: feedbacks.filter(f => f.rating === 4).length,
      5: feedbacks.filter(f => f.rating === 5).length,
    };

    res.status(200).json({
      success: true,
      count: feedbacks.length,
      avgRating,
      distribution,
    });
  } catch (error) {
    console.error('Error in getFeedbackStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback stats',
      error: error.message,
    });
  }
};
