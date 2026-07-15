const { getConsentUrl, exchangeCodeForTokens, syncGmailTransactions } = require('../services/gmailService');
const User = require('../models/User');

// @desc    Get Google OAuth consent URL to initiate Gmail access
// @route   GET /api/v1/gmail/auth-url
exports.getAuthUrl = async (req, res, next) => {
  try {
    const url = getConsentUrl(req.user._id);
    res.json({ success: true, url });
  } catch (err) {
    next(err);
  }
};

// @desc    OAuth Callback / Token Exchange after user consents
// @route   POST /api/v1/gmail/callback
exports.oauthCallback = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code is required' });
    }

    await exchangeCodeForTokens(req.user._id, code);

    // Automatically trigger initial background sync right after connecting
    syncGmailTransactions(req.user._id).catch(err => console.error("Initial background Gmail sync error:", err.message));

    res.json({ success: true, message: 'Gmail connected successfully and initial sync triggered.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger incremental Gmail sync right now
// @route   POST /api/v1/gmail/sync
exports.triggerSync = async (req, res, next) => {
  try {
    const result = await syncGmailTransactions(req.user._id);
    res.json({
      success: true,
      message: `Sync complete. Scanned ${result.scannedCount} emails, imported ${result.importedCount} new transactions.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Disconnect / Revoke Gmail sync
// @route   POST /api/v1/gmail/disconnect
exports.disconnectGmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+gmailAccessToken +gmailRefreshToken');
    if (user) {
      user.gmailAccessToken = undefined;
      user.gmailRefreshToken = undefined;
      user.gmailSyncEnabled = false;
      user.lastGmailSyncHistoryId = undefined;
      await user.save();
    }
    res.json({ success: true, message: 'Gmail disconnected and OAuth tokens cleared securely.' });
  } catch (err) {
    next(err);
  }
};
