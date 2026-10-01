import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/auth_user.dart';
import '../services/api_service.dart';

/// Manages global app state: Theme, Locale, and Authentication/Active Business.
/// Persists auth session, selected business, theme, and locale across browser refresh and hot restart.
class AppProvider extends ChangeNotifier {
  static const _kUserKey = 'bpos_saved_user';
  static const _kBusinessKey = 'bpos_selected_business';
  static const _kDarkModeKey = 'bpos_is_dark_mode';
  static const _kLocaleKey = 'bpos_locale';

  bool _isDarkMode = false;
  String _locale = 'en'; // 'en' or 'bn'

  AuthUser? _currentUser;
  String? _selectedBusiness;
  bool _isInitialized = false;

  bool get isDarkMode => _isDarkMode;
  String get locale => _locale;

  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;
  bool get isInitialized => _isInitialized;

  String? get selectedBusiness => _selectedBusiness;

  /// The active business to show in POS/Orders.
  String get activeBusiness =>
      _selectedBusiness ??
      (_currentUser?.primaryBusiness ?? 'restaurant');

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _isDarkMode = prefs.getBool(_kDarkModeKey) ?? false;
      _locale = prefs.getString(_kLocaleKey) ?? 'en';
      _selectedBusiness = prefs.getString(_kBusinessKey);

      final userJsonStr = prefs.getString(_kUserKey);
      if (userJsonStr != null && userJsonStr.isNotEmpty) {
        final decoded = jsonDecode(userJsonStr);
        if (decoded is Map<String, dynamic>) {
          _currentUser = AuthUser.fromJson(decoded);
          if (_currentUser != null) {
            ApiService.instance.setAuth(_currentUser!.token, _currentUser!.tenantId);
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading saved auth state: $e');
    } finally {
      _isInitialized = true;
      notifyListeners();
    }
  }

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
    _saveToPrefs();
  }

  void setLocale(String locale) {
    if (_locale == locale) return;
    _locale = locale;
    notifyListeners();
    _saveToPrefs();
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
    ApiService.instance.setAuth(user.token, user.tenantId);
    notifyListeners();
    _saveToPrefs();
  }

  void selectBusiness(String business) {
    _selectedBusiness = business.toLowerCase().trim();
    notifyListeners();
    _saveToPrefs();
  }

  void clearSelectedBusiness() {
    _selectedBusiness = null;
    notifyListeners();
    _saveToPrefs();
  }

  void logout() {
    _currentUser = null;
    _selectedBusiness = null;
    notifyListeners();
    _clearPrefs();
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_currentUser != null) {
        await prefs.setString(_kUserKey, jsonEncode(_currentUser!.toJson()));
      } else {
        await prefs.remove(_kUserKey);
      }
      if (_selectedBusiness != null && _selectedBusiness!.isNotEmpty) {
        await prefs.setString(_kBusinessKey, _selectedBusiness!);
      } else {
        await prefs.remove(_kBusinessKey);
      }
      await prefs.setBool(_kDarkModeKey, _isDarkMode);
      await prefs.setString(_kLocaleKey, _locale);
    } catch (e) {
      debugPrint('Error saving to prefs: $e');
    }
  }

  Future<void> _clearPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_kUserKey);
      await prefs.remove(_kBusinessKey);
    } catch (e) {
      debugPrint('Error clearing prefs: $e');
    }
  }
}
