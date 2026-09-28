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
          // Column headers — visible on all screen sizes
          const _CartColumnHeaders(),
          const Divider(height: 1),
          const Expanded(child: _CartList()),
          const Divider(height: 1),
          // Bottom section — scrollable on mobile to avoid overflow
          if (narrow)
            SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
                    child: Column(
                      children: const [
                        _AdjustmentInputs(expandNote: false),
                        SizedBox(height: 6),
                        _PaymentSummary(),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 6),
                    child: const _MobilePayButtons(),
                  ),
                ],
              ),
            )
          else ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
              child: const IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      flex: 48,
                      child: _AdjustmentInputs(expandNote: true),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      flex: 52,
                      child: _PaymentSummary(),
                    ),
                  ],
                ),
              ),
            ),
            const Divider(height: 1),
            const Padding(
              padding: EdgeInsets.fromLTRB(12, 4, 12, 4),
              child: _PaymentMethods(),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 6),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 58,
                    child: _NumpadAndTools(),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    flex: 42,
                    child: _PayButtons(),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Cart Column Headers ───────────────────────────────────────
class _CartColumnHeaders extends StatelessWidget {
  const _CartColumnHeaders();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final locale = context.watch<AppProvider>().locale;
    final narrow = MediaQuery.of(context).size.width < 700;

    final totalWidth = narrow ? 58.0 : 70.0;
    final deleteWidth = narrow ? 20.0 : 24.0;

    TextStyle style() => TextStyle(
          fontSize: narrow ? 9 : 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.4,
          color: GroceryColors.textSecondary(isDark),
        );

    String t(String en, String bn) => locale == 'bn' ? bn : en;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: narrow ? 13 : 14, vertical: 5),
      color: isDark ? GroceryColors.inputBg(true) : const Color(0xFFF8FFF8),
      child: Row(
        children: [
          // Item column
          Expanded(
            flex: 7,
            child: Text(t('ITEM', 'পণ্য'), style: style()),
          ),
          // Price column
          Expanded(
            flex: 3,
            child: Text(t('PRICE', 'মূল্য'), textAlign: TextAlign.center, style: style()),
          ),
          // Qty column
          Expanded(
            flex: 3,
            child: Text(t('QTY', 'পরিমাণ'), textAlign: TextAlign.center, style: style()),
          ),
          // Total column
          SizedBox(
            width: totalWidth,
            child: Text(t('TOTAL', 'মোট'), textAlign: TextAlign.right, style: style()),
          ),
          SizedBox(width: deleteWidth), // space for delete icon
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
    final narrow = MediaQuery.of(context).size.width < 700;

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
      separatorBuilder: (_, _) => const SizedBox(height: 4),
      itemBuilder: (context, index) {
        return _CartRow(item: cart[index], locale: locale, isDark: isDark, narrow: narrow);
      },
    );
  }
}

class _CartRow extends StatelessWidget {
  final GroceryCartItem item;
  final String locale;
  final bool isDark;
  final bool narrow;
  const _CartRow({
    required this.item,
    required this.locale,
    required this.isDark,
    this.narrow = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = item.product;
    // On mobile use smaller image and compact stepper to avoid overflow
    final imgSize = narrow ? 30.0 : 36.0;
    final nameFontSize = narrow ? 9.5 : 10.5;
    final totalWidth = narrow ? 58.0 : 70.0;
    final deleteWidth = narrow ? 20.0 : 24.0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: EdgeInsets.symmetric(horizontal: narrow ? 3 : 4, vertical: narrow ? 5 : 6),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primarySoft,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // ITEM column (flex 7): image + name
          Expanded(
            flex: 7,
            child: Row(
              children: [
                SizedBox(width: narrow ? 2 : 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: SizedBox(
                    width: imgSize,
                    height: imgSize,
                    child: CachedNetworkImage(
                      imageUrl: p.imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, _) => Container(
                        color: GroceryColors.mint,
                        child: Center(child: Text(p.emoji, style: TextStyle(fontSize: narrow ? 13 : 16))),
                      ),
                      errorWidget: (_, _, _) => Container(
                        color: GroceryColors.mint,
                        child: Center(child: Text(p.emoji, style: TextStyle(fontSize: narrow ? 13 : 16))),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    '${p.localizedName(locale)} (${p.localizedUnit(locale)})',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: nameFontSize,
                      fontWeight: FontWeight.w700,
                      color: GroceryColors.textPrimary(isDark),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // PRICE column (flex 3)
          Expanded(
            flex: 3,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (item.discountPercent > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 1),
                    decoration: BoxDecoration(
                      color: GroceryColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '${NumberUtils.toLocalized(item.discountPercent.toStringAsFixed(0), locale)}%',
                      style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: GroceryColors.primaryDark),
                    ),
                  ),
                Text(
                  '${AppStrings.currency} ${NumberUtils.toLocalized(p.price.toStringAsFixed(2), locale)}',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: narrow ? 9 : 10,
                    fontWeight: FontWeight.w700,
                    color: GroceryColors.textSecondary(isDark),
                  ),
                ),
              ],
            ),
          ),

          // QTY column (flex 3): compact stepper on mobile
          Expanded(
            flex: 3,
            child: Center(
              child: _QtyStepper(
                id: p.id,
                qty: item.quantity,
                isDark: isDark,
                locale: locale,
                compact: narrow,
              ),
            ),
          ),

          // TOTAL column
          SizedBox(
            width: totalWidth,
            child: Text(
              '${AppStrings.currency} ${NumberUtils.toLocalized(item.lineTotal.toStringAsFixed(2), locale)}',
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: narrow ? 10 : 11,
                fontWeight: FontWeight.w900,
                color: GroceryColors.textPrimary(isDark),
              ),
            ),
          ),

          // Delete icon
          SizedBox(
            width: deleteWidth,
            child: InkWell(
              onTap: () => context.read<GroceryProvider>().removeItem(p.id),
              child: Icon(Icons.close_rounded, size: narrow ? 13 : 15, color: Colors.grey.shade400),
            ),
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
  final bool compact;
  const _QtyStepper({
    required this.id,
    required this.qty,
    required this.isDark,
    required this.locale,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final btnSize = compact ? 20.0 : 24.0;
    final iconSize = compact ? 11.0 : 14.0;
    final fontSize = compact ? 11.0 : 12.0;
    final hPad = compact ? 4.0 : 6.0;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.scaffoldBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _stepBtn(Icons.remove_rounded, () => context.read<GroceryProvider>().updateQuantity(id, -1),
              btnSize: btnSize, iconSize: iconSize),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: hPad),
            child: Text(
              NumberUtils.toLocalized(qty, locale),
              style: TextStyle(
                fontSize: fontSize,
                fontWeight: FontWeight.w800,
                color: GroceryColors.textPrimary(isDark),
              ),
            ),
          ),
          _stepBtn(Icons.add_rounded, () => context.read<GroceryProvider>().updateQuantity(id, 1),
              green: true, btnSize: btnSize, iconSize: iconSize),
        ],
      ),
    );
  }

  Widget _stepBtn(IconData icon, VoidCallback onTap, {
    bool green = false,
    double btnSize = 24,
    double iconSize = 14,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        width: btnSize,
        height: btnSize,
        alignment: Alignment.center,
        decoration: green
            ? BoxDecoration(
                gradient: GroceryColors.primaryGradient,
                borderRadius: BorderRadius.circular(6),
              )
            : null,
        child: Icon(icon, size: iconSize, color: green ? Colors.white : Colors.grey),
      ),
    );
  }
}

// ── Discount / Coupon / Note inputs ──────────────────────────
class _AdjustmentInputs extends StatefulWidget {
  final bool expandNote;
  const _AdjustmentInputs({this.expandNote = true});

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

    final noteBox = Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.cardBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 3, right: 6),
            child: Icon(Icons.notes_rounded, size: 14, color: GroceryColors.textSecondary(isDark)),
          ),
          Expanded(
            child: TextField(
              onChanged: (v) => provider.setSalesNote(v),
              maxLines: widget.expandNote ? null : 1,
              expands: widget.expandNote,
              textAlignVertical: TextAlignVertical.top,
              style: TextStyle(fontSize: 10.5, color: GroceryColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: AppStrings.get('sales_note_hint', locale),
                hintStyle: TextStyle(fontSize: 10, color: GroceryColors.textSecondary(isDark)),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.only(top: 2),
              ),
            ),
          ),
        ],
      ),
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primarySoft,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
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
          const SizedBox(height: 5),
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
          const SizedBox(height: 5),
          // Fill vertical height if expanded (in side-by-side mode), or fixed height if narrow (in column mode)
          if (widget.expandNote)
            Expanded(child: noteBox)
          else
            SizedBox(height: 34, child: noteBox),
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
          width: 76,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
              color: GroceryColors.textSecondary(isDark),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Expanded(
          child: Container(
            height: 29,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.cardBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: GroceryColors.border(isDark)),
            ),
            child: TextField(
              controller: controller,
              onChanged: onChanged,
              style: TextStyle(fontSize: 11, color: GroceryColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(fontSize: 10.5, color: GroceryColors.textSecondary(isDark)),
                border: InputBorder.none,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 6),
              ),
            ),
          ),
        ),
        const SizedBox(width: 5),
        InkWell(
          onTap: onApply,
          borderRadius: BorderRadius.circular(6),
          child: Container(
            height: 29,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: GroceryColors.primaryGradient,
              borderRadius: BorderRadius.circular(6),
              boxShadow: [
                BoxShadow(
                  color: GroceryColors.primary.withValues(alpha: 0.25),
                  blurRadius: 3,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Text(
              AppStrings.get('apply', locale),
              style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Colors.white),
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
              padding: const EdgeInsets.only(bottom: 4),
              child: Tooltip(
                message: AppStrings.get(t.$2, locale),
                child: InkWell(
                  onTap: t.$3,
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: isDark ? GroceryColors.inputBg(true) : Colors.white,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: GroceryColors.border(isDark)),
                      boxShadow: GroceryColors.softShadow(isDark),
                    ),
                    child: Icon(t.$1, size: 14, color: GroceryColors.primary),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(width: 6),
        // Numpad
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Tender input display
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 4),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                height: 26,
                decoration: BoxDecoration(
                  color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6),
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
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        color: GroceryColors.textSecondary(isDark),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      AppStrings.currency,
                      style: const TextStyle(
                        fontSize: 11,
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
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: GroceryColors.primaryDark,
                        ),
                      ),
                    ),
                    if (provider.numpadValue.isNotEmpty) ...[
                      const SizedBox(width: 4),
                      InkWell(
                        onTap: () => context.read<GroceryProvider>().clearNumpad(),
                        borderRadius: BorderRadius.circular(8),
                        child: const Padding(
                          padding: EdgeInsets.all(1),
                          child: Icon(Icons.close_rounded, size: 12, color: Colors.grey),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              // 4 Rows of Numpad Keys - Balanced comfortable height
              for (int r = 0; r < 4; r++) ...[
                if (r > 0) const SizedBox(height: 4),
                SizedBox(
                  height: 31,
                  child: Row(
                    children: [
                      for (int c = 0; c < 3; c++) ...[
                        if (c > 0) const SizedBox(width: 4),
                        Expanded(
                          child: _NumKey(
                            label: keys[r * 3 + c],
                            isDark: isDark,
                            isSpecial: keys[r * 3 + c] == '⌫',
                            onTap: () => context.read<GroceryProvider>().numpadPress(keys[r * 3 + c]),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 4),
              // Clear & Exact Amount Action Buttons
              SizedBox(
                height: 29,
                child: Row(
                  children: [
                    // Clear button
                    InkWell(
                      onTap: () => context.read<GroceryProvider>().clearNumpad(),
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isDark ? GroceryColors.inputBg(true) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: isDark ? GroceryColors.border(true) : Colors.grey.shade300),
                        ),
                        child: Text(
                          'C',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: GroceryColors.textSecondary(isDark),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    // Exact Amount button
                    Expanded(
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => context.read<GroceryProvider>().setExactTender(),
                          borderRadius: BorderRadius.circular(6),
                          child: Ink(
                            decoration: BoxDecoration(
                              gradient: GroceryColors.primaryGradient,
                              borderRadius: BorderRadius.circular(6),
                              boxShadow: [
                                BoxShadow(
                                  color: GroceryColors.primary.withValues(alpha: 0.3),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Container(
                              alignment: Alignment.center,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.done_all_rounded, size: 13, color: Colors.white),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        '${AppStrings.get('exact_amount', locale)} (${AppStrings.currency}${NumberUtils.toLocalized(provider.grandTotal.toStringAsFixed(2), locale)})',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                        ),
                                      ),
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
        duration: const Duration(milliseconds: 60),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: widget.isSpecial
                ? GroceryColors.primary.withValues(alpha: 0.12)
                : (widget.isDark ? GroceryColors.inputBg(true) : Colors.white),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: GroceryColors.border(widget.isDark)),
            boxShadow: GroceryColors.softShadow(widget.isDark),
          ),
          child: widget.label == '⌫'
              ? Icon(Icons.backspace_outlined, size: 14, color: GroceryColors.primary)
              : Text(
                  widget.label,
                  style: TextStyle(
                    fontSize: 13,
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
        padding: const EdgeInsets.symmetric(vertical: 0.7),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: bold ? 11.5 : 9.5,
                fontWeight: bold ? FontWeight.w900 : FontWeight.w600,
                color: bold
                    ? GroceryColors.textPrimary(isDark)
                    : GroceryColors.textSecondary(isDark),
              ),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: bold ? 13.5 : 10,
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primarySoft,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: GroceryColors.border(isDark)),
      ),
      child: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            Divider(color: GroceryColors.border(isDark), height: 5),
            row(
              AppStrings.get('total', locale),
              '${AppStrings.currency} ${NumberUtils.toLocalized(p.grandTotal.toStringAsFixed(2), locale)}',
              bold: true,
              valueColor: GroceryColors.primaryDark,
            ),
            Divider(color: GroceryColors.border(isDark), height: 5),
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
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 1.5),
                decoration: BoxDecoration(
                  color: GroceryColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${AppStrings.get('you_save', locale)} ${AppStrings.currency} ${NumberUtils.toLocalized(p.totalSavings.toStringAsFixed(2), locale)}',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    color: GroceryColors.primaryDark,
                  ),
                ),
              ),
            ],
          ],
        ),
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

    return Row(
      children: [
        for (int i = 0; i < methods.length; i++) ...[
          if (i > 0) const SizedBox(width: 4),
          Expanded(
            child: _buildChip(
              context: context,
              name: methods[i].$1,
              labelKey: methods[i].$2,
              icon: methods[i].$3,
              isSelected: selected == methods[i].$1,
              isDark: isDark,
              locale: locale,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildChip({
    required BuildContext context,
    required String name,
    required String labelKey,
    required IconData icon,
    required bool isSelected,
    required bool isDark,
    required String locale,
  }) {
    return InkWell(
      onTap: () => context.read<GroceryProvider>().setPayment(name),
      borderRadius: BorderRadius.circular(6),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 4.5, horizontal: 2),
        decoration: BoxDecoration(
          gradient: isSelected ? GroceryColors.primaryGradient : null,
          color: isSelected ? null : (isDark ? GroceryColors.inputBg(true) : Colors.white),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? Colors.transparent : GroceryColors.border(isDark),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: GroceryColors.primary.withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 13,
              color: isSelected ? Colors.white : GroceryColors.primary,
            ),
            const SizedBox(height: 1.5),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                AppStrings.get(labelKey, locale),
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                  color: isSelected ? Colors.white : GroceryColors.textPrimary(isDark),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Mobile Pay Buttons (compact row, no numpad) ──────────────
class _MobilePayButtons extends StatelessWidget {
  const _MobilePayButtons();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final p = context.watch<GroceryProvider>();
    final total = NumberUtils.toLocalized(p.grandTotal.toStringAsFixed(2), locale);

    // Small compact button helper
    Widget smallBtn({
      required IconData icon,
      required String label,
      required VoidCallback onTap,
      required Color iconColor,
      required Color labelColor,
      required Color bgColor,
      required Color borderColor,
      List<BoxShadow>? shadows,
      Widget? badge,
    }) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            height: 44,
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: borderColor),
              boxShadow: shadows,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, size: 17, color: iconColor),
                    const SizedBox(height: 2),
                    Text(
                      label,
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: labelColor),
                    ),
                  ],
                ),
                if (badge != null)
                  Positioned(top: 3, right: 3, child: badge),
              ],
            ),
          ),
        ),
      );
    }

    return Row(
      children: [
        // 1. Print button (left)
        Expanded(
          flex: 24,
          child: smallBtn(
            icon: Icons.print_rounded,
            label: locale == 'bn' ? 'প্রিন্ট' : 'Print',
            iconColor: GroceryColors.primary,
            labelColor: GroceryColors.primaryDark,
            bgColor: isDark ? GroceryColors.inputBg(true) : Colors.white,
            borderColor: GroceryColors.primary.withValues(alpha: 0.45),
            shadows: GroceryColors.softShadow(isDark),
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
          ),
        ),
        const SizedBox(width: 6),
        // 2. Hold button (middle-left)
        Expanded(
          flex: 24,
          child: smallBtn(
            icon: Icons.pause_circle_outline_rounded,
            label: locale == 'bn' ? 'হোল্ড' : 'Hold',
            iconColor: const Color(0xFFD97706),
            labelColor: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
            bgColor: isDark ? GroceryColors.inputBg(true) : const Color(0xFFFFFBEB),
            borderColor: isDark ? const Color(0xFFD97706).withValues(alpha: 0.4) : const Color(0xFFFCD34D),
            badge: p.heldBills.isNotEmpty
                ? GestureDetector(
                    onTap: () {
                      showDialog(
                        context: context,
                        builder: (_) => ChangeNotifierProvider.value(
                          value: p,
                          child: const GroceryHeldBillsDialog(),
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${p.heldBills.length}',
                        style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                    ),
                  )
                : null,
            onTap: () {
              if (!gRequireCart(context)) return;
              final ok = context.read<GroceryProvider>().holdCurrentBill();
              if (ok) gSnack(context, AppStrings.get('g_bill_held', locale));
            },
          ),
        ),
        const SizedBox(width: 6),
        // 3. Pay button (right – dominant)
        Expanded(
          flex: 52,
          child: Material(
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
              borderRadius: BorderRadius.circular(8),
              child: Ink(
                decoration: BoxDecoration(
                  gradient: GroceryColors.payGradient,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: GroceryColors.primary.withValues(alpha: 0.35),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle_rounded, color: Colors.white, size: 12),
                          const SizedBox(width: 3),
                          Text(
                            AppStrings.get('pay', locale),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          const SizedBox(width: 3),
                          const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 11),
                        ],
                      ),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          '${AppStrings.currency} $total',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.white),
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
      mainAxisSize: MainAxisSize.min,
      children: [
        // 1. Hold Button
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              if (!gRequireCart(context)) return;
              final ok = context.read<GroceryProvider>().holdCurrentBill();
              if (ok) gSnack(context, AppStrings.get('g_bill_held', locale));
            },
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: double.infinity,
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: isDark ? GroceryColors.inputBg(true) : const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? const Color(0xFFD97706).withValues(alpha: 0.4) : const Color(0xFFFCD34D),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.pause_circle_outline_rounded, size: 18, color: Color(0xFFD97706)),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppStrings.get('hold_f7', locale),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                          ),
                        ),
                        Text(
                          locale == 'bn' ? 'বিল হোল্ড করুন' : 'Hold Current Order',
                          style: TextStyle(
                            fontSize: 9.5,
                            color: GroceryColors.textSecondary(isDark),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (p.heldBills.isNotEmpty)
                    InkWell(
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (_) => ChangeNotifierProvider.value(
                            value: p,
                            child: const GroceryHeldBillsDialog(),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${p.heldBills.length}',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        // 2. Pay Button (Prominent Main Action)
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
            borderRadius: BorderRadius.circular(8),
            child: Ink(
              decoration: BoxDecoration(
                gradient: GroceryColors.payGradient,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: GroceryColors.primary.withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Container(
                width: double.infinity,
                height: 76,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle_rounded, color: Colors.white, size: 15),
                        const SizedBox(width: 5),
                        Text(
                          AppStrings.get('pay', locale),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Colors.white),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                      ],
                    ),
                    const SizedBox(height: 3),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        '${AppStrings.currency} $total',
                        style: const TextStyle(
                          fontSize: 19,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        // 3. Save & Print Bill Button
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
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: double.infinity,
              height: 50,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: isDark ? GroceryColors.inputBg(true) : Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: GroceryColors.primary.withValues(alpha: 0.45)),
                boxShadow: GroceryColors.softShadow(isDark),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: GroceryColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.print_rounded, size: 18, color: GroceryColors.primary),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppStrings.get('save_print_bill', locale),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: GroceryColors.primaryDark,
                          ),
                        ),
                        Text(
                          locale == 'bn' ? 'রসিদ প্রিন্ট করুন' : 'Print Receipt',
                          style: TextStyle(
                            fontSize: 9.5,
                            color: GroceryColors.textSecondary(isDark),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right_rounded, size: 18, color: Colors.grey),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
