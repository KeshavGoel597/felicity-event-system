/**
 * Validate if email belongs to IIIT domains
 * @param {String} email - Email address to validate
 * @returns {Boolean} True if valid IIIT email, false otherwise
 */
const isIIITEmail = (email) => {
  const iiitDomains = [
    '@iiit.ac.in',
    '@students.iiit.ac.in',
    '@research.iiit.ac.in',
  ];
  
  const emailLower = email.toLowerCase().trim();
  
  return iiitDomains.some(domain => emailLower.endsWith(domain));
};

/**
 * Validate IIIT email based on participant type
 * @param {String} email - Email address
 * @param {String} participantType - 'IIIT' or 'Non-IIIT'
 * @returns {Object} { isValid: Boolean, message: String }
 */
const validateParticipantEmail = (email, participantType) => {
  if (participantType === 'IIIT') {
    if (!isIIITEmail(email)) {
      return {
        isValid: false,
        message: 'IIIT participants must use an IIIT-issued email address (@iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)',
      };
    }
  }
  
  return { isValid: true, message: '' };
};

module.exports = {
  isIIITEmail,
  validateParticipantEmail,
};
