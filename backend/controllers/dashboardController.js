const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const UrgentRequest = require('../models/UrgentRequest');

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    const totalAppointments = user.nextAppointment ? 1 : 0;

    const totalBloodBanks = await BloodBank.countDocuments();

    const totalDonors = await User.countDocuments({ role: 'donor' });

    const recentRequests = await UrgentRequest.find({ status: 'urgent' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        role: user.role,
        address: user.address,
        donationCount: user.donationCount || 0,
        isEligible: user.isEligible,
        lastDonationDate: user.lastDonationDate,
        nextAppointment: user.nextAppointment,
      },
      stats: {
        totalAppointments,
        donationCount: user.donationCount || 0,
        bloodGroup: user.bloodGroup,
        isEligible: user.isEligible,
        totalDonors,
        totalBloodBanks,
      },
      recentRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
