import 'package:flutter/material.dart';

class AppConstants {
  static const String appName = 'Agri-Logix SeedTracker';
  static const String version = '1.0.0';
  static const String ussdCode = '*123#';

  static const List<String> seedVarieties = [
    'SC513', 'SC529', 'SC637', 'SC649', 'SC719',
    'SC727', 'SC403', 'SC415', 'Panther', 'Bird',
  ];

  static const Map<String, String> statusLabels = {
    'in_stock': 'In Stock',
    'dispatched': 'Dispatched',
    'redeemed': 'Redeemed',
    'flagged': 'Flagged',
  };

  static const Map<String, Color> statusColors = {
    'in_stock': Color(0xFF1565C0),
    'dispatched': Color(0xFFF9A825),
    'redeemed': Color(0xFF2E7D32),
    'flagged': Color(0xFFC62828),
  };
}
