import 'package:flutter/material.dart';
import '../models/seed_bag.dart';

class BagDetailsScreen extends StatelessWidget {
  final SeedBag bag;

  const BagDetailsScreen({super.key, required this.bag});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bag Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _infoCard('Bag Information', [
              _row('Bag ID', bag.bagId),
              _row('Variety', bag.variety),
              _row('Batch', bag.batchNumber),
              _row('Certification', bag.certificationId),
              _row('Status', bag.statusLabel),
            ]),
            const SizedBox(height: 16),
            _infoCard('Redemption Details', [
              _row('Redeemed At', bag.redemptionTimestamp?.toLocal().toString() ?? 'N/A'),
              _row('Location',
                  bag.latitude != null ? '${bag.latitude!.toStringAsFixed(4)}, ${bag.longitude!.toStringAsFixed(4)}' : 'N/A'),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _infoCard(String title, List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.grey)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
