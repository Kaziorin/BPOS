import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import '../../../core/widgets/fullscreen_button.dart';
import 'wholesaler_dialogs.dart';
import 'wholesaler_footer_bar.dart';

// ─────────────────────────────────────────────────────────────────
// TOP HEADER  (title, order no, customer info, credit, time)
// ─────────────────────────────────────────────────────────────────
class WholesalerHeader extends StatelessWidget {
  const WholesalerHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 600;
    final isTablet = width < 900;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        gradient: isDark
            ? WholesalerColors.headerGradient
            : const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.white, Color(0xFFF8FAFF)],
              ),
        border: Border(
          bottom: BorderSide(color: WholesalerColors.border(isDark), width: 1),
        ),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: SafeArea(
        bottom: false,
        child: isMobile
            ? _MobileHeader(isDark: isDark, w: w)
            : _DesktopHeader(isDark: isDark, w: w, isTablet: isTablet),
      ),
    );
  }
}

class _DesktopHeader extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool isTablet;
  const _DesktopHeader({required this.isDark, required this.w, required this.isTablet});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final now = DateTime.now();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          // Logo + Order Info
          _LogoOrderBlock(isDark: isDark, w: w),
          const SizedBox(width: 16),
          // Customer Info Block
          Expanded(
            child: _CustomerInfoBlock(isDark: isDark, w: w, compact: isTablet),
          ),
          if (!isTablet) ...[
            const SizedBox(width: 12),
            // Credit tiles
            _CreditTile(
              label: 'Credit Limit',
              value: '৳${_fmt(w.customer.creditLimit)}',
              color: WholesalerColors.textSecondary(isDark),
              isDark: isDark,
            ),
            const SizedBox(width: 8),
            _CreditTile(
              label: 'Available Credit',
              value: '৳${_fmt(w.customer.availableCredit)}',
              color: WholesalerColors.accentGreen,
              isDark: isDark,
            ),
            const SizedBox(width: 8),
            _CreditTile(
              label: 'Outstanding',
              value: '৳${_fmt(w.customer.outstanding)}',
              color: WholesalerColors.accentRed,
              isDark: isDark,
            ),
          ],
          const SizedBox(width: 12),
          // Time + Settings
          _TimeBlock(isDark: isDark, now: now),
          const SizedBox(width: 10),
          _HeaderActions(isDark: isDark, app: app),
        ],
      ),
    );
  }

  String _fmt(double v) => NumberFormat('#,##0.00').format(v);
}

class _MobileHeader extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _MobileHeader({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _LogoOrderBlock(isDark: isDark, w: w, compact: true),
              const Spacer(),
              _HeaderActions(isDark: isDark, app: app, isMobile: true, w: w),
            ],
          ),
          const SizedBox(height: 8),
          _CustomerInfoBlock(isDark: isDark, w: w, compact: true),
        ],
      ),
    );
  }
}

class _LogoOrderBlock extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool compact;
  const _LogoOrderBlock({required this.isDark, required this.w, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          decoration: BoxDecoration(
            gradient: WholesalerColors.primaryGradient,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: WholesalerColors.primary.withValues(alpha: 0.4),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(Icons.inventory_2_rounded, color: Colors.white, size: 22),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'New Sales Order',
              style: TextStyle(
                fontSize: compact ? 14 : 16,
                fontWeight: FontWeight.w900,
                color: WholesalerColors.textPrimary(isDark),
                letterSpacing: -0.3,
              ),
            ),
            Text(
              w.orderNo,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w600,
                color: WholesalerColors.textSecondary(isDark),
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CustomerInfoBlock extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool compact;
  const _CustomerInfoBlock({required this.isDark, required this.w, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final tierColor = switch (w.customer.tier) {
      WCustomerTier.platinum => WholesalerColors.accentOrange,
      WCustomerTier.gold => const Color(0xFFFFD700),
      WCustomerTier.silver => Colors.grey.shade400,
      WCustomerTier.regular => WholesalerColors.accentBlue,
    };

    return GestureDetector(
      onTap: () => showDialog(
        context: context,
        builder: (_) => ChangeNotifierProvider.value(
          value: context.read<WholesalerProvider>(),
          child: const WCustomerDialog(),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isDark
              ? WholesalerColors.primary.withValues(alpha: 0.1)
              : WholesalerColors.primaryLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: WholesalerColors.primary.withValues(alpha: 0.25),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.business_rounded, size: 16, color: WholesalerColors.primary),
            const SizedBox(width: 8),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          w.customer.name,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: WholesalerColors.textPrimary(isDark),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: tierColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: tierColor.withValues(alpha: 0.4)),
                        ),
                        child: Text(
                          w.customer.tierLabel,
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.w800,
                            color: tierColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${w.customer.customerId}  •  ${w.customer.phone}',
                    style: TextStyle(
                      fontSize: 9,
                      color: WholesalerColors.textSecondary(isDark),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CreditTile extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isDark;
  const _CreditTile({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? WholesalerColors.inputBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: WholesalerColors.textSecondary(isDark),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimeBlock extends StatelessWidget {
  final bool isDark;
  final DateTime now;
  const _TimeBlock({required this.isDark, required this.now});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(
          DateFormat('h:mm a').format(now),
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: WholesalerColors.textPrimary(isDark),
          ),
        ),
        Text(
          DateFormat('d MMM, yyyy').format(now),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w500,
            color: WholesalerColors.textSecondary(isDark),
          ),
        ),
      ],
    );
  }
}

class _HeaderActions extends StatelessWidget {
  final bool isDark;
  final AppProvider app;
  final bool isMobile;
  final WholesalerProvider? w;
  const _HeaderActions({
    required this.isDark,
    required this.app,
    this.isMobile = false,
    this.w,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // On mobile: Quick Actions & Footer Options Button
        if (isMobile && w != null) ...[
          _HeaderBtn(
            icon: Icons.dashboard_customize_rounded,
            isDark: isDark,
            isPrimary: true,
            onTap: () => showWholesalerMobileOptions(context, w!, isDark),
          ),
          const SizedBox(width: 6),
        ],
        FullscreenButton(
          builder: (context, isFull, toggle) => _HeaderBtn(
            icon: isFull ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
            isDark: isDark,
            onTap: toggle,
          ),
        ),
        const SizedBox(width: 6),
        _HeaderBtn(
          icon: app.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
          isDark: isDark,
          onTap: () => app.toggleTheme(),
        ),
        const SizedBox(width: 6),
        _HeaderBtn(icon: Icons.home_rounded, isDark: isDark, onTap: () => Navigator.of(context).maybePop()),
      ],
    );
  }
}

class _HeaderBtn extends StatelessWidget {
  final IconData icon;
  final bool isDark;
  final bool isPrimary;
  final VoidCallback onTap;
  const _HeaderBtn({
    required this.icon,
    required this.isDark,
    this.isPrimary = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark
                ? WholesalerColors.primary.withValues(alpha: 0.12)
                : WholesalerColors.primaryLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isPrimary
                  ? Colors.transparent
                  : WholesalerColors.border(isDark),
            ),
            boxShadow: isPrimary
                ? [
                    BoxShadow(
                      color: WholesalerColors.primary.withValues(alpha: 0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Icon(
            icon,
            size: 18,
            color: isPrimary ? Colors.white : WholesalerColors.primary,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// STATS BAR  (Today's Sales, Orders, Delivery, Customers, Pending, Low Stock)
// ─────────────────────────────────────────────────────────────────
class WholesalerStatsBar extends StatelessWidget {
  const WholesalerStatsBar({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    final stats = [
      _Stat(Icons.trending_up_rounded, "Today's Sales",
          '৳${NumberFormat('#,##0.00').format(w.todaysSales)}',
          WholesalerColors.accentGreen, true),
      _Stat(Icons.receipt_long_rounded, 'Orders',
          w.ordersCount.toString(), WholesalerColors.accentBlue, false),
      _Stat(Icons.local_shipping_rounded, 'Delivery',
          w.deliveryCount.toString(), WholesalerColors.accentOrange, false),
      _Stat(Icons.people_rounded, 'Customers',
          w.customersCount.toString(), WholesalerColors.accentPurple, false),
      _Stat(Icons.pending_actions_rounded, 'Pending Orders',
          w.pendingOrdersCount.toString(), WholesalerColors.primary, false),
      _Stat(Icons.warning_amber_rounded, 'Low Stock Alerts',
          w.lowStockAlerts.toString(), WholesalerColors.accentRed, false),
      _Stat(Icons.account_balance_wallet_rounded, 'Due / Rec.',
          '৳${NumberFormat('#,##0.00').format(w.totalReceivables)}',
          const Color(0xFFF59E0B), true),
      _Stat(Icons.payments_rounded, 'Collected Cash',
          '৳${NumberFormat('#,##0.00').format(w.collectedCash)}',
          const Color(0xFF10B981), false),
      _Stat(Icons.assignment_return_rounded, 'Returns',
          '${w.returnsCount} Req', const Color(0xFFEC4899), false),
      _Stat(Icons.warehouse_rounded, 'Warehouses',
          '${w.activeWarehouses} Active', const Color(0xFF06B6D4), false),
    ];

    return Container(
      height: 58,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: isDark
            ? WholesalerColors.inputBg(true).withValues(alpha: 0.7)
            : WholesalerColors.panelBg(false),
        border: Border(bottom: BorderSide(color: WholesalerColors.border(isDark))),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 700;
          if (isWide) {
            return Row(
              children: [
                for (int i = 0; i < stats.length; i++) ...[
                  if (i > 0)
                    Container(
                      width: 1,
                      height: 28,
                      color: WholesalerColors.border(isDark),
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                    ),
                  Expanded(
                    child: _StatItem(s: stats[i], isDark: isDark),
                  ),
                ],
              ],
            );
          }
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: stats.length,
            separatorBuilder: (_, _) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: VerticalDivider(
                color: WholesalerColors.border(isDark),
                width: 1,
              ),
            ),
            itemBuilder: (_, i) => _StatItem(s: stats[i], isDark: isDark),
          );
        },
      ),
    );
  }
}

class _Stat {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final bool large;
  const _Stat(this.icon, this.label, this.value, this.color, this.large);
}

class _StatItem extends StatelessWidget {
  final _Stat s;
  final bool isDark;
  const _StatItem({required this.s, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: s.color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(s.icon, size: 14, color: s.color),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  s.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: s.large ? 13 : 12,
                    fontWeight: FontWeight.w900,
                    color: s.large ? s.color : WholesalerColors.textPrimary(isDark),
                    height: 1.1,
                  ),
                ),
                Text(
                  s.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w500,
                    color: WholesalerColors.textSecondary(isDark),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
