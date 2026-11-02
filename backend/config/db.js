const { Pool, types } = require("pg");

// Return DATE columns as plain "YYYY-MM-DD" strings instead of JS Dates at
// server-local midnight, so dates never shift with the server/client timezone.
types.setTypeParser(1082, (value) => value);

const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  // Each Vercel function instance gets its own pool, so keep it small and let
  // idle connections go; otherwise a few warm instances exhaust Supabase's
  // pooler. Use the transaction pooler (port 6543) in production.
  max: parseInt(process.env.DB_POOL_MAX || (process.env.VERCEL ? "2" : "10"), 10),
  idleTimeoutMillis: process.env.VERCEL ? 5000 : 30000,
};

if (!global.__pgPool) {
  global.__pgPool = new Pool(poolConfig);
}

module.exports = global.__pgPool;
