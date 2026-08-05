const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers, createUser, getUser, updateUser, deleteUser,
  getAdmins, createAdmin, updateAdmin, deleteAdmin,
  getRoles, createRole, updateRole, deleteRole,
  getAllAppointments, updateAppointment,
  getAllRequests, updateRequest,
  getFeedback, deleteFeedback,
  getBloodStock, updateBloodStock,
} = require('../controllers/adminController');
const { auth, admin } = require('../middleware/auth');

router.use(auth, admin);

router.get('/stats', getStats);

router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/admins', getAdmins);
router.post('/admins', createAdmin);
router.put('/admins/:id', updateAdmin);
router.delete('/admins/:id', deleteAdmin);

router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

router.get('/appointments', getAllAppointments);
router.put('/appointments/:id', updateAppointment);

router.get('/urgent-requests', getAllRequests);
router.put('/urgent-requests/:id', updateRequest);

router.get('/feedback', getFeedback);
router.delete('/feedback/:id', deleteFeedback);

router.get('/blood-stock', getBloodStock);
router.put('/blood-stock/:bloodGroup', updateBloodStock);

module.exports = router;
