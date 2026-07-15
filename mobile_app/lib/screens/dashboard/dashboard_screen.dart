import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/analytics_provider.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/settings_provider.dart';
import '../../core/theme/app_theme.dart';
import '../transactions/transaction_list_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(analyticsSummaryProvider);
    final transactionsAsync = ref.watch(transactionListProvider);
    final smsEnabled = ref.watch(smsTrackingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          // Refresh / Sync button
          IconButton(
            onPressed: () {
              ref.invalidate(analyticsSummaryProvider);
              ref.read(transactionListProvider.notifier).fetchTransactions();
            },
            icon: const Icon(Icons.sync_rounded, color: AppTheme.primaryAccent),
            tooltip: 'Sync Data',
          ),
          // SMS Tracking Active Indicator Pill
          Container(
            margin: const EdgeInsets.only(right: 16, top: 10, bottom: 10),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: (smsEnabled ? AppTheme.emerald : AppTheme.rose).withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: (smsEnabled ? AppTheme.emerald : AppTheme.rose).withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: smsEnabled ? AppTheme.emerald : AppTheme.rose,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  smsEnabled ? 'SMS Auto-Track: ON' : 'SMS Track: OFF',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: smsEnabled ? AppTheme.emerald : AppTheme.rose,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(analyticsSummaryProvider);
          ref.read(transactionListProvider.notifier).fetchTransactions();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Summary Card
              analyticsAsync.when(
                data: (summary) {
                  final net = summary?.netBalance ?? 0;
                  final income = summary?.totalIncome ?? 0;
                  final expense = summary?.totalExpense ?? 0;
                  final budget = summary?.budget;

                  return Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Color(0xFF311B92),
                          Color(0xFF1E1B4B),
                          Color(0xFF0F172A),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.primaryAccent.withOpacity(0.4), width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryAccent.withOpacity(0.15),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('ALL-TIME EXPENSES', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70, letterSpacing: 1.2)),
                        const SizedBox(height: 6),
                        Text(
                          '₹${NumberFormat('#,##0.00').format(net)}',
                          style: const TextStyle(
                            fontSize: 34,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 18),

                        Row(
                          children: [
                            Expanded(
                              child: _StatBadge(
                                label: 'CREDITED INCOME',
                                amount: income,
                                color: AppTheme.emerald,
                                icon: Icons.arrow_downward_rounded,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _StatBadge(
                                label: 'MONTH BURN',
                                amount: expense,
                                color: AppTheme.amber,
                                icon: Icons.calendar_today_rounded,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Monthly Budget Progress Bar
                        if (budget != null && (budget.limit > 0 || budget.spent > 0)) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Budget Target: ₹${NumberFormat('#,##0').format(budget.limit)}', style: const TextStyle(fontSize: 12, color: Colors.white70)),
                              Text('${budget.percentage}% Used', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: budget.percentage > 90 ? AppTheme.rose : AppTheme.emerald)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: (budget.percentage / 100).clamp(0.0, 1.0),
                              minHeight: 8,
                              backgroundColor: Colors.white.withOpacity(0.1),
                              valueColor: AlwaysStoppedAnimation(
                                budget.percentage > 90 ? AppTheme.rose : (budget.percentage > 75 ? AppTheme.amber : AppTheme.emerald),
                              ),
                            ),
                          ),
                        ] else ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Budget Target: Not Set', style: TextStyle(fontSize: 12, color: Colors.white70)),
                              TextButton(
                                onPressed: () => context.go('/settings'),
                                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 0), tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                child: const Text('Configure ->', style: TextStyle(fontSize: 12, color: AppTheme.primaryAccent, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                    );
                  },
                loading: () => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator())),
                error: (e, _) => Center(child: Text('Error loading dashboard stats: $e')),
              ),
              const SizedBox(height: 20),

              // Quick Actions Bar (Glowing Gradient Cards)
              Row(
                children: [
                  Expanded(
                    child: _ActionGradientCard(
                      title: 'Add Expense',
                      subtitle: 'Manual debit entry',
                      icon: Icons.remove_circle_outline_rounded,
                      gradientColors: const [Color(0xFFF43F5E), Color(0xFFBE123C)],
                      onTap: () => _showAddTransactionModal(context, ref, type: 'expense'),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _ActionGradientCard(
                      title: 'Add Income',
                      subtitle: 'Record credit log',
                      icon: Icons.add_circle_outline_rounded,
                      gradientColors: const [Color(0xFF10B981), Color(0xFF047857)],
                      onTap: () => _showAddTransactionModal(context, ref, type: 'income'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Quick Feature Navigation Pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _FeatureNavPill(
                      label: 'Analytics & Trends',
                      icon: Icons.analytics_outlined,
                      color: AppTheme.primaryAccent,
                      onTap: () => context.go('/analytics'),
                    ),
                    const SizedBox(width: 10),
                    _FeatureNavPill(
                      label: 'Budget Settings',
                      icon: Icons.account_balance_wallet_outlined,
                      color: AppTheme.amber,
                      onTap: () => context.go('/settings'),
                    ),
                    const SizedBox(width: 10),
                    _FeatureNavPill(
                      label: 'All Transactions (${transactionsAsync.value?.length ?? 0})',
                      icon: Icons.receipt_long_outlined,
                      color: AppTheme.emerald,
                      onTap: () => context.go('/transactions'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Recent Transactions Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Recent Transactions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                  TextButton(
                    onPressed: () => context.go('/transactions'),
                    child: const Text('View All ->', style: TextStyle(color: AppTheme.primaryAccent, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),

              // Transactions Ledger List
              transactionsAsync.when(
                data: (transactions) {
                  if (transactions.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Column(
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade600),
                            const SizedBox(height: 12),
                            const Text('No transactions yet. Add manual or let Android SMS detect automatically!', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
                          ],
                        ),
                      ),
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: transactions.take(10).length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final t = transactions[index];
                      return TransactionRowTile(transaction: t);
                    },
                  );
                },
                loading: () => const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddTransactionModal(BuildContext context, WidgetRef ref, {required String type}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddTransactionModal(initialType: type),
    );
  }
}

class _StatBadge extends StatelessWidget {
  final String label;
  final double amount;
  final Color color;
  final IconData icon;

  const _StatBadge({required this.label, required this.amount, required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: color.withOpacity(0.2), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold)),
                Text(
                  '₹${NumberFormat('#,##0').format(amount)}',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionGradientCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const _ActionGradientCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: gradientColors,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: gradientColors.first.withOpacity(0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: Colors.white.withOpacity(0.2), width: 1),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.8)), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FeatureNavPill extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _FeatureNavPill({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(30),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
            ],
          ),
        ),
      ),
    );
  }
}
