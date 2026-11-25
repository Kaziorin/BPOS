import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../../../core/widgets/fullscreen_button.dart';
import 'pharmacy_pos_screen.dart';

class PharmacyDashboardScreen extends StatelessWidget {
  const PharmacyDashboardScreen({super.key});

  static const Color primaryTeal = Color(0xFF00897B);
  static const Color darkTeal = Color(0xFF004D40);
  static const Color accentBlue = Color(0xFF0288D1);

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    final bgColor = isDark ? const Color(0xFF0B1413) : const Color(0xFFF3F8F8);
    final cardBg = isDark ? const Color(0xFF13201F) : Colors.white;
    final borderColor = isDark ? const Color(0xFF1F3533) : const Color(0xFFE0ECEB);
    final textPrimary = isDark ? Colors.white : const Color(0xFF102826);
    final textSecondary = isDark ? const Color(0xFF8BA5A2) : const Color(0xFF5A7572);

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
                        colors: [primaryTeal, accentBlue],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: primaryTeal.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.local_pharmacy_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),

                  // Title & Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.get('pharmacy_dashboard', locale),
                          style: TextStyle(
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          AppStrings.get('pharmacy_dashboard_sub', locale),
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
                    color: primaryTeal,
                    label: AppStrings.get('launch_pos', locale),
                    isMobile: isMobile,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const PharmacyPOSScreen()),
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
                        _PharmacyKpis(locale: locale, isDark: isDark, isMobile: isMobile),
                        const SizedBox(height: 20),

                        // Two column layout
                        if (isMobile) ...[
                          _ExpiringBatchesCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _TherapeuticShareCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _CriticalRxStockCard(
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
                              // Left: Batch Expiry & Rx vs OTC
                              Expanded(
                                flex: 6,
                                child: Column(
                                  children: [
                                    _ExpiringBatchesCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                    const SizedBox(height: 20),
                                    _CriticalRxStockCard(
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

                              // Right: Therapeutic Categories & Dispense stats
                              Expanded(
                                flex: 5,
                                child: Column(
                                  children: [
                                    _TherapeuticShareCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                    const SizedBox(height: 20),
                                    _RxDispenseRatioCard(
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
class _PharmacyKpis extends StatelessWidget {
  final String locale;
  final bool isDark;
  final bool isMobile;

  const _PharmacyKpis({
    required this.locale,
    required this.isDark,
    required this.isMobile,
  });

  @override
  Widget build(BuildContext context) {
    final kpis = [
      _PharmaKpiData(
        title: locale == 'bn' ? 'আজকের ওষুধ বিক্রি' : "Today's Medicine Sales",
        value: NumberUtils.formatCurrency(28420, locale),
        subtext: locale == 'bn' ? '+৮.৬% গতকালের চেয়ে' : '+8.6% vs yesterday',
        isPositive: true,
        icon: Icons.medication_rounded,
        accentColor: const Color(0xFF00897B),
      ),
      _PharmaKpiData(
        title: locale == 'bn' ? 'প্রেসক্রিপশন সরবরাহ' : 'Prescriptions (Rx)',
        value: NumberUtils.formatNumber(64, locale),
        subtext: locale == 'bn' ? '১০০% ভেরিফাইড ড্রাগ' : '100% verified drugs',
        isPositive: true,
        icon: Icons.receipt_long_rounded,
        accentColor: const Color(0xFF0288D1),
      ),
      _PharmaKpiData(
        title: locale == 'bn' ? 'মেয়াদোত্তীর্ণের পথে' : 'Expiring Soon (<60d)',
        value: NumberUtils.formatNumber(8, locale),
        subtext: locale == 'bn' ? 'রিটার্ন / ডিসকাউন্ট প্রয়োজন' : 'Needs return / action',
        isPositive: false,
        icon: Icons.event_busy_rounded,
        accentColor: const Color(0xFFEF4444),
      ),
      _PharmaKpiData(
        title: locale == 'bn' ? 'জেনেরিক রিপ্লেসমেন্ট' : 'Generic Alternates',
        value: '92%',
        subtext: locale == 'bn' ? '৪৮টি সফল বিকল্প' : '48 successful saves',
        isPositive: true,
        icon: Icons.swap_horiz_rounded,
        accentColor: const Color(0xFF8B5CF6),
      ),
    ];

    if (isMobile) {
      return Column(
        children: kpis
            .map((kpi) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _PharmaKpiTile(data: kpi, isDark: isDark),
                ))
            .toList(),
      );
    }

    return Row(
      children: kpis
          .map((kpi) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: _PharmaKpiTile(data: kpi, isDark: isDark),
                ),
              ))
          .toList(),
    );
  }
}

class _PharmaKpiData {
  final String title;
  final String value;
  final String subtext;
  final bool isPositive;
  final IconData icon;
  final Color accentColor;

  const _PharmaKpiData({
    required this.title,
    required this.value,
    required this.subtext,
    required this.isPositive,
    required this.icon,
    required this.accentColor,
  });
}

class _PharmaKpiTile extends StatelessWidget {
  final _PharmaKpiData data;
  final bool isDark;

  const _PharmaKpiTile({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = isDark ? const Color(0xFF13201F) : Colors.white;
    final borderColor = isDark ? const Color(0xFF1F3533) : const Color(0xFFE0ECEB);
    final textPrimary = isDark ? Colors.white : const Color(0xFF102826);
    final textSecondary = isDark ? const Color(0xFF8BA5A2) : const Color(0xFF5A7572);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
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
                    color: data.isPositive ? const Color(0xFF00897B) : const Color(0xFFEF4444),
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

// ── EXPIRING BATCHES CARD ──
class _ExpiringBatchesCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _ExpiringBatchesCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final batches = [
      {'name': 'Metformin 500mg', 'batch': 'MET-0043', 'mfg': 'Eskayef', 'days': 28, 'stock': 12, 'shelf': 'R-04'},
      {'name': 'Azithromycin 500mg', 'batch': 'AZI-4412', 'mfg': 'Beximco', 'days': 45, 'stock': 18, 'shelf': 'R-02'},
      {'name': 'Salbutamol Inhaler', 'batch': 'SAL-7731', 'mfg': 'Beximco', 'days': 56, 'stock': 22, 'shelf': 'C-01'},
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
                  const Icon(Icons.hourglass_bottom_rounded, color: Color(0xFFEF4444), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    locale == 'bn' ? 'মেয়াদ শেষের পথে ব্যাচ তালিকা' : 'Expiring Batches Watchlist',
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
                  locale == 'bn' ? '৩০-৬০ দিন বাকি' : '< 60 Days',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFEF4444)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...batches.map((b) {
            final days = b['days'] as int;
            final isUrgent = days <= 30;

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isUrgent ? const Color(0xFFEF4444).withValues(alpha: 0.4) : borderColor,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isUrgent ? const Color(0xFFEF4444).withValues(alpha: 0.12) : const Color(0xFFF59E0B).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.warning_amber_rounded,
                      color: isUrgent ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          b['name'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          'Batch: ${b['batch']} • ${b['mfg']} • Shelf: ${b['shelf']}',
                          style: TextStyle(
                            fontSize: 11,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '$days ${locale == 'bn' ? 'দিন বাকি' : 'days left'}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: isUrgent ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                        ),
                      ),
                      Text(
                        '${b['stock']} ${locale == 'bn' ? 'পিস বাকি' : 'units left'}',
                        style: TextStyle(fontSize: 10, color: textSecondary),
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

// ── THERAPEUTIC CLASS SHARE CARD ──
class _TherapeuticShareCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _TherapeuticShareCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final classes = [
      {'name': locale == 'bn' ? 'অ্যান্টিবায়োটিক' : 'Antibiotics', 'pct': 0.34, 'color': const Color(0xFF00897B), 'sales': '৳ 9,660'},
      {'name': locale == 'bn' ? 'গ্যাস্ট্রিক ও এসিডিটি' : 'Gastrointestinal', 'pct': 0.28, 'color': const Color(0xFF0288D1), 'sales': '৳ 7,950'},
      {'name': locale == 'bn' ? 'ব্যথানাশক ও জ্বর' : 'Pain Relief', 'pct': 0.18, 'color': const Color(0xFF8B5CF6), 'sales': '৳ 5,110'},
      {'name': locale == 'bn' ? 'ডায়াবেটিস কেয়ার' : 'Diabetes Care', 'pct': 0.12, 'color': const Color(0xFFF59E0B), 'sales': '৳ 3,410'},
      {'name': locale == 'bn' ? 'ভিটামিন ও সাপ্লিমেন্ট' : 'Vitamins & Supps', 'pct': 0.08, 'color': const Color(0xFF10B981), 'sales': '৳ 2,290'},
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
                locale == 'bn' ? 'থেরাপিউটিক ড্রাগ বিতরণ' : 'Therapeutic Class Breakdown',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.category_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          ...classes.map((c) {
            final pct = c['pct'] as double;
            final color = c['color'] as Color;
            final displayPct = (pct * 100).toInt();

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        c['name'] as String,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        '${c['sales']} (${NumberUtils.formatNumber(displayPct, locale)}%)',
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
                      value: pct,
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

// ── CRITICAL RX STOCK CARD ──
class _CriticalRxStockCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _CriticalRxStockCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final criticalMeds = [
      {'name': 'Amoxicillin 500mg', 'stock': 120, 'min': 100, 'status': 'Sufficient', 'color': const Color(0xFF00897B)},
      {'name': 'Augmentin 625mg', 'stock': 85, 'min': 50, 'status': 'Sufficient', 'color': const Color(0xFF00897B)},
      {'name': 'Napa Extra 100mg', 'stock': 28, 'min': 80, 'status': 'Low Stock', 'color': const Color(0xFFEF4444)},
      {'name': 'Esomeprazole 20mg', 'stock': 32, 'min': 60, 'status': 'Reorder Soon', 'color': const Color(0xFFF59E0B)},
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
                locale == 'bn' ? 'জরুরি অ্যান্টিবায়োটিক ও ড্রাগ স্টক' : 'Essential Medicine Stock Levels',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.inventory_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 14),
          ...criticalMeds.map((med) {
            final color = med['color'] as Color;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        med['name'] as String,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        '${locale == 'bn' ? 'বর্তমান স্টক' : 'Current'}: ${NumberUtils.formatNumber(med['stock'] as int, locale)} | ${locale == 'bn' ? 'নিরাপদ মাত্রা' : 'Buffer'}: ${NumberUtils.formatNumber(med['min'] as int, locale)}',
                        style: TextStyle(fontSize: 11, color: textSecondary),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      med['status'] as String,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
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

// ── RX DISPENSE RATIO CARD ──
class _RxDispenseRatioCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _RxDispenseRatioCard({
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
          Text(
            locale == 'bn' ? 'প্রেসক্রিপশন বনাম ওটিসি বিতরণ' : 'Rx Prescription vs OTC Split',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00897B).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF00897B).withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        '68%',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF00897B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        locale == 'bn' ? 'প্রেসক্রিপশন (Rx)' : 'Doctor Rx',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0288D1).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF0288D1).withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        '32%',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0288D1),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        locale == 'bn' ? 'সরাসরি (OTC)' : 'Over the Counter',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
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
}
