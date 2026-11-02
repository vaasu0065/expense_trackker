import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../models/analytics_model.dart';
import '../../providers/analytics_provider.dart';
import '../../providers/transaction_provider.dart';
import '../../providers/settings_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/format.dart';
import '../transactions/transaction_list_screen.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  void _refresh(WidgetRef ref) {
    ref.invalidate(analyticsSummaryProvider);
    ref.read(transactionListProvider.notifier).fetchTransactions();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(analyticsSummaryProvider);
    final transactionsAsync = ref.watch(transactionListProvider);
    final smsEnabled = ref.watch(smsTrackingProvider);
    final c = context.appColors;
    final tt = context.text;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          _SmsStatusPill(enabled: smsEnabled),
          IconButton(
            onPressed: () => _refresh(ref),
            icon: const Icon(LucideIcons.refreshCw, size: 20),
            tooltip: 'Refresh data',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _refresh(ref),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            analyticsAsync.when(
              data: (summary) => _MonthSummaryCard(summary: summary),
              loading: () => const Card(
                child: SizedBox(height: 228, child: Center(child: CircularProgressIndicator())),
              ),
              error: (e, _) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Could not load this month\'s summary.\n$e', style: tt.bodySmall),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: _ActionButton(
                    label: 'Add expense',
                    icon: LucideIcons.minus,
                    color: c.expense,
                    onTap: () => showAddTransactionSheet(context, type: 'expense'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionButton(
                    label: 'Add income',
                    icon: LucideIcons.plus,
                    color: c.income,
                    onTap: () => showAddTransactionSheet(context, type: 'income'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: [
                ActionChip(
                  avatar: Icon(LucideIcons.barChart3, size: 16, color: c.brandText),
                  label: const Text('Analytics'),
                  labelPadding: const EdgeInsets.only(left: 4, right: 6),
                  onPressed: () => context.go('/analytics'),
                ),
                ActionChip(
                  avatar: Icon(LucideIcons.wallet, size: 16, color: c.warning),
                  label: const Text('Budget'),
                  labelPadding: const EdgeInsets.only(left: 4, right: 6),
                  onPressed: () => context.go('/settings'),
                ),
                ActionChip(
                  avatar: Icon(LucideIcons.receipt, size: 16, color: c.muted),
                  label: Text('Transactions (${transactionsAsync.value?.length ?? 0})'),
                  labelPadding: const EdgeInsets.only(left: 4, right: 6),
                  onPressed: () => context.go('/transactions'),
                ),
              ],
            ),
            const SizedBox(height: 20),

            Row(
              children: [
                Expanded(child: Text('Recent transactions', style: tt.titleMedium)),
                TextButton(
                  onPressed: () => context.go('/transactions'),
                  child: const Text('View all'),
                ),
              ],
            ),
            const SizedBox(height: 4),

            transactionsAsync.when(
              data: (transactions) {
                if (transactions.isEmpty) {
                  return const Card(
                    child: EmptyState(
                      icon: LucideIcons.inbox,
                      message: 'No transactions yet. Add one manually, or let SMS tracking pick them up.',
                    ),
                  );
                }
                final recent = transactions.take(10).toList();
                return Card(
                  child: Column(
                    children: [
                      for (var i = 0; i < recent.length; i++) ...[
                        if (i > 0) const Divider(indent: 66),
                        TransactionRowTile(transaction: recent[i]),
                      ],
                    ],
                  ),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (e, _) => Card(
                child: EmptyState(icon: LucideIcons.alertCircle, message: 'Could not load transactions.\n$e'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MonthSummaryCard extends StatelessWidget {
  final AnalyticsSummaryModel? summary;
  const _MonthSummaryCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final tt = context.text;
    final now = DateTime.now();
    final s = summary;
    final monthLabel = DateFormat('MMMM yyyy').format(DateTime(s?.year ?? now.year, s?.month ?? now.month));
    final spent = s?.totalExpense ?? 0;
    final income = s?.totalIncome ?? 0;
    final allTime = s?.netBalance ?? 0;
    final budget = s?.budget;
    final hasBudget = budget != null && budget.limit > 0;

    final pct = hasBudget ? budget.percentage : 0;
    final barColor = pct > 100 ? c.expenseFill : (pct >= 80 ? c.warning : AppTheme.primary);
    final pctColor = pct > 100 ? c.expense : (pct >= 80 ? c.warning : c.muted);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('SPENT IN ${monthLabel.toUpperCase()}', style: tt.labelSmall?.copyWith(letterSpacing: 0.8)),
            const SizedBox(height: 6),
            Text(
              formatInr(spent),
              style: tt.headlineMedium?.copyWith(
                fontSize: 32,
                fontWeight: FontWeight.w600,
                fontFeatures: AppTheme.tabular,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 4),
            if (hasBudget) ...[
              Text('of ${formatInr(budget.limit)} monthly budget', style: tt.bodySmall),
              const SizedBox(height: 14),
              Semantics(
                label: 'Budget used',
                value: '$pct percent',
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: (pct / 100).clamp(0.0, 1.0),
                    minHeight: 8,
                    color: barColor,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text('$pct% used',
                      style: tt.labelMedium?.copyWith(color: pctColor, fontFeatures: AppTheme.tabular)),
                  const Spacer(),
                  Text(
                    budget.remaining >= 0
                        ? '${formatInr(budget.remaining)} left'
                        : '${formatInr(-budget.remaining)} over budget',
                    style: tt.labelMedium?.copyWith(
                      color: budget.remaining >= 0 ? c.muted : c.expense,
                      fontFeatures: AppTheme.tabular,
                    ),
                  ),
                ],
              ),
            ] else
              Row(
                children: [
                  Expanded(child: Text('No monthly budget set', style: tt.bodySmall)),
                  TextButton(onPressed: () => context.go('/settings'), child: const Text('Set budget')),
                ],
              ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: _Metric(
                      label: 'Income credited',
                      value: formatInr(income),
                      valueColor: c.income,
                      icon: LucideIcons.arrowDownLeft,
                    ),
                  ),
                  const VerticalDivider(width: 24),
                  Expanded(
                    child: _Metric(
                      label: 'All-time spent',
                      value: formatInr(allTime),
                      valueColor: context.colors.onSurface,
                      icon: LucideIcons.arrowUpRight,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;
  final Color valueColor;
  final IconData icon;

  const _Metric({required this.label, required this.value, required this.valueColor, required this.icon});

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final tt = context.text;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: c.muted),
            const SizedBox(width: 4),
            Flexible(child: Text(label, style: tt.labelMedium, overflow: TextOverflow.ellipsis)),
          ],
        ),
        const SizedBox(height: 4),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Text(
            value,
            style: tt.titleMedium?.copyWith(fontSize: 18, color: valueColor, fontFeatures: AppTheme.tabular),
          ),
        ),
      ],
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({required this.label, required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      label: Text(label, maxLines: 1),
      style: OutlinedButton.styleFrom(
        foregroundColor: color,
        backgroundColor: color.withValues(alpha: 0.10),
        side: BorderSide(color: color.withValues(alpha: 0.35)),
        padding: const EdgeInsets.symmetric(horizontal: 12),
      ),
    );
  }
}

class _SmsStatusPill extends StatelessWidget {
  final bool enabled;
  const _SmsStatusPill({required this.enabled});

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final color = enabled ? c.income : c.muted;
    return Semantics(
      label: enabled ? 'SMS auto-tracking is on' : 'SMS auto-tracking is off',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(LucideIcons.messageSquare, size: 14, color: color),
            const SizedBox(width: 6),
            Text(
              enabled ? 'SMS on' : 'SMS off',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
