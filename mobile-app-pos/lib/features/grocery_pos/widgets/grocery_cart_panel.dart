import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../models/grocery_cart_item.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import 'dialogs/grocery_dialogs.dart';

class GroceryCartPanel extends StatelessWidget {
  const GroceryCartPanel({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final narrow = MediaQuery.of(context).size.width < 700;

    return Container(
      decoration: BoxDecoration(
        color: GroceryColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: GroceryColors.border(isDark)),
        boxShadow: GroceryColors.elevatedShadow(isDark),
      ),
      child: Column(
        children: [
          const _CartHeader(),
          const Divider(height: 1),
          Expanded(flex: narrow ? 4 : 5, child: const _CartList()),
          const _CartModifiers(),
          const _AdjustmentInputs(),
          const Divider(height: 1),
          const Padding(
            padding: EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: _PaymentSummary(),
          ),
          Expanded(
            flex: narrow ? 6 : 5,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
              child: narrow
                  ? const SingleChildScrollView(
                      child: Column(
                        children: [
                          _NumpadAndTools(),
                          SizedBox(height: 10),
                          _PaymentMethods(),
                          SizedBox(height: 10),
                          _PayButtons(),
                        ],
                      ),
                    )
                  : const Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          flex: 5,
                          child: SingleChildScrollView(child: _NumpadAndTools()),
                        ),
                        SizedBox(width: 10),
                        Expanded(
                          flex: 5,
                          child: Column(
                            children: [
                              Expanded(
                                child: SingleChildScrollView(child: _PaymentMethods()),
                              ),
                              SizedBox(height: 8),
                              _PayButtons(),
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
}

// ── Cart Header ──────────────────────────────────────────────
class _CartHeader extends StatelessWidget {
  const _CartHeader();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final p = context.watch<GroceryProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 10, 10),
      child: Row(
        children: [
          Icon(Icons.shopping_cart_rounded, size: 18, color: GroceryColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${AppStrings.get('cart', locale)} (${NumberUtils.toLocalized(p.totalItems, locale)} ${AppStrings.get('items', locale)})',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: GroceryColors.textPrimary(isDark),
              ),
            ),
          ),
          _SmallBtn(
            label: AppStrings.get('hold_f7', locale),
            color: GroceryColors.textSecondary(isDark),
            bg: isDark ? GroceryColors.inputBg(true) : Colors.grey.shade100,
            onTap: () {
              if (!gRequireCart(context)) return;
              final ok = context.read<GroceryProvider>().holdCurrentBill();
              if (ok) gSnack(context, AppStrings.get('g_bill_held', locale));
              // Offer recall list if any held
              final held = context.read<GroceryProvider>().heldBills;
              if (held.isNotEmpty) {
                // no auto-open; user can open via recent sales or we show a hint
              }
            },
          ),
          const SizedBox(width: 6),
          _SmallBtn(
            label: AppStrings.get('clear_cart_btn', locale),
            color: const Color(0xFFEF4444),
            bg: const Color(0xFFEF4444).withValues(alpha: 0.1),
            onTap: () async {
              if (!gRequireCart(context)) return;
              if (await gConfirmClearCart(context)) {
                if (!context.mounted) return;
                context.read<GroceryProvider>().clearCart();
              }
            },
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: () {
              final provider = context.read<GroceryProvider>();
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: provider,
                  child: const GroceryHeldBillsDialog(),
                ),
              );
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: GroceryColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Badge(
                isLabelVisible: p.heldBills.isNotEmpty,
                label: Text('${p.heldBills.length}', style: const TextStyle(fontSize: 9)),
                child: const Icon(Icons.inventory_rounded, size: 16, color: GroceryColors.primary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallBtn extends StatelessWidget {
  final String label;
  final Color color;
  final Color bg;
  final VoidCallback onTap;
  const _SmallBtn({required this.label, required this.color, required this.bg, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
        ),
      ),
    );
  }
}

// ── Cart List ────────────────────────────────────────────────
class _CartList extends StatelessWidget {
  const _CartList();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final cart = context.watch<GroceryProvider>().cart;

    if (cart.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 40, color: GroceryColors.textSecondary(isDark)),
            const SizedBox(height: 8),
            Text(
              AppStrings.get('cart_empty', locale),
              style: TextStyle(color: GroceryColors.textSecondary(isDark), fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      itemCount: cart.length,
      separatorBuilder: (_, _) => const SizedBox(height: 6),
      itemBuilder: (context, index) {
        return _CartRow(item: cart[index], locale: locale, isDark: isDark);
      },
    );
  }
}

class _CartRow extends StatelessWidget {
  final GroceryCartItem item;
  final String locale;
  final bool isDark;
  const _CartRow({required this.item, required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final p = item.product;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primarySoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Row(
        children: [
          // Thumb
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 40,
              height: 40,
              child: CachedNetworkImage(
                imageUrl: p.imageUrl,
                fit: BoxFit.cover,
                placeholder: (_, _) => Container(
                  color: GroceryColors.mint,
                  child: Center(child: Text(p.emoji, style: const TextStyle(fontSize: 18))),
                ),
                errorWidget: (_, _, _) => Container(
                  color: GroceryColors.mint,
                  child: Center(child: Text(p.emoji, style: const TextStyle(fontSize: 18))),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Name + unit price
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${p.localizedName(locale)} (${p.localizedUnit(locale)})',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: GroceryColors.textPrimary(isDark),
                  ),
                ),
                Text(
                  '${AppStrings.currency} ${NumberUtils.toLocalized(p.price.toStringAsFixed(2), locale)}',
                  style: TextStyle(
                    fontSize: 10,
                    color: GroceryColors.textSecondary(isDark),
                  ),
                ),
              ],
            ),
          ),
          // Qty stepper
          _QtyStepper(id: p.id, qty: item.quantity, isDark: isDark, locale: locale),
          const SizedBox(width: 6),
          // Discount pill + total
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (item.discountPercent > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: GroceryColors.primary.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${NumberUtils.toLocalized(item.discountPercent.toStringAsFixed(0), locale)}%',
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: GroceryColors.primaryDark,
                    ),
                  ),
                ),
              Text(
                '${AppStrings.currency} ${NumberUtils.toLocalized(item.lineTotal.toStringAsFixed(2), locale)}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  color: GroceryColors.textPrimary(isDark),
                ),
              ),
            ],
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: () => context.read<GroceryProvider>().removeItem(p.id),
            child: Icon(Icons.close_rounded, size: 16, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }
}

class _QtyStepper extends StatelessWidget {
  final String id;
  final int qty;
  final bool isDark;
  final String locale;
  const _QtyStepper({
    required this.id,
    required this.qty,
    required this.isDark,
    required this.locale,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.scaffoldBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stepBtn(Icons.remove_rounded, () => context.read<GroceryProvider>().updateQuantity(id, -1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: Text(
              NumberUtils.toLocalized(qty, locale),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: GroceryColors.textPrimary(isDark),
              ),
            ),
          ),
          _stepBtn(Icons.add_rounded, () => context.read<GroceryProvider>().updateQuantity(id, 1),
              green: true),
        ],
      ),
    );
  }

  Widget _stepBtn(IconData icon, VoidCallback onTap, {bool green = false}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        width: 24,
        height: 24,
        alignment: Alignment.center,
        decoration: green
            ? BoxDecoration(
                gradient: GroceryColors.primaryGradient,
                borderRadius: BorderRadius.circular(6),
              )
            : null,
        child: Icon(icon, size: 14, color: green ? Colors.white : Colors.grey),
      ),
    );
  }
}

// ── Modifiers ────────────────────────────────────────────────
class _CartModifiers extends StatelessWidget {
  const _CartModifiers();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 6),
      child: Row(
        children: [
          _modBtn(context, Icons.note_add_outlined, 'add_note', locale, isDark, () {
            showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
              value: provider, child: const GroceryNoteDialog(),
            ));
          }),
          const SizedBox(width: 6),
          _modBtn(context, Icons.percent_rounded, 'add_discount', locale, isDark, () {
            showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
              value: provider, child: const GroceryDiscountDialog(),
            ));
          }),
          const SizedBox(width: 6),
          _modBtn(context, Icons.confirmation_number_outlined, 'add_coupon', locale, isDark, () {
            showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
              value: provider, child: const GroceryCouponDialog(),
            ));
          }),
        ],
      ),
    );
  }

  Widget _modBtn(BuildContext context, IconData icon, String key, String locale, bool isDark, VoidCallback onTap) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 7),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.inputBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: GroceryColors.border(isDark)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 13, color: GroceryColors.primary),
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    AppStrings.get(key, locale),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: GroceryColors.textPrimary(isDark)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Discount / Coupon / Note inputs ──────────────────────────
class _AdjustmentInputs extends StatefulWidget {
  const _AdjustmentInputs();

  @override
  State<_AdjustmentInputs> createState() => _AdjustmentInputsState();
}

class _AdjustmentInputsState extends State<_AdjustmentInputs> {
  final _discountCtrl = TextEditingController();
  final _couponCtrl = TextEditingController();

  @override
  void dispose() {
    _discountCtrl.dispose();
    _couponCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      child: Column(
        children: [
          _inputRow(
            label: AppStrings.get('discount_pct', locale),
            hint: '0',
            controller: _discountCtrl,
            isDark: isDark,
            locale: locale,
            onApply: () {
              final pct = double.tryParse(_discountCtrl.text) ?? 0;
              provider.applyBillDiscount(pct);
              gSnack(context, '${NumberUtils.toLocalized(pct.toStringAsFixed(0), locale)}% ${AppStrings.get('discount_label', locale)}');
            },
          ),
          const SizedBox(height: 6),
          _inputRow(
            label: AppStrings.get('coupon_code', locale),
            hint: 'SAVE10',
            controller: _couponCtrl,
            isDark: isDark,
            locale: locale,
            onChanged: (v) => provider.setCouponCode(v),
            onApply: () {
              final ok = provider.applyCouponCode(_couponCtrl.text);
              gSnack(
                context,
                ok
                    ? (locale == 'bn' ? 'কুপন প্রয়োগ হয়েছে' : 'Coupon applied')
                    : (locale == 'bn' ? 'অবৈধ কুপন' : 'Invalid coupon'),
                color: ok ? GroceryColors.primaryDark : Colors.red.shade700,
              );
            },
          ),
          const SizedBox(height: 6),
          Container(
            height: 36,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.inputBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: GroceryColors.border(isDark)),
            ),
            child: TextField(
              onChanged: (v) => provider.setSalesNote(v),
              style: TextStyle(fontSize: 11, color: GroceryColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: AppStrings.get('sales_note_hint', locale),
                hintStyle: TextStyle(fontSize: 11, color: GroceryColors.textSecondary(isDark)),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                prefixIcon: Icon(Icons.notes_rounded, size: 16, color: GroceryColors.textSecondary(isDark)),
                prefixIconConstraints: const BoxConstraints(minWidth: 28),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _inputRow({
    required String label,
    required String hint,
    required TextEditingController controller,
    required bool isDark,
    required String locale,
    ValueChanged<String>? onChanged,
    required VoidCallback onApply,
  }) {
    return Row(
      children: [
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: GroceryColors.textSecondary(isDark),
            ),
          ),
        ),
        Expanded(
          child: Container(
            height: 32,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.inputBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: GroceryColors.border(isDark)),
            ),
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: TextStyle(fontSize: 12, color: GroceryColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(fontSize: 11, color: GroceryColors.textSecondary(isDark)),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        InkWell(
          onTap: onApply,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              gradient: GroceryColors.primaryGradient,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: GroceryColors.primary.withValues(alpha: 0.3),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              AppStrings.get('apply', locale),
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Numpad + Tools ───────────────────────────────────────────
class _NumpadAndTools extends StatelessWidget {
  const _NumpadAndTools();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.watch<GroceryProvider>();

    final tools = [
      (Icons.sell_outlined, 'price_check', () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GroceryPriceCheckDialog(),
        ));
      }),
      (Icons.qr_code_rounded, 'barcode_lookup', () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GroceryBarcodeDialog(),
        ));
      }),
      (Icons.history_rounded, 'recent_sales', () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GrocerySalesHistoryDialog(),
        ));
      }),
      (Icons.undo_rounded, 'return_refund', () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GroceryReturnDialog(),
        ));
      }),
    ];

    final keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tools sidebar
        Column(
          children: tools.map((t) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Tooltip(
                message: AppStrings.get(t.$2, locale),
                child: InkWell(
                  onTap: t.$3,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: isDark ? GroceryColors.inputBg(true) : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: GroceryColors.border(isDark)),
                      boxShadow: GroceryColors.softShadow(isDark),
                    ),
                    child: Icon(t.$1, size: 16, color: GroceryColors.primary),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(width: 8),
        // Numpad
        Expanded(
          child: Column(
            children: [
              // Tender input display
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                decoration: BoxDecoration(
                  color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: provider.numpadValue.isNotEmpty
                        ? GroceryColors.primary.withValues(alpha: 0.3)
                        : (isDark ? GroceryColors.border(true) : Colors.grey.shade200),
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      AppStrings.get('cash_tendered', locale),
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                        color: GroceryColors.textSecondary(isDark),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      AppStrings.currency,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: GroceryColors.primaryDark,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        provider.numpadValue.isEmpty
                            ? '0.00'
                            : NumberUtils.toLocalized(provider.numpadValue, locale),
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: GroceryColors.primaryDark,
                        ),
                      ),
                    ),
                    if (provider.numpadValue.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      InkWell(
                        onTap: () => context.read<GroceryProvider>().clearNumpad(),
                        borderRadius: BorderRadius.circular(10),
                        child: const Padding(
                          padding: EdgeInsets.all(2),
                          child: Icon(Icons.close_rounded, size: 14, color: Colors.grey),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 6,
                  mainAxisSpacing: 6,
                  childAspectRatio: 1.6,
                ),
                itemCount: keys.length,
                itemBuilder: (context, i) {
                  final k = keys[i];
                  return _NumKey(
                    label: k,
                    isDark: isDark,
                    isSpecial: k == '⌫',
                    onTap: () => context.read<GroceryProvider>().numpadPress(k),
                  );
                },
              ),
              const SizedBox(height: 6),
              // Clear & Exact Amount Action Buttons
              Row(
                children: [
                  // Clear button
                  InkWell(
                    onTap: () => context.read<GroceryProvider>().clearNumpad(),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
                      decoration: BoxDecoration(
                        color: isDark ? GroceryColors.inputBg(true) : Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: isDark ? GroceryColors.border(true) : Colors.grey.shade300),
                      ),
                      child: Text(
                        'C',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: GroceryColors.textSecondary(isDark),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  // Exact Amount button
                  Expanded(
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => context.read<GroceryProvider>().setExactTender(),
                        borderRadius: BorderRadius.circular(8),
                        child: Ink(
                          decoration: BoxDecoration(
                            gradient: GroceryColors.primaryGradient,
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [
                              BoxShadow(
                                color: GroceryColors.primary.withValues(alpha: 0.3),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.done_all_rounded, size: 15, color: Colors.white),
                                const SizedBox(width: 5),
                                Text(
                                  '${AppStrings.get('exact_amount', locale)} (${AppStrings.currency}${NumberUtils.toLocalized(provider.grandTotal.toStringAsFixed(2), locale)})',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _NumKey extends StatefulWidget {
  final String label;
  final bool isDark;
  final bool isSpecial;
  final VoidCallback onTap;
  const _NumKey({
    required this.label,
    required this.isDark,
    required this.isSpecial,
    required this.onTap,
  });

  @override
  State<_NumKey> createState() => _NumKeyState();
}

class _NumKeyState extends State<_NumKey> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? 0.92 : 1,
        duration: const Duration(milliseconds: 80),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: widget.isSpecial
                ? GroceryColors.primary.withValues(alpha: 0.12)
                : (widget.isDark ? GroceryColors.inputBg(true) : Colors.white),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: GroceryColors.border(widget.isDark)),
            boxShadow: GroceryColors.softShadow(widget.isDark),
          ),
          child: widget.label == '⌫'
              ? Icon(Icons.backspace_outlined, size: 16, color: GroceryColors.primary)
              : Text(
                  widget.label,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: GroceryColors.textPrimary(widget.isDark),
                  ),
                ),
        ),
      ),
    );
  }
}

// ── Payment Summary ──────────────────────────────────────────
class _PaymentSummary extends StatelessWidget {
  const _PaymentSummary();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final p = context.watch<GroceryProvider>();

    Widget row(String label, String value, {bool bold = false, Color? valueColor}) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: bold ? 14 : 11,
                fontWeight: bold ? FontWeight.w900 : FontWeight.w600,
                color: bold
                    ? GroceryColors.textPrimary(isDark)
                    : GroceryColors.textSecondary(isDark),
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: bold ? 18 : 12,
                fontWeight: FontWeight.w900,
                color: valueColor ??
                    (bold ? GroceryColors.primaryDark : GroceryColors.textPrimary(isDark)),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primarySoft,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Column(
        children: [
          row(
            AppStrings.get('subtotal', locale),
            '${AppStrings.currency} ${NumberUtils.toLocalized(p.subtotal.toStringAsFixed(2), locale)}',
          ),
          row(
            AppStrings.get('discount_label', locale),
            '- ${AppStrings.currency} ${NumberUtils.toLocalized(p.totalDiscount.toStringAsFixed(2), locale)}',
            valueColor: const Color(0xFFEF4444),
          ),
          row(
            AppStrings.get('vat_label', locale),
            '${AppStrings.currency} ${NumberUtils.toLocalized(p.vat.toStringAsFixed(2), locale)}',
          ),
          Divider(color: GroceryColors.border(isDark), height: 14),
          row(
            AppStrings.get('total', locale),
            '${AppStrings.currency} ${NumberUtils.toLocalized(p.grandTotal.toStringAsFixed(2), locale)}',
            bold: true,
            valueColor: GroceryColors.primaryDark,
          ),
          Divider(color: GroceryColors.border(isDark), height: 12),
          // Cash Tendered Row
          row(
            AppStrings.get('cash_tendered', locale),
            '${AppStrings.currency} ${NumberUtils.toLocalized(p.tenderedAmount.toStringAsFixed(2), locale)}',
            bold: p.tenderedAmount > 0,
            valueColor: p.tenderedAmount > 0
                ? (isDark ? Colors.white : const Color(0xFF1E293B))
                : GroceryColors.textSecondary(isDark),
          ),
          // Change Return Row
          row(
            AppStrings.get('change_return', locale),
            p.tenderedAmount >= p.grandTotal
                ? '${AppStrings.currency} ${NumberUtils.toLocalized(p.changeAmount.toStringAsFixed(2), locale)}'
                : (p.tenderedAmount > 0
                    ? '- ${AppStrings.currency} ${NumberUtils.toLocalized(p.remainingDue.toStringAsFixed(2), locale)} (${locale == 'bn' ? 'বাকি' : 'Due'})'
                    : '${AppStrings.currency} ${NumberUtils.toLocalized('0.00', locale)}'),
            bold: p.tenderedAmount > 0,
            valueColor: p.tenderedAmount >= p.grandTotal
                ? const Color(0xFF10B981)
                : (p.tenderedAmount > 0 ? const Color(0xFFEF4444) : GroceryColors.textSecondary(isDark)),
          ),
          if (p.totalSavings > 0) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: GroceryColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${AppStrings.get('you_save', locale)} ${AppStrings.currency} ${NumberUtils.toLocalized(p.totalSavings.toStringAsFixed(2), locale)}',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: GroceryColors.primaryDark,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Payment Methods ──────────────────────────────────────────
class _PaymentMethods extends StatelessWidget {
  const _PaymentMethods();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final selected = context.watch<GroceryProvider>().selectedPayment;

    final methods = [
      ('Cash', 'payment_cash', Icons.payments_outlined),
      ('Card', 'payment_card', Icons.credit_card_rounded),
      ('UPI / QR', 'payment_upi', Icons.qr_code_2_rounded),
      ('Wallet', 'payment_wallet', Icons.account_balance_wallet_outlined),
      ('Split', 'payment_split', Icons.call_split_rounded),
    ];

    return Column(
      children: methods.map((m) {
        final isSel = selected == m.$1;
        return Padding(
          padding: const EdgeInsets.only(bottom: 5),
          child: GestureDetector(
            onTap: () => context.read<GroceryProvider>().setPayment(m.$1),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                gradient: isSel ? GroceryColors.primaryGradient : null,
                color: isSel ? null : (isDark ? GroceryColors.inputBg(true) : Colors.white),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSel ? Colors.transparent : GroceryColors.border(isDark),
                ),
                boxShadow: isSel
                    ? [
                        BoxShadow(
                          color: GroceryColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                children: [
                  Icon(m.$3, size: 16, color: isSel ? Colors.white : GroceryColors.primary),
                  const SizedBox(width: 10),
                  Text(
                    AppStrings.get(m.$2, locale),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSel ? Colors.white : GroceryColors.textPrimary(isDark),
                    ),
                  ),
                  const Spacer(),
                  if (isSel)
                    const Icon(Icons.check_circle_rounded, size: 16, color: Colors.white),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Pay Buttons ──────────────────────────────────────────────
class _PayButtons extends StatelessWidget {
  const _PayButtons();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final p = context.watch<GroceryProvider>();
    final total = NumberUtils.toLocalized(p.grandTotal.toStringAsFixed(2), locale);

    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              if (!gRequireCart(context)) return;
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: p,
                  child: const GroceryCheckoutDialog(),
                ),
              );
            },
            borderRadius: BorderRadius.circular(14),
            child: Ink(
              decoration: BoxDecoration(
                gradient: GroceryColors.payGradient,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: GroceryColors.primary.withValues(alpha: 0.45),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '${AppStrings.get('pay', locale)} ${AppStrings.currency} $total',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              if (!gRequireCart(context)) return;
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: p,
                  child: const GroceryBillPrintDialog(),
                ),
              );
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 11),
              decoration: BoxDecoration(
                color: isDark ? GroceryColors.inputBg(true) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: GroceryColors.primary.withValues(alpha: 0.4)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.print_rounded, size: 16, color: GroceryColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    AppStrings.get('save_print_bill', locale),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: GroceryColors.primaryDark),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
