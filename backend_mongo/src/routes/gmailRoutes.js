const express = require('express');
const { getAuthUrl, oauthCallback, triggerSync, disconnectGmail } = require('../controllers/gmailController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/auth-url', getAuthUrl);
router.post('/callback', oauthCallback);
router.post('/sync', triggerSync);
router.post('/disconnect', disconnectGmail);

module.exports = router;
