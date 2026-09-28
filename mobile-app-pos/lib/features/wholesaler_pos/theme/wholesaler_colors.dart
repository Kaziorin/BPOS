import 'package:flutter/material.dart';

/// TradeMax Wholesaler POS – premium indigo/blue business theme.
class WholesalerColors {
  WholesalerColors._();

  // Brand primaries
  static const Color primary = Color(0xFF4F46E5);       // Indigo
  static const Color primaryDark = Color(0xFF3730A3);
  static const Color primaryLight = Color(0xFFEEF2FF);
  static const Color accent = Color(0xFF818CF8);
  static const Color accentBlue = Color(0xFF3B82F6);
  static const Color accentGreen = Color(0xFF10B981);   // Available credit
  static const Color accentRed = Color(0xFFEF4444);     // Outstanding / warning
  static const Color accentOrange = Color(0xFFF59E0B);  // Platinum badge
  static const Color accentPurple = Color(0xFF8B5CF6);

  // Status
  static const Color inStock = Color(0xFF10B981);
  static const Color lowStock = Color(0xFFF59E0B);
  static const Color outOfStock = Color(0xFFEF4444);

  // Surfaces (light/dark)
  static Color cardBg(bool isDark) =>
      isDark ? const Color(0xFF1E1B4B) : Colors.white;

  static Color surfaceBg(bool isDark) =>
      isDark ? const Color(0xFF13103A) : const Color(0xFFF1F5F9);

  static Color scaffoldBg(bool isDark) =>
      isDark ? const Color(0xFF0D0B2A) : const Color(0xFFE8EBF5);

  static Color inputBg(bool isDark) =>
      isDark ? const Color(0xFF1E1B4B) : Colors.white;

  static Color panelBg(bool isDark) =>
      isDark ? const Color(0xFF161337) : const Color(0xFFF8FAFF);

  static Color textPrimary(bool isDark) =>
      isDark ? const Color(0xFFE0E7FF) : const Color(0xFF1E1B4B);

  static Color textSecondary(bool isDark) =>
      isDark ? const Color(0xFF818CF8).withValues(alpha: 0.8) : const Color(0xFF64748B);

  static Color border(bool isDark) =>
      isDark ? const Color(0xFF2E2B6B) : const Color(0xFFE2E8F0);

  static Color divider(bool isDark) =>
      isDark ? const Color(0xFF252262) : const Color(0xFFF1F5F9);

  // Shadows (GPU / WebGL friendly, integer-cached to prevent shader compilation overflow)
  static List<BoxShadow> softShadow(bool isDark, {double elevation = 1}) {
    final alpha = isDark ? 0.3 : 0.05;
    final blur = (6.0 * elevation).clamp(2.0, 16.0).roundToDouble();
    final offsetY = (2.0 * elevation).clamp(1.0, 6.0).roundToDouble();

    return [
      BoxShadow(
        color: Colors.black.withValues(alpha: alpha),
        blurRadius: blur,
        offset: Offset(0, offsetY),
      ),
    ];
  }

  static List<BoxShadow> elevatedShadow(bool isDark) =>
      softShadow(isDark, elevation: 1.5);

  // Gradients
  static LinearGradient get primaryGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF818CF8), Color(0xFF4F46E5), Color(0xFF3730A3)],
      );

  static LinearGradient get deliveryGradient => const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFF4F46E5), Color(0xFF3730A3)],
      );

  static LinearGradient get headerGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF1E1B4B), Color(0xFF13103A)],
      );

  static LinearGradient get cardGradient3d => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF4338CA)],
        stops: [0.0, 0.5, 1.0],
      );

  static LinearGradient get greenGradient => const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFF10B981), Color(0xFF059669)],
      );

  // 3D card effect decoration
  static BoxDecoration card3dDecoration(bool isDark) => BoxDecoration(
        gradient: isDark
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  const Color(0xFF252262),
                  const Color(0xFF1E1B4B),
                  const Color(0xFF161337),
                ],
              )
            : null,
        color: isDark ? null : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? const Color(0xFF3730A3).withValues(alpha: 0.5)
              : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          if (!isDark) ...[
            BoxShadow(
              color: const Color(0xFF4F46E5).withValues(alpha: 0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ] else ...[
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.45),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
            BoxShadow(
              color: const Color(0xFF4F46E5).withValues(alpha: 0.15),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ],
      );
}
