import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../services/local_storage.dart';
import '../screens/auth/login_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/analytics/analytics_screen.dart';
import '../screens/transactions/transaction_list_screen.dart';
import '../screens/settings/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final _ = ref.watch(authProvider);

  return GoRouter(
    initialLocation: LocalStorage.isLoggedIn ? '/dashboard' : '/login',
    redirect: (context, state) {
      final loggedIn = LocalStorage.isLoggedIn;
      final isLoggingIn = state.uri.toString() == '/login';

      if (!loggedIn && !isLoggingIn) return '/login';
      if (loggedIn && isLoggingIn) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainScaffoldShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/transactions',
            builder: (context, state) => const TransactionListScreen(),
          ),
          GoRoute(
            path: '/analytics',
            builder: (context, state) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});

class MainScaffoldShell extends StatelessWidget {
  final Widget child;
  const MainScaffoldShell({super.key, required this.child});

  static const _paths = ['/dashboard', '/transactions', '/analytics', '/settings'];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final index = _paths.indexWhere((p) => location.startsWith(p));
    final border = Theme.of(context).dividerTheme.color;

    return Scaffold(
      body: child,
      bottomNavigationBar: DecoratedBox(
        decoration: BoxDecoration(border: Border(top: BorderSide(color: border ?? Colors.transparent))),
        child: NavigationBar(
          selectedIndex: index < 0 ? 0 : index,
          onDestinationSelected: (i) => context.go(_paths[i]),
          destinations: const [
            NavigationDestination(icon: Icon(LucideIcons.layoutDashboard), label: 'Home'),
            NavigationDestination(icon: Icon(LucideIcons.receipt), label: 'Transactions'),
            NavigationDestination(icon: Icon(LucideIcons.pieChart), label: 'Analytics'),
            NavigationDestination(icon: Icon(LucideIcons.settings), label: 'Settings'),
          ],
        ),
      ),
    );
  }
}
