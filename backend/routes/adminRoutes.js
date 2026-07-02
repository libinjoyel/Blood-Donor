const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers, getUser, updateUser, deleteUser,
  getAllAppointments, updateAppointment,
  getAllRequests, updateRequest,
  getFeedback, deleteFeedback,
} = require('../controllers/adminController');
const { auth, admin } = require('../middleware/auth');

router.use(auth, admin);

router.get('/stats', getStats);

router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/appointments', getAllAppointments);
router.put('/appointments/:id', updateAppointment);

router.get('/urgent-requests', getAllRequests);
router.put('/urgent-requests/:id', updateRequest);

router.get('/feedback', getFeedback);
router.delete('/feedback/:id', deleteFeedback);

module.exports = router;
