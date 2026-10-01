import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
import '../../../core/services/api_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WHOLESALE SALE DATA HOLDER
// ─────────────────────────────────────────────────────────────────────────────
class WholesalerSale {
  final String orderNo;
  final WCustomer customer;
  final List<WOrderItem> items;
  final double subtotal;
  final double discount;
  final double tax;
  final double shipping;
  final double total;
  final String paymentMethod;
  final double paidAmount;
  final double changeAmount;
  final DateTime createdAt;
  final String? trxId;

  const WholesalerSale({
    required this.orderNo,
    required this.customer,
    required this.items,
    required this.subtotal,
    required this.discount,
    required this.tax,
    required this.shipping,
    required this.total,
    required this.paymentMethod,
    required this.paidAmount,
    required this.changeAmount,
    required this.createdAt,
    this.trxId,
  });
}

void showWholesalerReceiptDialog(BuildContext context, WholesalerSale sale, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => WholesalerReceiptModal(sale: sale, isDark: isDark),
  );
}

void showWholesalerCheckoutDialog(BuildContext context, WholesalerProvider w, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => WholesalerCheckoutPaymentModal(
      wholesalerProvider: w,
      isDark: isDark,
      onPaymentComplete: (sale) {
        showWholesalerReceiptDialog(ctx, sale, isDark);
      },
    ),
  );
}

const Color _primaryIndigo = Color(0xFF4F46E5);

// ─────────────────────────────────────────────────────────────────────────────
// WHOLESALER CHECKOUT & PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
class WholesalerCheckoutPaymentModal extends StatefulWidget {
  final WholesalerProvider wholesalerProvider;
  final bool isDark;
  final void Function(WholesalerSale sale) onPaymentComplete;

  const WholesalerCheckoutPaymentModal({
    super.key,
    required this.wholesalerProvider,
    required this.isDark,
    required this.onPaymentComplete,
  });

  @override
  State<WholesalerCheckoutPaymentModal> createState() => _WholesalerCheckoutPaymentModalState();
}

class _WholesalerCheckoutPaymentModalState extends State<WholesalerCheckoutPaymentModal> {
  String _selectedMethod = 'CASH';
  final TextEditingController _tenderedController = TextEditingController();
  double _tenderedAmount = 0.0;

  // Non-cash helpers
  String _bankName = 'City Bank (Online)';
  final TextEditingController _bankSlipCtrl = TextEditingController();
  String _mobileProvider = 'bKash';
  final TextEditingController _trxIdCtrl = TextEditingController();
  final TextEditingController _poNumberCtrl = TextEditingController();
  final TextEditingController _dueNoteCtrl = TextEditingController();

  static const Color primaryIndigo = Color(0xFF4F46E5);

  @override
  void initState() {
    super.initState();
    _tenderedController.text = '';
    _tenderedAmount = 0.0;
  }

  @override
  void dispose() {
    _tenderedController.dispose();
    _bankSlipCtrl.dispose();
    _trxIdCtrl.dispose();
    _poNumberCtrl.dispose();
    _dueNoteCtrl.dispose();
    super.dispose();
  }

  void _onTenderedChanged(String val) {
    setState(() {
      _tenderedAmount = double.tryParse(val.trim()) ?? 0.0;
    });
  }

  void _setExactAmount() {
    final total = widget.wholesalerProvider.grandTotal;
    setState(() {
      _tenderedAmount = total;
      _tenderedController.text = total % 1 == 0 ? total.toInt().toString() : total.toStringAsFixed(2);
    });
  }

  void _addDenomination(double amount) {
    setState(() {
      _tenderedAmount += amount;
      _tenderedController.text = _tenderedAmount % 1 == 0
          ? _tenderedAmount.toInt().toString()
          : _tenderedAmount.toStringAsFixed(2);
    });
  }

  Future<void> _submitPayment() async {
    final w = widget.wholesalerProvider;
    final total = w.grandTotal;

    if (_selectedMethod == 'CASH') {
      if (_tenderedAmount <= 0) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('দয়া করে Cash Tendered এর পরিমাণ প্রদান করুন!'),
            backgroundColor: Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            duration: Duration(seconds: 2),
          ),
        );
        return;
      }
      if (_tenderedAmount < total) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('পর্যাপ্ত ক্যাশ প্রদান করা হয়নি! মোট মূল্য: ৳${NumberFormat('#,##0.00').format(total)}'),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
        return;
      }
    }

    final paid = _selectedMethod == 'CASH' ? _tenderedAmount : total;
    final change = (_selectedMethod == 'CASH' && paid > total) ? paid - total : 0.0;

    String methodLabel = _selectedMethod;
    if (_selectedMethod == 'CASH') methodLabel = 'Cash';
    if (_selectedMethod == 'CARD') methodLabel = 'Bank Transfer ($_bankName)';
    if (_selectedMethod == 'MOBILE_PAY') methodLabel = '$_mobileProvider (Mobile)';
    if (_selectedMethod == 'CUSTOMER_DUE') methodLabel = 'B2B Credit / Ledger';

    Map<String, dynamic>? res;
    try {
      res = await ApiService.instance.confirmSale(
        businessType: 'wholesaler',
        payload: {
          'items': w.items.map((item) => {
            'productId': item.product.id,
            'name': item.product.name,
            'unitPrice': item.unitPrice,
            'qty': item.qty,
            'lineTotal': item.lineTotal,
            'discountAmount': 0,
          }).toList(),
          'payments': [
            {'method': _selectedMethod, 'amount': paid}
          ],
          'total': total,
          'grandTotal': total,
          'subtotal': w.subtotal,
          'taxTotal': w.taxAmount,
          'taxAmount': w.taxAmount,
          'discountTotal': w.discountFlat,
          'shipping': w.shippingCost,
          'shippingTotal': w.shippingCost,
          'paymentMethod': _selectedMethod,
          'customerName': w.customer.name,
          'customerPhone': w.customer.phone,
          'note': 'Mobile Wholesale POS Order',
          'source': 'B2B',
        },
      );
    } catch (e) {
      debugPrint('Wholesale confirmSale error: $e');
    }

    final finalOrderNo = (res != null && (res['invoiceNo'] != null || res['order_number'] != null))
        ? (res['invoiceNo'] ?? res['order_number']).toString()
        : w.orderNo;

    final sale = WholesalerSale(
      orderNo: finalOrderNo,
      customer: w.customer,
      items: List.from(w.items),
      subtotal: w.subtotal,
      discount: w.discountFlat,
      tax: w.taxAmount,
      shipping: w.shippingCost,
      total: total,
      paymentMethod: methodLabel,
      paidAmount: paid,
      changeAmount: change,
      createdAt: DateTime.now(),
      trxId: _selectedMethod == 'MOBILE_PAY'
          ? _trxIdCtrl.text.trim()
          : (_selectedMethod == 'CARD' ? _bankSlipCtrl.text.trim() : null),
    );

    w.clearOrder();
    w.loadProducts(businessType: 'wholesaler');
    if (mounted) {
      Navigator.of(context).pop();
      widget.onPaymentComplete(sale);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1E1B4B) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2E2B6B) : const Color(0xFFE2E8F0);
    final w = widget.wholesalerProvider;
    final total = w.grandTotal;
    final subtotal = w.subtotal;
    final discount = w.discountFlat;
    final tax = w.taxAmount;
    final shipping = w.shippingCost;
    final itemCount = w.totalItems;
    final fmt = NumberFormat('#,##0.00');

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: 520,
        constraints: const BoxConstraints(maxWidth: 540, maxHeight: 720),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              blurRadius: 28,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Top Bar with Red Close Button ──────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 12, 10),
              child: Row(
                children: [
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),

            // ── Indigo/Blue Business Gradient Banner ───────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Wholesale Checkout & Payment',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$itemCount items • ${w.customer.name} (${w.customer.customerId}) • ${w.customer.tierLabel}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFFE0E7FF),
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: const Icon(Icons.close_rounded, size: 16, color: Colors.white70),
                    ),
                  ],
                ),
              ),
            ),

            // ── Middle Scrollable Payment Area ────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Total Payable Summary Card ─────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF161337) : const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: primaryIndigo.withValues(alpha: 0.25)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Total Payable',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '৳${fmt.format(total)}',
                                  style: const TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    color: primaryIndigo,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Row(
                                  children: [
                                    const Text('Subtotal:  ', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                    Text(
                                      '৳${fmt.format(subtotal)}',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ],
                                ),
                                if (discount > 0) ...[
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      const Text('Discount:  ', style: TextStyle(fontSize: 11, color: Colors.green)),
                                      Text(
                                        '-৳${fmt.format(discount)}',
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.green),
                                      ),
                                    ],
                                  ),
                                ],
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Text('VAT (6.4%):  ', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                    Text(
                                      '৳${fmt.format(tax)}',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Row(
                                  children: [
                                    const Text('Shipping:  ', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                    Text(
                                      '৳${fmt.format(shipping)}',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ── Payment Method Label & Selector ────────────────────────────
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'PAYMENT METHOD',
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              _buildMethodItem('CASH', 'Cash', Icons.payments_outlined, isDark, borderColor),
                              const SizedBox(width: 8),
                              _buildMethodItem('CARD', 'Bank / POS', Icons.account_balance_outlined, isDark, borderColor),
                              const SizedBox(width: 8),
                              _buildMethodItem('MOBILE_PAY', 'Mobile\nBanking', Icons.phone_android_outlined, isDark, borderColor),
                              const SizedBox(width: 8),
                              _buildMethodItem('CUSTOMER_DUE', 'Customer\nCredit / Due', Icons.receipt_long_outlined, isDark, borderColor),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ── Dynamic Payment Detail Area ────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                      child: _buildSelectedMethodArea(isDark, borderColor, total),
                    ),
                  ],
                ),
              ),
            ),

            // ── Bottom Action Button ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: _buildBottomActionButton(total),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMethodItem(String key, String label, IconData icon, bool isDark, Color borderColor) {
    final isSelected = _selectedMethod == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedMethod = key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected
                ? primaryIndigo.withValues(alpha: isDark ? 0.25 : 0.1)
                : (isDark ? const Color(0xFF161337) : Colors.white),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? primaryIndigo : borderColor,
              width: isSelected ? 1.8 : 1.0,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? primaryIndigo : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? primaryIndigo : (isDark ? Colors.white : const Color(0xFF1E293B)),
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedMethodArea(bool isDark, Color borderColor, double total) {
    switch (_selectedMethod) {
      case 'CASH':
        return _buildCashSection(isDark, borderColor, total);
      case 'CARD':
        return _buildBankSection(isDark, borderColor);
      case 'MOBILE_PAY':
        return _buildMobilePaySection(isDark, borderColor);
      case 'CUSTOMER_DUE':
        return _buildCustomerCreditSection(isDark, borderColor);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildCashSection(bool isDark, Color borderColor, double total) {
    final change = _tenderedAmount >= total ? _tenderedAmount - total : 0.0;
    final isSufficient = _tenderedAmount >= total && total > 0;
    final fmt = NumberFormat('#,##0.00');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'CASH TENDERED',
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.5,
                color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
              ),
            ),
            GestureDetector(
              onTap: _setExactAmount,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: primaryIndigo.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: primaryIndigo.withValues(alpha: 0.3)),
                ),
                child: const Text(
                  'Exact Amount',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: primaryIndigo,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),

        // Tendered Input Field
        Container(
          height: 48,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161337) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 48,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2E2B6B) : const Color(0xFFF1F5F9),
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(5)),
                ),
                child: Center(
                  child: Text(
                    '৳',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white70 : const Color(0xFF475569),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: TextField(
                  controller: _tenderedController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  decoration: const InputDecoration(
                    hintText: '0.00',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  ),
                  onChanged: _onTenderedChanged,
                ),
              ),
              if (_tenderedAmount > 0)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _tenderedAmount = 0.0;
                      _tenderedController.text = '0';
                    });
                  },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: Icon(Icons.clear_rounded, size: 18, color: Colors.grey),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Quick Denominations (Fills full width evenly without gap)
        Row(
          children: [20.0, 50.0, 100.0, 200.0, 500.0, 1000.0].map((amt) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2.5),
                child: GestureDetector(
                  onTap: () => _addDenomination(amt),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161337) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: borderColor),
                    ),
                    child: Text(
                      '+৳${amt.toInt()}',
                      style: TextStyle(
                        fontSize: amt >= 1000 ? 10.5 : 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white70 : const Color(0xFF334155),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),

        // Return / Change Result Card
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isSufficient
                ? const Color(0xFFECFDF5)
                : (isDark ? const Color(0xFF161337) : const Color(0xFFF8FAFC)),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSufficient
                  ? const Color(0xFFA7F3D0)
                  : borderColor,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(
                    isSufficient ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                    size: 18,
                    color: isSufficient ? const Color(0xFF10B981) : const Color(0xFF64748B),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Return Amount (Change)',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSufficient ? const Color(0xFF065F46) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              Text(
                '৳${fmt.format(change)}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isSufficient ? const Color(0xFF059669) : const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBankSection(bool isDark, Color borderColor) {
    final banks = ['City Bank (Online)', 'BRAC Bank', 'Islami Bank', 'POS Machine'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'BANK / PAYMENT CHANNEL',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: banks.map((b) {
            final isSel = _bankName == b;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _bankName = b),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 2.5),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSel
                        ? primaryIndigo.withValues(alpha: isDark ? 0.25 : 0.1)
                        : (isDark ? const Color(0xFF161337) : Colors.white),
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isSel ? primaryIndigo : borderColor,
                      width: isSel ? 1.6 : 1.0,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      b.split(' ').first,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        color: isSel ? primaryIndigo : (isDark ? Colors.white : const Color(0xFF1E293B)),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        Text(
          'CHEQUE / DEPOSIT SLIP / AUTH CODE (OPTIONAL)',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 44,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161337) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _bankSlipCtrl,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: const InputDecoration(
              hintText: 'e.g. CHQ-88291 or SLIP-1092',
              hintStyle: TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobilePaySection(bool isDark, Color borderColor) {
    final providers = [
      {'name': 'bKash', 'color': const Color(0xFFE2136E)},
      {'name': 'Nagad', 'color': const Color(0xFFF7941D)},
      {'name': 'Rocket', 'color': const Color(0xFF8C3494)},
      {'name': 'Upay', 'color': const Color(0xFF0072BC)},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'MOBILE WALLET PROVIDER',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: providers.map((p) {
            final name = p['name'] as String;
            final color = p['color'] as Color;
            final isSel = _mobileProvider == name;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _mobileProvider = name),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSel
                        ? color.withValues(alpha: isDark ? 0.25 : 0.12)
                        : (isDark ? const Color(0xFF161337) : Colors.white),
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isSel ? color : borderColor,
                      width: isSel ? 1.8 : 1.0,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      name,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: isSel ? color : (isDark ? Colors.white : const Color(0xFF1E293B)),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        Text(
          'TRANSACTION ID (TrxID) / SENDER PHONE',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 44,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161337) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _trxIdCtrl,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: const InputDecoration(
              hintText: 'e.g. 9J29X4L0A1 or 017XXXXXXXX',
              hintStyle: TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomerCreditSection(bool isDark, Color borderColor) {
    final c = widget.wholesalerProvider.customer;
    final fmt = NumberFormat('#,##0.00');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Credit Summary Card
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161337) : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Customer Tier:', style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : const Color(0xFF64748B))),
                  Text(c.tierLabel, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: WholesalerColors.accentOrange)),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Credit Limit:', style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : const Color(0xFF64748B))),
                  Text('৳${fmt.format(c.creditLimit)}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF1E293B))),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Available Credit:', style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : const Color(0xFF64748B))),
                  Text('৳${fmt.format(c.availableCredit)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Current Outstanding:', style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : const Color(0xFF64748B))),
                  Text('৳${fmt.format(c.outstanding)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFEF4444))),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'PURCHASE ORDER (PO) / INVOICE REF',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 44,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161337) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _poNumberCtrl,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: const InputDecoration(
              hintText: 'e.g. PO-2026-9942',
              hintStyle: TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActionButton(double total) {
    final fmt = NumberFormat('#,##0.00');
    final isCash = _selectedMethod == 'CASH';
    final isValidCash = !isCash || _tenderedAmount >= total;

    return GestureDetector(
      onTap: () {
        if (!isValidCash) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_tenderedAmount <= 0
                  ? 'দয়া করে Cash Tendered এর পরিমাণ প্রদান করুন!'
                  : 'পর্যাপ্ত ক্যাশ প্রদান করা হয়নি (মোট: ৳${fmt.format(total)})!'),
              backgroundColor: const Color(0xFFDC2626),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
            ),
          );
          return;
        }
        _submitPayment();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 50,
        decoration: BoxDecoration(
          color: !isValidCash
              ? (widget.isDark ? const Color(0xFF334155) : const Color(0xFF94A3B8))
              : null,
          gradient: isValidCash
              ? const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF4338CA)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isValidCash
              ? [
                  BoxShadow(
                    color: primaryIndigo.withValues(alpha: 0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isValidCash ? Icons.print_rounded : Icons.lock_outline_rounded,
              size: 20,
              color: isValidCash ? Colors.white : Colors.white70,
            ),
            const SizedBox(width: 8),
            Text(
              !isValidCash && isCash && _tenderedAmount <= 0
                  ? 'ENTER CASH TENDERED TO PAY'
                  : 'CONFIRM & PRINT RECEIPT (৳${fmt.format(total)})',
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w900,
                color: isValidCash ? Colors.white : Colors.white70,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WHOLESALE THERMAL RECEIPT MODAL (80mm)
// ─────────────────────────────────────────────────────────────────────────────
class WholesalerReceiptModal extends StatelessWidget {
  final WholesalerSale sale;
  final bool isDark;

  const WholesalerReceiptModal({
    super.key,
    required this.sale,
    required this.isDark,
  });

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

  Widget _buildBarcode() {
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
    final receiptBg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final textDark = isDark ? Colors.white : const Color(0xFF0F172A);
    final textMuted = isDark ? Colors.grey.shade400 : const Color(0xFF475569);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFC7D2FE);
    final fmt = NumberFormat('#,##0.00');

    final cust = sale.customer.name.isNotEmpty ? sale.customer.name : 'Walk-in Customer';
    final custShort = cust.length > 22 ? '${cust.substring(0, 20)}...' : cust;

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
                    'WHOLESALE ORDER COMPLETED & DISPATCHED',
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
                  // 1. Company Header
                  Center(
                    child: Text(
                      'BLUE OCEANS POS',
                      style: TextStyle(
                        fontSize: 15,
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

                  // 2. Invoice & Customer details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Order: ${sale.orderNo}',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Date: ${_formatDate(sale.createdAt)}',
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
                          'Cust: $custShort (${sale.customer.customerId})',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Tier: ${sale.customer.tier.name.toUpperCase()}',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
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
                          'ITEM / SKU',
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
                  ...sale.items.map((item) {
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
                                  item.product.name,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: textDark,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                Text(
                                  'SKU: ${item.product.sku} • ${item.product.warehouseId}',
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
                                '${item.qty}',
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
                                '৳${fmt.format(item.unitPrice)}',
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
                                '৳${fmt.format(item.lineTotal)}',
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

                  // 5. Subtotal & Financial Breakdown
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(sale.subtotal)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (sale.discount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Special Discount:',
                          style: TextStyle(fontSize: 11, color: Colors.green, fontFamily: 'monospace'),
                        ),
                        Text(
                          '-৳${fmt.format(sale.discount)}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT (Mushak 6.3 - 15%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(sale.tax)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Shipping & Handling:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${fmt.format(sale.shipping)}',
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
                        '৳${fmt.format(sale.total)}',
                        style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900, color: _primaryIndigo, fontFamily: 'monospace'),
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
                        sale.paymentMethod,
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
                        '৳${fmt.format(sale.paidAmount)}',
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
                        '৳${fmt.format(sale.changeAmount)}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF059669), fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 12),

                  // 6. Barcode Section
                  Center(child: _buildBarcode()),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      '*${sale.orderNo}*',
                      style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), letterSpacing: 2, fontFamily: 'monospace'),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 7. Footer Greetings
                  Center(
                    child: Text(
                      'Thank you for your business! Please\nvisit us again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 10,
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
                        fontSize: 9,
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
                            content: Text('Printing Wholesale Receipt (80mm) for ${sale.orderNo}...'),
                            duration: const Duration(seconds: 2),
                            backgroundColor: _primaryIndigo,
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF242424) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFC7D2FE)),
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
                          color: _primaryIndigo,
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: _primaryIndigo.withValues(alpha: 0.35),
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
                              'New Order',
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
