const express = require('express');
const router = express.Router();
const {
  getUnits, getUnit, createUnit, updateUnit, deleteUnit,
  reserveUnit, issueUnit, discardUnit,
  getTransactions, getLocations, getOverview,
} = require('../controllers/inventoryController');
const { auth, admin } = require('../middleware/auth');

router.use(auth, admin);

router.get('/units', getUnits);
router.get('/units/:id', getUnit);
router.post('/units', createUnit);
router.put('/units/:id', updateUnit);
router.delete('/units/:id', deleteUnit);

router.put('/units/:id/reserve', reserveUnit);
router.put('/units/:id/issue', issueUnit);
router.put('/units/:id/discard', discardUnit);

router.get('/transactions', getTransactions);
router.get('/locations', getLocations);
router.get('/overview', getOverview);

module.exports = router;
