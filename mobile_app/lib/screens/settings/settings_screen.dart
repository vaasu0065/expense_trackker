import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/auth_provider.dart';
import '../../providers/settings_provider.dart';
import '../../services/sms_service.dart';
import '../../core/theme/app_theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(authProvider);
    final isDarkMode = ref.watch(darkModeProvider);
    final isSmsTracking = ref.watch(smsTrackingProvider);
    final controller = ref.watch(settingsControllerProvider);

    final c = context.appColors;
    final tt = context.text;
    final gmailConnected = userAsync.value?.gmailSyncEnabled == true;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: userAsync.when(
        data: (user) {
          final name = (user?.name.isNotEmpty == true) ? user!.name : 'Expense Tracker user';
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              // Profile
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.primary.withValues(alpha: 0.18),
                        child: Text(
                          name[0].toUpperCase(),
                          style: tt.titleLarge?.copyWith(color: c.brandText),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: tt.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
                            if ((user?.email ?? '').isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(user!.email, style: tt.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              const _SectionTitle(title: 'Tracking & integrations'),
              _SectionCard(
                children: [
                  SwitchListTile(
                    value: isSmsTracking,
                    title: const Text('SMS auto-detection'),
                    subtitle: const Text('Auto-add bank and UPI alerts from SMS (Android)'),
                    secondary: _LeadingIcon(icon: LucideIcons.messageSquare, color: c.income),
                    onChanged: (val) => controller.toggleSmsTracking(val),
                  ),
                  ListTile(
                    leading: _LeadingIcon(icon: LucideIcons.mail, color: c.brandText),
                    title: const Text('Gmail sync'),
                    subtitle: Text(
                      gmailConnected ? 'Connected (read-only)' : 'Not connected',
                      style: gmailConnected ? tt.bodySmall?.copyWith(color: c.income) : null,
                    ),
                    trailing: OutlinedButton(
                      onPressed: () async {
                        if (gmailConnected) {
                          final confirmed = await _showConfirmDialog(context, 'Disconnect Gmail', 'Stop syncing transactions from Gmail?');
                          if (confirmed) {
                            await controller.disconnectGmail();
                            ref.read(authProvider.notifier).checkLoginStatus();
                          }
                        } else {
                          // Trigger Google OAuth consent
                          final url = await controller.getGmailConsentUrl();
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(url != null ? 'Open OAuth consent URL: $url' : 'Gmail connection is not available right now.'),
                          ));
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: gmailConnected ? c.expense : c.brandText,
                        minimumSize: const Size(0, 40),
                        tapTargetSize: MaterialTapTargetSize.padded,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                      ),
                      child: Text(gmailConnected ? 'Disconnect' : 'Connect'),
                    ),
                  ),
                  if (gmailConnected)
                    ListTile(
                      leading: _LeadingIcon(icon: LucideIcons.refreshCw, color: c.muted),
                      title: const Text('Sync Gmail now'),
                      trailing: const Icon(LucideIcons.chevronRight, size: 18),
                      onTap: () async {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Scanning Gmail history...')));
                        final res = await controller.triggerGmailSync();
                        if (res != null && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Sync complete!')));
                        }
                      },
                    ),
                ],
              ),
              const SizedBox(height: 24),

              const _SectionTitle(title: 'Backup & export'),
              _SectionCard(
                children: [
                  ListTile(
                    leading: _LeadingIcon(icon: LucideIcons.fileText, color: c.warning),
                    title: const Text('Export as CSV'),
                    subtitle: const Text('All transactions, .csv'),
                    trailing: const Icon(LucideIcons.download, size: 18),
                    onTap: () async {
                      final path = await controller.downloadExport('csv');
                      if (path != null && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('CSV saved to: $path')));
                      }
                    },
                  ),
                  ListTile(
                    leading: _LeadingIcon(icon: LucideIcons.fileSpreadsheet, color: c.income),
                    title: const Text('Export as Excel'),
                    subtitle: const Text('Formatted spreadsheet, .xlsx'),
                    trailing: const Icon(LucideIcons.download, size: 18),
                    onTap: () async {
                      final path = await controller.downloadExport('excel');
                      if (path != null && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Excel saved to: $path')));
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 24),

              const _SectionTitle(title: 'Appearance & system'),
              _SectionCard(
                children: [
                  SwitchListTile(
                    value: isDarkMode,
                    title: const Text('Dark mode'),
                    subtitle: const Text('Use the dark colour scheme'),
                    secondary: _LeadingIcon(icon: LucideIcons.moon, color: c.brandText),
                    onChanged: (val) => controller.toggleDarkMode(val),
                  ),
                  ListTile(
                    leading: _LeadingIcon(icon: LucideIcons.bug, color: c.warning),
                    title: const Text('Simulate test SMS'),
                    subtitle: const Text('Adds a test ₹250 Swiggy debit'),
                    trailing: const Icon(LucideIcons.chevronRight, size: 18),
                    onTap: () async {
                      await SmsService.simulateTestSms("Rs. 250.00 debited from a/c **1234 on 18-May-26 to SWIGGY Ref No 612345678912");
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Test SMS simulated. Check your dashboard.')));
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 32),

              OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                },
                icon: const Icon(LucideIcons.logOut, size: 18),
                label: const Text('Sign out'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: c.expense,
                  side: BorderSide(color: c.expense.withValues(alpha: 0.4)),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Future<bool> _showConfirmDialog(BuildContext context, String title, String message) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(title),
            content: Text(message),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: FilledButton.styleFrom(backgroundColor: AppTheme.rose),
                child: const Text('Disconnect'),
              ),
            ],
          ),
        ) ??
        false;
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Semantics(
        header: true,
        child: Text(
          title.toUpperCase(),
          style: context.text.labelSmall?.copyWith(letterSpacing: 0.8, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const Divider(indent: 68),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _LeadingIcon extends StatelessWidget {
  final IconData icon;
  final Color color;
  const _LeadingIcon({required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, size: 18, color: color),
    );
  }
}
