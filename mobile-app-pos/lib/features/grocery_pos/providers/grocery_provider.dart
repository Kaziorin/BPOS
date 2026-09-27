import 'package:flutter/foundation.dart';
import '../models/grocery_product.dart';
import '../models/grocery_cart_item.dart';
import '../models/grocery_sale.dart';

class GroceryProvider extends ChangeNotifier {
  final List<GroceryProduct> _allProducts = const [
    GroceryProduct(
      id: '1', name: 'Banana', nameBn: 'কলা', unit: '1kg', unitBn: '১ কেজি',
      price: 60.00, category: 'Fruits & Veg', emoji: '🍌',
      imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300',
      colorHint: ColorHint.yellow, stock: 85,
    ),
    GroceryProduct(
      id: '2', name: 'Red Apple', nameBn: 'লাল আপেল', unit: '1kg', unitBn: '১ কেজি',
      price: 180.00, category: 'Fruits & Veg', emoji: '🍎',
      imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300',
      colorHint: ColorHint.red, stock: 42,
    ),
    GroceryProduct(
      id: '3', name: 'Potato', nameBn: 'আলু', unit: '1kg', unitBn: '১ কেজি',
      price: 35.00, category: 'Fruits & Veg', emoji: '🥔',
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300',
      colorHint: ColorHint.brown, stock: 120,
    ),
    GroceryProduct(
      id: '4', name: 'Onion', nameBn: 'পেঁয়াজ', unit: '1kg', unitBn: '১ কেজি',
      price: 55.00, category: 'Fruits & Veg', emoji: '🧅',
      imageUrl: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=300',
      colorHint: ColorHint.purple, stock: 95,
    ),
    GroceryProduct(
      id: '5', name: 'Tomato', nameBn: 'টমেটো', unit: '1kg', unitBn: '১ কেজি',
      price: 45.00, category: 'Fruits & Veg', emoji: '🍅',
      imageUrl: 'https://images.unsplash.com/photo-1546470427-e212b7d31075?w=300',
      colorHint: ColorHint.red, stock: 60,
    ),
    GroceryProduct(
      id: '6', name: 'Cucumber', nameBn: 'শসা', unit: '1kg', unitBn: '১ কেজি',
      price: 40.00, category: 'Fruits & Veg', emoji: '🥒',
      imageUrl: 'https://images.unsplash.com/photo-1449300079323-97d94626e21b?w=300',
      colorHint: ColorHint.green, stock: 38,
    ),
    GroceryProduct(
      id: '7', name: 'Basmati Rice', nameBn: 'বাসমতি চাল', unit: '1kg', unitBn: '১ কেজি',
      price: 120.00, category: 'Grocery', emoji: '🌾',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
      colorHint: ColorHint.yellow, offerPercent: 5, stock: 70,
    ),
    GroceryProduct(
      id: '8', name: 'Sunflower Oil', nameBn: 'সূর্যমুখী তেল', unit: '1L', unitBn: '১ লিটার',
      price: 185.00, category: 'Grocery', emoji: '🫒',
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300',
      colorHint: ColorHint.yellow, offerPercent: 2, stock: 55,
    ),
    GroceryProduct(
      id: '9', name: 'Milk', nameBn: 'দুধ', unit: '1L', unitBn: '১ লিটার',
      price: 70.00, category: 'Dairy', emoji: '🥛',
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300',
      colorHint: ColorHint.blue, stock: 48,
    ),
    GroceryProduct(
      id: '10', name: 'Eggs (Dozen)', nameBn: 'ডিম (ডজন)', unit: '12 pcs', unitBn: '১২ পিস',
      price: 145.00, category: 'Dairy', emoji: '🥚',
      imageUrl: 'https://images.unsplash.com/photo-1582722877114-3ee5b4a0d0e9?w=300',
      colorHint: ColorHint.yellow, stock: 30,
    ),
    GroceryProduct(
      id: '11', name: 'Sugar', nameBn: 'চিনি', unit: '1kg', unitBn: '১ কেজি',
      price: 110.00, category: 'Grocery', emoji: '🧂',
      imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=300',
      colorHint: ColorHint.teal, stock: 80,
    ),
    GroceryProduct(
      id: '12', name: 'Atta', nameBn: 'আটা', unit: '1kg', unitBn: '১ কেজি',
      price: 55.00, category: 'Grocery', emoji: '🌾',
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300',
      colorHint: ColorHint.brown, stock: 65,
    ),
    GroceryProduct(
      id: '13', name: 'Lays Classic', nameBn: 'লেইস ক্লাসিক', unit: '52g', unitBn: '৫২ গ্রাম',
      price: 30.00, category: 'Snacks', emoji: '🥔',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-ed9699f0c1e4?w=300',
      colorHint: ColorHint.yellow, stock: 90,
    ),
    GroceryProduct(
      id: '14', name: 'Coca-Cola', nameBn: 'কোকা-কোলা', unit: '1.25L', unitBn: '১.২৫ লিটার',
      price: 65.00, category: 'Beverages', emoji: '🥤',
      imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=300',
      colorHint: ColorHint.red, stock: 75,
    ),
    GroceryProduct(
      id: '15', name: 'Nescafe', nameBn: 'নেসক্যাফে', unit: '50g', unitBn: '৫০ গ্রাম',
      price: 220.00, category: 'Beverages', emoji: '☕',
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300',
      colorHint: ColorHint.brown, offerPercent: 10, stock: 25,
    ),
    GroceryProduct(
      id: '16', name: 'Surf Excel', nameBn: 'সার্ফ এক্সেল', unit: '1kg', unitBn: '১ কেজি',
      price: 180.00, category: 'Household', emoji: '🧴',
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300',
      colorHint: ColorHint.blue, stock: 40,
    ),
    GroceryProduct(
      id: '17', name: 'Toilet Tissue', nameBn: 'টয়লেট টিস্যু', unit: '4 rolls', unitBn: '৪ রোল',
      price: 95.00, category: 'Household', emoji: '🧻',
      imageUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=300',
      colorHint: ColorHint.teal, stock: 50,
    ),
    GroceryProduct(
      id: '18', name: 'Detergent', nameBn: 'ডিটারজেন্ট', unit: '500g', unitBn: '৫০০ গ্রাম',
      price: 85.00, category: 'Household', emoji: '🫧',
      imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=300',
      colorHint: ColorHint.blue, stock: 35,
    ),
  ];

  static const List<GroceryCustomer> customers = [
    GroceryCustomer(id: 'c0', name: 'Walk-in Customer', nameBn: 'ওয়াক-ইন কাস্টমার', phone: '—', loyaltyPoints: 0),
    GroceryCustomer(id: 'c1', name: 'Rahim Uddin', nameBn: 'রহিম উদ্দিন', phone: '01711-234567', loyaltyPoints: 120),
    GroceryCustomer(id: 'c2', name: 'Fatima Begum', nameBn: 'ফাতেমা বেগম', phone: '01812-345678', loyaltyPoints: 85),
    GroceryCustomer(id: 'c3', name: 'Karim Ahmed', nameBn: 'করিম আহমেদ', phone: '01913-456789', loyaltyPoints: 210),
    GroceryCustomer(id: 'c4', name: 'Sumaiya Akter', nameBn: 'সুমাইয়া আক্তার', phone: '01614-567890', loyaltyPoints: 45),
  ];

  String _searchQuery = '';
  String _selectedCategory = 'All Items';
  String _selectedPayment = 'Cash';
  String _numpadValue = '';
  String _couponCode = '';
  String _salesNote = '';
  String? _appliedCoupon;
  double _billDiscountPercent = 0.0;
  String _invoiceNo = 'INV-250520-0012';
  int _invoiceSeq = 12;
  GroceryCustomer _customer = customers[0];

  late final List<GroceryCartItem> _cart;
  final List<HeldBill> _heldBills = [];
  final List<CompletedSale> _completedSales = [];
  final List<GroceryProduct> _recentProducts = [];

  GroceryProvider() {
    _cart = [
      GroceryCartItem(product: _allProducts[6], quantity: 1, discountPercent: 5),
      GroceryCartItem(product: _allProducts[7], quantity: 1, discountPercent: 2),
      GroceryCartItem(product: _allProducts[8], quantity: 2),
      GroceryCartItem(product: _allProducts[9], quantity: 1),
      GroceryCartItem(product: _allProducts[12], quantity: 1),
      GroceryCartItem(product: _allProducts[13], quantity: 1),
      GroceryCartItem(product: _allProducts[15], quantity: 1),
    ];
    _customer = customers[1];
  }

  List<GroceryProduct> get allProducts => List.unmodifiable(_allProducts);

  List<GroceryProduct> get filteredProducts {
    var list = _allProducts.toList();
    if (_selectedCategory != 'All Items') {
      list = list.where((p) => p.category == _selectedCategory).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((p) =>
          p.name.toLowerCase().contains(q) ||
          p.nameBn.contains(q) ||
          p.unit.toLowerCase().contains(q) ||
          p.id.contains(q)).toList();
    }
    return list;
  }

  List<GroceryProduct> get offerProducts =>
      _allProducts.where((p) => (p.offerPercent ?? 0) > 0).toList();

  List<GroceryProduct> get lowStockProducts =>
      _allProducts.where((p) => p.stock < 40).toList();

  List<GroceryProduct> get recentProducts =>
      _recentProducts.isEmpty ? _allProducts.take(6).toList() : List.unmodifiable(_recentProducts);

  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  String get selectedPayment => _selectedPayment;
  String get numpadValue => _numpadValue;
  String get couponCode => _couponCode;
  String? get appliedCoupon => _appliedCoupon;
  String get salesNote => _salesNote;
  double get billDiscountPercent => _billDiscountPercent;
  String get invoiceNo => _invoiceNo;
  int get loyaltyPoints => _customer.loyaltyPoints;
  String get customerName => _customer.name;
  GroceryCustomer get customer => _customer;
  List<GroceryCartItem> get cart => _cart;
  List<HeldBill> get heldBills => List.unmodifiable(_heldBills);
  List<CompletedSale> get completedSales => List.unmodifiable(_completedSales);

  int get totalItems => _cart.length;
  int get totalQty => _cart.fold(0, (s, i) => s + i.quantity);

  double get itemsSubtotal => _cart.fold(0.0, (s, i) => s + i.lineSubtotal);
  double get itemsDiscount => _cart.fold(0.0, (s, i) => s + i.lineDiscount);
  double get billDiscount =>
      (itemsSubtotal - itemsDiscount) * (_billDiscountPercent / 100);
  double get totalDiscount => itemsDiscount + billDiscount;
  double get subtotal => itemsSubtotal;
  double get vat => 0.0;
  double get grandTotal => itemsSubtotal - totalDiscount + vat;
  double get totalSavings => totalDiscount;

  void setSearchQuery(String q) {
    _searchQuery = q;
    notifyListeners();
  }

  void setCategory(String c) {
    _selectedCategory = c;
    notifyListeners();
  }

  void setPayment(String p) {
    _selectedPayment = p;
    notifyListeners();
  }

  void setCouponCode(String c) {
    _couponCode = c;
    notifyListeners();
  }

  void setSalesNote(String n) {
    _salesNote = n;
    notifyListeners();
  }

  void setCustomer(GroceryCustomer c) {
    _customer = c;
    notifyListeners();
  }

  void applyBillDiscount(double percent) {
    _billDiscountPercent = percent.clamp(0, 100);
    notifyListeners();
  }

  bool applyCouponCode(String code) {
    final c = code.trim().toUpperCase();
    if (c == 'SAVE10') {
      _couponCode = c;
      _appliedCoupon = c;
      _billDiscountPercent = 10;
      notifyListeners();
      return true;
    }
    if (c == 'FRESH5') {
      _couponCode = c;
      _appliedCoupon = c;
      _billDiscountPercent = 5;
      notifyListeners();
      return true;
    }
    if (c == 'WELCOME20') {
      _couponCode = c;
      _appliedCoupon = c;
      _billDiscountPercent = 20;
      notifyListeners();
      return true;
    }
    return false;
  }

  void applyCoupon() => applyCouponCode(_couponCode);

  void addToCart(GroceryProduct product) {
    final idx = _cart.indexWhere((i) => i.product.id == product.id);
    if (idx >= 0) {
      _cart[idx].quantity++;
    } else {
      _cart.add(GroceryCartItem(
        product: product,
        discountPercent: product.offerPercent ?? 0,
      ));
    }
    _recentProducts.removeWhere((p) => p.id == product.id);
    _recentProducts.insert(0, product);
    if (_recentProducts.length > 8) _recentProducts.removeLast();
    notifyListeners();
  }

  void updateQuantity(String id, int change) {
    final idx = _cart.indexWhere((i) => i.product.id == id);
    if (idx < 0) return;
    _cart[idx].quantity += change;
    if (_cart[idx].quantity <= 0) _cart.removeAt(idx);
    notifyListeners();
  }

  void setQuantity(String id, int qty) {
    final idx = _cart.indexWhere((i) => i.product.id == id);
    if (idx < 0) return;
    if (qty <= 0) {
      _cart.removeAt(idx);
    } else {
      _cart[idx].quantity = qty;
    }
    notifyListeners();
  }

  void removeItem(String id) {
    _cart.removeWhere((i) => i.product.id == id);
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _billDiscountPercent = 0;
    _couponCode = '';
    _appliedCoupon = null;
    _salesNote = '';
    _numpadValue = '';
    notifyListeners();
  }

  void numpadPress(String key) {
    if (key == 'C') {
      _numpadValue = '';
    } else if (key == '⌫') {
      if (_numpadValue.isNotEmpty) {
        _numpadValue = _numpadValue.substring(0, _numpadValue.length - 1);
      }
    } else {
      if (_numpadValue.length < 10) _numpadValue += key;
    }
    notifyListeners();
  }

  void clearNumpad() {
    _numpadValue = '';
    notifyListeners();
  }

  /// Apply numpad value as quantity to the last cart item.
  bool applyNumpadAsQty() {
    if (_cart.isEmpty || _numpadValue.isEmpty) return false;
    final qty = int.tryParse(_numpadValue);
    if (qty == null || qty <= 0) return false;
    _cart.last.quantity = qty;
    _numpadValue = '';
    notifyListeners();
    return true;
  }

  GroceryProduct? findByBarcodeOrId(String code) {
    final q = code.trim().toLowerCase();
    if (q.isEmpty) return null;
    try {
      return _allProducts.firstWhere(
        (p) => p.id == q || p.name.toLowerCase() == q || '890100${p.id.padLeft(6, '0')}' == q,
      );
    } catch (_) {
      return null;
    }
  }

  // ── Hold / Recall ──────────────────────────────────────────
  bool holdCurrentBill() {
    if (_cart.isEmpty) return false;
    final id = 'HOLD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    _heldBills.insert(
      0,
      HeldBill(
        id: id,
        customerName: _customer.name,
        items: _cart
            .map((i) => GroceryCartItem(
                  product: i.product,
                  quantity: i.quantity,
                  discountPercent: i.discountPercent,
                ))
            .toList(),
        billDiscountPercent: _billDiscountPercent,
        couponCode: _couponCode,
        salesNote: _salesNote,
        timestamp: DateTime.now(),
      ),
    );
    clearCart();
    return true;
  }

  void recallBill(HeldBill bill) {
    _cart
      ..clear()
      ..addAll(bill.items.map((i) => GroceryCartItem(
            product: i.product,
            quantity: i.quantity,
            discountPercent: i.discountPercent,
          )));
    _billDiscountPercent = bill.billDiscountPercent;
    _couponCode = bill.couponCode;
    _appliedCoupon = bill.couponCode.isEmpty ? null : bill.couponCode;
    _salesNote = bill.salesNote;
    _heldBills.removeWhere((h) => h.id == bill.id);
    notifyListeners();
  }

  void deleteHeldBill(String id) {
    _heldBills.removeWhere((h) => h.id == id);
    notifyListeners();
  }

  // ── Complete Sale ─────────────────────────────────────────
  CompletedSale placeSale({
    required String paymentMethod,
    double cashTendered = 0,
  }) {
    _invoiceSeq++;
    final now = DateTime.now();
    final inv =
        'INV-${now.year.toString().substring(2)}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}-${_invoiceSeq.toString().padLeft(4, '0')}';
    _invoiceNo = inv;

    final sale = CompletedSale(
      id: 'SALE-${now.millisecondsSinceEpoch.toString().substring(6)}',
      invoiceNo: inv,
      customerName: _customer.name,
      items: _cart
          .map((i) => GroceryCartItem(
                product: i.product,
                quantity: i.quantity,
                discountPercent: i.discountPercent,
              ))
          .toList(),
      subtotal: subtotal,
      discount: totalDiscount,
      vat: vat,
      total: grandTotal,
      paymentMethod: paymentMethod,
      cashTendered: cashTendered,
      change: cashTendered > grandTotal ? cashTendered - grandTotal : 0,
      salesNote: _salesNote,
      timestamp: now,
    );

    _completedSales.insert(0, sale);
    // Award loyalty points (~1 pt per 10 taka)
    if (_customer.id != 'c0') {
      final pts = (sale.total / 10).floor();
      final updated = GroceryCustomer(
        id: _customer.id,
        name: _customer.name,
        nameBn: _customer.nameBn,
        phone: _customer.phone,
        loyaltyPoints: _customer.loyaltyPoints + pts,
      );
      _customer = updated;
    }
    clearCart();
    return sale;
  }
}
