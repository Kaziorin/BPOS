import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import '../widgets/wholesaler_footer_bar.dart';
import '../widgets/wholesaler_header.dart';
import '../widgets/wholesaler_order_panel.dart';
import '../widgets/wholesaler_product_grid.dart';
import '../widgets/wholesaler_search_bar.dart';

// ─────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────
class WholesalerPOSScreen extends StatefulWidget {
  const WholesalerPOSScreen({super.key});

  @override
  State<WholesalerPOSScreen> createState() => _WholesalerPOSScreenState();
}

class _WholesalerPOSScreenState extends State<WholesalerPOSScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  bool _showMobileCart = false;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
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
    return ChangeNotifierProvider(
      create: (_) => WholesalerProvider(),
      child: FadeTransition(
        opacity: _fadeAnim,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            final isMobile = width < 700;
            final isTablet = width >= 700 && width < 1100;

            return Scaffold(
              backgroundColor: WholesalerColors.scaffoldBg(
                context.watch<AppProvider>().isDarkMode,
              ),
              floatingActionButton: isMobile && !_showMobileCart
                  ? _MobileCartFab(
                      onTap: () => setState(() => _showMobileCart = true),
                    )
                  : null,
              body: SafeArea(
                child: isMobile
                    ? _MobileLayout(
                        showCart: _showMobileCart,
                        onCloseCart: () =>
                            setState(() => _showMobileCart = false),
                      )
                    : _DesktopTabletLayout(isTablet: isTablet),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DESKTOP / TABLET LAYOUT
// ─────────────────────────────────────────────────────────────────
class _DesktopTabletLayout extends StatelessWidget {
  final bool isTablet;
  const _DesktopTabletLayout({required this.isTablet});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;

    return Column(
      children: [
        // ── Standalone Top Header Panel matching Screenshot ──
        Padding(
          padding: EdgeInsets.fromLTRB(
            isTablet ? 8 : 12,
            8,
            isTablet ? 8 : 12,
            4,
          ),
          child: const WholesalerHeader(),
        ),

        // ── Standalone 6-Metric Stats Bar below Header ──
        Padding(
          padding: EdgeInsets.fromLTRB(
            isTablet ? 8 : 12,
            0,
            isTablet ? 8 : 12,
            4,
          ),
          child: const WholesalerStatsBar(),
        ),

        // Main body (Left: Catalog Panel, Right: Order Panel)
        Expanded(
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              isTablet ? 8 : 12,
              2,
              isTablet ? 8 : 12,
              6,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Left: Catalog Panel ─────────────────────────────
                Expanded(
                  flex: isTablet ? 65 : 70,
                  child: _CatalogPanel(isDark: isDark),
                ),
                SizedBox(width: isTablet ? 8 : 12),
                // ── Right: Order Panel (Spans full height) ─────────────
                Expanded(
                  flex: isTablet ? 35 : 30,
                  child: const WholesalerOrderPanel(),
                ),
              ],
            ),
          ),
        ),

        // ── Full-width standalone Footer below BOTH Left & Right panels ──
        Padding(
          padding: EdgeInsets.fromLTRB(
            isTablet ? 8 : 12,
            0,
            isTablet ? 8 : 12,
            8,
          ),
          child: const WholesalerFooterBar(),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CATALOG PANEL (left side without extra footer inside)
// ─────────────────────────────────────────────────────────────────
class _CatalogPanel extends StatelessWidget {
  final bool isDark;
  const _CatalogPanel({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.elevatedShadow(isDark),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: const Column(
          children: [
            // Search + tabs
            WholesalerSearchBar(),
            // Category chips
            WholesalerCategoryChips(),
            SizedBox(height: 6),
            // Filter Toolbar (All Warehouses & Low stock on left; Sort, Filters & Grid/List on right)
            WholesalerFilterToolbar(),
            SizedBox(height: 6),
            // Product grid / list
            Expanded(child: WholesalerProductGrid()),
            // Pagination dots
            WholesalerPaginationDots(),
            SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// MOBILE LAYOUT
// ─────────────────────────────────────────────────────────────────
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
          // Mini header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: WholesalerColors.cardBg(isDark),
            child: Row(
              children: [
                IconButton(
                  onPressed: onCloseCart,
                  icon: const Icon(Icons.arrow_back_rounded),
                  color: WholesalerColors.primary,
                ),
                Text(
                  'Order Details',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: WholesalerColors.textPrimary(isDark),
                  ),
                ),
              ],
            ),
          ),
          const Expanded(
            child: Padding(
              padding: EdgeInsets.all(8),
              child: WholesalerOrderPanel(),
            ),
          ),
        ],
      );
    }

    return Column(
      children: [
        const WholesalerHeader(),
        const WholesalerStatsBar(),
        Expanded(
          child: Container(
            margin: const EdgeInsets.fromLTRB(10, 6, 10, 8),
            decoration: BoxDecoration(
              color: WholesalerColors.cardBg(isDark),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: WholesalerColors.border(isDark)),
              boxShadow: WholesalerColors.elevatedShadow(isDark),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: const Column(
                children: [
                  WholesalerSearchBar(),
                  WholesalerCategoryChips(),
                  SizedBox(height: 6),
                  WholesalerFilterToolbar(),
                  SizedBox(height: 6),
                  Expanded(child: WholesalerProductGrid()),
                  WholesalerPaginationDots(),
                  SizedBox(height: 4),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// MOBILE CART FAB
// ─────────────────────────────────────────────────────────────────
class _MobileCartFab extends StatefulWidget {
  final VoidCallback onTap;
  const _MobileCartFab({required this.onTap});

  @override
  State<_MobileCartFab> createState() => _MobileCartFabState();
}

class _MobileCartFabState extends State<_MobileCartFab>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseCtrl;
  late Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _pulse = Tween<double>(
      begin: 0.97,
      end: 1.03,
    ).animate(CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = context.watch<WholesalerProvider>();

    return GestureDetector(
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: w.totalItems > 0 ? _pulse : const AlwaysStoppedAnimation(1.0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
            gradient: WholesalerColors.deliveryGradient,
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: WholesalerColors.primary.withValues(alpha: 0.5),
                blurRadius: 18,
                offset: const Offset(0, 7),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.shopping_bag_rounded,
                color: Colors.white,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'View Order  •  ৳${w.grandTotal.toStringAsFixed(2)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 13,
                ),
              ),
              if (w.totalItems > 0) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    w.totalItems.toString(),
                    style: TextStyle(
                      color: WholesalerColors.primary,
                      fontWeight: FontWeight.w900,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
