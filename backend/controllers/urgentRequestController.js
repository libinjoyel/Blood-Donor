const UrgentRequest = require('../models/UrgentRequest');

exports.create = async (req, res) => {
  try {
    const { hospital, bloodGroup, units, city, contact } = req.body;
    const request = new UrgentRequest({ hospital, bloodGroup, units, city, contact });
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAll = async (req, res) => {
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
    if (bloodGroup) {
      filter.bloodGroup = bloodGroup;
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }

    const requests = await UrgentRequest.find(filter).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await UrgentRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
