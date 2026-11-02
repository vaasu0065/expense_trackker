import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/api/api_client.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/analytics_provider.dart';

void showBudgetSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => const BudgetSheet(),
  );
}

/// Edit the monthly income and budget cap for the month shown on the dashboard.
/// Uses the same endpoints as the web Budget card.
class BudgetSheet extends ConsumerStatefulWidget {
  const BudgetSheet({super.key});

  @override
  ConsumerState<BudgetSheet> createState() => _BudgetSheetState();
}

class _BudgetSheetState extends ConsumerState<BudgetSheet> {
  final _incomeCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  bool _isLoading = true;
  bool _isSaving = false;
  String? _incomeError;
  String? _budgetError;

  int get _month => ref.read(selectedMonthProvider);
  int get _year => ref.read(selectedYearProvider);

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _incomeCtrl.dispose();
    _budgetCtrl.dispose();
    super.dispose();
  }

  String _plain(dynamic value) {
    final n = double.tryParse(value?.toString() ?? '') ?? 0;
    if (n == 0) return '';
    return n == n.roundToDouble() ? n.toInt().toString() : n.toString();
  }

  Future<void> _load() async {
    try {
      final res = await ApiClient.instance.get('/expenses/budget', queryParameters: {'month': _month, 'year': _year});
      _incomeCtrl.text = _plain(res.data['income']);
      _budgetCtrl.text = _plain(res.data['budget']);
    } catch (_) {
      // Leave the fields empty; saving still works
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _save() async {
    final income = double.tryParse(_incomeCtrl.text.trim().isEmpty ? '0' : _incomeCtrl.text.trim());
    final budget = double.tryParse(_budgetCtrl.text.trim());
    setState(() {
      _incomeError = income == null || income < 0 ? 'Enter a valid amount' : null;
      _budgetError = budget == null || budget <= 0 ? 'Enter a budget greater than 0' : null;
    });
    if (_incomeError != null || _budgetError != null) return;

    setState(() => _isSaving = true);
    try {
      await ApiClient.instance.post('/expenses/budget', data: {
        'month': _month,
        'year': _year,
        'income': income,
        'budget': budget,
      });
      ref.invalidate(analyticsSummaryProvider);
      if (!mounted) return;
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Budget saved')));
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save the budget. Try again.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tt = context.text;
    final c = context.appColors;
    final monthLabel = DateFormat('MMMM yyyy').format(DateTime(_year, _month));

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Monthly budget', style: tt.titleLarge),
            const SizedBox(height: 4),
            Text(monthLabel, style: tt.bodyMedium?.copyWith(color: c.muted)),
            const SizedBox(height: 16),
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              )
            else ...[
              TextField(
                controller: _budgetCtrl,
                autofocus: _budgetCtrl.text.isEmpty,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textInputAction: TextInputAction.next,
                style: tt.titleLarge?.copyWith(fontFeatures: AppTheme.tabular),
                decoration: InputDecoration(
                  labelText: 'Spending budget',
                  helperText: 'The most you want to spend this month',
                  prefixText: '₹ ',
                  errorText: _budgetError,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _incomeCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _save(),
                style: tt.titleMedium?.copyWith(fontFeatures: AppTheme.tabular),
                decoration: InputDecoration(
                  labelText: 'Expected income (optional)',
                  prefixText: '₹ ',
                  errorText: _incomeError,
                ),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _isSaving ? null : _save,
                child: _isSaving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save budget'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
