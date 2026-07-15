import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings & Privacy'),
      ),
      body: userAsync.when(
        data: (user) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Profile Header Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).cardTheme.color,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppTheme.primaryAccent.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: AppTheme.primary.withOpacity(0.2),
                        child: Text(
                          (user?.name.isNotEmpty == true ? user!.name[0] : 'U').toUpperCase(),
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryAccent),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(user?.name ?? 'Expense Tracker User', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(user?.email ?? 'demo@expensepro.com', style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Section 1: Auto-Tracking & Integrations
                _SectionTitle(title: 'AUTOMATIC TRACKING & INTEGRATIONS'),
                const SizedBox(height: 10),
                Container(
                  decoration: _cardBoxDecoration(context),
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: isSmsTracking,
                        activeColor: AppTheme.emerald,
                        title: const Text('Android SMS Auto-Detection', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Read bank & UPI alert SMS to auto-create ledger entries', style: TextStyle(fontSize: 12)),
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: AppTheme.emerald.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.sms_rounded, color: AppTheme.emerald),
                        ),
                        onChanged: (val) => controller.toggleSmsTracking(val),
                      ),
                      Divider(height: 1, color: Colors.white.withOpacity(0.06)),

                      // Gmail Sync Section
                      ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: AppTheme.primaryAccent.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.mail_rounded, color: AppTheme.primaryAccent),
                        ),
                        title: const Text('Gmail Transaction Sync', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          user?.gmailSyncEnabled == true ? 'Connected to Gmail (Readonly API)' : 'Not connected to Gmail',
                          style: TextStyle(fontSize: 12, color: user?.gmailSyncEnabled == true ? AppTheme.emerald : Colors.grey),
                        ),
                        trailing: ElevatedButton(
                          onPressed: () async {
                            if (user?.gmailSyncEnabled == true) {
                              final confirmed = await _showConfirmDialog(context, 'Disconnect Gmail', 'Are you sure you want to disconnect Gmail sync?');
                              if (confirmed) {
                                await controller.disconnectGmail();
                                ref.read(authProvider.notifier).checkLoginStatus();
                              }
                            } else {
                              // Trigger Google OAuth consent
                              final url = await controller.getGmailConsentUrl();
                              if (url != null && context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Open OAuth Consent URL: $url')));
                              }
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: user?.gmailSyncEnabled == true ? AppTheme.rose : AppTheme.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          ),
                          child: Text(user?.gmailSyncEnabled == true ? 'Disconnect' : 'Connect'),
                        ),
                      ),
                      if (user?.gmailSyncEnabled == true) ...[
                        Divider(height: 1, color: Colors.white.withOpacity(0.06)),
                        ListTile(
                          title: const Text('Trigger Incremental Sync Now', style: TextStyle(fontSize: 13)),
                          trailing: const Icon(Icons.sync_rounded, color: AppTheme.emerald),
                          onTap: () async {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Scanning Gmail history...')));
                            final res = await controller.triggerGmailSync();
                            if (res != null && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Sync complete!')));
                            }
                          },
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Section 2: Data Export & Backup
                _SectionTitle(title: 'BACKUP & EXPORT'),
                const SizedBox(height: 10),
                Container(
                  decoration: _cardBoxDecoration(context),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.table_view_rounded, color: AppTheme.amber),
                        title: const Text('Export Ledger as CSV (.csv)', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Download all transactions in standard CSV format', style: TextStyle(fontSize: 12)),
                        trailing: const Icon(Icons.download_rounded),
                        onTap: () async {
                          final path = await controller.downloadExport('csv');
                          if (path != null && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('CSV saved to: $path')));
                          }
                        },
                      ),
                      Divider(height: 1, color: Colors.white.withOpacity(0.06)),
                      ListTile(
                        leading: const Icon(Icons.grid_on_rounded, color: AppTheme.emerald),
                        title: const Text('Export Ledger as Excel (.xlsx)', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Formatted Excel spreadsheet with color-coded rows', style: TextStyle(fontSize: 12)),
                        trailing: const Icon(Icons.download_rounded),
                        onTap: () async {
                          final path = await controller.downloadExport('excel');
                          if (path != null && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Excel saved to: $path')));
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Section 3: App Appearance & System
                _SectionTitle(title: 'APPEARANCE & SYSTEM'),
                const SizedBox(height: 10),
                Container(
                  decoration: _cardBoxDecoration(context),
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: isDarkMode,
                        activeColor: AppTheme.primaryAccent,
                        title: const Text('Dark Mode Theme', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Sleek glassmorphic dark background', style: TextStyle(fontSize: 12)),
                        secondary: const Icon(Icons.dark_mode_rounded, color: AppTheme.primaryAccent),
                        onChanged: (val) => controller.toggleDarkMode(val),
                      ),
                      Divider(height: 1, color: Colors.white.withOpacity(0.06)),
                      ListTile(
                        leading: const Icon(Icons.bug_report_rounded, color: AppTheme.amber),
                        title: const Text('Simulate Test SMS Alert', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Trigger test ₹250 Swiggy debit for verification', style: TextStyle(fontSize: 12)),
                        onTap: () async {
                          await SmsService.simulateTestSms("Rs. 250.00 debited from a/c **1234 on 18-May-26 to SWIGGY Ref No 612345678912");
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Simulated test SMS triggered! Check your dashboard.')));
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Logout Button
                ElevatedButton.icon(
                  onPressed: () async {
                    await ref.read(authProvider.notifier).logout();
                    if (context.mounted) context.go('/login');
                  },
                  icon: const Icon(Icons.logout_rounded, color: Colors.white),
                  label: const Text('Sign Out of Account'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.rose, padding: const EdgeInsets.symmetric(vertical: 16)),
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  BoxDecoration _cardBoxDecoration(BuildContext context) {
    return BoxDecoration(
      color: Theme.of(context).cardTheme.color,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: Colors.white.withOpacity(0.06)),
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
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), style: ElevatedButton.styleFrom(backgroundColor: AppTheme.rose), child: const Text('Confirm')),
        ],
      ),
    ) ?? false;
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade400, letterSpacing: 1.1),
      ),
    );
  }
}
