import 'package:flutter/material.dart';

/// Quick helpers to read theme-aware colors from any BuildContext.
extension AppThemeContext on BuildContext {
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  // Backgrounds
  Color get cardBg     => isDark ? const Color(0xFF252525) : Colors.white;
  Color get surfaceBg  => isDark ? const Color(0xFF1A1A1A) : Colors.white;
  Color get scaffoldBg => isDark ? const Color(0xFF0F0F0F) : const Color(0xFFF8F9FA);
  Color get inputBg    => isDark ? const Color(0xFF2C2C2C) : Colors.white;

  // Text
  Color get textPrimary   => isDark ? Colors.white                       : Colors.black87;
  Color get textSecondary => isDark ? Colors.grey.shade400               : Colors.grey.shade600;
  Color get textHint      => isDark ? Colors.grey.shade600               : Colors.grey.shade400;

  // Borders / Dividers
  Color get dividerColor => isDark ? const Color(0xFF333333) : Colors.grey.shade200;
  Color get borderColor  => isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade200;
}
