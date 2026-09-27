class RetailProduct {
  final String id;
  final String name;
  final String nameBn;
  final String unit;
  final String unitBn;
  final double price;
  final double costPrice;
  final int stock;
  final String category;
  final String sku;
  final String barcode;
  final String imageUrl;
  final bool isActive;

  const RetailProduct({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.unit,
    required this.unitBn,
    required this.price,
    required this.costPrice,
    required this.stock,
    required this.category,
    required this.sku,
    required this.barcode,
    required this.imageUrl,
    this.isActive = true,
  });
}
