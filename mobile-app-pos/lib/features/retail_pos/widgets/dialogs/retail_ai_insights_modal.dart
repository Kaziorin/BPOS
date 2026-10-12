import 'package:flutter/material.dart';

void showRetailAiInsightsDialog(BuildContext context, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RetailAiInsightsModal(isDark: isDark),
  );
}

class RetailAiInsightsModal extends StatefulWidget {
  final bool isDark;
  const RetailAiInsightsModal({super.key, required this.isDark});
  @override
  State<RetailAiInsightsModal> createState() => _RetailAiInsightsModalState();
}

class _RetailAiInsightsModalState extends State<RetailAiInsightsModal> {
  int _activeTab = 0;

  static const _tabs = ['Smart Recommendations', 'Demand & Stock Predictions', 'Store Intelligence'];

  static const _recommendations = [
    {'match': '95%', 'stock': 119, 'name': 'White Bread', 'price': '৳45.00'},
    {'match': '92%', 'stock': 85, 'name': 'Whole Wheat Bread', 'price': '৳55.00'},
    {'match': '89%', 'stock': 200, 'name': 'Burger Bun', 'price': '৳18.00'},
    {'match': '86%', 'stock': 40, 'name': 'Croissant', 'price': '৳60.00'},
    {'match': '83%', 'stock': 40, 'name': 'Cake (Vanilla)', 'price': '৳350.00'},
    {'match': '80%', 'stock': 25, 'name': 'Chocolate Cake', 'price': '৳420.00'},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1A1A1A) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Container(
        width: 680,
        constraints: const BoxConstraints(maxHeight: 620),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(4),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 32,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Header ──────────────────────────────────────────────
            _buildHeader(isDark, borderColor),

            // ── Gradient Banner ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: _buildBanner(),
            ),

            // ── Tabs ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _buildTabs(isDark, borderColor),
            ),

            // ── Content ──────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: _buildTabContent(isDark, borderColor),
              ),
            ),

            // ── Footer ───────────────────────────────────────────────
            _buildFooter(isDark, borderColor),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isDark, Color borderColor) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 12, 12),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: borderColor)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'AI Assistant & Smart Insights',
              style: TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF7C3AED), Color(0xFF6D28D9), Color(0xFF4F46E5)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Icon(Icons.smart_toy_rounded, size: 22, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        'Enterprise POS AI Engine',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'LIVE',
                        style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                const Text(
                  'Analyzing 3 items in order for live cross-sell & bundle recommendations',
                  style: TextStyle(
                    fontSize: 10.5,
                    color: Color(0xFFDDD6FE),
                    fontWeight: FontWeight.w400,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const Icon(Icons.star_rounded, size: 28, color: Color(0xFFFDE68A)),
        ],
      ),
    );
  }

  Widget _buildTabs(bool isDark, Color borderColor) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 500;
        final tabLabels = isNarrow
            ? ['Recommendations', 'Predictions', 'Store Intel']
            : _tabs;

        return Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF242424) : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: borderColor),
          ),
          padding: const EdgeInsets.all(3),
          child: Row(
            children: List.generate(_tabs.length, (i) {
              final isActive = _activeTab == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _activeTab = i),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 2),
                    decoration: BoxDecoration(
                      color: isActive
                          ? (isDark ? const Color(0xFF7C3AED) : Colors.white)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(3),
                      boxShadow: isActive
                          ? [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          i == 0
                              ? Icons.auto_awesome_rounded
                              : i == 1
                                  ? Icons.trending_up_rounded
                                  : Icons.store_rounded,
                          size: 13,
                          color: isActive
                              ? (isDark ? Colors.white : const Color(0xFF7C3AED))
                              : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            tabLabels[i],
                            style: TextStyle(
                              fontSize: isNarrow ? 9.5 : 10.5,
                              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                              color: isActive
                                  ? (isDark ? Colors.white : const Color(0xFF7C3AED))
                                  : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (i == 0 && !isNarrow) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            decoration: BoxDecoration(
                              color: const Color(0xFF7C3AED),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text('6',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        );
      },
    );
  }

  Widget _buildTabContent(bool isDark, Color borderColor) {
    switch (_activeTab) {
      case 0:
        return _buildSmartRecommendations(isDark, borderColor);
      case 1:
        return _buildDemandPredictions(isDark, borderColor);
      case 2:
        return _buildStoreIntelligence(isDark, borderColor);
      default:
        return const SizedBox();
    }
  }

  // ── Tab 1: Smart Recommendations ──────────────────────────────
  Widget _buildSmartRecommendations(bool isDark, Color borderColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                "Contextual suggestions matching current customer's cart:",
                style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              '1-Click Add',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF7C3AED)),
            ),
          ],
        ),
        const SizedBox(height: 10),
        LayoutBuilder(
          builder: (ctx, constraints) {
            final isNarrow = constraints.maxWidth < 500;
            if (isNarrow) {
              return Column(
                children: _recommendations
                    .map((r) => Padding(
                          padding: const EdgeInsets.only(bottom: 8.0),
                          child: _buildRecommendationCard(r, isDark, borderColor),
                        ))
                    .toList(),
              );
            }
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _recommendations.length,
              itemBuilder: (ctx, i) => _buildRecommendationCard(_recommendations[i], isDark, borderColor),
            );
          },
        ),
        const SizedBox(height: 4),
      ],
    );
  }

  Widget _buildRecommendationCard(Map<String, dynamic> r, bool isDark, Color borderColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(Icons.inventory_2_outlined, size: 18, color: isDark ? Colors.grey.shade500 : const Color(0xFF94A3B8)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(r['match'] as String, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF7C3AED))),
                    ),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Stock: ${r['stock']}',
                        style: const TextStyle(fontSize: 9, color: Color(0xFF94A3B8)),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  r['name'] as String,
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1E293B)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(r['price'] as String, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Color(0xFF7C3AED))),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)]),
              borderRadius: BorderRadius.circular(4),
            ),
            child: const Text('+ Add', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // ── Tab 2: Demand & Stock Predictions ─────────────────────────
  Widget _buildDemandPredictions(bool isDark, Color borderColor) {
    return Column(
      children: [
        _buildAlertCard(
          isDark: isDark,
          icon: Icons.warning_amber_rounded,
          iconColor: const Color(0xFFEF4444),
          bgColor: const Color(0xFFFFF1F1),
          title: 'Critical Stockout Warning',
          badgeText: 'High Urgency',
          badgeColor: const Color(0xFFEF4444),
          description: RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
              children: [
                TextSpan(text: 'Pure Life Water 1.5L'),
                TextSpan(text: ' is selling at ', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
                TextSpan(text: '4.2 units/hr', style: TextStyle(fontWeight: FontWeight.bold)),
                TextSpan(text: '. Current stock is expected to deplete in '),
                TextSpan(text: '~2.5 hours', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
                TextSpan(text: '.'),
              ],
            ),
          ),
          actionButton: Container(
            margin: const EdgeInsets.only(top: 8),
            child: Wrap(
              spacing: 10,
              runSpacing: 6,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text('Trigger Reorder Requisition', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Colors.white)),
                ),
                const Text('Reorder Qty: 48 pcs recommended', style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B))),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        _buildAlertCard(
          isDark: isDark,
          icon: Icons.trending_up_rounded,
          iconColor: const Color(0xFF7C3AED),
          bgColor: const Color(0xFFF5F3FF),
          title: 'Beverages Category Surge',
          badgeText: '+38% Demand',
          badgeColor: const Color(0xFF7C3AED),
          description: const Text(
            'Historical customer traffic indicates afternoon beverage spike. Ensure cold beverage display chillers are fully stocked.',
            style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
          ),
        ),
        const SizedBox(height: 10),
        _buildAlertCard(
          isDark: isDark,
          icon: Icons.check_circle_outline_rounded,
          iconColor: const Color(0xFF10B981),
          bgColor: const Color(0xFFF0FDF4),
          title: 'Optimal Stock Health',
          badgeText: '94% Stable',
          badgeColor: const Color(0xFF10B981),
          description: const Text(
            'Central Warehouse stock synchronization active. 142 SKUs have sufficient buffer for next 7 days.',
            style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
          ),
        ),
        const SizedBox(height: 4),
      ],
    );
  }

  Widget _buildAlertCard({
    required bool isDark,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    required String title,
    required String badgeText,
    required Color badgeColor,
    required Widget description,
    Widget? actionButton,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : bgColor,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: iconColor.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: iconColor),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: iconColor),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: badgeColor.withValues(alpha: 0.3)),
                ),
                child: Text(badgeText, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: badgeColor)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          description,
          ?actionButton,
        ],
      ),
    );
  }

  // ── Tab 3: Store Intelligence ──────────────────────────────────
  Widget _buildStoreIntelligence(bool isDark, Color borderColor) {
    return Column(
      children: [
        LayoutBuilder(
          builder: (ctx, constraints) {
            final isNarrow = constraints.maxWidth < 450;
            if (isNarrow) {
              return Column(
                children: [
                  _buildStatCard(isDark, borderColor, 'PREDICTED PEAK RUSH', '5:30 PM - 8:30 PM', 'Est. 45+ Customers/hr', const Color(0xFF7C3AED)),
                  const SizedBox(height: 8),
                  _buildStatCard(isDark, borderColor, 'UPSELL OPPORTUNITY', '+18.2% Basket Size', 'Pairing Snacks with Drinks', const Color(0xFF10B981)),
                  const SizedBox(height: 8),
                  _buildStatCard(isDark, borderColor, 'CASHIER SPEED', '42 sec / checkout', 'Top 5% Performance', const Color(0xFF3B82F6)),
                ],
              );
            }
            return Row(
              children: [
                Expanded(child: _buildStatCard(isDark, borderColor, 'PREDICTED PEAK RUSH', '5:30 PM - 8:30 PM', 'Est. 45+ Customers/hr', const Color(0xFF7C3AED))),
                const SizedBox(width: 8),
                Expanded(child: _buildStatCard(isDark, borderColor, 'UPSELL OPPORTUNITY', '+18.2% Basket Size', 'Pairing Snacks with Drinks', const Color(0xFF10B981))),
                const SizedBox(width: 8),
                Expanded(child: _buildStatCard(isDark, borderColor, 'CASHIER SPEED', '42 sec / checkout', 'Top 5% Performance', const Color(0xFF3B82F6))),
              ],
            );
          },
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.auto_awesome_rounded, size: 15, color: Color(0xFF7C3AED)),
                  const SizedBox(width: 6),
                  Text(
                    'AI Cashier Action Recommendations',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1E293B)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _buildBullet(isDark, 'Suggest ', 'Coca Cola 500ml', ' when customer orders snack items (78% take rate).'),
              const SizedBox(height: 6),
              _buildBullet(isDark, 'Mention ', 'F8 (Save & Hold)', ' for multi-cart customers during queue congestion.'),
              const SizedBox(height: 6),
              _buildBullet(isDark, 'Customer loyalty points redemption active for registered walk-in members.', null, null),
            ],
          ),
        ),
        const SizedBox(height: 4),
      ],
    );
  }

  Widget _buildStatCard(bool isDark, Color borderColor, String label, String value, String sub, Color valueColor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.4)),
          const SizedBox(height: 5),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: valueColor)),
          const SizedBox(height: 2),
          Text(sub, style: TextStyle(fontSize: 10, color: isDark ? Colors.grey.shade500 : const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildBullet(bool isDark, String text1, String? bold, String? text2) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(top: 5),
          width: 5,
          height: 5,
          decoration: const BoxDecoration(color: Color(0xFF94A3B8), shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: bold == null
              ? Text(text1, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade300 : const Color(0xFF334155)))
              : RichText(
                  text: TextSpan(
                    style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                    children: [
                      TextSpan(text: text1),
                      TextSpan(text: bold, style: const TextStyle(fontWeight: FontWeight.w800)),
                      if (text2 != null) TextSpan(text: text2),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildFooter(bool isDark, Color borderColor) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: borderColor)),
      ),
      child: Row(
        children: [
          const Icon(Icons.smart_toy_rounded, size: 13, color: Color(0xFF94A3B8)),
          const SizedBox(width: 6),
          const Flexible(
            child: Text(
              'Enterprise AI POS Engine • Auto-learning active',
              style: TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 7),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF242424) : Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: borderColor),
              ),
              child: Text(
                'Close',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
