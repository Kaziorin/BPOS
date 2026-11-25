import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../../../core/widgets/fullscreen_button.dart';
import '../theme/wholesaler_colors.dart';
import 'wholesaler_pos_screen.dart';

class WholesalerDashboardScreen extends StatelessWidget {
  const WholesalerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    final bgColor = WholesalerColors.scaffoldBg(isDark);
    final cardBg = WholesalerColors.cardBg(isDark);
    final borderColor = WholesalerColors.border(isDark);
    final textPrimary = WholesalerColors.textPrimary(isDark);
    final textSecondary = WholesalerColors.textSecondary(isDark);

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
                        colors: [WholesalerColors.primary, WholesalerColors.primaryDark],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: WholesalerColors.primary.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.inventory_2_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),

                  // Title & Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.get('wholesaler_dashboard', locale),
                          style: TextStyle(
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          AppStrings.get('wholesaler_dashboard_sub', locale),
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
                    color: WholesalerColors.primary,
                    label: AppStrings.get('launch_pos', locale),
                    isMobile: isMobile,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const WholesalerPOSScreen()),
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
                        _WholesalerKpis(locale: locale, isDark: isDark, isMobile: isMobile),
                        const SizedBox(height: 20),

                        // Two column layout
                        if (isMobile) ...[
                          _AccountsReceivableCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _WarehouseCapacityCard(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                          ),
                          const SizedBox(height: 16),
                          _DispatchManifestsCard(
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
                              // Left: Accounts Receivable Ledger
                              Expanded(
                                flex: 6,
                                child: Column(
                                  children: [
                                    _AccountsReceivableCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                    const SizedBox(height: 20),
                                    _DispatchManifestsCard(
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

                              // Right: Warehouse Stock & Pallets
                              Expanded(
                                flex: 5,
                                child: Column(
                                  children: [
                                    _WarehouseCapacityCard(
                                      locale: locale,
                                      isDark: isDark,
                                      cardBg: cardBg,
                                      borderColor: borderColor,
                                      textPrimary: textPrimary,
                                      textSecondary: textSecondary,
                                    ),
                                    const SizedBox(height: 20),
                                    _BulkOrderCtaCard(
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
class _WholesalerKpis extends StatelessWidget {
  final String locale;
  final bool isDark;
  final bool isMobile;

  const _WholesalerKpis({
    required this.locale,
    required this.isDark,
    required this.isMobile,
  });

  @override
  Widget build(BuildContext context) {
    final kpis = [
      _WholesaleKpiData(
        title: locale == 'bn' ? 'আজকের বি২বি টার্নওভার' : "Today's B2B Turnover",
        value: NumberUtils.formatCurrency(184500, locale),
        subtext: locale == 'bn' ? '+২২.৪% এই সপ্তাহে' : '+22.4% this week',
        isPositive: true,
        icon: Icons.account_balance_wallet_rounded,
        accentColor: const Color(0xFF4F46E5),
      ),
      _WholesaleKpiData(
        title: locale == 'bn' ? 'মোট বাকি পাওনা' : 'Credit Due (Accounts Rec)',
        value: NumberUtils.formatCurrency(342000, locale),
        subtext: locale == 'bn' ? '১৮ জন ডিলার / গ্রাহক' : '18 active dealers',
        isPositive: false,
        icon: Icons.pending_actions_rounded,
        accentColor: const Color(0xFFEF4444),
      ),
      _WholesaleKpiData(
        title: locale == 'bn' ? 'ডেলিভারি চালানের সংখ্যা' : 'Bulk Freight Dispatches',
        value: NumberUtils.formatNumber(7, locale),
        subtext: locale == 'bn' ? '৫টি লোডিং সম্পন্ন' : '5 loaded & on route',
        isPositive: true,
        icon: Icons.local_shipping_rounded,
        accentColor: const Color(0xFF10B981),
      ),
      _WholesaleKpiData(
        title: locale == 'bn' ? 'গুদাম ক্যাপাসিটি ব্যবহার' : 'Warehouse Capacity',
        value: '84%',
        subtext: locale == 'bn' ? 'ঢাকা ও চট্টগ্রাম হাব' : 'Dhaka & Ctg Hubs',
        isPositive: true,
        icon: Icons.warehouse_rounded,
        accentColor: const Color(0xFFF59E0B),
      ),
    ];

    if (isMobile) {
      return Column(
        children: kpis
            .map((kpi) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _WholesaleKpiTile(data: kpi, isDark: isDark),
                ))
            .toList(),
      );
    }

    return Row(
      children: kpis
          .map((kpi) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: _WholesaleKpiTile(data: kpi, isDark: isDark),
                ),
              ))
          .toList(),
    );
  }
}

class _WholesaleKpiData {
  final String title;
  final String value;
  final String subtext;
  final bool isPositive;
  final IconData icon;
  final Color accentColor;

  const _WholesaleKpiData({
    required this.title,
    required this.value,
    required this.subtext,
    required this.isPositive,
    required this.icon,
    required this.accentColor,
  });
}

class _WholesaleKpiTile extends StatelessWidget {
  final _WholesaleKpiData data;
  final bool isDark;

  const _WholesaleKpiTile({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cardBg = WholesalerColors.cardBg(isDark);
    final borderColor = WholesalerColors.border(isDark);
    final textPrimary = WholesalerColors.textPrimary(isDark);
    final textSecondary = WholesalerColors.textSecondary(isDark);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: WholesalerColors.softShadow(isDark),
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
                    color: data.isPositive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
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

// ── ACCOUNTS RECEIVABLE CARD ──
class _AccountsReceivableCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _AccountsReceivableCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final dealers = [
      {'name': 'Metro Superstore Ltd', 'tier': 'Platinum', 'due': 145000.0, 'limit': 500000.0, 'status': 'Healthy', 'color': const Color(0xFF10B981)},
      {'name': 'Apex Mega Mart', 'tier': 'Gold', 'due': 180000.0, 'limit': 200000.0, 'status': 'Due Soon', 'color': const Color(0xFFF59E0B)},
      {'name': 'City Wholesale Syndicate', 'tier': 'Silver', 'due': 88000.0, 'limit': 100000.0, 'status': 'Limit Exceeded', 'color': const Color(0xFFEF4444)},
      {'name': 'Green Valley Traders', 'tier': 'Platinum', 'due': 42000.0, 'limit': 400000.0, 'status': 'Healthy', 'color': const Color(0xFF10B981)},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.request_quote_rounded, color: WholesalerColors.primary, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    locale == 'bn' ? 'ডিলার বাকির খাতা ও ক্রেডিট স্থিতি' : 'Dealer Credit & Accounts Receivable',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                ],
              ),
              Text(
                locale == 'bn' ? '৪ জন প্রধান ডিলার' : 'Top Accounts',
                style: TextStyle(fontSize: 12, color: textSecondary, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...dealers.map((d) {
            final color = d['color'] as Color;
            final due = d['due'] as double;
            final limit = d['limit'] as double;
            final ratio = (due / limit).clamp(0.0, 1.0);

            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: borderColor.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                d['name'] as String,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: textPrimary,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: WholesalerColors.primary.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  d['tier'] as String,
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: WholesalerColors.primary),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${locale == 'bn' ? 'ক্রেডিট সীমা' : 'Credit limit'}: ${NumberUtils.formatCurrency(limit, locale)}',
                            style: TextStyle(fontSize: 11, color: textSecondary),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            NumberUtils.formatCurrency(due, locale),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: color,
                            ),
                          ),
                          Text(
                            d['status'] as String,
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ratio,
                      minHeight: 5,
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

// ── WAREHOUSE CAPACITY CARD ──
class _WarehouseCapacityCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _WarehouseCapacityCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final hubs = [
      {'name': 'Central Hub (Dhaka Tejgaon)', 'util': 0.88, 'cartons': 2450, 'color': const Color(0xFF4F46E5)},
      {'name': 'Chittagong Port Depot', 'util': 0.64, 'cartons': 1120, 'color': const Color(0xFF10B981)},
      {'name': 'Narayanganj Bulk Stockyard', 'util': 0.45, 'cartons': 800, 'color': const Color(0xFFF59E0B)},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'ওয়্যারহাউস ও স্টক ক্যাপাসিটি' : 'Warehouse Inventory Allocation',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.inventory_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 16),
          ...hubs.map((hub) {
            final util = hub['util'] as double;
            final color = hub['color'] as Color;
            final pct = (util * 100).toInt();

            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        hub['name'] as String,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                      Text(
                        '${NumberUtils.formatNumber(hub['cartons'] as int, locale)} ${locale == 'bn' ? 'কার্টন' : 'ctns'} (${NumberUtils.formatNumber(pct, locale)}%)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: color,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: util,
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

// ── DISPATCH MANIFESTS CARD ──
class _DispatchManifestsCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _DispatchManifestsCard({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
  });

  @override
  Widget build(BuildContext context) {
    final dispatches = [
      {'id': 'DSP-8801', 'client': 'Apex Mega Mart', 'boxes': 120, 'status': 'On Route', 'vehicle': 'DM-CHA-11-2032'},
      {'id': 'DSP-8802', 'client': 'Metro Superstore', 'boxes': 340, 'status': 'Loaded', 'vehicle': 'DM-DHA-14-9912'},
      {'id': 'DSP-8803', 'client': 'Green Valley Traders', 'boxes': 85, 'status': 'Delivered', 'vehicle': 'DM-CHA-12-4011'},
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                locale == 'bn' ? 'আজকের ফ্রেইট চালান ও ডেলিভারি' : 'Daily Freight Dispatches',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: textPrimary,
                ),
              ),
              Icon(Icons.local_shipping_rounded, color: textSecondary, size: 20),
            ],
          ),
          const SizedBox(height: 12),
          ...dispatches.map((d) {
            final isDelivered = d['status'] == 'Delivered';
            final color = isDelivered ? const Color(0xFF10B981) : const Color(0xFF4F46E5);

            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.inventory_rounded, color: color, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${d['id']} • ${d['client']}',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          'Truck: ${d['vehicle']} • ${d['boxes']} cartons',
                          style: TextStyle(
                            fontSize: 11,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      d['status'] as String,
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

// ── BULK ORDER QUICK CTA CARD ──
class _BulkOrderCtaCard extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;

  const _BulkOrderCtaCard({
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF2E2B6B), const Color(0xFF1E1B4B)]
              : [const Color(0xFFEEF2FF), Colors.white],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: WholesalerColors.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: WholesalerColors.primary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.add_shopping_cart_rounded, color: WholesalerColors.primary, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      locale == 'bn' ? 'নতুন বি২বি চালান তৈরি করুন' : 'Create New B2B Invoice',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: textPrimary,
                      ),
                    ),
                    Text(
                      locale == 'bn' ? 'সরাসরি পাইকারি পিওএস রেজিস্টার' : 'Open Bulk Wholesaler Register',
                      style: TextStyle(fontSize: 11, color: textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const WholesalerPOSScreen()),
                );
              },
              icon: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
              label: Text(
                locale == 'bn' ? 'হোলসেল পিওএস ওপেন করুন' : 'Open Wholesaler POS',
                style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: WholesalerColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
