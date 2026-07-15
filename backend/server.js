require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const fs = require("fs");
const path = require("path");

const app = express();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(express.json());

// Auto-initialize DB tables on startup
async function initDB() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "db/schema.sql"), "utf8");
    await pool.query(schema);
    console.log("✅ Database tables ready");
  } catch (err) {
    console.error("⚠️ DB init warning:", err.message);
  }
}
initDB();

// TEST & STATUS
app.get("/", (req, res) => {
  res.json({ status: "live", service: "Expense Tracker Pro API", version: "2.0.0" });
});

app.get("/test", (req, res) => {
  console.log('/test route hit', { headers: req.headers });
  res.json({ msg: "Backend Running OK" });
});

// ROUTES
app.use("/auth", require("./routes/authRoutes"));
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/budget", require("./routes/budgetRoutes"));
app.use("/lendborrow", require("./routes/lendBorrowRoutes"));
app.use("/bank", require("./routes/bankRoutes"));

// ALIASES for /api prefix
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/budget", require("./routes/budgetRoutes"));
app.use("/api/lendborrow", require("./routes/lendBorrowRoutes"));
app.use("/api/bank", require("./routes/bankRoutes"));

if (require.main === module) {
  app.listen(process.env.PORT || 5001, () =>
    console.log("Server running on", process.env.PORT || 5001)
  );
}

module.exports = app;
