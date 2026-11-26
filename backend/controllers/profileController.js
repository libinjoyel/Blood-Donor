const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, bloodGroup, password, address } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bloodGroup !== undefined) updates.bloodGroup = bloodGroup;
    if (address !== undefined) updates.address = address;
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    const user = await User.updateById(req.user._id, updates);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
