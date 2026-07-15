import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:hive/hive.dart';

class ApiClient {
  static late Dio _dio;

  static void init() {
    // 10.0.2.2 is loopback for Android Emulator, localhost for iOS/Web/Mac
    final baseUrl = (!kIsWeb && Platform.isAndroid)
        ? 'http://10.0.2.2:5001'
        : 'http://localhost:5001';

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
          if (e.response?.statusCode == 401) {
            // Token expired or invalid, clear box
            Hive.box('auth').delete('token');
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
