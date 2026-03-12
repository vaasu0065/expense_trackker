const router = require("express").Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/authMiddleware");

// REGISTER USER (Deprecated - Use OTP flow instead)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if(!name || !email || !password){
      return res.status(400).json({ msg: "All fields required" });
    }

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userExists.rowCount > 0) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user & return ID
    const result = await pool.query(
      "INSERT INTO users(name,email,password,is_verified) VALUES($1,$2,$3,$4) RETURNING id",
      [name, email, hashedPassword, true] // Set verified true for backward compatibility
    );

    const userId = result.rows[0].id;

    // CREATE USER SPECIFIC EXPENSE TABLE
    const tableName = `expenses_user_${userId}`;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        amount NUMERIC,
        category VARCHAR(255),
        date DATE DEFAULT CURRENT_DATE
      )
    `);

    res.json({ msg: "User Registered Successfully + Table Created" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


// LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = result.rows[0];

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        msg: "Please verify your email before logging in",
        needsVerification: true,
        email: user.email
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET
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
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
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

module.exports = router;
