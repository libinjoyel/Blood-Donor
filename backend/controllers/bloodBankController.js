const BloodBank = require('../models/BloodBank');

exports.getAll = async (req, res) => {
  try {
    const { search, city, service, sort } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    if (service) {
      filter.services = { $in: [new RegExp(service, 'i')] };
    }

    let sortOption = { name: 1 };
    if (sort === 'city') sortOption = { city: 1, name: 1 };
    if (sort === '-name') sortOption = { name: -1 };
    if (sort === '-city') sortOption = { city: -1, name: 1 };

    const banks = await BloodBank.find(filter).sort(sortOption);
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const bank = await BloodBank.findById(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }
    res.json(bank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, address, city, phone, email, latitude, longitude, services, workingHours } = req.body;
    const bank = new BloodBank({ name, address, city, phone, email, latitude, longitude, services, workingHours });
    await bank.save();
    res.status(201).json(bank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, address, city, phone, email, latitude, longitude, services, workingHours } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (services !== undefined) updates.services = services;
    if (workingHours !== undefined) updates.workingHours = workingHours;

    const bank = await BloodBank.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }
    res.json(bank);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const bank = await BloodBank.findByIdAndDelete(req.params.id);
    if (!bank) {
      return res.status(404).json({ message: 'Blood bank not found' });
    }
    res.json({ message: 'Blood bank deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
