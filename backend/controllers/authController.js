const User = require('../models/User');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwtUtils');
const { validateParticipantEmail } = require('../utils/emailValidator');

/**
 * @desc    Register a new participant
 * @route   POST /api/auth/participant/signup
 * @access  Public
 */
const participantSignup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeName,
      contactNumber,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !participantType || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate participant type
    if (!['IIIT', 'Non-IIIT'].includes(participantType)) {
      return res.status(400).json({
        success: false,
        message: 'Participant type must be either IIIT or Non-IIIT',
      });
    }

    // Validate email based on participant type
    const emailValidation = validateParticipantEmail(email, participantType);
    if (!emailValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      participantType,
      collegeName,
      contactNumber,
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Return user data without password
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        participantType: user.participantType,
        collegeName: user.collegeName,
        contactNumber: user.contactNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Participant signup error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: error.message,
    });
  }
};

/**
 * @desc    Login participant
 * @route   POST /api/auth/participant/login
 * @access  Public
 */
const participantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Return user data without password
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        participantType: user.participantType,
        collegeName: user.collegeName,
        contactNumber: user.contactNumber,
        areasOfInterest: user.areasOfInterest,
        followedClubs: user.followedClubs,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Participant login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @desc    Login organizer
 * @route   POST /api/auth/organizer/login
 * @access  Public
 */
const organizerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find organizer by loginEmail and include password
    const organizer = await Organizer.findOne({ 
      loginEmail: email.toLowerCase() 
    }).select('+password');

    if (!organizer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if organizer is approved
    if (!organizer.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been disabled. Please contact admin for assistance.',
      });
    }

    // Check if password matches
    const isPasswordMatch = await organizer.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken(organizer._id, organizer.role);

    // Return organizer data without password
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        category: organizer.category,
        description: organizer.description,
        loginEmail: organizer.loginEmail,
        contactEmail: organizer.contactEmail,
        contactNumber: organizer.contactNumber,
        discordWebhook: organizer.discordWebhook,
        role: organizer.role,
        isApproved: organizer.isApproved,
      },
    });
  } catch (error) {
    console.error('Organizer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find admin and include password
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password matches
    const isPasswordMatch = await admin.matchPassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken(admin._id, admin.role);

    // Return admin data without password
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

module.exports = {
  participantSignup,
  participantLogin,
  organizerLogin,
  adminLogin,
};
