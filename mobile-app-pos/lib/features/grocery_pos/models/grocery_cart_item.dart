import 'grocery_product.dart';

class GroceryCartItem {
  final GroceryProduct product;
  int quantity;
  double discountPercent;

  GroceryCartItem({
    required this.product,
    this.quantity = 1,
    this.discountPercent = 0.0,
  });

  double get lineSubtotal => product.price * quantity;
  double get lineDiscount => lineSubtotal * (discountPercent / 100);
  double get lineTotal => lineSubtotal - lineDiscount;
}
