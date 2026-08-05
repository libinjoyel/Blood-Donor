const BloodUnit = require('../models/BloodUnit');
const BloodTransaction = require('../models/BloodTransaction');
const BloodStock = require('../models/BloodStock');
const DonationHistory = require('../models/DonationHistory');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPONENTS = ['Whole Blood', 'Red Blood Cells', 'Plasma', 'Platelets'];

const COMPONENT_SHELF_LIFE_DAYS = {
  'Whole Blood': 35,
  'Red Blood Cells': 42,
  'Plasma': 365,
  'Platelets': 5,
};

const LOW_STOCK_THRESHOLD = 10;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function logTransaction({ bloodUnit, action, user, notes }) {
  await BloodTransaction.create({
    bloodUnit: bloodUnit._id,
    unitId: bloodUnit.unitId,
    bloodGroup: bloodUnit.bloodGroup,
    action,
    performedBy: user?._id,
    performedByName: user?.name,
    notes: notes || '',
  });
}

async function markExpiredUnits() {
  const now = new Date();
  const expired = await BloodUnit.find({
    status: { $in: ['Available', 'Reserved'] },
    expiryDate: { $lt: now },
  });
  for (const unit of expired) {
    unit.status = 'Expired';
    await unit.save();
    await logTransaction({ bloodUnit: unit, action: 'Expired', notes: 'Auto-expired on reaching expiry date' });
  }
  return expired.length;
}

async function markExpiringSoon() {
  const now = new Date();
  const in7Days = addDays(now, 7);
  return BloodUnit.countDocuments({
    status: { $in: ['Available', 'Reserved'] },
    expiryDate: { $gte: now, $lte: in7Days },
  });
}

function monthKey(date) {
  return date.toISOString().slice(0, 7);
}

function lastMonths(n) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

exports.getUnits = async (req, res) => {
  try {
    await markExpiredUnits();
    const {
      search, bloodGroup, component, status, storageLocation,
      donationDate, expiryDate,
    } = req.query;
    const filter = {};

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { unitId: regex },
        { barcode: regex },
        { storageLocation: regex },
        { remarks: regex },
        { reservedFor: regex },
      ];
    }
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (component) filter.component = component;
    if (status) filter.status = status;
    if (storageLocation) filter.storageLocation = { $regex: storageLocation, $options: 'i' };
    if (donationDate) {
      const start = new Date(donationDate);
      const end = addDays(start, 1);
      filter.donationDate = { $gte: start, $lt: end };
    }
    if (expiryDate) {
      const start = new Date(expiryDate);
      const end = addDays(start, 1);
      filter.expiryDate = { $gte: start, $lt: end };
    }

    const units = await BloodUnit.find(filter)
      .populate('donor', 'name email phone bloodGroup')
      .sort({ createdAt: -1 });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnit = async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id).populate('donor', 'name email phone bloodGroup');
    if (!unit) {
      return res.status(404).json({ message: 'Blood unit not found' });
    }
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUnit = async (req, res) => {
  try {
    const { donor, bloodGroup, component, donationDate, expiryDate, storageLocation, remarks } = req.body;

    if (!donor || !bloodGroup || !component || !donationDate) {
      return res.status(400).json({ message: 'Donor, blood group, component and donation date are required' });
    }

    const donation = donationDate ? new Date(donationDate) : new Date();
    const expiry = expiryDate
      ? new Date(expiryDate)
      : addDays(donation, COMPONENT_SHELF_LIFE_DAYS[component] || 35);

    const unit = new BloodUnit({
      donor,
      bloodGroup,
      component,
      donationDate: donation,
      expiryDate: expiry,
      storageLocation: storageLocation || '',
      remarks: remarks || '',
    });
    await unit.save();
    await logTransaction({ bloodUnit: unit, action: 'Created', user: req.user, notes: `Unit created (${component})` });

    const populated = await BloodUnit.findById(unit._id).populate('donor', 'name email phone bloodGroup');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { bloodGroup, component, donationDate, expiryDate, storageLocation, remarks } = req.body;
    const update = {};
    if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
    if (component !== undefined) update.component = component;
    if (donationDate !== undefined) update.donationDate = new Date(donationDate);
    if (expiryDate !== undefined) update.expiryDate = new Date(expiryDate);
    if (storageLocation !== undefined) update.storageLocation = storageLocation;
    if (remarks !== undefined) update.remarks = remarks;

    const unit = await BloodUnit.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('donor', 'name email phone bloodGroup');
    if (!unit) {
      return res.status(404).json({ message: 'Blood unit not found' });
    }
    await logTransaction({ bloodUnit: unit, action: 'Updated', user: req.user, notes: 'Unit details updated' });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const unit = await BloodUnit.findByIdAndDelete(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Blood unit not found' });
    }
    await BloodTransaction.create({
      bloodUnit: unit._id,
      unitId: unit.unitId,
      bloodGroup: unit.bloodGroup,
      action: 'Updated',
      performedBy: req.user?._id,
      performedByName: req.user?.name,
      notes: 'Unit record deleted from inventory (history retained)',
    });
    res.json({ message: 'Blood unit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reserveUnit = async (req, res) => {
  try {
    const { reservedFor, remarks } = req.body;
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Blood unit not found' });
    }
    if (unit.status !== 'Available') {
      return res.status(400).json({ message: `Only available units can be reserved (current status: ${unit.status})` });
    }

    unit.status = 'Reserved';
    unit.reservedFor = reservedFor || '';
    unit.reservedAt = new Date();
    await unit.save();
    await logTransaction({ bloodUnit: unit, action: 'Reserved', user: req.user, notes: remarks || reservedFor || 'Reserved for patient' });

    const populated = await BloodUnit.findById(unit._id).populate('donor', 'name email phone bloodGroup');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.issueUnit = async (req, res) => {
  try {
    const { patientName, hospital, doctor, remarks } = req.body;
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Blood unit not found' });
    }
    if (unit.status === 'Issued') {
      return res.status(400).json({ message: 'This unit is already issued' });
    }
    if (unit.status === 'Expired' || unit.status === 'Discarded') {
      return res.status(400).json({ message: `Cannot issue a ${unit.status.toLowerCase()} unit` });
    }

    const previousStatus = unit.status;
    unit.status = 'Issued';
    unit.issuedTo = {
      patientName: patientName || '',
      hospital: hospital || '',
      doctor: doctor || '',
      issueDate: new Date(),
    };
    unit.issuedAt = new Date();
    await unit.save();

    const stock = await BloodStock.findOne({ bloodGroup: unit.bloodGroup });
    if (stock && stock.units > 0) {
      stock.units -= 1;
      await stock.save();
    }

    await logTransaction({
      bloodUnit: unit,
      action: 'Issued',
      user: req.user,
      notes: [previousStatus, patientName, hospital, doctor, remarks].filter(Boolean).join(' | '),
    });

    const populated = await BloodUnit.findById(unit._id).populate('donor', 'name email phone bloodGroup');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.discardUnit = async (req, res) => {
  try {
    const { remarks } = req.body;
    const unit = await BloodUnit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ message: 'Blood unit not found' });
    }
    if (unit.status === 'Discarded') {
      return res.status(400).json({ message: 'This unit is already discarded' });
    }

    unit.status = 'Discarded';
    unit.discardedAt = new Date();
    unit.discardedReason = remarks || '';
    await unit.save();
    await logTransaction({ bloodUnit: unit, action: 'Discarded', user: req.user, notes: remarks || 'Discarded' });

    const populated = await BloodUnit.findById(unit._id).populate('donor', 'name email phone bloodGroup');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { bloodUnit } = req.query;
    const filter = {};
    if (bloodUnit) filter.bloodUnit = bloodUnit;

    const transactions = await BloodTransaction.find(filter).sort({ actionDate: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await BloodUnit.distinct('storageLocation');
    res.json(locations.filter(Boolean).sort());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const expiredCount = await markExpiredUnits();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = addDays(todayStart, 1);

    const [allUnits, issuedToday, expiringSoon, donationAgg, usageAgg, expiryAgg, stockRows] = await Promise.all([
      BloodUnit.find().populate('donor', 'name'),
      BloodUnit.countDocuments({ status: 'Issued', issuedAt: { $gte: todayStart, $lt: todayEnd } }),
      markExpiringSoon(),
      DonationHistory.aggregate([
        { $match: { donationDate: { $gte: addDays(now, -180) }, status: 'completed' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$donationDate' } }, count: { $sum: '$units' } } },
      ]),
      BloodUnit.aggregate([
        { $match: { status: 'Issued', issuedAt: { $exists: true, $ne: null, $gte: addDays(now, -180) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$issuedAt' } }, count: { $sum: 1 } } },
      ]),
      BloodUnit.aggregate([
        { $match: { status: { $in: ['Available', 'Reserved'] }, expiryDate: { $exists: true, $ne: null } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$expiryDate' } }, count: { $sum: 1 } } },
      ]),
      BloodStock.find(),
    ]);

    const byGroup = {};
    const unitList = allUnits;

    BLOOD_GROUPS.forEach((bg) => {
      const groupUnits = unitList.filter((u) => u.bloodGroup === bg && u.status === 'Available');
      const reserved = unitList.filter((u) => u.bloodGroup === bg && u.status === 'Reserved').length;
      const expiring = unitList.filter((u) => u.bloodGroup === bg && ['Available', 'Reserved'].includes(u.status) && u.expiryDate >= now && u.expiryDate <= addDays(now, 7)).length;
      const manual = stockRows.find((s) => s.bloodGroup === bg);
      byGroup[bg] = {
        available: groupUnits.length,
        reserved,
        expiringSoon: expiring,
        manualUnits: manual?.units ?? 0,
        belowThreshold: groupUnits.length < LOW_STOCK_THRESHOLD,
      };
    });

    const totalAvailable = unitList.filter((u) => u.status === 'Available').length;
    const totalReserved = unitList.filter((u) => u.status === 'Reserved').length;
    const totalExpired = unitList.filter((u) => u.status === 'Expired').length;
    const totalDiscarded = unitList.filter((u) => u.status === 'Discarded').length;
    const totalIssued = unitList.filter((u) => u.status === 'Issued').length;
    const bloodGroupsBelowThreshold = BLOOD_GROUPS.filter((bg) => byGroup[bg].belowThreshold);
    const expiringSoonAll = unitList.filter((u) => ['Available', 'Reserved'].includes(u.status) && u.expiryDate >= now && u.expiryDate <= addDays(now, 7)).length;

    const keys = lastMonths(6);
    const donationsMap = Object.fromEntries(donationAgg.map((d) => [d._id, d.count]));
    const usageMap = Object.fromEntries(usageAgg.map((d) => [d._id, d.count]));
    const expiryMap = Object.fromEntries(expiryAgg.map((d) => [d._id, d.count]));

    const bloodGroupDistribution = BLOOD_GROUPS.map((bg) => ({
      bloodGroup: bg,
      count: unitList.filter((u) => u.bloodGroup === bg).length,
    }));

    const monthlyDonations = keys.map((k) => ({ month: k, label: monthLabel(k), count: donationsMap[k] || 0 }));
    const monthlyUsage = keys.map((k) => ({ month: k, label: monthLabel(k), count: usageMap[k] || 0 }));
    const expiryTrend = keys.map((k) => ({ month: k, label: monthLabel(k), count: expiryMap[k] || 0 }));

    res.json({
      stats: {
        totalAvailable,
        totalReserved,
        issuedToday,
        totalExpired,
        totalDiscarded,
        totalIssued,
        expiringSoon: expiringSoonAll,
        bloodGroupsBelowThreshold,
        autoExpired: expiredCount,
      },
      byGroup,
      charts: {
        bloodGroupDistribution,
        monthlyDonations,
        monthlyUsage,
        expiryTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
