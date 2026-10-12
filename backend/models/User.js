const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    isPro: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    googleTokens: {
      type: Object,
      default: null,
    },
    googleCalendarConnected: {
      type: Boolean,
      default: false,
    },
    googleCalendarConnectedAt: {
      type: Date,
      default: null,
    },
    googleCalendarLastSyncAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    lastWeeklySummarySentAt: {
      type: Date,
      default: null,
    },
    preferences: {
      defaultTaskLayout: {
        type: String,
        enum: ['table', 'grid'],
        default: 'table',
      },
      taskReminders: {
        type: Boolean,
        default: true,
      },
      overdueTasks: {
        type: Boolean,
        default: true,
      },
      weeklySummary: {
        type: Boolean,
        default: true,
      },
      productUpdates: {
        type: Boolean,
        default: false,
      },
      emailAlerts: {
        type: Boolean,
        default: true,
      },
      overdueAlerts: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password before saving to database
userSchema.pre('save', async function () {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
