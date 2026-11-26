const DonationHistory = require('../models/DonationHistory');
const User = require('../models/User');

const ELIGIBILITY_DAYS = 90;

exports.getDonations = async (req, res) => {
  try {
    const [donations, user] = await Promise.all([
      DonationHistory.findByUser(req.user._id),
      User.findById(req.user._id),
    ]);

    let nextEligibleDate = null;
    if (user?.lastDonationDate) {
      const nextDate = new Date(user.lastDonationDate);
      nextDate.setDate(nextDate.getDate() + ELIGIBILITY_DAYS);
      nextEligibleDate = nextDate;
    }

    res.json({ donations, nextEligibleDate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDonation = async (req, res) => {
  try {
    const donation = await DonationHistory.findOneForUser(req.params.id, req.user._id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation record not found' });
    }
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
