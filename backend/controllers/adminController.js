const User = require('../models/User');
const Role = require('../models/Role');
const BloodStock = require('../models/BloodStock');
const bcrypt = require('bcryptjs');
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

exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, password, role, isEligible } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password || Math.random().toString(36).slice(2), 10);
    const user = new User({
      name,
      email,
      phone,
      bloodGroup,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'donor',
      isEligible: isEligible !== undefined ? isEligible : true,
    });
    await user.save();

    res.status(201).json({ message: 'Donor created successfully', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, bloodGroup: user.bloodGroup, role: user.role } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map((e) => e.message).join(', ') });
    }
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

exports.getAdmins = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: 'admin' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { adminRole: { $regex: search, $options: 'i' } },
      ];
    }
    const admins = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, adminRole } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role: 'admin', adminRole: adminRole || '' });
    await user.save();

    res.status(201).json({ message: 'Admin created successfully', user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, adminRole: user.adminRole } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, phone, adminRole, password } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (adminRole !== undefined) update.adminRole = adminRole;
    if (password) update.password = await bcrypt.hash(password, 10);

    const admin = await User.findOneAndUpdate({ _id: req.params.id, role: 'admin' }, update, { new: true, runValidators: true }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = new Role({
      name,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
    });
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (permissions !== undefined) update.permissions = permissions;

    const role = await Role.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    await User.updateMany({ adminRole: role.name }, { $unset: { adminRole: '' } });
    res.json({ message: 'Role deleted successfully' });
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

exports.getBloodStock = async (req, res) => {
  try {
    const existing = await BloodStock.find().sort({ bloodGroup: 1 });
    const byGroup = {};
    existing.forEach((s) => { byGroup[s.bloodGroup] = s; });

    const missing = BLOOD_GROUPS.filter((g) => !byGroup[g]);
    if (missing.length > 0) {
      const created = await BloodStock.insertMany(missing.map((g) => ({ bloodGroup: g, units: 0 })));
      created.forEach((s) => { byGroup[s.bloodGroup] = s; });
    }

    res.json(BLOOD_GROUPS.map((g) => byGroup[g]));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBloodStock = async (req, res) => {
  try {
    const { units } = req.body;
    const parsed = Math.max(0, Math.round(Number(units) || 0));

    const stock = await BloodStock.findOneAndUpdate(
      { bloodGroup: req.params.bloodGroup },
      { units: parsed, updatedBy: req.user._id },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
