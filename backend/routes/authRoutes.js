const router = require("express").Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const auth = require("../middleware/authMiddleware");

const normalizeEmail = (email) => email.trim().toLowerCase();
const resetCodeTtlMinutes = 10;
const maxResetAttempts = 5;
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

// Best-effort per-IP throttling (in-memory, so per serverless instance).
// Reset codes are additionally capped per code in the database.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { msg: "Too many attempts. Please try again in 15 minutes." },
});

function createResetCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashResetCode(email, code) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for reset codes");
  }

  return crypto
    .createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}:${process.env.JWT_SECRET}`)
    .digest("hex");
}

function emailIsConfigured() {
  return Boolean(
    process.env.EMAIL_HOST &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASSWORD
  );
}

async function sendPasswordResetEmail(email, code) {
  if (!emailIsConfigured()) {
    // Never fall back to logging codes in production: anyone with log access could reset accounts
    if (isProduction) {
      const err = new Error("Password reset email is not configured on the server");
      err.statusCode = 503;
      throw err;
    }
    console.log(`Password reset code for ${email}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_PORT === "465",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: "Expense Tracker password reset code",
    text: `Your password reset code is ${code}. It expires in ${resetCodeTtlMinutes} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password reset</h2>
        <p>Use this code to reset your Expense Tracker password:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>This code expires in ${resetCodeTtlMinutes} minutes.</p>
      </div>
    `,
  });
}

// REGISTER USER (no OTP – direct signup)
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ msg: "All fields required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const userExists = await pool.query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [email]
    );

    if (userExists.rowCount > 0) {
      return res.status(400).json({ msg: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users(name,email,password,is_verified) VALUES($1,$2,$3,$4) RETURNING id, name, email",
      [name.trim(), email.trim(), hashedPassword, true]
    );

    const userId = result.rows[0].id;
    const userName = result.rows[0].name;

    // Expense table name must match expenseController ensureTable format
    const sanitizedName = userName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const tableName = `expenses_${sanitizedName}_${userId}`;

    if (/^expenses_[a-z0-9_]+_\d+$/.test(tableName)) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          amount NUMERIC,
          category VARCHAR(255),
          date DATE DEFAULT CURRENT_DATE
        )
      `);
    }

    res.json({
      msg: "Account created. Please sign in.",
      user: { id: userId, name: userName, email: result.rows[0].email },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// LOGIN USER
router.post("/login", authLimiter, async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in .env");
      return res.status(500).json({ msg: "Server misconfigured. Contact administrator." });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [email]
    );

    const user = result.rows[0];
    const validPassword = user ? await bcrypt.compare(password, user.password) : false;

    // Same response for unknown email and wrong password, so emails can't be probed
    if (!validPassword) {
      return res.status(401).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      msg: "Login Success",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      msg: "Server error",
      ...(process.env.NODE_ENV !== "production" && { details: err.message })
    });
  }
});


// GET LOGGED USER
router.get("/me", auth, async (req, res)=>{
  try {
    const user = await pool.query(
      "SELECT id, name, email FROM users WHERE id=$1",
      [req.user.id]
    );

    res.json(user.rows[0]);

  } catch(err){
    console.log(err);
    res.status(500).json({ msg:"Server Error" });
  }
});

// FORGOT PASSWORD – send one-time reset code
router.post("/forgot-password/verify-email", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ msg: "Email is required" });

    const normalizedEmail = normalizeEmail(email);
    const result = await pool.query(
      "SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [normalizedEmail]
    );

    const genericMsg = emailIsConfigured()
      ? "If an account exists for this email, a reset code has been sent"
      : "Reset code generated. Check the backend console.";

    // Respond the same way whether or not the account exists
    if (result.rowCount === 0) {
      return res.json({ msg: genericMsg, email: normalizedEmail });
    }

    const code = createResetCode();
    const codeHash = hashResetCode(normalizedEmail, code);

    await pool.query(
      "DELETE FROM password_reset_codes WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [normalizedEmail]
    );
    await pool.query(
      `INSERT INTO password_reset_codes(email, code_hash, expires_at)
       VALUES($1, $2, NOW() + ($3::text || ' minutes')::interval)`,
      [normalizedEmail, codeHash, resetCodeTtlMinutes]
    );

    await sendPasswordResetEmail(normalizedEmail, code);

    res.json({ msg: genericMsg, email: normalizedEmail });
  } catch (err) {
    console.error("Send reset code error:", err);
    res.status(err.statusCode || 500).json({ msg: err.statusCode ? err.message : "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", authLimiter, async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email?.trim() || !resetCode?.trim() || !newPassword) {
      return res.status(400).json({ msg: "Email, reset code and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const codeHash = hashResetCode(normalizedEmail, resetCode.trim());

    // Count this guess atomically before checking it, so parallel guesses can't exceed the cap
    const codeResult = await pool.query(
      `UPDATE password_reset_codes
       SET attempts = attempts + 1
       WHERE id = (
         SELECT id FROM password_reset_codes
         WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1
       )
       RETURNING id, code_hash, attempts`,
      [normalizedEmail]
    );

    const storedCode = codeResult.rows[0];
    if (!storedCode) {
      return res.status(400).json({ msg: "Invalid or expired reset code" });
    }

    if (storedCode.attempts > maxResetAttempts) {
      await pool.query("DELETE FROM password_reset_codes WHERE id = $1", [storedCode.id]);
      return res.status(429).json({ msg: "Too many wrong attempts. Please request a new code." });
    }

    const codeMatches = crypto.timingSafeEqual(
      Buffer.from(storedCode.code_hash, "hex"),
      Buffer.from(codeHash, "hex")
    );
    if (!codeMatches) {
      return res.status(400).json({ msg: "Invalid or expired reset code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1 WHERE LOWER(TRIM(email)) = LOWER(TRIM($2))",
      [hashedPassword, normalizedEmail]
    );
    await pool.query(
      "DELETE FROM password_reset_codes WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))",
      [normalizedEmail]
    );

    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
