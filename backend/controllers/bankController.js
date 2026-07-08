const pool = require("../config/db");
const { saveImportedTransactions } = require("./expenseController");

async function ensureBankTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_connections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      provider VARCHAR(50) NOT NULL DEFAULT 'mock',
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked', 'failed')),
      consent_id VARCHAR(255),
      account_mask VARCHAR(50),
      last_synced_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bank_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      connection_id INTEGER REFERENCES bank_connections(id) ON DELETE CASCADE,
      provider_transaction_id VARCHAR(255) NOT NULL,
      type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
      title VARCHAR(255) NOT NULL,
      amount NUMERIC NOT NULL,
      category VARCHAR(255) DEFAULT 'Other',
      date DATE DEFAULT CURRENT_DATE,
      time VARCHAR(10) DEFAULT '',
      raw JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, provider_transaction_id)
    )
  `);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function currentMonthTransactions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const prefix = `${year}-${pad(month)}`;

  return [
    {
      provider_transaction_id: `mock-${prefix}-salary`,
      type: "credit",
      title: "Salary",
      amount: 55000,
      category: "Income",
      date: `${prefix}-01`,
      time: "09:30",
    },
    {
      provider_transaction_id: `mock-${prefix}-swiggy`,
      type: "debit",
      title: "SWIGGY",
      amount: 420,
      category: "Food",
      date: `${prefix}-05`,
      time: "20:15",
    },
    {
      provider_transaction_id: `mock-${prefix}-metro`,
      type: "debit",
      title: "METRO RAIL",
      amount: 80,
      category: "Travel",
      date: `${prefix}-09`,
      time: "08:45",
    },
    {
      provider_transaction_id: `mock-${prefix}-refund`,
      type: "credit",
      title: "Shopping refund",
      amount: 999,
      category: "Refund",
      date: `${prefix}-12`,
      time: "14:10",
    },
  ];
}

exports.getStatus = async (req, res) => {
  try {
    await ensureBankTables();
    const result = await pool.query(
      `SELECT id, provider, status, consent_id, account_mask, last_synced_at, created_at, updated_at
       FROM bank_connections
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json({ connection: result.rows[0] || null });
  } catch (err) {
    console.error("Bank status error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.createConnection = async (req, res) => {
  try {
    await ensureBankTables();
    const provider = req.body.provider || "mock";

    if (provider !== "mock") {
      return res.status(400).json({
        msg: "Provider is not configured yet. Add provider credentials before using production bank sync.",
      });
    }

    const consentId = `mock-consent-${req.user.id}-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO bank_connections(user_id, provider, status, consent_id, account_mask)
       VALUES($1, $2, 'pending', $3, $4)
       RETURNING id, provider, status, consent_id, account_mask, created_at`,
      [req.user.id, provider, consentId, "XXXX8292"]
    );

    res.json({
      msg: "Mock bank consent created",
      connection: result.rows[0],
      consentUrl: `/bank/mock/approve`,
    });
  } catch (err) {
    console.error("Create bank connection error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.approveMockConnection = async (req, res) => {
  try {
    await ensureBankTables();
    const result = await pool.query(
      `UPDATE bank_connections
       SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND provider = 'mock'
       RETURNING id, provider, status, consent_id, account_mask, created_at, updated_at`,
      [req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ msg: "Create a bank connection first" });
    }

    res.json({ msg: "Mock bank connected", connection: result.rows[0] });
  } catch (err) {
    console.error("Approve mock bank error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

exports.syncTransactions = async (req, res) => {
  try {
    await ensureBankTables();
    const connectionResult = await pool.query(
      `SELECT * FROM bank_connections
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    const connection = connectionResult.rows[0];
    if (!connection) {
      return res.status(400).json({ msg: "Connect a bank before syncing" });
    }

    const providerTransactions = currentMonthTransactions();
    const newTransactions = [];

    for (const transaction of providerTransactions) {
      const insert = await pool.query(
        `INSERT INTO bank_transactions(
          user_id, connection_id, provider_transaction_id, type, title, amount, category, date, time, raw
        )
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (user_id, provider_transaction_id) DO NOTHING
        RETURNING provider_transaction_id`,
        [
          req.user.id,
          connection.id,
          transaction.provider_transaction_id,
          transaction.type,
          transaction.title,
          transaction.amount,
          transaction.category,
          transaction.date,
          transaction.time,
          JSON.stringify(transaction),
        ]
      );

      if (insert.rowCount > 0) {
        newTransactions.push({
          type: transaction.type,
          title: transaction.title,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          time: transaction.time,
          source: `bank:${connection.provider}:${transaction.provider_transaction_id}`,
        });
      }
    }

    let imported = { count: 0, debitCount: 0, creditCount: 0 };
    if (newTransactions.length > 0) {
      imported = await saveImportedTransactions(req.user.id, newTransactions);
    }

    await pool.query(
      `UPDATE bank_connections
       SET last_synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [connection.id, req.user.id]
    );

    res.json({
      msg: newTransactions.length > 0 ? "Bank transactions synced" : "No new bank transactions",
      imported,
      newTransactions,
    });
  } catch (err) {
    console.error("Bank sync error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};
