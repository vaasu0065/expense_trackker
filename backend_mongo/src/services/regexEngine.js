/**
 * Multi-Format Regex Parsing Engine for Indian Banks & UPI Alerts
 * Parses raw SMS and Gmail transaction emails into structured financial objects.
 */

const { classifyCategory } = require('./categoryParser');

const BANK_PATTERNS = [
  // 1. UPI / Bank Debit Format: "Rs. 250.00 debited from a/c **1234 on 18-May-26 to SWIGGY Ref No 612345678912"
  {
    regex: /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s*(?:is\s*)?(?:debited|spent|paid|withdrawn)\s*(?:from|on)?\s*(?:your\s*)?(?:a\/c|account|card)?\s*[x*]*([0-9]{4})?\s*(?:on|at|dt)?\s*([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})?.*?(?:to|at|info(?:\*+)?|for\s+UPI\s+payment\s+to|towards)\s+([A-Za-z0-9\s._&/-]+?)(?:\s+Ref|\s+Txn|\s+Avail|\s+Bal|\s+on|\.|$)/i,
    type: 'expense'
  },
  // 2. UPI / Bank Credit Format: "Rs 55,000.00 credited to your A/c XX5678 on 01-May-26 by UPI/RAHUL/123456789"
  {
    regex: /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s*(?:is\s*)?(?:credited|received|deposited)\s*(?:to|in)?\s*(?:your\s*)?(?:a\/c|account|card)?\s*[x*]*([0-9]{4})?\s*(?:on|at|dt)?\s*([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})?.*?(?:by|from|via)\s+([A-Za-z0-9\s._&/-]+?)(?:\s+Ref|\s+Txn|\s+Avail|\s+Bal|\.|$)/i,
    type: 'income'
  },
  // 3. Credit Card Swipe: "INR 1,499.00 spent on your HDFC Bank Card XX9999 at AMAZON on 15/05/2026"
  {
    regex: /(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s+spent\s+on\s+(?:your\s+)?([A-Za-z\s]+?Card)\s*[x*]*([0-9]{4})?\s+at\s+([A-Za-z0-9\s._&/-]+?)\s+(?:on|dt)\s+([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})/i,
    type: 'expense',
    customMapper: (match) => ({
      amount: parseFloat(match[1].replace(/,/g, '')),
      paymentMethod: match[2]?.trim() || 'Credit Card',
      accountMasked: match[3] ? `xx${match[3]}` : '',
      merchant: match[4]?.trim() || 'Merchant',
      dateStr: match[5]
    })
  },
  // 4. PhonePe / GPay / Paytm Notification Alert: "Paid Rs.450 to Zomato via UPI on 16/05/26"
  {
    regex: /(?:Paid|Sent)\s+(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s+to\s+([A-Za-z0-9\s._&-]+?)\s+(?:via|by)\s+([A-Za-z0-9\s]+?)\s+(?:on|at)\s+([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})/i,
    type: 'expense',
    customMapper: (match) => ({
      amount: parseFloat(match[1].replace(/,/g, '')),
      merchant: match[2]?.trim() || 'Payee',
      paymentMethod: match[3]?.trim() || 'UPI',
      accountMasked: '',
      dateStr: match[4]
    })
  },
  // 5. Generic Amount Header + Action: "Your A/C XXXXX1234 Debited INR 500.00 On 12-May-26"
  {
    regex: /(?:A\/C|Account)\s*[x*]*([0-9]{4})\s+(?:is\s+)?(debited|credited)\s+(?:by\s+)?(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s+(?:on|dt)\s+([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})/i,
    type: 'dynamic',
    customMapper: (match) => ({
      accountMasked: `xx${match[1]}`,
      transactionType: match[2].toLowerCase().includes('credit') ? 'income' : 'expense',
      amount: parseFloat(match[3].replace(/,/g, '')),
      dateStr: match[4],
      merchant: match[2].toLowerCase().includes('credit') ? 'Bank Deposit' : 'Bank Withdrawal'
    })
  }
];

/**
 * Normalizes date string into JavaScript Date object.
 */
function normalizeDate(dateStr) {
  if (!dateStr) return new Date();
  const clean = dateStr.replace(/,/g, '').trim();
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  let match = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return new Date(`${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}T12:00:00.000Z`);
  }

  match = clean.match(/^(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    const month = monthMap[match[2].slice(0, 3).toLowerCase()];
    if (month) return new Date(`${year}-${month}-${match[1].padStart(2, '0')}T12:00:00.000Z`);
  }

  return new Date();
}

/**
 * Extracts reference/UPI number or generates a deterministic fallback hash.
 */
function extractReference(rawText, amount, merchant, dateObj) {
  const refMatch = rawText.match(/(?:Ref|Txn|Reference|UPI Ref|UTR|Txn ID)\s*(?:No\.?|ID)?\s*[:=-]?\s*([0-9A-Za-z]{8,20})/i);
  if (refMatch && refMatch[1]) {
    return refMatch[1].trim();
  }
  // Deterministic fallback reference using amount, merchant prefix, and date string
  const dateKey = dateObj.toISOString().split('T')[0];
  const merchantClean = merchant.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase();
  return `TXN-${amount}-${merchantClean}-${dateKey}`;
}

/**
 * Parse raw SMS or Email text and return a structured transaction object.
 * @param {string} rawText - Raw SMS notification or Email snippet.
 * @param {string} source - 'sms' or 'gmail'.
 * @returns {Object|null} - Structured transaction data or null if not matched.
 */
function parseRawMessage(rawText = '', source = 'sms') {
  if (!rawText || typeof rawText !== 'string') return null;

  for (const pattern of BANK_PATTERNS) {
    const match = rawText.match(pattern.regex);
    if (match) {
      let amount, transactionType, merchant, accountMasked, paymentMethod = 'UPI', dateStr;

      if (pattern.customMapper) {
        const mapped = pattern.customMapper(match);
        amount = mapped.amount;
        transactionType = mapped.transactionType || pattern.type;
        merchant = mapped.merchant || 'Unknown';
        accountMasked = mapped.accountMasked || '';
        paymentMethod = mapped.paymentMethod || 'UPI';
        dateStr = mapped.dateStr;
      } else {
        amount = parseFloat(match[1].replace(/,/g, ''));
        transactionType = pattern.type;
        accountMasked = match[2] ? `xx${match[2]}` : '';
        dateStr = match[3];
        merchant = (match[4] || 'Bank Transaction').replace(/\b(Ref|Txn|UPI|on|at)\b.*$/i, '').trim();
      }

      if (!amount || isNaN(amount) || amount <= 0) continue;

      const transactionDate = normalizeDate(dateStr);
      const category = classifyCategory(merchant, rawText, transactionType);
      const transactionReference = extractReference(rawText, amount, merchant, transactionDate);

      return {
        amount,
        transactionType,
        merchant: merchant.slice(0, 60) || 'Merchant',
        category,
        paymentMethod,
        accountMasked,
        transactionReference,
        transactionDate,
        source,
        rawSourceData: rawText
      };
    }
  }

  return null;
}

module.exports = {
  parseRawMessage,
  normalizeDate,
  extractReference
};
