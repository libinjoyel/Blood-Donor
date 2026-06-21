const BloodBank = require('../models/BloodBank');

exports.getAll = async (req, res) => {
  try {
    const inventory = await BloodBank.find().sort('bloodGroup');
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { bloodGroup, quantity } = req.body;
    const entry = new BloodBank({ bloodGroup, quantity });
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { quantity } = req.body;
    const entry = await BloodBank.findByIdAndUpdate(
      req.params.id,
      { quantity },
      { new: true, runValidators: true }
    );
    if (!entry) {
      return res.status(404).json({ message: 'Blood bank entry not found' });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const entry = await BloodBank.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: 'Blood bank entry not found' });
    }
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
