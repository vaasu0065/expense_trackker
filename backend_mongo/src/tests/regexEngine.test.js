const { parseRawMessage } = require('../services/regexEngine');

const sampleMessages = [
  "Rs. 250.00 debited from a/c **1234 on 18-May-26 to SWIGGY Ref No 612345678912",
  "Rs 55,000.00 credited to your A/c XX5678 on 01-May-26 by UPI/RAHUL/123456789",
  "INR 1,499.00 spent on your HDFC Bank Card XX9999 at AMAZON on 15/05/2026",
  "Paid Rs.450 to Zomato via UPI on 16/05/26",
  "Your A/C XXXXX1234 Debited INR 500.00 On 12-May-26"
];

console.log("=== RUNNING REGEX ENGINE VERIFICATION ===\n");

let passed = 0;
sampleMessages.forEach((msg, idx) => {
  const result = parseRawMessage(msg, 'sms');
  console.log(`Test #${idx + 1}: "${msg}"`);
  if (result) {
    passed++;
    console.log(" -> Extracted:", JSON.stringify({
      amount: result.amount,
      type: result.transactionType,
      merchant: result.merchant,
      category: result.category,
      account: result.accountMasked,
      ref: result.transactionReference
    }, null, 2));
  } else {
    console.error(" -> FAILED TO PARSE");
  }
  console.log("-----------------------------------------");
});

console.log(`\nResults: ${passed}/${sampleMessages.length} tests passed successfully.`);
if (passed !== sampleMessages.length) process.exit(1);
