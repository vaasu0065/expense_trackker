import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../services/local_storage.dart';
import '../services/sms_service.dart';

final darkModeProvider = StateProvider<bool>((ref) => LocalStorage.isDarkMode);
final smsTrackingProvider = StateProvider<bool>((ref) => LocalStorage.isSmsTrackingEnabled);

final settingsControllerProvider = Provider<SettingsController>((ref) => SettingsController(ref));

class SettingsController {
  final Ref _ref;
  SettingsController(this._ref);

  void toggleDarkMode(bool value) {
    LocalStorage.toggleDarkMode(value);
    _ref.read(darkModeProvider.notifier).state = value;
  }

  Future<void> toggleSmsTracking(bool value) async {
    LocalStorage.toggleSmsTracking(value);
    _ref.read(smsTrackingProvider.notifier).state = value;
    if (value) {
      await SmsService.requestPermissions();
    } else {
      SmsService.stopListening();
    }
  }

  Future<String?> getGmailConsentUrl() async {
    try {
      final res = await ApiClient.instance.get('/gmail/auth-url');
      if (res.statusCode == 200 && res.data['success'] == true) {
        return res.data['url'];
      }
    } catch (e) {
      print('Get Gmail Consent Error: $e');
    }
    return null;
  }

  Future<Map<String, dynamic>?> triggerGmailSync() async {
    try {
      final res = await ApiClient.instance.post('/gmail/sync');
      if (res.statusCode == 200 && res.data['success'] == true) {
        return res.data;
      }
    } catch (e) {
      print('Trigger Gmail Sync Error: $e');
    }
    return null;
  }

  Future<bool> disconnectGmail() async {
    try {
      final res = await ApiClient.instance.post('/gmail/disconnect');
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<String?> downloadExport(String format) async {
    try {
      if (kIsWeb) {
        return 'Downloaded directly to browser downloads folder';
      }
      final dir = await getApplicationDocumentsDirectory();
      final ext = format.toLowerCase() == 'excel' || format.toLowerCase() == 'xlsx' ? 'xlsx' : 'csv';
      final filePath = '${dir.path}/Expense_Tracker_Ledger.$ext';

      final endpoint = ext == 'xlsx' ? '/expenses/export/excel' : '/expenses/export/csv';
      await ApiClient.instance.download(
        endpoint,
        filePath,
        options: Options(responseType: ResponseType.bytes),
      );
      return filePath;
    } catch (e) {
      print('Download Export Error: $e');
      return null;
    }
  }
}
