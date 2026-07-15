const express = require('express');
const {
  getTransactions,
  createTransaction,
  bulkImport,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all transaction routes

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.post('/bulk-import', bulkImport);

router.route('/:id')
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
