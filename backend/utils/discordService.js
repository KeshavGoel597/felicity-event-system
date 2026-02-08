const axios = require('axios');

/**
 * Send event notification to Discord webhook
 * @param {String} webhookUrl - Discord webhook URL
 * @param {Object} eventData - Event details
 * @param {String} eventData.eventName - Name of the event
 * @param {String} eventData.eventDescription - Event description
 * @param {String} eventData.eventType - Normal or Merchandise
 * @param {Date} eventData.eventStartDate - Event start date
 * @param {Date} eventData.eventEndDate - Event end date
 * @param {Date} eventData.registrationDeadline - Registration deadline
 * @param {Number} eventData.registrationFee - Registration fee
 * @param {String} eventData.eligibility - IIIT Only or Open to All
 * @param {String} eventData.location - Event location (optional)
 * @param {String} registrationLink - Link to register for event (optional)
 */
const sendDiscordNotification = async (webhookUrl, eventData, registrationLink = '') => {
  try {
    // Format dates
    const startDate = new Date(eventData.eventStartDate).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const endDate = new Date(eventData.eventEndDate).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const deadline = new Date(eventData.registrationDeadline).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Build Discord embed message
    const embed = {
      title: `🎉 New Event Published: ${eventData.eventName}`,
      description: eventData.eventDescription || 'No description provided',
      color: eventData.eventType === 'Merchandise' ? 0x9c27b0 : 0x667eea, // Purple for merchandise, blue for normal
      fields: [
        {
          name: '📋 Event Type',
          value: eventData.eventType,
          inline: true,
        },
        {
          name: '🎫 Eligibility',
          value: eventData.eligibility,
          inline: true,
        },
        {
          name: '💰 Registration Fee',
          value: eventData.registrationFee === 0 ? 'Free' : `₹${eventData.registrationFee}`,
          inline: true,
        },
        {
          name: '📅 Event Start',
          value: startDate,
          inline: true,
        },
        {
          name: '📅 Event End',
          value: endDate,
          inline: true,
        },
        {
          name: '⏰ Registration Deadline',
          value: deadline,
          inline: true,
        },
      ],
      footer: {
        text: 'Felicity Event Management System',
      },
      timestamp: new Date().toISOString(),
    };

    // Add location if provided
    if (eventData.location) {
      embed.fields.push({
        name: '📍 Location',
        value: eventData.location,
        inline: false,
      });
    }

    // Add registration link if provided
    if (registrationLink) {
      embed.fields.push({
        name: '🔗 Register Here',
        value: registrationLink,
        inline: false,
      });
    }

    // Prepare Discord webhook payload
    const payload = {
      username: 'Felicity Events',
      avatar_url: '', // You can add a logo URL here if available
      embeds: [embed],
    };

    // Send to Discord
    await axios.post(webhookUrl, payload);
    
    console.log(`✅ Discord notification sent for event: ${eventData.eventName}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Discord notification failed: ${error.message}`);
    // Don't throw error - Discord failure should not fail event publishing
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendDiscordNotification,
};
