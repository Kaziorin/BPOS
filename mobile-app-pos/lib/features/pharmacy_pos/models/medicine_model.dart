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
  });

  bool get isLowStock => stock < 20;
}
