import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/app_provider.dart';
import '../../../core/theme/theme_extensions.dart';

class PharmacyHeader extends StatelessWidget {
  const PharmacyHeader({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryTeal = Color(0xFF009688);
    final buttonBg = primaryTeal.withValues(alpha: 0.1);
    final appProvider = context.watch<AppProvider>();

    return Container(
      height: 64, // Fixed height for alignment
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // ── LOGO ──
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  color: primaryTeal,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add_rounded, color: Colors.white, size: 26, weight: 800),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'MediCare',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: primaryTeal,
                      height: 1.1,
                    ),
                  ),
                  Text(
                    'Pharmacy',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(width: 24),
          
          // ── SEARCH BAR ──
          Expanded(
            child: Container(
              height: 42,
              padding: const EdgeInsets.symmetric(horizontal: 14.0),
              decoration: BoxDecoration(
                color: context.isDark ? context.scaffoldBg : Colors.white,
                borderRadius: BorderRadius.circular(22.0),
                border: Border.all(
                  color: context.isDark ? context.dividerColor : Colors.grey.withValues(alpha: 0.15),
                ),
                boxShadow: [
                  if (!context.isDark)
                    BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                children: [
                  Icon(Icons.search_rounded, color: Colors.grey.shade500, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Search medicine by name, brand or barcode...',
                        hintStyle: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 13,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  Icon(Icons.qr_code_scanner_rounded, color: Colors.grey.shade500, size: 20),
                ],
              ),
            ),
          ),

          const SizedBox(width: 16),

          // ── ACTION BUTTONS ──
          _HeaderActionButton(
            icon: Icons.camera_alt_outlined,
            label: 'Scan Rx',
            color: primaryTeal,
            bgColor: buttonBg,
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.barcode_reader,
            label: 'Scan Barcode',
            color: primaryTeal,
            bgColor: buttonBg,
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.refresh_rounded,
            label: 'Quick Refill',
            color: primaryTeal,
            bgColor: buttonBg,
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.add_rounded,
            label: 'Add Medicine',
            color: primaryTeal,
            bgColor: buttonBg,
          ),
          
          const SizedBox(width: 12),
          const VerticalDivider(width: 1, indent: 15, endIndent: 15),
          const SizedBox(width: 12),

          // ── THEME TOGGLE ──
          IconButton(
            onPressed: () => appProvider.toggleTheme(),
            icon: Icon(
              appProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              color: Colors.grey.shade600,
              size: 22,
            ),
            tooltip: appProvider.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
          ),
        ],
      ),
    );
  }
}

class _HeaderActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bgColor;

  const _HeaderActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}
