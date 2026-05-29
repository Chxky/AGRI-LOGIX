import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../models/seed_bag.dart';

class DatabaseService extends ChangeNotifier {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  Future<SeedBag?> getBagDetails(String bagId) async {
    try {
      final doc = await _db.collection('seedBags').doc(bagId).get();
      if (!doc.exists) return null;
      return SeedBag.fromMap(doc.id, doc.data()!);
    } catch (e) {
      debugPrint('Error fetching bag: $e');
      return null;
    }
  }

  Future<List<SeedBag>> getFarmerHistory(String phoneNumber) async {
    try {
      final snapshot = await _db
          .collection('seedBags')
          .where('farmerPhone', isEqualTo: phoneNumber)
          .where('condition', isEqualTo: 'redeemed')
          .orderBy('redemptionTimestamp', descending: true)
          .limit(50)
          .get();
      return snapshot.docs.map((doc) => SeedBag.fromMap(doc.id, doc.data())).toList();
    } catch (e) {
      debugPrint('Error fetching history: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> redeemBag({
    required String bagId,
    required String phoneNumber,
    required String pin,
    double? latitude,
    double? longitude,
    String? ward,
  }) async {
    try {
      final redeemCallable = _functions.httpsCallable('redeemBag');
      final result = await redeemCallable.call({
        'bagId': bagId,
        'phoneNumber': phoneNumber,
        'pin': pin,
        'location': latitude != null && longitude != null
            ? {'latitude': latitude, 'longitude': longitude}
            : null,
        'ward': ward,
        'capturedBy': 'farmer_app',
      });
      return result.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Redemption error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> syncOfflineRedemptions(
    List<Map<String, dynamic>> redemptions,
  ) async {
    try {
      final syncCallable = FirebaseFunctions.instance.httpsCallable('syncOfflineRedemptions');
      final result = await syncCallable.call({'redemptions': redemptions});
      return result.data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Sync error: $e');
      rethrow;
    }
  }
}
