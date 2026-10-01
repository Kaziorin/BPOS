import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import 'wholesaler_dialogs.dart';
import '../../../core/widgets/live_sales_history_dialog.dart';

// ─────────────────────────────────────────────────────────────────
// SINGLE-ROW PILL FOOTER BAR (Matching Web & Screenshot Exactly)
// ─────────────────────────────────────────────────────────────────
class WholesalerFooterBar extends StatelessWidget {
  const WholesalerFooterBar({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return Container(
      decoration: BoxDecoration(
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: WholesalerColors.border(isDark),
        ),
        boxShadow: WholesalerColors.softShadow(isDark, elevation: 1.5),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 1050;
          if (isWide) {
            return Row(
              children: [
                // ── Left: Utility Actions ────────────────────────
                Expanded(
                  flex: 12,
                  child: Row(
                    children: [
                      Expanded(
                        child: _ActionPill(
                          icon: Icons.person_add_rounded,
                          label: 'Add Customer',
                          isDark: isDark,
                          onTap: () => showDialog(
                            context: context,
                            builder: (_) => ChangeNotifierProvider.value(
                              value: context.read<WholesalerProvider>(),
                              child: const WCustomerDialog(initialTab: 1),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _ActionPill(
                          letter: 'H',
                          label: 'Hold Order',
                          isDark: isDark,
                          onTap: () {
                            if (w.items.isEmpty) {
                              _snack(context, 'Add items first to hold an order');
                              return;
                            }
                            showDialog(
                              context: context,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: context.read<WholesalerProvider>(),
                                child: const WHoldOrderDialog(),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _ActionPill(
                          letter: 'R',
                          label: 'Recent Orders',
                          isDark: isDark,
                          onTap: () => showLiveSalesHistoryDialog(context, businessType: 'wholesaler'),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _ActionPill(
                          letter: 'Q',
                          label: 'Quotations',
                          isDark: isDark,
                          onTap: () => _snack(context, '📋 Quotation module opening...'),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _ActionPill(
                          letter: 'S',
                          label: 'Stock Transfer',
                          isDark: isDark,
                          onTap: () => _snack(context, '🔄 Stock Transfer module opening...'),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _ActionPill(
                          letter: 'S',
                          label: 'Sales History',
                          isDark: isDark,
                          onTap: () => showLiveSalesHistoryDialog(context, businessType: 'wholesaler'),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Vertical Divider ──────────────────────────────
                Container(
                  width: 1,
                  height: 22,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  color: isDark ? const Color(0xFF2E2B6B) : const Color(0xFFCBD5E1),
                ),

                // ── Right: Metadata Info Chips ───────────────────
                Expanded(
                  flex: 10,
                  child: Row(
                    children: [
                      Expanded(
                        child: _MetaChip(
                          icon: Icons.warehouse_rounded,
                          label: 'WAREHOUSE',
                          value: w.selectedWarehouse.isNotEmpty ? w.selectedWarehouse : 'Main Warehouse',
                          isDark: isDark,
                          onTap: () => _pickWarehouse(context, w, isDark),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _MetaChip(
                          icon: Icons.person_rounded,
                          label: 'REP',
                          value: w.salesRep.isNotEmpty ? w.salesRep : 'Faisal',
                          isDark: isDark,
                          onTap: () => _pickSalesRep(context, w, isDark),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _MetaChip(
                          icon: Icons.calendar_today_rounded,
                          label: 'DELIVERY',
                          value: 'Oct 3, 2026',
                          isDark: isDark,
                          onTap: () => _pickDeliveryDate(context),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _MetaChip(
                          icon: Icons.local_shipping_rounded,
                          label: 'METHOD',
                          value: w.deliveryMethod.isNotEmpty ? w.deliveryMethod : 'Standard',
                          isDark: isDark,
                          onTap: () => _pickDeliveryMethod(context, w, isDark),
                        ),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: _MetaChip(
                          icon: Icons.credit_card_rounded,
                          label: 'TERM',
                          value: w.paymentTerm.isNotEmpty ? w.paymentTerm : '30 Days',
                          isDark: isDark,
                          onTap: () => _pickPaymentTerm(context, w, isDark),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }

          // Horizontal scrollable on tablet / narrower screens
          return SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                _ActionPill(
                  icon: Icons.person_add_rounded,
                  label: 'Add Customer',
                  isDark: isDark,
                  onTap: () => showDialog(
                    context: context,
                    builder: (_) => ChangeNotifierProvider.value(
                      value: context.read<WholesalerProvider>(),
                      child: const WCustomerDialog(initialTab: 1),
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                _ActionPill(
                  letter: 'H',
                  label: 'Hold Order',
                  isDark: isDark,
                  onTap: () {
                    if (w.items.isEmpty) {
                      _snack(context, 'Add items first to hold an order');
                      return;
                    }
                    showDialog(
                      context: context,
                      builder: (_) => ChangeNotifierProvider.value(
                        value: context.read<WholesalerProvider>(),
                        child: const WHoldOrderDialog(),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 6),
                _ActionPill(
                  letter: 'R',
                  label: 'Recent Orders',
                  isDark: isDark,
                  onTap: () => showLiveSalesHistoryDialog(context, businessType: 'wholesaler'),
                ),
                const SizedBox(width: 6),
                _ActionPill(
                  letter: 'Q',
                  label: 'Quotations',
                  isDark: isDark,
                  onTap: () => _snack(context, '📋 Quotation module opening...'),
                ),
                const SizedBox(width: 6),
                _ActionPill(
                  letter: 'S',
                  label: 'Stock Transfer',
                  isDark: isDark,
                  onTap: () => _snack(context, '🔄 Stock Transfer module opening...'),
                ),
                const SizedBox(width: 6),
                _ActionPill(
                  letter: 'S',
                  label: 'Sales History',
                  isDark: isDark,
                  onTap: () => showLiveSalesHistoryDialog(context, businessType: 'wholesaler'),
                ),

                Container(
                  width: 1,
                  height: 22,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  color: isDark ? const Color(0xFF2E2B6B) : const Color(0xFFCBD5E1),
                ),

                _MetaChip(
                  icon: Icons.warehouse_rounded,
                  label: 'WAREHOUSE',
                  value: w.selectedWarehouse.isNotEmpty ? w.selectedWarehouse : 'Main Warehouse',
                  isDark: isDark,
                  onTap: () => _pickWarehouse(context, w, isDark),
                ),
                const SizedBox(width: 6),
                _MetaChip(
                  icon: Icons.person_rounded,
                  label: 'REP',
                  value: w.salesRep.isNotEmpty ? w.salesRep : 'Faisal',
                  isDark: isDark,
                  onTap: () => _pickSalesRep(context, w, isDark),
                ),
                const SizedBox(width: 6),
                _MetaChip(
                  icon: Icons.calendar_today_rounded,
                  label: 'DELIVERY',
                  value: 'Oct 3, 2026',
                  isDark: isDark,
                  onTap: () => _pickDeliveryDate(context),
                ),
                const SizedBox(width: 6),
                _MetaChip(
                  icon: Icons.local_shipping_rounded,
                  label: 'METHOD',
                  value: w.deliveryMethod.isNotEmpty ? w.deliveryMethod : 'Standard',
                  isDark: isDark,
                  onTap: () => _pickDeliveryMethod(context, w, isDark),
                ),
                const SizedBox(width: 6),
                _MetaChip(
                  icon: Icons.credit_card_rounded,
                  label: 'TERM',
                  value: w.paymentTerm.isNotEmpty ? w.paymentTerm : '30 Days',
                  isDark: isDark,
                  onTap: () => _pickPaymentTerm(context, w, isDark),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  static void _snack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: const Color(0xFF146EF5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
      duration: const Duration(seconds: 1),
    ));
  }

  static void _pickWarehouse(BuildContext context, WholesalerProvider w, bool isDark) {
    const warehouses = ['Main Warehouse', 'WH-01 Main', 'WH-02 Annex', 'WH-03 Cold Store'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        title: Text(
          'Select Warehouse',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: isDark ? const Color(0xFFE0E7FF) : const Color(0xFF10213D),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: warehouses
              .map((wh) => ListTile(
                    dense: true,
                    leading: Icon(
                      Icons.warehouse_rounded,
                      color: w.selectedWarehouse == wh
                          ? const Color(0xFF146EF5)
                          : (isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B)),
                    ),
                    title: Text(
                      wh,
                      style: TextStyle(
                        fontWeight: w.selectedWarehouse == wh ? FontWeight.w800 : FontWeight.w600,
                        color: w.selectedWarehouse == wh
                            ? const Color(0xFF146EF5)
                            : (isDark ? Colors.white : const Color(0xFF10213D)),
                      ),
                    ),
                    trailing: w.selectedWarehouse == wh
                        ? const Icon(Icons.check_rounded, color: Color(0xFF146EF5), size: 18)
                        : null,
                    onTap: () {
                      w.setWarehouse(wh);
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  static void _pickSalesRep(BuildContext context, WholesalerProvider w, bool isDark) {
    const reps = ['Faisal', 'John Smith', 'Sarah Connor', 'Michael Scott'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        title: Text(
          'Select Sales Rep',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: isDark ? const Color(0xFFE0E7FF) : const Color(0xFF10213D),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: reps
              .map((rep) => ListTile(
                    dense: true,
                    leading: Icon(
                      Icons.person_rounded,
                      color: w.salesRep == rep
                          ? const Color(0xFF146EF5)
                          : (isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B)),
                    ),
                    title: Text(
                      rep,
                      style: TextStyle(
                        fontWeight: w.salesRep == rep ? FontWeight.w800 : FontWeight.w600,
                        color: w.salesRep == rep
                            ? const Color(0xFF146EF5)
                            : (isDark ? Colors.white : const Color(0xFF10213D)),
                      ),
                    ),
                    trailing: w.salesRep == rep
                        ? const Icon(Icons.check_rounded, color: Color(0xFF146EF5), size: 18)
                        : null,
                    onTap: () {
                      w.setSalesRep(rep);
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  static Future<void> _pickDeliveryDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 3)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null && context.mounted) {
      _snack(context, 'Delivery Date set to ${DateFormat('MMM d, yyyy').format(picked)}');
    }
  }

  static void _pickDeliveryMethod(BuildContext context, WholesalerProvider w, bool isDark) {
    const methods = ['Standard', 'Express Cargo', 'Customer Pickup', 'Courier / Freight'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        title: Text(
          'Delivery Method',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: isDark ? const Color(0xFFE0E7FF) : const Color(0xFF10213D),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: methods
              .map((m) => ListTile(
                    dense: true,
                    leading: Icon(
                      Icons.local_shipping_rounded,
                      color: w.deliveryMethod == m
                          ? const Color(0xFF146EF5)
                          : (isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B)),
                    ),
                    title: Text(
                      m,
                      style: TextStyle(
                        fontWeight: w.deliveryMethod == m ? FontWeight.w800 : FontWeight.w600,
                        color: w.deliveryMethod == m
                            ? const Color(0xFF146EF5)
                            : (isDark ? Colors.white : const Color(0xFF10213D)),
                      ),
                    ),
                    trailing: w.deliveryMethod == m
                        ? const Icon(Icons.check_rounded, color: Color(0xFF146EF5), size: 18)
                        : null,
                    onTap: () {
                      w.setDeliveryMethod(m);
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }

  static void _pickPaymentTerm(BuildContext context, WholesalerProvider w, bool isDark) {
    const terms = ['30 Days', 'Immediate Cash', '15 Days', '45 Days', '60 Days'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        title: Text(
          'Payment Term',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w800,
            color: isDark ? const Color(0xFFE0E7FF) : const Color(0xFF10213D),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: terms
              .map((t) => ListTile(
                    dense: true,
                    leading: Icon(
                      Icons.credit_card_rounded,
                      color: w.paymentTerm == t
                          ? const Color(0xFF146EF5)
                          : (isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B)),
                    ),
                    title: Text(
                      t,
                      style: TextStyle(
                        fontWeight: w.paymentTerm == t ? FontWeight.w800 : FontWeight.w600,
                        color: w.paymentTerm == t
                            ? const Color(0xFF146EF5)
                            : (isDark ? Colors.white : const Color(0xFF10213D)),
                      ),
                    ),
                    trailing: w.paymentTerm == t
                        ? const Icon(Icons.check_rounded, color: Color(0xFF146EF5), size: 18)
                        : null,
                    onTap: () {
                      w.setPaymentTerm(t);
                      Navigator.pop(context);
                    },
                  ))
              .toList(),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ACTION PILL BUTTON (Matching Screenshot items 1 to 6)
// ─────────────────────────────────────────────────────────────────
class _ActionPill extends StatefulWidget {
  final IconData? icon;
  final String? letter;
  final String label;
  final bool isDark;
  final VoidCallback onTap;

  const _ActionPill({
    this.icon,
    this.letter,
    required this.label,
    required this.isDark,
    required this.onTap,
  });

  @override
  State<_ActionPill> createState() => _ActionPillState();
}

class _ActionPillState extends State<_ActionPill> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;

    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(6),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 140),
          height: 35,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            color: _hovered
                ? (isDark ? WholesalerColors.surfaceBg(isDark) : const Color(0xFFEBF3FE))
                : (isDark ? WholesalerColors.surfaceBg(isDark) : const Color(0xFFF5FAFE)),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: _hovered
                  ? WholesalerColors.primary
                  : WholesalerColors.border(isDark),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Circular badge with icon or letter (e.g. H, R, Q, S)
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: isDark ? WholesalerColors.cardBg(isDark) : const Color(0xFFEBF3FE),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: WholesalerColors.border(isDark),
                  ),
                ),
                child: Center(
                  child: widget.icon != null
                      ? Icon(
                          widget.icon,
                          size: 12,
                          color: WholesalerColors.primary,
                        )
                      : Text(
                          widget.letter ?? '',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF146EF5),
                            height: 1.0,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  widget.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF10213D),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// METADATA CHIP (Matching Screenshot right-side items)
// ─────────────────────────────────────────────────────────────────
class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isDark;
  final VoidCallback? onTap;

  const _MetaChip({
    required this.icon,
    required this.label,
    required this.value,
    required this.isDark,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        height: 35,
        padding: const EdgeInsets.symmetric(horizontal: 7),
        decoration: BoxDecoration(
          color: isDark ? WholesalerColors.surfaceBg(isDark) : const Color(0xFFF5FAFE),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: WholesalerColors.border(isDark),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Circular icon badge
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: isDark ? WholesalerColors.cardBg(isDark) : const Color(0xFFEBF3FE),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: WholesalerColors.border(isDark),
                ),
              ),
              child: Icon(
                icon,
                size: 11.5,
                color: WholesalerColors.primary,
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 7.5,
                      fontWeight: FontWeight.w900,
                      color: isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B),
                      letterSpacing: 0.4,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF10213D),
                      height: 1.1,
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
// MOBILE BOTTOM SHEET: Full Options Modal (Matching Screenshot Exactly)
// ─────────────────────────────────────────────────────────────────
void showWholesalerMobileOptions(
  BuildContext context,
  WholesalerProvider w,
  bool isDark,
) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => ChangeNotifierProvider.value(
      value: w,
      child: _MobileOptionsSheet(isDark: isDark),
    ),
  );
}

class _MobileOptionsSheet extends StatelessWidget {
  final bool isDark;
  const _MobileOptionsSheet({required this.isDark});

  @override
  Widget build(BuildContext context) {
    final w = context.watch<WholesalerProvider>();

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF111827) : const Color(0xFFF8FAFC),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle + Header
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 10, 10),
              decoration: BoxDecoration(
                color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFE2E8F0),
                  ),
                ),
              ),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4.5,
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white24 : const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF5C52EE), Color(0xFF4338CA)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(11),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.grid_view_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Quick Actions & Options',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Manage customer, orders, stock & reports',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w500,
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        color: isDark ? Colors.white70 : const Color(0xFF64748B),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable Content
            Flexible(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section 1: QUICK ACTIONS
                    Text(
                      'QUICK ACTIONS',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 10),
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 0.95,
                      children: [
                        // 1. Customer
                        _QuickActionCard(
                          icon: Icons.person_add_alt_1_rounded,
                          iconColor: const Color(0xFF6366F1),
                          bgColor: isDark
                              ? const Color(0xFF312E81).withValues(alpha: 0.5)
                              : const Color(0xFFEEF2FF),
                          title: 'Customer',
                          subtitle: 'Add / Search',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            showDialog(
                              context: context,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: w,
                                child: const WCustomerDialog(),
                              ),
                            );
                          },
                        ),
                        // 2. Hold Order
                        _QuickActionCard(
                          icon: Icons.pause_circle_filled_rounded,
                          iconColor: const Color(0xFFF59E0B),
                          bgColor: isDark
                              ? const Color(0xFF78350F).withValues(alpha: 0.4)
                              : const Color(0xFFFEF3C7),
                          title: 'Hold Order',
                          subtitle: 'Park Current',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            if (w.items.isEmpty) {
                              WholesalerFooterBar._snack(
                                  context, 'Add items first to hold an order');
                              return;
                            }
                            showDialog(
                              context: context,
                              builder: (_) => ChangeNotifierProvider.value(
                                value: w,
                                child: const WHoldOrderDialog(),
                              ),
                            );
                          },
                        ),
                        // 3. Recent Orders
                        _QuickActionCard(
                          icon: Icons.history_rounded,
                          iconColor: const Color(0xFF3B82F6),
                          bgColor: isDark
                              ? const Color(0xFF1E3A8A).withValues(alpha: 0.4)
                              : const Color(0xFFDBEAFE),
                          title: 'Recent Orders',
                          subtitle: 'View All',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            showLiveSalesHistoryDialog(context,
                                businessType: 'wholesaler');
                          },
                        ),
                        // 4. Quotations
                        _QuickActionCard(
                          icon: Icons.request_quote_rounded,
                          iconColor: const Color(0xFFA855F7),
                          bgColor: isDark
                              ? const Color(0xFF581C87).withValues(alpha: 0.4)
                              : const Color(0xFFF3E8FF),
                          title: 'Quotations',
                          subtitle: 'Create / View',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            _showQuotations(context, w, isDark);
                          },
                        ),
                        // 5. Stock Transfer
                        _QuickActionCard(
                          icon: Icons.swap_horiz_rounded,
                          iconColor: const Color(0xFF10B981),
                          bgColor: isDark
                              ? const Color(0xFF064E3B).withValues(alpha: 0.4)
                              : const Color(0xFFD1FAE5),
                          title: 'Stock Transfer',
                          subtitle: 'Warehouses',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            _showStockTransfer(context, w, isDark);
                          },
                        ),
                        // 6. Sales History
                        _QuickActionCard(
                          icon: Icons.receipt_long_rounded,
                          iconColor: const Color(0xFF06B6D4),
                          bgColor: isDark
                              ? const Color(0xFF164E63).withValues(alpha: 0.4)
                              : const Color(0xFFCFFAFE),
                          title: 'Sales History',
                          subtitle: 'Transactions',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            showLiveSalesHistoryDialog(context,
                                businessType: 'wholesaler');
                          },
                        ),
                        // 7. Returns
                        _QuickActionCard(
                          icon: Icons.replay_rounded,
                          iconColor: const Color(0xFFEF4444),
                          bgColor: isDark
                              ? const Color(0xFF7F1D1D).withValues(alpha: 0.4)
                              : const Color(0xFFFEE2E2),
                          title: 'Returns',
                          subtitle: 'Manage',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            _showReturns(context, w, isDark);
                          },
                        ),
                        // 8. Expense
                        _QuickActionCard(
                          icon: Icons.add_card_rounded,
                          iconColor: const Color(0xFFEC4899),
                          bgColor: isDark
                              ? const Color(0xFF831843).withValues(alpha: 0.4)
                              : const Color(0xFFFCE7F3),
                          title: 'Expense',
                          subtitle: 'Add Expense',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            _showExpense(context, w, isDark);
                          },
                        ),
                        // 9. More
                        _QuickActionCard(
                          icon: Icons.more_horiz_rounded,
                          iconColor: const Color(0xFF64748B),
                          bgColor: isDark
                              ? const Color(0xFF334155).withValues(alpha: 0.4)
                              : const Color(0xFFF1F5F9),
                          title: 'More',
                          subtitle: 'Options',
                          isDark: isDark,
                          onTap: () {
                            Navigator.pop(context);
                            _showMoreOptions(context, w, isDark);
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Section 2: ORDER & WAREHOUSE INFO
                    Text(
                      'ORDER & WAREHOUSE INFO',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.8,
                        color: isDark ? const Color(0xFF818CF8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? WholesalerColors.border(isDark)
                              : const Color(0xFFE2E8F0),
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          _InfoRow(
                            icon: Icons.warehouse_rounded,
                            iconColor: const Color(0xFF6366F1),
                            bgColor: const Color(0xFFEEF2FF),
                            label: 'Warehouse',
                            value: w.selectedWarehouse.isNotEmpty
                                ? w.selectedWarehouse
                                : 'All Warehouses',
                            isDark: isDark,
                            onTap: () =>
                                WholesalerFooterBar._pickWarehouse(context, w, isDark),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.person_rounded,
                            iconColor: const Color(0xFF3B82F6),
                            bgColor: const Color(0xFFDBEAFE),
                            label: 'Sales Rep',
                            value: w.salesRep.isNotEmpty ? w.salesRep : 'John Smith',
                            isDark: isDark,
                            onTap: () =>
                                WholesalerFooterBar._pickSalesRep(context, w, isDark),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.calendar_today_rounded,
                            iconColor: const Color(0xFFF59E0B),
                            bgColor: const Color(0xFFFEF3C7),
                            label: 'Delivery Date',
                            value: w.deliveryDate,
                            isDark: isDark,
                            onTap: () => _pickDeliveryDate(context, w),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.local_shipping_rounded,
                            iconColor: const Color(0xFF10B981),
                            bgColor: const Color(0xFFD1FAE5),
                            label: 'Delivery Method',
                            value: w.deliveryMethod.isNotEmpty
                                ? w.deliveryMethod
                                : 'Our Delivery',
                            isDark: isDark,
                            onTap: () =>
                                WholesalerFooterBar._pickDeliveryMethod(context, w, isDark),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.credit_card_rounded,
                            iconColor: const Color(0xFF8B5CF6),
                            bgColor: const Color(0xFFEDE9FE),
                            label: 'Payment Term',
                            value: w.paymentTerm.isNotEmpty ? w.paymentTerm : '30 Days',
                            isDark: isDark,
                            onTap: () =>
                                WholesalerFooterBar._pickPaymentTerm(context, w, isDark),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.percent_rounded,
                            iconColor: const Color(0xFF06B6D4),
                            bgColor: const Color(0xFFCFFAFE),
                            label: 'Commission',
                            value:
                                '${w.commission}% (৳${w.commissionAmount.toStringAsFixed(0)})',
                            isDark: isDark,
                            onTap: () => _pickCommission(context, w, isDark),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.edit_note_rounded,
                            iconColor: const Color(0xFF64748B),
                            bgColor: const Color(0xFFF1F5F9),
                            label: 'Note',
                            value: w.note.isNotEmpty ? w.note : 'Add Note',
                            isDark: isDark,
                            onTap: () => _pickNote(context, w, isDark),
                          ),
                          _infoDivider(isDark),
                          _InfoRow(
                            icon: Icons.attach_file_rounded,
                            iconColor: const Color(0xFF64748B),
                            bgColor: const Color(0xFFF1F5F9),
                            label: 'Attachments',
                            value: '${w.attachmentsCount} Files',
                            isDark: isDark,
                            onTap: () => _pickAttachments(context, w, isDark),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 1,
      color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFF1F5F9),
    );
  }

  static Future<void> _pickDeliveryDate(
      BuildContext context, WholesalerProvider w) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 3)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null && context.mounted) {
      final formatted = DateFormat('dd MMM, yyyy • 10:00 AM').format(picked);
      w.setDeliveryDate(formatted);
      WholesalerFooterBar._snack(context, 'Delivery Date set to $formatted');
    }
  }

  static void _pickCommission(
      BuildContext context, WholesalerProvider w, bool isDark) {
    final controller = TextEditingController(text: w.commission.toString());
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(
          'Set Commission (%)',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF10213D),
          ),
        ),
        content: TextField(
          controller: controller,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            hintText: 'Enter commission %',
            suffixText: '%',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final val = double.tryParse(controller.text);
              if (val != null) {
                w.setCommission(val);
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  static void _pickNote(
      BuildContext context, WholesalerProvider w, bool isDark) {
    final controller = TextEditingController(text: w.note);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(
          'Order Note',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF10213D),
          ),
        ),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'Add instructions, delivery remarks...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              w.setNote(controller.text.trim());
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  static void _pickAttachments(
      BuildContext context, WholesalerProvider w, bool isDark) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(
          'Attachments',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF10213D),
          ),
        ),
        content: Text(
          'Attach PO documents, invoice slips, or delivery challans.\nCurrent: ${w.attachmentsCount} files attached.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              w.setAttachmentsCount(w.attachmentsCount + 1);
              Navigator.pop(context);
              WholesalerFooterBar._snack(context, 'Challan attached successfully');
            },
            icon: const Icon(Icons.upload_file_rounded, size: 16),
            label: const Text('Add File'),
          ),
        ],
      ),
    );
  }

  static void _showQuotations(
      BuildContext context, WholesalerProvider w, bool isDark) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            const Icon(Icons.request_quote_rounded,
                color: Color(0xFFA855F7), size: 22),
            const SizedBox(width: 8),
            Text(
              'Quotations',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF10213D),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Create a new quotation for ${w.customer.name.isNotEmpty ? w.customer.name : "selected customer"} or view past quotations.',
              style: TextStyle(
                fontSize: 13,
                color:
                    isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF111827) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark
                      ? WholesalerColors.border(isDark)
                      : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Active Quotations',
                      style:
                          TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E8FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text('3 Pending',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFFA855F7))),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              WholesalerFooterBar._snack(
                  context, 'Quotation draft saved for ${w.customer.name}');
            },
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text('Save as Quote'),
          ),
        ],
      ),
    );
  }

  static void _showStockTransfer(
      BuildContext context, WholesalerProvider w, bool isDark) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            const Icon(Icons.swap_horiz_rounded,
                color: Color(0xFF10B981), size: 22),
            const SizedBox(width: 8),
            Text(
              'Stock Transfer',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF10213D),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Transfer stock between warehouses or retail branches.',
              style: TextStyle(
                fontSize: 13,
                color:
                    isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Source: ${w.selectedWarehouse}\nDestination: WH-02 Annex',
              style: const TextStyle(
                  fontWeight: FontWeight.w600, fontSize: 13, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              WholesalerFooterBar._snack(context, 'Transfer request initiated');
            },
            child: const Text('Initiate Transfer'),
          ),
        ],
      ),
    );
  }

  static void _showReturns(
      BuildContext context, WholesalerProvider w, bool isDark) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            const Icon(Icons.replay_rounded,
                color: Color(0xFFEF4444), size: 22),
            const SizedBox(width: 8),
            Text(
              'Returns & Damage',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF10213D),
              ),
            ),
          ],
        ),
        content: Text(
          'Process return against past sales order or damaged goods for ${w.customer.name.isNotEmpty ? w.customer.name : "customer"}.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444)),
            onPressed: () {
              Navigator.pop(context);
              WholesalerFooterBar._snack(
                  context, 'Return processing module initiated');
            },
            child: const Text('Start Return'),
          ),
        ],
      ),
    );
  }

  static void _showExpense(
      BuildContext context, WholesalerProvider w, bool isDark) {
    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Row(
          children: [
            const Icon(Icons.add_card_rounded,
                color: Color(0xFFEC4899), size: 22),
            const SizedBox(width: 8),
            Text(
              'Add Expense',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF10213D),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleCtrl,
              decoration: const InputDecoration(
                labelText: 'Expense Category / Reason',
                hintText: 'e.g. Loading Labor, Packaging',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: amountCtrl,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Amount (৳)',
                hintText: '0.00',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEC4899)),
            onPressed: () {
              final amt = double.tryParse(amountCtrl.text) ?? 0;
              Navigator.pop(context);
              WholesalerFooterBar._snack(
                  context, 'Expense of ৳$amt logged successfully');
            },
            child: const Text('Save Expense'),
          ),
        ],
      ),
    );
  }

  static void _showMoreOptions(
      BuildContext context, WholesalerProvider w, bool isDark) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        title: Text(
          'More Options',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : const Color(0xFF10213D),
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              dense: true,
              leading:
                  const Icon(Icons.print_rounded, color: Color(0xFF4F46E5)),
              title: const Text('Reprint Last Receipt'),
              onTap: () {
                Navigator.pop(context);
                WholesalerFooterBar._snack(context, 'Sending reprint command...');
              },
            ),
            ListTile(
              dense: true,
              leading: const Icon(Icons.price_change_rounded,
                  color: Color(0xFF00B67A)),
              title: const Text('Apply Batch Wholesale Price'),
              onTap: () {
                Navigator.pop(context);
                WholesalerFooterBar._snack(
                    context, 'Wholesale pricing rules updated');
              },
            ),
            ListTile(
              dense: true,
              leading:
                  const Icon(Icons.refresh_rounded, color: Color(0xFFF59E0B)),
              title: const Text('Sync Catalog & Stock'),
              onTap: () {
                Navigator.pop(context);
                WholesalerFooterBar._snack(context, 'Catalog synchronizing...');
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// QUICK ACTION CARD (Matching Screenshot 3x3 Grid)
// ─────────────────────────────────────────────────────────────────
class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String title;
  final String subtitle;
  final bool isDark;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.title,
    required this.subtitle,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            color: isDark ? WholesalerColors.cardBg(isDark) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark
                  ? WholesalerColors.border(isDark)
                  : const Color(0xFFE2E8F0),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Center(
                  child: Icon(icon, color: iconColor, size: 20),
                ),
              ),
              const SizedBox(height: 7),
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? const Color(0xFF94A3B8)
                      : const Color(0xFF64748B),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// INFO ROW (Matching Screenshot Order & Warehouse Info Card)
// ─────────────────────────────────────────────────────────────────
class _InfoRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final String value;
  final bool isDark;
  final VoidCallback onTap;

  const _InfoRow({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.value,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isDark ? iconColor.withValues(alpha: 0.18) : bgColor,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Center(
                  child: Icon(icon, size: 16, color: iconColor),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? const Color(0xFF94A3B8)
                      : const Color(0xFF64748B),
                ),
              ),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
