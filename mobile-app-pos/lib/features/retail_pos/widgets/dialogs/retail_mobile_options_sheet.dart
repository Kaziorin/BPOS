import 'package:flutter/material.dart';
import '../../providers/retail_provider.dart';
import '../../../../core/services/api_service.dart';
import '../../../../core/models/sales_order_model.dart';
import '../../../../core/widgets/live_sales_history_dialog.dart';
import 'retail_dialogs.dart';

void showRetailMobileOptionsSheet(
  BuildContext context,
  RetailProvider retailProvider,
  bool isDark,
) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => RetailMobileOptionsSheet(
      retailProvider: retailProvider,
      isDark: isDark,
    ),
  );
}

class RetailMobileOptionsSheet extends StatelessWidget {
  final RetailProvider retailProvider;
  final bool isDark;

  const RetailMobileOptionsSheet({
    super.key,
    required this.retailProvider,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final cardColor = isDark
        ? const Color(0xFF262626)
        : const Color(0xFFF8FAFC);
    final borderColor = isDark
        ? const Color(0xFF383838)
        : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSecondary = isDark
        ? Colors.grey.shade400
        : const Color(0xFF64748B);

    final holdsCount = retailProvider.heldSales.length;
    final recentCount = retailProvider.recentSales.length;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.88,
      ),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Drag Handle ───────────────────────────────────────────────────
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // ── Header Title & Close ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                    ),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(
                    Icons.dashboard_customize_rounded,
                    size: 18,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'POS Overview & Tools',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        'Terminal: T-01 • SalePay Retail POS',
                        style: TextStyle(fontSize: 11, color: textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: Icon(
                    Icons.close_rounded,
                    size: 20,
                    color: textSecondary,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(
                    minWidth: 32,
                    minHeight: 32,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: borderColor),

          // ── Scrollable Body ───────────────────────────────────────────────
          Expanded(
            child: FutureBuilder<List<dynamic>>(
              future: Future.wait([
                ApiService.instance.fetchSalesOrders(
                  businessType: 'retail',
                  limit: 100,
                ),
                ApiService.instance.fetchWarehouses(businessType: 'retail'),
                ApiService.instance.fetchEmployees(businessType: 'retail'),
              ]),
              builder: (context, snapshot) {
                final orders = (snapshot.data?[0] as List<SalesOrder>?) ?? [];
                final warehouses =
                    (snapshot.data?[1] as List<Map<String, dynamic>>?) ?? [];
                final employees =
                    (snapshot.data?[2] as List<Map<String, dynamic>>?) ?? [];

                final now = DateTime.now();
                final todayOrders = orders
                    .where(
                      (o) =>
                          o.orderDate.year == now.year &&
                          o.orderDate.month == now.month &&
                          o.orderDate.day == now.day,
                    )
                    .toList();
                final salesToday = todayOrders.fold<double>(
                  0.0,
                  (s, o) => s + o.total,
                );
                final txCount = todayOrders.length;
                final avgSale = txCount > 0 ? salesToday / txCount : 0.0;
                final itemsSold = todayOrders.fold<int>(
                  0,
                  (s, o) =>
                      s + o.items.fold<int>(0, (isum, it) => isum + it.qty),
                );
                final totalProducts = retailProvider.allProducts.length;
                final lowStockCount = retailProvider.allProducts
                    .where((p) => p.stock <= 5)
                    .length;

                return ListView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  children: [
                    // ── 1. TODAY'S METRICS CARDS ────────────────────────────────
                    _buildSectionHeader(
                      'TODAY\'S METRICS',
                      Icons.insights_rounded,
                      textSecondary,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricMiniCard(
                            title: 'SALES TODAY',
                            value: '৳${salesToday.toStringAsFixed(2)}',
                            badge: 'Live',
                            icon: Icons.show_chart_rounded,
                            color: const Color(0xFF8B5CF6),
                            cardColor: cardColor,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMetricMiniCard(
                            title: 'TRANSACTIONS',
                            value: '$txCount',
                            badge: 'Today',
                            icon: Icons.receipt_long_rounded,
                            color: const Color(0xFF3B82F6),
                            cardColor: cardColor,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricMiniCard(
                            title: 'AVG. SALE',
                            value: '৳${avgSale.toStringAsFixed(2)}',
                            badge: 'Avg',
                            icon: Icons.local_offer_outlined,
                            color: const Color(0xFFF59E0B),
                            cardColor: cardColor,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMetricMiniCard(
                            title: 'ITEMS SOLD',
                            value: '$itemsSold',
                            badge: 'Qty',
                            icon: Icons.inventory_2_outlined,
                            color: const Color(0xFF10B981),
                            cardColor: cardColor,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // ── 2. QUICK ACTIONS & TOOLS ────────────────────────────────
                    _buildSectionHeader(
                      'OPERATIONS & TOOLS',
                      Icons.bolt_rounded,
                      textSecondary,
                    ),
                    const SizedBox(height: 8),
                    GridView.count(
                      crossAxisCount: 4,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 0.95,
                      children: [
                        _buildToolButton(
                          label: 'Hold Orders',
                          badge: holdsCount > 0 ? '$holdsCount' : null,
                          icon: Icons.pause_circle_outline_rounded,
                          color: const Color(0xFF8B5CF6),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailHoldsDialog(
                              context,
                              retailProvider,
                              isDark,
                            );
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Recent Orders',
                          badge: recentCount > 0 ? '$recentCount' : null,
                          icon: Icons.access_time_rounded,
                          color: const Color(0xFF3B82F6),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailRecentOrdersDialog(
                              context,
                              retailProvider,
                              isDark,
                            );
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Price Check',
                          icon: Icons.search_rounded,
                          color: const Color(0xFF06B6D4),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailPriceCheckDialog(
                              context,
                              retailProvider,
                              isDark,
                            );
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Stock Lookup',
                          icon: Icons.inventory_2_outlined,
                          color: const Color(0xFF10B981),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailStockLookupDialog(
                              context,
                              retailProvider,
                              isDark,
                            );
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Return',
                          icon: Icons.replay_rounded,
                          color: const Color(0xFFEF4444),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailReturnDialog(context, isDark);
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Discount',
                          icon: Icons.local_offer_outlined,
                          color: const Color(0xFFF59E0B),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailDiscountDialog(
                              context,
                              retailProvider,
                              isDark,
                            );
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Calculator',
                          icon: Icons.calculate_outlined,
                          color: const Color(0xFF8B5CF6),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailCalculatorDialog(context, isDark);
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                        _buildToolButton(
                          label: 'Add Customer',
                          icon: Icons.person_add_outlined,
                          color: const Color(0xFF6366F1),
                          onTap: () {
                            Navigator.pop(context);
                            showRetailCustomerDialog(
                              context,
                              retailProvider,
                              isDark,
                            );
                          },
                          cardColor: cardColor,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // ── 3. ENTERPRISE MODULES ───────────────────────────────────
                    _buildSectionHeader(
                      'ENTERPRISE MODULES',
                      Icons.grid_view_rounded,
                      textSecondary,
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildModuleChip(
                            'Multi-Branch',
                            '${warehouses.isEmpty ? 1 : warehouses.length} Branches • Sync Enabled',
                            Icons.domain_rounded,
                            const Color(0xFFA78BFA),
                            cardColor,
                            borderColor,
                            textPrimary,
                            textSecondary,
                            onTap: () {
                              Navigator.pop(context);
                              retailProvider.loadProducts(
                                businessType: 'retail',
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Syncing branch catalog & stock...',
                                  ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(width: 8),
                          _buildModuleChip(
                            'Central Warehouse',
                            '$totalProducts Items • $lowStockCount Low Stock',
                            Icons.inventory_2_rounded,
                            const Color(0xFF3B82F6),
                            cardColor,
                            borderColor,
                            textPrimary,
                            textSecondary,
                            onTap: () {
                              Navigator.pop(context);
                              showRetailStockLookupDialog(
                                context,
                                retailProvider,
                                isDark,
                              );
                            },
                          ),
                          const SizedBox(width: 8),
                          _buildModuleChip(
                            'Accounting',
                            'Today\'s Collection ৳${salesToday.toStringAsFixed(2)}',
                            Icons.account_balance_wallet_rounded,
                            const Color(0xFF10B981),
                            cardColor,
                            borderColor,
                            textPrimary,
                            textSecondary,
                            onTap: () {
                              Navigator.pop(context);
                              showLiveSalesHistoryDialog(
                                context,
                                businessType: 'retail',
                              );
                            },
                          ),
                          const SizedBox(width: 8),
                          _buildModuleChip(
                            'HR & Staff',
                            'Active Staff: ${employees.length}',
                            Icons.people_alt_rounded,
                            const Color(0xFFF59E0B),
                            cardColor,
                            borderColor,
                            textPrimary,
                            textSecondary,
                          ),
                          const SizedBox(width: 8),
                          _buildModuleChip(
                            'AI Assistant',
                            'Smart Insights Active',
                            Icons.smart_toy_rounded,
                            const Color(0xFFF43F5E),
                            cardColor,
                            borderColor,
                            textPrimary,
                            textSecondary,
                            onTap: () {
                              Navigator.pop(context);
                              showRetailAiInsightsDialog(context, isDark);
                            },
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ── 4. TODAY'S SUMMARY & SYSTEM STATUS ──────────────────────
                    _buildSectionHeader(
                      'SUMMARY & STATUS',
                      Icons.check_circle_outline_rounded,
                      textSecondary,
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: cardColor,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: borderColor),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildSummaryStat(
                                'Sales',
                                '৳${salesToday.toStringAsFixed(2)}',
                                textSecondary,
                                textPrimary,
                              ),
                              Container(
                                height: 20,
                                width: 1,
                                color: borderColor,
                              ),
                              _buildSummaryStat(
                                'Transactions',
                                '$txCount',
                                textSecondary,
                                textPrimary,
                              ),
                              Container(
                                height: 20,
                                width: 1,
                                color: borderColor,
                              ),
                              _buildSummaryStat(
                                'Avg. sale',
                                '৳${avgSale.toStringAsFixed(2)}',
                                textSecondary,
                                textPrimary,
                              ),
                              Container(
                                height: 20,
                                width: 1,
                                color: borderColor,
                              ),
                              _buildSummaryStat(
                                'Items Sold',
                                '$itemsSold',
                                textSecondary,
                                textPrimary,
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Divider(height: 1, color: borderColor),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                snapshot.hasError
                                    ? Icons.warning_amber_rounded
                                    : Icons.check_circle_rounded,
                                size: 14,
                                color: snapshot.hasError
                                    ? Colors.orange
                                    : const Color(0xFF10B981),
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    snapshot.connectionState ==
                                            ConnectionState.waiting
                                        ? 'System Status: Syncing live data...'
                                        : snapshot.hasError
                                        ? 'System Status: Offline / Cached'
                                        : 'System Status: Connected to Backend',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: snapshot.hasError
                                          ? Colors.orange
                                          : const Color(0xFF047857),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, size: 13, color: const Color(0xFF8B5CF6)),
        const SizedBox(width: 5),
        Expanded(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: color,
              letterSpacing: 0.5,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricMiniCard({
    required String title,
    required String value,
    required String badge,
    required IconData icon,
    required Color color,
    required Color cardColor,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 8.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade500,
                    letterSpacing: 0.3,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          value,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                          maxLines: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 3),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 3,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          badge,
                          style: const TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF059669),
                          ),
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
    );
  }

  Widget _buildToolButton({
    required String label,
    String? badge,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required Color cardColor,
    required Color borderColor,
    required Color textPrimary,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: borderColor),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 15, color: color),
                ),
                const SizedBox(height: 3),
                Flexible(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        color: textPrimary,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                    ),
                  ),
                ),
              ],
            ),
            if (badge != null)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 1,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildModuleChip(
    String title,
    String sub,
    IconData icon,
    Color color,
    Color cardColor,
    Color borderColor,
    Color textPrimary,
    Color textSecondary, {
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        width: 140,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                      color: textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    sub,
                    style: TextStyle(fontSize: 8.5, color: textSecondary),
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

  Widget _buildSummaryStat(
    String label,
    String value,
    Color textSecondary,
    Color textPrimary,
  ) {
    return Expanded(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: TextStyle(fontSize: 9, color: textSecondary),
              maxLines: 1,
            ),
          ),
          const SizedBox(height: 1),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w900,
                color: textPrimary,
              ),
              maxLines: 1,
            ),
          ),
        ],
      ),
    );
  }
}
