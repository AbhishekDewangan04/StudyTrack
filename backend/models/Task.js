const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Please add a deadline date'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    deadlineReminderSent: {
      type: Boolean,
      default: false,
    },
    deadlineReminderSentAt: {
      type: Date,
      default: null,
    },
    overdueNoticeSent: {
      type: Boolean,
      default: false,
    },
    overdueNoticeSentAt: {
      type: Date,
      default: null,
    },
    googleCalendarEventId: {
      type: String,
      default: null,
    },
    googleCalendarSyncedAt: {
      type: Date,
      default: null,
    },
    // Optional Study Location Fields
    locationName: {
      type: String,
      trim: true,
      default: '',
    },
    locationAddress: {
      type: String,
      trim: true,
      default: '',
    },
    locationLatitude: {
      type: Number,
      default: null,
    },
    locationLongitude: {
      type: Number,
      default: null,
    },
    googleMapsUrl: {
      type: String,
      trim: true,
      default: '',
    },
    // Optional Recurring Task Fields
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceType: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    recurrenceEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Task', taskSchema);
