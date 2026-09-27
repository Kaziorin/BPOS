import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/theme/theme_extensions.dart';
import '../../../core/utils/number_utils.dart';
import 'dialogs/pos_dialogs.dart';
import 'dialogs/hardware_settings_dialog.dart';

class POSHeader extends StatelessWidget {
  const POSHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;
    final locale = context.watch<AppProvider>().locale;

    return SizedBox(
      height: isMobile ? 64 : 74,
      child: CustomPaint(
        painter: _SimpleWavePainter(),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 14 : 24,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // ── LOGO ──
              _LogoWidget(isMobile: isMobile),

              SizedBox(width: isMobile ? 6 : 24),

              // ── MIDDLE SECTION & RIGHT ICONS ──
              Expanded(
                child: Align(
                  alignment: Alignment.centerRight,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (!isMobile) ...[
                          OrderTypeSegmentedControl(locale: locale),
                          const SizedBox(width: 16),
                          _SearchBar(locale: locale),
                          const SizedBox(width: 16),
                          _RightIcons(isMobile: false, locale: locale),
                        ] else ...[
                          _RightIcons(isMobile: true, locale: locale),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// BACKGROUND PAINTER
// ─────────────────────────────────────────────────────────────────
class _SimpleWavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final rect = Rect.fromLTWH(0, 0, w, h);

    final basePaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFFF7A45), Color(0xFFFF5722)],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ).createShader(rect);
    canvas.drawRect(rect, basePaint);

    final wavePaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFFF5722), Color(0xFFE64A19)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(rect);

    final wavePath = Path();
    wavePath.moveTo(w * 0.25, 0);
    wavePath.cubicTo(w * 0.35, 0, w * 0.30, h * 0.8, w * 0.50, h);
    wavePath.lineTo(w, h);
    wavePath.lineTo(w, 0);
    wavePath.close();

    canvas.drawPath(wavePath, wavePaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ─────────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────────
class _LogoWidget extends StatelessWidget {
  final bool isMobile;
  const _LogoWidget({this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.soup_kitchen, color: Colors.white, size: isMobile ? 32 : 40),
        const SizedBox(width: 8),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ZestBite',
              style: TextStyle(
                color: Colors.white,
                fontSize: isMobile ? 18 : 22,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
                height: 1.1,
              ),
            ),
            const Text(
              'POS SYSTEM',
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.5,
                height: 1.2,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ORDER TYPE BUTTONS
// ─────────────────────────────────────────────────────────────────
class OrderTypeSegmentedControl extends StatelessWidget {
  final bool isMobile;
  final String? locale;
  const OrderTypeSegmentedControl({super.key, this.isMobile = false, this.locale});

  @override
  Widget build(BuildContext context) {
    final currentLocale = locale ?? context.watch<AppProvider>().locale;
    
    return Container(
      height: isMobile ? 36 : 44,
      decoration: BoxDecoration(
        color: context.inputBg,
        borderRadius: BorderRadius.circular(22),
        boxShadow: isMobile
            ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))]
            : null,
      ),
      child: Consumer<POSProvider>(
        builder: (context, provider, _) {
          final selected = provider.selectedOrderType;
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _SegmentButton(
                label: AppStrings.get('dine_in', currentLocale),
                icon: Icons.dining,
                isSelected: selected == 'dine_in',
                isMobile: isMobile,
                onTap: () => provider.selectOrderType('dine_in'),
              ),
              _VerticalDivider(),
              _SegmentButton(
                label: AppStrings.get('take_away', currentLocale),
                icon: Icons.shopping_bag_outlined,
                isSelected: selected == 'take_away',
                isMobile: isMobile,
                onTap: () => provider.selectOrderType('take_away'),
              ),
              _VerticalDivider(),
              _SegmentButton(
                label: AppStrings.get('delivery', currentLocale),
                icon: Icons.delivery_dining,
                isSelected: selected == 'delivery',
                isMobile: isMobile,
                onTap: () => provider.selectOrderType('delivery'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SegmentButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final bool isMobile;
  final VoidCallback onTap;

  const _SegmentButton({
    required this.label,
    required this.icon,
    required this.isSelected,
    this.isMobile = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isSelected ? const Color(0xFFFF5722) : context.textPrimary;
    
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: isMobile ? 10 : 16),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: isMobile ? 15 : 18, color: color),
            SizedBox(width: isMobile ? 5 : 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                fontSize: isMobile ? 12 : 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 20,
      color: context.dividerColor,
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SEARCH BAR
// ─────────────────────────────────────────────────────────────────
class _SearchBar extends StatelessWidget {
  final String locale;
  const _SearchBar({required this.locale});

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final barWidth = w >= 1100 ? 300.0 : 240.0;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Container(
          width: barWidth,
          height: 44,
          decoration: BoxDecoration(
            color: context.inputBg,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            children: [
              const SizedBox(width: 16),
              Icon(Icons.search, color: context.textHint, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  onChanged: provider.setSearchQuery,
                  style: TextStyle(
                    fontSize: 14,
                    color: context.textPrimary,
                  ),
                  decoration: InputDecoration(
                    hintText: AppStrings.get('search_hint', locale),
                    hintStyle: TextStyle(
                      color: context.textHint,
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
              const SizedBox(width: 16),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// RIGHT ICONS
// ─────────────────────────────────────────────────────────────────
class _RightIcons extends StatelessWidget {
  final bool isMobile;
  final String locale;
  const _RightIcons({this.isMobile = false, required this.locale});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final appProvider = Provider.of<AppProvider>(context);
    const primaryOrange = Color(0xFFFF6D00);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!isMobile) ...[
          // Theme Toggle
          IconButton(
            icon: Icon(
              appProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              color: Colors.white,
            ),
            onPressed: () => appProvider.toggleTheme(),
            tooltip: AppStrings.get(appProvider.isDarkMode ? 'light_mode' : 'dark_mode', locale),
          ),

          // Language Toggle
          TextButton(
            onPressed: () {
              appProvider.setLocale(appProvider.locale == 'en' ? 'bn' : 'en');
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: Colors.white.withValues(alpha: 0.1),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              appProvider.locale == 'en' ? 'BN' : 'EN',
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
            ),
          ),
          const SizedBox(width: 12),
        ],
        if (isMobile) ...[

          IconButton(
            icon: Icon(
              provider.isMobileSearchOpen ? Icons.close : Icons.search,
              color: Colors.white,
            ),
            onPressed: () => provider.toggleMobileSearch(),
            splashRadius: 24,
          ),
          const SizedBox(width: 2),
        ],
        IconButton(
          icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
          onPressed: () {
            showDialog(
              context: context,
              builder: (_) => BarcodeScannerDialog(),
            );
          },
          splashRadius: 24,
        ),
        const SizedBox(width: 2),
        Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none, color: Colors.white),
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (_) => const NotificationListDialog(),
                );
              },
              splashRadius: 24,
            ),
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: const Text(
                  '৩',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    height: 1,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(width: 4),
        PopupMenuButton<String>(
          color: context.cardBg,
          offset: Offset(0, isMobile ? 50 : 56),
          icon: const Icon(Icons.more_vert, color: Colors.white),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          onSelected: (val) {
            final posProvider = Provider.of<POSProvider>(context, listen: false);
            final appProv = Provider.of<AppProvider>(context, listen: false);
            if (val == 'waiter') {
              showDialog(context: context, builder: (_) => const WaiterSelectionDialog());
            } else if (val == 'custom_item') {
              showDialog(context: context, builder: (_) => CustomItemDialog());
            } else if (val == 'split') {
              showDialog(context: context, builder: (_) => const SplitBillDialog());
            } else if (val == 'transfer') {
              showDialog(context: context, builder: (_) => const TransferOrderDialog());
            } else if (val == 'held') {
              showDialog(context: context, builder: (_) => const HeldOrdersDialog());
            } else if (val == 'clear') {
              posProvider.clearCart();
            } else if (val == 'shift') {
              final msg = '${AppStrings.get('shift_sales_total', locale)}: ৳${NumberUtils.toLocalized('248.50', locale)} | ${AppStrings.get('cash_drawer', locale)}: ৳${NumberUtils.toLocalized('500.00', locale)}';
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(msg), backgroundColor: const Color(0xFFFF6D00)),
              );
            } else if (val == 'hardware') {
              showDialog(context: context, builder: (_) => const HardwareSettingsDialog());
            } else if (val == 'help') {
              showAboutDialog(
                context: context,
                applicationName: locale == 'bn' ? 'জেস্টবাইট POS সিস্টেম' : 'ZestBite POS System',
                applicationVersion: '1.0.0',
                applicationLegalese: '© 2026 ZestBite Technologies Inc.',
              );
            } else if (val == 'toggle_theme') {
              appProv.toggleTheme();
            } else if (val == 'toggle_lang') {
              appProv.setLocale(appProv.locale == 'en' ? 'bn' : 'en');
            }
          },
          itemBuilder: (context) {
            final textStyle = TextStyle(color: context.textPrimary);
            final appProvider = Provider.of<AppProvider>(context, listen: false);
            
            return [
              if (isMobile) ...[
                PopupMenuItem(
                  value: 'toggle_theme',
                  child: Row(
                    children: [
                      Icon(appProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded, size: 18, color: primaryOrange),
                      const SizedBox(width: 8),
                      Text(AppStrings.get(appProvider.isDarkMode ? 'light_mode' : 'dark_mode', locale), style: textStyle),
                    ],
                  ),
                ),

                PopupMenuItem(
                  value: 'toggle_lang',
                  child: Row(
                    children: [
                      const Icon(Icons.language_rounded, size: 18, color: primaryOrange),
                      const SizedBox(width: 8),
                      Text(appProvider.locale == 'en' ? 'বাংলা' : 'English', style: textStyle),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'waiter',
                  child: Consumer<POSProvider>(
                    builder: (context, pos, _) {
                      return Row(
                        children: [
                          const Icon(Icons.person_outline, size: 18, color: Color(0xFFFF6D00)),
                          const SizedBox(width: 8),
                          Text(
                            '${AppStrings.get('waiter_menu', locale)}: ${AppStrings.get(pos.waiterKey, locale)}',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: context.textPrimary),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                PopupMenuItem(
                  value: 'custom_item',
                  child: Row(
                    children: [
                      const Icon(Icons.soup_kitchen_outlined, size: 18, color: Color(0xFFFF6D00)),
                      const SizedBox(width: 8),
                      Text(AppStrings.get('custom_item', locale), style: textStyle),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'split',
                  child: Row(
                    children: [
                      const Icon(Icons.call_split, size: 18, color: Color(0xFF2196F3)),
                      const SizedBox(width: 8),
                      Text(AppStrings.get('split_bill', locale), style: textStyle),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'transfer',
                  child: Row(
                    children: [
                      const Icon(Icons.sync_alt, size: 18, color: Color(0xFF4CAF50)),
                      const SizedBox(width: 8),
                      Text(AppStrings.get('transfer_order', locale), style: textStyle),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
              ],
              PopupMenuItem(value: 'held', child: Row(children: [const Icon(Icons.pause_circle_outline, size: 18), const SizedBox(width: 8), Text(AppStrings.get('held_orders', locale), style: textStyle)])),
              PopupMenuItem(value: 'shift', child: Row(children: [const Icon(Icons.point_of_sale, size: 18), const SizedBox(width: 8), Text(AppStrings.get('shift_report', locale), style: textStyle)])),
              PopupMenuItem(value: 'clear', child: Row(children: [const Icon(Icons.cleaning_services, size: 18), const SizedBox(width: 8), Text(AppStrings.get('clear_cart_menu', locale), style: textStyle)])),
              const PopupMenuDivider(),
              PopupMenuItem(
                value: 'hardware',
                child: Row(
                  children: [
                    const Icon(Icons.settings_input_composite_rounded, size: 18, color: Color(0xFF607D8B)),
                    const SizedBox(width: 8),
                    Text(AppStrings.get('hardware_settings', locale), style: textStyle),
                  ],
                ),
              ),
              PopupMenuItem(value: 'help', child: Row(children: [const Icon(Icons.info_outline, size: 18), const SizedBox(width: 8), Text(AppStrings.get('system_info', locale), style: textStyle)])),
            ];
          },
        ),
      ],
    );
  }
}
