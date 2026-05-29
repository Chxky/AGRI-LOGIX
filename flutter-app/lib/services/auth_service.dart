import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  User? _user;
  bool _loading = false;

  User? get user => _user;
  bool get loading => _loading;
  bool get isLoggedIn => _user != null;

  AuthService() {
    _auth.authStateChanges().listen((user) {
      _user = user;
      notifyListeners();
    });
  }

  Future<String?> login(String email, String password) async {
    _loading = true;
    notifyListeners();
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      _loading = false;
      notifyListeners();
      return null;
    } on FirebaseAuthException catch (e) {
      _loading = false;
      notifyListeners();
      return e.message ?? 'Login failed';
    }
  }

  Future<String?> registerFarmer({
    required String phoneNumber,
    required String name,
    required String ward,
    required String pin,
  }) async {
    _loading = true;
    notifyListeners();
    try {
      await _db.collection('farmers').doc(phoneNumber).set({
        'phoneNumber': phoneNumber,
        'name': name,
        'ward': ward,
        'pinHash': _hashPin(pin),
        'registeredDate': FieldValue.serverTimestamp(),
        'registrationSource': 'app',
      });
      _loading = false;
      notifyListeners();
      return null;
    } catch (e) {
      _loading = false;
      notifyListeners();
      return 'Registration failed: $e';
    }
  }

  Future<Map<String, dynamic>?> getFarmerProfile(String phoneNumber) async {
    try {
      final doc = await _db.collection('farmers').doc(phoneNumber).get();
      return doc.data();
    } catch (e) {
      return null;
    }
  }

  String _hashPin(String pin) {
    final bytes = utf8.encode(pin);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  Future<void> logout() async {
    await _auth.signOut();
  }
}
