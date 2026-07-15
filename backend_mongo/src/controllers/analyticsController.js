const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { exportToCSV, exportToExcel } = require('../services/exportService');

// @desc    Get complete analytics dashboard breakdown (Pie chart, Bar chart, Velocity, Top Merchants)
// @route   GET /api/v1/analytics/summary
exports.getSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const matchStage = {
      userId: req.user._id,
      transactionDate: { $gte: startDate, $lte: endDate }
    };

    const aggregated = await Transaction.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // 1. Overall Totals by transactionType
          totals: [
            {
              $group: {
                _id: '$transactionType',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          // 2. Category Pie Chart breakdown (Expenses only)
          byCategory: [
            { $match: { transactionType: 'expense' } },
            {
              $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { total: -1 } }
          ],
          // 3. Top Spending Merchants
          topMerchants: [
            { $match: { transactionType: 'expense' } },
            {
              $group: {
                _id: '$merchant',
                totalSpent: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 }
          ],
          // 4. Daily Spending Velocity (for Line / Bar Charts)
          dailyExpenses: [
            { $match: { transactionType: 'expense' } },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
                dailyTotal: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          // 5. Source breakdown (SMS vs Gmail vs Manual)
          bySource: [
            {
              $group: {
                _id: '$source',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const data = aggregated[0] || {};
    let totalExpense = 0;
    let totalIncome = 0;

    (data.totals || []).forEach(item => {
      if (item._id === 'expense') totalExpense = item.totalAmount;
      if (item._id === 'income') totalIncome = item.totalAmount;
    });

    const user = await User.findById(req.user._id);
    const monthlyBudget = user?.settings?.monthlyBudget || 50000;
    const budgetRemaining = Math.max(0, monthlyBudget - totalExpense);
    const budgetPercentage = Math.min(100, Math.round((totalExpense / monthlyBudget) * 100));

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        totalExpense,
        totalIncome,
        netBalance: totalIncome - totalExpense,
        budget: {
          limit: monthlyBudget,
          spent: totalExpense,
          remaining: budgetRemaining,
          percentage: budgetPercentage
        },
        categoryBreakdown: data.byCategory || [],
        topMerchants: data.topMerchants || [],
        dailyExpenses: data.dailyExpenses || [],
        sourceBreakdown: data.bySource || []
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export Ledger as CSV or Excel
// @route   GET /api/v1/analytics/export
exports.exportData = async (req, res, next) => {
  try {
    const { format = 'csv' } = req.query;
    if (format.toLowerCase() === 'xlsx' || format.toLowerCase() === 'excel') {
      await exportToExcel(req.user._id, res);
    } else {
      await exportToCSV(req.user._id, res);
    }
  } catch (err) {
    next(err);
  }
};
