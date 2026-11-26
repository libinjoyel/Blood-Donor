const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const BloodStock = require('../models/BloodStock');
const BloodBank = require('../models/BloodBank');
const Appointment = require('../models/Appointment');
const UrgentRequest = require('../models/UrgentRequest');
const DonationHistory = require('../models/DonationHistory');
const Feedback = require('../models/Feedback');

exports.getStats = async (req, res) => {
  try {
    const [
      countsRes,
      recentAppointments,
      recentDonations,
      bloodGroupStats,
    ] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*)::int FROM users) AS "totalUsers",
          (SELECT COUNT(*)::int FROM users WHERE role = 'donor') AS "totalDonors",
          (SELECT COUNT(*)::int FROM blood_banks) AS "totalBloodBanks",
          (SELECT COUNT(*)::int FROM appointments) AS "totalAppointments",
          (SELECT COUNT(*)::int FROM donation_history WHERE status = 'completed') AS "totalDonations",
          (SELECT COUNT(*)::int FROM urgent_requests) AS "totalRequests",
          (SELECT COUNT(*)::int FROM feedback) AS "totalFeedback"
      `),
      Appointment.findAll({ limit: 5 }),
      DonationHistory.findRecent(5),
      User.getBloodGroupStats(),
    ]);

    res.json({
      stats: countsRes.rows[0],
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
    const users = await User.findAll({ search, role, bloodGroup });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, password, role, isEligible } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password || Math.random().toString(36).slice(2), 10);
    const user = await User.create({
      name,
      email,
      phone,
      bloodGroup,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'donor',
      isEligible: isEligible !== undefined ? isEligible : true,
    });

    res.status(201).json({
      message: 'Donor created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.statusCode === 400 || error.code === '23505') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
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

    const user = await User.updateById(req.params.id, update);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    if (error.statusCode === 400 || error.code === '23505') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.deleteById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const { search } = req.query;
    const admins = await User.findAll({ search, role: 'admin' });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, adminRole } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin',
      adminRole: adminRole || '',
    });

    res.status(201).json({
      message: 'Admin created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        adminRole: user.adminRole,
      },
    });
  } catch (error) {
    if (error.statusCode === 400 || error.code === '23505') {
      return res.status(400).json({ message: error.message });
    }
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

    const admin = await User.updateById(req.params.id, update, { roleFilter: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    if (error.statusCode === 400 || error.code === '23505') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.deleteById(req.params.id, { roleFilter: 'admin' });
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
    const roles = await Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.create({
      name,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
    });
    res.status(201).json(role);
  } catch (error) {
    if (error.code === '23505') {
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

    const role = await Role.updateById(req.params.id, update);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Role with this name already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.deleteById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    await User.clearAdminRole(role.name);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const { status, userId, bloodBankId } = req.query;
    const appointments = await Appointment.findAll({ status, userId, bloodBankId });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { status, date, time } = req.body;
    const appointment = await Appointment.updateById(req.params.id, {
      status,
      date: date ? new Date(date) : undefined,
      time,
    });
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
    const requests = await UrgentRequest.findAll({ search, bloodGroup, city, status });
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

    const request = await UrgentRequest.updateById(req.params.id, update);
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
    const feedback = await Feedback.findAll({ bloodBankId, rating });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.deleteById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBloodStock = async (req, res) => {
  try {
    const stock = await BloodStock.ensureAllGroups();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBloodStock = async (req, res) => {
  try {
    const { units } = req.body;
    const parsed = Math.max(0, Math.round(Number(units) || 0));
    const stock = await BloodStock.upsertByBloodGroup(req.params.bloodGroup, parsed, req.user._id);
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
