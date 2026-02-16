const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const organizerSchema = new mongoose.Schema(
  {
    organizerName: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: [
          'Technical',
          'Cultural',
          'Sports',
          'Literary',
          'Arts',
          'Gaming',
          'Social',
          'Academic',
          'Other',
        ],
        message: 'Please select a valid category',
      },
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    loginEmail: {
      type: String,
      required: [true, 'Login email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid contact email',
      ],
    },
    contactNumber: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit contact number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    discordWebhook: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: 'organizer',
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
organizerSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
organizerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Organizer', organizerSchema);
