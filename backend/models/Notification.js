const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['appointment_reminder', 'donation_completed', 'eligibility', 'system'],
    required: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  read: {
    type: Boolean,
    default: false,
  },
  link: {
    type: String,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
