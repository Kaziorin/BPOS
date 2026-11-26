import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';

class BusinessSelectionScreen extends StatelessWidget {
  const BusinessSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final user = appProvider.currentUser;
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;

    final bgColor = isDark ? const Color(0xFF071322) : const Color(0xFFF2F8FF);
    final cardBg = isDark ? const Color(0xFF0F2036) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF1E3A5F)
        : const Color(0xFFBAE6FD);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF475569);

    const oceanDeep = Color(0xFF0369A1);
    const oceanPrimary = Color(0xFF0284C7);
    const oceanMid = Color(0xFF0EA5E9);
    const oceanAccent = Color(0xFF38BDF8);

    final allBiz = [
      {
        'key': 'restaurant',
        'titleEn': 'Restaurant POS & Orders',
        'titleBn': 'রেস্তোরাঁ পিওএস ও অর্ডার',
        'descEn': 'Dine-in tables, Kitchen KOT & floor order management',
        'descBn': 'ডাইন-ইন, টেকঅ্যাওয়ে, কিচেন ও টেবিল অর্ডার',
        'badgeEn': 'Dine-In & KOT',
        'badgeBn': 'ডাইন-ইন ও KOT',
        'color': const Color(0xFFEA580C),
        'icon': Icons.restaurant_rounded,
      },
      {
        'key': 'pharmacy',
        'titleEn': 'Pharmacy POS & Rx Orders',
        'titleBn': 'ফার্মেসি পিওএস ও প্রেসক্রিপশন',
        'descEn': 'Prescriptions, FEFO drug batches & expiry tracking',
        'descBn': 'প্রেসক্রিপশন, ড্রাগ ব্যাচ ও ওষুধ বিক্রয়',
        'badgeEn': 'Rx & FEFO',
        'badgeBn': 'Rx ও ব্যাচ',
        'color': const Color(0xFF0891B2),
        'icon': Icons.local_pharmacy_rounded,
      },
      {
        'key': 'grocery',
        'titleEn': 'Grocery & FreshMart',
        'titleBn': 'গ্রোসারি ও কাঁচাবাজার',
        'descEn': 'Daily staples, produce weight scaling & rapid carts',
        'descBn': 'নিত্যপ্রয়োজনীয় পণ্য, শাকসবজি ও মুদি অর্ডার',
        'badgeEn': 'Fast Checkout',
        'badgeBn': 'দ্রুত বিলিং',
        'color': const Color(0xFF059669),
        'icon': Icons.local_grocery_store_rounded,
      },
      {
        'key': 'wholesaler',
        'titleEn': 'TradeMax Wholesaler',
        'titleBn': 'ট্রেডম্যাক্স পাইকারি',
        'descEn': 'B2B dealer invoices, carton tiers & credit ledger',
        'descBn': 'বি২বি চালান, বাল্ক কার্গো ও ডিলার লেজার',
        'badgeEn': 'B2B & Bulk',
        'badgeBn': 'বি২বি ও বাল্ক',
        'color': const Color(0xFF0052CC),
        'icon': Icons.inventory_2_rounded,
      },
      {
        'key': 'retail',
        'titleEn': 'Retail & Superstore',
        'titleBn': 'রিটেইল ও সুপারস্টোর',
        'descEn': 'Barcode counter, variants, cash drawer & receipts',
        'descBn': 'সাধারণ পণ্য, ক্যাশ ড্রয়ার ও সুপারস্টোর কাউন্টার',
        'badgeEn': 'Retail Counter',
        'badgeBn': 'রিটেইল কাউন্টার',
        'color': oceanPrimary,
        'icon': Icons.shopping_bag_rounded,
      },
    ];

    final authorizedKeys = user?.businessTypes ?? ['restaurant'];
    final userBusinesses = allBiz.where((b) {
      final key = b['key'] as String;
      return authorizedKeys.contains(key) || authorizedKeys.contains('all');
    }).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: Column(
        children: [
          // ── SALEPAY OCEAN WAVE HEADER ──
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [const Color(0xFF082F49), oceanDeep, oceanPrimary]
                    : [oceanDeep, oceanPrimary, oceanMid, oceanAccent],
              ),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(28),
                bottomRight: Radius.circular(28),
              ),
              boxShadow: [
                BoxShadow(
                  color: oceanPrimary.withValues(alpha: 0.28),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned.fill(
                  child: ClipRRect(
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(28),
                      bottomRight: Radius.circular(28),
                    ),
                    child: CustomPaint(painter: _OceanWaveHeaderPainter()),
                  ),
                ),
                SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Top Row: SalePay White Logo + Glass Action Buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Align(
                                alignment: Alignment.centerLeft,
                                child: Image.asset(
                                  'assets/images/salepay-logo-white.png',
                                  height: 30,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, _, _) => const Text(
                                    'SalePay Enterprise',
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: Colors.white,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                _HeaderGlassButton(
                                  child: IconButton(
                                    constraints: const BoxConstraints(
                                      minWidth: 36,
                                      minHeight: 36,
                                    ),
                                    padding: EdgeInsets.zero,
                                    icon: Icon(
                                      isDark
                                          ? Icons.light_mode_rounded
                                          : Icons.dark_mode_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    onPressed: () => appProvider.toggleTheme(),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                _HeaderGlassButton(
                                  bgColor: Colors.redAccent.withValues(
                                    alpha: 0.28,
                                  ),
                                  child: IconButton(
                                    constraints: const BoxConstraints(
                                      minWidth: 36,
                                      minHeight: 36,
                                    ),
                                    padding: EdgeInsets.zero,
                                    icon: const Icon(
                                      Icons.logout_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    tooltip: 'Logout',
                                    onPressed: () => appProvider.logout(),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Text(
                          locale == 'bn'
                              ? 'আপনার সক্রিয় পিওএস টার্মিনাল বেছে নিন'
                              : 'Select Active Business Terminal',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.16),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.25),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.verified_user_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  user != null
                                      ? '${user.name} • ${user.role} (${user.tenantName})'
                                      : 'SalePay Enterprise',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── RESPONSIVE BUSINESS TERMINAL CARDS ──
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1080),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              locale == 'bn'
                                  ? 'অনুমোদিত পিওএস টার্মিনাল'
                                  : 'Authorized POS Terminals',
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: isDark
                                    ? const Color(0xFFBAE6FD)
                                    : oceanDeep,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: oceanPrimary.withValues(alpha: 0.10),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: oceanMid.withValues(alpha: 0.25),
                                ),
                              ),
                              child: Text(
                                '${userBusinesses.length} ${locale == 'bn' ? 'টি সক্রিয়' : 'Active'}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: oceanPrimary,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final w = constraints.maxWidth;
                          final cols = w >= 900 ? 3 : (w >= 580 ? 2 : 1);
                          const spacing = 14.0;
                          final cardWidth = (w - spacing * (cols - 1)) / cols;

                          return Wrap(
                            spacing: spacing,
                            runSpacing: spacing,
                            children: userBusinesses.map((biz) {
                              final color = biz['color'] as Color;
                              final key = biz['key'] as String;
                              final title = locale == 'bn'
                                  ? (biz['titleBn'] as String)
                                  : (biz['titleEn'] as String);
                              final desc = locale == 'bn'
                                  ? (biz['descBn'] as String)
                                  : (biz['descEn'] as String);
                              final badge = locale == 'bn'
                                  ? (biz['badgeBn'] as String)
                                  : (biz['badgeEn'] as String);

                              return SizedBox(
                                width: cardWidth,
                                child: Material(
                                  color: cardBg,
                                  borderRadius: BorderRadius.circular(18),
                                  child: InkWell(
                                    onTap: () =>
                                        appProvider.selectBusiness(key),
                                    borderRadius: BorderRadius.circular(18),
                                    child: Container(
                                      padding: const EdgeInsets.all(18),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(18),
                                        border: Border.all(
                                          color: borderColor,
                                          width: 1.2,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: oceanPrimary.withValues(
                                              alpha: isDark ? 0.18 : 0.08,
                                            ),
                                            blurRadius: 20,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceBetween,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.all(
                                                  11,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: color.withValues(
                                                    alpha: 0.12,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(12),
                                                  border: Border.all(
                                                    color: color.withValues(
                                                      alpha: 0.22,
                                                    ),
                                                  ),
                                                ),
                                                child: Icon(
                                                  biz['icon'] as IconData,
                                                  color: color,
                                                  size: 24,
                                                ),
                                              ),
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 10,
                                                      vertical: 4,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: isDark
                                                      ? Colors.white.withValues(
                                                          alpha: 0.07,
                                                        )
                                                      : const Color(0xFFF0F9FF),
                                                  borderRadius:
                                                      BorderRadius.circular(20),
                                                  border: Border.all(
                                                    color: isDark
                                                        ? Colors.white
                                                              .withValues(
                                                                alpha: 0.12,
                                                              )
                                                        : const Color(
                                                            0xFFBAE6FD,
                                                          ),
                                                  ),
                                                ),
                                                child: Text(
                                                  badge,
                                                  style: TextStyle(
                                                    fontSize: 10.5,
                                                    fontWeight: FontWeight.w800,
                                                    color: isDark
                                                        ? oceanAccent
                                                        : oceanDeep,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 14),
                                          Text(
                                            title,
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w900,
                                              color: textPrimary,
                                              letterSpacing: -0.2,
                                            ),
                                          ),
                                          const SizedBox(height: 5),
                                          Text(
                                            desc,
                                            style: TextStyle(
                                              fontSize: 12.5,
                                              color: textSecondary,
                                              height: 1.4,
                                            ),
                                          ),
                                          const SizedBox(height: 16),
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 11,
                                              horizontal: 14,
                                            ),
                                            decoration: BoxDecoration(
                                              gradient: const LinearGradient(
                                                colors: [
                                                  oceanPrimary,
                                                  oceanMid,
                                                  oceanAccent,
                                                ],
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: oceanPrimary
                                                      .withValues(alpha: 0.25),
                                                  blurRadius: 10,
                                                  offset: const Offset(0, 4),
                                                ),
                                              ],
                                            ),
                                            child: Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment.center,
                                              children: [
                                                Text(
                                                  locale == 'bn'
                                                      ? 'পিওএস টার্মিনাল খুলুন'
                                                      : 'Open POS Terminal',
                                                  style: const TextStyle(
                                                    fontSize: 12.5,
                                                    fontWeight: FontWeight.w800,
                                                    color: Colors.white,
                                                  ),
                                                ),
                                                const SizedBox(width: 6),
                                                const Icon(
                                                  Icons.arrow_forward_rounded,
                                                  color: Colors.white,
                                                  size: 16,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderGlassButton extends StatelessWidget {
  final Widget child;
  final Color? bgColor;

  const _HeaderGlassButton({required this.child, this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: bgColor ?? Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
      ),
      child: Center(child: child),
    );
  }
}

class _OceanWaveHeaderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint1 = Paint()
      ..color = Colors.white.withValues(alpha: 0.10)
      ..style = PaintingStyle.fill;
    final paint2 = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..style = PaintingStyle.fill;

    final path1 = Path()
      ..moveTo(0, size.height * 0.65)
      ..quadraticBezierTo(
        size.width * 0.35,
        size.height * 0.35,
        size.width * 0.68,
        size.height * 0.72,
      )
      ..quadraticBezierTo(
        size.width * 0.88,
        size.height * 0.90,
        size.width,
        size.height * 0.55,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    final path2 = Path()
      ..moveTo(0, size.height * 0.80)
      ..quadraticBezierTo(
        size.width * 0.30,
        size.height * 0.98,
        size.width * 0.65,
        size.height * 0.62,
      )
      ..quadraticBezierTo(
        size.width * 0.85,
        size.height * 0.42,
        size.width,
        size.height * 0.72,
      )
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(path1, paint1);
    canvas.drawPath(path2, paint2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
