import 'package:flutter/material.dart';

/// FreshMart Grocery POS design tokens — premium green theme.
class GroceryColors {
  GroceryColors._();

  static const Color primary = Color(0xFF22C55E);
  static const Color primaryDark = Color(0xFF16A34A);
  static const Color primaryLight = Color(0xFFDCFCE7);
  static const Color primarySoft = Color(0xFFF0FDF4);
  static const Color mint = Color(0xFFECFDF5);
  static const Color accent = Color(0xFF4ADE80);

  static Color cardBg(bool isDark) =>
      isDark ? const Color(0xFF1E2420) : Colors.white;

  static Color surfaceBg(bool isDark) =>
      isDark ? const Color(0xFF151A17) : const Color(0xFFF4F7F5);

  static Color scaffoldBg(bool isDark) =>
      isDark ? const Color(0xFF0D110F) : const Color(0xFFEEF3F0);

  static Color inputBg(bool isDark) =>
      isDark ? const Color(0xFF252B27) : Colors.white;

  static Color textPrimary(bool isDark) =>
      isDark ? Colors.white : const Color(0xFF1A2E22);

  static Color textSecondary(bool isDark) =>
      isDark ? Colors.grey.shade400 : const Color(0xFF6B7C72);

  static Color border(bool isDark) =>
      isDark ? const Color(0xFF2E3832) : const Color(0xFFE2EBE5);

  static List<BoxShadow> softShadow(bool isDark, {double elevation = 1}) {
    if (isDark) {
      return [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.35 * elevation),
          blurRadius: 12 * elevation,
          offset: Offset(0, 4 * elevation),
        ),
      ];
    }
    return [
      BoxShadow(
        color: const Color(0xFF22C55E).withValues(alpha: 0.06 * elevation),
        blurRadius: 8 * elevation,
        offset: Offset(0, 2 * elevation),
      ),
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.04 * elevation),
        blurRadius: 16 * elevation,
        offset: Offset(0, 6 * elevation),
      ),
    ];
  }

  static List<BoxShadow> elevatedShadow(bool isDark) => softShadow(isDark, elevation: 1.6);

  static LinearGradient get primaryGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF4ADE80), Color(0xFF22C55E), Color(0xFF16A34A)],
      );

  static LinearGradient get payGradient => const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFF34D399), Color(0xFF22C55E), Color(0xFF16A34A)],
      );
}
