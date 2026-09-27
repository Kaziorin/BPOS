import 'package:flutter/foundation.dart';
import '../models/retail_product.dart';
import '../models/retail_cart_item.dart';
import '../models/retail_sale.dart';

class RetailProvider extends ChangeNotifier {
  final List<RetailProduct> _allProducts = const [
    RetailProduct(
      id: 'prod-1',
      name: 'Coca-Cola 500ml',
      nameBn: 'কোকা-কোলা ৫০০ মি.লি.',
      unit: '500ml',
      unitBn: '৫০০ মি.লি.',
      price: 45.0,
      costPrice: 35.0,
      stock: 85,
      category: 'Beverages',
      sku: 'BEV-001',
      barcode: '8941100112233',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-2',
      name: 'Pran Mango Juice 1L',
      nameBn: 'প্রাণ ম্যাঙ্গো জুস ১ লিটার',
      unit: '1L',
      unitBn: '১ লিটার',
      price: 95.0,
      costPrice: 75.0,
      stock: 42,
      category: 'Beverages',
      sku: 'BEV-002',
      barcode: '8941100112244',
      imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-3',
      name: 'Lays Classic Chips 50g',
      nameBn: 'লেইস ক্লাসিক চিপস ৫০ গ্রাম',
      unit: '50g',
      unitBn: '৫০ গ্রাম',
      price: 50.0,
      costPrice: 38.0,
      stock: 60,
      category: 'Snacks',
      sku: 'SNK-001',
      barcode: '8941100112255',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-4',
      name: 'Kurkure Masala Munch 100g',
      nameBn: 'কুরকুরে মশলা মাঞ্চ ১০০ গ্রাম',
      unit: '100g',
      unitBn: '১০০ গ্রাম',
      price: 40.0,
      costPrice: 30.0,
      stock: 75,
      category: 'Snacks',
      sku: 'SNK-002',
      barcode: '8941100112266',
      imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-5',
      name: 'Teer Soyabean Oil 1L',
      nameBn: 'তীর সয়াবিন তেল ১ লিটার',
      unit: '1L',
      unitBn: '১ লিটার',
      price: 175.0,
      costPrice: 155.0,
      stock: 30,
      category: 'Grocery',
      sku: 'GRO-001',
      barcode: '8941100112277',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-6',
      name: 'ACI Pure Salt 1kg',
      nameBn: 'এসিআই পিওর লবণ ১ কেজি',
      unit: '1kg',
      unitBn: '১ কেজি',
      price: 42.0,
      costPrice: 32.0,
      stock: 110,
      category: 'Grocery',
      sku: 'GRO-002',
      barcode: '8941100112288',
      imageUrl: 'https://images.unsplash.com/photo-1518110168401-f2877ee2c088?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-7',
      name: 'Miniket Rice 5kg',
      nameBn: 'মিনিকেট চাল ৫ কেজি',
      unit: '5kg',
      unitBn: '৫ কেজি',
      price: 385.0,
      costPrice: 340.0,
      stock: 25,
      category: 'Grocery',
      sku: 'GRO-003',
      barcode: '8941100112299',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-8',
      name: 'Dano Milk Powder 500g',
      nameBn: 'ডানো গুঁড়ো দুধ ৫০০ গ্রাম',
      unit: '500g',
      unitBn: ' ৫০০ গ্রাম',
      price: 440.0,
      costPrice: 390.0,
      stock: 18,
      category: 'Dairy',
      sku: 'DAI-001',
      barcode: '8941100112300',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-9',
      name: 'Milk Vita Pasteurized Milk 1L',
      nameBn: 'মিল্ক ভিটা তরল দুধ ১ লিটার',
      unit: '1L',
      unitBn: '১ লিটার',
      price: 90.0,
      costPrice: 75.0,
      stock: 40,
      category: 'Dairy',
      sku: 'DAI-002',
      barcode: '8941100112311',
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-10',
      name: 'Dove Beauty Soap 100g',
      nameBn: 'ডাব বিউটি সাবান ১০০ গ্রাম',
      unit: '100g',
      unitBn: '১০০ গ্রাম',
      price: 120.0,
      costPrice: 95.0,
      stock: 55,
      category: 'Personal Care',
      sku: 'PER-001',
      barcode: '8941100112322',
      imageUrl: 'https://images.unsplash.com/photo-1607006482172-3ba59d9dd838?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-11',
      name: 'Sunsilk Shampoo 180ml',
      nameBn: 'সানসিল্ক শ্যাম্পু ১৮০ মি.লি.',
      unit: '180ml',
      unitBn: '১৮০ মি.লি.',
      price: 220.0,
      costPrice: 180.0,
      stock: 32,
      category: 'Personal Care',
      sku: 'PER-002',
      barcode: '8941100112333',
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-12',
      name: 'Pepsodent Toothpaste 150g',
      nameBn: 'পেপসোডেন্ট টুথপেস্ট ১৫০ গ্রাম',
      unit: '150g',
      unitBn: '১৫০ গ্রাম',
      price: 110.0,
      costPrice: 85.0,
      stock: 48,
      category: 'Personal Care',
      sku: 'PER-003',
      barcode: '8941100112344',
      imageUrl: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-13',
      name: 'Wheel Washing Powder 1kg',
      nameBn: 'হুইল ডিটারজেন্ট পাউডার ১ কেজি',
      unit: '1kg',
      unitBn: '১ কেজি',
      price: 140.0,
      costPrice: 115.0,
      stock: 50,
      category: 'Household',
      sku: 'HOU-001',
      barcode: '8941100112355',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-14',
      name: 'Harpic Cleaner 500ml',
      nameBn: 'হারপিক লিকুইড ক্লিনার ৫০০ মি.লি.',
      unit: '500ml',
      unitBn: '৫০০ মি.লি.',
      price: 165.0,
      costPrice: 135.0,
      stock: 28,
      category: 'Household',
      sku: 'HOU-002',
      barcode: '8941100112366',
      imageUrl: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-15',
      name: 'Igloo Ice Cream 500ml',
      nameBn: 'ইগলু আইসক্রিম ৫০০ মি.লি.',
      unit: '500ml',
      unitBn: '৫০০ মি.লি.',
      price: 260.0,
      costPrice: 210.0,
      stock: 20,
      category: 'Frozen',
      sku: 'FRZ-001',
      barcode: '8941100112377',
      imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-16',
      name: 'Kazi Chicken Nuggets 250g',
      nameBn: 'কাজী চিকেন নাগেটস ২৫০ গ্রাম',
      unit: '250g',
      unitBn: '২৫০ গ্রাম',
      price: 210.0,
      costPrice: 170.0,
      stock: 15,
      category: 'Frozen',
      sku: 'FRZ-002',
      barcode: '8941100112388',
      imageUrl: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-17',
      name: 'All Time Bread 350g',
      nameBn: 'অল টাইম ফ্যামিলি পাউরুটি ৩৫০ গ্রাম',
      unit: '350g',
      unitBn: '৩৫০ গ্রাম',
      price: 65.0,
      costPrice: 50.0,
      stock: 24,
      category: 'Bakery',
      sku: 'BAK-001',
      barcode: '8941100112399',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-18',
      name: 'Nescafe Coffee 50g',
      nameBn: 'নেসক্যাফে কফি ৫০ গ্রাম',
      unit: '50g',
      unitBn: '৫০ গ্রাম',
      price: 280.0,
      costPrice: 235.0,
      stock: 35,
      category: 'Beverages',
      sku: 'BEV-003',
      barcode: '8941100112400',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    ),
    RetailProduct(
      id: 'prod-19',
      name: 'White Bread',
      nameBn: 'হোয়াইট ব্রেড',
      unit: '350g',
      unitBn: '৩৫০ গ্রাম',
      price: 45.0,
      costPrice: 35.0,
      stock: 119,
      category: 'Bread & Bakery',
      sku: 'BAK-BRD-001',
      barcode: '8941100112411',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-20',
      name: 'Whole Wheat Bread',
      nameBn: 'হোল হুইট ব্রেড',
      unit: '350g',
      unitBn: '৩৫০ গ্রাম',
      price: 55.0,
      costPrice: 42.0,
      stock: 85,
      category: 'Bread & Bakery',
      sku: 'BAK-BRD-002',
      barcode: '8941100112422',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-21',
      name: 'Burger Bun',
      nameBn: 'বার্গার বান',
      unit: 'Pcs',
      unitBn: 'পিস',
      price: 18.0,
      costPrice: 12.0,
      stock: 200,
      category: 'Bread & Bakery',
      sku: 'BAK-BRD-003',
      barcode: '8941100112433',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-22',
      name: 'Croissant',
      nameBn: 'ক্রয়েসেন্ট',
      unit: 'Pcs',
      unitBn: 'পিস',
      price: 60.0,
      costPrice: 45.0,
      stock: 40,
      category: 'Bread & Bakery',
      sku: 'BAK-BRD-004',
      barcode: '8941100112444',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-23',
      name: 'Cake (Vanilla)',
      nameBn: 'কেক (ভ্যানিলা)',
      unit: '500g',
      unitBn: ' ৫০০ গ্রাম',
      price: 350.0,
      costPrice: 270.0,
      stock: 40,
      category: 'Cake & Pastry',
      sku: 'BAK-CKE-001',
      barcode: '8941100112455',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-24',
      name: 'Chocolate Cake',
      nameBn: 'চকলেট কেক',
      unit: '500g',
      unitBn: '৫০০ গ্রাম',
      price: 420.0,
      costPrice: 330.0,
      stock: 25,
      category: 'Cake & Pastry',
      sku: 'BAK-CKE-002',
      barcode: '8941100112466',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-25',
      name: 'Danish Pastry',
      nameBn: 'ড্যানিশ পেস্ট্রি',
      unit: 'Pcs',
      unitBn: 'পিস',
      price: 55.0,
      costPrice: 40.0,
      stock: 45,
      category: 'Cake & Pastry',
      sku: 'BAK-CKE-003',
      barcode: '8941100112477',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-26',
      name: 'Muffin (Blueberry)',
      nameBn: 'মাফিন (ব্লুবেরি)',
      unit: 'Pcs',
      unitBn: 'পিস',
      price: 40.0,
      costPrice: 28.0,
      stock: 55,
      category: 'Cake & Pastry',
      sku: 'BAK-CKE-004',
      barcode: '8941100112488',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-27',
      name: 'Cookies (Choco Chip)',
      nameBn: 'কুকিজ (চকলেট চিপ)',
      unit: '200g',
      unitBn: '২০০ গ্রাম',
      price: 120.0,
      costPrice: 90.0,
      stock: 70,
      category: 'Cookies & Biscuits',
      sku: 'BAK-CKI-001',
      barcode: '8941100112499',
      imageUrl: '',
    ),
    RetailProduct(
      id: 'prod-28',
      name: 'Biscuits (Butter)',
      nameBn: 'বিস্কুট (বাটার)',
      unit: '200g',
      unitBn: '২০০ গ্রাম',
      price: 80.0,
      costPrice: 60.0,
      stock: 90,
      category: 'Cookies & Biscuits',
      sku: 'BAK-CKI-002',
      barcode: '8941100112500',
      imageUrl: '',
    ),
  ];

  late final List<RetailCartItem> _cart = [
    RetailCartItem(product: _allProducts[0], qty: 2),
    RetailCartItem(product: _allProducts[2], qty: 1),
  ];

  final List<HeldRetailSale> _heldSales = [];
  final List<RetailSale> _recentSales = [];

  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _selectedCustomer = 'Walk-in Customer';
  String _paymentMethod = 'CASH';
  String _orderNote = '';
  double _discountTotal = 0.0;
  double _serviceCharge = 0.0;
  final double _taxRate = 0.05; // 5% VAT / Tax

  // Getters
  List<RetailProduct> get allProducts => _allProducts;
  List<RetailCartItem> get cart => _cart;
  List<HeldRetailSale> get heldSales => _heldSales;
  List<RetailSale> get recentSales => _recentSales;
  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  String get selectedCustomer => _selectedCustomer;
  String get paymentMethod => _paymentMethod;
  String get orderNote => _orderNote;
  double get discountTotal => _discountTotal;
  double get serviceCharge => _serviceCharge;

  List<String> get categories => [
        'All',
        'All Products',
        'Beverages',
        'Bread & Bakery',
        'Cake & Pastry',
        'Cookies & Biscuits',
        'Dairy & Egg',
        'Flour & Raw Material',
        'Packaging',
        'Snacks',
        'Grocery',
        'Personal Care',
        'Household',
        'Dairy',
        'Frozen',
      ];

  List<RetailProduct> get filteredProducts {
    return _allProducts.where((p) {
      final matchesSearch = _searchQuery.isEmpty ||
          p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.nameBn.contains(_searchQuery) ||
          p.sku.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.barcode.contains(_searchQuery);
      final matchesCat = _selectedCategory == 'All' ||
          _selectedCategory == 'All Products' ||
          p.category.toLowerCase() == _selectedCategory.toLowerCase();
      return matchesSearch && matchesCat;
    }).toList();
  }

  double get subtotal => _cart.fold(0.0, (sum, item) => sum + item.lineTotal);
  double get taxable => (subtotal - _discountTotal) > 0 ? (subtotal - _discountTotal) : 0.0;
  double get taxTotal => taxable * _taxRate;
  double get total => taxable + taxTotal + _serviceCharge;
  int get totalItemCount => _cart.fold(0, (sum, item) => sum + item.qty);

  // Actions
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setSelectedCategory(String cat) {
    _selectedCategory = cat;
    notifyListeners();
  }

  void setSelectedCustomer(String customer) {
    _selectedCustomer = customer;
    notifyListeners();
  }

  void setPaymentMethod(String method) {
    _paymentMethod = method;
    notifyListeners();
  }

  void setDiscount(double amount) {
    _discountTotal = amount;
    notifyListeners();
  }

  void addToCart(RetailProduct product) {
    final index = _cart.indexWhere((i) => i.product.id == product.id);
    if (index >= 0) {
      _cart[index].qty += 1;
    } else {
      _cart.add(RetailCartItem(product: product, qty: 1));
    }
    notifyListeners();
  }

  void updateQty(int index, int qty) {
    if (index >= 0 && index < _cart.length) {
      if (qty <= 0) {
        _cart.removeAt(index);
      } else {
        _cart[index].qty = qty;
      }
      notifyListeners();
    }
  }

  void removeFromCart(int index) {
    if (index >= 0 && index < _cart.length) {
      _cart.removeAt(index);
      notifyListeners();
    }
  }

  void clearCart() {
    _cart.clear();
    _discountTotal = 0.0;
    _serviceCharge = 0.0;
    notifyListeners();
  }

  void holdSale({String? note}) {
    if (_cart.isEmpty) return;
    final holdId = 'HOLD-${DateTime.now().millisecondsSinceEpoch}';
    final holdNo = '#HOLD-${_heldSales.length + 1}';
    _heldSales.add(HeldRetailSale(
      id: holdId,
      holdNo: holdNo,
      items: List.from(_cart),
      customerName: _selectedCustomer,
      note: note,
      createdAt: DateTime.now(),
    ));
    clearCart();
    notifyListeners();
  }

  void resumeHold(int index) {
    if (index >= 0 && index < _heldSales.length) {
      final hold = _heldSales.removeAt(index);
      _cart.clear();
      _cart.addAll(hold.items);
      _selectedCustomer = hold.customerName;
      notifyListeners();
    }
  }

  void deleteHold(int index) {
    if (index >= 0 && index < _heldSales.length) {
      _heldSales.removeAt(index);
      notifyListeners();
    }
  }

  void setOrderNote(String note) {
    _orderNote = note;
    notifyListeners();
  }

  RetailSale confirmSale({required double paidAmount, String? method}) {
    final finalMethod = method ?? _paymentMethod;
    final changeAmount = paidAmount > total ? paidAmount - total : 0.0;
    final sale = RetailSale(
      id: 'SALE-${DateTime.now().millisecondsSinceEpoch}',
      invoiceNo: 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}',
      items: List.from(_cart),
      subtotal: subtotal,
      discountTotal: _discountTotal,
      taxTotal: taxTotal,
      total: total,
      paidAmount: paidAmount,
      changeAmount: changeAmount,
      paymentMethod: finalMethod,
      customerName: _selectedCustomer,
      createdAt: DateTime.now(),
    );
    _recentSales.insert(0, sale);
    clearCart();
    _orderNote = '';
    notifyListeners();
    return sale;
  }
}
