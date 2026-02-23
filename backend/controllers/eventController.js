const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');

/**
 * @desc    Browse events with filters
 * @route   GET /api/events/browse
 * @access  Public
 */
const browseEvents = async (req, res) => {
  try {
    const {
      search,
      eventType,
      eligibility,
      dateFrom,
      dateTo,
      followedOnly,
      userId,
    } = req.query;

    // Base query: only published or ongoing events
    let query = { status: { $in: ['Published', 'Ongoing'] } };

    // Apply event type filter
    if (eventType && eventType !== 'All') {
      query.eventType = eventType;
    }

    // Apply eligibility filter
    if (eligibility && eligibility !== 'All') {
      query.eligibility = eligibility;
    }

    // Apply date filters
    if (dateFrom) {
      query.eventStartDate = { $gte: new Date(dateFrom) };
    }
    if (dateTo) {
      if (query.eventStartDate) {
        query.eventStartDate.$lte = new Date(dateTo);
      } else {
        query.eventStartDate = { $lte: new Date(dateTo) };
      }
    }

    // Apply followed clubs filter
    if (followedOnly === 'true' && userId) {
      const User = require('../models/User');
      const user = await User.findById(userId);
      if (user && user.followedClubs && user.followedClubs.length > 0) {
        query.organizerId = { $in: user.followedClubs };
      } else {
        // User follows no clubs — return empty results
        return res.status(200).json({
          success: true,
          count: 0,
          events: [],
        });
      }
    }

    // Apply search filter (search in event name or organizer names — supports partial & fuzzy matching)
    if (search) {
      // Build a fuzzy regex: allow 1 character mismatch by inserting .? between characters
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Split into words and search each word with partial matching
      const searchWords = escapedSearch.split(/\s+/).filter(Boolean);
      
      // Create flexible regex patterns for each word
      const wordPatterns = searchWords.map(word => {
        // Allow fuzzy matching: create pattern that matches if most characters match
        // Insert optional wildcard between chars for typo tolerance
        const fuzzyChars = word.split('').join('.?');
        return fuzzyChars;
      });
      
      // Combined pattern: all words must appear (in any order)
      const combinedPattern = wordPatterns.map(p => `(?=.*${p})`).join('');
      const fuzzyRegex = new RegExp(combinedPattern, 'i');

      // First, find organizers matching the search term
      const matchingOrganizers = await Organizer.find({
        organizerName: { $regex: search, $options: 'i' },
        isApproved: true,
      }).select('_id');

      const organizerIds = matchingOrganizers.map((org) => org._id);

      // Search in event name (fuzzy) OR event tags OR matching organizer IDs
      query.$or = [
        { eventName: { $regex: fuzzyRegex } },
        { eventName: { $regex: search, $options: 'i' } },
        { eventTags: { $regex: search, $options: 'i' } },
        { organizerId: { $in: organizerIds } },
      ];
    }

    // Fetch events
    let events = await Event.find(query)
      .populate('organizerId', 'organizerName category')
      .sort({ eventStartDate: 1 })
      .lean();

    // Auto-compute statuses based on dates
    const now = new Date();
    for (const event of events) {
      if (event.status === 'Published' && event.eventStartDate && now >= new Date(event.eventStartDate)) {
        event.status = 'Ongoing';
        await Event.updateOne({ _id: event._id }, { $set: { status: 'Ongoing' } });
      }
      if ((event.status === 'Published' || event.status === 'Ongoing') && event.eventEndDate && now >= new Date(event.eventEndDate)) {
        event.status = 'Completed';
        await Event.updateOne({ _id: event._id }, { $set: { status: 'Completed' } });
      }
    }

    // Filter out events that just transitioned to Completed
    events = events.filter(e => e.status !== 'Completed');

    // Apply preference-based sorting if userId provided
    if (userId) {
      try {
        const User = require('../models/User');
        const user = await User.findById(userId).select('areasOfInterest followedClubs');
        
        if (user) {
          // Calculate preference score for each event
          events = events.map(event => {
            let preferenceScore = 0;
            
            // Boost if organizer is in followed clubs (+10 points)
            if (user.followedClubs && user.followedClubs.some(clubId => 
              clubId.toString() === event.organizerId._id.toString()
            )) {
              preferenceScore += 10;
            }
            
            // Boost if event category matches user's areas of interest (+5 points)
            if (user.areasOfInterest && event.organizerId && 
                user.areasOfInterest.includes(event.organizerId.category)) {
              preferenceScore += 5;
            }
            
            return {
              ...event,
              _preferenceScore: preferenceScore
            };
          });
          
          // Sort by preference score (descending), then by event date (ascending)
          events.sort((a, b) => {
            if (b._preferenceScore !== a._preferenceScore) {
              return b._preferenceScore - a._preferenceScore;
            }
            return new Date(a.eventStartDate) - new Date(b.eventStartDate);
          });
          
          // Remove preference score from response (internal use only)
          events = events.map(({ _preferenceScore, ...event }) => event);
        }
      } catch (userError) {
        // If user fetch fails, continue with default sorting
        console.error('Error fetching user preferences:', userError);
      }
    }

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Browse events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get trending events (top 5 based on registrations in last 24 hours)
 * @route   GET /api/events/trending
 * @access  Public
 */
const getTrendingEvents = async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get registrations from last 24 hours and group by eventId
    const trendingData = await Registration.aggregate([
      {
        $match: {
          registrationDate: { $gte: last24Hours },
        },
      },
      {
        $group: {
          _id: '$eventId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    if (trendingData.length === 0) {
      return res.status(200).json({
        success: true,
        events: [],
      });
    }

    const eventIds = trendingData.map((item) => item._id);

    // Fetch the actual events
    const events = await Event.find({
      _id: { $in: eventIds },
      status: { $in: ['Published', 'Ongoing'] },
    })
      .populate('organizerId', 'organizerName category')
      .lean();

    // Sort events by trending count
    const sortedEvents = eventIds
      .map((id) => {
        const event = events.find((e) => e._id.toString() === id.toString());
        if (event) {
          const trending = trendingData.find((t) => t._id.toString() === id.toString());
          return {
            ...event,
            registrationCount: trending.count,
          };
        }
        return null;
      })
      .filter((e) => e !== null);

    res.status(200).json({
      success: true,
      events: sortedEvents,
    });
  } catch (error) {
    console.error('Get trending events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Get event details by ID
 * @route   GET /api/events/:eventId
 * @access  Public
 */
const getEventDetails = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate(
      'organizerId',
      'organizerName category description contactEmail'
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Auto-compute event status based on dates
    const computedStatus = event.computeStatus();
    if (computedStatus !== event.status) {
      event.status = computedStatus;
      await event.save();
    }

    // Get actual registration count (including pending orders for merchandise)
    const actualRegistrations = await Registration.countDocuments({
      eventId: event._id,
      paymentStatus: { $in: ['Pending', 'Paid'] },
    });

    const eventObj = event.toObject();
    eventObj.actualRegistrations = actualRegistrations;

    res.status(200).json({
      success: true,
      data: eventObj,
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

/**
 * @desc    Check if participant is registered for an event
 * @route   GET /api/events/:eventId/check-registration
 * @access  Private (Participant only)
 */
const checkRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      eventId: req.params.eventId,
      participantId: req.user._id,
    });

    res.status(200).json({
      success: true,
      isRegistered: !!registration,
      registration: registration || null,
    });
  } catch (error) {
    console.error('Check registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

module.exports = {
  browseEvents,
  getTrendingEvents,
  getEventDetails,
  checkRegistration,
};
