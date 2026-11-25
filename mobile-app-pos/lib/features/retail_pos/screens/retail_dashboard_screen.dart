import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../../../core/widgets/fullscreen_button.dart';
import 'retail_pos_screen.dart';

class RetailDashboardScreen extends StatelessWidget {
  const RetailDashboardScreen({super.key});

  static const Color primaryPurple = Color(0xFF8B5CF6);
  static const Color primaryCrimson = Color(0xFFC62828);
  static const Color darkPurple = Color(0xFF6D28D9);

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    final bgColor = isDark ? const Color(0xFF0F0B18) : const Color(0xFFF9F7FD);
    final cardBg = isDark ? const Color(0xFF1B152B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2245) : const Color(0xFFEBE5F7);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1F1635);
    final textSecondary = isDark ? const Color(0xFFA59ABF) : const Color(0xFF6D6284);

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
                    color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
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
                        colors: [primaryPurple, primaryCrimson],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: primaryPurple.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),

                  // Title & Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.get('retail_dashboard', locale),
                          style: TextStyle(
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          AppStrings.get('retail_dashboard_sub', locale),
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

                  // Launch POS CTA
                  _LaunchPOSBtn(
                    color: primaryCrimson,
                    label: AppStrings.get('launch_pos', locale),
                    isMobile: isMobile,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const RetailPOSScreen()),
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
                        _RetailKpis(locale: locale, isDark: isDark, isMobile: isMobile),
                        const SizedBox(height: 20),

                        // Two column layout
                        if (isMobile) ...[
                          _PeakHourTrafficCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _FastMovingSkusCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _CashDrawerReconciliationCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _ParkedCartsCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                        ] else ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Left: Peak Hour Distribution & Fast SKUs
                              Expanded(
                                flex: 6,
                                child: Column(
                                  children: [
                                    _PeakHourTrafficCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                    const SizedBox(height: 20),
                                    _FastMovingSkusCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 20),

                              // Right: Cash Drawer reconciliation & Parked Carts
                              Expanded(
                                flex: 5,
                                child: Column(
                                  children: [
                                    _CashDrawerReconciliationCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                    const SizedBox(height: 20),
                                    _ParkedCartsCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
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

// ── LAUNCH POS BUTTON ──
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
    return ElevatedButton.icon(
      onPressed: onTap,
      icon: const Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 18),
      label: Text(
        isMobile ? 'POS' : label,
        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Colors.white),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: color,
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 10 : 16,
          vertical: isMobile ? 8 : 12,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        elevation: 2,
      ),
    );
  }
}

// ── KPI CARDS ROW ──
class _RetailKpis extends StatelessWidget {
  final String locale;
  final bool isDark;
  final bool isMobile;

  const _RetailKpis({
    required this.locale,
    required this.isDark,
    required this.isMobile,
  });

  @override
  Widget build(BuildContext context) {
    final kpis = [
      _RetailKpiData(
        title: locale == 'bn' ? 'আজকের মোট বিক্রি' : "Today's Counter Sales",
        value: NumberUtils.formatCurrency(52190, locale),
        subtext: locale == 'bn' ? '+১৮.৫% গতকালের চেয়ে' : '+18.5% vs yesterday',
        isPositive: true,
        icon: Icons.payments_rounded,
        accentColor: const Color(0xFFC62828),
      ),
      _RetailKpiData(
        title: locale == 'bn' ? 'মোট চেকআউট সংখ্যা' : 'Total Checkouts',
        value: NumberUtils.formatNumber(218, locale),
        subtext: locale == 'bn' ? 'গড় সময় ১.২ মিনিট' : 'Avg checkout 1.2 min',
        isPositive: true,
        icon: Icons.shopping_basket_rounded,
        accentColor: const Color(0xFF8B5CF6),
      ),
      _RetailKpiData(
        title: locale == 'bn' ? 'ক্যাশ ড্রয়ার স্থিতি' : 'Cash in Drawer',
        value: NumberUtils.formatCurrency(41200, locale),
        subtext: locale == 'bn' ? 'ড্রয়ার ওপেন ১০:০০ AM' : 'Shift opened 10:00 AM',
        isPositive: true,
        icon: Icons.point_of_sale_rounded,
        accentColor: const Color(0xFF10B981),
      ),
      _RetailKpiData(
        title: locale == 'bn' ? 'হোল্ড করা কার্ট' : 'Held / Suspended Carts',
        value: NumberUtils.formatNumber(2, locale),
        subtext: locale == 'bn' ? 'কাস্টমার রিকল বাকি' : 'Awaiting customer recall',
        isPositive: false,
        icon: Icons.pause_circle_filled_rounded,
        accentColor: const Color(0xFFF59E0B),
      ),
    ];

    if (isMobile) {
      return Column(
        children: kpis
            .map((kpi) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _RetailKpiTile(data: kpi, isDark: isDark),
                ))
            .toList(),
      );
    }

    return Row(
      children: kpis
          .map((kpi) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: _RetailKpiTile(data: kpi, isDark: isDark),
                ),
              ))
          .toList(),
    );
  }
}

class _RetailKpiData {
  final String title;
  final String value;
  final String subtext;
  final bool isPositive;
  final IconData icon;
  final Color accentColor;

  const _RetailKpiData({
    required this.title,
    required this.value,
    required this.subtext,
    required this.isPositive,
    required this.icon,
    required this.accentColor,
  });
}

class _RetailKpiTile extends StatelessWidget {
  final _RetailKpiData data;
  final bool isDark;

  const _RetailKpiTile({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? const Color(0xFF1B152B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2245) : const Color(0xFFEBE5F7);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1F1635);
    final textSecondary = isDark ? const Color(0xFFA59ABF) : const Color(0xFF6D6284);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: data.accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(data.icon, color: data.accentColor, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: textSecondary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  data.value,
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  data.subtext,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: data.isPositive ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── PEAK HOUR TRAFFIC CARD ──
class _PeakHourTrafficCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _PeakHourTrafficCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final hours = [
      {'time': '10 AM', 'pct': 0.25, 'sales': '৳ 4.2k'},
      {'time': '12 PM', 'pct': 0.55, 'sales': '৳ 8.5k'},
      {'time': '2 PM', 'pct': 0.40, 'sales': '৳ 6.1k'},
      {'time': '4 PM', 'pct': 0.70, 'sales': '৳ 11.2k'},
      {'time': '6 PM', 'pct': 1.0, 'sales': '৳ 16.8k'}, // Peak rush
      {'time': '8 PM', 'pct': 0.85, 'sales': '৳ 13.4k'},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
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
                  const Icon(Icons.analytics_rounded, color: Color(0xFF8B5CF6), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    locale == 'bn' ? 'পিক আওয়ার ও ভিড়ের সময় বণ্টন' : 'Rush Hour Traffic & Sales Density',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFC62828).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  locale == 'bn' ? 'সন্ধ্যা ৬টা-৮টা পিক' : 'Peak: 6 PM - 8 PM',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFC62828)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: hours.map((h) {
              final pct = h['pct'] as double;
              final isPeak = pct >= 0.95;
              final barHeight = 40.0 + (pct * 90.0);

              return Column(
                children: [
                  Text(
                    h['sales'] as String,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isPeak ? const Color(0xFFC62828) : textSecondary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: 28,
                    height: barHeight,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: isPeak
                            ? [const Color(0xFFC62828), const Color(0xFFE53935)]
                            : [const Color(0xFF8B5CF6), const Color(0xFFA78BFA)],
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    h['time'] as String,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: textPrimary,
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

// ── FAST-MOVING SKUS CARD ──
class _FastMovingSkusCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _FastMovingSkusCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final skus = [
      {'name': 'Coca-Cola 500ml', 'sku': 'BEV-001', 'sold': 58, 'rev': '৳ 2,610', 'stock': 85},
      {'name': 'All Time Bread 350g', 'sku': 'BAK-001', 'sold': 44, 'rev': '৳ 2,860', 'stock': 24},
      {'name': 'Lays Classic Chips 50g', 'sku': 'SNK-001', 'sold': 39, 'rev': '৳ 1,950', 'stock': 60},
      {'name': 'Wheel Washing Powder 1kg', 'sku': 'HOU-001', 'sold': 28, 'rev': '৳ 3,920', 'stock': 50},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'দ্রুত বিক্রয়যোগ্য টপ এসকেইউ' : 'Top Fast-Moving SKUs',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.trending_up_rounded, color: const Color(0xFF10B981), size: 22),
            ],
          ),
          const SizedBox(height: 14),
          ...skus.asMap().entries.map((entry) {
            final idx = entry.key + 1;
            final item = entry.value;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: idx <= 2 ? const Color(0xFFC62828).withValues(alpha: 0.15) : borderColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      NumberUtils.formatNumber(idx, locale),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: idx <= 2 ? const Color(0xFFC62828) : textSecondary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['name'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          'SKU: ${item['sku']} • In stock: ${item['stock']}',
                          style: TextStyle(fontSize: 11, color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        item['rev'] as String,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        '${NumberUtils.formatNumber(item['sold'] as int, locale)} ${locale == 'bn' ? 'বিক্রি' : 'units sold'}',
                        style: const TextStyle(fontSize: 10, color: Color(0xFF10B981), fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ── CASH DRAWER RECONCILIATION CARD ──
class _CashDrawerReconciliationCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _CashDrawerReconciliationCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'ক্যাশ ড্রয়ার হিসাব মেলানো' : 'Cash Drawer Shift Reconciliation',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.point_of_sale_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 14),
          _drawerRow(locale == 'bn' ? 'ওপেনিং ক্যাশ ফ্লোট' : 'Opening Cash Float', '৳ 5,000', false),
          _drawerRow(locale == 'bn' ? 'আজকের নগদ বিক্রি' : 'Today Cash Sales', '+ ৳ 38,400', true),
          _drawerRow(locale == 'bn' ? 'কার্ড ও ডিজিটাল এমএফএস' : 'Card / MFS Sales', '৳ 13,790', false),
          _drawerRow(locale == 'bn' ? 'পেটি ক্যাশ খরচ / ড্রপ' : 'Cash Drop / Expense', '- ৳ 2,200', false, isExpense: true),
          Divider(color: borderColor, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'ড্রয়ারে প্রত্যাশিত নগদ' : 'Expected in Drawer',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: textPrimary,
                ),
              ),
              Text(
                '৳ 41,200',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF10B981),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _drawerRow(String label, String value, bool isHighlight, {bool isExpense = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: textSecondary)),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isExpense ? const Color(0xFFEF4444) : (isHighlight ? const Color(0xFF10B981) : textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

// ── PARKED CARTS CARD ──
class _ParkedCartsCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _ParkedCartsCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final parked = [
      {'ticket': 'HOLD-01', 'customer': 'Walk-in Customer (Aisle 3)', 'items': 4, 'total': 480.0, 'time': '12:02 PM'},
      {'ticket': 'HOLD-02', 'customer': 'Rafiqul Islam', 'items': 8, 'total': 1850.0, 'time': '11:48 AM'},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'স্থগিত / হোল্ড করা বিল' : 'Parked / Suspended Bills',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${NumberUtils.formatNumber(2, locale)} ${locale == 'bn' ? 'টি বাকি' : 'Active'}',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...parked.map((p) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.pause_circle_rounded, color: Color(0xFFF59E0B), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${p['ticket']} • ${p['customer']}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          '${p['time']} • ${p['items']} items • ${NumberUtils.formatCurrency(p['total'] as double, locale)}',
                          style: TextStyle(fontSize: 11, color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const RetailPOSScreen()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8B5CF6),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(
                      locale == 'bn' ? 'রিকল' : 'Recall',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
