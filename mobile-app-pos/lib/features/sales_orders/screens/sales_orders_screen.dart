import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/models/sales_order_model.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/utils/number_utils.dart';
import '../../../core/widgets/fullscreen_button.dart';
import '../../restaurant_pos/screens/pos_screen.dart';
import '../../pharmacy_pos/screens/pharmacy_pos_screen.dart';
import '../../grocery_pos/screens/grocery_pos_screen.dart';
import '../../wholesaler_pos/screens/wholesaler_pos_screen.dart';
import '../../retail_pos/screens/retail_pos_screen.dart';

class BusinessSalesOrdersScreen extends StatefulWidget {
  final String businessType;

  const BusinessSalesOrdersScreen({
    super.key,
    required this.businessType,
  });

  @override
  State<BusinessSalesOrdersScreen> createState() => _BusinessSalesOrdersScreenState();
}

class _BusinessSalesOrdersScreenState extends State<BusinessSalesOrdersScreen> {
  String _selectedStatus = 'ALL';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();
  bool _isLoading = false;
  List<SalesOrder> _orders = [];

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  @override
  void didUpdateWidget(covariant BusinessSalesOrdersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.businessType != widget.businessType) {
      _loadOrders();
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    try {
      final orders = await ApiService.instance.fetchSalesOrders(
        businessType: widget.businessType,
        search: _searchQuery,
        status: _selectedStatus,
      );
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── THEME PALETTE FOR CURRENT BUSINESS ──────────────────────────────────
  _BusinessTheme _getTheme(String biz) {
    switch (biz.toLowerCase()) {
      case 'restaurant':
        return const _BusinessTheme(
          primary: Color(0xFFFF6D00),
          dark: Color(0xFFE65100),
          icon: Icons.restaurant_rounded,
          titleEn: 'Blue Oceans Restaurant',
          titleBn: 'ব্লু ওশান রেস্তোরাঁ',
          subtitleEn: 'Live Sales Orders & Floor POS',
          subtitleBn: 'লাইভ সেলস অর্ডার ও কিচেন পিওএস',
        );
      case 'pharmacy':
        return const _BusinessTheme(
          primary: Color(0xFF00897B),
          dark: Color(0xFF004D40),
          icon: Icons.local_pharmacy_rounded,
          titleEn: 'Blue Oceans Pharmacy',
          titleBn: 'ব্লু ওশান ফার্মেসি',
          subtitleEn: 'Rx Drug Orders & Dispensing Register',
          subtitleBn: 'প্রেসক্রিপশন অর্ডার ও ড্রাগ কাউন্টার',
        );
      case 'grocery':
        return const _BusinessTheme(
          primary: Color(0xFF22C55E),
          dark: Color(0xFF16A34A),
          icon: Icons.local_grocery_store_rounded,
          titleEn: 'Blue Oceans Grocery',
          titleBn: 'ব্লু ওশান গ্রোসারি',
          subtitleEn: 'Daily Counter Orders & Produce POS',
          subtitleBn: 'দৈনিক কাউন্টার অর্ডার ও কাঁচাবাজার পিওএস',
        );
      case 'wholesale':
      case 'wholesaler':
        return const _BusinessTheme(
          primary: Color(0xFF4F46E5),
          dark: Color(0xFF3730A3),
          icon: Icons.inventory_2_rounded,
          titleEn: 'Blue Oceans Wholesale',
          titleBn: 'ব্লু ওশান হোলসেল',
          subtitleEn: 'B2B Invoices & Bulk Freight Orders',
          subtitleBn: 'বি২বি চালান ও পাইকারি বাল্ক পিওএস',
        );
      case 'retail':
      default:
        return const _BusinessTheme(
          primary: Color(0xFFC62828),
          dark: Color(0xFF8B5CF6),
          icon: Icons.shopping_bag_rounded,
          titleEn: 'Blue Oceans Retail',
          titleBn: 'ব্লু ওশান রিটেইল',
          subtitleEn: 'Store Checkout Orders & Fast POS',
          subtitleBn: 'কাউন্টার চেকআউট অর্ডার ও এক্সপ্রেস পিওএস',
        );
    }
  }

  void _openPosScreen(BuildContext context) {
    Widget target;
    switch (widget.businessType.toLowerCase()) {
      case 'restaurant':
        target = const POSScreen();
        break;
      case 'pharmacy':
        target = const PharmacyPOSScreen();
        break;
      case 'grocery':
        target = const GroceryPOSScreen();
        break;
      case 'wholesaler':
        target = const WholesalerPOSScreen();
        break;
      case 'retail':
      default:
        target = const RetailPOSScreen();
        break;
    }

    Navigator.push(context, MaterialPageRoute(builder: (_) => target));
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final user = appProvider.currentUser;
    final bizTheme = _getTheme(widget.businessType);

    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 720;

    final bgColor = isDark ? const Color(0xFF0F0E11) : const Color(0xFFF6F8FA);
    final cardBg = isDark ? const Color(0xFF1B1A1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2B30) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF1E293B);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final totalVolume = _orders.fold<double>(0, (sum, o) => sum + o.total);
    final completedCount = _orders.where((o) => o.status == 'COMPLETED' || o.status == 'CONFIRMED' || o.status == 'PAID').length;
    final pendingCount = _orders.where((o) => o.status == 'PENDING').length;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── TOP HEADER ──
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: isMobile ? 12 : 24,
                vertical: 12,
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
                  // Multi-business Switcher / Back button
                  if (user != null && user.isMultiBusiness) ...[
                    IconButton(
                      icon: Icon(Icons.apps_rounded, color: bizTheme.primary),
                      tooltip: locale == 'bn' ? 'অন্য ব্যবসা নির্বাচন' : 'Switch Business',
                      onPressed: () => appProvider.clearSelectedBusiness(),
                    ),
                    const SizedBox(width: 4),
                  ],

                  // Brand Icon with gradient badge
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [bizTheme.primary, bizTheme.dark]),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: bizTheme.primary.withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Icon(bizTheme.icon, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),

                  // Title & Subtitle
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                locale == 'bn' ? bizTheme.titleBn : bizTheme.titleEn,
                                style: TextStyle(
                                  fontSize: isMobile ? 15 : 18,
                                  fontWeight: FontWeight.w900,
                                  color: textPrimary,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: bizTheme.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                locale == 'bn' ? 'সেলস অর্ডার' : 'Sales Orders',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: bizTheme.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        Text(
                          locale == 'bn' ? bizTheme.subtitleBn : bizTheme.subtitleEn,
                          style: TextStyle(
                            fontSize: isMobile ? 10.5 : 12,
                            color: textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // ── PROMINENT "LAUNCH POS" BUTTON ──
                  ElevatedButton.icon(
                    onPressed: () => _openPosScreen(context),
                    icon: const Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 18),
                    label: Text(
                      isMobile
                          ? (locale == 'bn' ? 'পিওএস' : 'POS')
                          : (locale == 'bn' ? 'পয়েন্ট অব সেল খুলুন' : 'Open POS Screen'),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                        color: Colors.white,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: bizTheme.primary,
                      padding: EdgeInsets.symmetric(
                        horizontal: isMobile ? 12 : 18,
                        vertical: isMobile ? 8 : 12,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 2,
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

                  // Logout / Profile
                  PopupMenuButton<String>(
                    icon: Icon(Icons.account_circle_rounded, color: textSecondary),
                    color: cardBg,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onSelected: (val) {
                      if (val == 'logout') {
                        appProvider.logout();
                      } else if (val == 'switch') {
                        appProvider.clearSelectedBusiness();
                      }
                    },
                    itemBuilder: (ctx) => [
                      PopupMenuItem(
                        enabled: false,
                        child: Text(
                          user?.name ?? 'Logged in',
                          style: TextStyle(fontWeight: FontWeight.w800, color: textPrimary),
                        ),
                      ),
                      if (user != null && user.isMultiBusiness)
                        PopupMenuItem(
                          value: 'switch',
                          child: Row(
                            children: [
                              const Icon(Icons.swap_horiz_rounded, size: 18),
                              const SizedBox(width: 10),
                              Text(locale == 'bn' ? 'অন্য ব্যবসা নির্বাচন' : 'Switch Business'),
                            ],
                          ),
                        ),
                      const PopupMenuDivider(),
                      PopupMenuItem(
                        value: 'logout',
                        child: Row(
                          children: [
                            const Icon(Icons.logout_rounded, size: 18, color: Colors.red),
                            const SizedBox(width: 10),
                            Text(locale == 'bn' ? 'লগআউট' : 'Logout', style: const TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── BODY ──
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(isMobile ? 12 : 20),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // KPI Mini Summary
                        _OrdersKpiBar(
                          totalOrders: _orders.length,
                          totalVolume: totalVolume,
                          completedCount: completedCount,
                          pendingCount: pendingCount,
                          locale: locale,
                          isDark: isDark,
                          isMobile: isMobile,
                          cardBg: cardBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                          accentColor: bizTheme.primary,
                        ),
                        const SizedBox(height: 16),

                        // Search and Filter Bar
                        _FilterSearchBar(
                          searchCtrl: _searchCtrl,
                          selectedStatus: _selectedStatus,
                          onSearch: (val) {
                            setState(() => _searchQuery = val);
                            _loadOrders();
                          },
                          onStatusChanged: (val) {
                            setState(() => _selectedStatus = val);
                            _loadOrders();
                          },
                          onRefresh: _loadOrders,
                          locale: locale,
                          isDark: isDark,
                          isMobile: isMobile,
                          cardBg: cardBg,
                          borderColor: borderColor,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                          accentColor: bizTheme.primary,
                        ),
                        const SizedBox(height: 16),

                        // Orders Table / List
                        if (_isLoading)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: Center(
                              child: CircularProgressIndicator(color: bizTheme.primary),
                            ),
                          )
                        else if (_orders.isEmpty)
                          _EmptyOrdersView(
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            onOpenPos: () => _openPosScreen(context),
                          )
                        else
                          _OrdersList(
                            orders: _orders,
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            accentColor: bizTheme.primary,
                            onTapOrder: (order) => _showOrderDetailsModal(context, order, bizTheme),
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

  // ── RECEIPT / ORDER DETAILS MODAL ──
  void _showOrderDetailsModal(BuildContext context, SalesOrder order, _BusinessTheme biz) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final locale = context.read<AppProvider>().locale;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(ctx).size.height * 0.85,
            maxWidth: 600,
          ),
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1D22) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: biz.primary.withValues(alpha: 0.1),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.orderNo,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: biz.primary,
                          ),
                        ),
                        Text(
                          '${order.source} • ${order.orderDate.hour.toString().padLeft(2, '0')}:${order.orderDate.minute.toString().padLeft(2, '0')}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),

              // Scrollable Details
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Customer info
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                locale == 'bn' ? 'গ্রাহক' : 'Customer',
                                style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                order.customerName,
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                              if (order.customerPhone.isNotEmpty)
                                Text(order.customerPhone, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                locale == 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status',
                                style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: (order.paymentStatus == 'PAID' ? Colors.green : Colors.orange).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${order.paymentStatus} (${order.paymentMethod})',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: order.paymentStatus == 'PAID' ? Colors.green : Colors.orange,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const Divider(height: 30),

                      // Items List
                      Text(
                        locale == 'bn' ? 'অর্ডার আইটেম তালিকা' : 'Ordered Items',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 10),
                      ...order.items.map((item) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(item.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                                    Text('SKU: ${item.sku} • Qty: ${item.qty}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                              ),
                              Text(
                                NumberUtils.formatCurrency(item.lineTotal, locale),
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),
                        );
                      }),
                      const Divider(height: 30),

                      // Total Summary
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(locale == 'bn' ? 'সাবটোটাল' : 'Subtotal', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                          Text(NumberUtils.formatCurrency(order.subtotal, locale), style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                      if (order.discountTotal > 0) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(locale == 'bn' ? 'ছাড়' : 'Discount', style: const TextStyle(fontSize: 13, color: Colors.green)),
                            Text('- ${NumberUtils.formatCurrency(order.discountTotal, locale)}', style: const TextStyle(fontSize: 13, color: Colors.green)),
                          ],
                        ),
                      ],
                      if (order.taxTotal > 0) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(locale == 'bn' ? 'ভ্যাট / ট্যাক্স' : 'Tax / VAT', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                            Text(NumberUtils.formatCurrency(order.taxTotal, locale), style: const TextStyle(fontSize: 13)),
                          ],
                        ),
                      ],
                      if (order.serviceCharge > 0) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(locale == 'bn' ? 'সার্ভিস চার্জ' : 'Service Charge', style: const TextStyle(fontSize: 13, color: Colors.grey)),
                            Text(NumberUtils.formatCurrency(order.serviceCharge, locale), style: const TextStyle(fontSize: 13)),
                          ],
                        ),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(locale == 'bn' ? 'সর্বমোট' : 'Total Amount', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                          Text(
                            NumberUtils.formatCurrency(order.total, locale),
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: biz.primary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(locale == 'bn' ? 'পরিশোধিত' : 'Paid Amount', style: const TextStyle(fontSize: 13, color: Colors.green, fontWeight: FontWeight.bold)),
                          Text(NumberUtils.formatCurrency(order.paidTotal, locale), style: const TextStyle(fontSize: 13, color: Colors.green, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      if (order.dueTotal > 0) ...[
                        const SizedBox(height: 6),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(locale == 'bn' ? 'বকেয়া' : 'Due Amount', style: const TextStyle(fontSize: 13, color: Colors.red, fontWeight: FontWeight.bold)),
                            Text(NumberUtils.formatCurrency(order.dueTotal, locale), style: const TextStyle(fontSize: 13, color: Colors.red, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Print Action Button
              Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('🖨️ Printing receipt for ${order.orderNo}...'),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                  icon: const Icon(Icons.print_rounded, color: Colors.white),
                  label: Text(locale == 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Sales Receipt', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: biz.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── THEME HELPER ──
class _BusinessTheme {
  final Color primary;
  final Color dark;
  final IconData icon;
  final String titleEn;
  final String titleBn;
  final String subtitleEn;
  final String subtitleBn;

  const _BusinessTheme({
    required this.primary,
    required this.dark,
    required this.icon,
    required this.titleEn,
    required this.titleBn,
    required this.subtitleEn,
    required this.subtitleBn,
  });
}

// ── KPI SUMMARY BAR ──
class _OrdersKpiBar extends StatelessWidget {
  final int totalOrders;
  final double totalVolume;
  final int completedCount;
  final int pendingCount;
  final String locale;
  final bool isDark;
  final bool isMobile;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;
  final Color accentColor;

  const _OrdersKpiBar({
    required this.totalOrders,
    required this.totalVolume,
    required this.completedCount,
    required this.pendingCount,
    required this.locale,
    required this.isDark,
    required this.isMobile,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      {'label': locale == 'bn' ? 'আজকের অর্ডার' : "Today's Orders", 'val': NumberUtils.formatNumber(totalOrders, locale), 'color': accentColor, 'icon': Icons.receipt_long_rounded},
      {'label': locale == 'bn' ? 'মোট বিক্রয়' : 'Sales Volume', 'val': NumberUtils.formatCurrency(totalVolume, locale), 'color': const Color(0xFF10B981), 'icon': Icons.payments_rounded},
      {'label': locale == 'bn' ? 'সম্পন্ন' : 'Completed', 'val': NumberUtils.formatNumber(completedCount, locale), 'color': const Color(0xFF0288D1), 'icon': Icons.check_circle_rounded},
      {'label': locale == 'bn' ? 'পেন্ডিং' : 'Pending', 'val': NumberUtils.formatNumber(pendingCount, locale), 'color': const Color(0xFFF59E0B), 'icon': Icons.hourglass_top_rounded},
    ];

    if (isMobile) {
      return GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 2.1,
        children: items.map((i) => _kpiTile(i)).toList(),
      );
    }

    return Row(
      children: items.map((i) => Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 5), child: _kpiTile(i)))).toList(),
    );
  }

  Widget _kpiTile(Map<String, dynamic> i) {
    final color = i['color'] as Color;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(i['icon'] as IconData, color: color, size: 20),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(i['label'] as String, style: TextStyle(fontSize: 11, color: textSecondary, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(i['val'] as String, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: textPrimary), overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── FILTER AND SEARCH BAR ──
class _FilterSearchBar extends StatelessWidget {
  final TextEditingController searchCtrl;
  final String selectedStatus;
  final ValueChanged<String> onSearch;
  final ValueChanged<String> onStatusChanged;
  final VoidCallback onRefresh;
  final String locale;
  final bool isDark;
  final bool isMobile;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;
  final Color accentColor;

  const _FilterSearchBar({
    required this.searchCtrl,
    required this.selectedStatus,
    required this.onSearch,
    required this.onStatusChanged,
    required this.onRefresh,
    required this.locale,
    required this.isDark,
    required this.isMobile,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final statuses = ['ALL', 'CONFIRMED', 'COMPLETED', 'PENDING', 'CANCELLED'];

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Search input
              Expanded(
                child: TextField(
                  controller: searchCtrl,
                  onChanged: onSearch,
                  style: TextStyle(fontSize: 13, color: textPrimary),
                  decoration: InputDecoration(
                    hintText: locale == 'bn' ? 'অর্ডার নং, কাস্টমার নাম বা ফোন দিয়ে খুঁজুন...' : 'Search by order no, customer name or phone...',
                    hintStyle: TextStyle(fontSize: 12, color: textSecondary),
                    prefixIcon: Icon(Icons.search_rounded, size: 20, color: textSecondary),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    filled: true,
                    fillColor: borderColor.withValues(alpha: 0.35),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Refresh button
              IconButton(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh_rounded),
                tooltip: 'Refresh',
                style: IconButton.styleFrom(
                  backgroundColor: borderColor.withValues(alpha: 0.35),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          // Status chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: statuses.map((st) {
                final isSelected = selectedStatus == st;
                String label = st;
                if (locale == 'bn') {
                  if (st == 'ALL') label = 'সবগুলো';
                  if (st == 'CONFIRMED') label = 'গৃহীত';
                  if (st == 'COMPLETED') label = 'সম্পন্ন';
                  if (st == 'PENDING') label = 'পেন্ডিং';
                  if (st == 'CANCELLED') label = 'বাতিল';
                }

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (_) => onStatusChanged(st),
                    selectedColor: accentColor.withValues(alpha: 0.2),
                    checkmarkColor: accentColor,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? accentColor : textSecondary,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                      side: BorderSide(color: isSelected ? accentColor : borderColor),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

// ── ORDERS LIST ──
class _OrdersList extends StatelessWidget {
  final List<SalesOrder> orders;
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;
  final Color accentColor;
  final ValueChanged<SalesOrder> onTapOrder;

  const _OrdersList({
    required this.orders,
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.accentColor,
    required this.onTapOrder,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: orders.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (ctx, idx) {
        final order = orders[idx];
        final isPaid = order.paymentStatus == 'PAID';
        final statusColor = (order.status == 'COMPLETED' || order.status == 'CONFIRMED' || order.status == 'PAID')
            ? const Color(0xFF10B981)
            : (order.status == 'CANCELLED' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B));

        final timeStr =
            '${order.orderDate.hour.toString().padLeft(2, '0')}:${order.orderDate.minute.toString().padLeft(2, '0')}';

        return InkWell(
          onTap: () => onTapOrder(order),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            child: Row(
              children: [
                // Order No & Icon
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.receipt_rounded, color: accentColor, size: 22),
                ),
                const SizedBox(width: 14),

                // Order details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            order.orderNo,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: textPrimary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              order.status,
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: statusColor),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${order.customerName} • ${order.source} • $timeStr',
                        style: TextStyle(fontSize: 11.5, color: textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),

                // Total Amount & Payment Status
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      NumberUtils.formatCurrency(order.total, locale),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${order.paymentStatus} (${order.paymentMethod})',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: isPaid ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 6),
                Icon(Icons.chevron_right_rounded, color: textSecondary, size: 18),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ── EMPTY STATE ──
class _EmptyOrdersView extends StatelessWidget {
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;
  final VoidCallback onOpenPos;

  const _EmptyOrdersView({
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.onOpenPos,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(40),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Icon(Icons.receipt_long_outlined, size: 48, color: textSecondary),
          const SizedBox(height: 12),
          Text(
            locale == 'bn' ? 'কোন সেলস অর্ডার পাওয়া যায়নি' : 'No sales orders found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: textPrimary),
          ),
          const SizedBox(height: 6),
          Text(
            locale == 'bn' ? 'পিওএস রেজিস্টার থেকে নতুন বিক্রি সম্পন্ন করুন' : 'Create new sales orders from the POS register',
            style: TextStyle(fontSize: 12, color: textSecondary),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onOpenPos,
            icon: const Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 18),
            label: Text(locale == 'bn' ? 'পিওএস ওপেন করুন' : 'Open POS Screen', style: const TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6D00),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }
}
