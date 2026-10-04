import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../../../core/services/api_service.dart';
import '../models/retail_product.dart';
import '../models/retail_cart_item.dart';
import '../models/retail_sale.dart';

class RetailProvider extends ChangeNotifier {
  bool _isLoadingProducts = false;
  bool get isLoadingProducts => _isLoadingProducts;

  final List<RetailProduct> _allProducts = [
    const RetailProduct(
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
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80',
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
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    ),
  ];

  final List<RetailCartItem> _cart = [];
  bool _isRemoteCartUpdate = false;
  final Set<String> _dynamicCategories = {};

  List<Map<String, dynamic>> _apiCustomers = [];
  List<Map<String, dynamic>> get apiCustomers => _apiCustomers;

  RetailProvider() {
    loadProducts(businessType: 'retail');
    loadCustomers();
    _initLiveCart();
  }

  void _initLiveCart() {
    // 1. Initial live cart restore from backend
    ApiService.instance.fetchActiveCart(businessType: 'retail').then((live) {
      if (live != null && live['items'] is List) {
        final items = live['items'] as List;
        if (items.isNotEmpty && _cart.isEmpty) {
          _isRemoteCartUpdate = true;
          _applyIncomingCart(items, live);
        }
      }
    }).catchError((_) {});

    // 2. Start SSE listener for real-time live cart updates from web POS
    _startSseListener();
  }

  void _startSseListener() {
    final tenantId = ApiService.businessTenantIds['retail'] ?? '19f2452c-78dc-4309-9a41-6463c93ccaf7';
    final streamUri = Uri.parse('${ApiService.instance.baseUrl}/v1/realtime/stream?channel=POS&tenantId=$tenantId');
    final client = http.Client();
    final request = http.Request('GET', streamUri);
    request.headers['Accept'] = 'text/event-stream';
    request.headers['Cache-Control'] = 'no-cache';

    client.send(request).then((response) {
      response.stream
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen((line) {
        if (line.startsWith('data: ')) {
          try {
            final jsonStr = line.substring(6).trim();
            final event = jsonDecode(jsonStr);
            if (event['type'] == 'CART_UPDATED' && event['payload'] is Map) {
              final payload = event['payload'] as Map<String, dynamic>;
              if (payload['source'] != 'MOBILE_RETAIL') {
                _isRemoteCartUpdate = true;
                final items = payload['items'] as List? ?? [];
                _applyIncomingCart(items, payload);
              }
            }
          } catch (_) {}
        }
      }, onError: (_) {});
    }).catchError((_) {});
  }

  void _applyIncomingCart(List rawItems, Map<String, dynamic> payload) {
    _cart.clear();
    for (final it in rawItems) {
      if (it is Map) {
        final pid = it['productId']?.toString() ?? it['id']?.toString() ?? '';
        final name = it['name']?.toString() ?? 'Item';
        final price = (it['unitPrice'] as num?)?.toDouble() ?? 0.0;
        final qty = (it['qty'] as num?)?.toInt() ?? 1;
        final discount = (it['discountAmount'] as num?)?.toDouble() ?? 0.0;
        final img = it['imageUrl']?.toString() ?? it['image']?.toString() ?? '';
        final sku = it['sku']?.toString() ?? '';

        final existingProd = _allProducts.cast<RetailProduct?>().firstWhere(
          (p) => p?.id == pid || p?.name == name,
          orElse: () => null,
        );

        final product = existingProd ?? RetailProduct(
          id: pid.isNotEmpty ? pid : 'prod-${DateTime.now().millisecondsSinceEpoch}',
          name: name,
          nameBn: name,
          unit: 'pcs',
          unitBn: 'পিস',
          price: price,
          costPrice: price * 0.8,
          stock: 100,
          category: 'General',
          sku: sku,
          barcode: sku,
          imageUrl: img.isNotEmpty ? img : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
        );

        _cart.add(RetailCartItem(product: product, qty: qty, discountAmount: discount));
      }
    }
    if (payload['customerName'] != null && payload['customerName'].toString().isNotEmpty) {
      _selectedCustomer = payload['customerName'].toString();
    }
    if (payload['discountTotal'] != null) {
      _discountTotal = (payload['discountTotal'] as num).toDouble();
    }
    notifyListeners();
  }

  void _syncLiveCart() {
    if (_isRemoteCartUpdate) {
      _isRemoteCartUpdate = false;
      return;
    }

    final itemsPayload = _cart.map((c) => {
      'productId': c.product.id,
      'variantId': null,
      'name': c.product.name,
      'qty': c.qty,
      'unitPrice': c.product.price,
      'discountAmount': c.discountAmount,
      'lineTotal': c.lineTotal,
      'imageUrl': c.product.imageUrl,
      'sku': c.product.sku,
    }).toList();

    ApiService.instance.saveActiveCart(
      businessType: 'retail',
      payload: {
        'items': itemsPayload,
        'total': total,
        'subtotal': subtotal,
        'taxTotal': taxTotal,
        'discountTotal': _discountTotal,
        'serviceCharge': _serviceCharge,
        'customerName': _selectedCustomer,
        'source': 'MOBILE_RETAIL',
      },
    );
  }

  final List<HeldRetailSale> _heldSales = [];
  final List<RetailSale> _recentSales = [];

  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _selectedCustomer = 'Walk-in Customer';
  String _paymentMethod = 'CASH';
  String _orderNote = '';
  double _discountTotal = 0.0;
  double _serviceCharge = 0.0;
  double _taxRate = 0.15; // System VAT rate fetched from API

  // Getters
  double get taxRate => _taxRate;
  int get taxRatePct => (_taxRate * 100).round();
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

  List<String> get categories {
    if (_dynamicCategories.isNotEmpty) {
      return ['All', ..._dynamicCategories.where((c) => c != 'All' && c != 'All Products')];
    }
    return [
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
  }

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
    _syncLiveCart();
  }

  void addToCart(RetailProduct product) {
    final index = _cart.indexWhere((i) => i.product.id == product.id);
    if (index >= 0) {
      _cart[index].qty += 1;
    } else {
      _cart.add(RetailCartItem(product: product, qty: 1));
    }
    notifyListeners();
    _syncLiveCart();
  }

  void updateQty(int index, int qty) {
    if (index >= 0 && index < _cart.length) {
      if (qty <= 0) {
        _cart.removeAt(index);
      } else {
        _cart[index].qty = qty;
      }
      notifyListeners();
      _syncLiveCart();
    }
  }

  void removeFromCart(int index) {
    if (index >= 0 && index < _cart.length) {
      _cart.removeAt(index);
      notifyListeners();
      _syncLiveCart();
    }
  }

  void clearCart() {
    _cart.clear();
    _discountTotal = 0.0;
    _serviceCharge = 0.0;
    notifyListeners();
    _syncLiveCart();
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

  Future<void> loadCustomers() async {
    try {
      final list = await ApiService.instance.fetchCustomers(businessType: 'retail');
      if (list.isNotEmpty) {
        _apiCustomers = list;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading retail customers: $e');
    }
  }

  Future<void> loadProducts({String businessType = 'retail'}) async {
    _isLoadingProducts = true;
    notifyListeners();
    try {
      // 1. Fetch system tax rate dynamically from API
      final systemTax = await ApiService.instance.fetchDefaultTaxRate(businessType: businessType);
      if (systemTax > 0) {
        _taxRate = systemTax;
      }

      // 2. Fetch products from API
      final apiProducts = await ApiService.instance.fetchProducts(businessType: businessType);
      if (apiProducts.isNotEmpty) {
        final List<RetailProduct> loaded = [];
        final Set<String> dynCategories = {'All', 'All Products'};

        for (int i = 0; i < apiProducts.length; i++) {
          final p = apiProducts[i];
          final sellingPrice = (p['sellingPrice'] as num?)?.toDouble() ??
              (p['price'] as num?)?.toDouble() ??
              100.0;
          final costPrice = (p['costPrice'] as num?)?.toDouble() ?? (sellingPrice * 0.8);
          final rawStock = (p['totalStock'] as num?)?.toDouble() ??
              (p['stock'] as num?)?.toDouble() ??
              (p['stockQty'] as num?)?.toDouble() ??
              (p['stock_qty'] as num?)?.toDouble() ??
              0.0;
          final stock = rawStock <= 0 ? 0 : rawStock.toInt();

          String catName = 'General';
          if (p['category'] is Map && (p['category'] as Map)['name'] != null) {
            catName = (p['category'] as Map)['name'].toString();
          } else if (p['categoryName'] != null) {
            catName = p['categoryName'].toString();
          } else if (p['category'] != null) {
            catName = p['category'].toString();
          }
          if (catName.isNotEmpty) {
            dynCategories.add(catName);
          }

          String unitName = 'pcs';
          if (p['unit'] is Map && (p['unit'] as Map)['name'] != null) {
            unitName = (p['unit'] as Map)['name'].toString();
          } else if (p['unit'] != null) {
            unitName = p['unit'].toString();
          }

          loaded.add(RetailProduct(
            id: p['id']?.toString() ?? 'prod-$i',
            name: p['name']?.toString() ?? 'Product $i',
            nameBn: p['nameBn']?.toString() ?? p['name']?.toString() ?? 'Product $i',
            unit: unitName,
            unitBn: 'পিস',
            price: sellingPrice,
            costPrice: costPrice,
            stock: stock,
            category: catName,
            sku: p['sku']?.toString() ?? 'SKU-$i',
            barcode: p['barcode']?.toString() ?? p['sku']?.toString() ?? '8941100112${i.toString().padLeft(3, '0')}',
            imageUrl: p['imageUrl']?.toString() ??
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
          ));
        }
        _allProducts.clear();
        _allProducts.addAll(loaded);
        _dynamicCategories.clear();
        _dynamicCategories.addAll(dynCategories);
      }
    } catch (e) {
      debugPrint('Error loading retail products: $e');
    } finally {
      _isLoadingProducts = false;
      notifyListeners();
    }
  }

  Future<RetailSale> confirmSale({required double paidAmount, String? method}) async {
    final finalMethod = method ?? _paymentMethod;
    final changeAmount = paidAmount > total ? paidAmount - total : 0.0;

    String realInvoice = 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    Map<String, dynamic>? res;
    try {
      final itemsPayload = _cart.map((c) => {
        'productId': c.product.id,
        'name': c.product.name,
        'sku': c.product.sku,
        'qty': c.qty,
        'unitPrice': c.product.price,
        'lineTotal': c.lineTotal,
      }).toList();

      res = await ApiService.instance.confirmSale(
        payload: {
          'items': itemsPayload,
          'payments': [
            {'method': finalMethod, 'amount': paidAmount}
          ],
          'tendered': paidAmount,
          'tenderedAmount': paidAmount,
          'paid': paidAmount > total ? total : paidAmount,
          'paidTotal': paidAmount > total ? total : paidAmount,
          'changeReturn': changeAmount,
          'discountTotal': _discountTotal,
          'serviceCharge': _serviceCharge,
          'taxTotal': taxTotal,
          'subtotal': subtotal,
          'total': total,
          'source': 'RETAIL',
          'customerName': _selectedCustomer,
          'note': _orderNote,
        },
        businessType: 'retail',
      );
      if (res['invoiceNo'] != null) {
        realInvoice = res['invoiceNo'].toString();
      }
    } catch (e) {
      debugPrint('Error confirming retail sale with API: $e');
    }

    final effectiveTotal = (res?['total'] as num?)?.toDouble() ?? total;
    final effectivePaid = (res?['paidTotal'] as num?)?.toDouble() ?? (paidAmount > effectiveTotal ? effectiveTotal : paidAmount);
    final effectiveTendered = (res?['tenderedAmount'] as num?)?.toDouble() ?? (res?['tendered'] as num?)?.toDouble() ?? paidAmount;
    final effectiveChange = (res?['changeReturn'] as num?)?.toDouble() ?? (res?['change'] as num?)?.toDouble() ?? (effectiveTendered > effectiveTotal ? effectiveTendered - effectiveTotal : changeAmount);

    final sale = RetailSale(
      id: res?['saleId']?.toString() ?? 'SALE-${DateTime.now().millisecondsSinceEpoch}',
      invoiceNo: realInvoice,
      items: List.from(_cart),
      subtotal: (res?['subtotal'] as num?)?.toDouble() ?? subtotal,
      discountTotal: (res?['discountTotal'] as num?)?.toDouble() ?? _discountTotal,
      taxTotal: (res?['taxTotal'] as num?)?.toDouble() ?? taxTotal,
      total: effectiveTotal,
      paidAmount: effectivePaid,
      tenderedAmount: effectiveTendered,
      changeAmount: effectiveChange,
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
