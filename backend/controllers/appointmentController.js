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
