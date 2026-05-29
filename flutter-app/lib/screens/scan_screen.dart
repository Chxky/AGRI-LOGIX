import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../services/database_service.dart';
import '../services/scan_service.dart';
import '../services/auth_service.dart';
import '../models/seed_bag.dart';
import '../utils/theme.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _pinController = TextEditingController();
  bool _processing = false;
  bool _showPinInput = false;
  SeedBag? _scannedBag;
  MobileScannerController? _scannerController;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
    );
  }

  @override
  void dispose() {
    _pinController.dispose();
    _scannerController?.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_processing || _showPinInput) return;

    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    final qrData = barcode!.rawValue!;
    // Extract bagId from agrilogix://verify/{bagId}
    final bagId = qrData.startsWith('agrilogix://verify/')
        ? qrData.substring(18)
        : qrData;

    _lookupBag(bagId);
  }

  Future<void> _lookupBag(String bagId) async {
    setState(() => _processing = true);

    try {
      final dbService = context.read<DatabaseService>();
      final bag = await dbService.getBagDetails(bagId);

      if (bag == null) {
        Fluttertoast.showToast(msg: 'Bag not found in system');
        setState(() => _processing = false);
        return;
      }

      if (bag.isRedeemed) {
        _showBagAlert('Already Redeemed',
          'This bag was already redeemed on ${bag.redemptionTimestamp?.toLocal().toString().substring(0, 10) ?? 'unknown date'}');
        setState(() => _processing = false);
        return;
      }

      if (bag.isFlagged) {
        _showBagAlert('ALERT: Counterfeit',
          'This bag is flagged as potentially counterfeit. DO NOT accept. Contact your extension officer.');
        setState(() => _processing = false);
        return;
      }

      setState(() {
        _scannedBag = bag;
        _showPinInput = true;
        _processing = false;
      });
    } catch (e) {
      Fluttertoast.showToast(msg: 'Error looking up bag');
      setState(() => _processing = false);
    }
  }

  Future<void> _confirmRedemption() async {
    if (_pinController.text.length != 4) {
      Fluttertoast.showToast(msg: 'PIN must be 4 digits');
      return;
    }

    setState(() => _processing = true);

    try {
      final auth = context.read<AuthService>();
      final scanService = context.read<ScanService>();
      final dbService = context.read<DatabaseService>();

      final phoneNumber = auth.user?.email ?? '';
      if (phoneNumber.isEmpty) {
        Fluttertoast.showToast(msg: 'Please log in first');
        setState(() => _processing = false);
        return;
      }

      // Get current location
      final position = await scanService.getCurrentLocation();

      if (scanService.isOnline) {
        await dbService.redeemBag(
          bagId: _scannedBag!.bagId,
          phoneNumber: phoneNumber,
          pin: _pinController.text,
          latitude: position?.latitude,
          longitude: position?.longitude,
          ward: _scannedBag!.dispatchedTo,
        );

        Fluttertoast.showToast(msg: 'Bag redeemed successfully!');
      } else {
        // Save for offline sync
        await scanService.savePendingRedemption(
          PendingRedemption(
            bagId: _scannedBag!.bagId,
            phoneNumber: phoneNumber,
            pin: _pinController.text,
            latitude: position?.latitude,
            longitude: position?.longitude,
            ward: _scannedBag!.dispatchedTo,
          ),
        );

        Fluttertoast.showToast(msg: 'Saved offline. Will sync when online.');
      }

      setState(() {
        _showPinInput = false;
        _scannedBag = null;
        _pinController.clear();
        _processing = false;
      });
    } catch (e) {
      Fluttertoast.showToast(msg: 'Redemption failed: $e');
      setState(() => _processing = false);
    }
  }

  void _showBagAlert(String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() => _processing = false);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan Seed Bag'),
        actions: [
          if (_showPinInput)
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => setState(() {
                _showPinInput = false;
                _scannedBag = null;
                _pinController.clear();
              }),
            ),
        ],
      ),
      body: Column(
        children: [
          // QR Scanner
          if (!_showPinInput)
            Expanded(
              child: Stack(
                children: [
                  MobileScanner(
                    controller: _scannerController,
                    onDetect: _onDetect,
                  ),
                  // Scan overlay
                  Center(
                    child: Container(
                      width: 250,
                      height: 250,
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.primaryGreen, width: 3),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Center(
                        child: Text(
                          'Align QR code here',
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                      ),
                    ),
                  ),
                  if (_processing)
                    const Center(
                      child: CircularProgressIndicator(color: Colors.white),
                    ),
                ],
              ),
            ),

          // PIN Input for confirmation
          if (_showPinInput && _scannedBag != null)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.check_circle, size: 64, color: AppTheme.accentGreen),
                    const SizedBox(height: 16),
                    const Text(
                      'Bag Found!',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    _detailRow('Variety', _scannedBag!.variety),
                    _detailRow('Batch', _scannedBag!.batchNumber),
                    _detailRow('Certification', _scannedBag!.certificationId),
                    _detailRow('Status', _scannedBag!.statusLabel),
                    const SizedBox(height: 24),

                    TextField(
                      controller: _pinController,
                      decoration: const InputDecoration(
                        labelText: 'Enter 4-digit PIN',
                        prefixIcon: Icon(Icons.lock_outlined),
                      ),
                      keyboardType: TextInputType.number,
                      obscureText: true,
                      maxLength: 4,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 24, letterSpacing: 8),
                    ),
                    const SizedBox(height: 16),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _processing ? null : _confirmRedemption,
                        child: _processing
                            ? const SizedBox(
                                width: 24, height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('Confirm Receipt'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$label: ', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(value),
        ],
      ),
    );
  }
}
