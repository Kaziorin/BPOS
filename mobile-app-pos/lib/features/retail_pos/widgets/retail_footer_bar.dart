import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import 'dialogs/retail_dialogs.dart';

class RetailFooterBar extends StatelessWidget {
  final double screenWidth;

  const RetailFooterBar({
    super.key,
    required this.screenWidth,
  });

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;
    final surfaceColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;

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
      _buildFooterModuleCard('AI Assistant', 'Smart Suggestion', 'Active', Icons.smart_toy_rounded, const [Color(0xFFF43F5E), Color(0xFFE11D48)], isDark, onTap: () => showRetailAiInsightsDialog(context, isDark)),
      _buildFooterModuleCard('Franchise', 'Active Outlets', 'Active', Icons.hub_rounded, const [Color(0xFF818CF8), Color(0xFF7C3AED)], isDark),
    ];

    final actionButtons = [
      _buildFooterActionButton('Hold Orders', holdsCount > 0 ? '($holdsCount)' : '(1)', Icons.pause_circle_outline_rounded, () => showRetailHoldsDialog(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Recent Orders', recentCount > 0 ? '($recentCount)' : '(1)', Icons.access_time_rounded, () => showRetailRecentOrdersDialog(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Price Check', '', Icons.search_rounded, () => showRetailPriceCheckDialog(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Stock Lookup', '', Icons.inventory_2_outlined, () => showRetailStockLookupDialog(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Return', '', Icons.replay_rounded, () => showRetailReturnDialog(context, isDark), isDark),
      _buildFooterActionButton('Discount', '', Icons.local_offer_outlined, () => showRetailDiscountDialog(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Note', '', Icons.note_alt_outlined, () => showRetailNoteDialog(context, retailProvider, isDark), isDark),
      _buildFooterActionButton('Calculator', '', Icons.calculate_outlined, () => showRetailCalculatorDialog(context, isDark), isDark),
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
                  child: SizedBox(width: 140, height: 52, child: card),
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
                  child: screenWidth >= 1600
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: moduleCards
                              .map((card) => Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 4.0),
                                      child: card,
                                    ),
                                  ))
                              .toList(),
                        )
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: moduleCards
                                .map((card) => Padding(
                                      padding: const EdgeInsets.only(right: 6.0),
                                      child: SizedBox(width: 140, child: card),
                                    ))
                                .toList(),
                          ),
                        ),
                ),

                const SizedBox(height: 3),

                // Bottom Toolbar: 8 Action Buttons — fixed height 28
                SizedBox(
                  height: 28,
                  child: screenWidth >= 1600
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: actionButtons
                              .map((btn) => Expanded(
                                    child: Padding(
                                      padding: const EdgeInsets.only(right: 4.0),
                                      child: btn,
                                    ),
                                  ))
                              .toList(),
                        )
                      : SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          physics: const BouncingScrollPhysics(),
                          child: Row(
                            children: actionButtons
                                .map((btn) => Padding(
                                      padding: const EdgeInsets.only(right: 6.0),
                                      child: SizedBox(width: 110, child: btn),
                                    ))
                                .toList(),
                          ),
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
                badge.isNotEmpty ? '$label $badge' : label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.grey.shade300 : const Color(0xFF475569),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(String title, String value, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
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
}
