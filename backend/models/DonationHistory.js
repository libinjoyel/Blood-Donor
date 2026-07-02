const mongoose = require('mongoose');

const donationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true,
  },
  donationDate: {
    type: Date,
    required: [true, 'Donation date is required'],
  },
  bloodGroup: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  units: {
    type: Number,
    default: 1,
    min: 1,
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled'],
    default: 'completed',
  },
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

donationHistorySchema.index({ userId: 1, donationDate: -1 });

module.exports = mongoose.model('DonationHistory', donationHistorySchema);
