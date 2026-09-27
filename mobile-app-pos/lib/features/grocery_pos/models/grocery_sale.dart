import 'grocery_cart_item.dart';

class HeldBill {
  final String id;
  final String customerName;
  final List<GroceryCartItem> items;
  final double billDiscountPercent;
  final String couponCode;
  final String salesNote;
  final DateTime timestamp;

  HeldBill({
    required this.id,
    required this.customerName,
    required this.items,
    this.billDiscountPercent = 0,
    this.couponCode = '',
    this.salesNote = '',
    required this.timestamp,
  });

  double get subtotal => items.fold(0.0, (s, i) => s + i.lineSubtotal);
  double get itemsDiscount => items.fold(0.0, (s, i) => s + i.lineDiscount);
  double get billDiscount =>
      (subtotal - itemsDiscount) * (billDiscountPercent / 100);
  double get total => subtotal - itemsDiscount - billDiscount;
  int get itemCount => items.length;
}

class CompletedSale {
  final String id;
  final String invoiceNo;
  final String customerName;
  final List<GroceryCartItem> items;
  final double subtotal;
  final double discount;
  final double vat;
  final double total;
  final String paymentMethod;
  final double cashTendered;
  final double change;
  final String salesNote;
  final DateTime timestamp;

  CompletedSale({
    required this.id,
    required this.invoiceNo,
    required this.customerName,
    required this.items,
    required this.subtotal,
    required this.discount,
    required this.vat,
    required this.total,
    required this.paymentMethod,
    this.cashTendered = 0,
    this.change = 0,
    this.salesNote = '',
    required this.timestamp,
  });
}

class GroceryCustomer {
  final String id;
  final String name;
  final String nameBn;
  final String phone;
  final int loyaltyPoints;

  const GroceryCustomer({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.phone,
    this.loyaltyPoints = 0,
  });

  String localizedName(String locale) => locale == 'bn' ? nameBn : name;
}
