import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import 'dialogs/retail_dialogs.dart';

class RetailMetricsBar extends StatelessWidget {
  const RetailMetricsBar({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;
    final surfaceColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;

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
          final isWide = constraints.maxWidth >= 1440;

          final card1 = RetailMetricCard(
            title: 'SALES TODAY',
            value: '৳147.00',
            badge: '+12.5%',
            icon: Icons.show_chart_rounded,
            color: const Color(0xFF8B5CF6),
            isDark: isDark,
          );

          final card2 = RetailMetricCard(
            title: 'TRANSACTIONS',
            value: '1',
            badge: '+8.1%',
            icon: Icons.receipt_long_rounded,
            color: const Color(0xFF3B82F6),
            isDark: isDark,
          );

          final card3 = RetailMetricCard(
            title: 'AVG. SALE',
            value: '৳147.00',
            badge: '+5.2%',
            icon: Icons.local_offer_outlined,
            color: const Color(0xFFF59E0B),
            isDark: isDark,
          );

          final card4 = RetailMetricCard(
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
      onTap: () => showRetailAiInsightsDialog(context, isDark),
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
      onTap: () => showRetailCustomerDialog(context, retailProvider, isDark, initialTab: 1),
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
}

// ── Metric Card Widget ───────────────────────────────────────────────────────
class RetailMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String badge;
  final IconData icon;
  final Color color;
  final bool isDark;

  const RetailMetricCard({
    super.key,
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Row(
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
                      ),
                    ),
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
          ),
        ],
      ),
    );
  }
}
