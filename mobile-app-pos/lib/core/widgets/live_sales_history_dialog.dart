import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../models/sales_order_model.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';
import '../utils/number_utils.dart';

void showLiveSalesHistoryDialog(BuildContext context, {required String businessType}) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => LiveSalesHistoryDialog(businessType: businessType),
  );
}

class LiveSalesHistoryDialog extends StatefulWidget {
  final String businessType;
  const LiveSalesHistoryDialog({super.key, required this.businessType});

  @override
  State<LiveSalesHistoryDialog> createState() => _LiveSalesHistoryDialogState();
}

class _LiveSalesHistoryDialogState extends State<LiveSalesHistoryDialog> {
  bool _isLoading = true;
  List<SalesOrder> _orders = [];
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSales();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSales() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final orders = await ApiService.instance.fetchSalesOrders(
        businessType: widget.businessType,
        search: _searchQuery,
      );
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading sales history: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _getPrimaryColor() {
    switch (widget.businessType.toLowerCase()) {
      case 'restaurant':
        return const Color(0xFFFF6D00);
      case 'retail':
        return const Color(0xFF8B5CF6);
      case 'grocery':
        return const Color(0xFF22C55E);
      case 'pharmacy':
        return const Color(0xFF00897B);
      case 'wholesaler':
      case 'wholesale':
        return const Color(0xFF4F46E5);
      default:
        return const Color(0xFFFF6D00);
    }
  }

  String _getTitle(bool isBn) {
    switch (widget.businessType.toLowerCase()) {
      case 'restaurant':
        return isBn ? 'রেস্তোরাঁ সেলস হিস্ট্রি' : 'Restaurant Sales History';
      case 'retail':
        return isBn ? 'রিটেল সেলস হিস্ট্রি' : 'Retail Sales History';
      case 'grocery':
        return isBn ? 'মুদি সেলস হিস্ট্রি' : 'Grocery Sales History';
      case 'pharmacy':
        return isBn ? 'ফার্মেসি সেলস হিস্ট্রি' : 'Pharmacy Sales History';
      case 'wholesaler':
      case 'wholesale':
        return isBn ? 'পাইকারি সেলস হিস্ট্রি' : 'Wholesale Sales History';
      default:
        return isBn ? 'সেলস হিস্ট্রি' : 'Sales History';
    }
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;
    final isBn = locale == 'bn';
    final primaryColor = _getPrimaryColor();

    final bg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final cardBg = isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC);
    final borderColor = isDark ? const Color(0xFF383838) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    final totalRevenue = _orders.fold<double>(0.0, (sum, o) => sum + o.total);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: 580,
        height: 680,
        constraints: const BoxConstraints(maxWidth: 620, maxHeight: 720),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.35),
              blurRadius: 28,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          children: [
            // ── TOP HEADER ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: primaryColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.receipt_long_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getTitle(isBn),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          isBn ? 'সরাসরি ব্যাকএন্ড সিস্টেমের সাথে সংযুক্ত' : 'Live synced with backend system',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  // Refresh button
                  IconButton(
                    onPressed: _loadSales,
                    tooltip: isBn ? 'রিফ্রেশ করুন' : 'Refresh from server',
                    icon: _isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.refresh_rounded, color: Colors.white, size: 22),
                  ),
                  // Close button
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
                  ),
                ],
              ),
            ),

            // ── STATS BAR & SEARCH ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: primaryColor.withValues(alpha: isDark ? 0.15 : 0.08),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: primaryColor.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.shopping_bag_outlined, color: primaryColor, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      isBn ? 'মোট অর্ডার' : 'Total Orders',
                                      style: TextStyle(fontSize: 11, color: textSecondary, fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      alignment: Alignment.centerLeft,
                                      child: Text(
                                        NumberUtils.toLocalized(_orders.length, locale),
                                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: primaryColor),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: isDark ? 0.15 : 0.08),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.payments_outlined, color: Colors.green, size: 18),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      isBn ? 'মোট বিক্রয়' : 'Revenue',
                                      style: TextStyle(fontSize: 11, color: textSecondary, fontWeight: FontWeight.w600),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      alignment: Alignment.centerLeft,
                                      child: Text(
                                        '৳${NumberUtils.toLocalized(totalRevenue.toStringAsFixed(0), locale)}',
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.green),
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
                  const SizedBox(height: 10),
                  // Search Bar
                  Container(
                    height: 42,
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: TextField(
                      controller: _searchCtrl,
                      style: TextStyle(fontSize: 13, color: textPrimary),
                      decoration: InputDecoration(
                        hintText: isBn ? 'ইনভয়েস বা গ্রাহক খুঁজুন...' : 'Search by Invoice # or Customer...',
                        hintStyle: TextStyle(fontSize: 12, color: textSecondary),
                        prefixIcon: Icon(Icons.search, size: 18, color: textSecondary),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16),
                                onPressed: () {
                                  _searchCtrl.clear();
                                  _searchQuery = '';
                                  _loadSales();
                                },
                              )
                            : null,
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onSubmitted: (v) {
                        _searchQuery = v;
                        _loadSales();
                      },
                    ),
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // ── SALES ORDERS LIST ──
            Expanded(
              child: _isLoading
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(color: primaryColor),
                          const SizedBox(height: 12),
                          Text(
                            isBn ? 'সিস্টেম থেকে অর্ডার লোড হচ্ছে...' : 'Loading sales from system...',
                            style: TextStyle(fontSize: 13, color: textSecondary),
                          ),
                        ],
                      ),
                    )
                  : _orders.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.receipt_long_outlined, size: 48, color: textSecondary.withValues(alpha: 0.5)),
                              const SizedBox(height: 12),
                              Text(
                                isBn ? 'কোনো সেলস অর্ডার পাওয়া যায়নি' : 'No sales orders found',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textPrimary),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                isBn
                                    ? 'POS বা সফটওয়্যার থেকে অর্ডার করলে এখানে দেখাবে'
                                    : 'Orders made in POS or Web Software will show here',
                                style: TextStyle(fontSize: 12, color: textSecondary),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _orders.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final order = _orders[i];
                            return _buildOrderCard(order, isDark, borderColor, textPrimary, textSecondary, primaryColor, isBn, locale);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(
    SalesOrder order,
    bool isDark,
    Color borderColor,
    Color textPrimary,
    Color textSecondary,
    Color primaryColor,
    bool isBn,
    String locale,
  ) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF262626) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Invoice + Status Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          order.orderNo,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: primaryColor,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'PAID',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  '৳${NumberUtils.toLocalized(order.total.toStringAsFixed(2), locale)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Customer + Date
          Row(
            children: [
              Expanded(
                child: Text(
                  order.customerName,
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                DateFormat('dd MMM yyyy, hh:mm a').format(order.orderDate),
                style: TextStyle(fontSize: 11, color: textSecondary),
              ),
            ],
          ),

          if (order.items.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1E1E) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Column(
                children: order.items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${item.qty}x ${item.name}',
                            style: TextStyle(fontSize: 11.5, color: textPrimary, fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '৳${item.lineTotal.toStringAsFixed(2)}',
                          style: TextStyle(fontSize: 11.5, color: textSecondary, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
