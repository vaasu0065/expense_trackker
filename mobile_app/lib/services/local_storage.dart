import 'package:hive_flutter/hive_flutter.dart';

class LocalStorage {
  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox('auth');
    await Hive.openBox('settings');
    await Hive.openBox('offline_transactions');
  }

  static Box get authBox => Hive.box('auth');
  static Box get settingsBox => Hive.box('settings');
  static Box get offlineBox => Hive.box('offline_transactions');

  static String? get token => authBox.get('token');
  static bool get isLoggedIn => token != null && token!.isNotEmpty;

  static void saveToken(String token, String userId, String email, String name) {
    authBox.put('token', token);
    authBox.put('userId', userId);
    authBox.put('email', email);
    authBox.put('name', name);
  }

  static void clearAuth() {
    authBox.clear();
  }

  static bool get isDarkMode => settingsBox.get('darkMode', defaultValue: false);
  static bool get isSmsTrackingEnabled => settingsBox.get('smsTracking', defaultValue: true);

  static void toggleDarkMode(bool value) {
    settingsBox.put('darkMode', value);
  }

  static void toggleSmsTracking(bool value) {
    settingsBox.put('smsTracking', value);
  }
}
