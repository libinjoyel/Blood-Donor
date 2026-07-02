const express = require('express');
const router = express.Router();
const { create } = require('../controllers/feedbackController');
const { auth } = require('../middleware/auth');

router.post('/', auth, create);

module.exports = router;
