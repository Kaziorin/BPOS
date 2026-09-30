import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/models/menu_item.dart';
import '../../../../core/providers/pos_provider.dart';
import '../../../../core/providers/app_provider.dart';
import '../../../../core/localization/app_strings.dart';
import '../../../../core/utils/number_utils.dart';

void showRestaurantReceiptDialog(BuildContext context, CompletedOrder order, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RestaurantReceiptModal(order: order, isDark: isDark),
  );
}

void showRestaurantCheckoutDialog(BuildContext context, POSProvider posProvider, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RestaurantCheckoutPaymentModal(
      posProvider: posProvider,
      isDark: isDark,
      onPaymentComplete: (order) {
        showRestaurantReceiptDialog(ctx, order, isDark);
      },
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESTAURANT CHECKOUT & PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
class RestaurantCheckoutPaymentModal extends StatefulWidget {
  final POSProvider posProvider;
  final bool isDark;
  final void Function(CompletedOrder order) onPaymentComplete;

  const RestaurantCheckoutPaymentModal({
    super.key,
    required this.posProvider,
    required this.isDark,
    required this.onPaymentComplete,
  });

  @override
  State<RestaurantCheckoutPaymentModal> createState() => _RestaurantCheckoutPaymentModalState();
}

class _RestaurantCheckoutPaymentModalState extends State<RestaurantCheckoutPaymentModal> {
  String _selectedMethod = 'CASH';
  final TextEditingController _tenderedController = TextEditingController();
  double _tenderedAmount = 0.0;

  // Non-cash helpers
  String _cardType = 'Visa';
  final TextEditingController _cardAuthCtrl = TextEditingController();
  String _mobileProvider = 'bKash';
  final TextEditingController _trxIdCtrl = TextEditingController();
  final TextEditingController _customerNameCtrl = TextEditingController();
  final TextEditingController _customerPhoneCtrl = TextEditingController();
  final TextEditingController _dueNoteCtrl = TextEditingController();

  static const Color primaryOrange = Color(0xFFFF6D00);

  @override
  void initState() {
    super.initState();
    _tenderedController.text = '0';
    _tenderedAmount = 0.0;
  }

  @override
  void dispose() {
    _tenderedController.dispose();
    _cardAuthCtrl.dispose();
    _trxIdCtrl.dispose();
    _customerNameCtrl.dispose();
    _customerPhoneCtrl.dispose();
    _dueNoteCtrl.dispose();
    super.dispose();
  }

  void _onTenderedChanged(String val) {
    setState(() {
      _tenderedAmount = double.tryParse(val) ?? 0.0;
    });
  }

  void _setExactAmount() {
    final total = widget.posProvider.totalPayable;
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
    final total = widget.posProvider.totalPayable;
    final paid = _selectedMethod == 'CASH'
        ? (_tenderedAmount > 0 ? _tenderedAmount : total)
        : total;
    final change = (_selectedMethod == 'CASH' && paid > total) ? paid - total : 0.0;

    String methodLabel = _selectedMethod;
    if (_selectedMethod == 'CASH') methodLabel = 'Cash';
    if (_selectedMethod == 'CARD') methodLabel = 'Card ($_cardType)';
    if (_selectedMethod == 'MOBILE_PAY') methodLabel = '$_mobileProvider (Mobile)';
    if (_selectedMethod == 'CUSTOMER_DUE') methodLabel = 'Customer Due';

    final order = await widget.posProvider.placeOrder(
      paymentMethod: methodLabel,
      paidAmount: paid,
      changeAmount: change,
      customerName: _customerNameCtrl.text.trim().isNotEmpty
          ? _customerNameCtrl.text.trim()
          : (_selectedMethod == 'CUSTOMER_DUE' ? 'Guest (${widget.posProvider.tableNumber})' : null),
      customerPhone: _customerPhoneCtrl.text.trim().isNotEmpty
          ? _customerPhoneCtrl.text.trim()
          : null,
      trxId: _selectedMethod == 'MOBILE_PAY'
          ? _trxIdCtrl.text.trim()
          : (_selectedMethod == 'CARD' ? _cardAuthCtrl.text.trim() : null),
    );

    if (!mounted) return;
    Navigator.of(context).pop();
    widget.onPaymentComplete(order);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE2E8F0);
    final total = widget.posProvider.totalPayable;
    final subtotal = widget.posProvider.subtotal;
    final tax = widget.posProvider.tax;
    final serviceCharge = widget.posProvider.serviceCharge;
    final discount = widget.posProvider.discountValue;
    final itemCount = widget.posProvider.totalItemCount;
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';

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

            // ── Orange Gradient Banner ─────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF6D00), Color(0xFFFF9100)],
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
                      child: const Icon(Icons.restaurant_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isBn ? 'চেকআউট ও পেমেন্ট' : 'Checkout & Payment',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '$itemCount ${isBn ? "আইটেম" : "items"} • ${isBn ? "টেবিল" : "Table"}: ${widget.posProvider.tableNumber} • ${isBn ? "ওয়েটার" : "Waiter"}: ${AppStrings.get(widget.posProvider.waiterKey, locale)}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFFFFF3E0),
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

            // ── Total Payable Summary Card ─────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF262626) : const Color(0xFFFFF8F1),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: primaryOrange.withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isBn ? 'মোট প্রদেয়' : 'Total Payable',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '৳${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)}',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: primaryOrange,
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
                            Text('${isBn ? "সাবটোটাল" : "Subtotal"}:  ', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            Text(
                              '৳${NumberUtils.toLocalized(subtotal.toStringAsFixed(2), locale)}',
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
                              Text('${isBn ? "ছাড়" : "Discount"}:  ', style: const TextStyle(fontSize: 11, color: Colors.green)),
                              Text(
                                '-৳${NumberUtils.toLocalized(discount.toStringAsFixed(2), locale)}',
                                style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Colors.green),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Text('${isBn ? "ভ্যাট (৮%)" : "VAT (8%)"}:  ', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            Text(
                              '৳${NumberUtils.toLocalized(tax.toStringAsFixed(2), locale)}',
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
                            Text('${isBn ? "সার্ভিস চার্জ" : "Service"}:  ', style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                            Text(
                              '৳${NumberUtils.toLocalized(serviceCharge.toStringAsFixed(2), locale)}',
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
                    isBn ? 'পেমেন্ট পদ্ধতি' : 'PAYMENT METHOD',
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
                      _buildMethodItem('CASH', isBn ? 'নগদ' : 'Cash', Icons.payments_outlined, isDark, borderColor),
                      const SizedBox(width: 8),
                      _buildMethodItem('CARD', isBn ? 'কার্ড' : 'Card / POS', Icons.credit_card_outlined, isDark, borderColor),
                      const SizedBox(width: 8),
                      _buildMethodItem('MOBILE_PAY', isBn ? 'মোবাইল\nব্যাংকিং' : 'Mobile\nBanking', Icons.phone_android_outlined, isDark, borderColor),
                      const SizedBox(width: 8),
                      _buildMethodItem('CUSTOMER_DUE', isBn ? 'বাকি / রুম\nচার্জ' : 'Customer\nDue', Icons.receipt_long_outlined, isDark, borderColor),
                    ],
                  ),
                ],
              ),
            ),

            // ── Dynamic Payment Detail Area ────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                child: _buildSelectedMethodArea(isDark, borderColor, total, locale),
              ),
            ),

            // ── Bottom Action Button ───────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: _buildBottomActionButton(total, locale),
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
                ? primaryOrange.withValues(alpha: isDark ? 0.25 : 0.1)
                : (isDark ? const Color(0xFF262626) : Colors.white),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? primaryOrange : borderColor,
              width: isSelected ? 1.8 : 1.0,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected ? primaryOrange : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected ? primaryOrange : (isDark ? Colors.white : const Color(0xFF1E293B)),
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedMethodArea(bool isDark, Color borderColor, double total, String locale) {
    switch (_selectedMethod) {
      case 'CASH':
        return _buildCashSection(isDark, borderColor, total, locale);
      case 'CARD':
        return _buildCardSection(isDark, borderColor, locale);
      case 'MOBILE_PAY':
        return _buildMobilePaySection(isDark, borderColor, locale);
      case 'CUSTOMER_DUE':
        return _buildCustomerDueSection(isDark, borderColor, locale);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildCashSection(bool isDark, Color borderColor, double total, String locale) {
    final isBn = locale == 'bn';
    final change = _tenderedAmount >= total ? _tenderedAmount - total : 0.0;
    final isSufficient = _tenderedAmount >= total && total > 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tendered input label & exact button
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              isBn ? 'প্রদত্ত নগদ (Tendered)' : 'CASH TENDERED',
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
                  color: primaryOrange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: primaryOrange.withValues(alpha: 0.3)),
                ),
                child: Text(
                  isBn ? 'পুরো টাকা (Exact)' : 'Exact Amount',
                  style: const TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: primaryOrange,
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
            color: isDark ? const Color(0xFF262626) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 48,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF333333) : const Color(0xFFF1F5F9),
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

        // Quick Denominations (fills full width evenly without gap)
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
                      color: isDark ? const Color(0xFF262626) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(color: borderColor),
                    ),
                    child: Text(
                      '+৳${NumberUtils.toLocalized(amt.toInt().toString(), locale)}',
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
                : (isDark ? const Color(0xFF262626) : const Color(0xFFF8FAFC)),
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
                    isBn ? 'ফেরত দেওয়ার পরিমাণ' : 'Return Amount (Change)',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSufficient ? const Color(0xFF065F46) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              Text(
                '৳${NumberUtils.toLocalized(change.toStringAsFixed(2), locale)}',
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

  Widget _buildCardSection(bool isDark, Color borderColor, String locale) {
    final isBn = locale == 'bn';
    final cardTypes = ['Visa', 'Mastercard', 'Amex', 'NexusPay'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isBn ? 'কার্ড নেটওয়ার্ক' : 'CARD NETWORK',
          style: TextStyle(
            fontSize: 10.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: cardTypes.map((type) {
            final isSel = _cardType == type;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _cardType = type),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSel
                        ? primaryOrange.withValues(alpha: isDark ? 0.25 : 0.1)
                        : (isDark ? const Color(0xFF262626) : Colors.white),
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(
                      color: isSel ? primaryOrange : borderColor,
                      width: isSel ? 1.6 : 1.0,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      type,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                        color: isSel ? primaryOrange : (isDark ? Colors.white : const Color(0xFF1E293B)),
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
          isBn ? 'অনুমোদন / ট্রানজ্যাকশন কোড (ঐচ্ছিক)' : 'AUTH / APPROVAL CODE (OPTIONAL)',
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
            color: isDark ? const Color(0xFF262626) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _cardAuthCtrl,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: isBn ? 'যেমন: AUTH-98214' : 'e.g. AUTH-98214',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF2563EB)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isBn
                      ? 'POS টার্মিনালে কার্ড সোয়াইপ/ট্যাপ করার পর অর্ডার সম্পন্ন করুন।'
                      : 'Swipe or tap card on POS terminal, then click place order.',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF1E40AF), fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMobilePaySection(bool isDark, Color borderColor, String locale) {
    final isBn = locale == 'bn';
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
          isBn ? 'মোবাইল ব্যাংকিং সেবা' : 'MOBILE WALLET PROVIDER',
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
                        : (isDark ? const Color(0xFF262626) : Colors.white),
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
          isBn ? 'ট্রানজ্যাকশন আইডি (TrxID) / ফোন' : 'TRANSACTION ID / PHONE (OPTIONAL)',
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
            color: isDark ? const Color(0xFF262626) : Colors.white,
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
            decoration: InputDecoration(
              hintText: isBn ? 'যেমন: 9J29X4L0A1' : 'e.g. 9J29X4L0A1 or 017XXXXXXXX',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomerDueSection(bool isDark, Color borderColor, String locale) {
    final isBn = locale == 'bn';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isBn ? 'গ্রাহক / রুমের নাম' : 'CUSTOMER / ROOM NAME',
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
            color: isDark ? const Color(0xFF262626) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _customerNameCtrl,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: isBn ? 'গ্রাহকের নাম বা রুম নম্বর লিখুন' : 'Enter Guest name or Room #',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          isBn ? 'গ্রাহকের ফোন নম্বর (ঐচ্ছিক)' : 'CUSTOMER PHONE (OPTIONAL)',
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
            color: isDark ? const Color(0xFF262626) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _customerPhoneCtrl,
            keyboardType: TextInputType.phone,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: isBn ? 'যেমন: 017XXXXXXXX' : 'e.g. 017XXXXXXXX',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Text(
          isBn ? 'মন্তব্য (Note)' : 'REMARK / NOTE',
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
            color: isDark ? const Color(0xFF262626) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: borderColor),
          ),
          child: TextField(
            controller: _dueNoteCtrl,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: isBn ? 'বাকি বা চার্জের কারণ' : 'Reason for ledger or table charge',
              hintStyle: const TextStyle(fontSize: 12, color: Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActionButton(double total, String locale) {
    final isBn = locale == 'bn';
    final isValidCash = _selectedMethod != 'CASH' || _tenderedAmount >= total || _tenderedAmount == 0;

    return GestureDetector(
      onTap: isValidCash ? _submitPayment : null,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFFF6D00), Color(0xFFE65100)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
              color: primaryOrange.withValues(alpha: 0.35),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.print_rounded, size: 20, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              '${isBn ? "অর্ডার সম্পন্ন ও রিসিট প্রিন্ট" : "CONFIRM & PRINT RECEIPT"} (৳${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)})',
              style: const TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w900,
                color: Colors.white,
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
// RESTAURANT THERMAL RECEIPT MODAL (80mm)
// ─────────────────────────────────────────────────────────────────────────────
class RestaurantReceiptModal extends StatelessWidget {
  final CompletedOrder order;
  final bool isDark;

  const RestaurantReceiptModal({
    super.key,
    required this.order,
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
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFFED7AA);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';

    final orderId = order.id.isNotEmpty ? order.id : 'ORD-98214';
    final customer = order.customerName != null && order.customerName!.isNotEmpty
        ? order.customerName!
        : 'Walk-in Guest';

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
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle_outline_rounded, size: 16, color: Color(0xFF10B981)),
                  const SizedBox(width: 6),
                  Text(
                    isBn ? 'অর্ডার সফলভাবে সম্পন্ন ও পরিশোধিত' : 'ORDER PLACED & PAID SUCCESSFULLY',
                    style: const TextStyle(
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
                  // 1. Restaurant Header
                  Center(
                    child: Text(
                      'BLUE OCEANS RESTAURANT',
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
                      'Banani Flagship Branch • Table #${order.tableNumber}',
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

                  // 2. Order & Staff Details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Order: $orderId',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Date: ${_formatDate(order.timestamp)}',
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
                          'Table: ${order.tableNumber} (${order.orderType.replaceAll('_', ' ').toUpperCase()})',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Waiter: ${AppStrings.get(order.waiter, locale)}',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (customer != 'Walk-in Guest') ...[
                    const SizedBox(height: 3),
                    Text(
                      'Guest: $customer',
                      style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
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
                          'ITEM',
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
                  ...order.items.map((item) {
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
                                  item.menuItem.localizedName(locale),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: textDark,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                if (item.modifiers.isNotEmpty)
                                  Text(
                                    item.modifiers.map((m) => AppStrings.get(m, locale)).join(', '),
                                    style: const TextStyle(
                                      fontSize: 8.5,
                                      color: Color(0xFF94A3B8),
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                if (item.note.isNotEmpty)
                                  Text(
                                    '* ${item.note}',
                                    style: const TextStyle(
                                      fontSize: 8.5,
                                      color: Color(0xFFFF6D00),
                                      fontStyle: FontStyle.italic,
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
                                '${item.quantity}',
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
                                '৳${item.unitPrice.toStringAsFixed(2)}',
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
                                '৳${item.totalPrice.toStringAsFixed(2)}',
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

                  // 5. Subtotal, Discount, VAT, Service Charge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${order.subtotal.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (order.discount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Discount:',
                          style: const TextStyle(fontSize: 11, color: Colors.green, fontFamily: 'monospace'),
                        ),
                        Text(
                          '-৳${order.discount.toStringAsFixed(2)}',
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
                        'VAT (Mushak 6.3 - 8%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${order.tax.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Service Charge (4%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${order.serviceCharge.toStringAsFixed(2)}',
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
                        '৳${order.total.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900, color: Color(0xFFFF6D00), fontFamily: 'monospace'),
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
                        order.paymentMethod,
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
                        '৳${order.paidAmount.toStringAsFixed(2)}',
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
                        '৳${order.changeAmount.toStringAsFixed(2)}',
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
                      'Thank you for dining with us! Please\nvisit us again.',
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
                      'Software by BPOS Restaurant',
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
                            content: Text(isBn ? 'রিসিট প্রিন্ট হচ্ছে ($orderId)...' : 'Printing Thermal Receipt (80mm) for $orderId...'),
                            duration: const Duration(seconds: 2),
                            backgroundColor: const Color(0xFFFF6D00),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF242424) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFFFFCC80)),
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
                                  isBn ? 'থার্মাল প্রিন্ট' : 'Print Thermal',
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

                  // New Order Button
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF6D00),
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFFF6D00).withValues(alpha: 0.35),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.refresh_rounded, size: 18, color: Colors.white),
                            const SizedBox(width: 6),
                            Text(
                              isBn ? 'নতুন অর্ডার' : 'New Order',
                              style: const TextStyle(
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
