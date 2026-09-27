import 'package:flutter/foundation.dart';
import '../models/medicine_model.dart';
import '../models/pharmacy_cart_item.dart';

class PharmacyProvider extends ChangeNotifier {
  final List<MedicineModel> _allMedicines = [
    MedicineModel(
      id: '1', name: 'Amoxicillin', genericName: 'Capsule • 500mg', price: 6.00, 
      category: 'Antibiotics', imagePath: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', 
      stock: 120, isRx: true, alternatives: 3
    ),
    MedicineModel(
      id: '2', name: 'Augmentin', genericName: 'Tablet • 625mg', price: 22.00, 
      category: 'Antibiotics', imagePath: 'https://images.unsplash.com/photo-1576073719710-aa465e310064?w=200', 
      stock: 85, isRx: true, alternatives: 2
    ),
    MedicineModel(
      id: '3', name: 'Azithromycin', genericName: 'Tablet • 500mg', price: 18.00, 
      category: 'Antibiotics', imagePath: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200', 
      stock: 18, isRx: false
    ),
    MedicineModel(
      id: '4', name: 'Becom-Z', genericName: 'Capsule', price: 6.50, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1626716595514-934440538183?w=200', 
      stock: 65
    ),
    MedicineModel(
      id: '5', name: 'Cetirizine', genericName: 'Tablet • 10mg', price: 6.00, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=200', 
      stock: 60
    ),
    MedicineModel(
      id: '6', name: 'Domstal', genericName: 'Tablet • 10mg', price: 7.00, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?w=200', 
      stock: 45
    ),
    MedicineModel(
      id: '7', name: 'Esomeprazole', genericName: 'Capsule • 20mg', price: 8.50, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200', 
      stock: 32
    ),
    MedicineModel(
      id: '8', name: 'Ibuprofen', genericName: 'Tablet • 400mg', price: 7.00, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1550572017-ed20015a7a40?w=200', 
      stock: 50
    ),
    MedicineModel(
      id: '9', name: 'Metformin', genericName: 'Tablet • 500mg', price: 4.00, 
      category: 'Diabetes Care', imagePath: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200', 
      stock: 12, isExpiringSoon: true
    ),
    MedicineModel(
      id: '10', name: 'Napa Extra', genericName: 'Tablet • 100mg', price: 12.00, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200', 
      stock: 28
    ),
    MedicineModel(
      id: '11', name: 'ORS', genericName: 'Powder • 21.8gm', price: 5.00, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200', 
      stock: 40
    ),
    MedicineModel(
      id: '12', name: 'Omeprazole', genericName: 'Capsule • 20mg', price: 8.00, 
      category: 'Gastrointestinal', imagePath: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=200', 
      stock: 75
    ),
    MedicineModel(
      id: '13', name: 'Paracetamol', genericName: 'Tablet • 500mg', price: 1.20, 
      category: 'Pain Relief', imagePath: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=200', 
      stock: 90
    ),
    MedicineModel(
      id: '14', name: 'Salbutamol', genericName: 'Inhaler • 100mcg', price: 15.00, 
      category: 'Respiratory', imagePath: 'https://images.unsplash.com/photo-1616671276441-2f2c277b8bf4?w=200', 
      stock: 22
    ),
    MedicineModel(
      id: '15', name: 'Vitamin C', genericName: 'Tablet • 500mg', price: 3.00, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=200', 
      stock: 55
    ),
    MedicineModel(
      id: '16', name: 'Vitamin D3', genericName: 'Capsule • 1000 IU', price: 10.00, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1614859132130-970678970e70?w=200', 
      stock: 38
    ),
    MedicineModel(
      id: '17', name: 'Zincovit', genericName: 'Tablet • 20mg', price: 2.50, 
      category: 'Vitamins & Supplements', imagePath: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200', 
      stock: 42
    ),
  ];

  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _selectedFilter = 'A-Z'; 
  
  final List<PharmacyCartItem> _cart = [];
  double _globalDiscount = 0.0;
  
  // Getters
  List<MedicineModel> get filteredMedicines {
    List<MedicineModel> temp = _allMedicines;
    if (_selectedCategory != 'All') {
      temp = temp.where((m) => m.category == _selectedCategory).toList();
    }
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      temp = temp.where((m) => m.name.toLowerCase().contains(q) || m.genericName.toLowerCase().contains(q)).toList();
    }
    if (_selectedFilter == 'A-Z') temp.sort((a, b) => a.name.compareTo(b.name));
    if (_selectedFilter == 'Low Stock') temp = temp.where((m) => m.isLowStock).toList();
    if (_selectedFilter == 'Expiring Soon') temp = temp.where((m) => m.isExpiringSoon).toList();
    return temp;
  }

  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  String get selectedFilter => _selectedFilter;
  List<PharmacyCartItem> get cart => _cart;
  double get globalDiscount => _globalDiscount;
  List<MedicineModel> get frequentlySold => _allMedicines.take(6).toList();

  void setSearchQuery(String query) { _searchQuery = query; notifyListeners(); }
  void setCategory(String category) { _selectedCategory = category; notifyListeners(); }
  void setFilter(String filter) { _selectedFilter = filter; notifyListeners(); }

  void addToCart(MedicineModel medicine) {
    final existingIndex = _cart.indexWhere((item) => item.medicine.id == medicine.id);
    if (existingIndex >= 0) { _cart[existingIndex].quantity++; } 
    else { _cart.add(PharmacyCartItem(medicine: medicine)); }
    notifyListeners();
  }

  void updateQuantity(String id, int change) {
    final index = _cart.indexWhere((item) => item.medicine.id == id);
    if (index >= 0) {
      _cart[index].quantity += change;
      if (_cart[index].quantity <= 0) _cart.removeAt(index);
      notifyListeners();
    }
  }

  void removeItem(String id) { _cart.removeWhere((item) => item.medicine.id == id); notifyListeners(); }
  void clearCart() { _cart.clear(); _globalDiscount = 0.0; notifyListeners(); }

  double get subTotal => _cart.fold(0.0, (sum, item) => sum + (item.medicine.price * item.quantity));
  double get totalDiscount => (subTotal * (_globalDiscount / 100.0));
  double get vat => (subTotal - totalDiscount) * 0.05;
  double get total => subTotal - totalDiscount + vat;
  int get totalItemCount => _cart.fold(0, (sum, item) => sum + item.quantity);
}
