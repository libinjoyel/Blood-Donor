const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const bloodStockSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: BLOOD_GROUPS,
    unique: true,
    required: [true, 'Blood group is required'],
  },
  units: {
    type: Number,
    default: 0,
    min: 0,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BloodStock', bloodStockSchema);
