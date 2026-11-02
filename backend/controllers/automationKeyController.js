const crypto = require("crypto");
const pool = require("../config/db");

const KEY_PREFIX = "etk_";

const hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");

async function ensureAutomationKeyTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS automation_keys (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      key_hash VARCHAR(64) UNIQUE NOT NULL,
      key_prefix VARCHAR(16) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP
    )
  `);
}

const publicFields = "key_prefix, created_at, last_used_at";

/* GET – whether the user has a key (never returns the key itself) */
exports.getKey = async (req, res) => {
  try {
    await ensureAutomationKeyTable();
    const result = await pool.query(
      `SELECT ${publicFields} FROM automation_keys WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ key: result.rows[0] || null });
  } catch (err) {
    console.error("Get automation key error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* POST – create or replace the user's key; the plain key is returned only this once */
exports.createKey = async (req, res) => {
  try {
    await ensureAutomationKeyTable();
    const key = KEY_PREFIX + crypto.randomBytes(24).toString("base64url");
    const result = await pool.query(
      `INSERT INTO automation_keys (user_id, key_hash, key_prefix)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET key_hash = $2, key_prefix = $3, created_at = CURRENT_TIMESTAMP, last_used_at = NULL
       RETURNING ${publicFields}`,
      [req.user.id, hashKey(key), key.slice(0, 10)]
    );
    res.json({ msg: "Automation key created", apiKey: key, key: result.rows[0] });
  } catch (err) {
    console.error("Create automation key error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* DELETE – revoke the key; any automation using it stops working */
exports.revokeKey = async (req, res) => {
  try {
    await ensureAutomationKeyTable();
    await pool.query("DELETE FROM automation_keys WHERE user_id = $1", [req.user.id]);
    res.json({ msg: "Automation key revoked" });
  } catch (err) {
    console.error("Revoke automation key error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
};

/* Resolve an automation key to its user id, or null */
exports.findUserByKey = async (key) => {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;
  await ensureAutomationKeyTable();
  const result = await pool.query(
    `UPDATE automation_keys SET last_used_at = CURRENT_TIMESTAMP
     WHERE key_hash = $1
     RETURNING user_id`,
    [hashKey(key)]
  );
  return result.rows[0]?.user_id ?? null;
};

exports.KEY_PREFIX = KEY_PREFIX;
