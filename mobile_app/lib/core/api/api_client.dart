import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';

class ApiClient {
  static late Dio _dio;

  /// Called when the server rejects the saved session (expired/invalid token).
  static void Function()? onUnauthorized;

  static void init() {
    // 1. Check if an API_URL was passed via `--dart-define=API_URL=...` during build/run
    // 2. If in release mode without override, use production Vercel backend
    // 3. Otherwise fallback to local dev emulator (10.0.2.2) or localhost
    const definedApiUrl = String.fromEnvironment('API_URL');
    final String baseUrl;
    if (definedApiUrl.isNotEmpty) {
      baseUrl = definedApiUrl;
    } else if (kReleaseMode) {
      baseUrl = 'https://expense-trackker-zeta.vercel.app';
    } else if (!kIsWeb && Platform.isAndroid) {
      baseUrl = 'http://10.0.2.2:5001';
    } else {
      baseUrl = 'http://localhost:5001';
    }

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Interceptor to attach JWT token if present
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final authBox = Hive.box('auth');
          final token = authBox.get('token');
          if (token != null && token.toString().isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          final isLoginRequest = e.requestOptions.path.startsWith('/auth/login');
          if (e.response?.statusCode == 401 && !isLoginRequest) {
            // Token expired or invalid: clear the session and return to login
            Hive.box('auth').clear();
            onUnauthorized?.call();
          }
          return handler.next(e);
        },
      ),
    );
  }

  static Dio get instance {
    return _dio;
  }
}
