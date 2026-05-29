import 'package:flutter/foundation.dart';
import 'scan_service.dart';
import 'database_service.dart';

class SyncService extends ChangeNotifier {
  bool _syncing = false;

  bool get syncing => _syncing;
  int _synced = 0;
  int _failed = 0;

  int get synced => _synced;
  int get failed => _failed;

  Future<SyncResult> syncPending(ScanService scanService, DatabaseService dbService) async {
    if (_syncing) return SyncResult(synced: 0, failed: 0, errors: []);

    _syncing = true;
    _synced = 0;
    _failed = 0;
    notifyListeners();

    final errors = <String>[];
    final pending = await scanService.getPendingRedemptions();

    for (final redemption in pending) {
      try {
        final result = await dbService.redeemBag(
          bagId: redemption.bagId,
          phoneNumber: redemption.phoneNumber,
          pin: redemption.pin,
          latitude: redemption.latitude,
          longitude: redemption.longitude,
          ward: redemption.ward,
        );
        if (result['success'] == true) {
          _synced++;
          await scanService.removePendingRedemption(redemption.bagId);
        } else {
          _failed++;
          errors.add('${redemption.bagId}: ${result['message']}');
        }
      } catch (e) {
        _failed++;
        errors.add('${redemption.bagId}: $e');
      }
    }

    _syncing = false;
    notifyListeners();
    return SyncResult(synced: _synced, failed: _failed, errors: errors);
  }
}

class SyncResult {
  final int synced;
  final int failed;
  final List<String> errors;

  SyncResult({required this.synced, required this.failed, required this.errors});
}
