const pool = require("../config/db");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const { parseTransactionMessage } = require("../utils/transactionParser");

const ensureTransactionTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS imported_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
      title VARCHAR(255) NOT NULL,
      amount NUMERIC NOT NULL,
      category VARCHAR(255) DEFAULT 'Other',
      date DATE DEFAULT CURRENT_DATE,
      time VARCHAR(10) DEFAULT '',
      source TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

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

async function saveImportedTransactions(userId, transactions) {
  const table = await ensureTable(userId);
  await ensureTransactionTable();

  const validTransactions = [];
  const debitExpenses = [];
  for (const item of transactions) {
    const type = item.type === "credit" ? "credit" : "debit";
    const title = String(item.title || "").trim();
    const amount = parseFloat(item.amount);
    const category = String(item.category || "Other").trim();
    const date = String(item.date || "").trim();
    const time = String(item.time || "").trim();
    const source = String(item.source || "").trim();

    if (!title || !date || !Number.isFinite(amount) || amount <= 0) {
      const err = new Error("Each transaction needs title, amount and date");
      err.statusCode = 400;
      throw err;
    }

    validTransactions.push([userId, type, title, amount, category || "Other", date, time, source]);
    if (type === "debit") {
      debitExpenses.push([title, amount, category || "Uncategorized", date, time]);
    }
  }

  const transactionPlaceholders = [];
  const transactionValues = [];
  validTransactions.forEach((transaction, index) => {
    const offset = index * 8;
    transactionPlaceholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
    );
    transactionValues.push(...transaction);
  });

  await pool.query(
    `INSERT INTO imported_transactions (user_id, type, title, amount, category, date, time, source)
     VALUES ${transactionPlaceholders.join(", ")}`,
    transactionValues
  );

  if (debitExpenses.length > 0) {
    const expensePlaceholders = [];
    const expenseValues = [];
    debitExpenses.forEach((expense, index) => {
      const offset = index * 5;
      expensePlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
      expenseValues.push(...expense);
    });

    await pool.query(
      `INSERT INTO ${table} (title, amount, category, date, time) VALUES ${expensePlaceholders.join(", ")}`,
      expenseValues
    );
  }

  return {
    count: validTransactions.length,
    debitCount: debitExpenses.length,
    creditCount: validTransactions.length - debitExpenses.length,
  };
}
exports.saveImportedTransactions = saveImportedTransactions;

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

/* IMPORT CREDIT/DEBIT TRANSACTIONS */
exports.importExpenses = async (req, res) => {
  try {
    const incoming = req.body.transactions || req.body.expenses;

    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ msg: "No transactions to import" });
    }

    if (incoming.length > 100) {
      return res.status(400).json({ msg: "Import limit is 100 transactions at a time" });
    }

    const result = await saveImportedTransactions(req.user.id, incoming);

    res.json({
      msg: "Transactions imported",
      ...result,
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ msg: err.statusCode ? err.message : "Server Error" });
  }
};

/* AUTO IMPORT RAW TRANSACTION MESSAGE(S) */
exports.autoImportTransaction = async (req, res) => {
  try {
    const messages = Array.isArray(req.body.messages)
      ? req.body.messages
      : [req.body.message];

    const cleanMessages = messages
      .map((message) => String(message || "").trim())
      .filter(Boolean);

    if (cleanMessages.length === 0) {
      return res.status(400).json({ msg: "Transaction message is required" });
    }

    if (cleanMessages.length > 50) {
      return res.status(400).json({ msg: "Auto import limit is 50 messages at a time" });
    }

    const transactions = cleanMessages.map(parseTransactionMessage);
    const invalid = transactions.find((item) => !item.amount || item.amount <= 0);
    if (invalid) {
      return res.status(400).json({
        msg: "Could not detect transaction amount from one or more messages",
        source: invalid.source,
      });
    }

    const result = await saveImportedTransactions(req.user.id, transactions);

    res.json({
      msg: "Transaction auto-imported",
      transactions,
      ...result,
    });
  } catch (err) {
    console.error(err);
    res.status(err.statusCode || 500).json({ msg: err.statusCode ? err.message : "Server Error" });
  }
};

/* MONTHLY IMPORTED TRANSACTIONS */
exports.getImportedTransactions = async (req, res) => {
  try {
    await ensureTransactionTable();
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT id, type, title, amount, category, date::text, time, source, created_at
       FROM imported_transactions
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3
       ORDER BY date DESC, time DESC, created_at DESC`,
      [req.user.id, month, year]
    );

    const summary = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) AS total_credit,
        COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) AS total_debit,
        COUNT(*) AS count
       FROM imported_transactions
       WHERE user_id = $1
         AND EXTRACT(MONTH FROM date) = $2
         AND EXTRACT(YEAR FROM date) = $3`,
      [req.user.id, month, year]
    );

    const totals = summary.rows[0] || { total_credit: 0, total_debit: 0, count: 0 };
    res.json({
      transactions: result.rows,
      summary: {
        total_credit: totals.total_credit,
        total_debit: totals.total_debit,
        net: parseFloat(totals.total_credit || 0) - parseFloat(totals.total_debit || 0),
        count: totals.count,
      },
    });
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
