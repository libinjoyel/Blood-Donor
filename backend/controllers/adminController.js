const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const Appointment = require('../models/Appointment');
const UrgentRequest = require('../models/UrgentRequest');
const DonationHistory = require('../models/DonationHistory');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');

exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalBloodBanks,
      totalAppointments,
      totalDonations,
      totalRequests,
      totalFeedback,
      recentAppointments,
      recentDonations,
      bloodGroupStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      BloodBank.countDocuments(),
      Appointment.countDocuments(),
      DonationHistory.countDocuments({ status: 'completed' }),
      UrgentRequest.countDocuments(),
      Feedback.countDocuments(),
      Appointment.find().populate('userId', 'name email bloodGroup').populate('bloodBankId', 'name').sort({ createdAt: -1 }).limit(5),
      DonationHistory.find().populate('userId', 'name bloodGroup').populate('bloodBankId', 'name').sort({ createdAt: -1 }).limit(5),
      User.aggregate([
        { $match: { role: 'donor' } },
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalDonors,
        totalBloodBanks,
        totalAppointments,
        totalDonations,
        totalRequests,
        totalFeedback,
      },
      bloodGroupStats,
      recentAppointments,
      recentDonations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, role, bloodGroup } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (bloodGroup) filter.bloodGroup = bloodGroup;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, role, address, isEligible } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
    if (role !== undefined) update.role = role;
    if (address !== undefined) update.address = address;
    if (isEligible !== undefined) update.isEligible = isEligible;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await Promise.all([
      Appointment.deleteMany({ userId: user._id }),
      DonationHistory.deleteMany({ userId: user._id }),
      Notification.deleteMany({ userId: user._id }),
      Feedback.deleteMany({ userId: user._id }),
    ]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const { status, userId, bloodBankId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (bloodBankId) filter.bloodBankId = bloodBankId;

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email phone bloodGroup')
      .populate('bloodBankId', 'name city')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { status, date, time } = req.body;
    const update = {};
    if (status) update.status = status;
    if (date) update.date = new Date(date);
    if (time) update.time = time;

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
      .populate('userId', 'name email bloodGroup')
      .populate('bloodBankId', 'name city');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const { search, bloodGroup, city, status } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { hospital: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
      ];
    }
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (status) filter.status = status;

    const requests = await UrgentRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { hospital, bloodGroup, units, city, contact, status } = req.body;
    const update = {};
    if (hospital !== undefined) update.hospital = hospital;
    if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
    if (units !== undefined) update.units = units;
    if (city !== undefined) update.city = city;
    if (contact !== undefined) update.contact = contact;
    if (status !== undefined) update.status = status;

    const request = await UrgentRequest.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const { bloodBankId, rating } = req.query;
    const filter = {};
    if (bloodBankId) filter.bloodBankId = bloodBankId;
    if (rating) filter.rating = parseInt(rating);

    const feedback = await Feedback.find(filter)
      .populate('userId', 'name email bloodGroup')
      .populate('bloodBankId', 'name city')
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
