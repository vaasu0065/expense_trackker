require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const fs = require("fs");
const path = require("path");

const app = express();

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

// TEST
app.get("/test",(req,res)=>{
  res.send("Backend Running OK");
});

// ROUTES
app.use("/auth", require("./routes/authRoutes"));
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/budget", require("./routes/budgetRoutes"));
app.use("/lendborrow", require("./routes/lendBorrowRoutes"));

app.listen(process.env.PORT || 4000, () =>
  console.log("Server running on", process.env.PORT)
);
