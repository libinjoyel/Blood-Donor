const mongoose = require('mongoose');

const ACTIONS = ['Created', 'Reserved', 'Issued', 'Discarded', 'Expired', 'Updated'];

const bloodTransactionSchema = new mongoose.Schema({
  bloodUnit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodUnit',
    required: true,
    index: true,
  },
  unitId: {
    type: String,
    index: true,
  },
  bloodGroup: {
    type: String,
  },
  action: {
    type: String,
    enum: ACTIONS,
    required: true,
    index: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  performedByName: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  actionDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

bloodTransactionSchema.index({ bloodUnit: 1, actionDate: -1 });

module.exports = mongoose.model('BloodTransaction', bloodTransactionSchema);
