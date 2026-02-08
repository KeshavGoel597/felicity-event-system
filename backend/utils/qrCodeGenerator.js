const QRCode = require('qrcode');

/**
 * Generate QR code as base64 image
 * @param {Object} data - Data to encode in QR code
 * @param {String} data.ticketId - Ticket ID
 * @param {String} data.participantId - Participant ID
 * @param {String} data.participantName - Participant full name
 * @param {String} data.eventId - Event ID
 * @param {String} data.eventName - Event name
 * @param {String} data.eventDate - Event date
 * @returns {Promise<String>} Base64 encoded QR code image
 */
const generateQRCode = async (data) => {
  try {
    // Convert data object to JSON string
    const qrData = JSON.stringify(data);
    
    // Generate QR code as base64 image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H', // High error correction
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeImage;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Decode QR code data
 * @param {String} qrDataString - JSON string from QR code
 * @returns {Object} Decoded QR data
 */
const decodeQRData = (qrDataString) => {
  try {
    return JSON.parse(qrDataString);
  } catch (error) {
    throw new Error('Invalid QR code data');
  }
};

module.exports = {
  generateQRCode,
  decodeQRData,
};
