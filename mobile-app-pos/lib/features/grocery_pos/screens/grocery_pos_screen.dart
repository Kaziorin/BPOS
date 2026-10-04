import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import '../widgets/category_chips.dart';
import '../widgets/footer_action_bar.dart';
import '../widgets/grocery_cart_panel.dart';
import '../widgets/grocery_header.dart';
import '../widgets/product_grid.dart';
import '../widgets/quick_actions_row.dart';
import '../widgets/summary_stats_bar.dart';

class GroceryPOSScreen extends StatefulWidget {
  const GroceryPOSScreen({super.key});

  @override
  State<GroceryPOSScreen> createState() => _GroceryPOSScreenState();
}

class _GroceryPOSScreenState extends State<GroceryPOSScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  bool _showMobileCart = false;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _fadeCtrl.forward();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnim,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final isMobile = width < 700;
          final isTablet = width >= 700 && width < 1100;

          return Scaffold(
            backgroundColor: GroceryColors.scaffoldBg(
              context.watch<AppProvider>().isDarkMode,
            ),
            floatingActionButton: isMobile && !_showMobileCart
                ? _MobileCartFab(onTap: () => setState(() => _showMobileCart = true))
                : null,
            body: SafeArea(
              child: isMobile
                  ? _MobileLayout(
                      showCart: _showMobileCart,
                      onCloseCart: () => setState(() => _showMobileCart = false),
                    )
                  : _DesktopTabletLayout(isTablet: isTablet),
            ),
          );
        },
      ),
    );
  }
}

// ── Desktop / Tablet ──────────────────────────────────────────
class _DesktopTabletLayout extends StatelessWidget {
  final bool isTablet;
  const _DesktopTabletLayout({required this.isTablet});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;

    return Column(
      children: [
        const GroceryHeader(),
        Expanded(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              isTablet ? 8 : 12,
              8,
              isTablet ? 8 : 12,
              8,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Left: catalog (~70% width)
                Expanded(
                  flex: isTablet ? 65 : 68,
                  child: Container(
                    decoration: BoxDecoration(
                      color: GroceryColors.cardBg(isDark),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: GroceryColors.border(isDark)),
                      boxShadow: GroceryColors.elevatedShadow(isDark),
                    ),
                    child: const Column(
                      children: [
                        SizedBox(height: 12),
                        CategoryChips(),
                        SizedBox(height: 12),
                        QuickActionsRow(),
                        SizedBox(height: 8),
                        Expanded(child: ProductGrid()),
                        SummaryStatsBar(),
                        FooterActionBar(),
                      ],
                    ),
                  ),
                ),
                SizedBox(width: isTablet ? 8 : 12),
                // Right: cart (~30% width)
                Expanded(
                  flex: isTablet ? 35 : 32,
                  child: const GroceryCartPanel(),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Mobile ───────────────────────────────────────────────────
class _MobileLayout extends StatelessWidget {
  final bool showCart;
  final VoidCallback onCloseCart;
  const _MobileLayout({required this.showCart, required this.onCloseCart});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;

    if (showCart) {
      return Column(
        children: [
          // Mini header with back
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: GroceryColors.cardBg(isDark),
            child: Row(
              children: [
                IconButton(
                  onPressed: onCloseCart,
                  icon: const Icon(Icons.arrow_back_rounded),
                  color: GroceryColors.primary,
                ),
                Text(
                  AppStrings.get('cart', context.watch<AppProvider>().locale),
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: GroceryColors.textPrimary(isDark),
                  ),
                ),
              ],
            ),
          ),
          const Expanded(
            child: Padding(
              padding: EdgeInsets.all(8),
              child: GroceryCartPanel(),
            ),
          ),
        ],
      );
    }

    return Column(
      children: [
        const GroceryHeader(),
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: GroceryColors.cardBg(isDark),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: GroceryColors.border(isDark)),
              boxShadow: GroceryColors.elevatedShadow(isDark),
            ),
            child: const Column(
              children: [
                SizedBox(height: 10),
                CategoryChips(),
                SizedBox(height: 10),
                QuickActionsRow(),
                SizedBox(height: 6),
                Expanded(child: ProductGrid()),
                SummaryStatsBar(),
                FooterActionBar(),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Mobile Cart FAB ──────────────────────────────────────────
class _MobileCartFab extends StatelessWidget {
  final VoidCallback onTap;
  const _MobileCartFab({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final p = context.watch<GroceryProvider>();
    final total = NumberUtils.toLocalized(p.grandTotal.toStringAsFixed(2), locale);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: BoxDecoration(
          gradient: GroceryColors.payGradient,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: GroceryColors.primary.withValues(alpha: 0.45),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shopping_cart_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              '${AppStrings.get('view_cart', locale)} · ${AppStrings.currency} $total',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
            if (p.totalItems > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  NumberUtils.toLocalized(p.totalItems, locale),
                  style: const TextStyle(
                    color: GroceryColors.primaryDark,
                    fontWeight: FontWeight.w900,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
