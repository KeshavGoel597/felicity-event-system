const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default in queries
    },
    participantType: {
      type: String,
      enum: {
        values: ['IIIT', 'Non-IIIT'],
        message: 'Participant type must be either IIIT or Non-IIIT',
      },
      required: [true, 'Participant type is required'],
    },
    collegeName: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required'],
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number'],
    },
    areasOfInterest: {
      type: [String],
      default: [],
    },
    followedClubs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organizer',
      },
    ],
    role: {
      type: String,
      default: 'participant',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password for login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual field for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
