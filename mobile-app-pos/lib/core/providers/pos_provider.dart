import 'package:flutter/material.dart';
import '../models/menu_item.dart';
import '../services/api_service.dart';

class POSProvider extends ChangeNotifier {
  String _selectedCategory = 'all';
  String _selectedOrderType = 'dine_in';
  String _viewMode = 'grid'; // grid or list
  String _searchQuery = '';
  
  String _tableNumber = 'T-05';
  int _guests = 4;
  String _waiterKey = 'waiter_1';
  
  List<CartItem> _cartItems = [];
  bool _isOrderSummaryVisible = true;

  // Notes & Discounts
  String _orderNote = '';
  String _kitchenNote = '';
  double _discountPercent = 0.0;
  double _discountAmount = 0.0;
  String? _appliedCoupon;

  // Live Backend Products
  List<MenuItem> _liveMenuItems = [];
  bool _isLoadingProducts = false;
  String _currentBusinessType = 'restaurant';

  bool get isLoadingProducts => _isLoadingProducts;
  List<MenuItem> get liveMenuItems => _liveMenuItems;

  Future<void> loadProducts({String businessType = 'restaurant'}) async {
    _currentBusinessType = businessType;
    _isLoadingProducts = true;
    notifyListeners();

    try {
      final systemTax = await ApiService.instance.fetchDefaultTaxRate(businessType: businessType);
      _taxRate = systemTax;
      final rawList = await ApiService.instance.fetchProducts(businessType: businessType);
      if (rawList.isNotEmpty) {
        _liveMenuItems = rawList.asMap().entries.map((entry) {
          return MenuItem.fromApiJson(entry.value, entry.key + 1);
        }).toList();
      }
    } catch (e) {
      debugPrint('Error loading POS products: $e');
    } finally {
      _isLoadingProducts = false;
      notifyListeners();
    }
  }

  // Held & Completed Orders
  final List<HeldOrder> _heldOrders = [];
  final List<CompletedOrder> _completedOrders = [];

  // Available coupons
  static final List<CouponModel> availableCoupons = [
    const CouponModel(
      code: 'SAVE10',
      description: 'Get 10% OFF on all menu items',
      discountPercentage: 10.0,
    ),
    const CouponModel(
      code: 'FEAST20',
      description: 'Get 20% OFF on orders over ৳25',
      discountPercentage: 20.0,
    ),
    const CouponModel(
      code: 'WELCOME5',
      description: '৳5.00 Flat Discount',
      fixedDiscountAmount: 5.0,
    ),
  ];

  POSProvider() {
    _cartItems = [];
    loadProducts(businessType: 'restaurant');
  }

  bool _isMobileSearchOpen = false;

  // Getters
  String get selectedCategory => _selectedCategory;
  String get selectedOrderType => _selectedOrderType;
  String get viewMode => _viewMode;
  String get searchQuery => _searchQuery;
  bool get isMobileSearchOpen => _isMobileSearchOpen;
  
  void toggleMobileSearch() {
    _isMobileSearchOpen = !_isMobileSearchOpen;
    if (!_isMobileSearchOpen) {
      _searchQuery = '';
    }
    notifyListeners();
  }

  void setMobileSearchOpen(bool open) {
    _isMobileSearchOpen = open;
    if (!open) {
      _searchQuery = '';
    }
    notifyListeners();
  }
  
  String get tableNumber => _tableNumber;
  int get guests => _guests;
  String get waiterKey => _waiterKey;
  
  List<CartItem> get cartItems => _cartItems;
  bool get isOrderSummaryVisible => _isOrderSummaryVisible;

  String get orderNote => _orderNote;
  String get kitchenNote => _kitchenNote;
  double get discountPercent => _discountPercent;
  double get discountAmount => _discountAmount;
  String? get appliedCoupon => _appliedCoupon;

  List<HeldOrder> get heldOrders => List.unmodifiable(_heldOrders);
  List<CompletedOrder> get completedOrders => List.unmodifiable(_completedOrders);

  List<MenuItem> get filteredMenuItems {
    List<MenuItem> items = _liveMenuItems.isNotEmpty ? _liveMenuItems : AppData.menuItems;
    
    // ক্যাটাগরি ফিল্টার
    if (_selectedCategory == 'popular') {
      final popItems = items.where((item) => item.isPopular).toList();
      items = popItems.isNotEmpty ? popItems : items;
    } else if (_selectedCategory != 'all') {
      final catFiltered = items.where((item) =>
          item.category.toLowerCase() == _selectedCategory.toLowerCase() ||
          item.category.toLowerCase().contains(_selectedCategory.toLowerCase()) ||
          _selectedCategory.toLowerCase().contains(item.category.toLowerCase())
      ).toList();
      if (catFiltered.isNotEmpty || _liveMenuItems.isEmpty) {
        items = catFiltered;
      }
    }
    
    // সার্চ ফিল্টার (ইংরেজি ও বাংলা উভয় নামেই সার্চ হবে)
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      items = items.where((item) =>
          item.name.toLowerCase().contains(query) ||
          item.nameBn.toLowerCase().contains(query) ||
          item.sku.toLowerCase().contains(query)
      ).toList();
    }
    return items;
  }

  // Calculations
  double get subtotal =>
      _cartItems.fold(0, (sum, item) => sum + item.totalPrice);

  double get discountValue {
    double percentDiscount = (subtotal * _discountPercent) / 100.0;
    double totalDisc = percentDiscount + _discountAmount;
    return totalDisc > subtotal ? subtotal : totalDisc;
  }

  double _taxRate = 0.15;
  double _serviceChargePercent = 3.0;

  double get subtotalAfterDiscount => subtotal - discountValue;

  double get taxRatePct => _taxRate * 100;
  double get serviceChargePercent => _serviceChargePercent;
  double get tax => subtotalAfterDiscount * _taxRate;
  double get serviceCharge => subtotalAfterDiscount * (_serviceChargePercent / 100.0);
  double get totalPayable => subtotalAfterDiscount + tax + serviceCharge;
  int get totalItemCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);

  void setServiceChargePercent(double pct) {
    _serviceChargePercent = pct;
    notifyListeners();
  }

  Future<bool> sendKotToKitchen() async {
    if (_cartItems.isEmpty) return false;
    final itemsPayload = _cartItems.map((ci) => {
      'productId': ci.menuItem.id,
      'name': ci.menuItem.name,
      'qty': ci.quantity,
      'notes': ci.note,
      'modifiers': ci.modifiers,
    }).toList();

    final notes = _orderNote.isNotEmpty
        ? '$_orderNote | Table: $_tableNumber | Waiter: $_waiterKey'
        : 'Table: $_tableNumber | Waiter: $_waiterKey';

    await ApiService.instance.sendRestaurantKot(
      items: itemsPayload,
      tableId: _tableNumber,
      orderType: _selectedOrderType,
      notes: notes,
    );

    _orderNote = '';
    notifyListeners();
    return true;
  }

  // Setters & Actions
  void selectCategory(String categoryId) {
    _selectedCategory = categoryId;
    notifyListeners();
  }

  void selectOrderType(String orderType) {
    _selectedOrderType = orderType;
    notifyListeners();
  }

  void setViewMode(String mode) {
    _viewMode = mode;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void selectTable(String table) {
    _tableNumber = table;
    notifyListeners();
  }

  void selectWaiter(String waiterKey) {
    _waiterKey = waiterKey;
    notifyListeners();
  }

  void setGuests(int count) {
    if (count >= 1) {
      _guests = count;
      notifyListeners();
    }
  }

  void incrementGuests() {
    _guests++;
    notifyListeners();
  }

  void decrementGuests() {
    if (_guests > 1) {
      _guests--;
      notifyListeners();
    }
  }

  void addToCart(MenuItem item, {List<String>? selectedModifiers, double extraPrice = 0.0, String note = ''}) {
    // If it has modifiers, we look for an exact match or add new
    final existingIndex = _cartItems.indexWhere((c) => 
      c.menuItem.id == item.id && 
      _listEquals(c.modifiers, selectedModifiers ?? []) &&
      c.note == note
    );

    if (existingIndex != -1) {
      _cartItems[existingIndex].quantity++;
    } else {
      _cartItems.add(CartItem(
        menuItem: item,
        modifiers: selectedModifiers ?? [],
        extraPricePerUnit: extraPrice,
        note: note,
      ));
    }
    notifyListeners();
  }

  bool _listEquals(List<String> a, List<String> b) {
    if (a.length != b.length) return false;
    for (int i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }

  void removeFromCart(CartItem item) {
    _cartItems.remove(item);
    notifyListeners();
  }

  void incrementQuantity(CartItem item) {
    item.quantity++;
    notifyListeners();
  }

  void decrementQuantity(CartItem item) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      _cartItems.remove(item);
    }
    notifyListeners();
  }

  // ID-based methods for simple grid interactions (affects base item with no modifiers or first found)
  void incrementById(int itemId) {
    final index = _cartItems.indexWhere((c) => c.menuItem.id == itemId);
    if (index != -1) {
      _cartItems[index].quantity++;
      notifyListeners();
    }
  }

  void decrementById(int itemId) {
    final index = _cartItems.indexWhere((c) => c.menuItem.id == itemId);
    if (index != -1) {
      if (_cartItems[index].quantity > 1) {
        _cartItems[index].quantity--;
      } else {
        _cartItems.removeAt(index);
      }
      notifyListeners();
    }
  }




  void clearCart() {
    _cartItems.clear();
    _discountPercent = 0.0;
    _discountAmount = 0.0;
    _appliedCoupon = null;
    _orderNote = '';
    _kitchenNote = '';
    notifyListeners();
  }

  void toggleOrderSummary() {
    _isOrderSummaryVisible = !_isOrderSummaryVisible;
    notifyListeners();
  }

  bool isInCart(int itemId) {
    return _cartItems.any((c) => c.menuItem.id == itemId);
  }

  int getQuantity(int itemId) {
    final index = _cartItems.indexWhere((c) => c.menuItem.id == itemId);
    return index != -1 ? _cartItems[index].quantity : 0;
  }

  // Notes
  void setOrderNote(String note) {
    _orderNote = note;
    notifyListeners();
  }

  void setKitchenNote(String note) {
    _kitchenNote = note;
    notifyListeners();
  }

  // Coupons & Discounts
  bool applyCoupon(String code) {
    final cleanCode = code.trim().toUpperCase();
    final found = availableCoupons.firstWhere(
      (c) => c.code == cleanCode,
      orElse: () => const CouponModel(code: '', description: ''),
    );

    if (found.code.isNotEmpty) {
      _appliedCoupon = found.code;
      if (found.fixedDiscountAmount != null) {
        _discountAmount = found.fixedDiscountAmount!;
        _discountPercent = 0.0;
      } else {
        _discountPercent = found.discountPercentage;
        _discountAmount = 0.0;
      }
      notifyListeners();
      return true;
    }
    return false;
  }

  void removeCoupon() {
    _appliedCoupon = null;
    _discountPercent = 0.0;
    _discountAmount = 0.0;
    notifyListeners();
  }

  void applyDiscount({double? percent, double? amount}) {
    if (percent != null) {
      _discountPercent = percent;
      _discountAmount = 0.0;
      _appliedCoupon = 'Custom ${percent.toStringAsFixed(0)}%';
    } else if (amount != null) {
      _discountAmount = amount;
      _discountPercent = 0.0;
      _appliedCoupon = 'Custom ৳${amount.toStringAsFixed(2)}';
    }
    notifyListeners();
  }

  // Custom Item
  void addCustomItem(MenuItem newItem) {
    AppData.menuItems.add(newItem);
    addToCart(newItem);
  }

  // Hold & Recall
  bool holdCurrentOrder() {
    if (_cartItems.isEmpty) return false;

    final id = 'HOLD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    final heldOrder = HeldOrder(
      id: id,
      tableNumber: _tableNumber,
      waiter: _waiterKey,
      guests: _guests,
      orderType: _selectedOrderType,
      items: List.from(_cartItems),
      note: _orderNote,
      timestamp: DateTime.now(),
    );

    _heldOrders.insert(0, heldOrder);
    _cartItems.clear();
    _orderNote = '';
    _kitchenNote = '';
    _discountPercent = 0.0;
    _discountAmount = 0.0;
    _appliedCoupon = null;
    notifyListeners();
    return true;
  }

  void recallOrder(HeldOrder order) {
    _cartItems = List.from(order.items);
    _tableNumber = order.tableNumber;
    _waiterKey = order.waiter;
    _guests = order.guests;
    _selectedOrderType = order.orderType;
    _orderNote = order.note;
    _heldOrders.removeWhere((h) => h.id == order.id);
    notifyListeners();
  }

  void deleteHeldOrder(String id) {
    _heldOrders.removeWhere((h) => h.id == id);
    notifyListeners();
  }

  void transferTable(String newTable) {
    _tableNumber = newTable;
    notifyListeners();
  }

  // Complete / Place Order
  Future<CompletedOrder> placeOrder({
    required String paymentMethod,
    double? paidAmount,
    double? changeAmount,
    String? customerName,
    String? customerPhone,
    String? trxId,
  }) async {
    final orderId = 'ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
    String finalInvoiceNo = orderId;

    try {
      final payload = {
        'items': _cartItems.map((c) => {
          'productId': c.menuItem.productId ?? '012daf9f-b4c0-11f1-a8d2-30560f11c951',
          'variantId': null,
          'name': c.menuItem.name,
          'qty': c.quantity,
          'unitPrice': c.menuItem.price,
          'discountAmount': 0,
          'lineTotal': c.totalPrice,
        }).toList(),
        'payments': [
          {
            'method': paymentMethod.toUpperCase().contains('CASH')
                ? 'CASH'
                : paymentMethod.toUpperCase().contains('CARD')
                    ? 'CARD'
                    : 'BKASH',
            'amount': paidAmount ?? totalPayable,
          }
        ],
        'discountTotal': discountValue,
        'serviceCharge': serviceCharge,
        'source': 'RESTAURANT',
        'customerName': customerName,
        'customerPhone': customerPhone,
        'note': 'Restaurant POS | Table: $_tableNumber | Waiter: $_waiterKey | ${trxId != null ? 'Trx: $trxId' : ''}',
      };

      final res = await ApiService.instance.confirmSale(
        payload: payload,
        businessType: _currentBusinessType,
      );

      if (res['invoiceNo'] != null) {
        finalInvoiceNo = res['invoiceNo'].toString();
      }
    } catch (e) {
      debugPrint('Error placing order to backend: $e');
    }

    final completed = CompletedOrder(
      id: finalInvoiceNo,
      orderType: _selectedOrderType,
      tableNumber: _tableNumber,
      waiter: _waiterKey,
      items: List.from(_cartItems),
      subtotal: subtotal,
      discount: discountValue,
      tax: tax,
      serviceCharge: serviceCharge,
      total: totalPayable,
      paymentMethod: paymentMethod,
      timestamp: DateTime.now(),
      paidAmount: paidAmount ?? totalPayable,
      changeAmount: changeAmount ?? 0.0,
      customerName: customerName,
      trxId: trxId,
    );

    _completedOrders.insert(0, completed);
    clearCart();
    notifyListeners();
    return completed;
  }
}
