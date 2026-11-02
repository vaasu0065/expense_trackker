import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/analytics_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/format.dart';
import '../../models/analytics_model.dart';
import '../transactions/transaction_list_screen.dart' show EmptyState;

const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const _monthsLong = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  final _monthScroll = ScrollController();

  @override
  void initState() {
    super.initState();
    // Bring the selected month chip into view.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_monthScroll.hasClients) return;
      final m = ref.read(selectedMonthProvider);
      final target = ((m - 3) * 68.0).clamp(0.0, _monthScroll.position.maxScrollExtent);
      _monthScroll.jumpTo(target);
    });
  }

  @override
  void dispose() {
    _monthScroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final analyticsAsync = ref.watch(analyticsSummaryProvider);
    final selectedMonth = ref.watch(selectedMonthProvider);
    final selectedYear = ref.watch(selectedYearProvider);
    final cs = context.colors;

    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView.separated(
              controller: _monthScroll,
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 12,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final m = idx + 1;
                final isSelected = selectedMonth == m;
                return ChoiceChip(
                  label: Text(_months[idx], semanticsLabel: '${_monthsLong[idx]} $selectedYear'),
                  labelStyle: TextStyle(
                    color: isSelected ? cs.onPrimary : cs.onSurface,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                  ),
                  side: isSelected ? BorderSide.none : null,
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) ref.read(selectedMonthProvider.notifier).state = m;
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(analyticsSummaryProvider),
              child: analyticsAsync.when(
                data: (summary) {
                  if (summary == null || (summary.totalExpense == 0 && summary.totalIncome == 0)) {
                    return ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        EmptyState(
                          icon: LucideIcons.pieChart,
                          message: 'No data for ${_monthsLong[selectedMonth - 1]} ${summary?.year ?? selectedYear}.',
                        ),
                      ],
                    );
                  }
                  return _AnalyticsBody(summary: summary);
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => ListView(
                  children: [EmptyState(icon: LucideIcons.alertCircle, message: 'Could not load analytics.\n$e')],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AnalyticsBody extends StatelessWidget {
  final AnalyticsSummaryModel summary;
  const _AnalyticsBody({required this.summary});

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final breakdown = [...summary.categoryBreakdown]..sort((a, b) => b.total.compareTo(a.total));
    // Denominator for shares: the category totals themselves, so slices always add to 100%.
    final categoryTotal = breakdown.fold<double>(0, (s, e) => s + e.total);

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Row(
          children: [
            Expanded(child: _KpiTile(label: 'Spent', value: formatInr(summary.totalExpense), color: c.expense)),
            const SizedBox(width: 12),
            Expanded(child: _KpiTile(label: 'Income credited', value: formatInr(summary.totalIncome), color: c.income)),
          ],
        ),
        const SizedBox(height: 16),

        _ChartCard(
          title: 'Spending by category',
          child: breakdown.isEmpty || categoryTotal <= 0
              ? const EmptyState(icon: LucideIcons.pieChart, message: 'No expenses this month.')
              : Column(
                  children: [
                    SizedBox(
                      height: 200,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          PieChart(
                            PieChartData(
                              sectionsSpace: 2,
                              centerSpaceRadius: 62,
                              startDegreeOffset: -90,
                              pieTouchData: PieTouchData(enabled: false),
                              sections: [
                                for (var i = 0; i < breakdown.length; i++)
                                  PieChartSectionData(
                                    color: c.chart[i % c.chart.length],
                                    value: breakdown[i].total,
                                    showTitle: false,
                                    radius: 30,
                                  ),
                              ],
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Total', style: context.text.labelMedium),
                              Text(
                                formatInr(categoryTotal),
                                style: context.text.titleMedium?.copyWith(fontSize: 18, fontFeatures: AppTheme.tabular),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    for (var i = 0; i < breakdown.length; i++)
                      _LegendRow(
                        color: c.chart[i % c.chart.length],
                        label: breakdown[i].category,
                        amount: breakdown[i].total,
                        pct: breakdown[i].total / categoryTotal * 100,
                      ),
                  ],
                ),
        ),
        const SizedBox(height: 16),

        _ChartCard(
          title: 'Income vs expense',
          child: SizedBox(height: 200, child: _IncomeExpenseBars(income: summary.totalIncome, expense: summary.totalExpense)),
        ),

        if (summary.topMerchants.isNotEmpty) ...[
          const SizedBox(height: 16),
          _ChartCard(
            title: 'Top merchants',
            child: Column(
              children: [
                for (final m in summary.topMerchants)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        Icon(LucideIcons.shoppingBag, size: 18, color: c.muted),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(m.merchant, style: context.text.bodyLarge, maxLines: 1, overflow: TextOverflow.ellipsis),
                              Text('${m.count} transactions', style: context.text.bodySmall),
                            ],
                          ),
                        ),
                        Text(
                          formatSignedInr(m.totalSpent, isCredit: false),
                          style: context.text.titleSmall?.copyWith(color: c.expense, fontFeatures: AppTheme.tabular),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _IncomeExpenseBars extends StatelessWidget {
  final double income;
  final double expense;
  const _IncomeExpenseBars({required this.income, required this.expense});

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final tt = context.text;
    final maxVal = math.max(income, expense);
    final interval = _niceInterval(maxVal);
    final maxY = (maxVal / interval).ceil() * interval;
    final axisStyle = tt.labelSmall!.copyWith(fontFeatures: AppTheme.tabular);

    String compact(double v) {
      if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(v % 100000 == 0 ? 0 : 1)}L';
      if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(v % 1000 == 0 ? 0 : 1)}k';
      return '₹${v.toStringAsFixed(0)}';
    }

    return Semantics(
      label: 'Income ${formatInr(income)}, expense ${formatInr(expense)}',
      excludeSemantics: true,
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: maxY <= 0 ? 1 : maxY,
          barTouchData: BarTouchData(
            enabled: true,
            touchTooltipData: BarTouchTooltipData(
              getTooltipColor: (_) => context.colors.inverseSurface,
              tooltipRoundedRadius: 8,
              getTooltipItem: (group, _, rod, __) => BarTooltipItem(
                formatInr(rod.toY),
                TextStyle(color: context.colors.onInverseSurface, fontWeight: FontWeight.w600, fontSize: 13),
              ),
            ),
          ),
          titlesData: FlTitlesData(
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 28,
                getTitlesWidget: (val, meta) => SideTitleWidget(
                  axisSide: meta.axisSide,
                  space: 8,
                  child: Text(val == 0 ? 'Income' : 'Expense', style: tt.labelMedium),
                ),
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 48,
                interval: interval,
                getTitlesWidget: (val, meta) => SideTitleWidget(
                  axisSide: meta.axisSide,
                  child: Text(compact(val), style: axisStyle),
                ),
              ),
            ),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: interval,
            getDrawingHorizontalLine: (_) => FlLine(color: c.border, strokeWidth: 1),
          ),
          borderData: FlBorderData(show: false),
          barGroups: [
            _bar(0, income, c.incomeFill),
            _bar(1, expense, c.expenseFill),
          ],
        ),
      ),
    );
  }

  BarChartGroupData _bar(int x, double v, Color color) => BarChartGroupData(
        x: x,
        barRods: [
          BarChartRodData(
            toY: v,
            color: color,
            width: 44,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
          ),
        ],
      );

  static double _niceInterval(double maxVal) {
    if (maxVal <= 0) return 1;
    final raw = maxVal / 4;
    final mag = math.pow(10, (math.log(raw) / math.ln10).floor()).toDouble();
    final norm = raw / mag;
    final step = norm <= 1 ? 1 : (norm <= 2 ? 2 : (norm <= 5 ? 5 : 10));
    return step * mag;
  }
}

class _LegendRow extends StatelessWidget {
  final Color color;
  final String label;
  final double amount;
  final double pct;
  const _LegendRow({required this.color, required this.label, required this.amount, required this.pct});

  @override
  Widget build(BuildContext context) {
    final tt = context.text;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 10),
          Expanded(child: Text(label, style: tt.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
          SizedBox(
            width: 48,
            child: Text(
              '${pct.toStringAsFixed(pct < 10 ? 1 : 0)}%',
              textAlign: TextAlign.right,
              style: tt.labelMedium?.copyWith(fontFeatures: AppTheme.tabular),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 84,
            child: Text(
              formatInr(amount),
              textAlign: TextAlign.right,
              style: tt.titleSmall?.copyWith(fontFeatures: AppTheme.tabular),
            ),
          ),
        ],
      ),
    );
  }
}

class _KpiTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _KpiTile({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: context.text.labelMedium),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: context.text.titleLarge?.copyWith(color: color, fontFeatures: AppTheme.tabular),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChartCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _ChartCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: context.text.titleMedium),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}
