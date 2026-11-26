const UrgentRequest = require('../models/UrgentRequest');

exports.create = async (req, res) => {
  try {
    const { hospital, bloodGroup, units, city, contact } = req.body;
    const request = await UrgentRequest.create({ hospital, bloodGroup, units, city, contact });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { search, bloodGroup, city, status } = req.query;
    const requests = await UrgentRequest.findAll({ search, bloodGroup, city, status });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await UrgentRequest.updateById(req.params.id, { status });
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
