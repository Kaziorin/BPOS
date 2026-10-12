import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/providers/app_provider.dart';
import '../../../core/theme/theme_extensions.dart';

import '../providers/pharmacy_provider.dart';
import '../../../core/widgets/fullscreen_button.dart';
import 'dialogs/pharmacy_dialogs.dart';
import '../../../core/widgets/live_sales_history_dialog.dart';

class PharmacyHeader extends StatelessWidget {
  final bool isMobile;
  final VoidCallback? onOpenCart;

  const PharmacyHeader({
    super.key,
    this.isMobile = false,
    this.onOpenCart,
  });

  @override
  Widget build(BuildContext context) {
    const primaryTeal = Color(0xFF009688);
    final buttonBg = primaryTeal.withValues(alpha: 0.1);
    final appProvider = context.watch<AppProvider>();

    if (isMobile) {
      return Consumer<PharmacyProvider>(
        builder: (context, pharmacyProvider, _) {
          return Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                // Logo Icon + Text
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: const BoxDecoration(
                        color: primaryTeal,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add_rounded, color: Colors.white, size: 22, weight: 800),
                    ),
                    const SizedBox(width: 6),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'BPOS',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: primaryTeal,
                            height: 1.1,
                          ),
                        ),
                        Text(
                          'Pharmacy',
                          style: TextStyle(
                            fontSize: 9,
                            color: Colors.grey,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(width: 8),

                // Search Bar
                Expanded(
                  child: Container(
                    height: 36,
                    padding: const EdgeInsets.symmetric(horizontal: 10.0),
                    decoration: BoxDecoration(
                      color: context.isDark ? context.scaffoldBg : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(18.0),
                      border: Border.all(
                        color: context.isDark ? context.dividerColor : Colors.grey.shade200,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.search_rounded, color: Colors.grey.shade500, size: 16),
                        const SizedBox(width: 6),
                        Expanded(
                          child: TextField(
                            onChanged: (val) => pharmacyProvider.setSearchQuery(val),
                            style: const TextStyle(fontSize: 12),
                            decoration: InputDecoration(
                              hintText: 'Search medicine...',
                              hintStyle: TextStyle(
                                color: Colors.grey.shade400,
                                fontSize: 11,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 4),

                // Theme Toggle
                IconButton(
                  onPressed: () => appProvider.toggleTheme(),
                  icon: Icon(
                    appProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                    color: Colors.grey.shade600,
                    size: 20,
                  ),
                  tooltip: appProvider.isDarkMode ? 'Light Mode' : 'Dark Mode',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
                const SizedBox(width: 2),

                // Home Button (on mobile view)
                IconButton(
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      Navigator.of(context).pop();
                    } else {
                      Navigator.of(context).maybePop();
                    }
                  },
                  icon: const Icon(
                    Icons.home_rounded,
                    color: primaryTeal,
                    size: 20,
                  ),
                  tooltip: 'Home',
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              ],
            ),
          );
        },
      );
    }

    return Container(
      height: 64, // Fixed height for alignment
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // ── BACK BUTTON (Web/Desktop - only shown if can pop) ──
          if (ModalRoute.of(context)?.canPop ?? false) ...[
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  if (Navigator.of(context).canPop()) {
                    Navigator.of(context).pop();
                  } else {
                    Navigator.of(context).maybePop();
                  }
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: context.isDark ? context.surfaceBg : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: context.dividerColor),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Icon(
                    Icons.arrow_back_rounded,
                    size: 20,
                    color: context.isDark ? Colors.white : Colors.grey.shade800,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],

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
                      onChanged: (val) => context.read<PharmacyProvider>().setSearchQuery(val),
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
                  IconButton(
                    icon: Icon(Icons.qr_code_scanner_rounded, color: Colors.grey.shade500, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => showPharmacyBarcodeScanDialog(context, context.read<PharmacyProvider>()),
                  ),
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
            onTap: () => showPharmacyScanRxDialog(context, context.read<PharmacyProvider>()),
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.barcode_reader,
            label: 'Scan Barcode',
            color: primaryTeal,
            bgColor: buttonBg,
            onTap: () => showPharmacyBarcodeScanDialog(context, context.read<PharmacyProvider>()),
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.refresh_rounded,
            label: 'Quick Refill',
            color: primaryTeal,
            bgColor: buttonBg,
            onTap: () => showPharmacyQuickRefillDialog(context, context.read<PharmacyProvider>()),
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.add_rounded,
            label: 'Add Medicine',
            color: primaryTeal,
            bgColor: buttonBg,
            onTap: () => showPharmacyAddMedicineDialog(context, context.read<PharmacyProvider>()),
          ),
          const SizedBox(width: 8),
          _HeaderActionButton(
            icon: Icons.receipt_long_rounded,
            label: 'Sales History',
            color: primaryTeal,
            bgColor: buttonBg,
            onTap: () => showLiveSalesHistoryDialog(context, businessType: 'pharmacy'),
          ),
          
          const SizedBox(width: 12),
          const VerticalDivider(width: 1, indent: 15, endIndent: 15),
          const SizedBox(width: 12),

          // ── FULLSCREEN TOGGLE ──
          FullscreenButton(
            iconColor: Colors.grey.shade600,
            iconSize: 22,
            padding: const EdgeInsets.all(8),
            borderRadius: BorderRadius.circular(10),
          ),
          const SizedBox(width: 4),

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
  final VoidCallback? onTap;

  const _HeaderActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.bgColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
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
      ),
    );
  }
}
