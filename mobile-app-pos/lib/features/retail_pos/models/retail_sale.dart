import 'retail_cart_item.dart';

class RetailSale {
  final String id;
  final String invoiceNo;
  final List<RetailCartItem> items;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double total;
  final double paidAmount;
  final double changeAmount;
  final String paymentMethod;
  final String customerName;
  final DateTime createdAt;

  const RetailSale({
    required this.id,
    required this.invoiceNo,
    required this.items,
    required this.subtotal,
    required this.discountTotal,
    required this.taxTotal,
    required this.total,
    required this.paidAmount,
    required this.changeAmount,
    required this.paymentMethod,
    required this.customerName,
    required this.createdAt,
  });
}

class HeldRetailSale {
  final String id;
  final String holdNo;
  final List<RetailCartItem> items;
  final String customerName;
  final String? note;
  final DateTime createdAt;

  const HeldRetailSale({
    required this.id,
    required this.holdNo,
    required this.items,
    required this.customerName,
    this.note,
    required this.createdAt,
  });
}
