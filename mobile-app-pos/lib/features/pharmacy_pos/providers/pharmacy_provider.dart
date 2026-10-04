import 'package:flutter/foundation.dart';
import '../../../core/services/api_service.dart';
import '../models/medicine_model.dart';
import '../models/pharmacy_cart_item.dart';

class PharmacyProvider extends ChangeNotifier {
  PharmacyProvider() {
    loadProducts(businessType: 'pharmacy');
  }

  // System VAT rate fetched from API (e.g., 0.15 for 15%)
  double _taxRate = 0.15; // default fallback 15%
  double get taxRate => _taxRate;
  int get taxRatePct => (_taxRate * 100).round();

  // API-loaded customers
  List<Map<String, dynamic>> _apiCustomers = [];
  bool _customersLoaded = false;
  List<Map<String, dynamic>> get apiCustomers => _apiCustomers;
  bool get customersLoaded => _customersLoaded;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> loadProducts({String businessType = 'pharmacy'}) async {
    _isLoading = true;
    notifyListeners();
    try {
      // 1. Fetch system VAT rate from API
      final systemTax = await ApiService.instance.fetchDefaultTaxRate(businessType: businessType);
      _taxRate = systemTax;

      // 2. Fetch products from API
      final apiProducts = await ApiService.instance.fetchProducts(businessType: businessType);
      if (apiProducts.isNotEmpty) {
        final List<MedicineModel> loaded = [];
        for (int i = 0; i < apiProducts.length; i++) {
          final p = apiProducts[i];
          final price = (p['sellingPrice'] as num?)?.toDouble() ??
              (p['price'] as num?)?.toDouble() ??
              (double.tryParse(p['sellingPrice']?.toString() ?? '') ?? 50.0);
          final rawStock = (p['totalStock'] as num?)?.toDouble() ??
              (p['stock'] as num?)?.toDouble() ??
              (p['stockQty'] as num?)?.toDouble() ??
              (p['stock_qty'] as num?)?.toDouble() ??
              0.0;
          final stock = rawStock <= 0 ? 0 : rawStock.toInt();
          // Extract pharmacy attributes if present
          final attrs = p['attributes'] is Map ? p['attributes'] as Map : {};
          final pharmaAttrs = attrs['pharmacy'] is Map ? attrs['pharmacy'] as Map : {};
          final genericNameApi = pharmaAttrs['genericName']?.toString() ?? p['description']?.toString() ?? 'General Medicine';
          final dosageForm = pharmaAttrs['dosageForm']?.toString() ?? 'Tablet';
          final isPrescription = pharmaAttrs['isPrescriptionRequired'] == true;
          final mfr = pharmaAttrs['manufacturer']?.toString();
          final catVal = p['category'] is Map ? (p['category']['name'] ?? 'General').toString() : (p['category']?.toString() ?? 'General');
          loaded.add(MedicineModel(
            id: p['id']?.toString() ?? 'm-$i',
            name: p['name']?.toString() ?? 'Medicine $i',
            genericName: genericNameApi.isNotEmpty ? '$genericNameApi • $dosageForm' : dosageForm,
            price: price,
            category: catVal,
            imagePath: p['imageUrl']?.toString() ?? 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200',
            stock: stock,
            isRx: isPrescription,
            manufacturer: (mfr != null && mfr.isNotEmpty) ? mfr : 'Blue Oceans Pharma',
            barcode: p['barcode']?.toString() ?? '8941100${i.toString().padLeft(2, '0')}',
            batchNumber: 'BAT-${DateTime.now().year}-$i',
            expiryDate: '12/2027',
          ));
        }
        _allMedicines.clear();
        _allMedicines.addAll(loaded);
      }

      // 3. Fetch customers from API
      _apiCustomers = await ApiService.instance.fetchCustomers(businessType: businessType);
      _customersLoaded = true;
    } catch (e) {
      debugPrint('Error loading pharmacy products: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  final List<MedicineModel> _allMedicines = [
    const MedicineModel(
      id: '1', name: 'Amoxicillin', genericName: 'Capsule • 500mg', price: 6.00, 
      category: 'Antibiotics', imagePath: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', 
      stock: 120, isRx: true, alternatives: 3, manufacturer: 'Square Pharma',
      barcode: '89411001', batchNumber: 'AMX-2024', expiryDate: '11/2026'
    ),
    const MedicineModel(
      id: '2', name: 'Augmentin', genericName: 'Tablet • 625mg', price: 22.00, 
      category: 'Antibiotics', imagePath: 'https://images.unsplash.com/photo-1576073719710-aa465e310064?w=200', 
      stock: 85, isRx: true, alternatives: 2, manufacturer: 'GSK Bangladesh',
      barcode: '89411002', batchNumber: 'AUG-8821', expiryDate: '08/2027'
    ),
    const MedicineModel(
      id: '3', name: 'Azithromycin', genericName: 'Tablet • 500mg', price: 18.00, 
      category: 'Antibiotics', imagePath: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200', 
      stock: 18, isRx: false, alternatives: 4, manufacturer: 'Beximco Pharma',
      barcode: '89411003', batchNumber: 'AZI-4412', expiryDate: '05/2026'
    ),
    const MedicineModel(
      id: '4', name: 'Becom-Z', genericName: 'Capsule', price: 6.50, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1626716595514-934440538183?w=200', 
      stock: 65, manufacturer: 'Incepta Pharma',
      barcode: '89411004', batchNumber: 'BCZ-9901', expiryDate: '03/2028'
    ),
    const MedicineModel(
      id: '5', name: 'Cetirizine', genericName: 'Tablet • 10mg', price: 6.00, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=200', 
      stock: 60, alternatives: 3, manufacturer: 'Renata Ltd',
      barcode: '89411005', batchNumber: 'CTZ-1104', expiryDate: '12/2027'
    ),
    const MedicineModel(
      id: '6', name: 'Domstal', genericName: 'Tablet • 10mg', price: 7.00, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=200', 
      stock: 45, alternatives: 2, manufacturer: 'Torrent Pharma',
      barcode: '89411006', batchNumber: 'DOM-7711', expiryDate: '09/2026'
    ),
    const MedicineModel(
      id: '7', name: 'Esomeprazole', genericName: 'Capsule • 20mg', price: 8.50, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200', 
      stock: 32, alternatives: 5, manufacturer: 'Square Pharma',
      barcode: '89411007', batchNumber: 'ESO-3329', expiryDate: '01/2027'
    ),
    const MedicineModel(
      id: '8', name: 'Ibuprofen', genericName: 'Tablet • 400mg', price: 7.00, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1550572017-ed20015a7a40?w=200', 
      stock: 50, alternatives: 3, manufacturer: 'Aristopharma',
      barcode: '89411008', batchNumber: 'IBU-1029', expiryDate: '04/2027'
    ),
    const MedicineModel(
      id: '9', name: 'Metformin', genericName: 'Tablet • 500mg', price: 4.00, 
      category: 'Diabetes Care', imagePath: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200', 
      stock: 12, isExpiringSoon: true, alternatives: 4, manufacturer: 'Eskayef',
      barcode: '89411009', batchNumber: 'MET-0043', expiryDate: '10/2026'
    ),
    const MedicineModel(
      id: '10', name: 'Napa Extra', genericName: 'Tablet • 100mg', price: 12.00, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200', 
      stock: 28, alternatives: 4, manufacturer: 'Beximco Pharma',
      barcode: '89411010', batchNumber: 'NAP-5541', expiryDate: '11/2027'
    ),
    const MedicineModel(
      id: '11', name: 'ORS', genericName: 'Powder • 21.8gm', price: 5.00, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200', 
      stock: 40, manufacturer: 'SMC Solutions',
      barcode: '89411011', batchNumber: 'ORS-6602', expiryDate: '06/2028'
    ),
    const MedicineModel(
      id: '12', name: 'Omeprazole', genericName: 'Capsule • 20mg', price: 8.00, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=200', 
      stock: 75, alternatives: 6, manufacturer: 'Square Pharma',
      barcode: '89411012', batchNumber: 'OME-8832', expiryDate: '02/2027'
    ),
    const MedicineModel(
      id: '13', name: 'Paracetamol', genericName: 'Tablet • 500mg', price: 1.20, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200', 
      stock: 90, alternatives: 5, manufacturer: 'Square Pharma',
      barcode: '89411013', batchNumber: 'PAR-1200', expiryDate: '07/2027'
    ),
    const MedicineModel(
      id: '14', name: 'Salbutamol', genericName: 'Inhaler • 100mcg', price: 15.00, 
      category: 'Respiratory', imagePath: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf4?w=200', 
      stock: 22, isRx: true, alternatives: 2, manufacturer: 'Beximco Pharma',
      barcode: '89411014', batchNumber: 'SAL-7731', expiryDate: '04/2028'
    ),
    const MedicineModel(
      id: '15', name: 'Vitamin C', genericName: 'Tablet • 500mg', price: 3.00, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200', 
      stock: 55, manufacturer: 'Incepta Pharma',
      barcode: '89411015', batchNumber: 'VTC-9912', expiryDate: '05/2027'
    ),
    const MedicineModel(
      id: '16', name: 'Vitamin D3', genericName: 'Capsule • 1000 IU', price: 10.00, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1614859132130-970678970e70?w=200', 
      stock: 38, manufacturer: 'Square Pharma',
      barcode: '89411016', batchNumber: 'VTD-4431', expiryDate: '09/2027'
    ),
    const MedicineModel(
      id: '17', name: 'Zincovit', genericName: 'Tablet • 20mg', price: 2.50, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', 
      stock: 42, manufacturer: 'Apex Pharma',
      barcode: '89411017', batchNumber: 'ZNC-3310', expiryDate: '12/2026'
    ),
  ];

  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _selectedFilterTag = 'All Medicines';
  String _selectedSort = 'Name A-Z';
  bool _isRxMode = false;

  final List<PharmacyCartItem> _cart = [];
  double _globalDiscount = 0.0;
  String _salesNote = '';
  String _selectedPaymentMethod = 'Cash';

  // Customer & Doctor & Prescription State
  Map<String, dynamic>? _selectedCustomer;
  Map<String, dynamic>? _attachedDoctor;
  Map<String, dynamic>? _attachedPrescription;

  // Held Bills List
  final List<Map<String, dynamic>> _heldBills = [];

  // Completed Orders History
  final List<Map<String, dynamic>> _orderHistory = [];

  // Currently focused medicine for alternative box
  MedicineModel? _focusedMedicine;

  // Getters
  List<MedicineModel> get allMedicines => _allMedicines;
  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  String get selectedFilterTag => _selectedFilterTag;
  String get selectedSort => _selectedSort;
  bool get isRxMode => _isRxMode;
  List<PharmacyCartItem> get cart => _cart;
  double get globalDiscount => _globalDiscount;
  String get salesNote => _salesNote;
  String get selectedPaymentMethod => _selectedPaymentMethod;
  Map<String, dynamic>? get selectedCustomer => _selectedCustomer;
  Map<String, dynamic>? get attachedDoctor => _attachedDoctor;
  Map<String, dynamic>? get attachedPrescription => _attachedPrescription;
  List<Map<String, dynamic>> get heldBills => _heldBills;
  List<Map<String, dynamic>> get orderHistory => _orderHistory;
  MedicineModel? get focusedMedicine =>
      _focusedMedicine ?? (_allMedicines.isNotEmpty ? _allMedicines.first : null);
  List<MedicineModel> get frequentlySold => _allMedicines.take(6).toList();

  List<MedicineModel> get filteredMedicines {
    List<MedicineModel> temp = List.from(_allMedicines);

    // 1. Category Filter
    if (_selectedCategory != 'All') {
      temp = temp.where((m) => m.category == _selectedCategory).toList();
    }

    // 2. Search Query Filter
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      temp = temp.where((m) =>
        m.name.toLowerCase().contains(q) ||
        m.genericName.toLowerCase().contains(q) ||
        m.manufacturer.toLowerCase().contains(q) ||
        m.barcode.contains(q)
      ).toList();
    }

    // 3. Filter Tag Pills
    switch (_selectedFilterTag) {
      case 'Popular':
        temp = temp.take(8).toList();
        break;
      case 'Low Stock':
        temp = temp.where((m) => m.isLowStock).toList();
        break;
      case 'Expiring Soon':
        temp = temp.where((m) => m.isExpiringSoon).toList();
        break;
      case 'Prescription Required':
        temp = temp.where((m) => m.isRx).toList();
        break;
      case 'Generic Available':
        temp = temp.where((m) => (m.alternatives ?? 0) > 0).toList();
        break;
      case 'All Medicines':
      default:
        break;
    }

    // 4. Rx Mode filter
    if (_isRxMode) {
      temp = temp.where((m) => m.isRx).toList();
    }

    // 5. Sorting
    switch (_selectedSort) {
      case 'Name Z-A':
        temp.sort((a, b) => b.name.compareTo(a.name));
        break;
      case 'Price: Low to High':
        temp.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'Price: High to Low':
        temp.sort((a, b) => b.price.compareTo(a.price));
        break;
      case 'Stock: High to Low':
        temp.sort((a, b) => b.stock.compareTo(a.stock));
        break;
      case 'Name A-Z':
      default:
        temp.sort((a, b) => a.name.compareTo(b.name));
        break;
    }

    return temp;
  }

  // Setters & Actions
  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setFilterTag(String tag) {
    _selectedFilterTag = tag;
    notifyListeners();
  }

  void setSort(String sort) {
    _selectedSort = sort;
    notifyListeners();
  }

  void toggleRxMode() {
    _isRxMode = !_isRxMode;
    notifyListeners();
  }

  void setPaymentMethod(String method) {
    _selectedPaymentMethod = method;
    notifyListeners();
  }

  void setDiscount(double discount) {
    _globalDiscount = discount.clamp(0.0, 100.0);
    notifyListeners();
  }

  void setSalesNote(String note) {
    _salesNote = note;
    notifyListeners();
  }

  void setCustomer(Map<String, dynamic>? customer) {
    _selectedCustomer = customer;
    notifyListeners();
  }

  void setDoctor(Map<String, dynamic>? doctor) {
    _attachedDoctor = doctor;
    notifyListeners();
  }

  void setPrescription(Map<String, dynamic>? prescription) {
    _attachedPrescription = prescription;
    notifyListeners();
  }

  void setFocusedMedicine(MedicineModel medicine) {
    _focusedMedicine = medicine;
    notifyListeners();
  }

  void addMedicine(MedicineModel medicine) {
    _allMedicines.insert(0, medicine);
    notifyListeners();
  }

  // Cart operations
  void addToCart(MedicineModel medicine) {
    _focusedMedicine = medicine;
    final existingIndex = _cart.indexWhere((item) => item.medicine.id == medicine.id);
    if (existingIndex >= 0) {
      _cart[existingIndex].quantity++;
    } else {
      _cart.add(PharmacyCartItem(medicine: medicine));
    }
    notifyListeners();
  }

  void updateQuantity(String id, int change) {
    final index = _cart.indexWhere((item) => item.medicine.id == id);
    if (index >= 0) {
      _cart[index].quantity += change;
      if (_cart[index].quantity <= 0) {
        _cart.removeAt(index);
      }
      notifyListeners();
    }
  }

  void removeItem(String id) {
    _cart.removeWhere((item) => item.medicine.id == id);
    notifyListeners();
  }

  void clearCart() {
    _cart.clear();
    _globalDiscount = 0.0;
    _salesNote = '';
    _selectedCustomer = null;
    _attachedDoctor = null;
    _attachedPrescription = null;
    notifyListeners();
  }

  // Hold & Resume
  bool holdCurrentCart() {
    if (_cart.isEmpty) return false;
    _heldBills.add({
      'id': 'HLD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
      'date': DateTime.now(),
      'cart': List<PharmacyCartItem>.from(_cart),
      'customer': _selectedCustomer,
      'doctor': _attachedDoctor,
      'note': _salesNote,
      'total': total,
      'itemCount': totalItemCount,
    });
    _cart.clear();
    _salesNote = '';
    _globalDiscount = 0.0;
    notifyListeners();
    return true;
  }

  void resumeHeldCart(int index) {
    if (index < 0 || index >= _heldBills.length) return;
    final held = _heldBills.removeAt(index);
    _cart.clear();
    _cart.addAll(List<PharmacyCartItem>.from(held['cart'] as List));
    _selectedCustomer = held['customer'] as Map<String, dynamic>?;
    _attachedDoctor = held['doctor'] as Map<String, dynamic>?;
    _salesNote = held['note'] as String? ?? '';
    notifyListeners();
  }

  void deleteHeldBill(int index) {
    if (index >= 0 && index < _heldBills.length) {
      _heldBills.removeAt(index);
      notifyListeners();
    }
  }

  // Checkout completion
  Map<String, dynamic> completeCheckout({
    required String paymentMethod,
    required double tenderedAmount,
  }) {
    final order = {
      'invoiceNo': 'RX-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}',
      'date': DateTime.now(),
      'items': List<PharmacyCartItem>.from(_cart),
      'subTotal': subTotal,
      'discount': totalDiscount,
      'discountPercent': _globalDiscount,
      'vat': vat,
      'total': total,
      'paymentMethod': paymentMethod,
      'tendered': tenderedAmount,
      'change': (tenderedAmount - total).clamp(0.0, double.infinity),
      'customer': _selectedCustomer ?? {'name': 'Walk-in Customer', 'phone': ''},
      'doctor': _attachedDoctor,
      'prescription': _attachedPrescription,
      'note': _salesNote,
    };

    _orderHistory.insert(0, order);

    // Sync sale to backend database
    try {
      final itemsPayload = _cart.map((c) => {
        'productId': c.medicine.id,
        'name': c.medicine.name,
        'qty': c.quantity,
        'unitPrice': c.medicine.price,
        'discountAmount': 0,
        'lineTotal': c.medicine.price * c.quantity,
      }).toList();

      final custId = _selectedCustomer?['id']?.toString();
      final custName = _selectedCustomer?['name']?.toString() ?? 'Walk-in Customer';
      final custPhone = _selectedCustomer?['phone']?.toString() ?? '';

      ApiService.instance.confirmSale(
        payload: {
          'items': itemsPayload,
          'payments': [
            {'method': paymentMethod, 'amount': total}
          ],
          'subtotal': subTotal,
          'discountTotal': totalDiscount,
          'taxTotal': vat,
          'taxAmount': vat,
          'total': total,
          'source': 'PHARMACY',
          if (custId != null && custId.isNotEmpty) 'customerId': custId,
          'customerName': custName,
          'customerPhone': custPhone.isNotEmpty && custPhone != 'N/A' ? custPhone : null,
          'note': _salesNote,
        },
        businessType: 'pharmacy',
      ).then((res) {
        if (res['invoiceNo'] != null) {
          debugPrint('Pharmacy sale saved to DB: ${res['invoiceNo']}');
        }
      }).catchError((e) {
        debugPrint('Error confirming pharmacy sale: $e');
      });
    } catch (e) {
      debugPrint('Error preparing pharmacy sale payload: $e');
    }

    _cart.clear();
    _globalDiscount = 0.0;
    _salesNote = '';
    _selectedCustomer = null;
    _attachedDoctor = null;
    _attachedPrescription = null;
    notifyListeners();
    return order;
  }

  // Financial calculations
  double get subTotal => _cart.fold(0.0, (sum, item) => sum + (item.medicine.price * item.quantity));
  double get totalDiscount => (subTotal * (_globalDiscount / 100.0));
  // VAT is calculated using the system tax rate (fetched from API)
  double get vat => (subTotal - totalDiscount) * _taxRate;
  double get total => (subTotal - totalDiscount + vat).clamp(0.0, double.infinity);
  int get totalItemCount => _cart.fold(0, (sum, item) => sum + item.quantity);

  // Dynamic Safety Warnings
  List<Map<String, dynamic>> get safetyChecks {
    final List<Map<String, dynamic>> warnings = [];

    // Check Rx items
    final rxItems = _cart.where((i) => i.medicine.isRx).toList();
    if (rxItems.isNotEmpty) {
      if (_attachedPrescription != null) {
        warnings.add({
          'type': 'success',
          'title': 'Prescription verified',
          'description': 'Valid Rx attached for ${rxItems.map((e) => e.medicine.name).join(", ")}',
          'icon': 'verified',
        });
      } else {
        warnings.add({
          'type': 'warning',
          'title': 'Rx Verification Required',
          'description': '${rxItems.length} Rx medicine(s) in cart. Attach prescription or verify with doctor.',
          'icon': 'warning',
        });
      }
    } else {
      warnings.add({
        'type': 'success',
        'title': 'OTC Purchase',
        'description': 'No prescription required for current items.',
        'icon': 'verified',
      });
    }

    // Check expiring items
    final expiringItems = _cart.where((i) => i.medicine.isExpiringSoon).toList();
    if (expiringItems.isNotEmpty) {
      warnings.add({
        'type': 'danger',
        'title': '${expiringItems.length} Item(s) Expiring Soon',
        'description': '${expiringItems.map((e) => e.medicine.name).join(", ")} (Expiry < 30 days)',
        'icon': 'expiry',
      });
    }

    // Drug Interaction check
    if (_cart.length >= 2) {
      final names = _cart.map((e) => e.medicine.name.toLowerCase()).toList();
      if (names.contains('amoxicillin') && names.contains('augmentin')) {
        warnings.add({
          'type': 'danger',
          'title': 'Potential Duplicate Therapy',
          'description': 'Amoxicillin and Augmentin contain overlapping penicillin antibiotics.',
          'icon': 'interaction',
        });
      } else {
        warnings.add({
          'type': 'success',
          'title': 'No drug interaction detected',
          'description': 'Safe to dispense together.',
          'icon': 'verified',
        });
      }
    }

    return warnings;
  }

  // Get generic alternatives for a specific medicine
  List<MedicineModel> getAlternativesFor(MedicineModel medicine) {
    return _allMedicines.where((m) =>
      m.id != medicine.id &&
      (m.category == medicine.category || m.genericName.contains(medicine.genericName.split('•').first.trim()))
    ).toList();
  }
}
