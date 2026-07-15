const fastCsv = require('fast-csv');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');

/**
 * Stream transactions as a CSV file to Express response.
 */
async function exportToCSV(userId, res) {
  const transactions = await Transaction.find({ userId }).sort({ transactionDate: -1 }).lean();

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=Expense_Tracker_Ledger.csv');

  const csvStream = fastCsv.format({ headers: true });
  csvStream.pipe(res);

  for (const t of transactions) {
    csvStream.write({
      ID: t._id.toString(),
      Date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
      Type: t.transactionType ? t.transactionType.toUpperCase() : '',
      Category: t.category || '',
      Merchant: t.merchant || '',
      Amount: t.amount || 0,
      Payment_Method: t.paymentMethod || '',
      Account: t.accountMasked || '',
      Reference: t.transactionReference || '',
      Source: t.source || ''
    });
  }

  csvStream.end();
}

/**
 * Stream transactions as an Excel workbook to Express response.
 */
async function exportToExcel(userId, res) {
  const transactions = await Transaction.find({ userId }).sort({ transactionDate: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Expense Tracker Pro';
  const worksheet = workbook.addWorksheet('Transactions');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Merchant', key: 'merchant', width: 25 },
    { header: 'Amount (₹)', key: 'amount', width: 15 },
    { header: 'Payment Method', key: 'method', width: 16 },
    { header: 'Account Masked', key: 'account', width: 16 },
    { header: 'Reference No', key: 'reference', width: 22 },
    { header: 'Source', key: 'source', width: 12 }
  ];

  // Format header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

  for (const t of transactions) {
    const row = worksheet.addRow({
      date: t.transactionDate ? new Date(t.transactionDate).toISOString().split('T')[0] : '',
      type: t.transactionType ? t.transactionType.toUpperCase() : '',
      category: t.category || '',
      merchant: t.merchant || '',
      amount: t.amount || 0,
      method: t.paymentMethod || '',
      account: t.accountMasked || '',
      reference: t.transactionReference || '',
      source: t.source || ''
    });

    // Color code amounts
    const amountCell = row.getCell('amount');
    amountCell.font = {
      bold: true,
      color: { argb: t.transactionType === 'credit' || t.transactionType === 'income' ? 'FF10B981' : 'FFEF4444' }
    };
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=Expense_Tracker_Ledger.xlsx');

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = {
  exportToCSV,
  exportToExcel
};
