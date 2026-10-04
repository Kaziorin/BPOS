import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/models/menu_item.dart';
import '../../../core/theme/theme_extensions.dart';
import '../../../core/utils/number_utils.dart';
import 'dialogs/pos_dialogs.dart';
import 'bottom_action_bar.dart';

class OrderSummaryPanel extends StatelessWidget {
  final bool isBottomSheet;
  const OrderSummaryPanel({super.key, this.isBottomSheet = false});

  @override
  Widget build(BuildContext context) {
    if (isBottomSheet) {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            _OrderSummaryHeader(),
            Divider(height: 1, thickness: 1, color: context.dividerColor),
            _CartTableHeader(),
            Expanded(child: _OrderItemsList()),
            const BottomActionBar(),
            _OrderNoteField(),
            _PriceBreakdown(),
            _PlaceOrderButton(),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(right: 16, top: 0, bottom: 6),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: context.isDark ? 0.4 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            children: [
              _OrderSummaryHeader(),
              Divider(height: 1, thickness: 1, color: context.dividerColor),
              _CartTableHeader(),
              Expanded(child: _OrderItemsList()),
              _OrderNoteField(),
              _PriceBreakdown(),
              _PlaceOrderButton(),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// TABLE HEADER (ITEM, PRICE, QTY, TOTAL)
// ─────────────────────────────────────────────────────────────────
class _CartTableHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: context.inputBg.withValues(alpha: 0.5),
        border: Border(
          bottom: BorderSide(color: context.dividerColor),
        ),
      ),
      child: const Row(
        children: [
          Expanded(
            flex: 7,
            child: Text(
              'ITEM',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              'PRICE',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              'QTY',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: Text(
              'TOTAL',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: Color(0xFF64748B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────
class _OrderSummaryHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            children: [
              Text(
                AppStrings.get('order_summary', locale),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: context.textPrimary,
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: primaryOrange.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${NumberUtils.toLocalized(provider.cartItems.length, locale)} ${AppStrings.get('items', locale)}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: primaryOrange,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () {
                  if (provider.cartItems.isNotEmpty) {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: ctx.cardBg,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        title: Text(AppStrings.get('clear_cart', locale), style: TextStyle(color: ctx.textPrimary)),
                        content: Text(AppStrings.get('clear_cart_msg', locale), style: TextStyle(color: ctx.textSecondary)),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            child: Text(AppStrings.get('cancel', locale)),
                          ),
                          ElevatedButton(
                            onPressed: () { provider.clearCart(); Navigator.of(ctx).pop(); },
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                            child: Text(AppStrings.get('clear_all', locale)),
                          ),
                        ],
                      ),
                    );
                  }
                },
                behavior: HitTestBehavior.opaque,
                child: Row(
                  children: [
                    Icon(Icons.delete_outline, size: 16, color: Colors.red.shade500),
                    const SizedBox(width: 4),
                    Text(
                      AppStrings.get('clear_all', locale),
                      style: TextStyle(fontSize: 12, color: Colors.red.shade500, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ITEMS LIST
// ─────────────────────────────────────────────────────────────────
class _OrderItemsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        if (provider.cartItems.isEmpty) {
          return Center(
            child: Text(
              AppStrings.get('cart_empty', locale),
              style: TextStyle(color: context.textSecondary, fontSize: 14),
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.symmetric(vertical: 6),
          itemCount: provider.cartItems.length,
          separatorBuilder: (context, index) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Divider(color: context.dividerColor, height: 12, thickness: 1),
          ),
          itemBuilder: (context, index) {
            return _OrderItemRow(item: provider.cartItems[index], index: index + 1);
          },
        );
      },
    );
  }
}

class _OrderItemRow extends StatelessWidget {
  final CartItem item;
  final int index;
  const _OrderItemRow({required this.item, required this.index});

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // ITEM COLUMN
              Expanded(
                flex: 7,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      margin: const EdgeInsets.only(top: 2, right: 8),
                      decoration: BoxDecoration(
                        color: primaryOrange.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          NumberUtils.toLocalized(index, locale),
                          style: const TextStyle(color: primaryOrange, fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.menuItem.localizedName(locale),
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: context.textPrimary),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (item.modifiers.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            ...item.modifiers.map(
                              (mod) => Text(
                                '• ${AppStrings.get(mod, locale)}',
                                style: TextStyle(fontSize: 10, color: context.textSecondary, fontWeight: FontWeight.w500),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // PRICE COLUMN
              Expanded(
                flex: 3,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.center,
                  child: Text(
                    '৳${NumberUtils.toLocalized(item.unitPrice.toStringAsFixed(2), locale)}',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: context.textPrimary),
                  ),
                ),
              ),

              // QTY COLUMN
              Expanded(
                flex: 3,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.center,
                  child: _QuantityControl(
                    quantity: item.quantity,
                    onDecrement: () => provider.decrementQuantity(item),
                    onIncrement: () => provider.incrementQuantity(item),
                  ),
                ),
              ),

              // TOTAL COLUMN
              Expanded(
                flex: 4,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Flexible(
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerRight,
                        child: Text(
                          '৳${NumberUtils.toLocalized(item.totalPrice.toStringAsFixed(2), locale)}',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: context.textPrimary),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: () => provider.removeFromCart(item),
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.all(2.0),
                        child: Icon(Icons.delete_outline, size: 16, color: Colors.red.shade500),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _QuantityControl extends StatelessWidget {
  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  const _QuantityControl({required this.quantity, required this.onDecrement, required this.onIncrement});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.inputBg,
        border: Border.all(color: context.borderColor, width: 1.0),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: onDecrement,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Icon(Icons.remove, size: 12, color: context.textPrimary),
            ),
          ),
          Container(
            constraints: const BoxConstraints(minWidth: 18),
            alignment: Alignment.center,
            child: Text(
              NumberUtils.toLocalized(quantity, context.watch<AppProvider>().locale),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textPrimary),
            ),
          ),
          GestureDetector(
            onTap: onIncrement,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Icon(Icons.add, size: 12, color: context.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ORDER NOTE (Direct Input with FileText Icon)
// ─────────────────────────────────────────────────────────────────
class _OrderNoteField extends StatefulWidget {
  @override
  State<_OrderNoteField> createState() => _OrderNoteFieldState();
}

class _OrderNoteFieldState extends State<_OrderNoteField> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final p = Provider.of<POSProvider>(context, listen: false);
    _controller = TextEditingController(text: p.orderNote);
  }

  @override
  void didUpdateWidget(covariant _OrderNoteField oldWidget) {
    super.didUpdateWidget(oldWidget);
    final p = Provider.of<POSProvider>(context, listen: false);
    if (_controller.text != p.orderNote) {
      _controller.text = p.orderNote;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.5) : const Color(0xFFF8FAFC),
        border: Border(
          top: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
        ),
      ),
      child: Container(
        height: 36,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF0F172A) : Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                onChanged: (val) {
                  context.read<POSProvider>().setOrderNote(val);
                },
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white : const Color(0xFF334155),
                ),
                decoration: const InputDecoration(
                  hintText: 'Add Order Note...',
                  hintStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: Color(0xFF94A3B8),
                  ),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 8),
                ),
              ),
            ),
            const Icon(
              Icons.description_outlined,
              size: 15,
              color: Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PRICE BREAKDOWN
// ─────────────────────────────────────────────────────────────────
String _fmt(double val) {
  if (val == val.roundToDouble()) return val.toStringAsFixed(0);
  final s = val.toStringAsFixed(2);
  if (s.endsWith('0')) return val.toStringAsFixed(1);
  return s;
}

class _PriceBreakdown extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.3) : const Color(0xFFFAFAFA),
            border: Border(
              top: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 1. Base Price
              _PriceRow(
                label: 'Base Price',
                value: '৳${_fmt(provider.subtotal)}',
                labelColor: const Color(0xFF64748B),
                valueColor: isDark ? Colors.white : const Color(0xFF334155),
              ),
              // Discount (if any)
              if (provider.discountValue > 0) ...[
                const SizedBox(height: 6),
                _PriceRow(
                  label: 'Discount (${provider.discountPercent.toInt()}%)',
                  value: '−৳${_fmt(provider.discountValue)}',
                  labelColor: const Color(0xFF059669),
                  valueColor: const Color(0xFF059669),
                ),
              ],
              const SizedBox(height: 6),
              // 2. + VAT / Tax
              _PriceRow(
                label: '+ VAT / Tax (${provider.taxRatePct.toInt()}%)',
                value: '+৳${_fmt(provider.tax)}',
                labelColor: const Color(0xFF64748B),
                valueColor: isDark ? Colors.white70 : const Color(0xFF334155),
              ),
              const SizedBox(height: 6),
              // 3. + Service Charge (with edit pencil icon)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  InkWell(
                    onTap: () => _showServiceChargeDialog(context, provider),
                    borderRadius: BorderRadius.circular(4),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '+ Service Charge (${provider.serviceChargePercent.toInt()}%)',
                            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.edit_outlined, size: 13, color: Color(0xFF94A3B8)),
                        ],
                      ),
                    ),
                  ),
                  Text(
                    '+৳${_fmt(provider.serviceCharge)}',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white70 : const Color(0xFF334155),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              // Dashed line divider
              _DashedDivider(color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1)),
              const SizedBox(height: 10),
              // 4. Total Payable
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    'Total Payable',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                    ),
                  ),
                  Text(
                    '৳${_fmt(provider.totalPayable)}',
                    style: const TextStyle(
                      fontSize: 27,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFFF4800),
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

void _showServiceChargeDialog(BuildContext context, POSProvider provider) {
  final controller = TextEditingController(
    text: provider.serviceChargePercent == provider.serviceChargePercent.roundToDouble()
        ? provider.serviceChargePercent.toInt().toString()
        : provider.serviceChargePercent.toString(),
  );
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Enter Service Charge (%)', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      content: TextField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        autofocus: true,
        decoration: InputDecoration(
          hintText: 'Enter percentage (e.g. 3)',
          suffixText: '%',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF6D00), foregroundColor: Colors.white),
          onPressed: () {
            final val = double.tryParse(controller.text.trim());
            if (val != null && val >= 0) {
              provider.setServiceChargePercent(val);
            }
            Navigator.pop(ctx);
          },
          child: const Text('Apply'),
        ),
      ],
    ),
  );
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? labelColor;
  final Color? valueColor;
  const _PriceRow({required this.label, required this.value, this.labelColor, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: labelColor ?? const Color(0xFF64748B), fontWeight: FontWeight.w500)),
        Text(value, style: TextStyle(fontSize: 13, color: valueColor ?? const Color(0xFF334155), fontWeight: FontWeight.w700)),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DASHED LINE DIVIDER
// ─────────────────────────────────────────────────────────────────
class _DashedDivider extends StatelessWidget {
  final Color color;

  const _DashedDivider({this.color = const Color(0xFFCBD5E1)});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        final boxWidth = constraints.constrainWidth();
        if (boxWidth <= 0 || boxWidth.isInfinite) {
          return Divider(height: 1, color: color);
        }
        const dashWidth = 4.0;
        const dashSpace = 3.0;
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return Flex(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          direction: Axis.horizontal,
          children: List.generate(dashCount, (_) {
            return const SizedBox(
              width: dashWidth,
              height: 1,
            );
          }).map((w) => SizedBox(
            width: dashWidth,
            height: 1,
            child: DecoratedBox(decoration: BoxDecoration(color: color)),
          )).toList(),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ACTION BUTTONS (KOT TO KITCHEN + PLACE ORDER)
// ─────────────────────────────────────────────────────────────────
class _PlaceOrderButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        final hasItems = provider.cartItems.isNotEmpty;
        return Container(
          padding: const EdgeInsets.only(left: 16, right: 16, bottom: 14, top: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 1. KOT to Kitchen Button (matching image)
              InkWell(
                onTap: !hasItems
                    ? null
                    : () async {
                        final ok = await provider.sendKotToKitchen();
                        if (ok && context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                                  const SizedBox(width: 8),
                                  Text('KOT Ticket sent to Kitchen for Table ${provider.tableNumber}!'),
                                ],
                              ),
                              backgroundColor: const Color(0xFFD97706),
                              behavior: SnackBarBehavior.floating,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        }
                      },
                borderRadius: BorderRadius.circular(6),
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 200),
                  opacity: hasItems ? 1.0 : 0.45,
                  child: Container(
                    height: 42,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      border: Border.all(color: const Color(0xFFFBBF24), width: 1.8),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.local_fire_department_outlined, color: Color(0xFFD97706), size: 18),
                        SizedBox(width: 6),
                        Text(
                          'KOT to Kitchen',
                          style: TextStyle(
                            color: Color(0xFF92400E),
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // 2. Place Order / Checkout Button
              InkWell(
                onTap: !hasItems
                    ? null
                    : () {
                        showRestaurantCheckoutDialog(context, provider, context.isDark);
                      },
                borderRadius: BorderRadius.circular(8),
                child: AnimatedOpacity(
                  duration: const Duration(milliseconds: 200),
                  opacity: hasItems ? 1.0 : 0.45,
                  child: Container(
                    height: 48,
                    decoration: BoxDecoration(
                      gradient: hasItems
                          ? const LinearGradient(
                              colors: [Color(0xFFFF7A00), Color(0xFFFF5000)],
                            )
                          : null,
                      color: hasItems ? null : (context.isDark ? Colors.grey.shade800 : Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: hasItems
                          ? [
                              BoxShadow(
                                color: const Color(0xFFFF6D00).withValues(alpha: 0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              )
                            ]
                          : null,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Row(
                              children: [
                                const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 18),
                                const SizedBox(width: 8),
                                Text(
                                  AppStrings.get('place_order', locale),
                                  style: TextStyle(
                                    color: hasItems ? Colors.white : Colors.grey.shade600,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        if (hasItems)
                          Container(
                            height: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.15),
                              borderRadius: const BorderRadius.horizontal(right: Radius.circular(8)),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  '৳${_fmt(provider.totalPayable)}',
                                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w900),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.chevron_right_rounded, color: Colors.white, size: 18),
                              ],
                            ),
                          ),
                      ],
                    ),
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

