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
    final screenWidth = MediaQuery.of(context).size.width;
    final panelWidth = isBottomSheet ? double.infinity : 320.0;
    final width = isBottomSheet ? double.infinity : (screenWidth >= 1024 ? 360.0 : panelWidth);

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
        width: width,
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
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: provider.cartItems.length,
          separatorBuilder: (context, index) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Divider(color: context.dividerColor, height: 24, thickness: 1),
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
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 24, height: 24,
                    margin: const EdgeInsets.only(top: 2),
                    decoration: BoxDecoration(
                      color: primaryOrange.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        NumberUtils.toLocalized(index, locale),
                        style: const TextStyle(color: primaryOrange, fontSize: 12, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.menuItem.localizedName(locale),
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textPrimary),
                        ),
                        if (item.modifiers.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          ...item.modifiers.map(
                            (mod) => Padding(
                              padding: const EdgeInsets.only(bottom: 2),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 4, height: 4,
                                    margin: const EdgeInsets.only(right: 6, top: 1),
                                    decoration: BoxDecoration(color: Colors.grey.shade400, shape: BoxShape.circle),
                                  ),
                                  Expanded(
                                    child: Text(
                                      AppStrings.get(mod, locale),
                                      style: TextStyle(fontSize: 11, color: context.textSecondary, fontWeight: FontWeight.w500),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '৳${NumberUtils.toLocalized(item.menuItem.price.toStringAsFixed(2), locale)}',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: context.textPrimary),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () => provider.removeFromCart(item),
                    behavior: HitTestBehavior.opaque,
                    child: Icon(Icons.delete_outline, size: 20, color: Colors.red.shade500),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const SizedBox(width: 36),
                  _QuantityControl(
                    quantity: item.quantity,
                    onDecrement: () => provider.decrementQuantity(item),
                    onIncrement: () => provider.incrementQuantity(item),
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

class _QuantityControl extends StatelessWidget {
  final int quantity;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;
  const _QuantityControl({required this.quantity, required this.onDecrement, required this.onIncrement});

  @override
  Widget build(BuildContext context) {
    const darkBrown = Color(0xFF5D4037);
    return Container(
      decoration: BoxDecoration(
        color: context.inputBg,
        border: Border.all(color: context.borderColor, width: 1.5),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: onDecrement,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: const Icon(Icons.remove, size: 14, color: darkBrown),
            ),
          ),
          Container(
            width: 24,
            alignment: Alignment.center,
            child: Text(NumberUtils.toLocalized(quantity, context.watch<AppProvider>().locale), style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: context.textPrimary)),
          ),
          GestureDetector(
            onTap: onIncrement,
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: const Icon(Icons.add, size: 14, color: darkBrown),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ORDER NOTE
// ─────────────────────────────────────────────────────────────────
class _OrderNoteField extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        final noteText = provider.orderNote.isEmpty
            ? AppStrings.get('add_order_note', locale)
            : provider.orderNote;

        return GestureDetector(
          onTap: () {
            showDialog(context: context, builder: (_) => NoteDialog(isKitchenNote: false));
          },
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: context.inputBg,
              border: Border.all(color: const Color(0xFFFF6D00).withValues(alpha: 0.2), width: 1.5),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    noteText,
                    style: TextStyle(
                      fontSize: 13,
                      color: provider.orderNote.isEmpty ? context.textHint : const Color(0xFFFF6D00),
                      fontWeight: provider.orderNote.isEmpty ? FontWeight.w500 : FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(Icons.edit_note, size: 20, color: provider.orderNote.isEmpty ? context.textHint : const Color(0xFFFF6D00)),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PRICE BREAKDOWN
// ─────────────────────────────────────────────────────────────────
class _PriceBreakdown extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              _PriceRow(
                label: AppStrings.get('subtotal', locale),
                value: '৳${NumberUtils.toLocalized(provider.subtotal.toStringAsFixed(2), locale)}',
                labelColor: context.textSecondary,
                valueColor: context.textPrimary,
              ),
              if (provider.discountValue > 0) ...[
                const SizedBox(height: 8),
                _PriceRow(
                  label: '${AppStrings.get('discount_label', locale)} (${provider.appliedCoupon ?? ""})',
                  value: '-৳${NumberUtils.toLocalized(provider.discountValue.toStringAsFixed(2), locale)}',
                  labelColor: context.textSecondary,
                  valueColor: Colors.green.shade600,
                ),
              ],
              const SizedBox(height: 8),
              _PriceRow(
                label: AppStrings.get('tax', locale),
                value: '৳${NumberUtils.toLocalized(provider.tax.toStringAsFixed(2), locale)}',
                labelColor: context.textSecondary,
                valueColor: context.textPrimary,
              ),
              const SizedBox(height: 8),
              _PriceRow(
                label: AppStrings.get('service_charge', locale),
                value: '৳${NumberUtils.toLocalized(provider.serviceCharge.toStringAsFixed(2), locale)}',
                labelColor: context.textSecondary,
                valueColor: context.textPrimary,
              ),
              const SizedBox(height: 12),
              Divider(height: 1, thickness: 1, color: context.dividerColor),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    AppStrings.get('total_payable', locale),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: primaryOrange),
                  ),
                  Text(
                    '৳${NumberUtils.toLocalized(provider.totalPayable.toStringAsFixed(2), locale)}',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: primaryOrange),
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
        Text(label, style: TextStyle(fontSize: 13, color: labelColor ?? context.textSecondary, fontWeight: FontWeight.w600)),
        Text(value, style: TextStyle(fontSize: 13, color: valueColor ?? context.textPrimary, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PLACE ORDER BUTTON
// ─────────────────────────────────────────────────────────────────
class _PlaceOrderButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    const darkOrange = Color(0xFFE65100);
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Container(
          padding: const EdgeInsets.only(left: 20, right: 20, bottom: 16, top: 4),
          child: GestureDetector(
            onTap: provider.cartItems.isEmpty
                ? null
                : () {
                    showRestaurantCheckoutDialog(context, provider, context.isDark);
                  },
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: provider.cartItems.isEmpty ? (context.isDark ? Colors.grey.shade800 : Colors.grey.shade300) : primaryOrange,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              AppStrings.get('place_order', locale),
                              style: TextStyle(
                                color: provider.cartItems.isEmpty
                                    ? (context.isDark ? Colors.grey.shade600 : Colors.grey.shade500)
                                    : Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          Icon(
                            Icons.arrow_forward,
                            color: provider.cartItems.isEmpty
                                ? (context.isDark ? Colors.grey.shade600 : Colors.grey.shade500)
                                : Colors.white,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (provider.cartItems.isNotEmpty)
                    Container(
                      height: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      decoration: const BoxDecoration(
                        color: darkOrange,
                        borderRadius: BorderRadius.horizontal(right: Radius.circular(12)),
                      ),
                      child: Center(
                        child: Text(
                          '৳${NumberUtils.toLocalized(provider.totalPayable.toStringAsFixed(2), locale)}',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
