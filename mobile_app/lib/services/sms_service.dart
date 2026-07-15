import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';
import '../core/api/api_client.dart';
import '../core/utils/regex_utils.dart';
import 'local_storage.dart';

class SmsService {
  static bool _isListening = false;

  /// Request SMS read & receive permissions from user on Android
  static Future<bool> requestPermissions() async {
    if (kIsWeb || !Platform.isAndroid) return false;

    final status = await Permission.sms.request();
    if (status.isGranted) {
      await startListening();
      return true;
    } else if (status.isPermanentlyDenied) {
      // Direct user to device settings if permanently denied
      await openAppSettings();
    }
    return false;
  }

  /// Start incoming SMS listener worker
  static Future<void> startListening() async {
    if (kIsWeb || !Platform.isAndroid || _isListening) return;

    if (!LocalStorage.isSmsTrackingEnabled) {
      debugPrint("SMS Tracking is disabled by user in Settings.");
      return;
    }

    _isListening = true;
    debugPrint("✅ Android SMS Auto-Detection Listener Started");

    // Note: In production build with another_telephony plugin:
    // Telephony.instance.listenIncomingSms(
    //   onNewMessage: _onSmsReceived,
    //   listenInBackground: true,
    // );
  }

  /// Stop incoming SMS listener
  static void stopListening() {
    _isListening = false;
    debugPrint("🛑 Android SMS Auto-Detection Listener Stopped");
  }

  /// Handler when a new SMS notification arrives on device
  static Future<void> onSmsReceived(String senderId, String bodyText) async {
    if (!LocalStorage.isSmsTrackingEnabled) return;

    final userId = LocalStorage.authBox.get('userId') ?? '';
    if (userId.isEmpty) return;

    // Filter only Bank & UPI messages to respect privacy and save CPU
    if (RegexUtils.isBankOrUpiSender(senderId)) {
      debugPrint("📨 Incoming Bank/UPI SMS from $senderId: $bodyText");
      final parsed = RegexUtils.parseTransaction(bodyText, senderId, userId);

      if (parsed != null) {
        debugPrint("✨ Parsed Expense/Income: ${parsed.amount} at ${parsed.merchant} (${parsed.category})");
        await _syncToBackend(parsed.toJson(), bodyText);
      }
    }
  }

  /// Send parsed transaction or raw SMS to Backend for zero-duplicate upsert
  static Future<void> _syncToBackend(Map<String, dynamic> payload, String rawText) async {
    try {
      final dio = ApiClient.instance;
      await dio.post('/transactions/bulk-import', data: {
        'source': 'sms',
        'transactions': [
          {
            ...payload,
            'rawText': rawText,
          }
        ]
      });
      debugPrint("✅ Successfully synced SMS transaction to MongoDB");
    } catch (e) {
      debugPrint("❌ Failed to sync SMS transaction to backend: $e");
      // Cache in offline box for retry later when network restores
      LocalStorage.offlineBox.add({
        ...payload,
        'rawText': rawText,
        'cachedAt': DateTime.now().toIso8601String(),
      });
    }
  }

  /// Simulate incoming SMS for testing on Android Emulator
  static Future<void> simulateTestSms(String sampleMessage) async {
    await onSmsReceived('AD-SBIBNK', sampleMessage);
  }
}
