const Organizer = require('../models/Organizer');
const Event = require('../models/Event');

/**
 * @desc    Get all approved organizers
 * @route   GET /api/organizers
 * @access  Public
 */
const getAllOrganizers = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { isApproved: true };

    // Apply category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Apply search filter
    if (search) {
      query.organizerName = { $regex: search, $options: 'i' };
    }

    const organizers = await Organizer.find(query)
      .select('-password')
      .sort({ organizerName: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: organizers.length,
      organizers,
    });
  } catch (error) {
    console.error('Get all organizers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get organizer details by ID
 * @route   GET /api/organizers/:organizerId
 * @access  Public
 */
const getOrganizerDetails = async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.params.organizerId)
      .select('-password')
      .lean();

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    if (!organizer.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    res.status(200).json({
      success: true,
      organizer,
    });
  } catch (error) {
    console.error('Get organizer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get events by organizer ID
 * @route   GET /api/organizers/:organizerId/events
 * @access  Public
 */
const getOrganizerEvents = async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { status } = req.query;

    // Check if organizer exists
    const organizer = await Organizer.findById(organizerId);

    if (!organizer || !organizer.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found',
      });
    }

    let query = { organizerId };

    // Only show published events to public
    if (status && status === 'Published') {
      query.status = 'Published';
    } else {
      query.status = 'Published'; // Default to published only
    }

    const events = await Event.find(query)
      .populate('organizerId', 'organizerName category')
      .sort({ eventStartDate: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  getAllOrganizers,
  getOrganizerDetails,
  getOrganizerEvents,
};
