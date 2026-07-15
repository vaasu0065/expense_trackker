import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../providers/analytics_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../models/analytics_model.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analyticsAsync = ref.watch(analyticsSummaryProvider);
    final selectedMonth = ref.watch(selectedMonthProvider);

    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Analytics & Charts'),
      ),
      body: Column(
        children: [
          // Month Selector Pills
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 12,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final m = idx + 1;
                final isSelected = selectedMonth == m;
                return ChoiceChip(
                  label: Text(months[idx], style: TextStyle(color: isSelected ? Colors.white : Colors.grey.shade400, fontWeight: FontWeight.bold)),
                  selected: isSelected,
                  selectedColor: AppTheme.primaryAccent,
                  backgroundColor: Theme.of(context).cardTheme.color,
                  onSelected: (selected) {
                    if (selected) {
                      ref.read(selectedMonthProvider.notifier).state = m;
                    }
                  },
                );
              },
            ),
          ),
          const SizedBox(height: 12),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(analyticsSummaryProvider),
              child: analyticsAsync.when(
                data: (summary) {
                  if (summary == null || (summary.totalExpense == 0 && summary.totalIncome == 0)) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(40),
                        child: Text('No analytical data available for ${months[selectedMonth - 1]} ${summary?.year ?? ""}.', style: const TextStyle(color: Colors.grey)),
                      ),
                    );
                  }

                  return SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Category Pie Chart Container
                        _ChartContainerCard(
                          title: 'Category-wise Breakdown',
                          child: Column(
                            children: [
                              SizedBox(
                                height: 220,
                                child: PieChart(
                                  PieChartData(
                                    sectionsSpace: 3,
                                    centerSpaceRadius: 40,
                                    sections: _buildPieSections(summary.categoryBreakdown, summary.totalExpense),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 20),
                              _buildPieLegend(summary.categoryBreakdown, summary.totalExpense),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Income vs Expense Bar Chart
                        _ChartContainerCard(
                          title: 'Income vs Expense Comparison',
                          child: SizedBox(
                            height: 200,
                            child: BarChart(
                              BarChartData(
                                alignment: BarChartAlignment.spaceAround,
                                maxY: (summary.totalIncome > summary.totalExpense ? summary.totalIncome : summary.totalExpense) * 1.2,
                                barTouchData: BarTouchData(enabled: true),
                                titlesData: FlTitlesData(
                                  show: true,
                                  bottomTitles: AxisTitles(
                                    sideTitles: SideTitles(
                                      showTitles: true,
                                      getTitlesWidget: (val, _) {
                                        if (val == 0) return const Text('INCOME', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.emerald, fontSize: 12));
                                        if (val == 1) return const Text('EXPENSE', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.rose, fontSize: 12));
                                        return const SizedBox();
                                      },
                                    ),
                                  ),
                                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                ),
                                gridData: const FlGridData(show: false),
                                borderData: FlBorderData(show: false),
                                barGroups: [
                                  BarChartGroupData(
                                    x: 0,
                                    barRods: [
                                      BarChartRodData(
                                        toY: summary.totalIncome,
                                        color: AppTheme.emerald,
                                        width: 40,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ],
                                  ),
                                  BarChartGroupData(
                                    x: 1,
                                    barRods: [
                                      BarChartRodData(
                                        toY: summary.totalExpense,
                                        color: AppTheme.rose,
                                        width: 40,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Top Spending Merchants Card
                        _ChartContainerCard(
                          title: 'Top Spending Merchants',
                          child: Column(
                            children: summary.topMerchants.map((merchant) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                child: Row(
                                  children: [
                                    const Icon(Icons.store_rounded, color: AppTheme.primaryAccent, size: 22),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(merchant.merchant, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                          Text('${merchant.count} transactions', style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '-₹${NumberFormat('#,##0.00').format(merchant.totalSpent)}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.rose, fontSize: 15),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Error: $e')),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<PieChartSectionData> _buildPieSections(List<CategoryBreakdown> breakdown, double totalExpense) {
    if (breakdown.isEmpty || totalExpense <= 0) return [];

    final colors = [
      const Color(0xFF4F46E5),
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
      const Color(0xFFEC4899),
      const Color(0xFF06B6D4),
      const Color(0xFF8B5CF6),
      const Color(0xFFEF4444),
      const Color(0xFF64748B),
    ];

    return breakdown.asMap().entries.map((entry) {
      final idx = entry.key;
      final item = entry.value;
      final pct = (item.total / totalExpense) * 100;

      return PieChartSectionData(
        color: colors[idx % colors.length],
        value: item.total,
        title: '${pct.toStringAsFixed(0)}%',
        radius: 60,
        titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
      );
    }).toList();
  }

  Widget _buildPieLegend(List<CategoryBreakdown> breakdown, double totalExpense) {
    final colors = [
      const Color(0xFF4F46E5),
      const Color(0xFF10B981),
      const Color(0xFFF59E0B),
      const Color(0xFFEC4899),
      const Color(0xFF06B6D4),
      const Color(0xFF8B5CF6),
      const Color(0xFFEF4444),
      const Color(0xFF64748B),
    ];

    return Wrap(
      spacing: 16,
      runSpacing: 10,
      children: breakdown.asMap().entries.map((entry) {
        final idx = entry.key;
        final item = entry.value;
        final pct = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0.0;

        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 12, height: 12, decoration: BoxDecoration(color: colors[idx % colors.length], shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text('${item.category} (${pct.toStringAsFixed(1)}%)', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          ],
        );
      }).toList(),
    );
  }
}

class _ChartContainerCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _ChartContainerCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}
