import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../../../core/widgets/fullscreen_button.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import 'grocery_pos_screen.dart';

class GroceryDashboardScreen extends StatelessWidget {
  const GroceryDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => GroceryProvider(),
      child: const _GroceryDashboardContent(),
    );
  }
}

class _GroceryDashboardContent extends StatelessWidget {
  const _GroceryDashboardContent();

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    final bgColor = GroceryColors.scaffoldBg(isDark);
    final cardBg = GroceryColors.cardBg(isDark);
    final borderColor = GroceryColors.border(isDark);
    final textPrimary = GroceryColors.textPrimary(isDark);
    final textSecondary = GroceryColors.textSecondary(isDark);

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
                      gradient: GroceryColors.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: GroceryColors.primary.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.local_grocery_store_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),

                  // Title & Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.get('grocery_dashboard', locale),
                          style: TextStyle(
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          AppStrings.get('grocery_dashboard_sub', locale),
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
                    color: GroceryColors.primaryDark,
                    label: AppStrings.get('launch_pos', locale),
                    isMobile: isMobile,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const GroceryPOSScreen()),
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
                        _GroceryKpis(locale: locale, isDark: isDark, isMobile: isMobile),
                        const SizedBox(height: 20),

                        // Two column layout on desktop / stacked on mobile
                        if (isMobile) ...[
                          _CategoryShareCard(locale: locale, isDark: isDark),
                          const SizedBox(height: 16),
                          _LowStockAlertsCard(locale: locale, isDark: isDark),
                          const SizedBox(height: 16),
                          _RecentGrocerySalesCard(locale: locale, isDark: isDark),
                        ] else ...[
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Left: Category breakdown & Quick Launch
                              Expanded(
                                flex: 5,
                                child: Column(
                                  children: [
                                    _CategoryShareCard(locale: locale, isDark: isDark),
                                    const SizedBox(height: 20),
                                    _QuickLaunchCategories(locale: locale, isDark: isDark),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 20),

                              // Right: Critical Low Stock & Recent Sales
                              Expanded(
                                flex: 6,
                                child: Column(
                                  children: [
                                    _LowStockAlertsCard(locale: locale, isDark: isDark),
                                    const SizedBox(height: 20),
                                    _RecentGrocerySalesCard(locale: locale, isDark: isDark),
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
class _GroceryKpis extends StatelessWidget {
  final String locale;
  final bool isDark;
  final bool isMobile;

  const _GroceryKpis({
    required this.locale,
    required this.isDark,
    required this.isMobile,
  });

  @override
  Widget build(BuildContext context) {
    final kpis = [
      _KpiData(
        title: locale == 'bn' ? 'আজকের মোট বিক্রি' : "Today's Revenue",
        value: NumberUtils.formatCurrency(34850, locale),
        subtext: locale == 'bn' ? '+১৪.২% গতকালের চেয়ে' : '+14.2% vs yesterday',
        isPositive: true,
        icon: Icons.payments_rounded,
        accentColor: const Color(0xFF22C55E),
      ),
      _KpiData(
        title: locale == 'bn' ? 'মোট লেনদেন' : 'Completed Invoices',
        value: NumberUtils.formatNumber(148, locale),
        subtext: locale == 'bn' ? 'গড় বাস্কেট ৳২৩৫' : 'Avg basket ৳235',
        isPositive: true,
        icon: Icons.receipt_long_rounded,
        accentColor: const Color(0xFF0EA5E9),
      ),
      _KpiData(
        title: locale == 'bn' ? 'পচনশীল পণ্য বিক্রি' : 'Produce Sold',
        value: '${NumberUtils.formatNumber(412, locale)} kg',
        subtext: locale == 'bn' ? 'ফল ও তাজা শাকসবজি' : 'Fresh fruits & veg',
        isPositive: true,
        icon: Icons.eco_rounded,
        accentColor: const Color(0xFFEAB308),
      ),
      _KpiData(
        title: locale == 'bn' ? 'জরুরি লো স্টক' : 'Critical Low Stock',
        value: NumberUtils.formatNumber(5, locale),
        subtext: locale == 'bn' ? 'অবিলম্বে রি-অর্ডার প্রয়োজন' : 'Immediate reorder',
        isPositive: false,
        icon: Icons.warning_amber_rounded,
        accentColor: const Color(0xFFEF4444),
      ),
    ];

    if (isMobile) {
      return Column(
        children: kpis
            .map((kpi) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _KpiTile(data: kpi, isDark: isDark),
                ))
            .toList(),
      );
    }

    return Row(
      children: kpis
          .map((kpi) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: _KpiTile(data: kpi, isDark: isDark),
                ),
              ))
          .toList(),
    );
  }
}

class _KpiData {
  final String title;
  final String value;
  final String subtext;
  final bool isPositive;
  final IconData icon;
  final Color accentColor;

  const _KpiData({
    required this.title,
    required this.value,
    required this.subtext,
    required this.isPositive,
    required this.icon,
    required this.accentColor,
  });
}

class _KpiTile extends StatelessWidget {
  final _KpiData data;
  final bool isDark;

  const _KpiTile({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = GroceryColors.cardBg(isDark);
    final borderColor = GroceryColors.border(isDark);
    final textPrimary = GroceryColors.textPrimary(isDark);
    final textSecondary = GroceryColors.textSecondary(isDark);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: GroceryColors.softShadow(isDark),
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
                    fontSize: 20,
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
                    color: data.isPositive ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
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

// ── CATEGORY SHARE BREAKDOWN ──
class _CategoryShareCard extends StatelessWidget {
  final String locale;
  final bool isDark;

  const _CategoryShareCard({required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = GroceryColors.cardBg(isDark);
    final borderColor = GroceryColors.border(isDark);
    final textPrimary = GroceryColors.textPrimary(isDark);
    final textSecondary = GroceryColors.textSecondary(isDark);

    final categories = [
      {'name': locale == 'bn' ? 'ফল ও তাজা সবজি' : 'Fruits & Vegetables', 'share': 0.42, 'color': const Color(0xFF22C55E), 'amt': '৳ 14,637'},
      {'name': locale == 'bn' ? 'চাল, ডাল ও চালানী মুদি' : 'Grocery & Staples', 'share': 0.31, 'color': const Color(0xFFEAB308), 'amt': '৳ 10,803'},
      {'name': locale == 'bn' ? 'দুধ, ডিম ও দুগ্ধজাত' : 'Dairy & Eggs', 'share': 0.16, 'color': const Color(0xFF0EA5E9), 'amt': '৳ 5,576'},
      {'name': locale == 'bn' ? 'স্ন্যাকস ও পানীয়' : 'Snacks & Beverages', 'share': 0.11, 'color': const Color(0xFFA855F7), 'amt': '৳ 3,834'},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'বিভাগভিত্তিক বিক্রয় অংশ' : 'Department Sales Breakdown',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.pie_chart_outline_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          ...categories.map((cat) {
            final share = cat['share'] as double;
            final color = cat['color'] as Color;
            final pct = (share * 100).toInt();

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        cat['name'] as String,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        '${cat['amt']} (${NumberUtils.formatNumber(pct, locale)}%)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: color,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: share,
                      minHeight: 6,
                      backgroundColor: borderColor,
                      valueColor: AlwaysStoppedAnimation(color),
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

// ── QUICK LAUNCH CATEGORIES ──
class _QuickLaunchCategories extends StatelessWidget {
  final String locale;
  final bool isDark;

  const _QuickLaunchCategories({required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = GroceryColors.cardBg(isDark);
    final borderColor = GroceryColors.border(isDark);
    final textPrimary = GroceryColors.textPrimary(isDark);

    final cats = [
      {'icon': Icons.apple_rounded, 'name': locale == 'bn' ? 'ফল ও সবজি' : 'Fruits & Veg', 'color': const Color(0xFF22C55E)},
      {'icon': Icons.grain_rounded, 'name': locale == 'bn' ? 'চাল ও ডাল' : 'Staples', 'color': const Color(0xFFEAB308)},
      {'icon': Icons.egg_rounded, 'name': locale == 'bn' ? 'দুধ ও ডিম' : 'Dairy & Eggs', 'color': const Color(0xFF0EA5E9)},
      {'icon': Icons.fastfood_rounded, 'name': locale == 'bn' ? 'স্ন্যাকস' : 'Snacks', 'color': const Color(0xFFA855F7)},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            locale == 'bn' ? 'সরাসরি বিভাগে বিক্রয় শুরু' : 'Quick Open Category in POS',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: cats.map((c) {
              final color = c['color'] as Color;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const GroceryPOSScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        border: Border.all(color: color.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Icon(c['icon'] as IconData, color: color, size: 26),
                          const SizedBox(height: 6),
                          Text(
                            c['name'] as String,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: textPrimary,
                            ),
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
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

// ── LOW STOCK ALERTS CARD ──
class _LowStockAlertsCard extends StatelessWidget {
  final String locale;
  final bool isDark;

  const _LowStockAlertsCard({required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = GroceryColors.cardBg(isDark);
    final borderColor = GroceryColors.border(isDark);
    final textPrimary = GroceryColors.textPrimary(isDark);
    final textSecondary = GroceryColors.textSecondary(isDark);

    final lowStockItems = [
      {'name': locale == 'bn' ? 'লাল আপেল (১ কেজি)' : 'Red Apple (1kg)', 'stock': 12, 'reorder': 30, 'emoji': '🍎', 'urgency': 'Critical'},
      {'name': locale == 'bn' ? 'শসা (১ কেজি)' : 'Cucumber (1kg)', 'stock': 15, 'reorder': 40, 'emoji': '🥒', 'urgency': 'Critical'},
      {'name': locale == 'bn' ? 'ডিম (ডজন)' : 'Eggs (Dozen)', 'stock': 18, 'reorder': 50, 'emoji': '🥚', 'urgency': 'Low'},
      {'name': locale == 'bn' ? 'সয়াবিন তেল (১ লিটার)' : 'Sunflower Oil (1L)', 'stock': 20, 'reorder': 60, 'emoji': '🫒', 'urgency': 'Low'},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    locale == 'bn' ? 'পচনশীল ও লো-স্টক সতর্কতা' : 'Perishable & Low Stock Alerts',
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
                  color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  locale == 'bn' ? 'জরুরি প্রয়োজন' : 'Needs Action',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFEF4444)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...lowStockItems.map((item) {
            final isCrit = item['urgency'] == 'Critical';
            final color = isCrit ? const Color(0xFFEF4444) : const Color(0xFFF59E0B);

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  Text(item['emoji'] as String, style: const TextStyle(fontSize: 20)),
                  const SizedBox(width: 10),
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
                          '${locale == 'bn' ? 'স্টক বাকি' : 'Stock remaining'}: ${NumberUtils.formatNumber(item['stock'] as int, locale)} | ${locale == 'bn' ? 'নূন্যতম' : 'Threshold'}: ${NumberUtils.formatNumber(item['reorder'] as int, locale)}',
                          style: TextStyle(
                            fontSize: 11,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      isCrit ? (locale == 'bn' ? 'জরুরি' : 'Critical') : (locale == 'bn' ? 'কম' : 'Low'),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: color,
                      ),
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

// ── RECENT SALES FEED ──
class _RecentGrocerySalesCard extends StatelessWidget {
  final String locale;
  final bool isDark;

  const _RecentGrocerySalesCard({required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = GroceryColors.cardBg(isDark);
    final borderColor = GroceryColors.border(isDark);
    final textPrimary = GroceryColors.textPrimary(isDark);
    final textSecondary = GroceryColors.textSecondary(isDark);

    final recentTransactions = [
      {'inv': 'INV-2041', 'time': '12:04 PM', 'items': 6, 'payment': 'bKash', 'total': 840.0},
      {'inv': 'INV-2040', 'time': '11:58 AM', 'items': 3, 'payment': 'Cash', 'total': 315.0},
      {'inv': 'INV-2039', 'time': '11:45 AM', 'items': 12, 'payment': 'Card', 'total': 2140.0},
      {'inv': 'INV-2038', 'time': '11:32 AM', 'items': 4, 'payment': 'Cash', 'total': 490.0},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'সাম্প্রতিক কাউন্টার লেনদেন' : 'Recent Counter Sales',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.history_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 12),
          ...recentTransactions.map((tx) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: GroceryColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.receipt_rounded, color: GroceryColors.primary, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${tx['inv']} • ${tx['payment']}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          '${tx['time']} • ${NumberUtils.formatNumber(tx['items'] as int, locale)} ${locale == 'bn' ? 'আইটেম' : 'items'}',
                          style: TextStyle(
                            fontSize: 11,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    NumberUtils.formatCurrency(tx['total'] as double, locale),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: textPrimary,
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
