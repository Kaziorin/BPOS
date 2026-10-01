import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import 'wholesaler_dialogs.dart';
import 'wholesaler_checkout_dialog.dart';

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
          const _OrderColumnHeaders(),
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

// ── Table Column Headers (ITEM, PRICE, QTY, TOTAL) ───────────────
class _OrderColumnHeaders extends StatelessWidget {
  const _OrderColumnHeaders();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final color = WholesalerColors.textSecondary(isDark);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFF8FAFF),
        border: Border(
          bottom: BorderSide(
            color: WholesalerColors.divider(isDark),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 6,
            child: Text(
              'ITEM',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: color,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              'PRICE',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: color,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              'QTY',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: color,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              'TOTAL',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: color,
              ),
            ),
          ),
          const SizedBox(width: 26), // Space for delete icon in row below
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

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? WholesalerColors.surfaceBg(isDark) : const Color(0xFFF5FAFE),
        border: Border(
          bottom: BorderSide(
            color: WholesalerColors.border(isDark),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: 'Order Items ',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF10213D),
                    ),
                  ),
                  TextSpan(
                    text: '(${w.totalItems})',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF146EF5),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Clear Cart
          if (w.items.isNotEmpty) ...[
            InkWell(
              onTap: () => _confirmClear(context, w),
              borderRadius: BorderRadius.circular(4),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF451A24) : const Color(0xFFFFF1F2),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: isDark ? const Color(0xFF881337) : const Color(0xFFFECDD3),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.delete_outline_rounded,
                      size: 13,
                      color: Color(0xFFE11D48),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Clear Cart',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 6),
          ],
          // Scan Item
          InkWell(
            onTap: () => _snack(context, '📷 Scan Item activated'),
            borderRadius: BorderRadius.circular(4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
              decoration: BoxDecoration(
                color: const Color(0xFF146EF5),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.crop_free_rounded,
                    size: 13,
                    color: Colors.white,
                  ),
                  SizedBox(width: 5),
                  Text(
                    'Scan Item',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
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
          height: 12, thickness: 1, color: WholesalerColors.divider(isDark)),
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
  late TextEditingController _qtyCtrl;
  late FocusNode _qtyFocus;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 280));
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween<Offset>(begin: const Offset(0.3, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _ctrl.forward();

    _qtyCtrl = TextEditingController(text: '${widget.item.qty}');
    _qtyFocus = FocusNode();
    _qtyFocus.addListener(_onFocusChange);
  }

  void _onFocusChange() {
    if (_qtyFocus.hasFocus) {
      _qtyCtrl.selection = TextSelection(
        baseOffset: 0,
        extentOffset: _qtyCtrl.text.length,
      );
    } else {
      _commitQty();
    }
  }

  void _commitQty() {
    final w = context.read<WholesalerProvider>();
    final parsed = int.tryParse(_qtyCtrl.text.trim());
    if (parsed != null && parsed > 0) {
      if (parsed != widget.item.qty) {
        w.setQty(widget.item.product.id, parsed);
      }
    } else {
      _qtyCtrl.text = '${widget.item.qty}';
    }
  }

  @override
  void didUpdateWidget(covariant _OrderItemRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_qtyFocus.hasFocus && _qtyCtrl.text != '${widget.item.qty}') {
      _qtyCtrl.text = '${widget.item.qty}';
    }
  }

  @override
  void dispose() {
    _qtyFocus.removeListener(_onFocusChange);
    _qtyFocus.dispose();
    _qtyCtrl.dispose();
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final isDark = widget.isDark;
    final p = item.product;
    final w = context.read<WholesalerProvider>();

    if (!_qtyFocus.hasFocus && _qtyCtrl.text != '${item.qty}') {
      _qtyCtrl.text = '${item.qty}';
    }

    return FadeTransition(
      opacity: _opacity,
      child: SlideTransition(
        position: _slide,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // 1. ITEM COLUMN (flex 6)
              Expanded(
                flex: 6,
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        width: 28,
                        height: 28,
                        color: WholesalerColors.primary.withValues(alpha: 0.08),
                        child: Center(
                          child: p.imageUrl.isNotEmpty
                              ? Image.network(
                                  p.imageUrl,
                                  width: 28,
                                  height: 28,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Text(p.emoji, style: const TextStyle(fontSize: 14)),
                                )
                              : Text(p.emoji, style: const TextStyle(fontSize: 14)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            p.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: WholesalerColors.textPrimary(isDark),
                            ),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            'SKU: ${p.sku}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 8.5,
                              color: WholesalerColors.textSecondary(isDark),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // 2. PRICE COLUMN (flex 4)
              Expanded(
                flex: 4,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.center,
                  child: Text(
                    '৳${NumberFormat('#,##0.00').format(item.unitPrice)}',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: WholesalerColors.textPrimary(isDark),
                    ),
                  ),
                ),
              ),

              // 3. QTY COLUMN (flex 4)
              Expanded(
                flex: 4,
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        InkWell(
                          onTap: () {
                            w.decrementQty(p.id);
                            setState(() {
                              _qtyCtrl.text = '${item.qty}';
                            });
                          },
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            width: 18,
                            height: 18,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF2E2B6B) : Colors.white,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: isDark ? const Color(0xFF3E3A85) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Icon(
                              Icons.remove,
                              size: 11,
                              color: isDark ? Colors.white70 : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        const SizedBox(width: 2),
                        // Editable QTY Box (Type directly inline or double-tap for preset numpad dialog)
                        Tooltip(
                          message: 'Type quantity or double tap for presets',
                          child: InkWell(
                            onDoubleTap: () => _showWholesaleQtyDialog(context, w, p.id, p.name, item.qty),
                            borderRadius: BorderRadius.circular(4),
                            child: Container(
                              width: 28,
                              height: 18,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFF1E1B4B)
                                    : const Color(0xFFEEF2FF),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(
                                  color: isDark
                                      ? WholesalerColors.primary.withValues(alpha: 0.6)
                                      : const Color(0xFFCBD5E1),
                                  width: 1,
                                ),
                              ),
                              child: TextField(
                                controller: _qtyCtrl,
                                focusNode: _qtyFocus,
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: WholesalerColors.primary,
                                  height: 1.1,
                                ),
                                cursorColor: WholesalerColors.primary,
                                cursorWidth: 1.5,
                                cursorHeight: 11,
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                                onSubmitted: (_) {
                                  _commitQty();
                                  _qtyFocus.unfocus();
                                },
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 2),
                        InkWell(
                          onTap: () {
                            w.incrementQty(p.id);
                            setState(() {
                              _qtyCtrl.text = '${item.qty}';
                            });
                          },
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            width: 18,
                            height: 18,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF2E2B6B) : Colors.white,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: isDark ? const Color(0xFF3E3A85) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            child: Icon(
                              Icons.add,
                              size: 11,
                              color: isDark ? Colors.white70 : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // 4. TOTAL COLUMN (flex 4)
              Expanded(
                flex: 4,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerRight,
                    child: Text(
                      '৳${NumberFormat('#,##0.00').format(item.lineTotal)}',
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: WholesalerColors.textPrimary(isDark),
                      ),
                    ),
                  ),
                ),
              ),

              // 5. DELETE COLUMN (26px matching header SizedBox)
              SizedBox(
                width: 26,
                child: Center(
                  child: InkWell(
                    onTap: () => w.removeItem(p.id),
                    borderRadius: BorderRadius.circular(4),
                    child: Padding(
                      padding: const EdgeInsets.all(3.0),
                      child: Icon(
                        Icons.delete_outline_rounded,
                        size: 16,
                        color: WholesalerColors.accentRed,
                      ),
                    ),
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
// QUICK WHOLESALE QUANTITY PRESET MODAL
// ─────────────────────────────────────────────────────────────────
Future<void> _showWholesaleQtyDialog(
  BuildContext context,
  WholesalerProvider w,
  String productId,
  String productName,
  int currentQty,
) async {
  final dialogCtrl = TextEditingController(text: '$currentQty');
  dialogCtrl.selection = TextSelection(baseOffset: 0, extentOffset: dialogCtrl.text.length);

  await showDialog<void>(
    context: context,
    builder: (ctx) {
      final isDark = ctx.watch<AppProvider>().isDarkMode;
      return StatefulBuilder(
        builder: (ctx, setDialogState) {
          void updateVal(int val) {
            if (val > 0) {
              setDialogState(() {
                dialogCtrl.text = '$val';
                dialogCtrl.selection = TextSelection(baseOffset: 0, extentOffset: dialogCtrl.text.length);
              });
            }
          }

          void addVal(int add) {
            final curr = int.tryParse(dialogCtrl.text) ?? currentQty;
            updateVal(curr + add);
          }

          return AlertDialog(
            backgroundColor: isDark ? const Color(0xFF1E1B4B) : Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            titlePadding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: WholesalerColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.edit_note_rounded, color: WholesalerColors.primary, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Set Wholesale Quantity', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                      Text(productName, maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 11, color: WholesalerColors.textSecondary(isDark))),
                    ],
                  ),
                ),
              ],
            ),
            content: SizedBox(
              width: 320,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 8),
                  // Large QTY Input Field
                  TextField(
                    controller: dialogCtrl,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: WholesalerColors.primary),
                    decoration: InputDecoration(
                      hintText: 'Enter Qty (e.g. 100)',
                      filled: true,
                      fillColor: isDark ? const Color(0xFF2E2B6B) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onSubmitted: (v) {
                      final val = int.tryParse(v);
                      if (val != null && val > 0) {
                        w.setQty(productId, val);
                        Navigator.pop(ctx);
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                  // Wholesale Presets
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Wholesale Quick Presets:', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: WholesalerColors.textSecondary(isDark))),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [10, 25, 50, 100, 200, 500].map((preset) {
                      return InkWell(
                        onTap: () => updateVal(preset),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: WholesalerColors.primary.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: WholesalerColors.primary.withValues(alpha: 0.25)),
                          ),
                          child: Text('$preset', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: WholesalerColors.primary)),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  // Quick Increments
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Quick Add (+):', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: WholesalerColors.textSecondary(isDark))),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [5, 10, 50, 100].map((add) {
                      return InkWell(
                        onTap: () => addVal(add),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: WholesalerColors.accentGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: WholesalerColors.accentGreen.withValues(alpha: 0.3)),
                          ),
                          child: Text('+$add', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: WholesalerColors.accentGreen)),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('Cancel', style: TextStyle(color: WholesalerColors.textSecondary(isDark))),
              ),
              ElevatedButton(
                onPressed: () {
                  final val = int.tryParse(dialogCtrl.text);
                  if (val != null && val > 0) {
                    w.setQty(productId, val);
                    Navigator.pop(ctx);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: WholesalerColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                child: const Text('Update Qty', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
              ),
            ],
          );
        },
      );
    },
  );
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
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.pause_circle_outline_rounded,
                              size: 16, color: WholesalerColors.primary),
                          const SizedBox(width: 5),
                          Text('Hold Order',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: WholesalerColors.primary,
                              )),
                        ],
                      ),
                    ),
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
                final w = context.read<WholesalerProvider>();
                if (w.items.isEmpty) {
                  _snack(context, 'Add items to proceed to checkout');
                  return;
                }
                showWholesalerCheckoutDialog(context, w, isDark);
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
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.payments_rounded,
                              size: 16, color: Colors.white),
                          SizedBox(width: 6),
                          Text('Checkout & Pay',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              )),
                          SizedBox(width: 5),
                          Icon(Icons.arrow_forward_rounded,
                              size: 14, color: Colors.white),
                        ],
                      ),
                    ),
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
