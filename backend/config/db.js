const { Pool } = require("pg");

const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
};

if (!global.__pgPool) {
  global.__pgPool = new Pool(poolConfig);
}

module.exports = global.__pgPool;
