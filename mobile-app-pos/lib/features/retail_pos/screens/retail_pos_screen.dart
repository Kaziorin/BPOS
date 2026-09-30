import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import '../widgets/retail_header.dart';
import '../widgets/retail_metrics_bar.dart';
import '../widgets/retail_category_bar.dart';
import '../widgets/retail_product_catalog.dart';
import '../widgets/retail_cart_panel.dart';
import '../widgets/retail_footer_bar.dart';

class RetailPOSScreen extends StatefulWidget {
  const RetailPOSScreen({super.key});

  @override
  State<RetailPOSScreen> createState() => _RetailPOSScreenState();
}

class _RetailPOSScreenState extends State<RetailPOSScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isGridView = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<RetailProvider>().loadProducts(businessType: 'retail');
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final surfaceColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final bgColor = isDark ? const Color(0xFF121212) : const Color(0xFFF4F5FA);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isMobile = constraints.maxWidth < 900;

            return Column(
              children: [
                // ── 1. TOP HEADER BAR ─────────────────────────────────────
                RetailHeader(searchController: _searchController),

                // ── 2. METRICS & INSIGHTS BAR (Desktop/Web only) ─────────
                if (!isMobile) const RetailMetricsBar(),

                // ── 3. MAIN CONTENT BODY ──────────────────────────────────
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(10.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left Catalog Section (Takes all remaining width)
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: surfaceColor,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              children: [
                                // Category Tabs & View Mode Toggle
                                RetailCategoryBar(
                                  isGridView: _isGridView,
                                  onViewModeChanged: (val) => setState(() => _isGridView = val),
                                ),

                                // Product Grid / List View (Full scrollable catalog, no pagination)
                                Expanded(
                                  child: RetailProductCatalog(
                                    isGridView: _isGridView,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Right Cart Panel (Desktop: w-[420px], XL >= 1280: w-[480px])
                        if (!isMobile) ...[
                          const SizedBox(width: 10),
                          SizedBox(
                            width: constraints.maxWidth >= 1280 ? 480.0 : 420.0,
                            child: Container(
                              decoration: BoxDecoration(
                                color: surfaceColor,
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const RetailCartPanel(isMobile: false),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                // ── 4. BOTTOM FOOTER BAR (Desktop/Web only) ──────────────
                if (!isMobile) RetailFooterBar(screenWidth: constraints.maxWidth),

                // ── 5. MOBILE BOTTOM FLOATING CART BAR (< 900px) ──────────
                if (isMobile) const RetailMobileBottomBar(),
              ],
            );
          },
        ),
      ),
    );
  }
}
