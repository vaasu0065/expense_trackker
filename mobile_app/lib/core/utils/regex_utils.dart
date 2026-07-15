import '../../models/transaction_model.dart';

class RegexUtils {
  static final List<Map<String, dynamic>> _bankPatterns = [
    // 1. UPI / Bank Debit Format: "Rs. 250.00 debited from a/c **1234 on 18-May-26 to SWIGGY Ref No 612345678912"
    {
      'regex': RegExp(
        r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s*(?:is\s*)?(?:debited|spent|paid|withdrawn)\s*(?:from|on)?\s*(?:your\s*)?(?:a\/c|account|card)?\s*[x*]*([0-9]{4})?\s*(?:on|at|dt)?\s*([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})?.*?(?:to|at|info(?:\*+)?|for\s+UPI\s+payment\s+to|towards)\s+([A-Za-z0-9\s._&/-]+?)(?:\s+Ref|\s+Txn|\s+Avail|\s+Bal|\s+on|\.|$)',
        caseSensitive: false,
      ),
      'type': 'expense',
    },
    // 2. UPI / Bank Credit Format: "Rs 55,000.00 credited to your A/c XX5678 on 01-May-26 by UPI/RAHUL/123456789"
    {
      'regex': RegExp(
        r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s*(?:is\s*)?(?:credited|received|deposited)\s*(?:to|in)?\s*(?:your\s*)?(?:a\/c|account|card)?\s*[x*]*([0-9]{4})?\s*(?:on|at|dt)?\s*([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})?.*?(?:by|from|via)\s+([A-Za-z0-9\s._&/-]+?)(?:\s+Ref|\s+Txn|\s+Avail|\s+Bal|\.|$)',
        caseSensitive: false,
      ),
      'type': 'income',
    },
    // 3. Credit Card Swipe: "INR 1,499.00 spent on your HDFC Bank Card XX9999 at AMAZON on 15/05/2026"
    {
      'regex': RegExp(
        r'(?:INR|Rs\.?|₹)\s*([0-9,]+(?:\.\d{1,2})?)\s+spent\s+on\s+(?:your\s+)?([A-Za-z\s]+?Card)\s*[x*]*([0-9]{4})?\s+at\s+([A-Za-z0-9\s._&/-]+?)\s+(?:on|dt)\s+([\d]{1,2}[-/][A-Za-z0-9]{2,3}[-/][\d]{2,4})',
        caseSensitive: false,
      ),
      'type': 'expense',
      'isCard': true,
    },
  ];

  static bool isBankOrUpiSender(String senderId) {
    final upper = senderId.toUpperCase();
    final bankKeywords = ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK', 'PAYTM', 'PHONEPE', 'GPAY', 'AMAZON', 'BANK', 'FIN'];
    for (final kw in bankKeywords) {
      if (upper.contains(kw)) return true;
    }
    // Indian SMS headers format AB-SENDER or XY-BANKID
    if (upper.contains('-') && upper.length >= 6) return true;
    return false;
  }

  static TransactionModel? parseTransaction(String rawText, String senderId, String userId) {
    if (rawText.isEmpty) return null;

    for (final pattern in _bankPatterns) {
      final reg = pattern['regex'] as RegExp;
      final match = reg.firstMatch(rawText);
      if (match != null) {
        double amount = 0;
        String type = pattern['type'];
        String merchant = 'Merchant';
        String accountMasked = '';
        String paymentMethod = 'UPI';

        if (pattern['isCard'] == true) {
          amount = double.tryParse(match.group(1)!.replaceAll(',', '')) ?? 0;
          paymentMethod = match.group(2)?.trim() ?? 'Credit Card';
          accountMasked = match.group(3) != null ? 'xx${match.group(3)}' : '';
          merchant = match.group(4)?.trim() ?? 'Merchant';
        } else {
          amount = double.tryParse(match.group(1)!.replaceAll(',', '')) ?? 0;
          accountMasked = match.group(2) != null ? 'xx${match.group(2)}' : '';
          merchant = (match.group(4) ?? 'Bank Transaction').replaceAll(RegExp(r'\b(Ref|Txn|UPI|on|at)\b.*$', caseSensitive: false), '').trim();
        }

        if (amount <= 0) continue;

        // Extract Ref No
        String refNo = 'SMS-${amount}-${DateTime.now().millisecondsSinceEpoch}';
        final refMatch = RegExp(r'(?:Ref|Txn|Reference|UPI Ref|UTR)\s*(?:No\.?|ID)?\s*[:=-]?\s*([0-9A-Za-z]{8,20})', caseSensitive: false).firstMatch(rawText);
        if (refMatch != null && refMatch.group(1) != null) {
          refNo = refMatch.group(1)!.trim();
        }

        return TransactionModel(
          id: '',
          userId: userId,
          amount: amount,
          category: _classifyCategory(merchant, type),
          merchant: merchant.isEmpty ? 'Bank Transfer' : merchant,
          source: 'sms',
          transactionType: type,
          transactionReference: refNo,
          paymentMethod: paymentMethod,
          accountMasked: accountMasked,
          transactionDate: DateTime.now(),
        );
      }
    }
    return null;
  }

  static String _classifyCategory(String merchant, String type) {
    if (type == 'income') return 'Income';
    final lower = merchant.toLowerCase();
    if (lower.contains('swiggy') || lower.contains('zomato') || lower.contains('cafe') || lower.contains('restaurant') || lower.contains('food')) {
      return 'Food';
    }
    if (lower.contains('blinkit') || lower.contains('zepto') || lower.contains('bigbasket') || lower.contains('grocery') || lower.contains('dmart')) {
      return 'Grocery';
    }
    if (lower.contains('uber') || lower.contains('ola') || lower.contains('irctc') || lower.contains('metro') || lower.contains('flight') || lower.contains('fuel') || lower.contains('petrol')) {
      return 'Travel';
    }
    if (lower.contains('amazon') || lower.contains('flipkart') || lower.contains('myntra') || lower.contains('shopping') || lower.contains('zara')) {
      return 'Shopping';
    }
    if (lower.contains('netflix') || lower.contains('prime') || lower.contains('hotstar') || lower.contains('spotify') || lower.contains('cinema')) {
      return 'Entertainment';
    }
    if (lower.contains('apollo') || lower.contains('pharmeasy') || lower.contains('hospital') || lower.contains('medical') || lower.contains('doctor')) {
      return 'Healthcare';
    }
    if (lower.contains('electricity') || lower.contains('airtel') || lower.contains('jio') || lower.contains('bill') || lower.contains('recharge')) {
      return 'Bills';
    }
    return 'Other';
  }
}
