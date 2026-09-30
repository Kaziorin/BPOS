import 'package:flutter/material.dart';
import '../models/auth_user.dart';

/// Manages global app state: Theme, Locale, and Authentication/Active Business.
class AppProvider extends ChangeNotifier {
  bool _isDarkMode = false;
  String _locale = 'en'; // 'en' or 'bn'

  AuthUser? _currentUser;
  String? _selectedBusiness;

  bool get isDarkMode => _isDarkMode;
  String get locale => _locale;

  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  String? get selectedBusiness => _selectedBusiness;

  /// The active business to show in POS/Orders.
  String get activeBusiness =>
      _selectedBusiness ??
      (_currentUser?.primaryBusiness ?? 'restaurant');

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  void setLocale(String locale) {
    if (_locale == locale) return;
    _locale = locale;
    notifyListeners();
  }

  void login(AuthUser user) {
    _currentUser = user;
    if (user.isSingleBusiness) {
      // If user has only 1 business (e.g. only restaurant), select it directly!
      _selectedBusiness = user.businessTypes.first;
    } else {
      // Multi-business user can choose their business
      _selectedBusiness = null;
    }
    notifyListeners();
  }

  void selectBusiness(String business) {
    _selectedBusiness = business.toLowerCase().trim();
    notifyListeners();
  }

  void clearSelectedBusiness() {
    _selectedBusiness = null;
    notifyListeners();
  }

  void logout() {
    _currentUser = null;
    _selectedBusiness = null;
    notifyListeners();
  }
}
