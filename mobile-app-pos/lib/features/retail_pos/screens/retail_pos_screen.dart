import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import '../models/retail_product.dart';
import '../models/retail_cart_item.dart';
import '../models/retail_sale.dart';

class RetailPOSScreen extends StatefulWidget {
  const RetailPOSScreen({super.key});

  @override
  State<RetailPOSScreen> createState() => _RetailPOSScreenState();
}

class _RetailPOSScreenState extends State<RetailPOSScreen> {
  final TextEditingController _searchController = TextEditingController();
  bool _isGridView = true;
  int _currentPage = 1;
  static const int _itemsPerPage = 10;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final locale = appProvider.locale;
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
                _buildHeaderBar(context, appProvider, retailProvider, locale, isDark, surfaceColor),

                // ── 2. METRICS & INSIGHTS BAR ─────────────────────────────
                _buildMetricsBar(context, retailProvider, locale, isDark, surfaceColor),

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
                                _buildCategoryTabBar(context, retailProvider, locale, isDark),

                                // Product Grid / List View
                                Expanded(
                                  child: _buildProductCatalog(context, retailProvider, constraints.maxWidth, isDark),
                                ),

                                // Pagination Footer Bar
                                _buildPaginationFooter(
                                  context,
                                  retailProvider.filteredProducts.length,
                                  _currentPage,
                                  (retailProvider.filteredProducts.length / _itemsPerPage).ceil().clamp(1, 9999),
                                  isDark,
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
                              child: _buildCartPanelContent(context, retailProvider, locale, isDark, isMobile: false),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                // ── 4. BOTTOM FOOTER BAR ─────────────────────────────
                _buildBottomFooterBar(context, retailProvider, isDark, surfaceColor, constraints.maxWidth),

                // ── 5. MOBILE BOTTOM FLOATING CART BAR (< 900px) ──────────
                if (isMobile) _buildMobileBottomBar(context, retailProvider, locale, isDark),
              ],
            );
          },
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. TOP HEADER BAR
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildHeaderBar(
    BuildContext context,
    AppProvider appProvider,
    RetailProvider retailProvider,
    String locale,
    bool isDark,
    Color surfaceColor,
  ) {
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          // 1. Back Button
          InkWell(
            onTap: () => Navigator.of(context).pop(),
            borderRadius: BorderRadius.circular(4),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, size: 18),
            ),
          ),
          const SizedBox(width: 8),

          // 2. Purple Icon Box
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
              ),
              borderRadius: BorderRadius.circular(4),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.check_box_outlined, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 8),

          // 3. Title & Subtitle
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Text(
                    'Enterprise POS',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : Colors.grey.shade800,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Premium',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF8B5CF6),
                      ),
                    ),
                  ),
                ],
              ),
              Text(
                'Terminal ID: T-01 • Outlet: fgd',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(width: 10),

          // 4. Online Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(radius: 3.5, backgroundColor: Color(0xFF10B981)),
                SizedBox(width: 5),
                Text(
                  'Online',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // 5. Center Search Bar
          Expanded(
            child: Container(
              height: 38,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  Icon(Icons.search_rounded, size: 18, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => retailProvider.setSearchQuery(val),
                      style: const TextStyle(fontSize: 12),
                      decoration: InputDecoration(
                        hintText: 'Search product by name, SKU or barcode...',
                        hintStyle: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  Icon(Icons.crop_free_rounded, size: 18, color: isDark ? Colors.grey.shade400 : Colors.grey.shade400),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),

          // 6. Right Controls: Fullscreen, Quick Actions, Date/Time, Cashier
          if (screenWidth >= 700) ...[
            // Fullscreen Square Icon Button
            InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(4),
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: const Icon(Icons.fullscreen_rounded, size: 20, color: Color(0xFF8B5CF6)),
              ),
            ),
            const SizedBox(width: 8),

            // Quick Actions Button
            InkWell(
              onTap: () => _showHoldsModal(context, retailProvider, locale, isDark),
              borderRadius: BorderRadius.circular(4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                  ),
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  children: [
                    Icon(Icons.bolt_rounded, size: 16, color: Colors.amber),
                    SizedBox(width: 4),
                    Text(
                      'Quick Actions',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Colors.white),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Date & Time Pill
            if (screenWidth >= 1050)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.access_time_rounded, size: 16, color: Color(0xFF8B5CF6)),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Sep 27, 2026',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.grey.shade800),
                        ),
                        Text(
                          '01:15 PM',
                          style: TextStyle(fontSize: 9, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            if (screenWidth >= 1050) const SizedBox(width: 8),

            // Cashier Dropdown Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFF8B5CF6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_rounded, size: 12, color: Colors.white),
                  ),
                  const SizedBox(width: 6),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Cashier',
                        style: TextStyle(fontSize: 9, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                      ),
                      Text(
                        'Super Administrator',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.grey.shade800),
                      ),
                    ],
                  ),
                  const SizedBox(width: 4),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. METRICS & INSIGHTS BAR
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildMetricsBar(
    BuildContext context,
    RetailProvider retailProvider,
    String locale,
    bool isDark,
    Color surfaceColor,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : Colors.grey.shade200,
          ),
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 980;

          final card1 = _MetricCard(
            title: 'SALES TODAY',
            value: '৳147.00',
            badge: '+12.5%',
            icon: Icons.show_chart_rounded,
            color: const Color(0xFF8B5CF6),
            isDark: isDark,
          );

          final card2 = _MetricCard(
            title: 'TRANSACTIONS',
            value: '1',
            badge: '+8.1%',
            icon: Icons.receipt_long_rounded,
            color: const Color(0xFF3B82F6),
            isDark: isDark,
          );

          final card3 = _MetricCard(
            title: 'AVG. SALE',
            value: '৳147.00',
            badge: '+5.2%',
            icon: Icons.local_offer_outlined,
            color: const Color(0xFFF59E0B),
            isDark: isDark,
          );

          final card4 = _MetricCard(
            title: 'ITEMS SOLD',
            value: '128',
            badge: '+10.1%',
            icon: Icons.inventory_2_outlined,
            color: const Color(0xFF10B981),
            isDark: isDark,
          );

          final card5 = _buildStockAlertsCard(isDark);
          final card6 = _buildAiInsightsCard(context, isDark);
          final card7 = _buildAddCustomerCard(context, retailProvider, isDark);

          if (isWide) {
            return Row(
              children: [
                Expanded(flex: 10, child: card1),
                const SizedBox(width: 8),
                Expanded(flex: 10, child: card2),
                const SizedBox(width: 8),
                Expanded(flex: 10, child: card3),
                const SizedBox(width: 8),
                Expanded(flex: 10, child: card4),
                const SizedBox(width: 8),
                Expanded(flex: 10, child: card5),
                const SizedBox(width: 8),
                Expanded(flex: 15, child: card6),
                const SizedBox(width: 8),
                Expanded(flex: 10, child: card7),
              ],
            );
          } else {
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  SizedBox(width: 130, child: card1),
                  const SizedBox(width: 8),
                  SizedBox(width: 125, child: card2),
                  const SizedBox(width: 8),
                  SizedBox(width: 125, child: card3),
                  const SizedBox(width: 8),
                  SizedBox(width: 120, child: card4),
                  const SizedBox(width: 8),
                  SizedBox(width: 120, child: card5),
                  const SizedBox(width: 8),
                  SizedBox(width: 220, child: card6),
                  const SizedBox(width: 8),
                  SizedBox(width: 135, child: card7),
                ],
              ),
            );
          }
        },
      ),
    );
  }

  Widget _buildStockAlertsCard(bool isDark) {
    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(4),
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF2D1216) : const Color(0xFFFFF1F2),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isDark ? const Color(0xFF5F1D24) : const Color(0xFFFECDD3),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFE11D48).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.notifications_none_rounded, size: 16, color: Color(0xFFE11D48)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'STOCK ALERTS',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFE11D48),
                      letterSpacing: 0.2,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 1),
                  Row(
                    children: [
                      const Text(
                        '8',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFE11D48),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE11D48).withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'View',
                          style: TextStyle(
                            fontSize: 8.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFE11D48),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAiInsightsCard(BuildContext context, bool isDark) {
    return InkWell(
      onTap: () => _showAiInsightsModal(context, isDark),
      borderRadius: BorderRadius.circular(4),
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFF5F3FF),
          gradient: isDark
              ? const LinearGradient(colors: [Color(0xFF1E1B4B), Color(0xFF2E1065)])
              : const LinearGradient(colors: [Color(0xFFF5F3FF), Color(0xFFFAF5FF), Color(0xFFEEF2FF)]),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isDark ? const Color(0xFF3730A3) : const Color(0xFFDDD6FE),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                ),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.shopping_bag_outlined, size: 16, color: Colors.white),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      const Text(
                        'AI INSIGHTS',
                        style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF7C3AED),
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.3)),
                        ),
                        child: const Text(
                          'Interactive',
                          style: TextStyle(fontSize: 7.5, fontWeight: FontWeight.bold, color: Color(0xFF7C3AED)),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'High demand for Beverages',
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : Colors.grey.shade800,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Text(
                    'Click to view smart suggestions',
                    style: TextStyle(fontSize: 8, color: Color(0xFF8B5CF6), fontWeight: FontWeight.w500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddCustomerCard(BuildContext context, RetailProvider retailProvider, bool isDark) {
    return InkWell(
      onTap: () => _showAddCustomerDialog(context, retailProvider, isDark),
      borderRadius: BorderRadius.circular(4),
      child: Container(
        height: 50,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF242424) : Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.person_outline_rounded, size: 16, color: Color(0xFF8B5CF6)),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                retailProvider.selectedCustomer == 'Walk-in Customer'
                    ? 'Add Customer'
                    : retailProvider.selectedCustomer,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.grey.shade300 : Colors.grey.shade800,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. CATEGORY TAB BAR & VIEW MODE TOGGLE
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildCategoryTabBar(
    BuildContext context,
    RetailProvider retailProvider,
    String locale,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          // Scrollable Category Chips
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: retailProvider.categories.map((cat) {
                  final selected = retailProvider.selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6.0),
                    child: InkWell(
                      onTap: () {
                        retailProvider.setSelectedCategory(cat);
                        setState(() => _currentPage = 1);
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFF8B5CF6)
                              : (isDark ? const Color(0xFF2A2A2A) : Colors.white),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: selected
                                ? const Color(0xFF8B5CF6)
                                : (isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE2E8F0)),
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Text(
                          cat,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                            color: selected
                                ? Colors.white
                                : (isDark ? Colors.grey.shade300 : const Color(0xFF475569)),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Grid / List Toggle
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                InkWell(
                  onTap: () => setState(() => _isGridView = true),
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _isGridView
                          ? (isDark ? const Color(0xFF3A3A3A) : Colors.white)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: _isGridView && !isDark
                          ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.grid_view_rounded,
                          size: 14,
                          color: _isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade500,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'Grid',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                InkWell(
                  onTap: () => setState(() => _isGridView = false),
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: !_isGridView
                          ? (isDark ? const Color(0xFF3A3A3A) : Colors.white)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: !_isGridView && !isDark
                          ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.format_list_bulleted_rounded,
                          size: 14,
                          color: !_isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade500,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'List',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: !_isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PRODUCT CATALOG GRID / LIST
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildProductCatalog(
    BuildContext context,
    RetailProvider retailProvider,
    double screenWidth,
    bool isDark,
  ) {
    final products = retailProvider.filteredProducts;

    if (products.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey.shade400),
            const SizedBox(height: 10),
            Text(
              'No products found',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
            ),
          ],
        ),
      );
    }

    final totalPages = (products.length / _itemsPerPage).ceil().clamp(1, 9999);
    final validCurrentPage = _currentPage.clamp(1, totalPages);
    final startIndex = (validCurrentPage - 1) * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(0, products.length);
    final paginatedProducts = startIndex < products.length
        ? products.sublist(startIndex, endIndex)
        : <RetailProduct>[];

    if (!_isGridView) {
      // List View
      return ListView.separated(
        padding: const EdgeInsets.all(8),
        itemCount: paginatedProducts.length,
        separatorBuilder: (_, _) => const SizedBox(height: 6),
        itemBuilder: (context, index) {
          final p = paginatedProducts[index];
          final inCart = retailProvider.cart.firstWhere(
            (item) => item.product.id == p.id,
            orElse: () => RetailCartItem(product: p, qty: 0),
          );

          return Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF242424) : Colors.white,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: inCart.qty > 0
                    ? const Color(0xFF8B5CF6)
                    : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Image.network(
                    p.imageUrl,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                      width: 44,
                      height: 44,
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      child: const Icon(Icons.inventory_2_outlined, size: 18, color: Color(0xFF94A3B8)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        p.name,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : const Color(0xFF1E293B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        'SKU: ${p.sku} • Stock: ${p.stock}',
                        style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                ),
                Text(
                  '৳${p.price.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(width: 10),
                InkWell(
                  onTap: () => retailProvider.addToCart(p),
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      '+ Add',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      );
    }

    int crossAxisCount = 2;
    if (screenWidth >= 1400) {
      crossAxisCount = 5;
    } else if (screenWidth >= 1000) {
      crossAxisCount = 4;
    } else if (screenWidth >= 650) {
      crossAxisCount = 3;
    }

    return GridView.builder(
      padding: const EdgeInsets.all(10),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        childAspectRatio: 0.95,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: paginatedProducts.length,
      itemBuilder: (context, index) {
        final p = paginatedProducts[index];
        final inCartItem = retailProvider.cart.firstWhere(
          (item) => item.product.id == p.id,
          orElse: () => RetailCartItem(product: p, qty: 0),
        );

        return GestureDetector(
          onTap: () => retailProvider.addToCart(p),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF242424) : Colors.white,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: inCartItem.qty > 0
                    ? const Color(0xFF8B5CF6)
                    : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                width: inCartItem.qty > 0 ? 1.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: inCartItem.qty > 0
                      ? const Color(0xFF8B5CF6).withValues(alpha: 0.15)
                      : Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Top Image Container (68% Height)
                Expanded(
                  flex: 68,
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(3.5)),
                          child: p.imageUrl.isNotEmpty
                              ? Image.network(
                                  p.imageUrl,
                                  width: double.infinity,
                                  height: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Container(
                                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                    child: const Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.inventory_2_outlined, size: 22, color: Color(0xFF94A3B8)),
                                          SizedBox(height: 2),
                                          Text(
                                            'NO IMAGE',
                                            style: TextStyle(
                                              fontSize: 8,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF94A3B8),
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                )
                              : Container(
                                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                  child: const Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.inventory_2_outlined, size: 22, color: Color(0xFF94A3B8)),
                                        SizedBox(height: 2),
                                        Text(
                                          'NO IMAGE',
                                          style: TextStyle(
                                            fontSize: 8,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF94A3B8),
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      // Stock Badge
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1E293B).withValues(alpha: 0.85),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${p.stock}',
                            style: const TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      // Cart Qty Badge
                      if (inCartItem.qty > 0)
                        Positioned(
                          top: 6,
                          right: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B5CF6),
                              borderRadius: BorderRadius.circular(4),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Text(
                              '${inCartItem.qty} in cart',
                              style: const TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // 2. Bottom Content Container (32% Height)
                Expanded(
                  flex: 32,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.name,
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : const Color(0xFF1E293B),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              'SKU: ${p.sku}',
                              style: const TextStyle(
                                fontSize: 9,
                                color: Color(0xFF94A3B8),
                                fontFamily: 'monospace',
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '৳${p.price.toStringAsFixed(2)}',
                                  style: TextStyle(
                                    fontSize: 12.5,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED),
                                  ),
                                ),
                                Row(
                                  children: [
                                    Container(
                                      width: 4.5,
                                      height: 4.5,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF10B981),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 3),
                                    const Text(
                                      'In Stock',
                                      style: TextStyle(
                                        fontSize: 8,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF10B981),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            InkWell(
                              onTap: () => retailProvider.addToCart(p),
                              borderRadius: BorderRadius.circular(4),
                              child: Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: const Color(0xFF8B5CF6),
                                  borderRadius: BorderRadius.circular(4),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                      blurRadius: 4,
                                      offset: const Offset(0, 1.5),
                                    ),
                                  ],
                                ),
                                child: const Icon(Icons.add_rounded, size: 15, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. PAGINATION FOOTER BAR
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildPaginationFooter(
    BuildContext context,
    int totalProducts,
    int currentPage,
    int totalPages,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing ${totalProducts < 10 ? totalProducts : 10} of $totalProducts products (Page $currentPage of $totalPages)',
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
            ),
          ),
          Row(
            children: [
              // Prev Button
              InkWell(
                onTap: currentPage > 1 ? () => setState(() => _currentPage--) : null,
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                      color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.chevron_left_rounded,
                        size: 14,
                        color: currentPage > 1
                            ? (isDark ? Colors.white : const Color(0xFF475569))
                            : Colors.grey.shade400,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        'Prev',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: currentPage > 1
                              ? (isDark ? Colors.white : const Color(0xFF475569))
                              : Colors.grey.shade400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 4),

              // Page Numbers
              ...List.generate(totalPages, (index) {
                final pageNum = index + 1;
                final isActive = pageNum == currentPage;
                return Padding(
                  padding: const EdgeInsets.only(right: 4.0),
                  child: InkWell(
                    onTap: () => setState(() => _currentPage = pageNum),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: isActive
                            ? const Color(0xFF8B5CF6)
                            : (isDark ? const Color(0xFF2A2A2A) : Colors.white),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: isActive
                              ? const Color(0xFF8B5CF6)
                              : (isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '$pageNum',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isActive ? Colors.white : (isDark ? Colors.white : const Color(0xFF475569)),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),

              // Next Button
              InkWell(
                onTap: currentPage < totalPages ? () => setState(() => _currentPage++) : null,
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(
                      color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(
                        'Next',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: currentPage < totalPages
                              ? (isDark ? Colors.white : const Color(0xFF475569))
                              : Colors.grey.shade400,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 14,
                        color: currentPage < totalPages
                            ? (isDark ? Colors.white : const Color(0xFF475569))
                            : Colors.grey.shade400,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. CART PANEL CONTENT
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildCartPanelContent(
    BuildContext context,
    RetailProvider retailProvider,
    String locale,
    bool isDark, {
    required bool isMobile,
  }) {
    final subtotal = retailProvider.subtotal;
    final discount = retailProvider.discountTotal;
    final tax = retailProvider.taxTotal;
    final total = retailProvider.total;
    final itemCount = retailProvider.cart.fold(0, (sum, i) => sum + i.qty);
    final youSave = discount > 0 ? discount : 0.75;

    return Column(
      children: [
        // ── 1. CART HEADER BAR ──────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Title & Item Count Pill
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Current Order',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF3B1D54) : const Color(0xFFF3E8FF),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '$itemCount Items',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF8B5CF6),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 8),

                // Action Pills (Add Customer & Clear Cart)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Add Customer Button
                    InkWell(
                      onTap: () => _showAddCustomerDialog(context, retailProvider, isDark),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.person_outline_rounded, size: 13, color: Color(0xFF8B5CF6)),
                            const SizedBox(width: 3),
                            Text(
                              retailProvider.selectedCustomer == 'Walk-in Customer'
                                  ? 'Add Customer'
                                  : retailProvider.selectedCustomer,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 5),

                    // Clear Cart F9 Button
                    InkWell(
                      onTap: retailProvider.cart.isEmpty ? null : () => retailProvider.clearCart(),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF3B1219) : const Color(0xFFFFF1F2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isDark ? const Color(0xFF5F1D24) : const Color(0xFFFECDD3),
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.delete_outline_rounded, size: 12, color: Color(0xFFF43F5E)),
                            SizedBox(width: 3),
                            Text(
                              'Clear Cart',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFF43F5E)),
                            ),
                            SizedBox(width: 2),
                            Text(
                              'F9',
                              style: TextStyle(fontSize: 8, fontWeight: FontWeight.w600, color: Color(0xFFFB7185)),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),

        // ── 2. TABLE HEADER ROW (ITEM, PRICE, QTY, TOTAL) ────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF8FAFC),
            border: Border(
              bottom: BorderSide(
                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          child: const Row(
            children: [
              Expanded(
                flex: 4,
                child: Text(
                  'ITEM',
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  'PRICE',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  'QTY',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
              ),
              Expanded(
                flex: 2,
                child: Text(
                  'TOTAL',
                  textAlign: TextAlign.right,
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                ),
              ),
            ],
          ),
        ),

        // ── 3. CART ITEMS LIST ──────────────────────────────────────────────
        Expanded(
          child: retailProvider.cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 36, color: Colors.grey.shade400),
                      const SizedBox(height: 6),
                      Text(
                        'Cart is empty',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  itemCount: retailProvider.cart.length,
                  separatorBuilder: (_, _) => Divider(
                    height: 10,
                    color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9),
                  ),
                  itemBuilder: (context, index) {
                    final item = retailProvider.cart[index];

                    return Row(
                      children: [
                        // ITEM COLUMN (Image/Icon + Title + SKU)
                        Expanded(
                          flex: 4,
                          child: Row(
                            children: [
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                                  ),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(3.5),
                                  child: item.product.imageUrl.isNotEmpty
                                      ? Image.network(
                                          item.product.imageUrl,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, _, _) => const Icon(
                                            Icons.inventory_2_outlined,
                                            size: 15,
                                            color: Color(0xFF94A3B8),
                                          ),
                                        )
                                      : const Icon(
                                          Icons.inventory_2_outlined,
                                          size: 15,
                                          color: Color(0xFF94A3B8),
                                        ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.product.name,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      'SKU: ${item.product.sku}',
                                      style: const TextStyle(
                                        fontSize: 9,
                                        color: Color(0xFF94A3B8),
                                        fontFamily: 'monospace',
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // PRICE COLUMN
                        Expanded(
                          flex: 2,
                          child: Text(
                            '৳${item.product.price.toStringAsFixed(2)}',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                            ),
                          ),
                        ),

                        // QTY COLUMN (- 1 +)
                        Expanded(
                          flex: 2,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              InkWell(
                                onTap: () => retailProvider.updateQty(index, item.qty - 1),
                                borderRadius: BorderRadius.circular(4),
                                child: Container(
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                                    ),
                                  ),
                                  child: const Icon(Icons.remove, size: 11),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 5.0),
                                child: Text(
                                  '${item.qty}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                                  ),
                                ),
                              ),
                              InkWell(
                                onTap: () => retailProvider.updateQty(index, item.qty + 1),
                                borderRadius: BorderRadius.circular(4),
                                child: Container(
                                  width: 20,
                                  height: 20,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                                    ),
                                  ),
                                  child: const Icon(Icons.add, size: 11),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // TOTAL COLUMN (Price + Trash)
                        Expanded(
                          flex: 2,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                '৳${item.lineTotal.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(width: 3),
                              InkWell(
                                onTap: () => retailProvider.removeFromCart(index),
                                child: const Icon(
                                  Icons.delete_outline_rounded,
                                  size: 13,
                                  color: Color(0xFFCBD5E1),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ),

        // ── 4. SUMMARY & TOTAL PAYABLE AREA ──────────────────────────────────
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            border: Border(
              top: BorderSide(
                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Calculations & Total Payable Card
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Side: Subtotal, Discount, Tax
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Subtotal',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.grey.shade400 : const Color(0xFF475569),
                                ),
                              ),
                              Text(
                                '৳${subtotal.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Discount',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF059669),
                                ),
                              ),
                              Text(
                                '-৳${discount.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Tax (5%)',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                                ),
                              ),
                              Text(
                                '৳${tax.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(width: 10),

                    // Right Side: Gradient Total Payable Card
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: isDark
                              ? const LinearGradient(
                                  colors: [Color(0xFF2E1065), Color(0xFF1E1B4B)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : const LinearGradient(
                                  colors: [Color(0xFFFAF5FF), Color(0xFFF3E8FF)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isDark ? const Color(0xFF4C1D95) : const Color(0xFFE9D5FF),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Payable',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? const Color(0xFFDDD6FE) : const Color(0xFF4C1D95),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '৳${total.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 21,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF7C3AED),
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.local_offer_outlined, size: 10.5, color: Color(0xFF059669)),
                                const SizedBox(width: 3),
                                Text(
                                  'You Save ৳${youSave.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

              const SizedBox(height: 8),

              // ── 5. PAYMENT METHOD TABS (Cash F3, Card F4, Mobile Pay F5, Gift Card F6, More F7)
              Row(
                children: [
                  _buildPaymentMethodChip('Cash', 'F3', Icons.payments_outlined, retailProvider, isDark),
                  const SizedBox(width: 4),
                  _buildPaymentMethodChip('Card', 'F4', Icons.credit_card_rounded, retailProvider, isDark),
                  const SizedBox(width: 4),
                  _buildPaymentMethodChip('Mobile Pay', 'F5', Icons.smartphone_rounded, retailProvider, isDark),
                  const SizedBox(width: 4),
                  _buildPaymentMethodChip('Gift Card', 'F6', Icons.card_giftcard_rounded, retailProvider, isDark),
                  const SizedBox(width: 4),
                  _buildPaymentMethodChip('More', 'F7', Icons.more_horiz_rounded, retailProvider, isDark),
                ],
              ),

              const SizedBox(height: 8),

              // ── 6. BOTTOM ACTION BUTTONS (Save & Hold F8, Pay Now F12) ─────
              Row(
                children: [
                  // Save & Hold Button
                  Expanded(
                    flex: 38,
                    child: InkWell(
                      onTap: retailProvider.cart.isEmpty
                          ? null
                          : () {
                              retailProvider.holdSale();
                              if (isMobile) Navigator.pop(context);
                            },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 42,
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF242424) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isDark ? const Color(0xFF333333) : const Color(0xFFCBD5E1),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.pause_circle_outline_rounded, size: 16, color: Color(0xFF8B5CF6)),
                            const SizedBox(width: 5),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Save & Hold',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : const Color(0xFF334155),
                                    height: 1.1,
                                  ),
                                ),
                                const Text(
                                  'F8',
                                  style: TextStyle(
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF94A3B8),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(width: 8),

                  // Pay Now Main CTA Button
                  Expanded(
                    flex: 62,
                    child: InkWell(
                      onTap: retailProvider.cart.isEmpty
                          ? null
                          : () {
                              if (isMobile) Navigator.pop(context);
                              _showCheckoutModal(context, retailProvider, isDark);
                            },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 42,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                          ),
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF8B5CF6).withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.check_circle_outline_rounded, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Pay Now',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    height: 1.1,
                                  ),
                                ),
                                Text(
                                  'F12',
                                  style: TextStyle(
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white70,
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                            const Spacer(),
                            Text(
                              '৳${total.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ],
  );
}

  Widget _buildPaymentMethodChip(
    String name,
    String fkey,
    IconData icon,
    RetailProvider retailProvider,
    bool isDark,
  ) {
    final isSelected = retailProvider.paymentMethod == name.toUpperCase() ||
        (name == 'Cash' && retailProvider.paymentMethod == 'CASH');

    return Expanded(
      child: InkWell(
        onTap: () => retailProvider.setPaymentMethod(name.toUpperCase()),
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF8B5CF6)
                : (isDark ? const Color(0xFF242424) : Colors.white),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF8B5CF6)
                  : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.35),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 3,
                      offset: const Offset(0, 1),
                    ),
                  ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 13,
                color: isSelected ? Colors.white : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
              ),
              const SizedBox(height: 1),
              Text(
                name,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  height: 1.1,
                  color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                fkey,
                style: TextStyle(
                  fontSize: 7.5,
                  fontWeight: FontWeight.w600,
                  height: 1.1,
                  color: isSelected ? Colors.white70 : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. MOBILE BOTTOM FLOATING CART BAR (< 900px)
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildMobileBottomBar(
    BuildContext context,
    RetailProvider retailProvider,
    String locale,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : Colors.grey.shade200,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${retailProvider.totalItemCount} ITEMS IN ORDER',
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF7C3AED)),
              ),
              Text(
                '৳${retailProvider.total.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
          Row(
            children: [
              OutlinedButton.icon(
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                    builder: (ctx) => SizedBox(
                      height: MediaQuery.of(ctx).size.height * 0.75,
                      child: _buildCartPanelContent(context, retailProvider, locale, isDark, isMobile: true),
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                icon: const Icon(Icons.shopping_cart_outlined, size: 16),
                label: const Text('View Cart', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: retailProvider.cart.isEmpty
                    ? null
                    : () => _showCheckoutModal(context, retailProvider, isDark),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                label: const Text('Pay Now', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DIALOGS & MODALS
  // ──────────────────────────────────────────────────────────────────────────
  void _showCheckoutModal(BuildContext context, RetailProvider retailProvider, bool isDark) {
    double paidInput = retailProvider.total;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Row(
          children: [
            Icon(Icons.payment_rounded, color: Color(0xFF7C3AED)),
            SizedBox(width: 10),
            Text('Complete Payment', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Total Payable Amount:', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              Text(
                '৳${retailProvider.total.toStringAsFixed(2)}',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF7C3AED)),
              ),
              const SizedBox(height: 16),

              const Text('Select Payment Method:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: ['CASH', 'CARD', 'MOBILE_PAY'].map((m) {
                  final sel = retailProvider.paymentMethod == m;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2.0),
                      child: ChoiceChip(
                        label: Text(m),
                        selected: sel,
                        onSelected: (_) => retailProvider.setPaymentMethod(m),
                        selectedColor: const Color(0xFF7C3AED),
                        labelStyle: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: sel ? Colors.white : Colors.grey,
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final sale = retailProvider.confirmSale(paidAmount: paidInput);
              Navigator.pop(ctx);
              _showReceiptDialog(context, sale, isDark);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Confirm Sale'),
          ),
        ],
      ),
    );
  }

  void _showReceiptDialog(BuildContext context, RetailSale sale, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        content: SizedBox(
          width: 300,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircleAvatar(
                radius: 26,
                backgroundColor: Color(0xFF10B981),
                child: Icon(Icons.check_rounded, color: Colors.white, size: 30),
              ),
              const SizedBox(height: 12),
              const Text('Sale Confirmed!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
              Text('Invoice: ${sale.invoiceNo}', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Paid:'),
                  Text('৳${sale.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Payment Method:'),
                  Text(sale.paymentMethod, style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('New Sale'),
          ),
        ],
      ),
    );
  }

  void _showHoldsModal(BuildContext context, RetailProvider retailProvider, String locale, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Text('Held Sales List', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: 320,
          height: 250,
          child: retailProvider.heldSales.isEmpty
              ? const Center(child: Text('No held orders'))
              : ListView.builder(
                  itemCount: retailProvider.heldSales.length,
                  itemBuilder: (context, index) {
                    final hold = retailProvider.heldSales[index];
                    return ListTile(
                      title: Text('${hold.holdNo} (${hold.items.length} items)'),
                      subtitle: Text(hold.customerName),
                      trailing: IconButton(
                        icon: const Icon(Icons.play_arrow_rounded, color: Color(0xFF7C3AED)),
                        onPressed: () {
                          retailProvider.resumeHold(index);
                          Navigator.pop(ctx);
                        },
                      ),
                    );
                  },
                ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  void _showAiInsightsModal(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Row(
          children: [
            Icon(Icons.smart_toy_rounded, color: Color(0xFF7C3AED)),
            SizedBox(width: 8),
            Text('AI Inventory Insights'),
          ],
        ),
        content: const Text(
          '• High demand predicted for Beverages and Snacks this afternoon.\n'
          '• Stock Alert: Harpic Liquid Cleaner is running low (28 left).\n'
          '• Recommended Combo: Coca-Cola + Lays Chips.',
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  void _showAddCustomerDialog(BuildContext context, RetailProvider retailProvider, bool isDark) {
    final nameController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Text('Select / Add Customer'),
        content: TextField(
          controller: nameController,
          decoration: const InputDecoration(hintText: 'Customer Name...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                retailProvider.setSelectedCustomer(nameController.text);
              }
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Set Customer'),
          ),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 8. BOTTOM FOOTER BAR (WEB POS Toolbar)
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildBottomFooterBar(
    BuildContext context,
    RetailProvider retailProvider,
    bool isDark,
    Color surfaceColor,
    double screenWidth,
  ) {
    final isMobile = screenWidth < 900;
    final cartWidth = screenWidth >= 1280 ? 480.0 : 420.0;
    final holdsCount = retailProvider.heldSales.length;
    final recentCount = retailProvider.recentSales.length;

    final moduleCards = [
      _buildFooterModuleCard('Multi-Branch', '1 Branches', 'Sync Enabled', Icons.domain_rounded, const [Color(0xFFA78BFA), Color(0xFF818CF8)], isDark),
      _buildFooterModuleCard('Central Warehouse', 'Main Warehouse', 'Stock: 86%', Icons.inventory_2_rounded, const [Color(0xFF3B82F6), Color(0xFF2563EB)], isDark),
      _buildFooterModuleCard('Accounting', 'Today\'s Collection', '৳0.00', Icons.account_balance_wallet_rounded, const [Color(0xFF10B981), Color(0xFF059669)], isDark),
      _buildFooterModuleCard('HR', 'Total Employees', '1', Icons.people_alt_rounded, const [Color(0xFFF59E0B), Color(0xFFD97706)], isDark),
      _buildFooterModuleCard('BI Dashboard', 'Sales vs Target', 'Analyzing...', Icons.pie_chart_rounded, const [Color(0xFF06B6D4), Color(0xFF0891B2)], isDark),
      _buildFooterModuleCard('AI Assistant', 'Smart Suggestion', 'Active', Icons.smart_toy_rounded, const [Color(0xFFF43F5E), Color(0xFFE11D48)], isDark, onTap: () => _showAiInsightsModal(context, isDark)),
      _buildFooterModuleCard('Franchise', 'Active Outlets', 'Active', Icons.hub_rounded, const [Color(0xFF818CF8), Color(0xFF7C3AED)], isDark),
    ];

    final actionButtons = [
      _buildFooterActionButton('Hold Orders', holdsCount > 0 ? '($holdsCount)' : '(1)', Icons.pause_circle_outline_rounded, () => _showHoldsModal(context, retailProvider, 'en', isDark), isDark),
      _buildFooterActionButton('Recent Orders', recentCount > 0 ? '($recentCount)' : '(1)', Icons.access_time_rounded, () => _showRecentOrdersModal(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Price Check', '', Icons.search_rounded, () => _showPriceCheckModal(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Stock Lookup', '', Icons.inventory_2_outlined, () => _showStockLookupModal(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Return', '', Icons.replay_rounded, () => _showReturnModal(context, isDark), isDark),
      _buildFooterActionButton('Discount', '', Icons.local_offer_outlined, () => _showDiscountModal(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Note', '', Icons.note_alt_outlined, () => _showNoteModal(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Calculator', '', Icons.calculate_outlined, () => _showCalculatorModal(context, isDark), isDark),
    ];

    if (isMobile) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: surfaceColor,
          border: Border(
            top: BorderSide(
              color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: 7 Module Cards (Horizontally Scrollable)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: moduleCards.map((card) => Padding(
                  padding: const EdgeInsets.only(right: 6.0),
                  child: SizedBox(width: 135, height: 42, child: card),
                )).toList(),
              ),
            ),
            const SizedBox(height: 5),

            // Row 2: 8 Action Buttons (Horizontally Scrollable)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: actionButtons.map((btn) => Padding(
                  padding: const EdgeInsets.only(right: 6.0),
                  child: SizedBox(width: 115, height: 32, child: btn),
                )).toList(),
              ),
            ),
            const SizedBox(height: 5),

            // Row 3: Today's Summary & System Status Cards
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  // Summary
                  Container(
                    width: 320,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF242424) : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "TODAY'S SUMMARY",
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF475569),
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildSummaryItem('Sales', '৳147.00', isDark),
                            Container(height: 16, width: 1, color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                            _buildSummaryItem('Transactions', '1', isDark),
                            Container(height: 16, width: 1, color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                            _buildSummaryItem('Avg. sale', '৳147.00', isDark),
                            Container(height: 16, width: 1, color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                            _buildSummaryItem('Items Sold', '0', isDark),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),

                  // System Status
                  Container(
                    width: 145,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF242424) : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SYSTEM STATUS',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF475569),
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.check_circle_outline_rounded, size: 13, color: Color(0xFF10B981)),
                            const SizedBox(width: 4),
                            const Expanded(
                              child: Text(
                                'All systems normal',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF047857),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Left Column: Modules & Action Toolbar Buttons
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Row: 7 Module Cards — fixed height 64
                SizedBox(
                  height: 64,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: moduleCards.map((card) => Expanded(child: Padding(
                      padding: const EdgeInsets.only(right: 4.0),
                      child: card,
                    ))).toList(),
                  ),
                ),

                const SizedBox(height: 3),

                // Bottom Toolbar: 8 Action Buttons — fixed height 28
                SizedBox(
                  height: 28,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: actionButtons.map((btn) => Expanded(child: Padding(
                      padding: const EdgeInsets.only(right: 4.0),
                      child: btn,
                    ))).toList(),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 10),

          // Right Column: Today's Summary & System Status
          SizedBox(
            width: cartWidth,
            height: 95,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Today's Summary Card
                Expanded(
                  flex: 3,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF242424) : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "TODAY'S SUMMARY",
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF475569),
                            letterSpacing: 0.3,
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildSummaryItem('Sales', '৳147.00', isDark),
                            Container(height: 18, width: 1, color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                            _buildSummaryItem('Transactions', '1', isDark),
                            Container(height: 18, width: 1, color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                            _buildSummaryItem('Avg. sale', '৳147.00', isDark),
                            Container(height: 18, width: 1, color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                            _buildSummaryItem('Items Sold', '0', isDark),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),

                // System Status Card
                SizedBox(
                  width: 145,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF242424) : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'SYSTEM STATUS',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? const Color(0xFF60A5FA) : const Color(0xFF475569),
                            letterSpacing: 0.3,
                          ),
                        ),
                        Row(
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: Color(0xFF10B981),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.check_circle_outline_rounded, size: 13, color: Color(0xFF10B981)),
                            const SizedBox(width: 4),
                            const Expanded(
                              child: Text(
                                'All systems normal',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF047857),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterModuleCard(
    String title,
    String sub,
    String sub2,
    IconData icon,
    List<Color> gradientColors,
    bool isDark, {
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap ?? () {},
      borderRadius: BorderRadius.circular(4),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF242424) : Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: title == 'AI Assistant'
                ? const Color(0xFFC4B5FD)
                : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: gradientColors),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Icon(icon, size: 16, color: Colors.white),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                      color: isDark ? Colors.grey.shade200 : const Color(0xFF1E293B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    sub,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      height: 1.2,
                      color: Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    sub2,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                      color: Color(0xFF8B5CF6),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooterActionButton(
    String label,
    String badge,
    IconData icon,
    VoidCallback onTap,
    bool isDark,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        height: 24,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF242424) : Colors.white,
          borderRadius: BorderRadius.circular(4),
          border: Border.all(
            color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: const Color(0xFF8B5CF6)),
            const SizedBox(width: 3),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (badge.isNotEmpty) ...[
              const SizedBox(width: 3),
              Text(
                badge,
                style: const TextStyle(
                  fontSize: 8.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF94A3B8),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String title, String value, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 9.5,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 1),
        Text(
          value,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF1E293B),
          ),
        ),
      ],
    );
  }

  void _showRecentOrdersModal(BuildContext context, RetailProvider retailProvider, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Text('Recent Orders (F11)'),
        content: SizedBox(
          width: 320,
          height: 250,
          child: retailProvider.recentSales.isEmpty
              ? const Center(child: Text('No recent completed sales today'))
              : ListView.builder(
                  itemCount: retailProvider.recentSales.length,
                  itemBuilder: (context, index) {
                    final sale = retailProvider.recentSales[index];
                    return ListTile(
                      title: Text(sale.invoiceNo, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('${sale.paymentMethod} • ৳${sale.total.toStringAsFixed(2)}'),
                      trailing: Text(sale.createdAt.toString().substring(11, 16), style: const TextStyle(fontSize: 11)),
                    );
                  },
                ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  void _showPriceCheckModal(BuildContext context, RetailProvider retailProvider, bool isDark) {
    final controller = TextEditingController();
    RetailProduct? foundProduct;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          title: const Text('Price & Stock Check'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Enter SKU or Product Name...',
                  prefixIcon: Icon(Icons.search_rounded),
                ),
                onChanged: (val) {
                  final matches = retailProvider.allProducts.where(
                    (p) => p.name.toLowerCase().contains(val.toLowerCase()) || p.sku.toLowerCase().contains(val.toLowerCase()),
                  );
                  setModalState(() {
                    foundProduct = matches.isNotEmpty ? matches.first : null;
                  });
                },
              ),
              const SizedBox(height: 16),
              if (foundProduct != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.inventory_2_outlined, color: Color(0xFF8B5CF6)),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(foundProduct!.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text('SKU: ${foundProduct!.sku} • Stock: ${foundProduct!.stock}'),
                            Text('Price: ৳${foundProduct!.price.toStringAsFixed(2)}', style: const TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.w900)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done')),
          ],
        ),
      ),
    );
  }

  void _showStockLookupModal(BuildContext context, RetailProvider retailProvider, bool isDark) {
    _showPriceCheckModal(context, retailProvider, isDark);
  }

  void _showReturnModal(BuildContext context, bool isDark) {
    final invController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Text('Process Product Return'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: invController,
              decoration: const InputDecoration(
                hintText: 'Enter Original Invoice No (e.g. INV-1001)...',
                prefixIcon: Icon(Icons.receipt_long_rounded),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Return processing initiated.')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Search Invoice'),
          ),
        ],
      ),
    );
  }

  void _showDiscountModal(BuildContext context, RetailProvider retailProvider, bool isDark) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Text('Apply Cart Discount'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            hintText: 'Discount Amount (৳)...',
            prefixIcon: Icon(Icons.local_offer_outlined),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final d = double.tryParse(controller.text) ?? 0;
              retailProvider.setDiscount(d);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  void _showNoteModal(BuildContext context, RetailProvider retailProvider, bool isDark) {
    final controller = TextEditingController(text: retailProvider.orderNote);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Text('Add Order Note'),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Order notes or special instructions...',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              retailProvider.setOrderNote(controller.text);
              Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Save Note'),
          ),
        ],
      ),
    );
  }

  void _showCalculatorModal(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        title: const Row(
          children: [
            Icon(Icons.calculate_outlined, color: Color(0xFF7C3AED)),
            SizedBox(width: 8),
            Text('Quick POS Calculator'),
          ],
        ),
        content: const SizedBox(
          width: 250,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Use system calculator or standard POS keypad for quick math.', style: TextStyle(fontSize: 12)),
            ],
          ),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7C3AED),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

// ── Metric Card Widget ───────────────────────────────────────────────────────
class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String badge;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.badge,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF242424) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(title, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
              Row(
                children: [
                  Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(badge, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
