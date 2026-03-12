const router = require("express").Router();
const pool = require("../config/db");
const auth = require("../middleware/authMiddleware");

// SAVE / UPDATE BUDGET (Legacy - redirects to new endpoint)
router.post("/save", auth, async (req, res) => {
  try {
    const { income, budget } = req.body;
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    await pool.query(
      `INSERT INTO budget(user_id, month, year, income, budget)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, month, year)
       DO UPDATE SET income=$4, budget=$5`,
      [req.user.id, month, year, income, budget]
    );

    res.json({ msg: "Budget Saved Successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});


// GET BUDGET (Legacy - current month)
router.get("/", auth, async (req, res) => {
  try {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const result = await pool.query(
      "SELECT * FROM budget WHERE user_id=$1 AND month=$2 AND year=$3",
      [req.user.id, month, year]
    );

    res.json(result.rows[0] || { income: 0, budget: 0 });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

module.exports = router;
