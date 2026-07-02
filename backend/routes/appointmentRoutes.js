const express = require('express');
const router = express.Router();
const { book, cancel, reschedule, getMyAppointments } = require('../controllers/appointmentController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.get('/', getMyAppointments);
router.post('/', book);
router.put('/:id/reschedule', reschedule);
router.put('/:id/cancel', cancel);

module.exports = router;
