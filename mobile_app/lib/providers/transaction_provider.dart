import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api/api_client.dart';
import '../models/transaction_model.dart';
import 'analytics_provider.dart';

final transactionFilterProvider = StateProvider<String>((ref) => 'All');
final transactionSearchProvider = StateProvider<String>((ref) => '');

final transactionListProvider = StateNotifierProvider<TransactionNotifier, AsyncValue<List<TransactionModel>>>((ref) {
  return TransactionNotifier(ref);
});

class TransactionNotifier extends StateNotifier<AsyncValue<List<TransactionModel>>> {
  final Ref _ref;

  TransactionNotifier(this._ref) : super(const AsyncValue.loading()) {
    fetchTransactions();
  }

  Future<void> fetchTransactions({String? category, String? search}) async {
    state = const AsyncValue.loading();
    try {
      final cat = category ?? _ref.read(transactionFilterProvider);
      final query = search ?? _ref.read(transactionSearchProvider);

      final queryParams = <String, dynamic>{};
      if (cat != null && cat != 'All') queryParams['category'] = cat;

      final endpoint = (cat != null && cat != 'All') ? '/expenses/filter' : '/expenses';
      final res = await ApiClient.instance.get(endpoint, queryParameters: queryParams);
      
      List<TransactionModel> combinedList = [];
      if (res.statusCode == 200 && res.data != null) {
        final rawList = res.data is List ? res.data as List<dynamic> : (res.data['data'] ?? res.data['transactions'] ?? []);
        combinedList.addAll((rawList as List<dynamic>).map((e) => TransactionModel.fromJson(e)));
      }

      // Also fetch imported transactions from Supabase (SMS / Gmail / Bank imports)
      try {
        final now = DateTime.now();
        final importedRes = await ApiClient.instance.get('/expenses/transactions', queryParameters: {
          'month': now.month,
          'year': now.year,
        });
        if (importedRes.statusCode == 200 && importedRes.data != null) {
          final impList = importedRes.data['transactions'];
          if (impList is List) {
            combinedList.addAll(impList.map((e) => TransactionModel.fromJson(e)));
          }
        }
      } catch (_) {}

      // Filter category if not All
      if (cat != null && cat != 'All') {
        combinedList = combinedList.where((t) => t.category.toLowerCase() == cat.toLowerCase()).toList();
      }

      // Local search filter
      if (query != null && query.isNotEmpty) {
        combinedList = combinedList.where((t) =>
          t.merchant.toLowerCase().contains(query.toLowerCase()) ||
          t.category.toLowerCase().contains(query.toLowerCase())
        ).toList();
      }

      // Sort newest first
      combinedList.sort((a, b) => b.transactionDate.compareTo(a.transactionDate));

      state = AsyncValue.data(combinedList);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<bool> addTransaction({
    required double amount,
    required String merchant,
    required String category,
    required String transactionType,
    required String paymentMethod,
    DateTime? date,
  }) async {
    try {
      final res = await ApiClient.instance.post('/expenses/add', data: {
        'title': merchant,
        'amount': amount,
        'category': category,
        'date': (date ?? DateTime.now()).toIso8601String().split('T')[0],
        'time': '${(date ?? DateTime.now()).hour}:${(date ?? DateTime.now()).minute.toString().padLeft(2, '0')}',
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        await fetchTransactions();
        _ref.invalidate(analyticsSummaryProvider);
        return true;
      }
    } catch (e) {
      print('Add Transaction Error: $e');
    }
    return false;
  }

  Future<bool> deleteTransaction(String id) async {
    try {
      final res = await ApiClient.instance.delete('/expenses/$id');
      if (res.statusCode == 200 || res.statusCode == 204) {
        state = state.whenData((list) => list.where((t) => t.id != id).toList());
        _ref.invalidate(analyticsSummaryProvider);
        return true;
      }
    } catch (e) {
      print('Delete Transaction Error: $e');
    }
    return false;
  }
}
