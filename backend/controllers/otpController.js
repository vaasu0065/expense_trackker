const pool = require("../config/db");
const bcrypt = require("bcrypt");
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require("../utils/emailService");

// Send OTP for registration
exports.sendRegistrationOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].is_verified) {
        return res.status(400).json({ msg: "User already exists" });
      }
      // If user exists but not verified, allow resending OTP
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this email
    await pool.query("DELETE FROM otp_verification WHERE email = $1", [email]);

    // Store OTP in database
    await pool.query(
      "INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    );

    // Store user data temporarily (hashed password)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // If user doesn't exist, create unverified user
    if (existingUser.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (name, email, password, is_verified) VALUES ($1, $2, $3, $4)",
        [name, email, hashedPassword, false]
      );
    } else {
      // Update password if user exists but not verified
      await pool.query(
        "UPDATE users SET name = $1, password = $2 WHERE email = $3",
        [name, hashedPassword, email]
      );
    }

    // Check if email is configured
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (!emailConfigured) {
      console.log("\n⚠️  EMAIL NOT CONFIGURED!");
      console.log("📧 OTP for", email, ":", otp);
      console.log("⏰ Expires at:", expiresAt.toLocaleString());
      console.log("\nTo enable email sending, configure EMAIL_* variables in .env");
      console.log("See EMAIL_SETUP_GUIDE.md for instructions\n");
      
      return res.json({ 
        msg: "OTP generated (check server console). Email not configured.",
        email: email,
        devMode: true,
        // In any non-production environment, include OTP in response
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, name);
      console.log("✅ OTP email sent to:", email);
      
      res.json({ 
        msg: "OTP sent to your email. Please check your inbox.",
        email: email 
      });
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError.message);
      console.log("📧 OTP for", email, ":", otp);
      console.log("⏰ Expires at:", expiresAt.toLocaleString());
      
      return res.json({ 
        msg: "OTP generated (check server console). Email sending failed.",
        email: email,
        devMode: true,
        // In any non-production environment, include OTP in response
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        emailError: "Email service unavailable. Check server logs."
      });
    }

  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ 
      msg: "Server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Verify OTP and complete registration
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    console.log("🔍 Verifying OTP for:", email);
    console.log("📝 OTP received:", otp);

    if (!email || !otp) {
      return res.status(400).json({ msg: "Email and OTP are required" });
    }

    // Get OTP from database
    const otpRecord = await pool.query(
      "SELECT * FROM otp_verification WHERE email = $1 AND otp = $2",
      [email, otp]
    );

    console.log("📊 OTP records found:", otpRecord.rows.length);

    if (otpRecord.rows.length === 0) {
      // Check if OTP exists for this email (wrong OTP)
      const anyOtp = await pool.query(
        "SELECT otp, expires_at FROM otp_verification WHERE email = $1",
        [email]
      );
      
      if (anyOtp.rows.length > 0) {
        console.log("❌ Wrong OTP. Expected:", anyOtp.rows[0].otp, "Got:", otp);
        return res.status(400).json({ msg: "Invalid OTP. Please check and try again." });
      } else {
        console.log("❌ No OTP found for this email");
        return res.status(400).json({ msg: "No OTP found. Please request a new one." });
      }
    }

    // Check if OTP is expired
    const otpData = otpRecord.rows[0];
    const now = new Date();
    const expiresAt = new Date(otpData.expires_at);
    
    console.log("⏰ Current time:", now.toLocaleString());
    console.log("⏰ OTP expires at:", expiresAt.toLocaleString());

    if (now > expiresAt) {
      console.log("❌ OTP expired");
      await pool.query("DELETE FROM otp_verification WHERE email = $1", [email]);
      return res.status(400).json({ msg: "OTP has expired. Please request a new one." });
    }

    // Get user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ User not found");
      return res.status(404).json({ msg: "User not found" });
    }

    const user = userResult.rows[0];
    console.log("👤 User found:", user.name);

    // Mark user as verified
    await pool.query(
      "UPDATE users SET is_verified = true WHERE email = $1",
      [email]
    );
    console.log("✅ User marked as verified");

    // Delete used OTP
    await pool.query("DELETE FROM otp_verification WHERE email = $1", [email]);
    console.log("🗑️ OTP deleted");

    // Create user-specific expense table
    const sanitizedName = user.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    
    const tableName = `expenses_${sanitizedName}_${user.id}`;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        amount NUMERIC,
        category VARCHAR(255),
        date DATE DEFAULT CURRENT_DATE
      )
    `);
    console.log("📊 Expense table created:", tableName);

    // Send welcome email (non-blocking)
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    if (emailConfigured) {
      sendWelcomeEmail(email, user.name).catch(err => 
        console.error("Failed to send welcome email:", err)
      );
    }

    console.log("✅ Verification complete!");
    res.json({ 
      msg: "Email verified successfully! You can now login.",
      verified: true 
    });

  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).json({ 
      msg: "Server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: "Email is required" });
    }

    // Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ msg: "User is already verified" });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs
    await pool.query("DELETE FROM otp_verification WHERE email = $1", [email]);

    // Store new OTP
    await pool.query(
      "INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)",
      [email, otp, expiresAt]
    );

    // Check if email is configured
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
    
    if (!emailConfigured) {
      console.log("\n⚠️  EMAIL NOT CONFIGURED!");
      console.log("📧 New OTP for", email, ":", otp);
      console.log("⏰ Expires at:", expiresAt.toLocaleString());
      
      return res.json({ 
        msg: "New OTP generated (check server console)",
        devMode: true,
        // In any non-production environment, include OTP in response
        otp: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, user.name);
      console.log("✅ New OTP email sent to:", email);
      res.json({ msg: "New OTP sent to your email" });
    } catch (emailError) {
      console.error("❌ Failed to send email:", emailError.message);
      console.log("📧 New OTP for", email, ":", otp);
      
      return res.json({ 
        msg: "New OTP generated (check server console)",
        devMode: true,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
