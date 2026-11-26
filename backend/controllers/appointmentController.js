const Appointment = require('../models/Appointment');
const DonationHistory = require('../models/DonationHistory');
const Notification = require('../models/Notification');
const User = require('../models/User');

exports.book = async (req, res) => {
  try {
    const { bloodBankId, date, time } = req.body;
    const parsedDate = new Date(date);

    const existing = await Appointment.findExistingScheduled({
      userId: req.user._id,
      bloodBankId,
      date: parsedDate,
      time,
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have an appointment at this time' });
    }

    const populated = await Appointment.create({
      userId: req.user._id,
      bloodBankId,
      date: parsedDate,
      time,
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const appointment = await Appointment.cancelForUser(req.params.id, req.user._id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or already completed/cancelled' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reschedule = async (req, res) => {
  try {
    const { date, time } = req.body;
    const appointment = await Appointment.rescheduleForUser(req.params.id, req.user._id, {
      date: new Date(date),
      time,
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or already completed/cancelled' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.complete = async (req, res) => {
  try {
    const appointment = await Appointment.findOneScheduledForUser(req.params.id, req.user._id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or already completed/cancelled' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const populated = await Appointment.markCompleted(appointment._id);

    const donation = await DonationHistory.create({
      userId: req.user._id,
      bloodBankId: appointment.bloodBankId._id,
      donationDate: appointment.date,
      bloodGroup: user.bloodGroup,
      units: 1,
      status: 'completed',
    });

    await User.updateById(req.user._id, {
      donationCount: (user.donationCount || 0) + 1,
      lastDonationDate: new Date(),
      isEligible: false,
    });

    await Notification.create({
      userId: req.user._id,
      type: 'donation_completed',
      message: `Your blood donation at ${appointment.bloodBankId.name} on ${new Date(appointment.date).toLocaleDateString('en-IN')} has been recorded. Thank you for saving lives!`,
      link: '/donation-history',
    });

    res.json({ appointment: populated, donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findByUser(req.user._id);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
