import 'package:flutter/foundation.dart';
import '../../../core/services/api_service.dart';

enum WCustomerTier { regular, silver, gold, platinum }

class WCustomer {
  final String id;
  final String name;
  final String phone;
  final String customerId;
  final WCustomerTier tier;
  final double creditLimit;
  final double availableCredit;
  final double outstanding;

  const WCustomer({
    required this.id,
    required this.name,
    required this.phone,
    required this.customerId,
    required this.tier,
    required this.creditLimit,
    required this.availableCredit,
    required this.outstanding,
  });

  String get tierName {
    switch (tier) {
      case WCustomerTier.platinum:
        return 'Platinum';
      case WCustomerTier.gold:
        return 'Gold';
      case WCustomerTier.silver:
        return 'Silver';
      case WCustomerTier.regular:
        return 'Standard';
    }
  }

  String get tierLabel => '$tierName Customer';
}

enum WStockStatus { inStock, lowStock, outOfStock }

class WProduct {
  final String id;
  final String name;
  final String sku;
  final String warehouseId;
  final String category;
  final double price;
  final double b2bPrice;
  final double bulkPrice;     // price for bulk qty
  final int bulkMinQty;       // min qty for bulk price
  final int stock;
  final WStockStatus stockStatus;
  final String emoji;
  final String imageUrl;

  const WProduct({
    required this.id,
    required this.name,
    required this.sku,
    required this.warehouseId,
    required this.category,
    required this.price,
    required this.b2bPrice,
    required this.bulkPrice,
    required this.bulkMinQty,
    required this.stock,
    required this.stockStatus,
    required this.emoji,
    required this.imageUrl,
  });
}

class WOrderItem {
  final WProduct product;
  int qty;
  double unitPrice;

  WOrderItem({required this.product, this.qty = 1, double? unitPrice})
      : unitPrice = unitPrice ?? product.price;

  double get lineTotal => qty * unitPrice;

  /// Return B2B or bulk price if applicable
  double effectivePrice(bool isBulk) {
    if (isBulk || qty >= product.bulkMinQty) return product.bulkPrice;
    return product.b2bPrice;
  }
}

class WHeldOrder {
  final String id;
  final String note;
  final List<WOrderItem> items;
  final DateTime heldAt;

  WHeldOrder({
    required this.id,
    required this.note,
    required this.items,
    required this.heldAt,
  });
}

class WholesalerProvider extends ChangeNotifier {
  // ── Customers ─────────────────────────────────────────────────
  final List<WCustomer> _customers = [
    const WCustomer(
      id: 'c1',
      name: 'ABC Traders Ltd.',
      phone: '01712-345678',
      customerId: 'CUST-10025',
      tier: WCustomerTier.platinum,
      creditLimit: 50000,
      availableCredit: 18750,
      outstanding: 12250,
    ),
    const WCustomer(
      id: 'c2',
      name: 'Star Wholesale Co.',
      phone: '01819-567890',
      customerId: 'CUST-10031',
      tier: WCustomerTier.gold,
      creditLimit: 30000,
      availableCredit: 22000,
      outstanding: 8000,
    ),
    const WCustomer(
      id: 'c3',
      name: 'Metro Suppliers',
      phone: '01515-223344',
      customerId: 'CUST-10044',
      tier: WCustomerTier.silver,
      creditLimit: 15000,
      availableCredit: 10000,
      outstanding: 5000,
    ),
    const WCustomer(
      id: 'c0',
      name: 'Walk-in Customer',
      phone: '-',
      customerId: 'CUST-WALK',
      tier: WCustomerTier.regular,
      creditLimit: 0,
      availableCredit: 0,
      outstanding: 0,
    ),
  ];

  late WCustomer _selectedCustomer = _customers.first;

  List<WCustomer> get customers => _customers;
  WCustomer get customer => _selectedCustomer;

  void selectCustomer(WCustomer c) {
    _selectedCustomer = c;
    notifyListeners();
  }

  // ── Warehouse ──────────────────────────────────────────────────
  String _selectedWarehouse = 'All Warehouses';
  String get selectedWarehouse => _selectedWarehouse;
  void setWarehouse(String w) {
    _selectedWarehouse = w;
    notifyListeners();
  }

  // ── Products ───────────────────────────────────────────────────
  String _selectedCategory = 'All Products';
  String _searchQuery = '';
  bool _showLowStockOnly = false;
  bool _gridView = true;

  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  bool get showLowStockOnly => _showLowStockOnly;
  bool get isGridView => _gridView;

  void setCategory(String cat) {
    _selectedCategory = cat;
    notifyListeners();
  }

  void setSearchQuery(String q) {
    _searchQuery = q;
    notifyListeners();
  }

  void toggleLowStock() {
    _showLowStockOnly = !_showLowStockOnly;
    notifyListeners();
  }

  void toggleView() {
    _gridView = !_gridView;
    notifyListeners();
  }

  WholesalerProvider() {
    loadProducts(businessType: 'wholesaler');
  }

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> loadProducts({String businessType = 'wholesaler'}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final apiProducts = await ApiService.instance.fetchProducts(businessType: businessType);
      if (apiProducts.isNotEmpty) {
        final List<WProduct> loaded = [];
        for (int i = 0; i < apiProducts.length; i++) {
          final p = apiProducts[i];
          final price = (p['sellingPrice'] as num?)?.toDouble() ??
              (p['price'] as num?)?.toDouble() ??
              (double.tryParse(p['sellingPrice']?.toString() ?? '') ?? 500.0);
          final stock = (p['stock'] as num?)?.toInt() ?? 50;
          loaded.add(WProduct(
            id: p['id']?.toString() ?? 'wp-$i',
            name: p['name']?.toString() ?? 'Product $i',
            sku: p['sku']?.toString() ?? 'SKU-$i',
            warehouseId: 'WH-01',
            category: p['category'] is Map ? (p['category']['name'] ?? 'General').toString() : (p['category']?.toString() ?? 'General'),
            price: price,
            b2bPrice: price * 0.9,
            bulkPrice: price * 0.8,
            bulkMinQty: 10,
            stock: stock,
            stockStatus: stock > 10 ? WStockStatus.inStock : WStockStatus.lowStock,
            emoji: '📦',
            imageUrl: p['imageUrl']?.toString() ?? 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
          ));
        }
        _allProducts.clear();
        _allProducts.addAll(loaded);
      }
    } catch (e) {
      debugPrint('Error loading wholesale products: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  final List<WProduct> _allProducts = [
    const WProduct(
      id: 'p1', name: 'Noise Cancelling Headphones', sku: 'EL-HP-1001',
      warehouseId: 'WH-01', category: 'Electronics',
      price: 65.0, b2bPrice: 60.0, bulkPrice: 55.0, bulkMinQty: 10,
      stock: 145, stockStatus: WStockStatus.inStock,
      emoji: '🎧', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p2', name: 'Smart Watch Series 8', sku: 'SW-2008',
      warehouseId: 'WH-01', category: 'Electronics',
      price: 120.0, b2bPrice: 110.0, bulkPrice: 100.0, bulkMinQty: 5,
      stock: 88, stockStatus: WStockStatus.inStock,
      emoji: '⌚', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p3', name: 'Portable Bluetooth Speaker', sku: 'SP-3001',
      warehouseId: 'WH-02', category: 'Electronics',
      price: 45.0, b2bPrice: 40.0, bulkPrice: 35.0, bulkMinQty: 20,
      stock: 230, stockStatus: WStockStatus.inStock,
      emoji: '🔊', imageUrl: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p4', name: 'Kitchen Blender Pro', sku: 'KB-5002',
      warehouseId: 'WH-02', category: 'Home Appliances',
      price: 85.0, b2bPrice: 78.0, bulkPrice: 70.0, bulkMinQty: 10,
      stock: 67, stockStatus: WStockStatus.inStock,
      emoji: '🥤', imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p5', name: 'Smartphone X Pro', sku: 'MB-XP-256',
      warehouseId: 'WH-02', category: 'Mobiles',
      price: 680.0, b2bPrice: 650.0, bulkPrice: 620.0, bulkMinQty: 5,
      stock: 12, stockStatus: WStockStatus.lowStock,
      emoji: '📱', imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p6', name: '24" Full HD Monitor', sku: 'MN-2401',
      warehouseId: 'WH-01', category: 'Computers',
      price: 150.0, b2bPrice: 138.0, bulkPrice: 125.0, bulkMinQty: 5,
      stock: 43, stockStatus: WStockStatus.inStock,
      emoji: '🖥️', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p7', name: 'All-in-One Printer', sku: 'PR-6001',
      warehouseId: 'WH-01', category: 'Computers',
      price: 210.0, b2bPrice: 195.0, bulkPrice: 180.0, bulkMinQty: 3,
      stock: 28, stockStatus: WStockStatus.inStock,
      emoji: '🖨️', imageUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p8', name: 'Ergonomic Office Chair', sku: 'CH-7001',
      warehouseId: 'WH-03', category: 'Office Supplies',
      price: 155.0, b2bPrice: 142.0, bulkPrice: 130.0, bulkMinQty: 5,
      stock: 35, stockStatus: WStockStatus.inStock,
      emoji: '🪑', imageUrl: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p9', name: 'Wireless Keyboard & Mouse', sku: 'KM-9001',
      warehouseId: 'WH-01', category: 'Accessories',
      price: 35.0, b2bPrice: 30.0, bulkPrice: 26.0, bulkMinQty: 20,
      stock: 192, stockStatus: WStockStatus.inStock,
      emoji: '⌨️', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p10', name: '32GB USB 3.0 Drive', sku: 'USB-32GB',
      warehouseId: 'WH-01', category: 'Accessories',
      price: 12.0, b2bPrice: 10.0, bulkPrice: 8.0, bulkMinQty: 50,
      stock: 540, stockStatus: WStockStatus.inStock,
      emoji: '💾', imageUrl: 'https://images.unsplash.com/photo-1618764400608-9e7115eabb74?w=400&fit=crop&q=80',
    ),
    WProduct(
      id: 'p11', name: 'Laptop Stand Aluminum', sku: 'LS-1102',
      warehouseId: 'WH-02', category: 'Accessories',
      price: 28.0, b2bPrice: 24.0, bulkPrice: 20.0, bulkMinQty: 30,
      stock: 8, stockStatus: WStockStatus.lowStock,
      emoji: '💻', imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=200',
    ),
    WProduct(
      id: 'p12', name: 'LED Desk Lamp', sku: 'DL-4401',
      warehouseId: 'WH-03', category: 'Office Supplies',
      price: 22.0, b2bPrice: 18.0, bulkPrice: 15.0, bulkMinQty: 25,
      stock: 115, stockStatus: WStockStatus.inStock,
      emoji: '💡', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200',
    ),
  ];

  List<WProduct> get allProducts => _allProducts;

  List<WProduct> get filteredProducts {
    var list = _allProducts.where((p) {
      final matchCat = _selectedCategory == 'All Products' || p.category == _selectedCategory;
      final matchSearch = _searchQuery.isEmpty ||
          p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchLow = !_showLowStockOnly || p.stockStatus == WStockStatus.lowStock;
      return matchCat && matchSearch && matchLow;
    }).toList();
    return list;
  }

  // ── Order Items ───────────────────────────────────────────────
  final List<WOrderItem> _items = [];
  List<WOrderItem> get items => _items;

  bool _isBulkPricing = false;
  bool get isBulkPricing => _isBulkPricing;
  void toggleBulkPricing() {
    _isBulkPricing = !_isBulkPricing;
    for (var item in _items) {
      item.unitPrice = item.effectivePrice(_isBulkPricing);
    }
    notifyListeners();
  }

  void addProduct(WProduct p) {
    final existing = _items.where((i) => i.product.id == p.id);
    if (existing.isNotEmpty) {
      existing.first.qty++;
      existing.first.unitPrice = existing.first.effectivePrice(_isBulkPricing);
    } else {
      _items.add(WOrderItem(
        product: p,
        unitPrice: _isBulkPricing ? p.bulkPrice : p.b2bPrice,
      ));
    }
    notifyListeners();
  }

  void incrementQty(String productId) {
    final item = _items.firstWhere((i) => i.product.id == productId);
    item.qty++;
    item.unitPrice = item.effectivePrice(_isBulkPricing);
    notifyListeners();
  }

  void decrementQty(String productId) {
    final item = _items.firstWhere((i) => i.product.id == productId);
    if (item.qty > 1) {
      item.qty--;
      item.unitPrice = item.effectivePrice(_isBulkPricing);
    } else {
      _items.removeWhere((i) => i.product.id == productId);
    }
    notifyListeners();
  }

  void setQty(String productId, int newQty) {
    if (newQty <= 0) {
      _items.removeWhere((i) => i.product.id == productId);
    } else {
      final index = _items.indexWhere((i) => i.product.id == productId);
      if (index != -1) {
        _items[index].qty = newQty;
        _items[index].unitPrice = _items[index].effectivePrice(_isBulkPricing);
      }
    }
    notifyListeners();
  }

  void removeItem(String productId) {
    _items.removeWhere((i) => i.product.id == productId);
    notifyListeners();
  }

  void clearOrder() {
    _items.clear();
    _discountFlat = 50.0;
    _shippingCost = 20.0;
    notifyListeners();
  }

  // ── Pricing ───────────────────────────────────────────────────
  double get subtotal => _items.fold(0, (s, i) => s + i.lineTotal);
  double _discountFlat = 50.0;
  double get discountFlat => _discountFlat;
  void setDiscount(double d) { _discountFlat = d; notifyListeners(); }

  double get taxRate => 0.064; // 6.4%
  double get taxAmount => (subtotal - _discountFlat).clamp(0, double.infinity) * taxRate;

  double _shippingCost = 20.0;
  double get shippingCost => _shippingCost;
  void setShipping(double s) { _shippingCost = s; notifyListeners(); }

  double get grandTotal => (subtotal - _discountFlat).clamp(0, double.infinity) + taxAmount + _shippingCost;

  int get totalItems => _items.fold(0, (s, i) => s + i.qty);

  // ── Stats ─────────────────────────────────────────────────────
  double get todaysSales => 12540.0;
  int get ordersCount => 18;
  int get deliveryCount => 12;
  int get customersCount => 24;
  int get pendingOrdersCount => 0;
  int get lowStockAlerts => 0;
  double get totalReceivables => 34850.0;
  double get collectedCash => 9750.0;
  int get returnsCount => 0;
  int get activeWarehouses => 1;

  // ── Hold Order ────────────────────────────────────────────────
  final List<WHeldOrder> _heldOrders = [];
  List<WHeldOrder> get heldOrders => _heldOrders;

  String get orderNo {
    final n = _heldOrders.length + _orderCount;
    return 'SO-2505-000${n.toString().padLeft(2, '0')}';
  }
  final int _orderCount = 1;

  bool holdCurrentOrder(String note) {
    if (_items.isEmpty) return false;
    _heldOrders.add(WHeldOrder(
      id: orderNo,
      note: note,
      items: List.from(_items),
      heldAt: DateTime.now(),
    ));
    _items.clear();
    _discountFlat = 50.0;
    _shippingCost = 20.0;
    notifyListeners();
    return true;
  }

  void recallOrder(WHeldOrder order) {
    _items.clear();
    _items.addAll(order.items);
    _heldOrders.removeWhere((o) => o.id == order.id);
    notifyListeners();
  }

  // ── Additional Order Info ─────────────────────────────────────
  String _salesRep = 'John Smith';
  String get salesRep => _salesRep;
  void setSalesRep(String s) { _salesRep = s; notifyListeners(); }

  String _deliveryDate = '20 May, 2025 • 10:00 AM';
  String get deliveryDate => _deliveryDate;
  void setDeliveryDate(String d) { _deliveryDate = d; notifyListeners(); }

  String _deliveryMethod = 'Our Delivery';
  String get deliveryMethod => _deliveryMethod;
  void setDeliveryMethod(String d) { _deliveryMethod = d; notifyListeners(); }

  String _paymentTerm = '30 Days';
  String get paymentTerm => _paymentTerm;
  void setPaymentTerm(String p) { _paymentTerm = p; notifyListeners(); }

  double _commission = 2.5;
  double get commission => _commission;
  double get commissionAmount => grandTotal * (_commission / 100);
  void setCommission(double c) { _commission = c; notifyListeners(); }

  String _note = '';
  String get note => _note;
  void setNote(String n) { _note = n; notifyListeners(); }

  int _attachmentsCount = 0;
  int get attachmentsCount => _attachmentsCount;
  void setAttachmentsCount(int c) { _attachmentsCount = c; notifyListeners(); }
}
