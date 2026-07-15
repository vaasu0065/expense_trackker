class CategoryBreakdown {
  final String category;
  final double total;
  final int count;

  CategoryBreakdown({
    required this.category,
    required this.total,
    required this.count,
  });

  factory CategoryBreakdown.fromJson(Map<String, dynamic> json) {
    return CategoryBreakdown(
      category: json['_id'] ?? json['category'] ?? 'Other',
      total: (json['total'] ?? 0).toDouble(),
      count: json['count'] ?? 1,
    );
  }
}

class TopMerchant {
  final String merchant;
  final double totalSpent;
  final int count;

  TopMerchant({
    required this.merchant,
    required this.totalSpent,
    required this.count,
  });

  factory TopMerchant.fromJson(Map<String, dynamic> json) {
    return TopMerchant(
      merchant: json['_id'] ?? json['merchant'] ?? 'Unknown',
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
      count: json['count'] ?? 1,
    );
  }
}

class DailyExpenseItem {
  final String dateStr;
  final double dailyTotal;

  DailyExpenseItem({
    required this.dateStr,
    required this.dailyTotal,
  });

  factory DailyExpenseItem.fromJson(Map<String, dynamic> json) {
    return DailyExpenseItem(
      dateStr: json['_id'] ?? json['dateStr'] ?? '',
      dailyTotal: (json['dailyTotal'] ?? 0).toDouble(),
    );
  }
}

class BudgetSummary {
  final double limit;
  final double spent;
  final double remaining;
  final int percentage;

  BudgetSummary({
    required this.limit,
    required this.spent,
    required this.remaining,
    required this.percentage,
  });

  factory BudgetSummary.fromJson(Map<String, dynamic> json) {
    return BudgetSummary(
      limit: (json['limit'] ?? 50000).toDouble(),
      spent: (json['spent'] ?? 0).toDouble(),
      remaining: (json['remaining'] ?? 0).toDouble(),
      percentage: json['percentage'] ?? 0,
    );
  }
}

class AnalyticsSummaryModel {
  final int month;
  final int year;
  final double totalExpense;
  final double totalIncome;
  final double netBalance;
  final BudgetSummary budget;
  final List<CategoryBreakdown> categoryBreakdown;
  final List<TopMerchant> topMerchants;
  final List<DailyExpenseItem> dailyExpenses;

  AnalyticsSummaryModel({
    required this.month,
    required this.year,
    required this.totalExpense,
    required this.totalIncome,
    required this.netBalance,
    required this.budget,
    required this.categoryBreakdown,
    required this.topMerchants,
    required this.dailyExpenses,
  });

  factory AnalyticsSummaryModel.fromJson(Map<String, dynamic> json) {
    return AnalyticsSummaryModel(
      month: json['month'] ?? DateTime.now().month,
      year: json['year'] ?? DateTime.now().year,
      totalExpense: (json['totalExpense'] ?? 0).toDouble(),
      totalIncome: (json['totalIncome'] ?? 0).toDouble(),
      netBalance: (json['netBalance'] ?? 0).toDouble(),
      budget: BudgetSummary.fromJson(json['budget'] ?? {}),
      categoryBreakdown: (json['categoryBreakdown'] as List<dynamic>? ?? [])
          .map((e) => CategoryBreakdown.fromJson(e))
          .toList(),
      topMerchants: (json['topMerchants'] as List<dynamic>? ?? [])
          .map((e) => TopMerchant.fromJson(e))
          .toList(),
      dailyExpenses: (json['dailyExpenses'] as List<dynamic>? ?? [])
          .map((e) => DailyExpenseItem.fromJson(e))
          .toList(),
    );
  }
}
