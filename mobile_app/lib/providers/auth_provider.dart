import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/user_model.dart';
import '../services/local_storage.dart';
import '../services/google_auth.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  AuthNotifier() : super(const AsyncValue.loading()) {
    checkLoginStatus();
  }

  Future<void> checkLoginStatus() async {
    if (!LocalStorage.isLoggedIn) {
      state = const AsyncValue.data(null);
      return;
    }

    try {
      final res = await ApiClient.instance.get('/auth/me');
      if (res.statusCode == 200 && res.data != null) {
        final userData = res.data['user'] ?? res.data['data'] ?? res.data;
        state = AsyncValue.data(UserModel.fromJson(userData));
      } else {
        LocalStorage.clearAuth();
        state = const AsyncValue.data(null);
      }
    } catch (e) {
      if (e is DioException && (e.response?.statusCode == 401 || e.response?.statusCode == 403)) {
        LocalStorage.clearAuth();
        state = const AsyncValue.data(null);
        return;
      }
      // If purely offline/network unreachable, use cached session
      final userId = LocalStorage.authBox.get('userId');
      if (userId != null && userId.toString().isNotEmpty) {
        state = AsyncValue.data(UserModel(
          id: userId.toString(),
          name: LocalStorage.authBox.get('name') ?? 'User',
          email: LocalStorage.authBox.get('email') ?? '',
          settings: UserSettings(),
        ));
      } else {
        LocalStorage.clearAuth();
        state = const AsyncValue.data(null);
      }
    }
  }

  Future<bool> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final res = await ApiClient.instance.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (res.statusCode == 200 && (res.data['token'] != null || res.data['success'] == true)) {
        final userData = res.data['user'] ?? res.data['data'] ?? res.data;
        final token = res.data['token'] ?? '';
        LocalStorage.saveToken(token, userData['id'].toString(), userData['email'] ?? '', userData['name'] ?? '');
        state = AsyncValue.data(UserModel.fromJson(userData));
        return true;
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
    state = const AsyncValue.data(null);
    return false;
  }

  Future<bool> register(String name, String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final res = await ApiClient.instance.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
      });

      if ((res.statusCode == 200 || res.statusCode == 201) && res.data != null) {
        final userData = res.data['user'] ?? res.data['data'] ?? res.data;
        final token = res.data['token'] ?? '';
        if (token.isNotEmpty) {
          LocalStorage.saveToken(token, userData['id'].toString(), userData['email'] ?? '', userData['name'] ?? '');
          state = AsyncValue.data(UserModel.fromJson(userData));
          return true;
        } else {
          // Direct login after register if backend didn't return token
          return await login(email, password);
        }
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
    state = const AsyncValue.data(null);
    return false;
  }

  Future<bool> loginWithGoogle() async {
    state = const AsyncValue.loading();
    try {
      final data = await GoogleAuthService.signInWithGoogle();
      if (data != null) {
        state = AsyncValue.data(UserModel.fromJson(data));
        return true;
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
    state = const AsyncValue.data(null);
    return false;
  }

  Future<void> logout() async {
    await GoogleAuthService.signOut();
    LocalStorage.clearAuth();
    state = const AsyncValue.data(null);
  }
}
