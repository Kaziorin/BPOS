import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import 'wholesaler_dialogs.dart';
import '../../../core/widgets/live_sales_history_dialog.dart';

// ─────────────────────────────────────────────────────────────────
// BOTTOM FOOTER: Quick Actions + Order Meta Info
// ─────────────────────────────────────────────────────────────────
class WholesalerFooterBar extends StatelessWidget {
  const WholesalerFooterBar({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(
        color: isDark
            ? WholesalerColors.inputBg(true).withValues(alpha: 0.8)
            : Colors.white,
        border: Border(top: BorderSide(color: WholesalerColors.border(isDark))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.06),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Row 1: Quick Actions
          _QuickActionsRow(isDark: isDark, w: w, isMobile: isMobile),
          Container(
            height: 1,
            color: WholesalerColors.divider(isDark).withValues(alpha: 0.5),
          ),
          // Row 2: Order Metadata
          _OrderMetaRow(isDark: isDark, w: w),
        ],
      ),
    );
  }
}

// ── Quick Actions Row ─────────────────────────────────────────────
class _QuickActionsRow extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool isMobile;
  const _QuickActionsRow({required this.isDark, required this.w, required this.isMobile});

  @override
  Widget build(BuildContext context) {
    final actions = [
      _FooterAction(
        icon: Icons.person_add_rounded,
        label: 'Customer',
        sublabel: 'Add / Search',
        color: WholesalerColors.primary,
        onTap: () => showDialog(
          context: context,
          builder: (_) => ChangeNotifierProvider.value(
            value: context.read<WholesalerProvider>(),
            child: const WCustomerDialog(),
          ),
        ),
      ),
      _FooterAction(
        icon: Icons.pause_circle_rounded,
        label: 'Hold Order',
        sublabel: 'Park Current Order',
        color: WholesalerColors.accentOrange,
        onTap: () {
          if (context.read<WholesalerProvider>().items.isEmpty) {
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
      _FooterAction(
        icon: Icons.history_rounded,
        label: 'Recent Orders',
        sublabel: 'View All',
        color: const Color(0xFF3B82F6),
        onTap: () => showLiveSalesHistoryDialog(context, businessType: 'wholesaler'),
      ),
      _FooterAction(
        icon: Icons.request_quote_rounded,
        label: 'Quotations',
        sublabel: 'Create / View',
        color: const Color(0xFF8B5CF6),
        onTap: () => _snack(context, '📋 Quotation module opening...'),
      ),
      _FooterAction(
        icon: Icons.swap_horiz_rounded,
        label: 'Stock Transfer',
        sublabel: 'Between Warehouses',
        color: const Color(0xFF10B981),
        onTap: () => _snack(context, '🔄 Stock Transfer module opening...'),
      ),
      _FooterAction(
        icon: Icons.receipt_rounded,
        label: 'Sales History',
        sublabel: 'View Transactions',
        color: const Color(0xFF0EA5E9),
        onTap: () => showLiveSalesHistoryDialog(context, businessType: 'wholesaler'),
      ),
      _FooterAction(
        icon: Icons.undo_rounded,
        label: 'Returns',
        sublabel: 'Manage Returns',
        color: const Color(0xFFEF4444),
        onTap: () => _snack(context, '↩️ Returns module opening...'),
      ),
      _FooterAction(
        icon: Icons.add_card_rounded,
        label: 'Expense',
        sublabel: 'Add Expense',
        color: const Color(0xFFD946EF),
        onTap: () => _snack(context, '💳 Expense module opening...'),
      ),
      _FooterAction(
        icon: Icons.more_horiz_rounded,
        label: 'More',
        sublabel: 'Options',
        color: WholesalerColors.textSecondary(isDark),
        onTap: () => _snack(context, 'More options available'),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final useExpanded = constraints.maxWidth >= 700;
        if (useExpanded) {
          return Padding(
            padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
            child: Row(
              children: [
                for (int i = 0; i < actions.length; i++) ...[
                  if (i > 0) const SizedBox(width: 5),
                  Expanded(
                    child: _FooterBtn(action: actions[i], isDark: isDark),
                  ),
                ],
              ],
            ),
          );
        }
        return Container(
          width: double.infinity,
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                for (int i = 0; i < actions.length; i++) ...[
                  if (i > 0) const SizedBox(width: 6),
                  _FooterBtn(action: actions[i], isDark: isDark),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  void _snack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: WholesalerColors.primary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 2),
    ));
  }
}

class _FooterAction {
  final IconData icon;
  final String label;
  final String sublabel;
  final Color color;
  final VoidCallback onTap;
  const _FooterAction({
    required this.icon,
    required this.label,
    required this.sublabel,
    required this.color,
    required this.onTap,
  });
}

class _FooterBtn extends StatefulWidget {
  final _FooterAction action;
  final bool isDark;
  const _FooterBtn({required this.action, required this.isDark});

  @override
  State<_FooterBtn> createState() => _FooterBtnState();
}

class _FooterBtnState extends State<_FooterBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final a = widget.action;
    final isDark = widget.isDark;

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: a.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.94 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
          decoration: BoxDecoration(
            color: a.color.withValues(alpha: isDark ? 0.12 : 0.07),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: a.color.withValues(alpha: 0.22), width: 0.8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.max,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: a.color.withValues(alpha: isDark ? 0.22 : 0.14),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Center(
                  child: Icon(a.icon, size: 12.5, color: a.color),
                ),
              ),
              const SizedBox(width: 5),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        a.label,
                        maxLines: 1,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: WholesalerColors.textPrimary(isDark),
                          letterSpacing: -0.1,
                        ),
                      ),
                    ),
                    if (a.sublabel.isNotEmpty)
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          a.sublabel,
                          maxLines: 1,
                          style: TextStyle(
                            fontSize: 7.5,
                            fontWeight: FontWeight.w500,
                            color: WholesalerColors.textSecondary(isDark),
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
    );
  }
}

// ── Order Meta Info Row ───────────────────────────────────────────
class _OrderMetaRow extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _OrderMetaRow({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    final metaItems = [
      _MetaItem(
        Icons.warehouse_rounded,
        'Warehouse',
        w.selectedWarehouse,
        WholesalerColors.primary,
        onTap: () => _pickWarehouse(context, w, isDark),
      ),
      _MetaItem(
        Icons.person_rounded,
        'Sales Rep',
        w.salesRep,
        const Color(0xFF3B82F6),
        onTap: () => _pickSalesRep(context, w, isDark),
      ),
      _MetaItem(
        Icons.calendar_today_rounded,
        'Delivery Date',
        '20 May, 2025 • 10:00 AM',
        const Color(0xFFEA580C),
        onTap: () => _pickDeliveryDate(context, isDark),
      ),
      _MetaItem(
        Icons.local_shipping_rounded,
        'Delivery Method',
        w.deliveryMethod,
        const Color(0xFF10B981),
        onTap: () => _pickDeliveryMethod(context, w, isDark),
      ),
      _MetaItem(
        Icons.credit_card_rounded,
        'Payment Term',
        w.paymentTerm,
        const Color(0xFF8B5CF6),
        onTap: () => _pickPaymentTerm(context, w, isDark),
      ),
      _MetaItem(
        Icons.percent_rounded,
        'Commission',
        '${w.commission}% (৳${w.commissionAmount.toStringAsFixed(0)})',
        const Color(0xFF0EA5E9),
        onTap: () => _snack(context, '📊 Commission: ${w.commission}% on this order'),
      ),
      _MetaItem(
        Icons.note_alt_rounded,
        'Note',
        w.note.isEmpty ? 'Add Note' : w.note,
        WholesalerColors.textSecondary(isDark),
        onTap: () => _editNote(context, w, isDark),
      ),
      _MetaItem(
        Icons.attach_file_rounded,
        'Attachments',
        '0 Files',
        WholesalerColors.textSecondary(isDark),
        onTap: () => _snack(context, '📎 Attachments (Challan, PO, Tax Documents)'),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final useExpanded = constraints.maxWidth >= 700;
        if (useExpanded) {
          return Padding(
            padding: const EdgeInsets.fromLTRB(10, 4, 10, 6),
            child: Row(
              children: [
                for (int i = 0; i < metaItems.length; i++) ...[
                  if (i > 0) const SizedBox(width: 5),
                  Expanded(
                    flex: i == 2 ? 14 : 10,
                    child: _MetaChip(item: metaItems[i], isDark: isDark),
                  ),
                ],
              ],
            ),
          );
        }
        return Container(
          width: double.infinity,
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.fromLTRB(10, 4, 10, 6),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                for (int i = 0; i < metaItems.length; i++) ...[
                  if (i > 0) const SizedBox(width: 6),
                  _MetaChip(item: metaItems[i], isDark: isDark),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  void _snack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: WholesalerColors.primary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 2),
    ));
  }

  void _pickWarehouse(BuildContext context, WholesalerProvider w, bool isDark) {
    const warehouses = ['All Warehouses', 'WH-01 Main', 'WH-02 Annex', 'WH-03 Cold Store'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: WholesalerColors.cardBg(isDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Select Warehouse',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: WholesalerColors.textPrimary(isDark))),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: warehouses
              .map((wh) => ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    leading: Icon(Icons.warehouse_rounded,
                        color: w.selectedWarehouse == wh ? WholesalerColors.primary : WholesalerColors.textSecondary(isDark)),
                    title: Text(wh,
                        style: TextStyle(
                            fontWeight: w.selectedWarehouse == wh ? FontWeight.w700 : FontWeight.w500,
                            color: w.selectedWarehouse == wh ? WholesalerColors.primary : WholesalerColors.textPrimary(isDark))),
                    trailing: w.selectedWarehouse == wh
                        ? Icon(Icons.check_circle_rounded, color: WholesalerColors.primary, size: 18)
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

  void _pickSalesRep(BuildContext context, WholesalerProvider w, bool isDark) {
    const reps = ['John Smith', 'Sarah Connor', 'Michael Scott', 'David Miller'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: WholesalerColors.cardBg(isDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Select Sales Representative',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: WholesalerColors.textPrimary(isDark))),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: reps
              .map((rep) => ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    leading: Icon(Icons.person_rounded,
                        color: w.salesRep == rep ? const Color(0xFF3B82F6) : WholesalerColors.textSecondary(isDark)),
                    title: Text(rep,
                        style: TextStyle(
                            fontWeight: w.salesRep == rep ? FontWeight.w700 : FontWeight.w500,
                            color: w.salesRep == rep ? const Color(0xFF3B82F6) : WholesalerColors.textPrimary(isDark))),
                    trailing: w.salesRep == rep
                        ? const Icon(Icons.check_circle_rounded, color: Color(0xFF3B82F6), size: 18)
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

  Future<void> _pickDeliveryDate(BuildContext context, bool isDark) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null && context.mounted) {
      _snack(context, 'Delivery Date set to ${picked.day}/${picked.month}/${picked.year}');
    }
  }

  void _pickDeliveryMethod(BuildContext context, WholesalerProvider w, bool isDark) {
    const methods = ['Our Delivery', 'Customer Pickup', 'Courier / Freight', 'Express Cargo'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: WholesalerColors.cardBg(isDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Delivery Method',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: WholesalerColors.textPrimary(isDark))),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: methods
              .map((m) => ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    leading: Icon(Icons.local_shipping_rounded,
                        color: w.deliveryMethod == m ? const Color(0xFF10B981) : WholesalerColors.textSecondary(isDark)),
                    title: Text(m,
                        style: TextStyle(
                            fontWeight: w.deliveryMethod == m ? FontWeight.w700 : FontWeight.w500,
                            color: w.deliveryMethod == m ? const Color(0xFF10B981) : WholesalerColors.textPrimary(isDark))),
                    trailing: w.deliveryMethod == m
                        ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18)
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

  void _pickPaymentTerm(BuildContext context, WholesalerProvider w, bool isDark) {
    const terms = ['Immediate Cash', '15 Days', '30 Days', '45 Days', '60 Days'];
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: WholesalerColors.cardBg(isDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Payment Term',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: WholesalerColors.textPrimary(isDark))),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: terms
              .map((t) => ListTile(
                    dense: true,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    leading: Icon(Icons.credit_card_rounded,
                        color: w.paymentTerm == t ? const Color(0xFF8B5CF6) : WholesalerColors.textSecondary(isDark)),
                    title: Text(t,
                        style: TextStyle(
                            fontWeight: w.paymentTerm == t ? FontWeight.w700 : FontWeight.w500,
                            color: w.paymentTerm == t ? const Color(0xFF8B5CF6) : WholesalerColors.textPrimary(isDark))),
                    trailing: w.paymentTerm == t
                        ? const Icon(Icons.check_circle_rounded, color: Color(0xFF8B5CF6), size: 18)
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

  void _editNote(BuildContext context, WholesalerProvider w, bool isDark) {
    final ctrl = TextEditingController(text: w.note);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: WholesalerColors.cardBg(isDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Order Note',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: WholesalerColors.textPrimary(isDark))),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'Enter order instructions or notes...',
            hintStyle: TextStyle(color: WholesalerColors.textSecondary(isDark)),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              w.setNote(ctrl.text.trim());
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: WholesalerColors.primary),
            child: const Text('Save Note', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _MetaItem {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final VoidCallback? onTap;
  const _MetaItem(this.icon, this.label, this.value, this.color, {this.onTap});
}

class _MetaChip extends StatefulWidget {
  final _MetaItem item;
  final bool isDark;
  const _MetaChip({required this.item, required this.isDark});

  @override
  State<_MetaChip> createState() => _MetaChipState();
}

class _MetaChipState extends State<_MetaChip> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final isDark = widget.isDark;

    return MouseRegion(
      cursor: item.onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: item.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
          decoration: BoxDecoration(
            color: _hovered
                ? item.color.withValues(alpha: isDark ? 0.2 : 0.12)
                : (isDark
                    ? const Color(0xFF1E1B4B).withValues(alpha: 0.6)
                    : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: _hovered
                  ? item.color.withValues(alpha: 0.5)
                  : (isDark
                      ? const Color(0xFF312E81)
                      : const Color(0xFFE2E8F0)),
              width: 0.8,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.max,
            children: [
              Container(
                padding: const EdgeInsets.all(3.5),
                decoration: BoxDecoration(
                  color: item.color.withValues(alpha: isDark ? 0.22 : 0.12),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Icon(item.icon, size: 11, color: item.color),
              ),
              const SizedBox(width: 5),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        item.label,
                        maxLines: 1,
                        style: TextStyle(
                          fontSize: 7.5,
                          fontWeight: FontWeight.w600,
                          color: WholesalerColors.textSecondary(isDark),
                        ),
                      ),
                    ),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        item.value,
                        maxLines: 1,
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: WholesalerColors.textPrimary(isDark),
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
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// MOBILE BOTTOM SHEET: Full Footer Options Modal
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
    final maxH = MediaQuery.of(context).size.height * 0.82;

    final actions = [
      (
        Icons.person_add_rounded,
        'Customer',
        'Add / Search',
        WholesalerColors.primary,
        () {
          Navigator.pop(context);
          showDialog(
            context: context,
            builder: (_) => ChangeNotifierProvider.value(
              value: w,
              child: const WCustomerDialog(),
            ),
          );
        }
      ),
      (
        Icons.pause_circle_rounded,
        'Hold Order',
        'Park Current',
        WholesalerColors.accentOrange,
        () {
          Navigator.pop(context);
          if (w.items.isEmpty) {
            _snack(context, 'Add items first to hold an order');
            return;
          }
          showDialog(
            context: context,
            builder: (_) => ChangeNotifierProvider.value(
              value: w,
              child: const WHoldOrderDialog(),
            ),
          );
        }
      ),
      (
        Icons.history_rounded,
        'Recent Orders',
        'View All',
        const Color(0xFF3B82F6),
        () {
          Navigator.pop(context);
          showDialog(
            context: context,
            builder: (_) => ChangeNotifierProvider.value(
              value: w,
              child: const WRecentOrdersDialog(),
            ),
          );
        }
      ),
      (
        Icons.request_quote_rounded,
        'Quotations',
        'Create / View',
        const Color(0xFF8B5CF6),
        () {
          Navigator.pop(context);
          _snack(context, '📋 Quotation module opening...');
        }
      ),
      (
        Icons.swap_horiz_rounded,
        'Stock Transfer',
        'Warehouses',
        const Color(0xFF10B981),
        () {
          Navigator.pop(context);
          _snack(context, '🔄 Stock Transfer module opening...');
        }
      ),
      (
        Icons.receipt_rounded,
        'Sales History',
        'Transactions',
        const Color(0xFF0EA5E9),
        () {
          Navigator.pop(context);
          showDialog(
            context: context,
            builder: (_) => ChangeNotifierProvider.value(
              value: w,
              child: const WRecentOrdersDialog(),
            ),
          );
        }
      ),
      (
        Icons.undo_rounded,
        'Returns',
        'Manage',
        const Color(0xFFEF4444),
        () {
          Navigator.pop(context);
          _snack(context, '↩️ Returns module opening...');
        }
      ),
      (
        Icons.add_card_rounded,
        'Expense',
        'Add Expense',
        const Color(0xFFD946EF),
        () {
          Navigator.pop(context);
          _snack(context, '💳 Expense module opening...');
        }
      ),
      (
        Icons.more_horiz_rounded,
        'More',
        'Options',
        WholesalerColors.textSecondary(isDark),
        () {
          Navigator.pop(context);
          _snack(context, 'More wholesale options...');
        }
      ),
    ];

    final meta = [
      (Icons.warehouse_rounded, 'Warehouse', w.selectedWarehouse, WholesalerColors.primary),
      (Icons.person_rounded, 'Sales Rep', w.salesRep, const Color(0xFF3B82F6)),
      (Icons.calendar_today_rounded, 'Delivery Date', '20 May, 2025 • 10:00 AM', const Color(0xFFEA580C)),
      (Icons.local_shipping_rounded, 'Delivery Method', w.deliveryMethod, const Color(0xFF10B981)),
      (Icons.credit_card_rounded, 'Payment Term', w.paymentTerm, const Color(0xFF8B5CF6)),
      (Icons.percent_rounded, 'Commission', '${w.commission}% (৳${w.commissionAmount.toStringAsFixed(0)})', const Color(0xFF0EA5E9)),
      (Icons.note_alt_rounded, 'Note', w.note.isEmpty ? 'Add Note' : w.note, WholesalerColors.textSecondary(isDark)),
      (Icons.attach_file_rounded, 'Attachments', '0 Files', WholesalerColors.textSecondary(isDark)),
    ];

    return Container(
      constraints: BoxConstraints(maxHeight: maxH),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF121034) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.6 : 0.15),
            blurRadius: 30,
            offset: const Offset(0, -6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.2)
                    : Colors.black.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 12, 10),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    gradient: WholesalerColors.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.dashboard_customize_rounded,
                    size: 16,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Quick Actions & Options',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: WholesalerColors.textPrimary(isDark),
                      ),
                    ),
                    Text(
                      'Manage customer, orders, stock & reports',
                      style: TextStyle(
                        fontSize: 10,
                        color: WholesalerColors.textSecondary(isDark),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    Icons.close_rounded,
                    color: WholesalerColors.textSecondary(isDark),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Content
          Flexible(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Section 1: Quick Actions Title
                  Text(
                    'QUICK ACTIONS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: WholesalerColors.textSecondary(isDark),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Grid of 3x3 actions
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                      childAspectRatio: 1.1,
                    ),
                    itemCount: actions.length,
                    itemBuilder: (ctx, i) {
                      final a = actions[i];
                      return InkWell(
                        onTap: a.$5,
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1E1B4B)
                                : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.08)
                                  : const Color(0xFFE2E8F0),
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: a.$4.withValues(alpha: isDark ? 0.25 : 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(a.$1, size: 18, color: a.$4),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                a.$2,
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w700,
                                  color: WholesalerColors.textPrimary(isDark),
                                ),
                              ),
                              Text(
                                a.$3,
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 8,
                                  color: WholesalerColors.textSecondary(isDark),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 18),
                  // Section 2: Order Metadata
                  Text(
                    'ORDER & WAREHOUSE INFO',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.8,
                      color: WholesalerColors.textSecondary(isDark),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF1B1846)
                          : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.08)
                            : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Column(
                      children: [
                        for (int i = 0; i < meta.length; i++) ...[
                          if (i > 0)
                            Divider(
                              height: 14,
                              color: isDark
                                  ? Colors.white.withValues(alpha: 0.06)
                                  : const Color(0xFFE2E8F0),
                            ),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: meta[i].$4.withValues(alpha: isDark ? 0.2 : 0.1),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Icon(meta[i].$1, size: 13, color: meta[i].$4),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                meta[i].$2,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: WholesalerColors.textSecondary(isDark),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                meta[i].$3,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: WholesalerColors.textPrimary(isDark),
                                ),
                              ),
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
        ],
      ),
    );
  }

  void _snack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: WholesalerColors.primary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      duration: const Duration(seconds: 2),
    ));
  }
}

