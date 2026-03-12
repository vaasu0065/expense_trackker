const router = require("express").Router();
const {
  sendRegistrationOTP,
  verifyOTP,
  resendOTP,
} = require("../controllers/otpController");

// Send OTP for registration
router.post("/send", sendRegistrationOTP);

// Verify OTP
router.post("/verify", verifyOTP);

// Resend OTP
router.post("/resend", resendOTP);

module.exports = router;
