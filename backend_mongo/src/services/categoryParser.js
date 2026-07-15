/**
 * AI / Rule-Based Category Detection Engine
 * Automatically classifies merchants and transaction titles into exact financial categories.
 */

const CATEGORY_RULES = [
  {
    category: 'Salary',
    keywords: ['salary', 'stipend', 'payroll', 'wages', 'credit of salary', 'monthly comp']
  },
  {
    category: 'Food',
    keywords: [
      'swiggy', 'zomato', 'restaurant', 'cafe', 'food', 'pizza', 'burger', 
      'starbucks', 'mcdonalds', 'kfc', 'domino', 'subway', 'barbeque', 'chai', 
      'coffee', 'baker', 'dhaba', 'dine', 'eatout'
    ]
  },
  {
    category: 'Grocery',
    keywords: [
      'blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'reliance fresh', 
      'grocery', 'supermarket', 'mart', 'kirana', 'spencers', 'nature basket'
    ]
  },
  {
    category: 'Travel',
    keywords: [
      'uber', 'ola', 'rapido', 'irctc', 'metro rail', 'redbus', 'makemytrip', 
      'indigo', 'air india', 'flight', 'train', 'cab', 'taxi', 'toll', 'fastag', 'parking'
    ]
  },
  {
    category: 'Fuel',
    keywords: [
      'petrol', 'diesel', 'cng', 'fuel', 'hpcl', 'bpcl', 'ioc', 'indian oil', 
      'bharat petroleum', 'hindustan petroleum', 'shell', 'ev charge'
    ]
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'tata cliq', 'zara', 'h&m', 
      'decathlon', 'croma', 'reliance digital', 'shopping', 'store', 'apparel', 'fashion'
    ]
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'prime video', 'hotstar', 'spotify', 'bookmyshow', 'pvr', 
      'inox', 'cinema', 'movie', 'game', 'playstation', 'steam', 'youtube premium'
    ]
  },
  {
    category: 'Healthcare',
    keywords: [
      'apollo pharmacy', 'netmeds', 'pharmeasy', '1mg', 'pharmacy', 'medical', 
      'hospital', 'doctor', 'clinic', 'pathlab', 'diagnostic', 'dentist', 'optician'
    ]
  },
  {
    category: 'Bills',
    keywords: [
      'electricity', 'bescom', 'msedcl', 'water bill', 'broadband', 'airtel', 
      'jio', 'vi ', 'vodafone', 'recharge', 'gas', 'indane', 'tata sky', 'dth', 
      'insurance', 'lic', 'premium', 'maintenance'
    ]
  },
  {
    category: 'Investment',
    keywords: [
      'zerodha', 'groww', 'upstox', 'mutual fund', 'sip', 'stock', 'bond', 
      'nps', 'ppf', 'gold', 'crypto'
    ]
  }
];

/**
 * Classify a transaction based on merchant name, source text, and transaction type.
 * @param {string} merchant - Merchant or payee name.
 * @param {string} rawText - Optional raw SMS or email text for deeper context.
 * @param {string} transactionType - 'expense' or 'income'.
 * @returns {string} - The classified category (e.g. 'Food', 'Healthcare').
 */
function classifyCategory(merchant = '', rawText = '', transactionType = 'expense') {
  if (transactionType === 'income') {
    const combinedLower = `${merchant} ${rawText}`.toLowerCase();
    if (combinedLower.includes('salary') || combinedLower.includes('payroll')) {
      return 'Salary';
    }
    if (combinedLower.includes('interest') || combinedLower.includes('dividend') || combinedLower.includes('refund')) {
      return 'Income';
    }
    return 'Income';
  }

  const combined = `${merchant} ${rawText}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (combined.includes(keyword)) {
        return rule.category;
      }
    }
  }

  return 'Other';
}

module.exports = {
  classifyCategory,
  CATEGORY_RULES
};
