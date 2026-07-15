import 'package:google_sign_in/google_sign_in.dart';
import '../core/api/api_client.dart';
import 'local_storage.dart';

class GoogleAuthService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  );

  static Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) return null; // User cancelled

      final GoogleSignInAuthentication auth = await account.authentication;

      // Exchange with Backend to get JWT session and save OAuth tokens
      final response = await ApiClient.instance.post('/auth/google', data: {
        'email': account.email,
        'name': account.displayName ?? account.email.split('@')[0],
        'googleId': account.id,
        'accessToken': auth.accessToken,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'];
        final token = response.data['token'];

        LocalStorage.saveToken(token, data['id'], data['email'], data['name']);
        return data;
      }
    } catch (e) {
      print('Google Sign-In Error: $e');
    }
    return null;
  }

  static Future<void> signOut() async {
    await _googleSignIn.signOut();
    LocalStorage.clearAuth();
  }
}
