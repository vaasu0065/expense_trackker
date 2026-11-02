class TransactionModel {
  final String id;
  final String userId;
  final double amount;
  final String category;
  final String merchant;
  final String source;
  final String transactionType;
  final String transactionReference;
  final String paymentMethod;
  final String accountMasked;
  final DateTime transactionDate;
  /// False when the API sent a date without a time-of-day; UI then shows the date only.
  final bool hasTime;
  /// Row from the imported-transactions ledger. Its id belongs to a different
  /// table than manual expenses, so it must not be sent to DELETE /expenses/:id.
  final bool isImported;

  TransactionModel({
    required this.id,
    required this.userId,
    required this.amount,
    required this.category,
    required this.merchant,
    required this.source,
    required this.transactionType,
    required this.transactionReference,
    required this.paymentMethod,
    required this.accountMasked,
    required this.transactionDate,
    this.hasTime = true,
    this.isImported = false,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json, {bool isImported = false}) {
    final parsed = _parseWhen(json);
    return TransactionModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      amount: (json['amount'] != null ? double.tryParse(json['amount'].toString()) ?? 0.0 : 0.0),
      category: json['category'] ?? 'Other',
      merchant: json['merchant'] ?? json['title'] ?? 'Transaction',
      source: json['source'] ?? 'manual',
      transactionType: json['transactionType'] ?? json['type'] ?? 'debit',
      transactionReference: json['transactionReference'] ?? '',
      // Only show a payment method the data actually has.
      paymentMethod: (json['paymentMethod'] ?? '').toString(),
      accountMasked: json['accountMasked'] ?? '',
      transactionDate: parsed.$1,
      hasTime: parsed.$2,
      isImported: isImported,
    );
  }

  /// Full timestamps (`transactionDate`) are used as-is. Otherwise the API's
  /// `date` ("YYYY-MM-DD") is combined with its `time` ("HH:MM", may be empty).
  static (DateTime, bool) _parseWhen(Map<String, dynamic> json) {
    final full = json['transactionDate'];
    if (full != null) {
      final d = DateTime.tryParse(full.toString());
      if (d != null) return (d.toLocal(), true);
    }

    final rawDate = json['date']?.toString() ?? '';
    final dm = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(rawDate);
    if (dm == null) {
      final d = DateTime.tryParse(rawDate);
      return d != null ? (d.toLocal(), false) : (DateTime.now(), false);
    }
    final y = int.parse(dm.group(1)!), m = int.parse(dm.group(2)!), day = int.parse(dm.group(3)!);

    final tm = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch((json['time'] ?? '').toString().trim());
    if (tm == null) return (DateTime(y, m, day), false);
    return (DateTime(y, m, day, int.parse(tm.group(1)!), int.parse(tm.group(2)!)), true);
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'category': category,
      'merchant': merchant,
      'source': source,
      'transactionType': transactionType,
      'transactionReference': transactionReference,
      'paymentMethod': paymentMethod,
      'accountMasked': accountMasked,
      'transactionDate': transactionDate.toIso8601String(),
    };
  }
}
