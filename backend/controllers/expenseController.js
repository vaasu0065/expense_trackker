const pool = require("../config/db");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");

// Ensure table exists and has all required columns
const ensureTable = async (userId) => {
  const userRes = await pool.query("SELECT name FROM users WHERE id=$1", [userId]);
  let name = userRes.rows[0]?.name || "user";
  name = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  const table = `expenses_${name}_${userId}`;

  if (!/^expenses_[a-z0-9_]+_\d+$/.test(table)) throw new Error("Invalid table name");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      amount NUMERIC,
      category VARCHAR(255),
      date DATE DEFAULT CURRENT_DATE,
      time VARCHAR(10) DEFAULT ''
    )
  `);

  // Add time column to existing tables that don't have it
  await pool.query(`
    ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS time VARCHAR(10) DEFAULT ''
  `);

  return table;
};

/* ADD EXPENSE */
exports.addExpense = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const { title, amount, category, date, time } = req.body;

    if (!date) return res.status(400).json({ msg: "Date is required" });

    await pool.query(
      `INSERT INTO ${table} (title, amount, category, date, time) VALUES($1,$2,$3,$4,$5)`,
      [title, amount, category || "Uncategorized", date, time || ""]
    );

    res.json({ msg: "Expense Added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* GET ALL EXPENSES */
exports.getExpenses = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY date DESC, time DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* FILTER + SORT */
exports.filterExpenses = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const { date, month, year, category, sort } = req.query;

    let conditions = [];
    let values = [];
    let i = 1;

    if (date) { conditions.push(`date = $${i++}`); values.push(date); }
    if (month) { conditions.push(`EXTRACT(MONTH FROM date) = $${i++}`); values.push(month); }
    if (year) { conditions.push(`EXTRACT(YEAR FROM date) = $${i++}`); values.push(year); }
    if (category) { conditions.push(`LOWER(category) = LOWER($${i++})`); values.push(category); }

    let query = `SELECT * FROM ${table}`;
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");

    const validSorts = {
      newest: "date DESC, time DESC",
      oldest: "date ASC, time ASC",
      high: "amount DESC",
      low: "amount ASC",
    };
    query += ` ORDER BY ${validSorts[sort] || "date DESC, time DESC"}`;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* GET UNIQUE CATEGORIES for this user */
exports.getCategories = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const result = await pool.query(
      `SELECT DISTINCT category FROM ${table} WHERE category IS NOT NULL AND category <> '' ORDER BY category`
    );
    res.json(result.rows.map((r) => r.category));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* MONTHLY STATS */
exports.monthlyStats = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const { month, category } = req.query;
    let conditions = [], values = [], i = 1;

    if (month) { conditions.push(`EXTRACT(MONTH FROM date) = $${i++}`); values.push(month); }
    if (category) { conditions.push(`LOWER(category) = LOWER($${i++})`); values.push(category); }

    let query = `SELECT category, SUM(amount) as total FROM ${table}`;
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " GROUP BY category";

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* DAILY STATS (by category for a single date) */
exports.dailyStats = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: "Date required" });

    const result = await pool.query(
      `SELECT category, SUM(amount) AS total FROM ${table} WHERE date = $1 GROUP BY category`,
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* DAILY TOTALS (total spend per day for a given month/year) */
exports.dailyTotals = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const month = req.query.month || new Date().getMonth() + 1;
    const year  = req.query.year  || new Date().getFullYear();

    const result = await pool.query(
      `SELECT date::text, SUM(amount) AS total
       FROM ${table}
       WHERE EXTRACT(MONTH FROM date) = $1
         AND EXTRACT(YEAR  FROM date) = $2
       GROUP BY date
       ORDER BY date ASC`,
      [month, year]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* SUMMARY */
exports.summary = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const result = await pool.query(`SELECT COUNT(*) AS count, SUM(amount) AS total FROM ${table}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* DELETE */
exports.deleteExpense = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
    res.json({ msg: "Expense Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* UPDATE */
exports.updateExpense = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const { title, amount, category, date, time } = req.body;
    await pool.query(
      `UPDATE ${table} SET title=$1, amount=$2, category=$3, date=$4, time=$5 WHERE id=$6`,
      [title, amount, category, date, time || "", req.params.id]
    );
    res.json({ msg: "Expense Updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* EXPORT CSV */
exports.exportCSV = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY date DESC, time DESC`);
    if (result.rows.length === 0) return res.status(400).json({ msg: "No data to export" });

    const parser = new Parser({ fields: ["id", "title", "amount", "category", "date", "time"] });
    res.header("Content-Type", "text/csv");
    res.attachment("expenses.csv");
    return res.send(parser.parse(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* EXPORT EXCEL */
exports.exportExcel = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    const result = await pool.query(`SELECT * FROM ${table} ORDER BY date DESC, time DESC`);
    if (result.rows.length === 0) return res.status(400).json({ msg: "No data to export" });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Expenses");
    ws.columns = [
      { header: "ID", key: "id" }, { header: "Title", key: "title" },
      { header: "Amount", key: "amount" }, { header: "Category", key: "category" },
      { header: "Date", key: "date" }, { header: "Time", key: "time" },
    ];
    result.rows.forEach((r) => ws.addRow(r));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
