import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
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
import '../utils/sales_orders_export.dart';

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
        limit: 100,
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

  // ── CSV EXPORT ──
  void _exportOrdersCsv(BuildContext context, String locale) {
    if (_orders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            locale == 'bn'
                ? 'রপ্তানি করার মতো কোন অর্ডার পাওয়া যায়নি'
                : 'No sales orders available to export',
          ),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
      return;
    }

    final headers = [
      'Order No',
      'Source',
      'Customer',
      'Phone',
      'Total (Tk)',
      'Paid (Tk)',
      'Due (Tk)',
      'Status',
      'Date',
      'Time'
    ];

    final rows = _orders.map((o) {
      final dateStr =
          '${o.orderDate.year}-${o.orderDate.month.toString().padLeft(2, '0')}-${o.orderDate.day.toString().padLeft(2, '0')}';
      final timeStr =
          '${o.orderDate.hour.toString().padLeft(2, '0')}:${o.orderDate.minute.toString().padLeft(2, '0')}';
      return [
        '"${o.orderNo}"',
        '"${o.source}"',
        '"${o.customerName.replaceAll('"', '""')}"',
        '"${o.customerPhone}"',
        o.total.toStringAsFixed(2),
        o.paidTotal.toStringAsFixed(2),
        o.dueTotal.toStringAsFixed(2),
        o.status,
        '"$dateStr"',
        '"$timeStr"',
      ];
    });

    final csvContent = '${headers.join(',')}\n${rows.map((r) => r.join(',')).join('\n')}';
    final fileName = 'sales_orders_${DateTime.now().toIso8601String().substring(0, 10)}.csv';

    exportCsvFile(csvContent, fileName);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                locale == 'bn'
                    ? 'CSV ডাউনলোড সম্পন্ন হয়েছে ($fileName)'
                    : 'Sales orders exported successfully ($fileName)',
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 3),
      ),
    );
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
          subtitleEn: 'Rx Drug Orders & Dispensing',
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
    final isMobile = width < 860;

    final bgColor = isDark ? const Color(0xFF0B0A0D) : const Color(0xFFF8FAFC);
    final cardBg = isDark ? const Color(0xFF16151A) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27262D) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    // KPI Metrics calculation
    final totalOrdersCount = _orders.length;
    final todayOrdersCount = _orders.where((o) => o.isToday).length;
    final totalVolume = _orders.fold<double>(0, (sum, o) => sum + o.total);
    final completedCount = _orders.where((o) =>
        o.status == 'COMPLETED' ||
        o.status == 'CONFIRMED' ||
        o.status == 'PAID' ||
        o.status == 'DELIVERED').length;
    final pendingCount = _orders.where((o) =>
        o.status == 'PENDING' ||
        o.status == 'PICKING' ||
        o.status == 'STOCK_RESERVED').length;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            if (constraints.maxHeight < 200 || constraints.maxWidth < 200) {
              return const SizedBox.shrink();
            }
            return Column(
              children: [
                // ── TOP HEADER ──
                _buildTopHeader(
              context: context,
              user: user,
              appProvider: appProvider,
              bizTheme: bizTheme,
              locale: locale,
              isDark: isDark,
              isMobile: isMobile,
              cardBg: cardBg,
              borderColor: borderColor,
              textPrimary: textPrimary,
              textSecondary: textSecondary,
            ),

            // ── BODY ──
            Expanded(
              child: RefreshIndicator(
                color: bizTheme.primary,
                backgroundColor: cardBg,
                onRefresh: () async => _loadOrders(),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 12 : 28,
                    vertical: isMobile ? 12 : 18,
                  ),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 1800),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ── BREADCRUMB / ACTION ROW ──
                        _buildBreadcrumbAndActions(
                          context: context,
                          locale: locale,
                          isDark: isDark,
                          isMobile: isMobile,
                          textPrimary: textPrimary,
                          textSecondary: textSecondary,
                          bizTheme: bizTheme,
                          borderColor: borderColor,
                          cardBg: cardBg,
                        ),
                        SizedBox(height: isMobile ? 12 : 18),

                        // ── KPI METRICS BAR (5 CARDS WITH TOTAL & TODAY) ──
                        _OrdersKpiBar(
                          totalOrders: totalOrdersCount,
                          todayOrders: todayOrdersCount,
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
                        SizedBox(height: isMobile ? 12 : 16),

                        // ── SEARCH & STATUS FILTER BAR ──
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
                        SizedBox(height: isMobile ? 12 : 16),

                        // ── ORDERS DATA TABLE / CARD LIST ──
                        if (_isLoading)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(color: bizTheme.primary, strokeWidth: 3),
                                  const SizedBox(height: 12),
                                  Text(
                                    locale == 'bn' ? 'অর্ডার তালিকা লোড হচ্ছে...' : 'Loading sales orders...',
                                    style: TextStyle(color: textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ),
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
                        else if (isMobile)
                          _OrdersCardList(
                            orders: _orders,
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            accentColor: bizTheme.primary,
                            onViewDetails: (order) => _showOrderDetailsModal(context, order, bizTheme),
                            onPrintReceipt: (order) => _showReceiptPrintModal(context, order, bizTheme),
                          )
                        else
                          _OrdersTableView(
                            orders: _orders,
                            locale: locale,
                            isDark: isDark,
                            cardBg: cardBg,
                            borderColor: borderColor,
                            textPrimary: textPrimary,
                            textSecondary: textSecondary,
                            accentColor: bizTheme.primary,
                            onViewDetails: (order) => _showOrderDetailsModal(context, order, bizTheme),
                            onPrintReceipt: (order) => _showReceiptPrintModal(context, order, bizTheme),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      );
    },
  ),
),
);
}

  // ── TOP HEADER ──
  Widget _buildTopHeader({
    required BuildContext context,
    required dynamic user,
    required AppProvider appProvider,
    required _BusinessTheme bizTheme,
    required String locale,
    required bool isDark,
    required bool isMobile,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 12 : 24,
        vertical: isMobile ? 8 : 12,
      ),
      decoration: BoxDecoration(
        color: cardBg,
        border: Border(bottom: BorderSide(color: borderColor)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Back button on web/desktop view (only shown if there is a previous route)
          if (!isMobile && (ModalRoute.of(context)?.canPop ?? false)) ...[
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
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E1D24) : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: borderColor),
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
                    size: 20,
                    color: textPrimary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
          ],

          // Switch business if multi-business
          if (user != null && user.isMultiBusiness) ...[
            IconButton(
              icon: Icon(Icons.apps_rounded, color: bizTheme.primary, size: isMobile ? 20 : 22),
              tooltip: locale == 'bn' ? 'অন্য ব্যবসা নির্বাচন' : 'Switch Business',
              padding: EdgeInsets.zero,
              constraints: BoxConstraints(minWidth: isMobile ? 32 : 40, minHeight: isMobile ? 32 : 40),
              onPressed: () => appProvider.clearSelectedBusiness(),
            ),
            const SizedBox(width: 2),
          ],

          // Brand Icon Badge
          Container(
            padding: EdgeInsets.all(isMobile ? 7 : 9),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [bizTheme.primary, bizTheme.dark]),
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: bizTheme.primary.withValues(alpha: 0.3),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(bizTheme.icon, color: Colors.white, size: isMobile ? 18 : 20),
          ),
          const SizedBox(width: 10),

          // Business Titles
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  locale == 'bn' ? bizTheme.titleBn : bizTheme.titleEn,
                  style: TextStyle(
                    fontSize: isMobile ? 13.5 : 17,
                    fontWeight: FontWeight.w900,
                    color: textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  locale == 'bn' ? 'সেলস অর্ডার রেজিস্টার' : 'Sales Orders Register',
                  style: TextStyle(
                    fontSize: isMobile ? 10 : 11.5,
                    color: bizTheme.primary,
                    fontWeight: FontWeight.w700,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // ── PREMIUM POS REGISTER BUTTON ──
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _openPosScreen(context),
              borderRadius: BorderRadius.circular(9),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [bizTheme.primary, bizTheme.dark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(9),
                  boxShadow: [
                    BoxShadow(
                      color: bizTheme.primary.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 12 : 16,
                  vertical: isMobile ? 7 : 9,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.point_of_sale_rounded,
                      color: Colors.white,
                      size: isMobile ? 15 : 17,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isMobile
                          ? (locale == 'bn' ? 'পিওএস' : 'POS')
                          : (locale == 'bn' ? 'পয়েন্ট অব সেল' : 'POS Register'),
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: isMobile ? 12 : 13,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(width: 6),

          // Fullscreen Button (desktop only)
          if (!isMobile) ...[
            Container(
              height: 36,
              width: 36,
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(9),
                border: Border.all(color: borderColor),
              ),
              child: FullscreenButton(
                iconColor: textSecondary,
                iconSize: 18,
                padding: const EdgeInsets.all(6),
                borderRadius: BorderRadius.circular(9),
              ),
            ),
            const SizedBox(width: 6),
          ],

          // ── THEME TOGGLE (IN SLEEK MATCHING CONTAINER) ──
          Container(
            height: isMobile ? 32 : 36,
            width: isMobile ? 32 : 36,
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(9),
              border: Border.all(color: borderColor),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: IconButton(
              icon: Icon(
                isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                color: isDark ? const Color(0xFFFBBF24) : textSecondary,
                size: isMobile ? 17 : 19,
              ),
              padding: EdgeInsets.zero,
              onPressed: () => appProvider.toggleTheme(),
              tooltip: AppStrings.get(isDark ? 'light_mode' : 'dark_mode', locale),
            ),
          ),

          const SizedBox(width: 6),

          // ── USER PROFILE / MENU ──
          Container(
            height: isMobile ? 32 : 36,
            width: isMobile ? 32 : 36,
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(9),
              border: Border.all(color: borderColor),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: PopupMenuButton<String>(
              icon: Icon(Icons.account_circle_rounded, color: textSecondary, size: isMobile ? 19 : 21),
              color: cardBg,
              padding: EdgeInsets.zero,
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
                    user?.name ?? 'User',
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
          ),
        ],
      ),
    );
  }

  // ── BREADCRUMB & HEADER ACTIONS ROW ──
  Widget _buildBreadcrumbAndActions({
    required BuildContext context,
    required String locale,
    required bool isDark,
    required bool isMobile,
    required Color textPrimary,
    required Color textSecondary,
    required _BusinessTheme bizTheme,
    required Color borderColor,
    required Color cardBg,
  }) {
    if (isMobile) {
      // Sleek mobile view action header
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    locale == 'bn' ? 'অর্ডার তালিকা' : 'Orders List',
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w900,
                      color: textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: bizTheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    NumberUtils.formatNumber(_orders.length, locale),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: bizTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Row(
            children: [
              // Modern Mobile Export CSV Button
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => _exportOrdersCsv(context, locale),
                  borderRadius: BorderRadius.circular(9),
                  child: Ink(
                    height: 32,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: borderColor, width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.download_rounded, size: 15, color: bizTheme.primary),
                        const SizedBox(width: 5),
                        Text(
                          locale == 'bn' ? 'সিএসভি' : 'Export CSV',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              // Modern Mobile Refresh Button
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _loadOrders,
                  borderRadius: BorderRadius.circular(9),
                  child: Ink(
                    height: 32,
                    width: 32,
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: borderColor, width: 1.2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Icon(Icons.refresh_rounded, size: 16, color: textSecondary),
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    }

    // Desktop Breadcrumbs
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(Icons.home_outlined, size: 16, color: textSecondary),
            const SizedBox(width: 6),
            Text(
              locale == 'bn' ? 'হোম' : 'Home',
              style: TextStyle(fontSize: 12.5, color: textSecondary, fontWeight: FontWeight.w500),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text('/', style: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.5))),
            ),
            Text(
              locale == 'bn' ? 'সেলস' : 'Sales',
              style: TextStyle(fontSize: 12.5, color: textSecondary, fontWeight: FontWeight.w500),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text('/', style: TextStyle(fontSize: 12, color: textSecondary.withValues(alpha: 0.5))),
            ),
            Text(
              locale == 'bn' ? 'অর্ডার সমূহ' : 'Orders',
              style: TextStyle(fontSize: 12.5, color: textPrimary, fontWeight: FontWeight.w700),
            ),
          ],
        ),
        Row(
          children: [
            // Modern Desktop Export CSV Button
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _exportOrdersCsv(context, locale),
                borderRadius: BorderRadius.circular(9),
                child: Ink(
                  height: 36,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: borderColor, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                        blurRadius: 4,
                        offset: const Offset(0, 1.5),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.download_rounded, size: 16, color: bizTheme.primary),
                      const SizedBox(width: 7),
                      Text(
                        locale == 'bn' ? 'সিএসভি এক্সপোর্ট' : 'Export CSV',
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Modern Desktop Refresh Button
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _loadOrders,
                borderRadius: BorderRadius.circular(9),
                child: Ink(
                  height: 36,
                  width: 36,
                  decoration: BoxDecoration(
                    color: cardBg,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: borderColor, width: 1.2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                        blurRadius: 4,
                        offset: const Offset(0, 1.5),
                      ),
                    ],
                  ),
                  child: Icon(Icons.refresh_rounded, size: 18, color: textSecondary),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }



  // ── ORDER DETAILS MODAL ──
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
            maxHeight: MediaQuery.of(ctx).size.height * 0.88,
            maxWidth: 720,
          ),
          margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1D22) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 28,
                offset: const Offset(0, 10),
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
                  color: biz.primary.withValues(alpha: 0.08),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  border: Border(
                    bottom: BorderSide(color: isDark ? const Color(0xFF2C2B30) : const Color(0xFFE2E8F0)),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: biz.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.receipt_rounded, color: biz.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order.orderNo,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: biz.primary,
                              ),
                            ),
                            Text(
                              '${order.source} • ${order.orderDate.day.toString().padLeft(2, '0')}/${order.orderDate.month.toString().padLeft(2, '0')}/${order.orderDate.year} ${order.orderDate.hour.toString().padLeft(2, '0')}:${order.orderDate.minute.toString().padLeft(2, '0')}',
                              style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500),
                            ),
                          ],
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
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Customer and Payment summary
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.03),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isDark ? const Color(0xFF2C2B30) : const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  locale == 'bn' ? 'গ্রাহকের তথ্য' : 'Customer Info',
                                  style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  order.customerName,
                                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                                ),
                                if (order.customerPhone.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(order.customerPhone, style: const TextStyle(fontSize: 11.5, color: Colors.grey)),
                                ],
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  locale == 'bn' ? 'পেমেন্ট ও স্ট্যাটাস' : 'Payment & Status',
                                  style: const TextStyle(fontSize: 10.5, color: Colors.grey, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 3),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (order.paymentStatus == 'PAID' ? Colors.green : Colors.orange)
                                        .withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    '${order.paymentStatus} (${order.paymentMethod})',
                                    style: TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      color: order.paymentStatus == 'PAID' ? Colors.green : Colors.orange,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Items list header
                      Text(
                        locale == 'bn' ? 'অর্ডার আইটেম তালিকা' : 'Ordered Line Items',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 8),

                      // Table of items
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: isDark ? const Color(0xFF2C2B30) : const Color(0xFFE2E8F0)),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.04),
                                borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    flex: 3,
                                    child: Text(
                                      locale == 'bn' ? 'পণ্য' : 'Item',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      locale == 'bn' ? 'পরিমাণ' : 'Qty',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      locale == 'bn' ? 'দর' : 'Rate',
                                      textAlign: TextAlign.right,
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      locale == 'bn' ? 'মোট' : 'Total',
                                      textAlign: TextAlign.right,
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            ...order.items.map((item) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 3,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            item.name,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                          ),
                                          Text(
                                            'SKU: ${item.sku}',
                                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Expanded(
                                      child: Text(
                                        NumberUtils.formatNumber(item.qty, locale),
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    Expanded(
                                      child: Text(
                                        NumberUtils.formatCurrency(item.unitPrice, locale),
                                        textAlign: TextAlign.right,
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                                      ),
                                    ),
                                    Expanded(
                                      child: Text(
                                        NumberUtils.formatCurrency(item.lineTotal, locale),
                                        textAlign: TextAlign.right,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Calculations Breakdown
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.02),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isDark ? const Color(0xFF2C2B30) : const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(locale == 'bn' ? 'সাবটোটাল' : 'Subtotal', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                Text(NumberUtils.formatCurrency(order.subtotal, locale), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                            if (order.discountTotal > 0) ...[
                              const SizedBox(height: 5),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(locale == 'bn' ? 'ছাড়' : 'Discount', style: const TextStyle(fontSize: 12, color: Colors.green)),
                                  Text('- ${NumberUtils.formatCurrency(order.discountTotal, locale)}', style: const TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.w700)),
                                ],
                              ),
                            ],
                            if (order.taxTotal > 0) ...[
                              const SizedBox(height: 5),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(locale == 'bn' ? 'ভ্যাট / ট্যাক্স' : 'Tax / VAT', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  Text(NumberUtils.formatCurrency(order.taxTotal, locale), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                            if (order.serviceCharge > 0) ...[
                              const SizedBox(height: 5),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(locale == 'bn' ? 'সার্ভিস চার্জ' : 'Service Charge', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                  Text(NumberUtils.formatCurrency(order.serviceCharge, locale), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ],
                            const Divider(height: 18),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(locale == 'bn' ? 'সর্বমোট' : 'Total Amount', style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900)),
                                Text(
                                  NumberUtils.formatCurrency(order.total, locale),
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: biz.primary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(locale == 'bn' ? 'পরিশোধিত' : 'Paid Amount', style: const TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold)),
                                Text(NumberUtils.formatCurrency(order.paidTotal, locale), style: const TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold)),
                              ],
                            ),
                            if (order.dueTotal > 0) ...[
                              const SizedBox(height: 5),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(locale == 'bn' ? 'বকেয়া' : 'Due Amount', style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold)),
                                  Text(NumberUtils.formatCurrency(order.dueTotal, locale), style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Bottom Actions: Print Receipt
              Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showReceiptPrintModal(context, order, biz);
                  },
                  icon: const Icon(Icons.print_rounded, color: Colors.white, size: 17),
                  label: Text(
                    locale == 'bn' ? 'রসিদ প্রিভিউ ও প্রিন্ট' : 'Print Sales Receipt',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: biz.primary,
                    padding: const EdgeInsets.symmetric(vertical: 13),
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

  // ── RECEIPT VIEW & PRINT MODAL (Pixel-Perfect Matching POS Thermal Receipt) ──
  void _showReceiptPrintModal(BuildContext context, SalesOrder order, _BusinessTheme biz) {
    final isDark = context.read<AppProvider>().isDarkMode;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => _SalesOrderReceiptModal(
        order: order,
        biz: biz,
        isDark: isDark,
        businessType: widget.businessType,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SALES ORDER THERMAL RECEIPT MODAL (80mm - Pixel-perfect matching POS screen)
// ─────────────────────────────────────────────────────────────────────────────
class _SalesOrderReceiptModal extends StatelessWidget {
  final SalesOrder order;
  final _BusinessTheme biz;
  final bool isDark;
  final String businessType;

  const _SalesOrderReceiptModal({
    required this.order,
    required this.biz,
    required this.isDark,
    required this.businessType,
  });

  String _formatDate(DateTime dt) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    final m = months[dt.month];
    final hr = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} $m ${dt.year}, $hr:$min';
  }

  Widget _buildDashedDivider() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = constraints.constrainWidth();
        const dashWidth = 4.0;
        const dashSpace = 3.0;
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(dashCount, (_) {
            return const SizedBox(
              width: dashWidth,
              height: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Color(0xFFCBD5E1)),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildBarcode() {
    final barPattern = [3, 1, 2, 2, 1, 3, 1, 2, 3, 1, 1, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 2, 1, 3];
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: barPattern.asMap().entries.map((entry) {
        final isBlack = entry.key % 2 == 0;
        final width = entry.value.toDouble() * 1.5;
        return Container(
          width: width,
          height: 38,
          color: isBlack ? (isDark ? Colors.grey.shade300 : const Color(0xFF1E293B)) : Colors.transparent,
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final receiptBg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final textDark = isDark ? Colors.white : const Color(0xFF0F172A);
    final textMuted = isDark ? Colors.grey.shade400 : const Color(0xFF475569);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFC7D2FE);
    final fmt = NumberFormat('#,##0.00');

    final cleanBiz = businessType.toLowerCase().trim();
    final badgeText = cleanBiz == 'wholesale'
        ? 'WHOLESALE ORDER COMPLETED & DISPATCHED'
        : (cleanBiz == 'pharmacy'
            ? 'PHARMACY DISPENSE & ORDER COMPLETED'
            : (cleanBiz == 'grocery'
                ? 'GROCERY ORDER COMPLETED & VERIFIED'
                : 'SALE ORDER COMPLETED & DISPATCHED'));

    final cust = order.customerName.isNotEmpty ? order.customerName : 'Walk-in Customer';
    final custShort = cust.length > 22 ? '${cust.substring(0, 20)}...' : cust;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Top Success Pill Badge ─────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle_outline_rounded, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 6),
                  Text(
                    badgeText,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Thermal Receipt Card ───────────────────────────────────────
            Container(
              width: 380,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
              decoration: BoxDecoration(
                color: receiptBg,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: borderColor, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Company Header
                  Center(
                    child: Text(
                      'BLUE OCEANS POS',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.8,
                        color: textDark,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      'Dhaka Flagship Outlet • Counter #POS-01',
                      style: TextStyle(
                        fontSize: 9.5,
                        color: textMuted,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Center(
                    child: Text(
                      'BIN / VAT Reg No: 002938194-0101 • Mushak-6.3',
                      style: TextStyle(
                        fontSize: 9,
                        color: textMuted,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 2. Invoice & Customer details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Order: ${order.orderNo}',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Date: ${_formatDate(order.orderDate)}',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Cust: $custShort',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Source: ${order.source.toUpperCase()}',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 3. Table Headers
                  Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          'ITEM / SKU',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'QTY',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'RATE',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'TOTAL',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // 4. Item Rows
                  if (order.items.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Text(
                        'Standard Order Items',
                        style: TextStyle(fontSize: 10, color: textMuted, fontStyle: FontStyle.italic, fontFamily: 'monospace'),
                      ),
                    )
                  else
                    ...order.items.map((item) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 5,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                  Text(
                                    'SKU: ${item.sku.isNotEmpty ? item.sku : "SKU-001"} • ${order.branchName.isNotEmpty ? order.branchName : "Main WH"}',
                                    style: const TextStyle(
                                      fontSize: 8.5,
                                      color: Color(0xFF94A3B8),
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              flex: 2,
                              child: Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  '${item.qty}',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: textDark,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              flex: 3,
                              child: Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  '৳${fmt.format(item.unitPrice)}',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: textMuted,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              flex: 3,
                              child: Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  '৳${fmt.format(item.lineTotal)}',
                                  textAlign: TextAlign.right,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: textDark,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  const SizedBox(height: 6),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 5. Subtotal & Financial Breakdown
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(order.subtotal)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (order.discountTotal > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Special Discount:',
                          style: TextStyle(fontSize: 11, color: Colors.green, fontFamily: 'monospace'),
                        ),
                        Text(
                          '-৳${fmt.format(order.discountTotal)}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT (Mushak 6.3 - 15%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(order.taxTotal)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Shipping & Handling:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(order.serviceCharge)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Solid Line
                  const Divider(color: Color(0xFFCBD5E1), height: 1, thickness: 1),
                  const SizedBox(height: 6),

                  // Net Payable
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Net Payable:',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: textDark, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(order.total)}',
                        style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900, color: biz.primary, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Solid Line
                  const Divider(color: Color(0xFFCBD5E1), height: 1, thickness: 1),
                  const SizedBox(height: 6),

                  // Tender Details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tender Method:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        order.paymentMethod,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (order.tenderedAmount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tendered / Received:',
                          style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                        ),
                        Text(
                          '৳${fmt.format(order.tenderedAmount)}',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Paid Amount:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(order.paidTotal)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (order.dueTotal > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Remaining Due:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFEF4444), fontFamily: 'monospace'),
                        ),
                        Text(
                          '৳${fmt.format(order.dueTotal)}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFFEF4444), fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  if (order.changeReturn > 0 || order.tenderedAmount > order.total) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Change / Return:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                        Text(
                          '৳${fmt.format(order.changeReturn > 0 ? order.changeReturn : (order.tenderedAmount - order.total))}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 12),

                  // 6. Barcode Section
                  Center(child: _buildBarcode()),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      '*${order.orderNo}*',
                      style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), letterSpacing: 2, fontFamily: 'monospace'),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 7. Footer Greetings
                  Center(
                    child: Text(
                      'Thank you for your business! Please\nvisit us again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: textMuted,
                        fontFamily: 'monospace',
                        height: 1.3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text(
                      'Software by Blue Oceans POS',
                      style: TextStyle(
                        fontSize: 9,
                        color: isDark ? Colors.grey.shade500 : const Color(0xFF94A3B8),
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Bottom Action Buttons ──────────────────────────────────────
            SizedBox(
              width: 380,
              child: Row(
                children: [
                  // Print Thermal (80mm)
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        printWebDocument();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Printing Thermal Receipt (80mm) for ${order.orderNo}...'),
                            duration: const Duration(seconds: 2),
                            backgroundColor: biz.primary,
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF242424) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFC7D2FE)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.print_outlined, size: 16, color: isDark ? Colors.white : const Color(0xFF334155)),
                            const SizedBox(width: 8),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Print Thermal',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                                    height: 1.1,
                                  ),
                                ),
                                Text(
                                  '(80mm)',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // Close Button
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: biz.primary,
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: biz.primary.withValues(alpha: 0.35),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.close_rounded, size: 18, color: Colors.white),
                            SizedBox(width: 6),
                            Text(
                              'Close',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
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

// ── 5 KPI METRICS CARDS (INCLUDES TOTAL & TODAY) ──
class _OrdersKpiBar extends StatelessWidget {
  final int totalOrders;
  final int todayOrders;
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
    required this.todayOrders,
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
      {
        'label': locale == 'bn' ? 'মোট অর্ডার' : 'Total Orders',
        'val': NumberUtils.formatNumber(totalOrders, locale),
        'sub': locale == 'bn' ? 'সকল সময়' : 'All time',
        'color': const Color(0xFF6366F1),
        'icon': Icons.inventory_2_rounded,
      },
      {
        'label': locale == 'bn' ? 'আজকের অর্ডার' : "Today's Orders",
        'val': NumberUtils.formatNumber(todayOrders, locale),
        'sub': locale == 'bn' ? 'আজকের' : 'Placed today',
        'color': accentColor,
        'icon': Icons.today_rounded,
      },
      {
        'label': locale == 'bn' ? 'মোট বিক্রয়' : 'Sales Volume',
        'val': NumberUtils.formatCurrency(totalVolume, locale),
        'sub': locale == 'bn' ? 'মোট আয়' : 'Total revenue',
        'color': const Color(0xFF10B981),
        'icon': Icons.payments_rounded,
      },
      {
        'label': locale == 'bn' ? 'সম্পন্ন' : 'Completed',
        'val': NumberUtils.formatNumber(completedCount, locale),
        'sub': locale == 'bn' ? 'পেইড' : 'Paid / Delivered',
        'color': const Color(0xFF0284C7),
        'icon': Icons.check_circle_rounded,
      },
      {
        'label': locale == 'bn' ? 'পেন্ডিং' : 'Pending',
        'val': NumberUtils.formatNumber(pendingCount, locale),
        'sub': locale == 'bn' ? 'প্রক্রিয়াধীন' : 'In queue',
        'color': const Color(0xFFF59E0B),
        'icon': Icons.hourglass_top_rounded,
      },
    ];

    if (isMobile) {
      // Sleek horizontal swipeable strip on mobile - takes only ~72px height!
      return SizedBox(
        height: 72,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (ctx, index) => const SizedBox(width: 8),
          itemBuilder: (ctx, index) {
            final i = items[index];
            final color = i['color'] as Color;
            return Container(
              width: 140,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: borderColor),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                    blurRadius: 4,
                    offset: const Offset(0, 1.5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(i['icon'] as IconData, color: color, size: 16),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          i['label'] as String,
                          style: TextStyle(fontSize: 10, color: textSecondary, fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 1),
                        Text(
                          i['val'] as String,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: textPrimary),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
    }

    return Row(
      children: items
          .map((i) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  child: _kpiTile(i),
                ),
              ))
          .toList(),
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
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(i['icon'] as IconData, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  i['label'] as String,
                  style: TextStyle(fontSize: 11, color: textSecondary, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  i['val'] as String,
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: textPrimary),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  i['sub'] as String,
                  style: TextStyle(fontSize: 9.5, color: textSecondary.withValues(alpha: 0.8)),
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
    final statuses = ['ALL', 'CONFIRMED', 'COMPLETED', 'PAID', 'PENDING', 'CANCELLED'];

    return Container(
      padding: EdgeInsets.all(isMobile ? 10 : 14),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Search input
              Expanded(
                child: SizedBox(
                  height: isMobile ? 38 : 42,
                  child: TextField(
                    controller: searchCtrl,
                    onChanged: onSearch,
                    style: TextStyle(fontSize: isMobile ? 12 : 13, color: textPrimary),
                    decoration: InputDecoration(
                      hintText: locale == 'bn'
                          ? 'অর্ডার নং, গ্রাহক নাম বা ফোন...'
                          : 'Search by order no, customer or phone...',
                      hintStyle: TextStyle(fontSize: isMobile ? 11.5 : 12, color: textSecondary),
                      prefixIcon: Icon(Icons.search_rounded, size: isMobile ? 18 : 20, color: textSecondary),
                      suffixIcon: searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 16),
                              onPressed: () {
                                searchCtrl.clear();
                                onSearch('');
                              },
                            )
                          : null,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                      filled: true,
                      fillColor: borderColor.withValues(alpha: 0.3),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Refresh button
              IconButton(
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                tooltip: locale == 'bn' ? 'রিফ্রেশ' : 'Refresh',
                padding: EdgeInsets.zero,
                constraints: BoxConstraints(minWidth: isMobile ? 36 : 40, minHeight: isMobile ? 36 : 40),
                style: IconButton.styleFrom(
                  backgroundColor: borderColor.withValues(alpha: 0.3),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
          SizedBox(height: isMobile ? 8 : 12),
          // Status Filter Chips
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
                  if (st == 'PAID') label = 'পরিশোধিত';
                  if (st == 'PENDING') label = 'পেন্ডিং';
                  if (st == 'CANCELLED') label = 'বাতিল';
                }

                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (_) => onStatusChanged(st),
                    selectedColor: accentColor.withValues(alpha: 0.18),
                    checkmarkColor: accentColor,
                    padding: isMobile ? const EdgeInsets.symmetric(horizontal: 4, vertical: 0) : null,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    labelStyle: TextStyle(
                      fontSize: isMobile ? 11 : 12,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? accentColor : textSecondary,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
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

// ── ORDERS TABLE VIEW (FOR DESKTOP / WIDE WEB VIEW) ──
class _OrdersTableView extends StatelessWidget {
  final List<SalesOrder> orders;
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;
  final Color accentColor;
  final ValueChanged<SalesOrder> onViewDetails;
  final ValueChanged<SalesOrder> onPrintReceipt;

  const _OrdersTableView({
    required this.orders,
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.accentColor,
    required this.onViewDetails,
    required this.onPrintReceipt,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.03),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text(
                    locale == 'bn' ? 'অর্ডার নং ও উৎস' : 'Order # & Source',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    locale == 'bn' ? 'অর্ডার তারিখ' : 'Order Date',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    locale == 'bn' ? 'আইটেম সমূহ' : 'Line Items',
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    locale == 'bn' ? 'পদ্ধতি' : 'Payment Method',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    locale == 'bn' ? 'মোট / বকেয়া' : 'Total / Due',
                    textAlign: TextAlign.right,
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    locale == 'bn' ? 'স্ট্যাটাস' : 'Fulfillment Status',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    locale == 'bn' ? 'অ্যাকশন' : 'Actions',
                    textAlign: TextAlign.right,
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                ),
              ],
            ),
          ),

          // Table Rows
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: orders.length,
            separatorBuilder: (ctx, index) => Divider(height: 1, color: borderColor),
            itemBuilder: (ctx, idx) {
              final order = orders[idx];
              final statusColor = (order.status == 'COMPLETED' || order.status == 'CONFIRMED' || order.status == 'PAID' || order.status == 'DELIVERED')
                  ? const Color(0xFF10B981)
                  : (order.status == 'CANCELLED' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B));

              final dateStr =
                  '${order.orderDate.day.toString().padLeft(2, '0')}/${order.orderDate.month.toString().padLeft(2, '0')}/${order.orderDate.year}';
              final timeStr =
                  '${order.orderDate.hour.toString().padLeft(2, '0')}:${order.orderDate.minute.toString().padLeft(2, '0')}';

              return InkWell(
                onTap: () => onViewDetails(order),
                hoverColor: accentColor.withValues(alpha: 0.04),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  child: Row(
                    children: [
                      // Order # & Source & Customer
                      Expanded(
                        flex: 3,
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: accentColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(Icons.inventory_2_outlined, color: accentColor, size: 16),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    order.orderNo,
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: textPrimary,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    '${order.customerName} • ${order.source}',
                                    style: TextStyle(fontSize: 11, color: textSecondary),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Order Date
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(dateStr, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: textPrimary)),
                            Text(timeStr, style: TextStyle(fontSize: 10.5, color: textSecondary)),
                          ],
                        ),
                      ),

                      // Line Items
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                              decoration: BoxDecoration(
                                color: borderColor.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '${order.items.length} ${locale == 'bn' ? 'টি আইটেম' : 'items'}',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textPrimary),
                              ),
                            ),
                            if (order.items.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text(
                                  order.items.first.name,
                                  style: TextStyle(fontSize: 10.5, color: textSecondary),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                          ],
                        ),
                      ),

                      // Payment Method
                      Expanded(
                        flex: 2,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                            decoration: BoxDecoration(
                              color: borderColor.withValues(alpha: 0.5),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              order.paymentMethod,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: textPrimary,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Total / Due
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              NumberUtils.formatCurrency(order.total, locale),
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w800,
                                color: textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            if (order.dueTotal > 0)
                              Text(
                                '- ${NumberUtils.formatCurrency(order.dueTotal, locale)}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFFEF4444),
                                ),
                              )
                            else
                              Text(
                                NumberUtils.formatCurrency(0, locale),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                          ],
                        ),
                      ),

                      // Status Badge
                      Expanded(
                        flex: 2,
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3.5),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              order.status,
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: statusColor),
                            ),
                          ),
                        ),
                      ),

                      // Actions
                      Expanded(
                        flex: 2,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            IconButton(
                              onPressed: () => onViewDetails(order),
                              icon: const Icon(Icons.visibility_outlined, size: 18),
                              tooltip: locale == 'bn' ? 'বিস্তারিত দেখুন' : 'Order Details',
                              color: textSecondary,
                              hoverColor: accentColor.withValues(alpha: 0.1),
                            ),
                            IconButton(
                              onPressed: () => onPrintReceipt(order),
                              icon: const Icon(Icons.print_outlined, size: 18),
                              tooltip: locale == 'bn' ? 'রসিদ প্রিন্ট' : 'Print Invoice Receipt',
                              color: accentColor,
                              hoverColor: accentColor.withValues(alpha: 0.1),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ── ORDERS CARD LIST (IMPROVED SLEEK MOBILE APP UI) ──
class _OrdersCardList extends StatelessWidget {
  final List<SalesOrder> orders;
  final String locale;
  final bool isDark;
  final Color cardBg;
  final Color borderColor;
  final Color textPrimary;
  final Color textSecondary;
  final Color accentColor;
  final ValueChanged<SalesOrder> onViewDetails;
  final ValueChanged<SalesOrder> onPrintReceipt;

  const _OrdersCardList({
    required this.orders,
    required this.locale,
    required this.isDark,
    required this.cardBg,
    required this.borderColor,
    required this.textPrimary,
    required this.textSecondary,
    required this.accentColor,
    required this.onViewDetails,
    required this.onPrintReceipt,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: orders.length,
      separatorBuilder: (ctx, index) => const SizedBox(height: 8),
      itemBuilder: (ctx, idx) {
        final order = orders[idx];
        final isPaid = order.paymentStatus == 'PAID';
        final statusColor = (order.status == 'COMPLETED' || order.status == 'CONFIRMED' || order.status == 'PAID' || order.status == 'DELIVERED')
            ? const Color(0xFF10B981)
            : (order.status == 'CANCELLED' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B));

        final timeStr =
            '${order.orderDate.hour.toString().padLeft(2, '0')}:${order.orderDate.minute.toString().padLeft(2, '0')}';
        final dateStr =
            '${order.orderDate.day.toString().padLeft(2, '0')}/${order.orderDate.month.toString().padLeft(2, '0')}';

        return InkWell(
          onTap: () => onViewDetails(order),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderColor),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                  blurRadius: 5,
                  offset: const Offset(0, 1.5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Order #, Source Badge & Status Badge
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: accentColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(7),
                      ),
                      child: Icon(Icons.receipt_rounded, color: accentColor, size: 15),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        order.orderNo,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    // Source Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: borderColor.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Text(
                        order.source,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          color: textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Status Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(5),
                        border: Border.all(color: statusColor.withValues(alpha: 0.25)),
                      ),
                      child: Text(
                        order.status,
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          color: statusColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Middle Row: Customer Info & Timestamp
                Row(
                  children: [
                    Icon(Icons.person_outline_rounded, size: 14, color: textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        order.customerName,
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: textPrimary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(Icons.schedule_rounded, size: 13, color: textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      '$dateStr • $timeStr',
                      style: TextStyle(fontSize: 10.5, color: textSecondary, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Divider line
                Divider(height: 1, color: borderColor.withValues(alpha: 0.5)),
                const SizedBox(height: 8),

                // Bottom Row: Items count + Total + Paid/Due & Quick Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Items count & payment method
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${order.items.length} ${locale == 'bn' ? 'টি আইটেম' : 'items'}',
                            style: TextStyle(fontSize: 11, color: textSecondary, fontWeight: FontWeight.w500),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 1),
                          Text(
                            '${order.paymentStatus} (${order.paymentMethod})',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isPaid ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Amount & Actions
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              NumberUtils.formatCurrency(order.total, locale),
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w900,
                                color: textPrimary,
                              ),
                            ),
                            if (order.dueTotal > 0)
                              Text(
                                '- ${NumberUtils.formatCurrency(order.dueTotal, locale)}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFFEF4444),
                                ),
                              )
                            else
                              Text(
                                NumberUtils.formatCurrency(0, locale),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(width: 10),
                        // Quick Action Icon Buttons
                        IconButton(
                          onPressed: () => onViewDetails(order),
                          icon: const Icon(Icons.visibility_outlined, size: 16),
                          tooltip: locale == 'bn' ? 'বিস্তারিত' : 'Details',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                          style: IconButton.styleFrom(
                            backgroundColor: borderColor.withValues(alpha: 0.35),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          color: textSecondary,
                        ),
                        const SizedBox(width: 4),
                        IconButton(
                          onPressed: () => onPrintReceipt(order),
                          icon: const Icon(Icons.print_outlined, size: 16),
                          tooltip: locale == 'bn' ? 'রসিদ' : 'Receipt',
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                          style: IconButton.styleFrom(
                            backgroundColor: accentColor.withValues(alpha: 0.12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          color: accentColor,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ── EMPTY STATE VIEW ──
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
      padding: const EdgeInsets.all(36),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          Icon(Icons.receipt_long_outlined, size: 44, color: textSecondary),
          const SizedBox(height: 12),
          Text(
            locale == 'bn' ? 'কোন সেলস অর্ডার পাওয়া যায়নি' : 'No sales orders found',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            locale == 'bn'
                ? 'পিওএস রেজিস্টার থেকে নতুন বিক্রি সম্পন্ন করুন'
                : 'Create new sales orders from the POS register',
            style: TextStyle(fontSize: 11.5, color: textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onOpenPos,
            icon: const Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 16),
            label: Text(
              locale == 'bn' ? 'পিওএস ওপেন করুন' : 'Open POS Screen',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFF6D00),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          ),
        ],
      ),
    );
  }
}
