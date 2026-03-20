const pool = require("../config/db");

/* GET ALL */
exports.getAll = async (req, res) => {
  try {
    const { status, type } = req.query;
    let conditions = ["user_id = $1"];
    let values = [req.user.id];
    let i = 2;

    if (status) { conditions.push(`status = $${i++}`); values.push(status); }
    if (type)   { conditions.push(`type = $${i++}`);   values.push(type); }

    const result = await pool.query(
      `SELECT * FROM lend_borrow WHERE ${conditions.join(" AND ")} ORDER BY date DESC, created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* ADD */
exports.add = async (req, res) => {
  try {
    const { type, person_name, amount, note, date, due_date } = req.body;

    if (!type || !person_name?.trim() || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ msg: "Type, person name and amount are required" });
    }
    if (!["lend", "borrow"].includes(type)) {
      return res.status(400).json({ msg: "Type must be lend or borrow" });
    }

    const result = await pool.query(
      `INSERT INTO lend_borrow (user_id, type, person_name, amount, note, date, due_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, type, person_name.trim(), amount, note || "", date || new Date().toISOString().split("T")[0], due_date || null]
    );
    res.json({ msg: "Entry added", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* SETTLE (mark as settled) */
exports.settle = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE lend_borrow SET status = 'settled' WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ msg: "Entry not found" });
    res.json({ msg: "Marked as settled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* DELETE */
exports.remove = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM lend_borrow WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ msg: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

/* SUMMARY */
exports.summary = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='lend'   AND status='pending' THEN amount ELSE 0 END), 0) AS total_lent,
        COALESCE(SUM(CASE WHEN type='borrow' AND status='pending' THEN amount ELSE 0 END), 0) AS total_borrowed,
        COUNT(CASE WHEN status='pending' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN due_date < CURRENT_DATE AND status='pending' THEN 1 END) AS overdue_count
       FROM lend_borrow WHERE user_id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
