import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import 'wholesaler_dialogs.dart';

// ─────────────────────────────────────────────────────────────────
// RIGHT PANEL: ORDER ITEMS + PRICING SUMMARY
// ─────────────────────────────────────────────────────────────────
class WholesalerOrderPanel extends StatelessWidget {
  const WholesalerOrderPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    return Container(
      decoration: WholesalerColors.card3dDecoration(isDark),
      child: Column(
        children: [
          const _OrderPanelHeader(),
          const Divider(height: 1),
          const Expanded(child: _OrderItemsList()),
          const Divider(height: 1),
          const _PricingSummary(),
          const SizedBox(height: 2),
          const _ActionButtons(),
        ],
      ),
    );
  }
}

// ── Panel Header ─────────────────────────────────────────────────
class _OrderPanelHeader extends StatelessWidget {
  const _OrderPanelHeader();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              gradient: WholesalerColors.primaryGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 14),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Order Items (${w.totalItems})',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: WholesalerColors.textPrimary(isDark),
              ),
            ),
          ),
          // Scan item
          _SmallBtn(
            icon: Icons.qr_code_scanner_rounded,
            label: 'Scan Item',
            color: WholesalerColors.primary,
            isDark: isDark,
            onTap: () => _snack(context, '📷 Scan Item activated'),
          ),
          const SizedBox(width: 6),
          // Clear
          if (w.items.isNotEmpty)
            GestureDetector(
              onTap: () => _confirmClear(context, w),
              child: Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: WholesalerColors.accentRed.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                      color: WholesalerColors.accentRed.withValues(alpha: 0.3)),
                ),
                child: Icon(Icons.delete_outline_rounded,
                    size: 16, color: WholesalerColors.accentRed),
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
    ));
  }

  Future<void> _confirmClear(BuildContext context, WholesalerProvider w) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Clear Order?'),
        content: const Text('All order items will be removed.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: WholesalerColors.accentRed),
            child: const Text('Clear', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true) w.clearOrder();
  }
}

class _SmallBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isDark;
  final VoidCallback onTap;
  const _SmallBtn({required this.icon, required this.label, required this.color, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
          ],
        ),
      ),
    );
  }
}

// ── Order Items List ─────────────────────────────────────────────
class _OrderItemsList extends StatelessWidget {
  const _OrderItemsList();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    if (w.items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inventory_2_outlined, size: 40,
                color: WholesalerColors.textSecondary(isDark)),
            const SizedBox(height: 10),
            Text('No items added',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: WholesalerColors.textSecondary(isDark),
                )),
            const SizedBox(height: 4),
            Text('Click product cards to add',
                style: TextStyle(
                  fontSize: 11,
                  color: WholesalerColors.textSecondary(isDark).withValues(alpha: 0.6),
                )),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      itemCount: w.items.length,
      separatorBuilder: (_, _) => Divider(
          height: 1, color: WholesalerColors.divider(isDark)),
      itemBuilder: (_, i) => _OrderItemRow(
        item: w.items[i],
        isDark: isDark,
        index: i,
      ),
    );
  }
}

class _OrderItemRow extends StatefulWidget {
  final WOrderItem item;
  final bool isDark;
  final int index;
  const _OrderItemRow({required this.item, required this.isDark, required this.index});

  @override
  State<_OrderItemRow> createState() => _OrderItemRowState();
}

class _OrderItemRowState extends State<_OrderItemRow>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 280));
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween<Offset>(begin: const Offset(0.3, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _ctrl.forward();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final isDark = widget.isDark;
    final p = item.product;
    final w = context.read<WholesalerProvider>();

    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              // Thumbnail
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 38,
                  height: 38,
                  color: WholesalerColors.primary.withValues(alpha: 0.08),
                  child: Center(child: Text(p.emoji, style: const TextStyle(fontSize: 20))),
                ),
              ),
              const SizedBox(width: 8),
              // Name + SKU
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: WholesalerColors.textPrimary(isDark),
                      ),
                    ),
                    Text(
                      'SKU: ${p.sku}  •  ${p.warehouseId}',
                      style: TextStyle(
                        fontSize: 8.5,
                        color: WholesalerColors.textSecondary(isDark),
                      ),
                    ),
                    // Qty stepper
                    const SizedBox(height: 4),
                    _QtyRow(item: item, isDark: isDark, w: w),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Price + total
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '৳${item.unitPrice.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 11,
                      color: WholesalerColors.textSecondary(isDark),
                    ),
                  ),
                  Text(
                    '৳${item.lineTotal.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: WholesalerColors.textPrimary(isDark),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 4),
              // Remove
              GestureDetector(
                onTap: () => w.removeItem(p.id),
                child: Icon(Icons.close_rounded,
                    size: 16,
                    color: WholesalerColors.textSecondary(isDark)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QtyRow extends StatelessWidget {
  final WOrderItem item;
  final bool isDark;
  final WholesalerProvider w;
  const _QtyRow({required this.item, required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _QtyBtn(
          icon: Icons.remove_rounded,
          onTap: () => w.decrementQty(item.product.id),
          color: WholesalerColors.accentRed,
          isDark: isDark,
        ),
        const SizedBox(width: 6),
        Text(
          item.qty.toString(),
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: WholesalerColors.textPrimary(isDark),
          ),
        ),
        const SizedBox(width: 6),
        _QtyBtn(
          icon: Icons.add_rounded,
          onTap: () => w.incrementQty(item.product.id),
          color: WholesalerColors.accentGreen,
          isDark: isDark,
        ),
      ],
    );
  }
}

class _QtyBtn extends StatefulWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  final bool isDark;
  const _QtyBtn({required this.icon, required this.onTap, required this.color, required this.isDark});

  @override
  State<_QtyBtn> createState() => _QtyBtnState();
}

class _QtyBtnState extends State<_QtyBtn> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.88 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: widget.color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(5),
            border: Border.all(color: widget.color.withValues(alpha: 0.35)),
          ),
          child: Icon(widget.icon, size: 12, color: widget.color),
        ),
      ),
    );
  }
}

// ── Pricing Summary ──────────────────────────────────────────────
class _PricingSummary extends StatelessWidget {
  const _PricingSummary();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final fmt = NumberFormat('#,##0.00');

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 4),
      child: Column(
        children: [
          _SummaryRow(label: 'Subtotal', value: '৳${fmt.format(w.subtotal)}', isDark: isDark),
          const SizedBox(height: 4),
          // Discount row with control
          Row(
            children: [
              Text('Discount',
                  style: TextStyle(
                    fontSize: 12,
                    color: WholesalerColors.textSecondary(isDark),
                  )),
              const SizedBox(width: 6),
              // Flat badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: WholesalerColors.border(isDark),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Flat',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: WholesalerColors.textSecondary(isDark),
                        )),
                    const SizedBox(width: 3),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 10,
                        color: WholesalerColors.textSecondary(isDark)),
                  ],
                ),
              ),
              const Spacer(),
              Text(
                '-৳${fmt.format(w.discountFlat)}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: WholesalerColors.accentRed,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          _SummaryRow(
            label: 'Tax (${(w.taxRate * 100).toStringAsFixed(1)}%)',
            value: '৳${fmt.format(w.taxAmount)}',
            isDark: isDark,
          ),
          const SizedBox(height: 4),
          _SummaryRow(label: 'Shipping', value: '৳${fmt.format(w.shippingCost)}', isDark: isDark),
          const SizedBox(height: 8),
          Divider(color: WholesalerColors.border(isDark)),
          // Grand Total
          Row(
            children: [
              Text('Total Amount',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: WholesalerColors.textSecondary(isDark),
                  )),
              const Spacer(),
              Text(
                '৳${fmt.format(w.grandTotal)}',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: WholesalerColors.primary,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  const _SummaryRow({required this.label, required this.value, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(label,
            style: TextStyle(
              fontSize: 12,
              color: WholesalerColors.textSecondary(isDark),
            )),
        const Spacer(),
        Text(value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: WholesalerColors.textPrimary(isDark),
            )),
      ],
    );
  }
}

// ── Action Buttons ────────────────────────────────────────────────
class _ActionButtons extends StatefulWidget {
  const _ActionButtons();

  @override
  State<_ActionButtons> createState() => _ActionButtonsState();
}

class _ActionButtonsState extends State<_ActionButtons> {
  bool _holdPressed = false;
  bool _deliveryPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 14),
      child: Row(
        children: [
          // Hold Order
          Expanded(
            child: GestureDetector(
              onTapDown: (_) => setState(() => _holdPressed = true),
              onTapUp: (_) => setState(() => _holdPressed = false),
              onTapCancel: () => setState(() => _holdPressed = false),
              onTap: () {
                if (context.read<WholesalerProvider>().items.isEmpty) {
                  _snack(context, 'Add items to hold an order');
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
              child: AnimatedScale(
                scale: _holdPressed ? 0.96 : 1,
                duration: const Duration(milliseconds: 100),
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: isDark
                        ? WholesalerColors.inputBg(true)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: WholesalerColors.primary.withValues(alpha: 0.4),
                      width: 1.5,
                    ),
                    boxShadow: WholesalerColors.softShadow(isDark),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: BoxDecoration(
                          color: WholesalerColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: Icon(Icons.pause_rounded,
                            size: 14, color: WholesalerColors.primary),
                      ),
                      const SizedBox(width: 7),
                      Text('Hold Order',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: WholesalerColors.primary,
                          )),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Proceed to Delivery
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTapDown: (_) => setState(() => _deliveryPressed = true),
              onTapUp: (_) => setState(() => _deliveryPressed = false),
              onTapCancel: () => setState(() => _deliveryPressed = false),
              onTap: () {
                if (context.read<WholesalerProvider>().items.isEmpty) {
                  _snack(context, 'Add items to proceed');
                  return;
                }
                showDialog(
                  context: context,
                  builder: (_) => ChangeNotifierProvider.value(
                    value: context.read<WholesalerProvider>(),
                    child: const WOrderConfirmDialog(),
                  ),
                );
              },
              child: AnimatedScale(
                scale: _deliveryPressed ? 0.96 : 1,
                duration: const Duration(milliseconds: 100),
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    gradient: WholesalerColors.deliveryGradient,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: WholesalerColors.primary.withValues(alpha: 0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.local_shipping_rounded,
                          size: 16, color: Colors.white),
                      SizedBox(width: 7),
                      Text('Proceed to Delivery',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          )),
                      SizedBox(width: 6),
                      Icon(Icons.arrow_forward_rounded,
                          size: 14, color: Colors.white),
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

  void _snack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: WholesalerColors.accentRed,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }
}
