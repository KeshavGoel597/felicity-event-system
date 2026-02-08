const Discussion = require('../models/Discussion');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Post a message in event discussion
// @route   POST /api/participant/events/:eventId/discussions
// @access  Private (Participant only - must be registered)
exports.postMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
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

    // Check if participant is registered for this event
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to participate in discussions',
      });
    }

    // Create discussion message
    const discussion = await Discussion.create({
      event: eventId,
      participant: req.user._id,
      message: message.trim(),
      isOrganizer: false,
    });

    // Populate participant details before sending response
    await discussion.populate('participant', 'name email');

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: discussion,
    });
  } catch (error) {
    console.error('Error in postMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post message',
      error: error.message,
    });
  }
};

// @desc    Get all messages for an event
// @route   GET /api/participant/events/:eventId/discussions
// @access  Private (Participant only - must be registered)
exports.getDiscussions = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if participant is registered
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to view discussions',
      });
    }

    // Get all discussions
    const discussions = await Discussion.find({ event: eventId })
      .populate('participant', 'name email')
      .sort({ isPinned: -1, createdAt: 1 }); // Pinned messages first, then oldest first

    res.status(200).json({
      success: true,
      count: discussions.length,
      data: discussions,
    });
  } catch (error) {
    console.error('Error in getDiscussions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions',
      error: error.message,
    });
  }
};

// @desc    Post message as organizer
// @route   POST /api/organizer/events/:eventId/discussions
// @access  Private (Organizer only)
exports.postOrganizerMessage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

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
        message: 'Not authorized to post in this event discussion',
      });
    }

    // Create discussion message (use organizer's ID as participant for schema compatibility)
    const discussion = await Discussion.create({
      event: eventId,
      participant: req.user._id, // Store organizer ID
      message: message.trim(),
      isOrganizer: true, // Mark as organizer message
    });

    // Populate with organizer details
    await discussion.populate('participant', 'name email');

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: discussion,
    });
  } catch (error) {
    console.error('Error in postOrganizerMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post message',
      error: error.message,
    });
  }
};

// @desc    Get all discussions for organizer's event
// @route   GET /api/organizer/events/:eventId/discussions
// @access  Private (Organizer only)
exports.getOrganizerDiscussions = async (req, res) => {
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
        message: 'Not authorized to view this event discussion',
      });
    }

    // Get all discussions
    const discussions = await Discussion.find({ event: eventId })
      .populate('participant', 'name email')
      .sort({ isPinned: -1, createdAt: 1 }); // Pinned messages first

    res.status(200).json({
      success: true,
      count: discussions.length,
      data: discussions,
    });
  } catch (error) {
    console.error('Error in getOrganizerDiscussions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discussions',
      error: error.message,
    });
  }
};

// @desc    Delete a discussion message
// @route   DELETE /api/participant/discussions/:discussionId
// @access  Private (Participant - own messages only)
exports.deleteMessage = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion message not found',
      });
    }

    // Check if user owns this message
    if (discussion.participant.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    await discussion.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message,
    });
  }
};

// @desc    Pin a message (Organizer only)
// @route   PUT /api/organizer/discussions/:discussionId/pin
// @access  Private (Organizer only)
exports.pinMessage = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId).populate('event');
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion message not found',
      });
    }

    // Verify organizer owns the event
    const event = await Event.findById(discussion.event);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.organizerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pin messages in this event',
      });
    }

    // Toggle pin status
    discussion.isPinned = !discussion.isPinned;
    discussion.pinnedAt = discussion.isPinned ? new Date() : null;
    discussion.pinnedBy = discussion.isPinned ? req.user._id : null;
    await discussion.save();

    res.status(200).json({
      success: true,
      message: discussion.isPinned ? 'Message pinned successfully' : 'Message unpinned successfully',
      data: discussion,
    });
  } catch (error) {
    console.error('Error in pinMessage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pin message',
      error: error.message,
    });
  }
};

module.exports = {
  postMessage,
  getDiscussions,
  postOrganizerMessage,
  getOrganizerDiscussions,
  deleteMessage,
  pinMessage,
};
