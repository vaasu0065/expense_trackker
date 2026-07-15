import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../models/analytics_model.dart';

final selectedMonthProvider = StateProvider<int>((ref) => DateTime.now().month);
final selectedYearProvider = StateProvider<int>((ref) => DateTime.now().year);

final analyticsSummaryProvider = FutureProvider<AnalyticsSummaryModel?>((ref) async {
  final month = ref.watch(selectedMonthProvider);
  final year = ref.watch(selectedYearProvider);

  try {
    final budgetRes = await ApiClient.instance.get('/expenses/budget', queryParameters: {
      'month': month,
      'year': year,
    });
    final monthlyRes = await ApiClient.instance.get('/expenses/monthly', queryParameters: {
      'month': month,
    });
    
    double importedSpent = 0.0;
    double importedIncome = 0.0;
    try {
      final impRes = await ApiClient.instance.get('/expenses/transactions', queryParameters: {
        'month': month,
        'year': year,
      });
      if (impRes.statusCode == 200 && impRes.data != null) {
        final sumData = impRes.data['summary'];
        if (sumData != null) {
          importedIncome = double.tryParse(sumData['total_credit']?.toString() ?? '0') ?? 0.0;
          importedSpent = double.tryParse(sumData['total_debit']?.toString() ?? '0') ?? 0.0;
        }
      }
    } catch (_) {}

    final summaryRes = await ApiClient.instance.get('/expenses/summary');
    double allTimeTotal = 0.0;
    int totalCount = 0;
    if (summaryRes.statusCode == 200 && summaryRes.data != null) {
      allTimeTotal = double.tryParse(summaryRes.data['total']?.toString() ?? '0') ?? 0.0;
      totalCount = int.tryParse(summaryRes.data['count']?.toString() ?? '0') ?? 0;
    }

    if (budgetRes.statusCode == 200 && budgetRes.data != null) {
      final bData = budgetRes.data;
      final manualSpent = double.tryParse(bData['spent']?.toString() ?? '0') ?? 0.0;
      final manualIncome = double.tryParse(bData['income']?.toString() ?? '0') ?? 0.0;
      final budgetLimit = double.tryParse(bData['budget']?.toString() ?? '0') ?? 0.0;
      
      final monthSpent = manualSpent + importedSpent;
      final totalIncome = manualIncome + importedIncome;
      final remaining = budgetLimit > 0 ? (budgetLimit - monthSpent) : 0.0;
      final pct = budgetLimit > 0 ? ((monthSpent / budgetLimit) * 100).round() : 0;

      final categoryBreakdown = <CategoryBreakdown>[];
      if (monthlyRes.statusCode == 200 && monthlyRes.data is List) {
        for (final row in monthlyRes.data as List<dynamic>) {
          final cat = row['category'] ?? 'Other';
          final total = double.tryParse(row['total']?.toString() ?? '0') ?? 0.0;
          categoryBreakdown.add(CategoryBreakdown(
            category: cat,
            total: total,
            count: 1,
          ));
        }
      }

      return AnalyticsSummaryModel(
        month: month,
        year: year,
        totalIncome: totalIncome, // Credited Income exactly like website
        totalExpense: monthSpent, // Current Month Burn exactly like website
        netBalance: allTimeTotal, // All-time spent exactly like website
        budget: BudgetSummary(
          limit: budgetLimit, // Exactly what user set (0 if not set)
          spent: monthSpent,
          remaining: remaining,
          percentage: pct,
        ),
        categoryBreakdown: categoryBreakdown,
        topMerchants: [],
        dailyExpenses: [],
      );
    }
  } catch (e) {
    print('Fetch Analytics Error: $e');
  }
  return null;
});
