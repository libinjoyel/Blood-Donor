const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/bloodBankController');
const { auth, admin } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', auth, admin, create);
router.put('/:id', auth, admin, update);
router.delete('/:id', auth, admin, remove);

module.exports = router;
