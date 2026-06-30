const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    index: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
  services: {
    type: [String],
    default: [],
  },
  workingHours: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

bloodBankSchema.index({ name: 'text', city: 'text', address: 'text' });

module.exports = mongoose.model('BloodBank', bloodBankSchema);
