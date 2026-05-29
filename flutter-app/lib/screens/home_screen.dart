import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/scan_service.dart';
import '../services/sync_service.dart';
import '../utils/theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    final scanService = context.watch<ScanService>();
    final syncService = context.watch<SyncService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Agri-Logix'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              auth.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, ${auth.user?.email ?? 'Farmer'}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'Pfumvudza Seed Verification',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),

            // Online/Offline Status
            Card(
              child: ListTile(
                leading: Icon(
                  scanService.isOnline ? Icons.cloud_done : Icons.cloud_off,
                  color: scanService.isOnline ? AppTheme.accentGreen : AppTheme.errorRed,
                  size: 32,
                ),
                title: Text(scanService.isOnline ? 'Online' : 'Offline'),
                subtitle: Text(
                  scanService.isOnline
                      ? 'Scans will be verified immediately'
                      : 'Scans saved locally, sync when online',
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Sync pending count
            FutureBuilder<int>(
              future: scanService.getPendingCount(),
              builder: (context, snapshot) {
                final count = snapshot.data ?? 0;
                if (count == 0) return const SizedBox.shrink();
                return Card(
                  color: AppTheme.warningAmber.withValues(alpha: 0.1),
                  child: ListTile(
                    leading: const Icon(Icons.sync, color: AppTheme.warningAmber),
                    title: Text('$count pending redemptions'),
                    subtitle: const Text('Tap to sync when online'),
                    trailing: syncService.syncing
                        ? const SizedBox(
                            width: 24, height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : TextButton(
                            onPressed: scanService.isOnline
                                ? () async {
                                    if (!context.mounted) return;
                                    final result = await syncService.syncPending(
                                      scanService,
                                      context.read(),
                                    );
                                    if (!context.mounted) return;
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Synced: ${result.synced}, Failed: ${result.failed}'),
                                      ),
                                    );
                                  }
                                : null,
                            child: const Text('Sync Now'),
                          ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // Quick Actions Grid
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _ActionCard(
                    icon: Icons.qr_code_scanner,
                    label: 'Scan Seed Bag',
                    color: AppTheme.primaryGreen,
                    onTap: () => Navigator.pushNamed(context, '/scan'),
                  ),
                  _ActionCard(
                    icon: Icons.history,
                    label: 'My History',
                    color: AppTheme.accentGreen,
                    onTap: () => Navigator.pushNamed(context, '/history'),
                  ),
                  _ActionCard(
                    icon: Icons.info_outline,
                    label: 'Check Status',
                    color: const Color(0xFF1565C0),
                    onTap: () => _showStatusDialog(context),
                  ),
                  _ActionCard(
                    icon: Icons.phone_android,
                    label: 'USSD Info',
                    color: const Color(0xFF6A1B9A),
                    onTap: () => _showUssdInfo(context),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showStatusDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Check Bag Status'),
        content: const Text(
          'Dial *123# from your phone to check the status of any seed bag using USSD.\n\n'
          'Option 2: Check Bag Status\n'
          'Enter the bag QR code when prompted.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showUssdInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('USSD Access'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Dial *123# from any phone:'),
            const SizedBox(height: 12),
            _ussdItem('1', 'Redeem Seed Bag'),
            _ussdItem('2', 'Check Bag Status'),
            _ussdItem('3', 'Register as Farmer'),
            _ussdItem('4', 'My History'),
            const SizedBox(height: 12),
            Text('Works on all networks. No data required.',
              style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Widget _ussdItem(String num, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 24, height: 24,
            decoration: const BoxDecoration(
              color: AppTheme.primaryGreen,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(num,
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 12),
          Text(label),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 48, color: color),
              const SizedBox(height: 12),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
