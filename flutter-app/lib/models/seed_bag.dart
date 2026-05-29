class SeedBag {
  final String bagId;
  final String qrCodeData;
  final String? qrCodeBase64;
  final String variety;
  final String batchNumber;
  final String certificationId;
  final String seedHouseId;
  final String condition;
  final String? dispatchedTo;
  final String? farmerPhone;
  final DateTime? redemptionTimestamp;
  final double? latitude;
  final double? longitude;
  final bool isAuthentic;
  final DateTime createdAt;

  SeedBag({
    required this.bagId,
    required this.qrCodeData,
    this.qrCodeBase64,
    required this.variety,
    required this.batchNumber,
    required this.certificationId,
    required this.seedHouseId,
    required this.condition,
    this.dispatchedTo,
    this.farmerPhone,
    this.redemptionTimestamp,
    this.latitude,
    this.longitude,
    required this.isAuthentic,
    required this.createdAt,
  });

  factory SeedBag.fromMap(String id, Map<String, dynamic> data) {
    return SeedBag(
      bagId: id,
      qrCodeData: data['qrCodeData'] ?? '',
      qrCodeBase64: data['qrCodeBase64'],
      variety: data['variety'] ?? '',
      batchNumber: data['batchNumber'] ?? '',
      certificationId: data['certificationId'] ?? '',
      seedHouseId: data['seedHouseId'] ?? '',
      condition: data['condition'] ?? 'in_stock',
      dispatchedTo: data['dispatchedTo'],
      farmerPhone: data['farmerPhone'],
      redemptionTimestamp: (data['redemptionTimestamp'] as dynamic)?.toDate(),
      latitude: (data['redemptionLocation'] as dynamic)?.latitude,
      longitude: (data['redemptionLocation'] as dynamic)?.longitude,
      isAuthentic: data['isAuthentic'] ?? true,
      createdAt: (data['createdAt'] as dynamic)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'bagId': bagId,
      'qrCodeData': qrCodeData,
      'variety': variety,
      'batchNumber': batchNumber,
      'certificationId': certificationId,
      'seedHouseId': seedHouseId,
      'condition': condition,
      'dispatchedTo': dispatchedTo,
      'farmerPhone': farmerPhone,
      'isAuthentic': isAuthentic,
    };
  }

  String get statusLabel {
    const labels = {
      'in_stock': 'In Stock',
      'dispatched': 'Dispatched',
      'redeemed': 'Redeemed',
      'flagged': 'Flagged',
    };
    return labels[condition] ?? condition;
  }

  bool get isRedeemed => condition == 'redeemed';
  bool get isFlagged => condition == 'flagged' || !isAuthentic;
}

class Farmer {
  final String phoneNumber;
  final String? name;
  final String? ward;
  final DateTime registeredDate;

  Farmer({
    required this.phoneNumber,
    this.name,
    this.ward,
    required this.registeredDate,
  });

  factory Farmer.fromMap(String id, Map<String, dynamic> data) {
    return Farmer(
      phoneNumber: id,
      name: data['name'],
      ward: data['ward'],
      registeredDate:
          (data['registeredDate'] as dynamic)?.toDate() ?? DateTime.now(),
    );
  }
}
