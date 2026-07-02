const express = require('express');
const router = express.Router();
const { create, getAll, updateStatus } = require('../controllers/urgentRequestController');

router.get('/', getAll);
router.post('/', create);
router.put('/:id', updateStatus);

module.exports = router;
