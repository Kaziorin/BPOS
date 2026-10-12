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
// TOP HEADER PANEL (Mobile / Desktop Adaptive)
// ─────────────────────────────────────────────────────────────────
class WholesalerHeader extends StatelessWidget {
  const WholesalerHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;
    final isTablet = width >= 700 && width < 1150;

    if (isMobile) {
      return _MobileHeader(isDark: isDark, w: w);
    }

    return Container(
      decoration: BoxDecoration(
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.softShadow(isDark, elevation: 1.2),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: _DesktopHeader(isDark: isDark, w: w, isTablet: isTablet),
    );
  }
}

class _DesktopHeader extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool isTablet;
  const _DesktopHeader({
    required this.isDark,
    required this.w,
    required this.isTablet,
  });

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final now = DateTime.now();

    return Row(
      children: [
        // ── 1. Left: Back Button (only shown if can pop) + BPOS / WHOLESALE & B2B ────────
        if (ModalRoute.of(context)?.canPop ?? false) ...[
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                if (Navigator.of(context).canPop()) {
                  Navigator.of(context).pop();
                } else {
                  Navigator.of(context).maybePop();
                }
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: WholesalerColors.border(isDark)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.arrow_back_rounded,
                  size: 18,
                  color: WholesalerColors.textPrimary(isDark),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
        ],
        _LogoBlock(isDark: isDark, compact: isTablet),

        // Flexible empty space pushing Customer Box to the right-center
        const Spacer(),

        // ── 2. Customer Profile Box (Matching Screenshot) ─────────
        _CustomerBox(isDark: isDark, w: w, compact: isTablet),

        const SizedBox(width: 16),

        // ── 3. Right: Time & Date ────────────────────────────────
        _TimeBlock(isDark: isDark, now: now, compact: isTablet),
        const SizedBox(width: 12),

        // ── 4. Theme Switch Pill (Sun / Moon) ────────────────────
        _ThemeSwitchPill(isDark: isDark, onToggle: () => app.toggleTheme()),
        const SizedBox(width: 10),

        // ── 5. Fullscreen Toggle Button ──────────────────────────
        FullscreenButton(
          builder: (context, isFull, toggle) => _SquareBtn(
            icon: isFull
                ? Icons.fullscreen_exit_rounded
                : Icons.fullscreen_rounded,
            isDark: isDark,
            onTap: toggle,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// MOBILE HEADER (Exact Match to User's Previous Mobile Screenshot)
// ─────────────────────────────────────────────────────────────────
class _MobileHeader extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _MobileHeader({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              _MobileLogoOrderBlock(isDark: isDark, w: w),
              const Spacer(),
              _MobileHeaderActions(isDark: isDark, app: app, w: w),
            ],
          ),
          const SizedBox(height: 6),
          _MobileCustomerInfoBlock(isDark: isDark, w: w),
        ],
      ),
    );
  }
}

class _MobileLogoOrderBlock extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _MobileLogoOrderBlock({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Blue/Purple gradient icon box with soft shadow matching screenshot
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF5C52EE), Color(0xFF4338CA)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: const Icon(
            Icons.all_inbox_rounded,
            color: Colors.white,
            size: 18,
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BPOS',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: WholesalerColors.textPrimary(isDark),
                letterSpacing: -0.2,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              'WHOLESALE & B2B',
              style: TextStyle(
                fontSize: 8.5,
                fontWeight: FontWeight.w700,
                color: isDark ? const Color(0xFF818CF8) : const Color(0xFF6366F1),
                letterSpacing: 0.5,
                height: 1.15,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MobileHeaderActions extends StatelessWidget {
  final bool isDark;
  final AppProvider app;
  final WholesalerProvider w;
  const _MobileHeaderActions({
    required this.isDark,
    required this.app,
    required this.w,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. Dashboard customize / apps button
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => showWholesalerMobileOptions(context, w, isDark),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: isDark ? 0.25 : 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(
                  color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFE2E8F0),
                ),
              ),
              child: const Icon(
                Icons.grid_view_rounded,
                size: 16,
                color: Color(0xFF818CF8),
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),

        // 2. Dark mode button
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => app.toggleTheme(),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: (app.isDarkMode
                            ? const Color(0xFFF59E0B)
                            : const Color(0xFF6366F1))
                        .withValues(alpha: isDark ? 0.25 : 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(
                  color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Center(
                child: app.isDarkMode
                    ? ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ).createShader(bounds),
                        child: const Icon(
                          Icons.wb_sunny_rounded,
                          size: 16,
                          color: Colors.white,
                        ),
                      )
                    : ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Color(0xFF6366F1), Color(0xFF4338CA)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ).createShader(bounds),
                        child: Transform.rotate(
                          angle: -0.25,
                          child: const Icon(
                            Icons.dark_mode_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),

        // 3. Home button
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => Navigator.of(context).maybePop(),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isDark ? WholesalerColors.surfaceBg(isDark) : Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: isDark ? 0.25 : 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
                border: Border.all(
                  color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFE2E8F0),
                ),
              ),
              child: const Icon(
                Icons.home_rounded,
                size: 17,
                color: Color(0xFF4338CA),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MobileCustomerInfoBlock extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _MobileCustomerInfoBlock({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    final customer = w.customer.id.isNotEmpty ? w.customer : w.customers.first;
    final customerName = customer.name;
    final customerSub = '${customer.customerId} • ${customer.phone}';
    final tierText = customer.tierLabel;

    return GestureDetector(
      onTap: () => showDialog(
        context: context,
        builder: (_) => ChangeNotifierProvider.value(
          value: context.read<WholesalerProvider>(),
          child: const WCustomerDialog(),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFD8E2F5),
            width: 1.1,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4F46E5).withValues(alpha: isDark ? 0.2 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(
              Icons.apartment_rounded,
              size: 18,
              color: Color(0xFF4F46E5),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          customerName,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: WholesalerColors.textPrimary(isDark),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3E6),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFFF59E0B).withValues(alpha: 0.7),
                            width: 0.9,
                          ),
                        ),
                        child: Text(
                          tierText,
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFFD97706),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    customerSub,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color: WholesalerColors.textSecondary(isDark),
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

// ─────────────────────────────────────────────────────────────────
// LOGO BLOCK (<- button + BPOS + WHOLESALE & B2B)
// ─────────────────────────────────────────────────────────────────
class _LogoBlock extends StatelessWidget {
  final bool isDark;
  final bool compact;
  const _LogoBlock({required this.isDark, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Square back button
        InkWell(
          onTap: () => Navigator.of(context).maybePop(),
          borderRadius: BorderRadius.circular(4),
          child: Container(
            width: compact ? 32 : 36,
            height: compact ? 32 : 36,
            decoration: BoxDecoration(
              color: WholesalerColors.surfaceBg(isDark),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: WholesalerColors.border(isDark)),
            ),
            child: Icon(
              Icons.arrow_back_rounded,
              color: isDark ? Colors.white70 : const Color(0xFF475569),
              size: compact ? 16 : 18,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BPOS',
              style: TextStyle(
                fontSize: compact ? 17 : 20,
                fontWeight: FontWeight.w900,
                color: WholesalerColors.textPrimary(isDark),
                letterSpacing: -0.5,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              'WHOLESALE & B2B',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: WholesalerColors.primary,
                letterSpacing: 0.7,
                height: 1.1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CUSTOMER PROFILE BOX (Exact Match to Web Screenshot)
// ─────────────────────────────────────────────────────────────────
class _CustomerBox extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool compact;
  const _CustomerBox({
    required this.isDark,
    required this.w,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final customerName = w.customer.name.trim().isNotEmpty
        ? w.customer.name
        : 'No Customer Selected';
    final customerTier = w.customer.tierName.toUpperCase();
    final customerSub =
        '${w.customer.customerId.isNotEmpty ? w.customer.customerId : 'N/A'} • ${w.customer.phone.isNotEmpty ? w.customer.phone : 'N/A'}';

    return InkWell(
      onTap: () => showDialog(
        context: context,
        builder: (_) => ChangeNotifierProvider.value(
          value: context.read<WholesalerProvider>(),
          child: const WCustomerDialog(),
        ),
      ),
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: WholesalerColors.surfaceBg(isDark),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: WholesalerColors.border(isDark)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Left: Name + Tier Badge + Subtitle
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      customerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF10213D),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEBF3FE),
                        borderRadius: BorderRadius.circular(3),
                        border: Border.all(color: const Color(0xFFBEDCFD)),
                      ),
                      child: Text(
                        '$customerTier CUSTOMER',
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF146EF5),
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  customerSub,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),

            if (!compact) ...[
              _vDivider(isDark),
              _MetricCol(
                label: 'Credit Limit',
                value: '৳${_fmt(w.customer.creditLimit)}',
                color: isDark ? Colors.white70 : const Color(0xFF10213D),
              ),
              _vDivider(isDark),
              _MetricCol(
                label: 'Available Credit',
                value: '৳${_fmt(w.customer.availableCredit)}',
                color: const Color(0xFF059669),
              ),
              _vDivider(isDark),
              _MetricCol(
                label: 'Outstanding',
                value: '৳${_fmt(w.customer.outstanding)}',
                color: const Color(0xFFE11D48),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _vDivider(bool isDark) {
    return Container(
      width: 1,
      height: 28,
      margin: const EdgeInsets.symmetric(horizontal: 14),
      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
    );
  }

  String _fmt(double v) => NumberFormat('#,##0.00').format(v);
}

class _MetricCol extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _MetricCol({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
            height: 1.1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: color,
            height: 1.1,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// TIME & DATE BLOCK (Matching Screenshot)
// ─────────────────────────────────────────────────────────────────
class _TimeBlock extends StatelessWidget {
  final bool isDark;
  final DateTime now;
  final bool compact;
  const _TimeBlock({
    required this.isDark,
    required this.now,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('h:mm a').format(now);
    final dateStr = DateFormat('d MMM yyyy').format(now);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          timeStr,
          style: TextStyle(
            fontSize: compact ? 12 : 13.5,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF10213D),
            height: 1.1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          dateStr,
          style: TextStyle(
            fontSize: compact ? 9 : 10,
            fontWeight: FontWeight.w600,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
            height: 1.1,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SUN / MOON SWITCH PILL (Exact 68x36 Switch from Screenshot)
// ─────────────────────────────────────────────────────────────────
class _ThemeSwitchPill extends StatelessWidget {
  final bool isDark;
  final VoidCallback onToggle;
  const _ThemeSwitchPill({required this.isDark, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onToggle,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: 66,
        height: 36,
        padding: const EdgeInsets.all(3.5),
        decoration: BoxDecoration(
          color: WholesalerColors.surfaceBg(isDark),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: WholesalerColors.border(isDark)),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 6),
                  child: Icon(
                    Icons.wb_sunny_rounded,
                    size: 11,
                    color: isDark
                        ? const Color(0xFF475569)
                        : const Color(0xFFD97706),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: Icon(
                    Icons.nightlight_round,
                    size: 11,
                    color: isDark
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
            AnimatedAlign(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeInOut,
              alignment: isDark ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 27,
                height: 27,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF146EF5) : Colors.white,
                  shape: BoxShape.circle,
                  border: isDark
                      ? null
                      : Border.all(color: const Color(0xFFCBD5E1)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Icon(
                  isDark ? Icons.nightlight_round : Icons.wb_sunny_rounded,
                  size: 13,
                  color: isDark ? Colors.white : const Color(0xFFF59E0B),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SQUARE ACTION BUTTON (Fullscreen Toggle)
// ─────────────────────────────────────────────────────────────────
class _SquareBtn extends StatelessWidget {
  final IconData icon;
  final bool isDark;
  final VoidCallback onTap;

  const _SquareBtn({
    required this.icon,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: WholesalerColors.surfaceBg(isDark),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: WholesalerColors.border(isDark)),
        ),
        child: Icon(
          icon,
          size: 16,
          color: isDark ? Colors.white70 : const Color(0xFF475569),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// STATS BAR (Adaptive: Mobile Pills vs Desktop Cards)
// ─────────────────────────────────────────────────────────────────
class WholesalerStatsBar extends StatelessWidget {
  const WholesalerStatsBar({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    if (isMobile) {
      final mobileStats = [
        _MobileStat(
          Icons.trending_up_rounded,
          "Today's Sales",
          '৳${NumberFormat('#,##0.00').format(w.todaysSales)}',
          const Color(0xFF00B67A),
          const Color(0xFFE6F9F0),
          isGreenValue: true,
        ),
        _MobileStat(
          Icons.receipt_long_rounded,
          'Orders',
          w.ordersCount.toString(),
          const Color(0xFF3B82F6),
          const Color(0xFFEBF3FE),
        ),
        _MobileStat(
          Icons.local_shipping_rounded,
          'Delivery',
          w.deliveryCount.toString(),
          const Color(0xFFF59E0B),
          const Color(0xFFFEF3E6),
        ),
        _MobileStat(
          Icons.people_rounded,
          'Customers',
          w.customersCount.toString(),
          const Color(0xFF8B5CF6),
          const Color(0xFFF3EEFE),
        ),
        _MobileStat(
          Icons.warning_amber_rounded,
          'Low Stock Alerts',
          w.lowStockAlerts.toString(),
          const Color(0xFFEF4444),
          const Color(0xFFFEE2E2),
        ),
        _MobileStat(
          Icons.account_balance_wallet_rounded,
          'Due / Rec.',
          '৳${NumberFormat('#,##0.00').format(w.totalReceivables)}',
          const Color(0xFFF59E0B),
          const Color(0xFFFEF3E6),
        ),
      ];

      return Container(
        height: 44,
        color: Colors.transparent,
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemCount: mobileStats.length,
          separatorBuilder: (_, _) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            child: VerticalDivider(
              color: isDark
                  ? WholesalerColors.border(isDark)
                  : const Color(0xFFDCE4F2),
              width: 1,
              thickness: 1,
            ),
          ),
          itemBuilder: (_, i) =>
              _MobileStatItem(s: mobileStats[i], isDark: isDark),
        ),
      );
    }

    final stats = [
      _StatCardDef(
        label: "TODAY'S SALES",
        value: '৳${NumberFormat('#,##0.00').format(w.todaysSales)}',
        icon: Icons.trending_up_rounded,
      ),
      _StatCardDef(
        label: 'ORDERS',
        value: w.ordersCount.toString(),
        icon: Icons.shopping_bag_outlined,
      ),
      _StatCardDef(
        label: 'DELIVERY',
        value: w.deliveryCount.toString(),
        icon: Icons.local_shipping_outlined,
      ),
      _StatCardDef(
        label: 'CUSTOMERS',
        value: w.customersCount.toString(),
        icon: Icons.people_outline_rounded,
      ),
      _StatCardDef(
        label: 'PENDING ORDERS',
        value: w.pendingOrdersCount.toString(),
        icon: Icons.assignment_outlined,
      ),
      _StatCardDef(
        label: 'LOW STOCK ALERTS',
        value: w.lowStockAlerts.toString(),
        icon: Icons.warning_amber_rounded,
      ),
    ];

    return Row(
      children: [
        for (int i = 0; i < stats.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          Expanded(
            child: _IndividualStatCard(stat: stats[i], isDark: isDark),
          ),
        ],
      ],
    );
  }
}

class _MobileStat {
  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;
  final Color lightBgColor;
  final bool isGreenValue;
  const _MobileStat(
    this.icon,
    this.label,
    this.value,
    this.iconColor,
    this.lightBgColor, {
    this.isGreenValue = false,
  });
}

class _MobileStatItem extends StatelessWidget {
  final _MobileStat s;
  final bool isDark;
  const _MobileStatItem({required this.s, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: isDark
                ? s.iconColor.withValues(alpha: 0.18)
                : s.lightBgColor,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(child: Icon(s.icon, size: 15, color: s.iconColor)),
        ),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              s.value,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: s.isGreenValue
                    ? (isDark
                          ? const Color(0xFF10B981)
                          : const Color(0xFF00B67A))
                    : (isDark ? Colors.white : const Color(0xFF1E293B)),
                height: 1.15,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              s.label,
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w500,
                color: isDark
                    ? const Color(0xFF94A3B8)
                    : const Color(0xFF64748B),
                height: 1.1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatCardDef {
  final String label;
  final String value;
  final IconData icon;
  const _StatCardDef({
    required this.label,
    required this.value,
    required this.icon,
  });
}

class _IndividualStatCard extends StatelessWidget {
  final _StatCardDef stat;
  final bool isDark;
  const _IndividualStatCard({required this.stat, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.softShadow(isDark, elevation: 0.8),
      ),
      child: Row(
        children: [
          // Square icon box (36x36 in #EBF3FE with primary icon)
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: WholesalerColors.surfaceBg(isDark),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Icon(stat.icon, size: 17, color: WholesalerColors.primary),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  stat.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 8.5,
                    fontWeight: FontWeight.w800,
                    color: isDark
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF64748B),
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  stat.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF10213D),
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
