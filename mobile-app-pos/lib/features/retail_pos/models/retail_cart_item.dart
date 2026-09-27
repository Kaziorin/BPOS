import 'retail_product.dart';

class RetailCartItem {
  final RetailProduct product;
  int qty;
  double discountAmount;

  RetailCartItem({
    required this.product,
    this.qty = 1,
    this.discountAmount = 0.0,
  });

  double get lineTotal => (product.price * qty) - discountAmount;
}
