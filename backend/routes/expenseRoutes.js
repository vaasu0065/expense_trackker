const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  addExpense,
  getExpenses,
  monthlyStats,
  summary,
  deleteExpense,
  updateExpense,
  filterExpenses,
  exportCSV,
  exportExcel,
  dailyStats
} = require("../controllers/expenseController");
const { setBudget, getBudget } = require("../controllers/budgetController");

const router = express.Router();

router.post("/add", auth, addExpense);
router.get("/", auth, getExpenses);
router.get("/monthly", auth, monthlyStats);
router.get("/summary", auth, summary);
router.delete("/:id", auth, deleteExpense);
router.put("/:id", auth, updateExpense);
router.get("/filter", auth, filterExpenses);
router.post("/budget", auth, setBudget);
router.get("/budget", auth, getBudget);

router.get("/export/csv", auth, exportCSV);
router.get("/export/excel", auth, exportExcel);
router.get("/daily", auth, dailyStats);


module.exports = router;
