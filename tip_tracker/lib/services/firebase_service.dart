// =============================================================================
// Firebase Service — STUB for future integration
// =============================================================================
//
// This file is a placeholder for Firebase integration. When ready to add
// Firebase, follow these steps:
//
// 1. Run `flutterfire configure` to generate firebase_options.dart
// 2. Add dependencies to pubspec.yaml:
//      firebase_core: ^3.8.1
//      firebase_auth: ^5.3.4
//      cloud_firestore: ^5.5.0
//      firebase_crashlytics: ^4.2.2
//      firebase_analytics: ^11.3.6
//
// 3. Initialize Firebase in main.dart:
//      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
//
// 4. Implement the methods below to sync local SQLite data with Firestore
// =============================================================================

/// Stub service for future Firebase/Firestore cloud sync.
///
/// When implemented, this service will handle:
/// - User authentication (email, Google, Apple Sign-In)
/// - Cloud sync of tips to Firestore
/// - Offline-first with automatic sync when online
/// - Multi-device support
class FirebaseService {
  FirebaseService._();
  static final FirebaseService instance = FirebaseService._();

  /// Whether Firebase has been initialized.
  /// Always returns false until Firebase is configured.
  bool get isInitialized => false;

  /// Whether the user is currently signed in.
  /// Always returns false until auth is implemented.
  bool get isSignedIn => false;

  /// Initialize Firebase services.
  /// No-op until Firebase is configured.
  Future<void> initialize() async {
    // TODO: Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    // TODO: Initialize Crashlytics, Analytics, Performance
  }

  /// Sign in with email and password.
  Future<void> signInWithEmail(String email, String password) async {
    throw UnimplementedError('Firebase Auth not yet configured');
  }

  /// Sign in with Google.
  Future<void> signInWithGoogle() async {
    throw UnimplementedError('Firebase Auth not yet configured');
  }

  /// Sign out the current user.
  Future<void> signOut() async {
    throw UnimplementedError('Firebase Auth not yet configured');
  }

  /// Sync local tips to Firestore.
  /// Call after sign-in to upload existing local data.
  Future<void> syncTipsToCloud() async {
    throw UnimplementedError('Firestore sync not yet configured');
  }

  /// Pull tips from Firestore to local DB.
  Future<void> syncTipsFromCloud() async {
    throw UnimplementedError('Firestore sync not yet configured');
  }
}
