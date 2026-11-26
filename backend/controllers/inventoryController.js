const BloodUnit = require('../models/BloodUnit');
const BloodTransaction = require('../models/BloodTransaction');
const BloodStock = require('../models/BloodStock');
const DonationHistory = require('../models/DonationHistory');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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
  const expired = await BloodUnit.expirePendingUnits(new Date());
  if (expired.length > 0) {
    await Promise.all(
      expired.map((unit) =>
        logTransaction({ bloodUnit: unit, action: 'Expired', notes: 'Auto-expired on reaching expiry date' })
      )
    );
  }
  return expired.length;
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

    let donationDateStart;
    let donationDateEnd;
    if (donationDate) {
      donationDateStart = new Date(donationDate);
      donationDateEnd = addDays(donationDateStart, 1);
    }

    let expiryDateStart;
    let expiryDateEnd;
    if (expiryDate) {
      expiryDateStart = new Date(expiryDate);
      expiryDateEnd = addDays(expiryDateStart, 1);
    }

    const units = await BloodUnit.findAll({
      search,
      bloodGroup,
      component,
      status,
      storageLocation,
      donationDateStart,
      donationDateEnd,
      expiryDateStart,
      expiryDateEnd,
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnit = async (req, res) => {
  try {
    const unit = await BloodUnit.findById(req.params.id);
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
    const { bloodGroup, component, donationDate, expiryDate, storageLocation, remarks } = req.body;

    if (!bloodGroup || !component || !donationDate) {
      return res.status(400).json({ message: 'Blood group, component and donation date are required' });
    }

    const donation = donationDate ? new Date(donationDate) : new Date();
    const expiry = expiryDate
      ? new Date(expiryDate)
      : addDays(donation, COMPONENT_SHELF_LIFE_DAYS[component] || 35);

    const unit = await BloodUnit.create({
      bloodGroup,
      component,
      donationDate: donation,
      expiryDate: expiry,
      storageLocation: storageLocation || '',
      remarks: remarks || '',
    });
    await logTransaction({ bloodUnit: unit, action: 'Created', user: req.user, notes: `Unit created (${component})` });

    res.status(201).json(unit);
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

    const unit = await BloodUnit.updateById(req.params.id, update);
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
    const unit = await BloodUnit.deleteById(req.params.id);
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

    const populated = await BloodUnit.updateById(unit._id, {
      status: 'Reserved',
      reservedFor: reservedFor || '',
      reservedAt: new Date(),
    });
    await logTransaction({ bloodUnit: populated, action: 'Reserved', user: req.user, notes: remarks || reservedFor || 'Reserved for patient' });

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
    const now = new Date();
    const populated = await BloodUnit.updateById(unit._id, {
      status: 'Issued',
      issuedTo: {
        patientName: patientName || '',
        hospital: hospital || '',
        doctor: doctor || '',
        issueDate: now,
      },
      issuedAt: now,
    });

    await BloodStock.decrementIfAvailable(unit.bloodGroup);

    await logTransaction({
      bloodUnit: populated,
      action: 'Issued',
      user: req.user,
      notes: [previousStatus, patientName, hospital, doctor, remarks].filter(Boolean).join(' | '),
    });

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

    const populated = await BloodUnit.updateById(unit._id, {
      status: 'Discarded',
      discardedAt: new Date(),
      discardedReason: remarks || '',
    });
    await logTransaction({ bloodUnit: populated, action: 'Discarded', user: req.user, notes: remarks || 'Discarded' });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { bloodUnit } = req.query;
    const transactions = await BloodTransaction.findAll({ bloodUnit });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await BloodUnit.getDistinctLocations();
    res.json(locations);
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
    const since180 = addDays(now, -180);

    const [unitList, issuedToday, donationAgg, usageAgg, expiryAgg, stockRows] = await Promise.all([
      BloodUnit.findAll(),
      BloodUnit.countIssuedBetween(todayStart, todayEnd),
      DonationHistory.getMonthlyDonations(since180),
      BloodUnit.getMonthlyUsage(since180),
      BloodUnit.getExpiryTrendAgg(),
      BloodStock.findAll(),
    ]);

    const byGroup = {};

    BLOOD_GROUPS.forEach((bg) => {
      const groupUnits = unitList.filter((u) => u.bloodGroup === bg && u.status === 'Available');
      const reserved = unitList.filter((u) => u.bloodGroup === bg && u.status === 'Reserved').length;
      const expiring = unitList.filter(
        (u) => u.bloodGroup === bg && ['Available', 'Reserved'].includes(u.status) && new Date(u.expiryDate) >= now && new Date(u.expiryDate) <= addDays(now, 7)
      ).length;
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
    const expiringSoonAll = unitList.filter(
      (u) => ['Available', 'Reserved'].includes(u.status) && new Date(u.expiryDate) >= now && new Date(u.expiryDate) <= addDays(now, 7)
    ).length;

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
