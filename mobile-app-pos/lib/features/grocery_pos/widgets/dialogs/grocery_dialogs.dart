import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../../core/localization/app_strings.dart';
import '../../../../core/providers/app_provider.dart';
import '../../../../core/utils/number_utils.dart';
import '../../models/grocery_product.dart';
import '../../models/grocery_sale.dart';
import '../../providers/grocery_provider.dart';
import '../../theme/grocery_colors.dart';

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
void gSnack(BuildContext context, String msg, {Color? color}) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: color ?? GroceryColors.primaryDark,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}

bool gRequireCart(BuildContext context) {
  final p = context.read<GroceryProvider>();
  final locale = context.read<AppProvider>().locale;
  if (p.cart.isEmpty) {
    gSnack(context, AppStrings.get('cart_empty', locale), color: Colors.orange.shade800);
    return false;
  }
  return true;
}

Future<bool> gConfirmClearCart(BuildContext context) async {
  final locale = context.read<AppProvider>().locale;
  final isDark = context.read<AppProvider>().isDarkMode;
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('clear_cart', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: Text(AppStrings.get('clear_cart_msg', locale)),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: Text(AppStrings.get('cancel', locale)),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(ctx, true),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFEF4444),
            foregroundColor: Colors.white,
          ),
          child: Text(AppStrings.get('clear_all', locale)),
        ),
      ],
    ),
  );
  return result == true;
}

// ─────────────────────────────────────────────────────────────────
// CHECKOUT / PAYMENT
// ─────────────────────────────────────────────────────────────────
class GroceryCheckoutDialog extends StatefulWidget {
  const GroceryCheckoutDialog({super.key});

  @override
  State<GroceryCheckoutDialog> createState() => _GroceryCheckoutDialogState();
}

class _GroceryCheckoutDialogState extends State<GroceryCheckoutDialog> {
  late String _method;
  double _cashTendered = 0;
  final _cashCtrl = TextEditingController();
  int _splitPeople = 2;

  @override
  void initState() {
    super.initState();
    _method = context.read<GroceryProvider>().selectedPayment;
    final tender = context.read<GroceryProvider>().tenderedAmount;
    if (tender > 0) {
      _cashTendered = tender;
      _cashCtrl.text = tender.toStringAsFixed(2);
    }
  }

  @override
  void dispose() {
    _cashCtrl.dispose();
    super.dispose();
  }

  void _setCash(double v) {
    setState(() {
      _cashTendered = v;
      _cashCtrl.text = v.toStringAsFixed(2);
    });
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';
    final provider = context.watch<GroceryProvider>();
    final total = provider.grandTotal;
    final change = _cashTendered >= total ? _cashTendered - total : 0.0;

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: GroceryColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.payments_rounded, color: GroceryColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppStrings.get('g_checkout', locale),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 480,
          maxHeight: MediaQuery.of(context).size.height * 0.75,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: GroceryColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: GroceryColors.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isBn ? 'মোট পরিমাণ:' : 'Total Due:',
                      style: TextStyle(fontWeight: FontWeight.w700, color: GroceryColors.textPrimary(isDark)),
                    ),
                    Text(
                      '${AppStrings.currency}${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 24,
                        color: GroceryColors.primaryDark,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Text(
                isBn ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:',
                style: TextStyle(fontWeight: FontWeight.w800, color: GroceryColors.textPrimary(isDark)),
              ),
              const SizedBox(height: 10),
              Builder(
                builder: (context) {
                  final methods = [
                    ('Cash', AppStrings.get('payment_cash', locale), Icons.payments_outlined),
                    ('Card', AppStrings.get('payment_card', locale), Icons.credit_card_rounded),
                    ('UPI / QR', AppStrings.get('payment_upi', locale), Icons.qr_code_2_rounded),
                    ('Wallet', AppStrings.get('payment_wallet', locale), Icons.account_balance_wallet_outlined),
                    ('Split', isBn ? 'স্প্লিট' : 'Split', Icons.call_split_rounded),
                  ];

                  return Row(
                    children: [
                      for (int i = 0; i < methods.length; i++) ...[
                        if (i > 0) const SizedBox(width: 5),
                        Expanded(
                          child: _methodGridItem(methods[i].$1, methods[i].$2, methods[i].$3, isDark),
                        ),
                      ],
                    ],
                  );
                },
              ),
              if (_method == 'Cash') ...[
                const SizedBox(height: 18),
                Row(
                  children: [
                    Text(isBn ? 'প্রদত্ত নগদ:' : 'Cash Tendered:', style: const TextStyle(fontWeight: FontWeight.w800)),
                    const Spacer(),
                    TextButton(
                      onPressed: () => _setCash(total),
                      child: Text(isBn ? 'পুরো টাকা' : 'Exact Amount',
                          style: const TextStyle(color: GroceryColors.primary, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                TextField(
                  controller: _cashCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  textAlign: TextAlign.right,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                  onChanged: (v) => setState(() => _cashTendered = double.tryParse(v) ?? 0),
                  decoration: InputDecoration(
                    prefixText: '${AppStrings.currency} ',
                    filled: true,
                    fillColor: GroceryColors.inputBg(isDark),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: GroceryColors.primary, width: 2),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [20, 50, 100, 200, 500, 1000].map((a) {
                    return InkWell(
                      onTap: () => _setCash(_cashTendered + a),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          border: Border.all(color: GroceryColors.border(isDark)),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text('+${AppStrings.currency}${NumberUtils.toLocalized(a, locale)}',
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _cashTendered >= total && total > 0
                        ? Colors.green.withValues(alpha: 0.1)
                        : GroceryColors.inputBg(isDark),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _cashTendered >= total && total > 0
                          ? Colors.green.withValues(alpha: 0.35)
                          : GroceryColors.border(isDark),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(isBn ? 'ফেরত:' : 'Change:', style: const TextStyle(fontWeight: FontWeight.w600)),
                      Text(
                        '${AppStrings.currency}${NumberUtils.toLocalized(change.toStringAsFixed(2), locale)}',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                          color: _cashTendered >= total ? Colors.green : GroceryColors.textSecondary(isDark),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              if (_method == 'Split') ...[
                const SizedBox(height: 18),
                Text(isBn ? 'কতজনে ভাগ:' : 'Split among people:', style: const TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    IconButton(
                      onPressed: () => setState(() { if (_splitPeople > 2) _splitPeople--; }),
                      icon: const Icon(Icons.remove_circle_outline),
                    ),
                    Text(NumberUtils.toLocalized(_splitPeople, locale),
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                    IconButton(
                      onPressed: () => setState(() => _splitPeople++),
                      icon: const Icon(Icons.add_circle_outline),
                    ),
                    const Spacer(),
                    Text(
                      '${AppStrings.currency}${NumberUtils.toLocalized((total / _splitPeople).toStringAsFixed(2), locale)} ${isBn ? 'জনপ্রতি' : 'each'}',
                      style: const TextStyle(fontWeight: FontWeight.w800, color: GroceryColors.primaryDark),
                    ),
                  ],
                ),
              ],
              if (_method == 'UPI / QR') ...[
                const SizedBox(height: 18),
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 140,
                        height: 140,
                        decoration: BoxDecoration(
                          border: Border.all(color: GroceryColors.primary, width: 2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.qr_code_2_rounded, size: 100, color: GroceryColors.primary),
                      ),
                      const SizedBox(height: 8),
                      Text(isBn ? 'কাস্টমারকে QR স্ক্যান করতে বলুন' : 'Ask customer to scan QR',
                          style: TextStyle(color: GroceryColors.textSecondary(isDark), fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      actions: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(AppStrings.get('cancel', locale)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: (_method == 'Cash' && _cashTendered < total)
                    ? null
                    : () {
                        provider.setPayment(_method);
                        final sale = provider.placeSale(
                          paymentMethod: _method == 'Split' ? 'Split ($_splitPeople)' : _method,
                          cashTendered: _method == 'Cash' ? _cashTendered : total,
                        );
                        Navigator.pop(context);
                        showDialog(
                          context: context,
                          barrierColor: Colors.black.withValues(alpha: 0.55),
                          builder: (_) => ChangeNotifierProvider.value(
                            value: provider,
                            child: GroceryBillPrintDialog(sale: sale),
                          ),
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: GroceryColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  isBn ? 'পেমেন্ট সম্পন্ন' : 'Complete Payment',
                  style: const TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _methodGridItem(String key, String label, IconData icon, bool isDark) {
    final sel = _method == key;
    return GestureDetector(
      onTap: () => setState(() => _method = key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 7),
        decoration: BoxDecoration(
          gradient: sel ? GroceryColors.primaryGradient : null,
          color: sel ? null : (isDark ? GroceryColors.inputBg(true) : Colors.white),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: sel ? Colors.transparent : GroceryColors.primary.withValues(alpha: 0.35),
            width: sel ? 1.5 : 1,
          ),
          boxShadow: sel
              ? [
                  BoxShadow(
                    color: GroceryColors.primary.withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
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
              size: 16,
              color: sel ? Colors.white : GroceryColors.primary,
            ),
            const SizedBox(height: 3),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 10,
                color: sel ? Colors.white : GroceryColors.textPrimary(isDark),
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class GroceryPaymentSuccessDialog extends StatelessWidget {
  final CompletedSale sale;
  const GroceryPaymentSuccessDialog({super.key, required this.sale});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';
    final provider = context.read<GroceryProvider>();

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.12), shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 48),
          ),
          const SizedBox(height: 14),
          Text(
            isBn ? 'পেমেন্ট সফল!' : 'Payment Successful!',
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: GroceryColors.textPrimary(isDark)),
          ),
          const SizedBox(height: 6),
          Text('${isBn ? 'ইনভয়েস' : 'Invoice'}: ${sale.invoiceNo}',
              style: TextStyle(color: GroceryColors.textSecondary(isDark), fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            '${AppStrings.currency}${NumberUtils.toLocalized(sale.total.toStringAsFixed(2), locale)} · ${sale.paymentMethod}',
            style: const TextStyle(fontWeight: FontWeight.w700),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    showDialog(
                      context: context,
                      builder: (_) => ChangeNotifierProvider.value(
                        value: provider,
                        child: GroceryBillPrintDialog(sale: sale),
                      ),
                    );
                  },
                  icon: const Icon(Icons.print_rounded, size: 16),
                  label: Text(isBn ? 'রসিদ' : 'Receipt'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: GroceryColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(isBn ? 'নতুন সেল' : 'New Sale'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// BILL / RECEIPT PRINT
// ─────────────────────────────────────────────────────────────────
class GroceryBillPrintDialog extends StatelessWidget {
  final CompletedSale? sale;
  const GroceryBillPrintDialog({super.key, this.sale});

  String _formatDate(DateTime dt) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    final m = months[dt.month];
    final hr = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} $m ${dt.year}, $hr:$min';
  }

  Widget _buildDashedDivider() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = constraints.constrainWidth();
        const dashWidth = 4.0;
        const dashSpace = 3.0;
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(dashCount, (_) {
            return const SizedBox(
              width: dashWidth,
              height: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Color(0xFFCBD5E1)),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildBarcode(bool isDark) {
    final barPattern = [3, 1, 2, 2, 1, 3, 1, 2, 3, 1, 1, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 2, 1, 3];
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: barPattern.asMap().entries.map((entry) {
        final isBlack = entry.key % 2 == 0;
        final width = entry.value.toDouble() * 1.5;
        return Container(
          width: width,
          height: 38,
          color: isBlack ? (isDark ? Colors.grey.shade300 : const Color(0xFF1E293B)) : Colors.transparent,
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.watch<GroceryProvider>();

    final receiptBg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final textDark = isDark ? Colors.white : const Color(0xFF0F172A);
    final textMuted = isDark ? Colors.grey.shade400 : const Color(0xFF475569);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE);

    final items = sale?.items ?? provider.cart;
    final subtotal = sale?.subtotal ?? provider.subtotal;
    final discount = sale?.discount ?? provider.totalDiscount;
    final vat = sale?.vat ?? provider.vat;
    final total = sale?.total ?? provider.grandTotal;
    final invoiceDisplay = sale?.invoiceNo ??
        (provider.invoiceNo.isNotEmpty ? provider.invoiceNo : 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}');
    final customer = sale?.customerName ?? provider.customerName;
    final custShort = customer.length > 20 ? '${customer.substring(0, 18)}...' : customer;
    final note = sale?.salesNote ?? provider.salesNote;
    final payMethod = sale?.paymentMethod ?? provider.selectedPayment;
    final timestamp = sale?.timestamp ?? DateTime.now();
    final tendered = sale?.cashTendered ??
        (provider.tenderedAmount > 0 ? provider.tenderedAmount : total);
    final change = sale?.change ??
        (tendered >= total ? tendered - total : 0.0);

    if (items.isEmpty) {
      return AlertDialog(
        title: Text(AppStrings.get('bill_print', locale)),
        content: Text(AppStrings.get('cart_empty', locale)),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale)))],
      );
    }

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Top Success Pill Badge ─────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline_rounded, size: 16, color: Color(0xFF10B981)),
                  SizedBox(width: 6),
                  Text(
                    'SALE COMPLETED SUCCESSFULLY',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Thermal Receipt Card ───────────────────────────────────────
            Container(
              width: 380,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
              decoration: BoxDecoration(
                color: receiptBg,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: borderColor, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Store Header
                  Center(
                    child: Text(
                      'FRESHMART GROCERY',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.8,
                        color: textDark,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      'Dhaka Flagship Outlet • Counter #POS-01',
                      style: TextStyle(
                        fontSize: 9.5,
                        color: textMuted,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Center(
                    child: Text(
                      'BIN / VAT Reg No: 002938194-0101 • Mushak-6.3',
                      style: TextStyle(
                        fontSize: 9,
                        color: textMuted,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 2. Invoice & Cashier details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Invoice: $invoiceDisplay',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Date: ${_formatDate(timestamp)}',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Customer: $custShort',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Cashier: Admin',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (note.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            'Note: $note',
                            style: TextStyle(fontSize: 9.5, color: textMuted, fontFamily: 'monospace', fontStyle: FontStyle.italic),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 8),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 3. Table Headers
                  Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          'ITEM / UNIT',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'QTY',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'RATE',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'TOTAL',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // 4. Item Rows
                  ...items.map((i) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 5,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  i.product.localizedName(locale),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: textDark,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                Text(
                                  'Unit: ${i.product.localizedUnit(locale)} • ${i.product.category}',
                                  style: const TextStyle(
                                    fontSize: 8.5,
                                    color: Color(0xFF94A3B8),
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '${i.quantity}',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: textDark,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '৳${i.product.price.toStringAsFixed(2)}',
                                textAlign: TextAlign.right,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: textMuted,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '৳${i.lineTotal.toStringAsFixed(2)}',
                                textAlign: TextAlign.right,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: textDark,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 6),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 5. Subtotal & VAT
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${subtotal.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (discount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Discount:',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                        Text(
                          '-৳${discount.toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT (Mushak 6.3 - 5%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${vat.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Solid Line
                  const Divider(color: Color(0xFFCBD5E1), height: 1, thickness: 1),
                  const SizedBox(height: 6),

                  // Net Payable
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Net Payable:',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: textDark, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${total.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Solid Line
                  const Divider(color: Color(0xFFCBD5E1), height: 1, thickness: 1),
                  const SizedBox(height: 6),

                  // Tender Details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tender Method:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        payMethod,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Paid Amount:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${tendered.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Return Amount:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669), fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${change.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF059669), fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 12),

                  // 6. Barcode Section
                  Center(child: _buildBarcode(isDark)),
                  const SizedBox(height: 4),
                  const Center(
                    child: Text(
                      '** FRESHMART POS **',
                      style: TextStyle(fontSize: 10, color: Color(0xFF64748B), letterSpacing: 3),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 7. Footer Greetings
                  Center(
                    child: Text(
                      'Thank you for shopping with us! Please\nvisit us again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                        color: textMuted,
                        fontFamily: 'monospace',
                        height: 1.3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text(
                      'Software by Blue Oceans POS',
                      style: TextStyle(
                        fontSize: 8.5,
                        color: isDark ? Colors.grey.shade500 : const Color(0xFF94A3B8),
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Bottom Action Buttons ──────────────────────────────────────
            SizedBox(
              width: 380,
              child: Row(
                children: [
                  // Print Thermal (80mm)
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Printing Thermal Receipt (80mm) for $invoiceDisplay...'),
                            duration: const Duration(seconds: 2),
                            backgroundColor: GroceryColors.primaryDark,
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF242424) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF93C5FD)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.print_outlined, size: 16, color: isDark ? Colors.white : const Color(0xFF334155)),
                            const SizedBox(width: 8),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Print Thermal',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                                    height: 1.1,
                                  ),
                                ),
                                Text(
                                  '(80mm)',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // New Sale Button
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: GroceryColors.primary,
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: GroceryColors.primary.withValues(alpha: 0.35),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.refresh_rounded, size: 18, color: Colors.white),
                            SizedBox(width: 6),
                            Text(
                              'New Sale',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
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
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// HELD BILLS
// ─────────────────────────────────────────────────────────────────
class GroceryHeldBillsDialog extends StatelessWidget {
  const GroceryHeldBillsDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';
    final provider = context.watch<GroceryProvider>();
    final held = provider.heldBills;

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(Icons.pause_circle_outline_rounded, color: GroceryColors.primary),
          const SizedBox(width: 10),
          Text(AppStrings.get('held_orders', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
      content: SizedBox(
        width: 400,
        height: 360,
        child: held.isEmpty
            ? Center(child: Text(AppStrings.get('no_held_orders', locale)))
            : ListView.separated(
                itemCount: held.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final b = held[i];
                  return Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: GroceryColors.border(isDark)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(b.id, style: const TextStyle(fontWeight: FontWeight.w800)),
                            ),
                            Text(
                              '${AppStrings.currency}${NumberUtils.toLocalized(b.total.toStringAsFixed(2), locale)}',
                              style: const TextStyle(fontWeight: FontWeight.w900, color: GroceryColors.primaryDark),
                            ),
                          ],
                        ),
                        Text(
                          '${b.customerName} · ${NumberUtils.toLocalized(b.itemCount, locale)} ${AppStrings.get('items', locale)} · ${DateFormat('hh:mm a').format(b.timestamp)}',
                          style: TextStyle(fontSize: 11, color: GroceryColors.textSecondary(isDark)),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () {
                                  provider.deleteHeldBill(b.id);
                                  gSnack(context, isBn ? 'হোল্ড বিল মুছে ফেলা হয়েছে' : 'Held bill deleted');
                                },
                                child: Text(AppStrings.get('delete', locale)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  provider.recallBill(b);
                                  Navigator.pop(context);
                                  gSnack(context, isBn ? 'বিল রিকল করা হয়েছে' : 'Bill recalled');
                                },
                                icon: const Icon(Icons.restore, size: 16),
                                label: Text(AppStrings.get('recall_order', locale)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: GroceryColors.primary,
                                  foregroundColor: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SALES HISTORY
// ─────────────────────────────────────────────────────────────────
class GrocerySalesHistoryDialog extends StatelessWidget {
  const GrocerySalesHistoryDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';
    final sales = context.watch<GroceryProvider>().completedSales;

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(Icons.receipt_long_rounded, color: GroceryColors.primary),
          const SizedBox(width: 10),
          Text(AppStrings.get('sales_history', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
      content: SizedBox(
        width: 420,
        height: 400,
        child: sales.isEmpty
            ? Center(child: Text(isBn ? 'কোনো সেল নেই' : 'No sales yet'))
            : ListView.separated(
                itemCount: sales.length,
                separatorBuilder: (_, _) => Divider(color: GroceryColors.border(isDark)),
                itemBuilder: (context, i) {
                  final s = sales[i];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: GroceryColors.primary.withValues(alpha: 0.12),
                      child: const Icon(Icons.check, color: GroceryColors.primary, size: 18),
                    ),
                    title: Text(s.invoiceNo, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                    subtitle: Text(
                      '${s.customerName} · ${s.paymentMethod} · ${DateFormat('dd MMM, hh:mm a').format(s.timestamp)}',
                      style: const TextStyle(fontSize: 11),
                    ),
                    trailing: Text(
                      '${AppStrings.currency}${NumberUtils.toLocalized(s.total.toStringAsFixed(2), locale)}',
                      style: const TextStyle(fontWeight: FontWeight.w900, color: GroceryColors.primaryDark),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                      showDialog(
                        context: context,
                        builder: (_) => ChangeNotifierProvider.value(
                          value: context.read<GroceryProvider>(),
                          child: GroceryBillPrintDialog(sale: s),
                        ),
                      );
                    },
                  );
                },
              ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CUSTOMER
// ─────────────────────────────────────────────────────────────────
class GroceryCustomerDialog extends StatelessWidget {
  const GroceryCustomerDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.watch<GroceryProvider>();

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(Icons.person_add_alt_1_rounded, color: GroceryColors.primary),
          const SizedBox(width: 10),
          Text(AppStrings.get('add_customer', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: GroceryProvider.customers.map((c) {
            final sel = provider.customer.id == c.id;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: sel ? GroceryColors.primary.withValues(alpha: 0.1) : null,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: sel ? GroceryColors.primary : GroceryColors.border(isDark)),
              ),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: GroceryColors.primary.withValues(alpha: 0.15),
                  child: Text(c.name[0], style: const TextStyle(color: GroceryColors.primaryDark, fontWeight: FontWeight.w900)),
                ),
                title: Text(c.localizedName(locale), style: TextStyle(fontWeight: sel ? FontWeight.w800 : FontWeight.w600)),
                subtitle: Text('${c.phone} · ${NumberUtils.toLocalized(c.loyaltyPoints, locale)} ${AppStrings.get('pts', locale)}',
                    style: const TextStyle(fontSize: 11)),
                trailing: sel ? const Icon(Icons.check_circle, color: GroceryColors.primary) : null,
                onTap: () {
                  provider.setCustomer(c);
                  Navigator.pop(context);
                  gSnack(context, locale == 'bn' ? 'কাস্টমার নির্বাচিত' : 'Customer selected');
                },
              ),
            );
          }).toList(),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// NOTE / DISCOUNT / COUPON
// ─────────────────────────────────────────────────────────────────
class GroceryNoteDialog extends StatefulWidget {
  const GroceryNoteDialog({super.key});
  @override
  State<GroceryNoteDialog> createState() => _GroceryNoteDialogState();
}

class _GroceryNoteDialogState extends State<GroceryNoteDialog> {
  late final TextEditingController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: context.read<GroceryProvider>().salesNote);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('sales_note', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: TextField(
        controller: _ctrl,
        maxLines: 3,
        decoration: InputDecoration(
          hintText: AppStrings.get('sales_note_hint', locale),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('cancel', locale))),
        ElevatedButton(
          onPressed: () {
            context.read<GroceryProvider>().setSalesNote(_ctrl.text);
            Navigator.pop(context);
            gSnack(context, locale == 'bn' ? 'নোট সেভ হয়েছে' : 'Note saved');
          },
          style: ElevatedButton.styleFrom(backgroundColor: GroceryColors.primary, foregroundColor: Colors.white),
          child: Text(AppStrings.get('save', locale)),
        ),
      ],
    );
  }
}

class GroceryDiscountDialog extends StatelessWidget {
  const GroceryDiscountDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('discount', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [0, 5, 10, 15, 20, 25, 50].map((p) {
          return InkWell(
            onTap: () {
              provider.applyBillDiscount(p.toDouble());
              Navigator.pop(context);
              gSnack(context, '${NumberUtils.toLocalized(p, locale)}% ${AppStrings.get('discount_label', locale)}');
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: 70,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: GroceryColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: GroceryColors.primary.withValues(alpha: 0.3)),
              ),
              child: Text(
                '${NumberUtils.toLocalized(p, locale)}%',
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w900, color: GroceryColors.primaryDark),
              ),
            ),
          );
        }).toList(),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('cancel', locale))),
      ],
    );
  }
}

class GroceryCouponDialog extends StatefulWidget {
  const GroceryCouponDialog({super.key});
  @override
  State<GroceryCouponDialog> createState() => _GroceryCouponDialogState();
}

class _GroceryCouponDialogState extends State<GroceryCouponDialog> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('coupon', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _ctrl,
            decoration: InputDecoration(
              hintText: AppStrings.get('coupon_code', locale),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              isBn ? 'উদাহরণ: SAVE10, FRESH5, WELCOME20' : 'Try: SAVE10, FRESH5, WELCOME20',
              style: TextStyle(fontSize: 11, color: GroceryColors.textSecondary(isDark)),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('cancel', locale))),
        ElevatedButton(
          onPressed: () {
            final ok = context.read<GroceryProvider>().applyCouponCode(_ctrl.text);
            Navigator.pop(context);
            gSnack(
              context,
              ok
                  ? (isBn ? 'কুপন প্রয়োগ হয়েছে' : 'Coupon applied')
                  : (isBn ? 'অবৈধ কুপন' : 'Invalid coupon'),
              color: ok ? GroceryColors.primaryDark : Colors.red.shade700,
            );
          },
          style: ElevatedButton.styleFrom(backgroundColor: GroceryColors.primary, foregroundColor: Colors.white),
          child: Text(AppStrings.get('apply', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PRICE CHECK / STOCK / OFFERS / RECENT / BARCODE
// ─────────────────────────────────────────────────────────────────
class GroceryPriceCheckDialog extends StatefulWidget {
  const GroceryPriceCheckDialog({super.key});
  @override
  State<GroceryPriceCheckDialog> createState() => _GroceryPriceCheckDialogState();
}

class _GroceryPriceCheckDialogState extends State<GroceryPriceCheckDialog> {
  GroceryProduct? _found;
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _search(GroceryProvider p) {
    final q = _ctrl.text.trim().toLowerCase();
    setState(() {
      try {
        _found = p.allProducts.firstWhere(
          (x) =>
              x.name.toLowerCase().contains(q) ||
              x.nameBn.contains(q) ||
              x.id == q,
        );
      } catch (_) {
        _found = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();
    final isBn = locale == 'bn';

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('price_check', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _ctrl,
              onSubmitted: (_) => _search(provider),
              decoration: InputDecoration(
                hintText: isBn ? 'প্রোডাক্ট নাম বা ID' : 'Product name or ID',
                suffixIcon: IconButton(icon: const Icon(Icons.search), onPressed: () => _search(provider)),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            if (_found != null) ...[
              const SizedBox(height: 16),
              Text(_found!.emoji, style: const TextStyle(fontSize: 40)),
              Text(_found!.localizedName(locale), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
              Text(_found!.localizedUnit(locale), style: TextStyle(color: GroceryColors.textSecondary(isDark))),
              const SizedBox(height: 6),
              Text(
                '${AppStrings.currency}${NumberUtils.toLocalized(_found!.price.toStringAsFixed(2), locale)}',
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: GroceryColors.primaryDark),
              ),
              if ((_found!.offerPercent ?? 0) > 0)
                Text(
                  '${NumberUtils.toLocalized(_found!.offerPercent!.toStringAsFixed(0), locale)}% OFF',
                  style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w800),
                ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: () {
                  provider.addToCart(_found!);
                  Navigator.pop(context);
                  gSnack(context, isBn ? 'কার্টে যোগ হয়েছে' : 'Added to cart');
                },
                icon: const Icon(Icons.add_shopping_cart),
                label: Text(AppStrings.get('add_to_cart', locale)),
                style: ElevatedButton.styleFrom(backgroundColor: GroceryColors.primary, foregroundColor: Colors.white),
              ),
            ] else if (_ctrl.text.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(isBn ? 'প্রোডাক্ট পাওয়া যায়নি' : 'Product not found'),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
      ],
    );
  }
}

class GroceryProductListDialog extends StatelessWidget {
  final String titleKey;
  final List<GroceryProduct> products;
  final bool showStock;
  final bool showOffer;

  const GroceryProductListDialog({
    super.key,
    required this.titleKey,
    required this.products,
    this.showStock = false,
    this.showOffer = false,
  });

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get(titleKey, locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: SizedBox(
        width: 400,
        height: 360,
        child: products.isEmpty
            ? Center(child: Text(locale == 'bn' ? 'কিছু নেই' : 'Nothing here'))
            : ListView.builder(
                itemCount: products.length,
                itemBuilder: (context, i) {
                  final p = products[i];
                  return ListTile(
                    leading: Text(p.emoji, style: const TextStyle(fontSize: 28)),
                    title: Text(p.localizedName(locale), style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      [
                        p.localizedUnit(locale),
                        if (showStock) '${locale == 'bn' ? 'স্টক' : 'Stock'}: ${NumberUtils.toLocalized(p.stock, locale)}',
                        if (showOffer && (p.offerPercent ?? 0) > 0)
                          '${NumberUtils.toLocalized(p.offerPercent!.toStringAsFixed(0), locale)}% OFF',
                      ].join(' · '),
                      style: const TextStyle(fontSize: 11),
                    ),
                    trailing: Text(
                      '${AppStrings.currency}${NumberUtils.toLocalized(p.price.toStringAsFixed(2), locale)}',
                      style: const TextStyle(fontWeight: FontWeight.w900, color: GroceryColors.primaryDark),
                    ),
                    onTap: () {
                      provider.addToCart(p);
                      Navigator.pop(context);
                      gSnack(context, locale == 'bn' ? 'কার্টে যোগ হয়েছে' : 'Added to cart');
                    },
                  );
                },
              ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
      ],
    );
  }
}

class GroceryBarcodeDialog extends StatefulWidget {
  const GroceryBarcodeDialog({super.key});
  @override
  State<GroceryBarcodeDialog> createState() => _GroceryBarcodeDialogState();
}

class _GroceryBarcodeDialogState extends State<GroceryBarcodeDialog> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _lookup() {
    final provider = context.read<GroceryProvider>();
    final locale = context.read<AppProvider>().locale;
    final p = provider.findByBarcodeOrId(_ctrl.text);
    if (p != null) {
      provider.addToCart(p);
      Navigator.pop(context);
      gSnack(context, '${p.localizedName(locale)} ${locale == 'bn' ? 'যোগ হয়েছে' : 'added'}');
    } else {
      gSnack(context, locale == 'bn' ? 'বারকোড পাওয়া যায়নি' : 'Barcode not found', color: Colors.red.shade700);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('barcode_lookup', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              border: Border.all(color: GroceryColors.primary, width: 2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.qr_code_scanner_rounded, size: 64, color: GroceryColors.primary),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _ctrl,
            autofocus: true,
            onSubmitted: (_) => _lookup(),
            decoration: InputDecoration(
              hintText: isBn ? 'বারকোড বা প্রোডাক্ট ID (1-18)' : 'Barcode or product ID (1-18)',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
        ElevatedButton(
          onPressed: _lookup,
          style: ElevatedButton.styleFrom(backgroundColor: GroceryColors.primary, foregroundColor: Colors.white),
          child: Text(AppStrings.get('apply', locale)),
        ),
      ],
    );
  }
}

class GroceryReturnDialog extends StatelessWidget {
  const GroceryReturnDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final isBn = locale == 'bn';
    final sales = context.watch<GroceryProvider>().completedSales;

    return AlertDialog(
      backgroundColor: GroceryColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('return_refund', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
      content: SizedBox(
        width: 400,
        height: 320,
        child: sales.isEmpty
            ? Center(child: Text(isBn ? 'রিটার্নের জন্য কোনো সেল নেই' : 'No sales to return'))
            : ListView.builder(
                itemCount: sales.length,
                itemBuilder: (context, i) {
                  final s = sales[i];
                  return ListTile(
                    title: Text(s.invoiceNo, style: const TextStyle(fontWeight: FontWeight.w800)),
                    subtitle: Text(
                      '${AppStrings.currency}${NumberUtils.toLocalized(s.total.toStringAsFixed(2), locale)} · ${DateFormat('dd MMM').format(s.timestamp)}',
                    ),
                    trailing: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        gSnack(context, isBn ? 'রিফান্ড প্রক্রিয়া শুরু হয়েছে' : 'Refund initiated',
                            color: Colors.orange.shade800);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(isBn ? 'রিফান্ড' : 'Refund'),
                    ),
                  );
                },
              ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(AppStrings.get('close', locale))),
      ],
    );
  }
}
