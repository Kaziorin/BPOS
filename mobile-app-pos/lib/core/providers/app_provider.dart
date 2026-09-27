import 'package:flutter/material.dart';

/// Manages global app state: Dark/Light theme and EN/BN locale.
class AppProvider extends ChangeNotifier {
  bool _isDarkMode = false;
  String _locale = 'en'; // 'en' or 'bn'

  bool get isDarkMode => _isDarkMode;
  String get locale => _locale;

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  void setLocale(String locale) {
    if (_locale == locale) return;
    _locale = locale;
    notifyListeners();
  }
}
