const Transaction = require('../models/Transaction');
const { classifyCategory } = require('../services/categoryParser');
const { parseRawMessage } = require('../services/regexEngine');

// @desc    Get all transactions with optional filters & pagination
// @route   GET /api/v1/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const { category, type, source, search, month, year, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (category && category !== 'All') query.category = category;
    if (type && type !== 'all') query.transactionType = type;
    if (source && source !== 'all') query.source = source;
    if (search) {
      query.$or = [
        { merchant: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { transactionReference: { $regex: search, $options: 'i' } }
      ];
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      query.transactionDate = { $gte: startDate, $lte: endDate };
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a manual transaction
// @route   POST /api/v1/transactions
exports.createTransaction = async (req, res, next) => {
  try {
    let { amount, merchant, category, transactionType = 'expense', paymentMethod = 'UPI', transactionDate, transactionReference } = req.body;

    if (!amount || !merchant) {
      return res.status(400).json({ success: false, message: 'Amount and Merchant are required' });
    }

    if (!category || category === 'Other') {
      category = classifyCategory(merchant, '', transactionType);
    }

    if (!transactionReference) {
      const dateKey = (transactionDate ? new Date(transactionDate) : new Date()).toISOString().split('T')[0];
      const merchantClean = merchant.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase();
      transactionReference = `MANUAL-${amount}-${merchantClean}-${dateKey}-${Date.now()}`;
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      merchant,
      category,
      transactionType,
      paymentMethod,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      transactionReference,
      source: 'manual'
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk Import parsed SMS or Gmail transactions (with Zero-Duplicate prevention)
// @route   POST /api/v1/transactions/bulk-import
exports.bulkImport = async (req, res, next) => {
  try {
    const { transactions = [], source = 'sms' } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of transactions to import' });
    }

    const processed = [];
    for (const item of transactions) {
      // If client sent raw SMS string, run it through our regex parser
      if (typeof item === 'string' || item.rawText) {
        const parsed = parseRawMessage(item.rawText || item, source);
        if (parsed) {
          parsed.userId = req.user._id;
          processed.push(parsed);
        }
      } else if (item.amount && item.merchant) {
        processed.push({
          userId: req.user._id,
          amount: parseFloat(item.amount),
          merchant: item.merchant.trim(),
          category: item.category || classifyCategory(item.merchant, '', item.transactionType || 'expense'),
          transactionType: item.transactionType || 'expense',
          paymentMethod: item.paymentMethod || 'UPI',
          accountMasked: item.accountMasked || '',
          transactionDate: item.transactionDate ? new Date(item.transactionDate) : new Date(),
          transactionReference: item.transactionReference || `BULK-${item.amount}-${item.merchant.slice(0, 8)}-${Date.now()}`,
          source: item.source || source
        });
      }
    }

    if (processed.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid transactions could be parsed from payload' });
    }

    // Bulk write with upsert on compound index [userId, transactionReference, transactionDate]
    const bulkOps = processed.map(t => ({
      updateOne: {
        filter: { userId: t.userId, transactionReference: t.transactionReference },
        update: { $setOnInsert: t },
        upsert: true
      }
    }));

    const result = await Transaction.bulkWrite(bulkOps, { ordered: false });

    res.status(200).json({
      success: true,
      scanned: processed.length,
      imported: result.upsertedCount || 0,
      duplicatesIgnored: processed.length - (result.upsertedCount || 0)
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a transaction
// @route   PUT /api/v1/transactions/:id
exports.updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/v1/transactions/:id
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
};
