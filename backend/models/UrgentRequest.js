const mongoose = require('mongoose');

const urgentRequestSchema = new mongoose.Schema({
  hospital: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  units: {
    type: Number,
    required: [true, 'Units are required'],
    min: [1, 'At least 1 unit required'],
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    index: true,
  },
  contact: {
    type: String,
    required: [true, 'Contact is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['urgent', 'fulfilled', 'closed'],
    default: 'urgent',
    index: true,
  },
}, {
  timestamps: true,
});

urgentRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UrgentRequest', urgentRequestSchema);
