import 'package:flutter/material.dart';
import '../../models/retail_sale.dart';
import '../../providers/retail_provider.dart';

void showRetailReceiptDialog(BuildContext context, RetailSale sale, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RetailReceiptModal(sale: sale, isDark: isDark),
  );
}

void showRetailCheckoutDialog(BuildContext context, RetailProvider retailProvider, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RetailCheckoutPaymentModal(
      retailProvider: retailProvider,
      isDark: isDark,
      onPaymentComplete: (sale) {
        // Use the dialog's own context (ctx) which is still valid after pop
        showRetailReceiptDialog(ctx, sale, isDark);
      },
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKOUT & PAYMENT MODAL (Pixel-perfect matching POS reference)
// ─────────────────────────────────────────────────────────────────────────────
class RetailCheckoutPaymentModal extends StatefulWidget {
  final RetailProvider retailProvider;
  final bool isDark;
  final void Function(RetailSale sale) onPaymentComplete;

  const RetailCheckoutPaymentModal({
    super.key,
    required this.retailProvider,
    required this.isDark,
    required this.onPaymentComplete,
  });

  @override
  State<RetailCheckoutPaymentModal> createState() => _RetailCheckoutPaymentModalState();
}

class _RetailCheckoutPaymentModalState extends State<RetailCheckoutPaymentModal> {
  late String _selectedMethod;
  final TextEditingController _tenderedController = TextEditingController();
  double _tenderedAmount = 0.0;

  // Non-cash helpers
  String _cardType = 'Visa';
  final TextEditingController _cardAuthCtrl = TextEditingController();
  String _mobileProvider = 'bKash';
  final TextEditingController _trxIdCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final current = widget.retailProvider.paymentMethod;
    if (current == 'CARD' || current == 'MOBILE_PAY' || current == 'CUSTOMER_DUE') {
      _selectedMethod = current;
    } else {
      _selectedMethod = 'CASH';
    }
    _tenderedController.text = '0';
    _tenderedAmount = 0.0;
  }

  @override
  void dispose() {
    _tenderedController.dispose();
    _cardAuthCtrl.dispose();
    _trxIdCtrl.dispose();
    super.dispose();
  }

  void _onTenderedChanged(String val) {
    setState(() {
      _tenderedAmount = double.tryParse(val) ?? 0.0;
    });
  }

  void _setExactAmount() {
    final total = widget.retailProvider.total;
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
    final total = widget.retailProvider.total;

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
            content: Text('পর্যাপ্ত ক্যাশ প্রদান করা হয়নি! মোট মূল্য: ৳${total.toStringAsFixed(2)}'),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 2),
          ),
        );
        return;
      }
    }

    final paid = _selectedMethod == 'CASH' ? _tenderedAmount : total;

    widget.retailProvider.setPaymentMethod(_selectedMethod);
    final sale = await widget.retailProvider.confirmSale(
      paidAmount: paid,
      method: _selectedMethod,
    );
    if (!mounted) return;
    Navigator.of(context).pop();
    widget.onPaymentComplete(sale);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE2E8F0);
    final total = widget.retailProvider.total;
    final subtotal = widget.retailProvider.subtotal;
    final tax = widget.retailProvider.taxTotal;
    final itemCount = widget.retailProvider.cart.fold<int>(0, (sum, i) => sum + i.qty);
    final customer = widget.retailProvider.selectedCustomer.isNotEmpty
        ? widget.retailProvider.selectedCustomer
        : 'Walk-in Retail Customer';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: 500,
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 690),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(4),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
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

            // ── Purple Gradient Banner ─────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.18),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Checkout & Payment',
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$itemCount items • Customer: $customer • Cashier: Super Administrator',
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFFDDD6FE),
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
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF262626) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: borderColor),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Total Payable',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '৳${total.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF7C3AED),
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
                                    const Text('Subtotal:   ', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                    Text(
                                      '৳${subtotal.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text('Tax (${widget.retailProvider.taxRatePct}%):   ', style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                    Text(
                                      '৳${tax.toStringAsFixed(2)}',
                                      style: TextStyle(
                                        fontSize: 12,
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
                              _buildMethodItem('CARD', 'Card / POS', Icons.credit_card_outlined, isDark, borderColor),
                              const SizedBox(width: 8),
                              _buildMethodItem('MOBILE_PAY', 'Mobile\nBanking', Icons.phone_android_outlined, isDark, borderColor),
                              const SizedBox(width: 8),
                              _buildMethodItem('CUSTOMER_DUE', 'Customer\nDue', Icons.receipt_long_outlined, isDark, borderColor),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ── Dynamic Payment Detail Area ────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
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

  Widget _buildMethodItem(String id, String label, IconData icon, bool isDark, Color borderColor) {
    final isSelected = _selectedMethod == id;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedMethod = id;
            if (id == 'CASH' && _tenderedAmount == 0) {
              _tenderedController.text = '0';
            }
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: 74,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF7C3AED)
                : (isDark ? const Color(0xFF262626) : Colors.white),
            gradient: isSelected
                ? const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: isSelected ? const Color(0xFF7C3AED) : borderColor,
              width: isSelected ? 1.5 : 1.0,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.grey.shade400 : const Color(0xFF334155)),
              ),
              const SizedBox(height: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedMethodArea(bool isDark, Color borderColor, double total) {
    if (_selectedMethod == 'CASH') {
      return _buildCashTenderedBox(isDark, borderColor, total);
    } else if (_selectedMethod == 'CARD') {
      return _buildCardPaymentBox(isDark, borderColor, total);
    } else if (_selectedMethod == 'MOBILE_PAY') {
      return _buildMobileBankingBox(isDark, borderColor, total);
    } else {
      return _buildCustomerDueBox(isDark, borderColor, total);
    }
  }

  // ── Cash Tendered Box (Exact Match to Reference Screenshot) ───────────────
  Widget _buildCashTenderedBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'CASH TENDERED (৳)',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                  letterSpacing: 0.3,
                ),
              ),
              InkWell(
                onTap: _setExactAmount,
                borderRadius: BorderRadius.circular(3),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Text(
                    'Exact Amount',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF7C3AED),
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Large Input Box
          Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF181818) : Colors.white,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isDark ? const Color(0xFF3D3D3D) : const Color(0xFFCBD5E1),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  '৳',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _tenderedController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    textAlign: TextAlign.end,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                    ),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      isDense: true,
                      hintText: '0',
                    ),
                    onChanged: _onTenderedChanged,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Quick Denomination Chips (+৳10, +৳20, +৳50, +৳100, +৳200, +৳500, +৳1000)
          Row(
            children: [10, 20, 50, 100, 200, 500, 1000].map((d) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 1.5),
                  child: InkWell(
                    onTap: () => _addDenomination(d.toDouble()),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF2C2C2C) : Colors.white,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: borderColor),
                      ),
                      child: Text(
                        '+৳$d',
                        style: TextStyle(
                          fontSize: d >= 1000 ? 9.5 : 10.0,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.grey.shade200 : const Color(0xFF334155),
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
          const SizedBox(height: 10),

          // Summary message box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    _tenderedAmount == 0
                        ? 'Please enter cash amount received'
                        : (_tenderedAmount < total
                            ? 'Remaining due: ৳${(total - _tenderedAmount).toStringAsFixed(2)}'
                            : 'Change return: ৳${(_tenderedAmount - total).toStringAsFixed(2)}'),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: _tenderedAmount >= total ? FontWeight.w700 : FontWeight.w500,
                      color: _tenderedAmount >= total
                          ? const Color(0xFF10B981)
                          : (_tenderedAmount > 0
                              ? const Color(0xFFEF4444)
                              : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B))),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  'Total: ৳${total.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Card Payment Box ──────────────────────────────────────────────────────
  Widget _buildCardPaymentBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.credit_card_rounded, size: 16, color: Color(0xFF7C3AED)),
              const SizedBox(width: 6),
              Text(
                'POS Terminal Ready',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1E293B)),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text('Terminal Online', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: ['Visa', 'MasterCard', 'Amex', 'Other'].map((b) {
              final sel = _cardType == b;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2.0),
                  child: InkWell(
                    onTap: () => setState(() => _cardType = b),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: sel ? const Color(0xFF7C3AED) : (isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        b,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: sel ? Colors.white : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _cardAuthCtrl,
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Approval / Auth Code (Optional)',
              hintStyle: const TextStyle(fontSize: 11),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: borderColor)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            ),
          ),
        ],
      ),
    );
  }

  // ── Mobile Banking Box ────────────────────────────────────────────────────
  Widget _buildMobileBankingBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: ['bKash', 'Nagad', 'Rocket', 'Upay'].map((p) {
              final sel = _mobileProvider == p;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2.0),
                  child: InkWell(
                    onTap: () => setState(() => _mobileProvider = p),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: sel ? const Color(0xFF7C3AED) : (isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        p,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: sel ? Colors.white : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _trxIdCtrl,
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Transaction ID (TrxID) / Ref',
              hintStyle: const TextStyle(fontSize: 11),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: borderColor)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            ),
          ),
        ],
      ),
    );
  }

  // ── Customer Due Box ──────────────────────────────────────────────────────
  Widget _buildCustomerDueBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFFF59E0B), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Post as Customer Due / Credit',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  'Total ৳${total.toStringAsFixed(2)} will be debited to customer receivable ledger.',
                  style: TextStyle(fontSize: 10.5, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Bottom Action Button (Exact Match to Screenshot) ─────────────────────
  Widget _buildBottomActionButton(double total) {
    final isCash = _selectedMethod == 'CASH';
    final isValidCash = !isCash || _tenderedAmount >= total;
    final isCashZero = !isValidCash;

    return InkWell(
      onTap: () {
        if (!isValidCash) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_tenderedAmount <= 0
                  ? 'দয়া করে Cash Tendered এর পরিমাণ প্রদান করুন!'
                  : 'পর্যাপ্ত ক্যাশ প্রদান করা হয়নি (মোট: ৳${total.toStringAsFixed(2)})!'),
              backgroundColor: const Color(0xFFDC2626),
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 2),
            ),
          );
          return;
        }
        _submitPayment();
      },
      borderRadius: BorderRadius.circular(4),
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: !isValidCash ? const Color(0xFFC4B5FD) : null,
          gradient: !isValidCash
              ? null
              : const LinearGradient(
                  colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                ),
          borderRadius: BorderRadius.circular(4),
          boxShadow: isCashZero
              ? null
              : [
                  BoxShadow(
                    color: const Color(0xFF7C3AED).withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isCashZero
                  ? Icons.check_circle_outline_rounded
                  : Icons.check_circle_rounded,
              size: 18,
              color: Colors.white,
            ),
            const SizedBox(width: 8),
            Text(
              isCashZero
                  ? 'Enter Tendered Cash (৳${total.toStringAsFixed(2)})'
                  : 'Complete Payment (৳${total.toStringAsFixed(2)})',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THERMAL POS RECEIPT MODAL (Pixel-perfect matching reference image)
// ─────────────────────────────────────────────────────────────────────────────
class RetailReceiptModal extends StatelessWidget {
  final RetailSale sale;
  final bool isDark;

  const RetailReceiptModal({
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
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE);

    final invoiceDisplay = sale.invoiceNo.isNotEmpty
        ? sale.invoiceNo
        : 'INV-${sale.id.length > 6 ? sale.id.substring(sale.id.length - 6) : sale.id}';

    final cust = sale.customerName.isNotEmpty ? sale.customerName : 'Walk-in Retail Customer';
    final custShort = cust.length > 20 ? '${cust.substring(0, 18)}...' : cust;

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
                      'BLUE OCEANS POS',
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
                    final itemTotal = item.product.price * item.qty;
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
                                  'SKU: ${item.product.sku}',
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
                                '৳${item.product.price.toStringAsFixed(2)}',
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
                                '৳${itemTotal.toStringAsFixed(2)}',
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
                        '৳${sale.subtotal.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT (Mushak 6.3 - 15%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${sale.taxTotal.toStringAsFixed(2)}',
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
                        '৳${sale.total.toStringAsFixed(2)}',
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
                        sale.paymentMethod,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (sale.tenderedAmount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Tendered / Received:',
                          style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                        ),
                        Text(
                          '৳${sale.tenderedAmount.toStringAsFixed(2)}',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Paid Amount:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${sale.paidAmount.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (sale.changeAmount > 0 || (sale.tenderedAmount > sale.total)) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Change / Return:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                        Text(
                          '৳${(sale.changeAmount > 0 ? sale.changeAmount : (sale.tenderedAmount - sale.total)).toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 12),

                  // 6. Barcode Section
                  Center(child: _buildBarcode()),
                  const SizedBox(height: 4),
                  const Center(
                    child: Text(
                      '**',
                      style: TextStyle(fontSize: 10, color: Color(0xFF64748B), letterSpacing: 3),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 7. Footer Greetings
                  Center(
                    child: Text(
                      'Thank you for your business! Please\nvisit us again.',
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
                            content: Text('Printing Thermal Receipt (80mm) for ${sale.invoiceNo}...'),
                            duration: const Duration(seconds: 2),
                            backgroundColor: const Color(0xFF0D9488),
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
                          color: const Color(0xFF0D9488),
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0D9488).withValues(alpha: 0.35),
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
