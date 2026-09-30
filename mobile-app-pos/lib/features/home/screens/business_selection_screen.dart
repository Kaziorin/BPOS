import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/widgets/fullscreen_button.dart';

class BusinessSelectionScreen extends StatelessWidget {
  const BusinessSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final user = appProvider.currentUser;
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;

    final bgColor = isDark ? const Color(0xFF0F0E11) : const Color(0xFFF6F8FA);
    final cardBg = isDark ? const Color(0xFF1B1A1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2B30) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    // List of available business metadata
    final allBiz = [
      {
        'key': 'restaurant',
        'titleEn': 'Restaurant POS & Orders',
        'titleBn': 'রেস্তোরাঁ পিওএস ও অর্ডার',
        'descEn': 'Dine-in, Takeaway, Kitchen & Table Floor Orders',
        'descBn': 'ডাইন-ইন, টেকঅ্যাওয়ে, কিচেন ও টেবিল অর্ডার',
        'color': const Color(0xFFFF6D00),
        'icon': Icons.restaurant_rounded,
      },
      {
        'key': 'pharmacy',
        'titleEn': 'Pharmacy POS & Rx Orders',
        'titleBn': 'ফার্মেসি পিওএস ও প্রেসক্রিপশন',
        'descEn': 'Prescriptions, Drug Batches & Medicine Sales',
        'descBn': 'প্রেসক্রিপশন, ড্রাগ ব্যাচ ও ওষুধ বিক্রয়',
        'color': const Color(0xFF00897B),
        'icon': Icons.local_pharmacy_rounded,
      },
      {
        'key': 'grocery',
        'titleEn': 'Grocery & FreshMart',
        'titleBn': 'গ্রোসারি ও কাঁচাবাজার',
        'descEn': 'Daily Staples, Produce Scaling & Grocery Orders',
        'descBn': 'নিত্যপ্রয়োজনীয় পণ্য, শাকসবজি ও মুদি অর্ডার',
        'color': const Color(0xFF22C55E),
        'icon': Icons.local_grocery_store_rounded,
      },
      {
        'key': 'wholesaler',
        'titleEn': 'TradeMax Wholesaler',
        'titleBn': 'ট্রেডম্যাক্স পাইকারি',
        'descEn': 'B2B Invoices, Bulk Cargo & Dealer Ledger',
        'descBn': 'বি২বি চালান, বাল্ক কার্গো ও ডিলার লেজার',
        'color': const Color(0xFF4F46E5),
        'icon': Icons.inventory_2_rounded,
      },
      {
        'key': 'retail',
        'titleEn': 'Retail & Superstore',
        'titleBn': 'রিটেইল ও সুপারস্টোর',
        'descEn': 'General Merchandise, Cash Drawer & Retail Counter',
        'descBn': 'সাধারণ পণ্য, ক্যাশ ড্রয়ার ও সুপারস্টোর কাউন্টার',
        'color': const Color(0xFFC62828),
        'icon': Icons.shopping_bag_rounded,
      },
    ];

    // Filter to show ONLY the businesses authorized for this user account!
    final authorizedKeys = user?.businessTypes ?? ['restaurant'];
    final userBusinesses = allBiz.where((b) {
      final key = b['key'] as String;
      return authorizedKeys.contains(key) || authorizedKeys.contains('all');
    }).toList();

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── TOP BAR ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                color: cardBg,
                border: Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF146EF5).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.business_center_rounded, color: Color(0xFF146EF5), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          locale == 'bn' ? 'আপনার ব্যবসা নির্বাচন করুন' : 'Select Active Business',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: textPrimary,
                          ),
                        ),
                        Text(
                          user != null
                              ? '${user.name} • ${user.role} (${user.tenantName})'
                              : 'Blue Ocean POS Enterprise',
                          style: TextStyle(fontSize: 12, color: textSecondary),
                        ),
                      ],
                    ),
                  ),
                  FullscreenButton(iconColor: textSecondary, iconSize: 20),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: Icon(isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, color: textSecondary),
                    onPressed: () => appProvider.toggleTheme(),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.logout_rounded, color: Colors.red),
                    tooltip: 'Logout',
                    onPressed: () => appProvider.logout(),
                  ),
                ],
              ),
            ),

            // ── BUSINESS CARDS GRID ──
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1000),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          locale == 'bn'
                              ? 'আপনার অ্যাকাউন্টে যুক্ত অনুমোদিত ব্যবসাসমূহ:'
                              : 'Authorized Businesses in your Account:',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textSecondary),
                        ),
                        const SizedBox(height: 16),
                        Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: userBusinesses.map((biz) {
                            final color = biz['color'] as Color;
                            final key = biz['key'] as String;
                            final title = locale == 'bn' ? (biz['titleBn'] as String) : (biz['titleEn'] as String);
                            final desc = locale == 'bn' ? (biz['descBn'] as String) : (biz['descEn'] as String);

                            return SizedBox(
                              width: 300,
                              child: InkWell(
                                onTap: () {
                                  // Set this as the active business
                                  appProvider.selectBusiness(key);
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: BoxDecoration(
                                    color: cardBg,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: color.withValues(alpha: 0.3)),
                                    boxShadow: [
                                      BoxShadow(
                                        color: color.withValues(alpha: 0.08),
                                        blurRadius: 16,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: color.withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Icon(biz['icon'] as IconData, color: color, size: 28),
                                          ),
                                          Icon(Icons.arrow_forward_rounded, color: color, size: 20),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      Text(
                                        title,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          color: textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        desc,
                                        style: TextStyle(fontSize: 12, color: textSecondary, height: 1.4),
                                      ),
                                      const SizedBox(height: 16),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: color.withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          locale == 'bn' ? 'অর্ডার ও পিওএস খুলুন' : 'Open Orders & POS',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                            color: color,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
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
