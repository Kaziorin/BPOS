import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../../../core/widgets/fullscreen_button.dart';
import 'pos_screen.dart';

class RestaurantDashboardScreen extends StatelessWidget {
  const RestaurantDashboardScreen({super.key});

  static const Color primaryOrange = Color(0xFFFF6D00);
  static const Color darkOrange = Color(0xFFE65100);

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    final bgColor = isDark ? const Color(0xFF0F0E0E) : const Color(0xFFFBF8F5);
    final cardBg = isDark ? const Color(0xFF1C1917) : Colors.white;
    final borderColor = isDark ? const Color(0xFF292524) : const Color(0xFFF0EAE1);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1C1917);
    final textSecondary = isDark ? const Color(0xFFA8A29E) : const Color(0xFF78716C);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── TOP HEADER ──
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: isMobile ? 12 : 24,
                vertical: 14,
              ),
              decoration: BoxDecoration(
                color: cardBg,
                border: Border(bottom: BorderSide(color: borderColor)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Back to home
                  IconButton(
                    icon: Icon(Icons.arrow_back_rounded, color: textPrimary),
                    onPressed: () => Navigator.of(context).maybePop(),
                    tooltip: 'Back to Home',
                  ),
                  const SizedBox(width: 4),

                  // Brand icon
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [primaryOrange, darkOrange],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: primaryOrange.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.restaurant_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),

                  // Title
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          locale == 'bn' ? 'জেস্টবাইট রেস্তোরাঁ ড্যাশবোর্ড' : 'ZestBite Restaurant Dashboard',
                          style: TextStyle(
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          locale == 'bn' ? 'লাইভ কিচেন, টেবিল ট্র্যাকিং ও দৈনিক বিক্রি' : 'Live Kitchen, Tables & Daily Revenue',
                          style: TextStyle(
                            fontSize: isMobile ? 10 : 12,
                            color: textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // Action: Launch POS
                  _LaunchPOSBtn(
                    color: primaryOrange,
                    label: AppStrings.get('launch_pos', locale),
                    isMobile: isMobile,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const POSScreen()),
                    ),
                  ),

                  const SizedBox(width: 8),
                  // Fullscreen Button
                  FullscreenButton(
                    iconColor: textSecondary,
                    iconSize: 20,
                    padding: const EdgeInsets.all(8),
                    borderRadius: BorderRadius.circular(10),
                  ),

                  // Theme toggle
                  IconButton(
                    icon: Icon(
                      isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                      color: textSecondary,
                    ),
                    onPressed: () => appProvider.toggleTheme(),
                    tooltip: AppStrings.get(isDark ? 'light_mode' : 'dark_mode', locale),
                  ),

                  // Language
                  InkWell(
                    onTap: () => appProvider.setLocale(locale == 'en' ? 'bn' : 'en'),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: borderColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        locale == 'en' ? 'BN' : 'EN',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── BODY ──
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(isMobile ? 12 : 24),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // KPI Cards
                        _RestaurantKpis(locale: locale, isDark: isDark, isMobile: isMobile),
                        const SizedBox(height: 20),

                        // Main Content: Floor Table Grid + Top Selling Menu Items
                        if (isMobile) ...[
                          _LiveTableStatusSection(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                          const SizedBox(height: 16),
                          _KitchenQueueSection(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                          const SizedBox(height: 16),
                          _TopDishesSection(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                          ),
                        ] else ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Left: Table status
                              Expanded(
                                flex: 6,
                                child: _LiveTableStatusSection(
                                  locale: locale,
                                  isDark: isDark,
                                  cardBg: cardBg,
                                  borderColor: borderColor,
                                  textPrimary: textPrimary,
                                ),
                              ),
                              const SizedBox(width: 20),
                              // Right: Kitchen + Top dishes
                              Expanded(
                                flex: 5,
                                child: Column(
                                  children: [
                                    _KitchenQueueSection(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                    ),
                                    const SizedBox(height: 20),
                                    _TopDishesSection(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── LAUNCH POS CTA BUTTON ─────────────────────────────────────────
class _LaunchPOSBtn extends StatelessWidget {
  final Color color;
  final String label;
  final bool isMobile;
  final VoidCallback onTap;

  const _LaunchPOSBtn({
    required this.color,
    required this.label,
    required this.isMobile,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 12 : 18,
          vertical: isMobile ? 8 : 10,
        ),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color, color.withRed((color.r * 255 * 0.85).toInt())],
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.35),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 4),
            const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
          ],
        ),
      ),
    );
  }
}

// ── RESTAURANT KPIS ───────────────────────────────────────────────
class _RestaurantKpis extends StatelessWidget {
  final String locale;
  final bool isDark;
  final bool isMobile;

  const _RestaurantKpis({
    required this.locale,
    required this.isDark,
    required this.isMobile,
  });

  @override
  Widget build(BuildContext context) {
    final kpis = [
      _KpiData(
        title: AppStrings.get('todays_revenue', locale),
        value: '৳${NumberUtils.toLocalized('42,850', locale)}',
        sub: '+14.5% vs yesterday',
        icon: Icons.monetization_on_rounded,
        color: const Color(0xFFFF6D00),
      ),
      _KpiData(
        title: AppStrings.get('todays_orders', locale),
        value: NumberUtils.toLocalized('128', locale),
        sub: '86 Dine-In · 32 Takeaway · 10 Delivery',
        icon: Icons.receipt_long_rounded,
        color: const Color(0xFF3B82F6),
      ),
      _KpiData(
        title: AppStrings.get('table_occupancy', locale),
        value: '10 / 12 (83%)',
        sub: '2 Tables Available Now',
        icon: Icons.table_restaurant_rounded,
        color: const Color(0xFF10B981),
      ),
      _KpiData(
        title: AppStrings.get('kitchen_queue', locale),
        value: '${NumberUtils.toLocalized(6, locale)} KOT',
        sub: 'Avg prep time 12 min',
        icon: Icons.soup_kitchen_rounded,
        color: const Color(0xFFF59E0B),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final cardW = isMobile ? (w - 12) / 2 : (w - 36) / 4;

        return Wrap(
          spacing: 12,
          runSpacing: 12,
          children: kpis.map((k) => SizedBox(width: cardW, child: _KpiCard(data: k, isDark: isDark))).toList(),
        );
      },
    );
  }
}

class _KpiData {
  final String title;
  final String value;
  final String sub;
  final IconData icon;
  final Color color;
  const _KpiData({required this.title, required this.value, required this.sub, required this.icon, required this.color});
}

class _KpiCard extends StatelessWidget {
  final _KpiData data;
  final bool isDark;
  const _KpiCard({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final bg = isDark ? const Color(0xFF1C1917) : Colors.white;
    final border = isDark ? const Color(0xFF292524) : const Color(0xFFF0EAE1);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                data.title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? const Color(0xFFA8A29E) : const Color(0xFF78716C),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: data.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(data.icon, color: data.color, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            data.value,
            style: TextStyle(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF1C1917),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            data.sub,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: data.color,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ── LIVE TABLE STATUS SECTION ─────────────────────────────────────
class _LiveTableStatusSection extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;

  const _LiveTableStatusSection({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
  });

  static const List<Map<String, dynamic>> tables = [
    {'name': 'T-01', 'seats': 2, 'occupied': true, 'amount': 1250},
    {'name': 'T-02', 'seats': 4, 'occupied': true, 'amount': 2400},
    {'name': 'T-03', 'seats': 4, 'occupied': false, 'amount': 0},
    {'name': 'T-04', 'seats': 6, 'occupied': true, 'amount': 4100},
    {'name': 'T-05', 'seats': 4, 'occupied': true, 'amount': 1850},
    {'name': 'T-06', 'seats': 2, 'occupied': false, 'amount': 0},
    {'name': 'T-07', 'seats': 8, 'occupied': true, 'amount': 5900},
    {'name': 'T-08', 'seats': 4, 'occupied': true, 'amount': 2100},
    {'name': 'VIP-1', 'seats': 10, 'occupied': true, 'amount': 11400},
    {'name': 'VIP-2', 'seats': 12, 'occupied': false, 'amount': 0},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.table_bar_rounded, color: RestaurantDashboardScreen.primaryOrange, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    locale == 'bn' ? 'ফ্লোর ও টেবিল মনিটরিং' : 'Live Floor & Table Monitor',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const POSScreen())),
                child: Text(
                  locale == 'bn' ? 'POS এ টেবিল বুক করুন →' : 'Book on POS →',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: RestaurantDashboardScreen.primaryOrange,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Wrap table items
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: tables.map((t) {
              final occupied = t['occupied'] as bool;
              final name = t['name'] as String;
              final seats = t['seats'] as int;
              final amount = t['amount'] as int;

              final statusColor = occupied ? Colors.red.shade400 : Colors.green.shade500;
              final statusBg = occupied
                  ? (isDark ? Colors.red.shade900.withValues(alpha: 0.3) : Colors.red.shade50)
                  : (isDark ? Colors.green.shade900.withValues(alpha: 0.3) : Colors.green.shade50);

              return InkWell(
                onTap: () {
                  context.read<POSProvider>().selectTable(name);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const POSScreen()));
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 96,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                  ),
                  child: Column(
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$seats seats',
                        style: TextStyle(
                          fontSize: 10,
                          color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        occupied ? '৳$amount' : (locale == 'bn' ? 'খালি' : 'Available'),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: statusColor,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ── KITCHEN QUEUE SECTION ─────────────────────────────────────────
class _KitchenQueueSection extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;

  const _KitchenQueueSection({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
  });

  static const List<Map<String, dynamic>> kots = [
    {'kot': 'KOT #104', 'table': 'T-01', 'time': '3m ago', 'items': '1x Chicken Biryani, 1x Raita', 'status': 'Cooking'},
    {'kot': 'KOT #105', 'table': 'VIP-1', 'time': '7m ago', 'items': '2x Beef Burger, 2x Cold Coffee', 'status': 'Prep'},
    {'kot': 'KOT #106', 'table': 'T-07', 'time': '11m ago', 'items': '4x Tandoori Naan, 2x Butter Chicken', 'status': 'Ready'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.soup_kitchen_rounded, color: Color(0xFFF59E0B), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    locale == 'bn' ? 'কিচেন অর্ডার কিউ (KOT)' : 'Live Kitchen Order Queue',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  locale == 'bn' ? '৩টি তৈরি হচ্ছে' : '3 In Progress',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFFF59E0B)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            children: kots.map((k) {
              final status = k['status'] as String;
              final isReady = status == 'Ready';
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF24201D) : const Color(0xFFFAF7F4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 38,
                      decoration: BoxDecoration(
                        color: isReady ? Colors.green : Colors.amber,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${k['kot']} · ${k['table']}', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: textPrimary)),
                              Text(k['time'] as String, style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(k['items'] as String, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.grey.shade300 : Colors.grey.shade700), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ── TOP DISHES SECTION ────────────────────────────────────────────
class _TopDishesSection extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;

  const _TopDishesSection({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
  });

  static const List<Map<String, dynamic>> dishes = [
    {'name': 'Beef Kacchi Biryani', 'sold': '48 sold', 'rev': '৳21,600', 'share': '50%'},
    {'name': 'Chicken BBQ Burger', 'sold': '34 sold', 'rev': '৳8,500', 'share': '20%'},
    {'name': 'Butter Chicken & Naan', 'sold': '28 sold', 'rev': '৳7,840', 'share': '18%'},
    {'name': 'Iced Caramel Latte', 'sold': '24 sold', 'rev': '৳4,800', 'share': '12%'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.leaderboard_rounded, color: RestaurantDashboardScreen.primaryOrange, size: 20),
              const SizedBox(width: 8),
              Text(
                AppStrings.get('fast_moving', locale),
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Column(
            children: dishes.map((d) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: RestaurantDashboardScreen.primaryOrange.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Text('🔥', style: TextStyle(fontSize: 14)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(d['name'] as String, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: textPrimary)),
                          Text(d['sold'] as String, style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : Colors.grey.shade600)),
                        ],
                      ),
                    ),
                    Text(
                      d['rev'] as String,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: textPrimary),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
