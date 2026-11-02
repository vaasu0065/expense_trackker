import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/transaction_provider.dart';
import '../../models/transaction_model.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/format.dart';

const transactionCategories = [
  'All', 'Food', 'Grocery', 'Travel', 'Fuel', 'Shopping', 'Entertainment',
  'Healthcare', 'Bills', 'Salary', 'Income', 'Other',
];

IconData categoryIcon(String category) {
  switch (category.toLowerCase()) {
    case 'food':
      return LucideIcons.utensils;
    case 'grocery':
      return LucideIcons.shoppingCart;
    case 'travel':
      return LucideIcons.car;
    case 'fuel':
      return LucideIcons.fuel;
    case 'shopping':
      return LucideIcons.shoppingBag;
    case 'entertainment':
      return LucideIcons.film;
    case 'health':
    case 'healthcare':
      return LucideIcons.heartPulse;
    case 'bills':
      return LucideIcons.zap;
    case 'education':
      return LucideIcons.graduationCap;
    case 'salary':
    case 'income':
      return LucideIcons.wallet;
    case 'investment':
      return LucideIcons.trendingUp;
    default:
      return LucideIcons.tag;
  }
}

void showAddTransactionSheet(BuildContext context, {String type = 'expense'}) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => AddTransactionModal(initialType: type),
  );
}

class TransactionListScreen extends ConsumerStatefulWidget {
  const TransactionListScreen({super.key});

  @override
  ConsumerState<TransactionListScreen> createState() => _TransactionListScreenState();
}

class _TransactionListScreenState extends ConsumerState<TransactionListScreen> {
  late final TextEditingController _searchCtrl;

  @override
  void initState() {
    super.initState();
    _searchCtrl = TextEditingController(text: ref.read(transactionSearchProvider));
    _searchCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _search(String value) {
    ref.read(transactionSearchProvider.notifier).state = value;
    ref.read(transactionListProvider.notifier).fetchTransactions();
  }

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(transactionListProvider);
    final currentFilter = ref.watch(transactionFilterProvider);
    final c = context.appColors;
    final cs = context.colors;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus),
            tooltip: 'Add transaction',
            onPressed: () => showAddTransactionSheet(context),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              controller: _searchCtrl,
              textInputAction: TextInputAction.search,
              onSubmitted: _search,
              decoration: InputDecoration(
                hintText: 'Search merchant or category',
                prefixIcon: const Icon(LucideIcons.search, size: 18),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(LucideIcons.x, size: 18),
                        tooltip: 'Clear search',
                        onPressed: () {
                          _searchCtrl.clear();
                          _search('');
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Category filter
          SizedBox(
            height: 52,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: transactionCategories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final cat = transactionCategories[idx];
                final isSelected = currentFilter == cat;
                return ChoiceChip(
                  label: Text(cat),
                  labelStyle: TextStyle(
                    color: isSelected ? cs.onPrimary : cs.onSurface,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                  selected: isSelected,
                  side: isSelected ? BorderSide.none : null,
                  onSelected: (selected) {
                    if (selected) {
                      ref.read(transactionFilterProvider.notifier).state = cat;
                      ref.read(transactionListProvider.notifier).fetchTransactions();
                    }
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 4),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(transactionListProvider.notifier).fetchTransactions(),
              child: transactionsAsync.when(
                data: (transactions) {
                  if (transactions.isEmpty) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        EmptyState(
                          icon: LucideIcons.inbox,
                          message: currentFilter == 'All'
                              ? 'No transactions found.'
                              : 'No transactions in "$currentFilter".',
                        ),
                      ],
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: transactions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, idx) {
                      final t = transactions[idx];
                      // Imported rows live in another table; they can't be deleted here.
                      if (t.isImported) {
                        return TransactionRowTile(transaction: t, framed: true);
                      }
                      return Dismissible(
                        key: Key(t.id.isNotEmpty ? 'expense-${t.id}' : '${t.merchant}-${t.amount}-$idx'),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          decoration: BoxDecoration(
                            color: c.expenseFill,
                            borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(LucideIcons.trash2, color: Colors.white, size: 18),
                              SizedBox(width: 8),
                              Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ),
                        onDismissed: (_) {
                          if (t.id.isNotEmpty) {
                            ref.read(transactionListProvider.notifier).deleteTransaction(t.id);
                          }
                        },
                        child: TransactionRowTile(transaction: t, framed: true),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(
                  children: [EmptyState(icon: LucideIcons.alertCircle, message: 'Could not load transactions.\n$e')],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  const EmptyState({super.key, required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Column(
        children: [
          Icon(icon, size: 32, color: c.muted),
          const SizedBox(height: 12),
          Text(message, textAlign: TextAlign.center, style: context.text.bodyMedium?.copyWith(color: c.muted)),
        ],
      ),
    );
  }
}

/// One ledger row: category icon, merchant, category + date/time, signed amount, source.
class TransactionRowTile extends StatelessWidget {
  final TransactionModel transaction;

  /// When true the row draws its own card (used in the full list);
  /// otherwise it sits inside a parent card (dashboard).
  final bool framed;

  const TransactionRowTile({super.key, required this.transaction, this.framed = false});

  static String sourceLabel(TransactionModel t) {
    final s = t.source.toLowerCase();
    if (s == 'sms') return 'SMS';
    if (s == 'gmail') return 'Gmail';
    // Income added in the app is stored as a credit with no source text
    if (t.isImported) return s.isEmpty ? 'Manual' : 'Imported';
    return 'Manual';
  }

  @override
  Widget build(BuildContext context) {
    final t = transaction;
    final c = context.appColors;
    final cs = context.colors;
    final tt = context.text;
    final isCredit = t.transactionType == 'credit' || t.transactionType == 'income';
    final amountColor = isCredit ? c.income : c.expense;
    final when = formatTxnDate(t.transactionDate, hasTime: t.hasTime);
    final source = sourceLabel(t);
    final amount = formatSignedInr(t.amount, isCredit: isCredit);
    final meta = [
      t.category,
      when,
      if (t.paymentMethod.isNotEmpty) '${t.paymentMethod} ${t.accountMasked}'.trim(),
    ].join(' · ');

    final row = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: c.raised,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: c.border),
            ),
            child: Icon(categoryIcon(t.category), size: 18, color: c.muted),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.merchant, maxLines: 1, overflow: TextOverflow.ellipsis, style: tt.bodyLarge),
                const SizedBox(height: 2),
                Text(meta, maxLines: 1, overflow: TextOverflow.ellipsis, style: tt.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: tt.titleSmall?.copyWith(
                  fontSize: 15,
                  color: amountColor,
                  fontFeatures: AppTheme.tabular,
                ),
              ),
              const SizedBox(height: 2),
              Text(source, style: tt.labelSmall),
            ],
          ),
        ],
      ),
    );

    final content = MergeSemantics(
      child: Semantics(
        label: '${t.merchant}, ${isCredit ? 'income' : 'expense'} $amount, ${t.category}, $when, $source',
        excludeSemantics: true,
        child: row,
      ),
    );

    if (!framed) return content;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusControl),
        border: Border.all(color: c.border),
      ),
      child: content,
    );
  }
}

class AddTransactionModal extends ConsumerStatefulWidget {
  final String initialType;
  const AddTransactionModal({super.key, this.initialType = 'expense'});

  @override
  ConsumerState<AddTransactionModal> createState() => _AddTransactionModalState();
}

class _AddTransactionModalState extends ConsumerState<AddTransactionModal> {
  final _amountCtrl = TextEditingController();
  final _merchantCtrl = TextEditingController();
  late String _type;
  String _category = 'Food';
  String _paymentMethod = 'UPI';
  bool _isSaving = false;
  String? _amountError;
  String? _merchantError;

  final _expenseCategories = ['Food', 'Grocery', 'Travel', 'Fuel', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Other'];
  final _incomeCategories = ['Salary', 'Income', 'Investment', 'Other'];

  @override
  void initState() {
    super.initState();
    _type = widget.initialType;
    if (_type == 'income') _category = 'Salary';
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _merchantCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final amt = double.tryParse(_amountCtrl.text.trim()) ?? 0;
    final merchant = _merchantCtrl.text.trim();
    setState(() {
      _amountError = amt <= 0 ? 'Enter an amount greater than 0' : null;
      _merchantError = merchant.isEmpty ? 'Enter a merchant or payee' : null;
    });
    if (amt <= 0 || merchant.isEmpty) return;

    setState(() => _isSaving = true);
    final success = await ref.read(transactionListProvider.notifier).addTransaction(
          amount: amt,
          merchant: merchant,
          category: _category,
          transactionType: _type,
          paymentMethod: _paymentMethod,
        );

    if (!mounted) return;
    setState(() => _isSaving = false);
    if (success) {
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not save the transaction. Try again.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final tt = context.text;
    final categories = _type == 'expense' ? _expenseCategories : _incomeCategories;
    final typeColor = _type == 'expense' ? c.expense : c.income;

    return Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 20),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Add transaction', style: tt.titleLarge),
            const SizedBox(height: 16),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'expense', label: Text('Expense'), icon: Icon(LucideIcons.arrowUpRight, size: 18)),
                ButtonSegment(value: 'income', label: Text('Income'), icon: Icon(LucideIcons.arrowDownLeft, size: 18)),
              ],
              selected: {_type},
              showSelectedIcon: false,
              style: SegmentedButton.styleFrom(
                selectedBackgroundColor: typeColor.withValues(alpha: 0.16),
                selectedForegroundColor: typeColor,
              ),
              onSelectionChanged: (s) => setState(() {
                _type = s.first;
                _category = _type == 'expense' ? 'Food' : 'Salary';
              }),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textInputAction: TextInputAction.next,
              style: tt.titleLarge?.copyWith(fontFeatures: AppTheme.tabular),
              decoration: InputDecoration(
                labelText: 'Amount',
                prefixText: '₹ ',
                errorText: _amountError,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _merchantCtrl,
              textInputAction: TextInputAction.done,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                labelText: 'Merchant or payee',
                hintText: 'e.g. Swiggy, Uber, Salary',
                errorText: _merchantError,
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              key: ValueKey('category-$_type'),
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _category = val);
              },
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _paymentMethod,
              decoration: const InputDecoration(labelText: 'Payment method'),
              items: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash']
                  .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                  .toList(),
              onChanged: (val) {
                if (val != null) setState(() => _paymentMethod = val);
              },
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _isSaving ? null : _submit,
              child: _isSaving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save transaction'),
            ),
          ],
        ),
      ),
    );
  }
}
