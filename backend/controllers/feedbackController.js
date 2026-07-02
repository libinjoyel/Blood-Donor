const Feedback = require('../models/Feedback');

exports.create = async (req, res) => {
  try {
    const { bloodBankId, rating, comment } = req.body;

    const existing = await Feedback.findOne({
      userId: req.user._id,
      bloodBankId,
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted feedback for this blood bank' });
    }

    const feedback = new Feedback({
      userId: req.user._id,
      bloodBankId,
      rating,
      comment,
    });
    await feedback.save();

    const populated = await Feedback.findById(feedback._id)
      .populate('bloodBankId', 'name city');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
