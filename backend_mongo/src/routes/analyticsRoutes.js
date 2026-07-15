const express = require('express');
const { getSummary, exportData } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/export', exportData);

module.exports = router;
