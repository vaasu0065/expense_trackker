import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../providers/auth_provider.dart';
import '../../core/theme/app_theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isLogin = true;
  final _nameCtrl = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  String _errorMessage = '';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() { _isLoading = true; _errorMessage = ''; });
    final notifier = ref.read(authProvider.notifier);
    bool success;

    if (_isLogin) {
      success = await notifier.login(_emailCtrl.text.trim(), _passwordCtrl.text);
    } else {
      success = await notifier.register(_nameCtrl.text.trim(), _emailCtrl.text.trim(), _passwordCtrl.text);
    }

    if (success && mounted) {
      context.go('/dashboard');
    } else if (mounted) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Authentication failed. Please verify credentials.';
      });
    }
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() { _isLoading = true; _errorMessage = ''; });
    final success = await ref.read(authProvider.notifier).loginWithGoogle();
    if (success && mounted) {
      context.go('/dashboard');
    } else if (mounted) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Google Sign-In failed or was cancelled.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.appColors;
    final tt = context.text;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand
                    Center(
                      child: Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(LucideIcons.wallet, size: 26, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Expense Tracker', style: tt.headlineSmall, textAlign: TextAlign.center),
                    const SizedBox(height: 6),
                    Text(
                      'Track spending from SMS, Gmail and manual entries',
                      style: tt.bodyMedium?.copyWith(color: c.muted),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),

                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Semantics(
                              header: true,
                              child: Text(_isLogin ? 'Sign in' : 'Create account', style: tt.titleLarge),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _isLogin ? 'Welcome back. Enter your details to continue.' : 'Start tracking your money in minutes.',
                              style: tt.bodySmall,
                            ),
                            const SizedBox(height: 20),

                            if (_errorMessage.isNotEmpty)
                              Semantics(
                                liveRegion: true,
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: c.expenseFill.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(AppTheme.radiusControl),
                                    border: Border.all(color: c.expense.withValues(alpha: 0.35)),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(LucideIcons.alertCircle, size: 18, color: c.expense),
                                      const SizedBox(width: 10),
                                      Expanded(child: Text(_errorMessage, style: tt.bodySmall?.copyWith(color: c.expense))),
                                    ],
                                  ),
                                ),
                              ),

                            if (!_isLogin) ...[
                              TextField(
                                controller: _nameCtrl,
                                textInputAction: TextInputAction.next,
                                textCapitalization: TextCapitalization.words,
                                autofillHints: const [AutofillHints.name],
                                decoration: const InputDecoration(
                                  labelText: 'Full name',
                                  prefixIcon: Icon(LucideIcons.user, size: 18),
                                ),
                              ),
                              const SizedBox(height: 14),
                            ],

                            TextField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              textInputAction: TextInputAction.next,
                              autocorrect: false,
                              autofillHints: const [AutofillHints.email],
                              decoration: const InputDecoration(
                                labelText: 'Email',
                                prefixIcon: Icon(LucideIcons.mail, size: 18),
                              ),
                            ),
                            const SizedBox(height: 14),

                            TextField(
                              controller: _passwordCtrl,
                              obscureText: _obscurePassword,
                              textInputAction: TextInputAction.done,
                              autofillHints: [_isLogin ? AutofillHints.password : AutofillHints.newPassword],
                              onSubmitted: (_) {
                                if (!_isLoading) _submit();
                              },
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(LucideIcons.lock, size: 18),
                                suffixIcon: IconButton(
                                  icon: Icon(_obscurePassword ? LucideIcons.eye : LucideIcons.eyeOff, size: 18),
                                  tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            FilledButton(
                              onPressed: _isLoading ? null : _submit,
                              child: _isLoading
                                  ? Semantics(
                                      label: 'Signing in',
                                      child: const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                      ),
                                    )
                                  : Text(_isLogin ? 'Sign in' : 'Create account'),
                            ),
                            const SizedBox(height: 16),

                            Row(
                              children: [
                                const Expanded(child: Divider()),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  child: Text('or', style: tt.labelMedium),
                                ),
                                const Expanded(child: Divider()),
                              ],
                            ),
                            const SizedBox(height: 16),

                            OutlinedButton.icon(
                              onPressed: _isLoading ? null : _handleGoogleSignIn,
                              icon: const Icon(Icons.g_mobiledata_rounded, size: 26),
                              label: const Text('Continue with Google'),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_isLogin ? "Don't have an account?" : 'Already registered?', style: tt.bodyMedium?.copyWith(color: c.muted)),
                        TextButton(
                          onPressed: _isLoading
                              ? null
                              : () => setState(() {
                                    _isLogin = !_isLogin;
                                    _errorMessage = '';
                                  }),
                          child: Text(_isLogin ? 'Create one' : 'Sign in'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
