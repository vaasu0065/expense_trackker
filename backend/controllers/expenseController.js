const pool = require("../config/db");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");

// Ensure table exists for this user
const ensureTable = async (userId) => {
  const userRes = await pool.query(
    "SELECT name FROM users WHERE id=$1",
    [userId]
  );

  let name = userRes.rows[0]?.name || "user";

  // Sanitize name to prevent SQL injection
  name = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // Use a safe table name format
  const table = `expenses_${name}_${userId}`;

  // Validate table name format (extra security)
  if (!/^expenses_[a-z0-9_]+_\d+$/.test(table)) {
    throw new Error("Invalid table name format");
  }

  // Use identifier escaping for table name
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${table} (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      amount NUMERIC,
      category VARCHAR(255),
      date DATE DEFAULT CURRENT_DATE
    )
  `);

  return table;
};


/* ===========================
     ADD EXPENSE (No Future Date)
=========================== */
exports.addExpense = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);
    let { title, amount, category, date } = req.body;

    if (!date) {
      return res.status(400).json({ msg: "Date is required" });
    }

    const enteredDate = new Date(date);
    const today = new Date();

    enteredDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (enteredDate > today) {
      return res.status(400).json({ msg: "Future date is not allowed" });
    }

    await pool.query(
      `INSERT INTO ${table} (title, amount, category, date)
       VALUES($1,$2,$3,$4)`,
      [title, amount, category, date]
    );

    res.json({ msg: "Expense Added" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};



/* ===========================
     GET EXPENSES
=========================== */
exports.getExpenses = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);

    const result = await pool.query(
      `SELECT * FROM ${table} ORDER BY date DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};



/* ===========================
     CHART STATS (With Filters)
=========================== */
exports.monthlyStats = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);

    const { month, category } = req.query;

    let query = `
      SELECT category, SUM(amount) as total
      FROM ${table}
    `;

    let conditions = [];
    let values = [];
    let i = 1;

    if (month) {
      conditions.push(`EXTRACT(MONTH FROM date) = $${i++}`);
      values.push(month);
    }

    if (category) {
      conditions.push(`category = $${i++}`);
      values.push(category);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY category";

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};
// 📌 DATE WISE CHART STATS
// DAILY STATS (Date Wise Charts)
exports.dailyStats = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);

    const { date } = req.query;

    if (!date)
      return res.status(400).json({ msg: "Date required" });

    const result = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM ${table}
       WHERE date = $1
       GROUP BY category`,
      [date]
    );

    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};




/* ===========================
     SUMMARY
=========================== */
exports.summary = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);

    const result = await pool.query(
      `SELECT COUNT(*) AS count, SUM(amount) AS total
       FROM ${table}`
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};



/* ===========================
     DELETE
=========================== */
exports.deleteExpense = async (req,res)=>{
  try {
    const table = await ensureTable(req.user.id);
    const { id } = req.params;

    await pool.query(
      `DELETE FROM ${table} WHERE id=$1`,
      [id]
    );

    res.json({ msg:"Expense Deleted" });

  } catch(err){
    console.log(err);
    res.status(500).json({ msg:"Server Error" });
  }
};



/* ===========================
     UPDATE
=========================== */
exports.updateExpense = async (req,res)=>{
  try {
    const table = await ensureTable(req.user.id);
    const { id } = req.params;
    const { title, amount, category, date } = req.body;

    await pool.query(
      `UPDATE ${table}
       SET title=$1, amount=$2, category=$3, date=$4
       WHERE id=$5`,
      [title, amount, category, date, id]
    );

    res.json({ msg:"Expense Updated" });

  } catch(err){
    console.log(err);
    res.status(500).json({ msg:"Server Error" });
  }
};



/* ===========================
     FILTER + SORT
=========================== */
// FILTER + SORT + DATE + MONTH + YEAR
exports.filterExpenses = async (req, res) => {
  try {
    const table = await ensureTable(req.user.id);

    const { date, month, year, category, sort } = req.query;

    let query = `SELECT * FROM ${table}`;
    let conditions = [];
    let values = [];
    let i = 1;

    // 📅 Exact date filter (daily view)
    if (date) {
      conditions.push(`date = $${i++}`);
      values.push(date);
    }

    // 📆 Month filter
    if (month) {
      conditions.push(`EXTRACT(MONTH FROM date) = $${i++}`);
      values.push(month);
    }

    // 🗓 Year filter
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM date) = $${i++}`);
      values.push(year);
    }

    // 🧾 Category
    if (category) {
      conditions.push(`category = $${i++}`);
      values.push(category);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // 🔃 Sorting (whitelist to prevent SQL injection)
    const validSorts = {
      newest: "ORDER BY date DESC",
      oldest: "ORDER BY date ASC",
      high: "ORDER BY amount DESC",
      low: "ORDER BY amount ASC"
    };

    if (sort && validSorts[sort]) {
      query += " " + validSorts[sort];
    }

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server Error" });
  }
};




/* ===========================
     EXPORT CSV
=========================== */
exports.exportCSV = async (req,res)=>{
  try {
    const table = await ensureTable(req.user.id);

    const result = await pool.query(`SELECT * FROM ${table} ORDER BY date DESC`);

    if(result.rows.length === 0)
      return res.status(400).json({msg:"No data to export"});

    const fields = ["id","title","amount","category","date"];
    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header("Content-Type","text/csv");
    res.attachment("expenses.csv");
    return res.send(csv);

  } catch(err){
    console.log(err);
    res.status(500).json({msg:"Server Error"});
  }
};



/* ===========================
     EXPORT EXCEL
=========================== */
exports.exportExcel = async (req,res)=>{
  try {
    const table = await ensureTable(req.user.id);

    const result = await pool.query(`SELECT * FROM ${table} ORDER BY date DESC`);

    if(result.rows.length === 0)
      return res.status(400).json({msg:"No data to export"});

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Expenses");

    ws.columns = [
      {header:"ID", key:"id"},
      {header:"Title", key:"title"},
      {header:"Amount", key:"amount"},
      {header:"Category", key:"category"},
      {header:"Date", key:"date"}
    ];

    result.rows.forEach(r => ws.addRow(r));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition","attachment; filename=expenses.xlsx");

    await wb.xlsx.write(res);
    res.end();

  } catch(err){
    console.log(err);
    res.status(500).json({msg:"Server Error"});
  }
};
