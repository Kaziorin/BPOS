class GroceryProduct {
  final String id;
  final String name;
  final String nameBn;
  final String unit;
  final String unitBn;
  final double price;
  final String category;
  final String imageUrl;
  final String emoji;
  final ColorHint colorHint;
  final double? offerPercent;
  final int stock;

  const GroceryProduct({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.unit,
    required this.unitBn,
    required this.price,
    required this.category,
    required this.imageUrl,
    required this.emoji,
    this.colorHint = ColorHint.green,
    this.offerPercent,
    this.stock = 100,
  });

  String localizedName(String locale) => locale == 'bn' ? nameBn : name;
  String localizedUnit(String locale) => locale == 'bn' ? unitBn : unit;
}

enum ColorHint { green, red, yellow, orange, brown, blue, purple, teal }
