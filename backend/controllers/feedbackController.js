const Feedback = require('../models/Feedback');

exports.create = async (req, res) => {
  try {
    const { bloodBankId, rating, comment } = req.body;

    const existing = await Feedback.findExisting(req.user._id, bloodBankId);
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted feedback for this blood bank' });
    }

    const populated = await Feedback.create({
      userId: req.user._id,
      bloodBankId,
      rating,
      comment,
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
