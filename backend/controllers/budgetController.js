const pool = require("../config/db");

// ⭐ SAVE / UPDATE BUDGET
exports.setBudget = async (req,res)=>{
  try {
    let { month, year, income, budget } = req.body;
    const userId = req.user.id;

    // Convert to numbers
    month = parseInt(month);
    year = parseInt(year);
    income = parseFloat(income);
    budget = parseFloat(budget);

    // Validation
    if(isNaN(month) || isNaN(year)){
      return res.status(400).json({ msg:"Month & Year are required" });
    }

    if(isNaN(income) || isNaN(budget)){
      return res.status(400).json({ msg:"Income & Budget must be numbers" });
    }

    await pool.query(
      `INSERT INTO budget(user_id, month, year, income, budget)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT (user_id, month, year)
       DO UPDATE SET income=$4, budget=$5`,
      [userId, month, year, income, budget]
    );

    res.json({msg:"Budget Saved"});

  } catch(err){
    console.log(err);
    res.status(500).json({msg:"Server Error"});
  }
};



// ⭐ GET BUDGET SUMMARY
exports.getBudget = async (req,res)=>{
  try {
    const { month, year } = req.query;
    const userId = req.user.id;

    // Get budget record
    const budgetRes = await pool.query(
      `SELECT * FROM budget
       WHERE user_id=$1 AND month=$2 AND year=$3`,
      [userId, month, year]
    );

    const budgetData = budgetRes.rows[0] || { income:0, budget:0 };

    // Get user's expense table name safely
    const userRes = await pool.query(
      "SELECT name FROM users WHERE id=$1",
      [userId]
    );

    let name = userRes.rows[0]?.name || "user";
    name = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const table = `expenses_${name}_${userId}`;

    // Get total spent
    const expenseRes = await pool.query(`
      SELECT SUM(amount) as total FROM ${table}
      WHERE EXTRACT(MONTH FROM date)=$1
      AND EXTRACT(YEAR FROM date)=$2
    `, [month, year]);

    const totalExpense = expenseRes.rows[0]?.total || 0;

    res.json({
      income: budgetData.income,
      budget: budgetData.budget,
      spent: totalExpense,
      remaining: budgetData.budget - totalExpense
    });

  } catch(err){
    console.log(err);
    res.status(500).json({msg:"Server Error"});
  }
};
