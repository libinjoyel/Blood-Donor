const Appointment = require('../models/Appointment');

exports.book = async (req, res) => {
  try {
    const { bloodBankId, date, time } = req.body;

    const existing = await Appointment.findOne({
      userId: req.user._id,
      bloodBankId,
      date: new Date(date),
      time,
      status: 'scheduled',
    });
    if (existing) {
      return res.status(400).json({ message: 'You already have an appointment at this time' });
    }

    const appointment = new Appointment({
      userId: req.user._id,
      bloodBankId,
      date: new Date(date),
      time,
    });
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('bloodBankId', 'name city address');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'scheduled' },
      { status: 'cancelled' },
      { new: true }
    );
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

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, status: 'scheduled' },
      { date: new Date(date), time },
      { new: true, runValidators: true }
    ).populate('bloodBankId', 'name city address');

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
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user._id,
      status: 'scheduled',
    }).populate('bloodBankId', 'name city');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found or already completed/cancelled' });
    }

    appointment.status = 'completed';
    await appointment.save();

    const DonationHistory = require('../models/DonationHistory');
    const Notification = require('../models/Notification');
    const User = require('../models/User');

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const donation = new DonationHistory({
      userId: req.user._id,
      bloodBankId: appointment.bloodBankId._id,
      donationDate: appointment.date,
      bloodGroup: user.bloodGroup,
      units: 1,
      status: 'completed',
    });
    await donation.save();

    user.donationCount = (user.donationCount || 0) + 1;
    user.lastDonationDate = new Date();
    user.isEligible = false;
    await user.save();

    const notification = new Notification({
      userId: req.user._id,
      type: 'donation_completed',
      message: `Your blood donation at ${appointment.bloodBankId.name} on ${new Date(appointment.date).toLocaleDateString('en-IN')} has been recorded. Thank you for saving lives!`,
      link: '/donation-history',
    });
    await notification.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('bloodBankId', 'name city address phone');

    res.json({ appointment: populated, donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate('bloodBankId', 'name city address phone')
      .sort({ date: -1, time: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
