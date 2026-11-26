const express = require('express');
const router = express.Router();
const { create, getAll, updateStatus } = require('../controllers/urgentRequestController');
const { auth, admin } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', auth, create);
router.put('/:id', auth, admin, updateStatus);

module.exports = router;
