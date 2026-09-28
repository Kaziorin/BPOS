class MedicineModel {
  final String id;
  final String name;
  final String genericName;
  final double price;
  final String category;
  final String imagePath;
  final int stock;
  final bool isRx;
  final int? alternatives;
  final bool isExpiringSoon;
  final double? discountPercentage;
  final String manufacturer;
  final String dosageForm;
  final String batchNumber;
  final String expiryDate;
  final String barcode;

  const MedicineModel({
    required this.id,
    required this.name,
    required this.genericName,
    required this.price,
    required this.category,
    required this.imagePath,
    this.stock = 0,
    this.isRx = false,
    this.alternatives,
    this.isExpiringSoon = false,
    this.discountPercentage,
    this.manufacturer = 'Square Pharmaceuticals',
    this.dosageForm = 'Tablet',
    this.batchNumber = 'B-2409',
    this.expiryDate = '12/2027',
    this.barcode = '',
  });

  bool get isLowStock => stock < 20;

  MedicineModel copyWith({
    String? id,
    String? name,
    String? genericName,
    double? price,
    String? category,
    String? imagePath,
    int? stock,
    bool? isRx,
    int? alternatives,
    bool? isExpiringSoon,
    double? discountPercentage,
    String? manufacturer,
    String? dosageForm,
    String? batchNumber,
    String? expiryDate,
    String? barcode,
  }) {
    return MedicineModel(
      id: id ?? this.id,
      name: name ?? this.name,
      genericName: genericName ?? this.genericName,
      price: price ?? this.price,
      category: category ?? this.category,
      imagePath: imagePath ?? this.imagePath,
      stock: stock ?? this.stock,
      isRx: isRx ?? this.isRx,
      alternatives: alternatives ?? this.alternatives,
      isExpiringSoon: isExpiringSoon ?? this.isExpiringSoon,
      discountPercentage: discountPercentage ?? this.discountPercentage,
      manufacturer: manufacturer ?? this.manufacturer,
      dosageForm: dosageForm ?? this.dosageForm,
      batchNumber: batchNumber ?? this.batchNumber,
      expiryDate: expiryDate ?? this.expiryDate,
      barcode: barcode ?? this.barcode,
    );
  }
}
