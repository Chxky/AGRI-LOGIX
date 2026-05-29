import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class PendingRedemption {
  final String bagId;
  final String phoneNumber;
  final String pin;
  final double? latitude;
  final double? longitude;
  final String? ward;
  final DateTime capturedAt;

  PendingRedemption({
    required this.bagId,
    required this.phoneNumber,
    required this.pin,
    this.latitude,
    this.longitude,
    this.ward,
    DateTime? capturedAt,
  }) : capturedAt = capturedAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'bagId': bagId,
    'phoneNumber': phoneNumber,
    'pin': pin,
    'latitude': latitude,
    'longitude': longitude,
    'ward': ward,
    'capturedAt': capturedAt.toIso8601String(),
  };

  factory PendingRedemption.fromMap(Map<String, dynamic> map) => PendingRedemption(
    bagId: map['bagId'],
    phoneNumber: map['phoneNumber'],
    pin: map['pin'],
    latitude: map['latitude'],
    longitude: map['longitude'],
    ward: map['ward'],
    capturedAt: DateTime.parse(map['capturedAt']),
  );
}

class ScanService extends ChangeNotifier {
  static Database? _database;
  bool _isOnline = true;

  bool get isOnline => _isOnline;

  ScanService() {
    _initDb();
    _monitorConnectivity();
  }

  Future<void> _initDb() async {
    final dir = await getApplicationDocumentsDirectory();
    final path = p.join(dir.path, 'agri_logix_cache.db');
    _database = await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE pending_redemptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bagId TEXT NOT NULL,
            phoneNumber TEXT NOT NULL,
            pin TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            ward TEXT,
            capturedAt TEXT NOT NULL
          )
        ''');
        await db.execute('''
          CREATE TABLE scanned_bags (
            bagId TEXT PRIMARY KEY,
            qrCodeData TEXT,
            variety TEXT,
            batchNumber TEXT,
            condition TEXT,
            scannedAt TEXT NOT NULL
          )
        ''');
      },
    );
  }

  void _monitorConnectivity() {
    Connectivity().onConnectivityChanged.listen((results) {
      final wasOffline = !_isOnline;
      _isOnline = results != ConnectivityResult.none;
      if (wasOffline && _isOnline) {
        notifyListeners();
      }
    });
  }

  Future<void> cacheScan(Map<String, dynamic> bagData) async {
    if (_database == null) return;
    await _database!.insert(
      'scanned_bags',
      {
        'bagId': bagData['bagId'],
        'qrCodeData': bagData['qrCodeData'],
        'variety': bagData['variety'],
        'batchNumber': bagData['batchNumber'],
        'condition': bagData['condition'],
        'scannedAt': DateTime.now().toIso8601String(),
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Map<String, dynamic>>> getCachedScans() async {
    if (_database == null) return [];
    return await _database!.query(
      'scanned_bags',
      orderBy: 'scannedAt DESC',
      limit: 50,
    );
  }

  Future<void> savePendingRedemption(PendingRedemption redemption) async {
    if (_database == null) return;
    await _database!.insert('pending_redemptions', redemption.toMap());
    notifyListeners();
  }

  Future<List<PendingRedemption>> getPendingRedemptions() async {
    if (_database == null) return [];
    final maps = await _database!.query('pending_redemptions');
    return maps.map(PendingRedemption.fromMap).toList();
  }

  Future<int> getPendingCount() async {
    if (_database == null) return 0;
    final result = await _database!.rawQuery('SELECT COUNT(*) as count FROM pending_redemptions');
    return result.first['count'] as int;
  }

  Future<void> removePendingRedemption(String bagId) async {
    if (_database == null) return;
    await _database!.delete(
      'pending_redemptions',
      where: 'bagId = ?',
      whereArgs: [bagId],
    );
    notifyListeners();
  }

  Future<void> clearPending() async {
    if (_database == null) return;
    await _database!.delete('pending_redemptions');
    notifyListeners();
  }

  Future<Position?> getCurrentLocation() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.deniedForever) {
        return null;
      }
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      debugPrint('Location error: $e');
      return null;
    }
  }
}
