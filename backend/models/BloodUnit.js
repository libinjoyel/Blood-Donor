const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];
const STATUSES = ['Available', 'Reserved', 'Issued', 'Expired', 'Discarded'];

const bloodUnitSchema = new mongoose.Schema({
  unitId: {
    type: String,
    unique: true,
    trim: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  bloodGroup: {
    type: String,
    enum: BLOOD_GROUPS,
    required: [true, 'Blood group is required'],
    index: true,
  },
  component: {
    type: String,
    enum: COMPONENTS,
    required: [true, 'Component is required'],
  },
  donationDate: {
    type: Date,
    required: [true, 'Donation date is required'],
    index: true,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true,
  },
  status: {
    type: String,
    enum: STATUSES,
    default: 'Available',
    index: true,
  },
  storageLocation: {
    type: String,
    trim: true,
    index: true,
  },
  barcode: {
    type: String,
    unique: true,
    trim: true,
    index: true,
  },
  remarks: {
    type: String,
    trim: true,
  },
  reservedFor: {
    type: String,
    trim: true,
  },
  reservedAt: {
    type: Date,
  },
  issuedTo: {
    patientName: { type: String, trim: true },
    hospital: { type: String, trim: true },
    doctor: { type: String, trim: true },
    issueDate: { type: Date },
  },
  issuedAt: {
    type: Date,
  },
  discardedAt: {
    type: Date,
  },
  discardedReason: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

bloodUnitSchema.pre('save', async function () {
  if (!this.unitId) {
    const last = await this.constructor.findOne({}, { unitId: 1 }).sort({ unitId: -1 });
    let seq = 1;
    if (last && last.unitId) {
      const num = parseInt(last.unitId.replace(/\D/g, ''), 10);
      seq = (Number.isNaN(num) ? 0 : num) + 1;
    }
    this.unitId = `BLD${String(seq).padStart(6, '0')}`;
  }
  if (!this.barcode) {
    const suffix = (this.unitId || '').replace(/^BLD/, '');
    this.barcode = `LF${suffix}`;
  }
});

bloodUnitSchema.index({ bloodGroup: 1, status: 1 });
bloodUnitSchema.index({ expiryDate: 1, status: 1 });

module.exports = mongoose.model('BloodUnit', bloodUnitSchema);
