const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

async function initDatabase() {
  try {
    console.log("Initializing database...");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    await pool.query(schema);

    console.log("✅ Database initialized successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
}

initDatabase();
