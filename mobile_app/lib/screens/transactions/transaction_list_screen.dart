import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/transaction_provider.dart';
import '../../models/transaction_model.dart';
import '../../core/theme/app_theme.dart';

class TransactionListScreen extends ConsumerWidget {
  const TransactionListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transactionsAsync = ref.watch(transactionListProvider);
    final currentFilter = ref.watch(transactionFilterProvider);
    final searchCtrl = TextEditingController(text: ref.watch(transactionSearchProvider));

    final categories = ['All', 'Food', 'Grocery', 'Travel', 'Fuel', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Salary', 'Income', 'Other'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Transactions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: AppTheme.primaryAccent, size: 28),
            onPressed: () => _showAddModal(context),
          )
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: searchCtrl,
                    onSubmitted: (val) {
                      ref.read(transactionSearchProvider.notifier).state = val;
                      ref.read(transactionListProvider.notifier).fetchTransactions();
                    },
                    decoration: InputDecoration(
                      hintText: 'Search merchant, ref no...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      suffixIcon: searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                searchCtrl.clear();
                                ref.read(transactionSearchProvider.notifier).state = '';
                                ref.read(transactionListProvider.notifier).fetchTransactions();
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Theme.of(context).cardTheme.color,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Horizontal Category Pills
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: categories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final cat = categories[idx];
                final isSelected = currentFilter == cat;
                return ChoiceChip(
                  label: Text(cat, style: TextStyle(color: isSelected ? Colors.white : Colors.grey.shade400, fontWeight: FontWeight.bold, fontSize: 13)),
                  selected: isSelected,
                  selectedColor: AppTheme.primary,
                  backgroundColor: Theme.of(context).cardTheme.color,
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
          const SizedBox(height: 12),

          // Transaction List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                await ref.read(transactionListProvider.notifier).fetchTransactions();
              },
              child: transactionsAsync.when(
                data: (transactions) {
                  if (transactions.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Text(
                          'No transactions found for filter "$currentFilter".',
                          style: const TextStyle(color: Colors.grey),
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: transactions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, idx) {
                      final t = transactions[idx];
                      return Dismissible(
                        key: Key(t.id.isNotEmpty ? t.id : '${t.merchant}-${t.amount}-${idx}'),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          decoration: BoxDecoration(
                            color: AppTheme.rose,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.delete_rounded, color: Colors.white),
                        ),
                        onDismissed: (_) {
                          if (t.id.isNotEmpty) {
                            ref.read(transactionListProvider.notifier).deleteTransaction(t.id);
                          }
                        },
                        child: TransactionRowTile(transaction: t),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error loading transactions: $e')),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const AddTransactionModal(initialType: 'expense'),
    );
  }
}

class TransactionRowTile extends StatelessWidget {
  final TransactionModel transaction;
  const TransactionRowTile({super.key, required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction.transactionType == 'credit' || transaction.transactionType == 'income';
    final color = isCredit ? AppTheme.emerald : AppTheme.rose;

    // Source icon badge
    IconData sourceIcon = Icons.edit_note_rounded;
    Color badgeColor = Colors.grey;
    if (transaction.source == 'sms') {
      sourceIcon = Icons.sms_rounded;
      badgeColor = AppTheme.amber;
    } else if (transaction.source == 'gmail') {
      sourceIcon = Icons.mail_rounded;
      badgeColor = AppTheme.primaryAccent;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).cardTheme.color ?? const Color(0xFF131C31),
            (Theme.of(context).cardTheme.color ?? const Color(0xFF131C31)).withOpacity(0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left glowing accent strip
          Container(
            width: 4,
            height: 42,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
              boxShadow: [
                BoxShadow(color: color.withOpacity(0.5), blurRadius: 6),
              ],
            ),
          ),
          const SizedBox(width: 14),

          // Category Icon Circle
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
              color: color,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),

          // Merchant & Category details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        transaction.merchant,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.only(left: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.18),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: badgeColor.withOpacity(0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(sourceIcon, size: 12, color: badgeColor),
                          const SizedBox(width: 4),
                          Text(transaction.source.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor, letterSpacing: 0.5)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Row(
                  children: [
                    Text(
                      transaction.category,
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                    if (transaction.paymentMethod.isNotEmpty) ...[
                      Text(' • ', style: TextStyle(color: Colors.grey.shade600)),
                      Text(
                        '${transaction.paymentMethod} ${transaction.accountMasked}'.trim(),
                        style: TextStyle(color: AppTheme.primaryAccent.withOpacity(0.9), fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Amount & Date
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isCredit ? "+" : "-"}₹${NumberFormat('#,##0.00').format(transaction.amount)}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                DateFormat('dd MMM, hh:mm a').format(transaction.transactionDate),
                style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
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

  final _expenseCategories = ['Food', 'Grocery', 'Travel', 'Fuel', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Other'];
  final _incomeCategories = ['Salary', 'Income', 'Investment', 'Other'];

  @override
  void initState() {
    super.initState();
    _type = widget.initialType;
    if (_type == 'income') _category = 'Salary';
  }

  Future<void> _submit() async {
    final amt = double.tryParse(_amountCtrl.text.trim()) ?? 0;
    if (amt <= 0 || _merchantCtrl.text.trim().isEmpty) return;

    setState(() => _isSaving = true);
    final success = await ref.read(transactionListProvider.notifier).addTransaction(
      amount: amt,
      merchant: _merchantCtrl.text.trim(),
      category: _category,
      transactionType: _type,
      paymentMethod: _paymentMethod,
    );

    setState(() => _isSaving = false);
    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = _type == 'expense' ? _expenseCategories : _incomeCategories;

    return Container(
      padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(context).viewInsets.bottom + 24),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Modal Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey.withOpacity(0.3), borderRadius: BorderRadius.circular(4)),
              ),
            ),
            const SizedBox(height: 20),
            const Text('Add Manual Transaction', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 20),

            // Type Segment Pill
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Center(child: Text('Debit (-)', style: TextStyle(fontWeight: FontWeight.bold))),
                    selected: _type == 'expense',
                    selectedColor: AppTheme.rose,
                    onSelected: (s) {
                      if (s) setState(() { _type = 'expense'; _category = 'Food'; });
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ChoiceChip(
                    label: const Center(child: Text('Credit (+)', style: TextStyle(fontWeight: FontWeight.bold))),
                    selected: _type == 'income',
                    selectedColor: AppTheme.emerald,
                    onSelected: (s) {
                      if (s) setState(() { _type = 'income'; _category = 'Salary'; });
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            TextField(
              controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                labelText: 'Amount (₹)',
                prefixIcon: const Icon(Icons.currency_rupee, color: AppTheme.primaryAccent),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 16),

            TextField(
              controller: _merchantCtrl,
              decoration: InputDecoration(
                labelText: 'Merchant / Payee Name',
                hintText: 'e.g. Swiggy, Uber, Salary',
                prefixIcon: const Icon(Icons.storefront_rounded, color: AppTheme.primaryAccent),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
            const SizedBox(height: 16),

            // Category Dropdown
            DropdownButtonFormField<String>(
              value: _category,
              decoration: InputDecoration(
                labelText: 'Category',
                prefixIcon: const Icon(Icons.category_rounded, color: AppTheme.primaryAccent),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
              items: categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _category = val);
              },
            ),
            const SizedBox(height: 16),

            // Payment Method Dropdown
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              decoration: InputDecoration(
                labelText: 'Payment Method',
                prefixIcon: const Icon(Icons.account_balance_wallet_rounded, color: AppTheme.primaryAccent),
                filled: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
              ),
              items: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash']
                  .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                  .toList(),
              onChanged: (val) {
                if (val != null) setState(() => _paymentMethod = val);
              },
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _isSaving ? null : _submit,
              child: _isSaving ? const CircularProgressIndicator(color: Colors.white) : const Text('Save Transaction'),
            ),
          ],
        ),
      ),
    );
  }
}
