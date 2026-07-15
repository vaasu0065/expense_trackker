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
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      userId: (json['userId'] ?? json['user_id'] ?? '').toString(),
      amount: (json['amount'] != null ? double.tryParse(json['amount'].toString()) ?? 0.0 : 0.0),
      category: json['category'] ?? 'Other',
      merchant: json['merchant'] ?? json['title'] ?? 'Transaction',
      source: json['source'] ?? 'manual',
      transactionType: json['transactionType'] ?? json['type'] ?? 'debit',
      transactionReference: json['transactionReference'] ?? '',
      paymentMethod: json['paymentMethod'] ?? 'UPI',
      accountMasked: json['accountMasked'] ?? '',
      transactionDate: json['transactionDate'] != null
          ? DateTime.tryParse(json['transactionDate'].toString()) ?? DateTime.now()
          : (json['date'] != null ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now() : DateTime.now()),
    );
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
