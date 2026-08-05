const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function () {
      return this.role === 'donor';
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  role: {
    type: String,
    enum: ['donor', 'admin'],
    default: 'donor',
  },
  adminRole: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
  },
  donationCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isEligible: {
    type: Boolean,
    default: true,
  },
  lastDonationDate: {
    type: Date,
  },
  nextAppointment: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
