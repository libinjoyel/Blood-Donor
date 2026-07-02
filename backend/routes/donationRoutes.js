const express = require('express');
const router = express.Router();
const { getDonations, getDonation } = require('../controllers/donationController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getDonations);
router.get('/:id', getDonation);

module.exports = router;
