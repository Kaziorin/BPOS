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
          // Bottom section: mobile view (no calculator, clean pay row) vs web view (unified 4-column checkout card)
          if (narrow)
            SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 4),
                    child: Column(
                      children: const [
                        _AdjustmentInputs(),
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
              padding: const EdgeInsets.fromLTRB(8, 4, 8, 4),
              child: const SizedBox(
                height: 118,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      flex: 48,
                      child: _AdjustmentInputs(),
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
            const Padding(
              padding: EdgeInsets.fromLTRB(8, 0, 8, 6),
              child: _BottomCheckoutCard(),
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
    final totalWidth = 52.0;
    final deleteWidth = 18.0;

    TextStyle style() => TextStyle(
          fontSize: 8.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.3,
          color: GroceryColors.textSecondary(isDark),
        );

    String t(String en, String bn) => locale == 'bn' ? bn : en;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
      padding: const EdgeInsets.fromLTRB(10, 8, 8, 8),
      child: Row(
        children: [
          Icon(Icons.shopping_cart_rounded, size: 16, color: GroceryColors.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              '${AppStrings.get('cart', locale)} (${NumberUtils.toLocalized(p.totalItems, locale)})',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: GroceryColors.textPrimary(isDark),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
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
            },
          ),
          const SizedBox(width: 4),
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
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: GroceryColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Badge(
                isLabelVisible: p.heldBills.isNotEmpty,
                label: Text('${p.heldBills.length}', style: const TextStyle(fontSize: 8)),
                child: const Icon(Icons.inventory_rounded, size: 14, color: GroceryColors.primary),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      itemCount: cart.length,
      separatorBuilder: (_, _) => const SizedBox(height: 3),
      itemBuilder: (context, index) {
        return _CartRow(item: cart[index], locale: locale, isDark: isDark, narrow: true);
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
  const _AdjustmentInputs();

  @override
  State<_AdjustmentInputs> createState() => _AdjustmentInputsState();
}

class _AdjustmentInputsState extends State<_AdjustmentInputs> {
  final _discountCtrl = TextEditingController();
  final _couponCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();

  @override
  void dispose() {
    _discountCtrl.dispose();
    _couponCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final locale = context.watch<AppProvider>().locale;
    final provider = context.read<GroceryProvider>();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? GroceryColors.border(true) : const Color(0xFFDCFCE7),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Row 1: Discount
          Row(
            children: [
              SizedBox(
                width: 52,
                child: Text(
                  'Discount',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: GroceryColors.textPrimary(isDark),
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  height: 27,
                  decoration: BoxDecoration(
                    color: isDark ? GroceryColors.cardBg(true) : Colors.white,
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isDark ? GroceryColors.border(true) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  alignment: Alignment.center,
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _discountCtrl,
                          textAlign: TextAlign.right,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: GroceryColors.textPrimary(isDark),
                          ),
                          decoration: const InputDecoration(
                            hintText: '0.00',
                            hintStyle: TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8)),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Text(
                        '%',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 5),
              InkWell(
                onTap: () {
                  final pct = double.tryParse(_discountCtrl.text) ?? 0;
                  provider.applyBillDiscount(pct);
                  gSnack(context, '$pct% ${AppStrings.get('discount_label', locale)}');
                },
                borderRadius: BorderRadius.circular(5),
                child: Container(
                  height: 27,
                  padding: const EdgeInsets.symmetric(horizontal: 9),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0xFF047857),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: const Text(
                    'Apply',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          // Row 2: Coupon
          Row(
            children: [
              SizedBox(
                width: 52,
                child: Text(
                  'Coupon',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: GroceryColors.textPrimary(isDark),
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  height: 27,
                  decoration: BoxDecoration(
                    color: isDark ? GroceryColors.cardBg(true) : Colors.white,
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isDark ? GroceryColors.border(true) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  alignment: Alignment.center,
                  child: TextField(
                    controller: _couponCtrl,
                    onChanged: (v) => provider.setCouponCode(v),
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: GroceryColors.textPrimary(isDark),
                    ),
                    decoration: const InputDecoration(
                      hintText: 'e.g. SAVE10',
                      hintStyle: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 5),
              InkWell(
                onTap: () {
                  final ok = provider.applyCouponCode(_couponCtrl.text);
                  gSnack(
                    context,
                    ok
                        ? (locale == 'bn' ? 'কুপন প্রয়োগ হয়েছে' : 'Coupon applied')
                        : (locale == 'bn' ? 'অবৈধ কুপন' : 'Invalid coupon'),
                    color: ok ? const Color(0xFF047857) : Colors.red.shade700,
                  );
                },
                borderRadius: BorderRadius.circular(5),
                child: Container(
                  height: 27,
                  padding: const EdgeInsets.symmetric(horizontal: 9),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0xFF047857),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: const Text(
                    'Apply',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          // Row 3: Note
          Row(
            children: [
              SizedBox(
                width: 52,
                child: Text(
                  'Note',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: GroceryColors.textPrimary(isDark),
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  height: 27,
                  decoration: BoxDecoration(
                    color: isDark ? GroceryColors.cardBg(true) : Colors.white,
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isDark ? GroceryColors.border(true) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  alignment: Alignment.center,
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _noteCtrl,
                          onChanged: (v) => provider.setSalesNote(v),
                          style: TextStyle(fontSize: 10.5, color: GroceryColors.textPrimary(isDark)),
                          decoration: const InputDecoration(
                            hintText: 'Add note...',
                            hintStyle: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      const Icon(Icons.notes_rounded, size: 16, color: Color(0xFF059669)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Dotted Divider ───────────────────────────────────────────
class _DottedDivider extends StatelessWidget {
  final Color color;

  const _DottedDivider({this.color = const Color(0xFF86EFAC)});

  @override
  Widget build(BuildContext context) {
    const double height = 1.0;
    const double dashWidth = 4.0;
    const double dashSpace = 3.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = constraints.constrainWidth();
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return SizedBox(
          width: boxWidth,
          height: height,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(dashCount, (_) {
              return SizedBox(
                width: dashWidth,
                height: height,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: color),
                ),
              );
            }),
          ),
        );
      },
    );
  }
}

// ── Payment Summary ──────────────────────────────────────────
class _PaymentSummary extends StatelessWidget {
  const _PaymentSummary();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final p = context.watch<GroceryProvider>();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? GroceryColors.border(true) : const Color(0xFFDCFCE7),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Subtotal',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
              ),
              Text(
                '৳ ${p.subtotal.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: GroceryColors.textPrimary(isDark),
                ),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tax (${p.taxRatePct}%)',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
              ),
              Text(
                '৳ ${p.vat.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: GroceryColors.textPrimary(isDark),
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 1.5),
            child: _DottedDivider(color: Color(0xFF86EFAC)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'NET TOTAL',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w900,
                  color: GroceryColors.textPrimary(isDark),
                ),
              ),
              Text(
                '৳ ${p.grandTotal.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 16.5,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF047857),
                ),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Cash Given:',
                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
              ),
              Text(
                '৳ ${p.tenderedAmount.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: GroceryColors.textPrimary(isDark),
                ),
              ),
            ],
          ),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF064E3B) : const Color(0xFFD1FAE5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0),
                ),
              ),
              child: Text(
                'Change: ৳ ${p.changeAmount.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  color: isDark ? const Color(0xFFA7F3D0) : const Color(0xFF065F46),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Unified Bottom Checkout Card (4 Columns) ─────────────────
class _BottomCheckoutCard extends StatelessWidget {
  const _BottomCheckoutCard();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;

    return Container(
      height: 175,
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.cardBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: GroceryColors.border(isDark)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Column 1: Function Keys
          const Expanded(
            flex: 23,
            child: _POSFunctionKeys(),
          ),
          const SizedBox(width: 5),
          // 2. Column 2: Calculator Pad
          const Expanded(
            flex: 34,
            child: _POSCalculatorPad(),
          ),
          const SizedBox(width: 5),
          // Subtle Vertical Divider
          VerticalDivider(
            width: 1,
            thickness: 1,
            color: isDark ? GroceryColors.border(true) : const Color(0xFFE2E8F0),
          ),
          const SizedBox(width: 5),
          // 3. Column 3: Payment Methods
          const Expanded(
            flex: 23,
            child: _POSPaymentMethods(),
          ),
          const SizedBox(width: 5),
          // 4. Column 4: Action Buttons (Hold, Pay, Save & Print)
          const Expanded(
            flex: 24,
            child: _POSActionButtons(),
          ),
        ],
      ),
    );
  }
}

// ── Column 1: POS Function Keys ──────────────────────────────
class _POSFunctionKeys extends StatelessWidget {
  const _POSFunctionKeys();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.watch<GroceryProvider>();

    return Column(
      children: [
        Expanded(
          child: _fnBtn(
            icon: Icons.search_rounded,
            title: 'Price Check',
            shortcut: 'F3',
            isDark: isDark,
            onTap: () {
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: provider,
                  child: const GroceryPriceCheckDialog(),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 3),
        Expanded(
          child: _fnBtn(
            icon: Icons.crop_free_rounded,
            title: 'Barcode Scan',
            shortcut: 'F4',
            isDark: isDark,
            onTap: () {
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: provider,
                  child: const GroceryBarcodeDialog(),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 3),
        Expanded(
          child: _fnBtn(
            icon: Icons.history_rounded,
            title: 'Recent Sales',
            shortcut: 'F5',
            isDark: isDark,
            onTap: () {
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: provider,
                  child: const GrocerySalesHistoryDialog(),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 3),
        Expanded(
          child: _fnBtn(
            icon: Icons.replay_rounded,
            title: 'Returns',
            shortcut: 'F6',
            isDark: isDark,
            onTap: () {
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: provider,
                  child: const GroceryReturnDialog(),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _fnBtn({
    required IconData icon,
    required String title,
    required String shortcut,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
        decoration: BoxDecoration(
          color: isDark ? GroceryColors.inputBg(true) : Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: isDark ? GroceryColors.border(true) : const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: const Color(0xFF059669)),
            const SizedBox(width: 5),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w700,
                        color: GroceryColors.textPrimary(isDark),
                      ),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 3, vertical: 0.5),
                    decoration: BoxDecoration(
                      color: isDark ? GroceryColors.cardBg(true) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(3),
                      border: Border.all(color: isDark ? GroceryColors.border(true) : const Color(0xFFE2E8F0)),
                    ),
                    child: Text(
                      shortcut,
                      style: const TextStyle(
                        fontSize: 7.5,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF64748B),
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

// ── Column 2: 4x4 Calculator Pad ─────────────────────────────
class _POSCalculatorPad extends StatelessWidget {
  const _POSCalculatorPad();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    return Column(
      children: [
        // Row 1: 7, 8, 9, ⌫
        Expanded(
          child: Row(
            children: [
              _calcKey('7', isDark: isDark, onTap: () => provider.numpadPress('7')),
              const SizedBox(width: 3),
              _calcKey('8', isDark: isDark, onTap: () => provider.numpadPress('8')),
              const SizedBox(width: 3),
              _calcKey('9', isDark: isDark, onTap: () => provider.numpadPress('9')),
              const SizedBox(width: 3),
              _calcKey(
                '⌫',
                isDark: isDark,
                isRed: true,
                onTap: () => provider.numpadPress('⌫'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 3),
        // Row 2: 4, 5, 6, +
        Expanded(
          child: Row(
            children: [
              _calcKey('4', isDark: isDark, onTap: () => provider.numpadPress('4')),
              const SizedBox(width: 3),
              _calcKey('5', isDark: isDark, onTap: () => provider.numpadPress('5')),
              const SizedBox(width: 3),
              _calcKey('6', isDark: isDark, onTap: () => provider.numpadPress('6')),
              const SizedBox(width: 3),
              _calcKey('+', isDark: isDark, onTap: () {
                if (provider.cart.isNotEmpty) {
                  provider.updateQuantity(provider.cart.last.product.id, 1);
                }
              }),
            ],
          ),
        ),
        const SizedBox(height: 3),
        // Row 3: 1, 2, 3, -
        Expanded(
          child: Row(
            children: [
              _calcKey('1', isDark: isDark, onTap: () => provider.numpadPress('1')),
              const SizedBox(width: 3),
              _calcKey('2', isDark: isDark, onTap: () => provider.numpadPress('2')),
              const SizedBox(width: 3),
              _calcKey('3', isDark: isDark, onTap: () => provider.numpadPress('3')),
              const SizedBox(width: 3),
              _calcKey('-', isDark: isDark, onTap: () {
                if (provider.cart.isNotEmpty) {
                  provider.updateQuantity(provider.cart.last.product.id, -1);
                }
              }),
            ],
          ),
        ),
        const SizedBox(height: 3),
        // Row 4: 0, 00, ., - (green button)
        Expanded(
          child: Row(
            children: [
              _calcKey('0', isDark: isDark, onTap: () => provider.numpadPress('0')),
              const SizedBox(width: 3),
              _calcKey('00', isDark: isDark, onTap: () => provider.numpadPress('00')),
              const SizedBox(width: 3),
              _calcKey('.', isDark: isDark, onTap: () => provider.numpadPress('.')),
              const SizedBox(width: 3),
              _calcKey(
                '-',
                isDark: isDark,
                isGreenAction: true,
                onTap: () => provider.setExactTender(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _calcKey(
    String label, {
    required bool isDark,
    required VoidCallback onTap,
    bool isRed = false,
    bool isGreenAction = false,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isGreenAction
                ? const Color(0xFF047857)
                : (isRed
                    ? (isDark ? const Color(0xFF7F1D1D).withValues(alpha: 0.3) : const Color(0xFFFEF2F2))
                    : (isDark ? GroceryColors.inputBg(true) : Colors.white)),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isGreenAction
                  ? const Color(0xFF047857)
                  : (isRed
                      ? (isDark ? const Color(0xFFEF4444).withValues(alpha: 0.4) : const Color(0xFFFECACA))
                      : (isDark ? GroceryColors.border(true) : const Color(0xFFE2E8F0))),
            ),
          ),
          child: isRed
              ? const Icon(Icons.backspace_outlined, size: 14, color: Color(0xFFEF4444))
              : isGreenAction
                  ? Container(
                      width: 12,
                      height: 3,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    )
                  : Text(
                      label,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: GroceryColors.textPrimary(isDark),
                      ),
                    ),
        ),
      ),
    );
  }
}

// ── Column 3: Payment Methods ────────────────────────────────
class _POSPaymentMethods extends StatelessWidget {
  const _POSPaymentMethods();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.watch<GroceryProvider>();
    final selected = provider.selectedPayment;

    final methods = [
      ('Cash', Icons.payments_outlined),
      ('Card', Icons.credit_card_outlined),
      ('UPI / QR', Icons.grid_view_rounded),
      ('Wallet', Icons.account_balance_wallet_outlined),
      ('Split Payment', Icons.layers_outlined),
    ];

    return Column(
      children: [
        for (int i = 0; i < methods.length; i++) ...[
          if (i > 0) const SizedBox(height: 3),
          Expanded(
            child: _payMethodBtn(
              title: methods[i].$1,
              icon: methods[i].$2,
              isSelected: selected == methods[i].$1 || (selected == 'Split' && methods[i].$1 == 'Split Payment'),
              isDark: isDark,
              onTap: () {
                final val = methods[i].$1 == 'Split Payment' ? 'Split' : methods[i].$1;
                context.read<GroceryProvider>().setPayment(val);
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _payMethodBtn({
    required String title,
    required IconData icon,
    required bool isSelected,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF047857)
              : (isDark ? GroceryColors.inputBg(true) : Colors.white),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF047857)
                : (isDark ? GroceryColors.border(true) : const Color(0xFFE2E8F0)),
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected
                  ? Colors.white
                  : (isDark ? GroceryColors.textSecondary(true) : const Color(0xFF64748B)),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.white : GroceryColors.textPrimary(isDark),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Column 4: Hold, Pay, Print Buttons ─────────────────────────
class _POSActionButtons extends StatelessWidget {
  const _POSActionButtons();

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final locale = context.watch<AppProvider>().locale;
    final provider = context.watch<GroceryProvider>();
    final total = provider.grandTotal.toStringAsFixed(2);
    final hasItems = provider.cart.isNotEmpty;

    return Column(
      children: [
        // 1. Hold Bill (F7)
        InkWell(
          onTap: () {
            if (!gRequireCart(context)) return;
            final ok = context.read<GroceryProvider>().holdCurrentBill();
            if (ok) gSnack(context, AppStrings.get('g_bill_held', locale));
          },
          borderRadius: BorderRadius.circular(6),
          child: Container(
            height: 33,
            padding: const EdgeInsets.symmetric(horizontal: 5),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.inputBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFF59E0B), width: 1.2),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.pause_circle_outline_rounded, size: 15, color: Color(0xFFD97706)),
                const SizedBox(width: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'Hold Bill (F7)',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 3),
        // 2. Pay Button (Sage Green when empty, Light/Bright Emerald Green when cart has items)
        Expanded(
          child: InkWell(
            onTap: () {
              if (!gRequireCart(context)) return;
              showDialog(
                context: context,
                builder: (_) => ChangeNotifierProvider.value(
                  value: provider,
                  child: const GroceryCheckoutDialog(),
                ),
              );
            },
            borderRadius: BorderRadius.circular(6),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: double.infinity,
              decoration: BoxDecoration(
                color: hasItems ? const Color(0xFF10B981) : const Color(0xFF86B8A5),
                gradient: hasItems
                    ? const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF34D399), Color(0xFF10B981)],
                      )
                    : null,
                borderRadius: BorderRadius.circular(6),
                boxShadow: [
                  BoxShadow(
                    color: hasItems
                        ? const Color(0xFF10B981).withValues(alpha: 0.4)
                        : const Color(0xFF86B8A5).withValues(alpha: 0.25),
                    blurRadius: hasItems ? 6 : 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'Pay',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Text(
                        '৳ $total',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 3),
        // 3. Save & Print Bill
        InkWell(
          onTap: () {
            if (!gRequireCart(context)) return;
            showDialog(
              context: context,
              builder: (_) => ChangeNotifierProvider.value(
                value: provider,
                child: const GroceryBillPrintDialog(),
              ),
            );
          },
          borderRadius: BorderRadius.circular(6),
          child: Container(
            height: 30,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.inputBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: isDark ? GroceryColors.border(true) : const Color(0xFFE2E8F0)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.print_outlined, size: 13, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'Save & Print Bill',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w600,
                      color: isDark ? GroceryColors.textSecondary(true) : const Color(0xFF64748B),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
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
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                height: 44,
                decoration: BoxDecoration(
                  color: p.cart.isNotEmpty ? const Color(0xFF10B981) : const Color(0xFF86B8A5),
                  gradient: p.cart.isNotEmpty
                      ? const LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [Color(0xFF34D399), Color(0xFF10B981)],
                        )
                      : null,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(
                      color: p.cart.isNotEmpty
                          ? const Color(0xFF10B981).withValues(alpha: 0.4)
                          : const Color(0xFF86B8A5).withValues(alpha: 0.25),
                      blurRadius: p.cart.isNotEmpty ? 6 : 3,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
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
      ],
    );
  }
}

