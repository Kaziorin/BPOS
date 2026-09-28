import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import 'dialogs/retail_dialogs.dart';

class RetailCartPanel extends StatelessWidget {
  final bool isMobile;

  const RetailCartPanel({
    super.key,
    this.isMobile = false,
  });

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;

    final subtotal = retailProvider.subtotal;
    final discount = retailProvider.discountTotal;
    final tax = retailProvider.taxTotal;
    final total = retailProvider.total;
    final itemCount = retailProvider.cart.fold(0, (sum, i) => sum + i.qty);
    final youSave = discount > 0 ? discount : 0.75;

    return Column(
      children: [
        // ── 1. CART HEADER BAR ──────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            border: Border(
              bottom: BorderSide(
                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Title & Item Count Pill
              Flexible(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Flexible(
                      child: Text(
                        'Current Order',
                        style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF1E293B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF3B1D54) : const Color(0xFFF3E8FF),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '$itemCount Items',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF7C3AED),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),

              // Action Pills (Add Customer & Clear Cart)
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Add Customer Button
                  InkWell(
                    onTap: () => showRetailCustomerDialog(context, retailProvider, isDark, initialTab: 1),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF262626) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF383838) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.person_outline_rounded, size: 13, color: Color(0xFF7C3AED)),
                          const SizedBox(width: 4),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 80),
                            child: Text(
                              retailProvider.selectedCustomer == 'Walk-in Customer'
                                  ? 'Customer'
                                  : retailProvider.selectedCustomer,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),

                  // Clear Cart F9 Button
                  InkWell(
                    onTap: retailProvider.cart.isEmpty ? null : () => retailProvider.clearCart(),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF3B1219) : const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? const Color(0xFF5F1D24) : const Color(0xFFFECDD3),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.delete_outline_rounded, size: 13, color: Color(0xFFEF4444)),
                          SizedBox(width: 3),
                          Text(
                            'Clear',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                          SizedBox(width: 3),
                          Text(
                            'F9',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFF43F5E),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // ── 2. TABLE HEADER ROW (ITEM, PRICE, QTY, TOTAL) ────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            border: Border(
              bottom: BorderSide(
                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          child: const Row(
            children: [
              Expanded(
                flex: 7,
                child: Text(
                  'ITEM',
                  style: TextStyle(
                    fontSize: 10.5,
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
                    fontSize: 10.5,
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
                    fontSize: 10.5,
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
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── 3. CART ITEMS LIST ──────────────────────────────────────────────
        Expanded(
          child: retailProvider.cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.shopping_cart_outlined, size: 36, color: Colors.grey.shade400),
                      const SizedBox(height: 6),
                      Text(
                        'Cart is empty',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  itemCount: retailProvider.cart.length,
                  separatorBuilder: (_, _) => Divider(
                    height: 14,
                    thickness: 1,
                    color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9),
                  ),
                  itemBuilder: (context, index) {
                    final item = retailProvider.cart[index];

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // ITEM COLUMN (Icon + Title + SKU)
                        Expanded(
                          flex: 7,
                          child: Row(
                            children: [
                              Container(
                                width: 38,
                                height: 38,
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF262626) : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF383838) : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: item.product.imageUrl.isNotEmpty
                                    ? Image.network(
                                        item.product.imageUrl,
                                        width: 38,
                                        height: 38,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) => Icon(
                                          Icons.inventory_2_outlined,
                                          size: 18,
                                          color: isDark ? Colors.grey.shade400 : const Color(0xFF94A3B8),
                                        ),
                                      )
                                    : Icon(
                                        Icons.inventory_2_outlined,
                                        size: 18,
                                        color: isDark ? Colors.grey.shade400 : const Color(0xFF94A3B8),
                                      ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.product.name,
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 1),
                                    Text(
                                      'SKU: ${item.product.sku}',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        color: Color(0xFF94A3B8),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
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
                              '৳${item.product.price.toStringAsFixed(2)}',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.grey.shade300 : const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                        ),

                        // QTY COLUMN (- [qty] +)
                        Expanded(
                          flex: 3,
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.center,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                              InkWell(
                                onTap: () => retailProvider.updateQty(index, item.qty - 1),
                                borderRadius: BorderRadius.circular(4),
                                child: Container(
                                  width: 22,
                                  height: 22,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.remove,
                                    size: 13,
                                    color: isDark ? Colors.grey.shade300 : const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                              Tooltip(
                                message: 'Click to type quantity or select presets',
                                child: InkWell(
                                  onTap: () => _showRetailQtyDialog(
                                    context,
                                    retailProvider,
                                    index,
                                    item.product.name,
                                    item.qty,
                                  ),
                                  borderRadius: BorderRadius.circular(4),
                                  child: Container(
                                    constraints: const BoxConstraints(minWidth: 28),
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(
                                        color: isDark ? const Color(0xFF4F46E5).withValues(alpha: 0.5) : const Color(0xFFCBD5E1),
                                      ),
                                    ),
                                    child: Text(
                                      '${item.qty}',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: isDark ? Colors.white : const Color(0xFF4F46E5),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              InkWell(
                                onTap: () => retailProvider.updateQty(index, item.qty + 1),
                                borderRadius: BorderRadius.circular(4),
                                child: Container(
                                  width: 22,
                                  height: 22,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(
                                      color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.add,
                                    size: 13,
                                    color: isDark ? Colors.grey.shade300 : const Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                        // TOTAL & REMOVE COLUMN
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
                                    '৳${item.lineTotal.toStringAsFixed(2)}',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              InkWell(
                                onTap: () => retailProvider.removeFromCart(index),
                                borderRadius: BorderRadius.circular(4),
                                child: Padding(
                                  padding: const EdgeInsets.all(2.0),
                                  child: Icon(
                                    Icons.delete_outline_rounded,
                                    size: 16,
                                    color: isDark ? Colors.grey.shade600 : const Color(0xFFCBD5E1),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ),

        // ── 4. SUMMARY & TOTAL PAYABLE AREA ──────────────────────────────────
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
            border: Border(
              top: BorderSide(
                color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
              ),
            ),
          ),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Calculations & Total Payable Card
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Left Side: Subtotal, Discount, Tax
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Subtotal',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.grey.shade400 : const Color(0xFF475569),
                                ),
                              ),
                              Text(
                                '৳${subtotal.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Discount',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF059669),
                                ),
                              ),
                              Text(
                                '-৳${discount.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Tax (5%)',
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                                ),
                              ),
                              Text(
                                '৳${tax.toStringAsFixed(2)}',
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
                    ),

                    const SizedBox(width: 10),

                    // Right Side: Gradient Total Payable Card
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: isDark
                              ? const LinearGradient(
                                  colors: [Color(0xFF2E1065), Color(0xFF1E1B4B)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : const LinearGradient(
                                  colors: [Color(0xFFFAF5FF), Color(0xFFF3E8FF)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isDark ? const Color(0xFF4C1D95) : const Color(0xFFE9D5FF),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Payable',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? const Color(0xFFDDD6FE) : const Color(0xFF4C1D95),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '৳${total.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 21,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF7C3AED),
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.local_offer_outlined, size: 10.5, color: Color(0xFF059669)),
                                const SizedBox(width: 3),
                                Text(
                                  'You Save ৳${youSave.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                // ── 5. PAYMENT METHOD TABS (Cash F3, Card F4, Mobile Pay F5, Gift Card F6, More F7)
                Row(
                  children: [
                    _buildPaymentMethodChip('Cash', 'F3', Icons.payments_outlined, retailProvider, isDark),
                    const SizedBox(width: 4),
                    _buildPaymentMethodChip('Card', 'F4', Icons.credit_card_rounded, retailProvider, isDark),
                    const SizedBox(width: 4),
                    _buildPaymentMethodChip('Mobile Pay', 'F5', Icons.smartphone_rounded, retailProvider, isDark),
                    const SizedBox(width: 4),
                    _buildPaymentMethodChip('Gift Card', 'F6', Icons.card_giftcard_rounded, retailProvider, isDark),
                    const SizedBox(width: 4),
                    _buildPaymentMethodChip('More', 'F7', Icons.more_horiz_rounded, retailProvider, isDark),
                  ],
                ),

                const SizedBox(height: 8),

                // ── 6. BOTTOM ACTION BUTTONS (Save & Hold F8, Pay Now F12) ─────
                if (isMobile) ...[
                  Row(
                    children: [
                      // Recall Button (Mobile only)
                      Expanded(
                        child: InkWell(
                          onTap: () => showRetailHoldsDialog(context, retailProvider, isDark),
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            height: 42,
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF242424) : Colors.white,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: retailProvider.heldSales.isNotEmpty
                                    ? const Color(0xFF8B5CF6)
                                    : (isDark ? const Color(0xFF333333) : const Color(0xFFCBD5E1)),
                                width: retailProvider.heldSales.isNotEmpty ? 1.5 : 1.0,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.restore_rounded,
                                  size: 16,
                                  color: retailProvider.heldSales.isNotEmpty
                                      ? const Color(0xFF8B5CF6)
                                      : Colors.grey.shade500,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  'Recall',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : const Color(0xFF334155),
                                  ),
                                ),
                                if (retailProvider.heldSales.isNotEmpty) ...[
                                  const SizedBox(width: 5),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF8B5CF6),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${retailProvider.heldSales.length}',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Save & Hold Button (Mobile)
                      Expanded(
                        child: InkWell(
                          onTap: retailProvider.cart.isEmpty
                              ? null
                              : () {
                                  retailProvider.holdSale();
                                },
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            height: 42,
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF242424) : Colors.white,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: isDark ? const Color(0xFF333333) : const Color(0xFFCBD5E1),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.pause_circle_outline_rounded, size: 16, color: Color(0xFF8B5CF6)),
                                const SizedBox(width: 5),
                                Text(
                                  'Save & Hold',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : const Color(0xFF334155),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Pay Now Main CTA Button (Full width on mobile)
                  InkWell(
                    onTap: retailProvider.cart.isEmpty
                        ? null
                        : () {
                            Navigator.pop(context);
                            showRetailCheckoutDialog(context, retailProvider, isDark);
                          },
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                        ),
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF8B5CF6).withValues(alpha: 0.35),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_outline_rounded, size: 18, color: Colors.white),
                          const SizedBox(width: 8),
                          const Text(
                            'Pay Now',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '৳${total.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.arrow_forward_rounded, size: 16, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  // Desktop / Web View (Unchanged!)
                  Row(
                    children: [
                      // Save & Hold Button
                      Expanded(
                        flex: 38,
                        child: InkWell(
                          onTap: retailProvider.cart.isEmpty
                              ? null
                              : () {
                                  retailProvider.holdSale();
                                  if (isMobile) Navigator.pop(context);
                                },
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            height: 42,
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF242424) : Colors.white,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: isDark ? const Color(0xFF333333) : const Color(0xFFCBD5E1),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.03),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.pause_circle_outline_rounded, size: 16, color: Color(0xFF8B5CF6)),
                                const SizedBox(width: 5),
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Save & Hold',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF334155),
                                        height: 1.1,
                                      ),
                                    ),
                                    const Text(
                                      'F8',
                                      style: TextStyle(
                                        fontSize: 8.5,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF94A3B8),
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

                      const SizedBox(width: 8),

                      // Pay Now Main CTA Button
                      Expanded(
                        flex: 62,
                        child: InkWell(
                          onTap: retailProvider.cart.isEmpty
                              ? null
                              : () {
                                  if (isMobile) Navigator.pop(context);
                                  showRetailCheckoutDialog(context, retailProvider, isDark);
                                },
                          borderRadius: BorderRadius.circular(4),
                          child: Container(
                            height: 42,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                              ),
                              borderRadius: BorderRadius.circular(4),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.check_circle_outline_rounded, size: 16, color: Colors.white),
                                const SizedBox(width: 6),
                                const Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'Pay Now',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w900,
                                        color: Colors.white,
                                        height: 1.1,
                                      ),
                                    ),
                                    Text(
                                      'F12',
                                      style: TextStyle(
                                        fontSize: 8.5,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white70,
                                        height: 1.1,
                                      ),
                                    ),
                                  ],
                                ),
                                const Spacer(),
                                Text(
                                  '৳${total.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodChip(
    String name,
    String fkey,
    IconData icon,
    RetailProvider retailProvider,
    bool isDark,
  ) {
    final isSelected = retailProvider.paymentMethod == name.toUpperCase() ||
        (name == 'Cash' && retailProvider.paymentMethod == 'CASH');

    return Expanded(
      child: InkWell(
        onTap: () => retailProvider.setPaymentMethod(name.toUpperCase()),
        borderRadius: BorderRadius.circular(4),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFF8B5CF6)
                : (isDark ? const Color(0xFF242424) : Colors.white),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: isSelected
                  ? const Color(0xFF8B5CF6)
                  : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.35),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 3,
                      offset: const Offset(0, 1),
                    ),
                  ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 13,
                color: isSelected ? Colors.white : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
              ),
              const SizedBox(height: 1),
              Text(
                name,
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  height: 1.1,
                  color: isSelected ? Colors.white : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                fkey,
                style: TextStyle(
                  fontSize: 7.5,
                  fontWeight: FontWeight.w600,
                  height: 1.1,
                  color: isSelected ? Colors.white70 : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Mobile Bottom Floating Cart Bar (< 900px) ─────────────────────────────
class RetailMobileBottomBar extends StatelessWidget {
  const RetailMobileBottomBar({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;
    final isCartEmpty = retailProvider.cart.isEmpty;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: Row(
          children: [
            // Left: Order total info
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${retailProvider.totalItemCount} ${retailProvider.totalItemCount == 1 ? 'ITEM' : 'ITEMS'} IN ORDER',
                  style: const TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF7C3AED),
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '৳${retailProvider.total.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 8),

            // Right: Actions (Hold, View Cart, Pay Now)
            Expanded(
              child: Align(
                alignment: Alignment.centerRight,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerRight,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // 1. Hold Button
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: isCartEmpty
                              ? null
                              : () {
                                  retailProvider.holdSale();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: const Row(
                                        children: [
                                          Icon(Icons.pause_circle_filled_rounded, color: Colors.white, size: 18),
                                          SizedBox(width: 8),
                                          Text('Order placed on hold!'),
                                        ],
                                      ),
                                      backgroundColor: const Color(0xFFD97706),
                                      behavior: SnackBarBehavior.floating,
                                      duration: const Duration(seconds: 2),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                    ),
                                  );
                                },
                          borderRadius: BorderRadius.circular(6),
                          child: Opacity(
                            opacity: isCartEmpty ? 0.45 : 1.0,
                            child: Container(
                              height: 38,
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF262115) : const Color(0xFFFFFBEB),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isDark ? const Color(0xFF543E19) : const Color(0xFFFDE68A),
                                  width: 1.2,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.pause_circle_outline_rounded,
                                    size: 16,
                                    color: Color(0xFFD97706),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Hold',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? const Color(0xFFFBBF24) : const Color(0xFFB45309),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),

                      // 2. View Cart Button (Refined & Modern)
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                              ),
                              builder: (ctx) => SizedBox(
                                height: MediaQuery.of(ctx).size.height * 0.75,
                                child: const RetailCartPanel(isMobile: true),
                              ),
                            );
                          },
                          borderRadius: BorderRadius.circular(6),
                          child: Container(
                            height: 38,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF251F36) : const Color(0xFFF5F3FF),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isDark ? const Color(0xFF4C3A6E) : const Color(0xFFDDD6FE),
                                width: 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF7C3AED).withValues(alpha: 0.06),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.shopping_bag_outlined,
                                  size: 16,
                                  color: Color(0xFF7C3AED),
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  'View Cart',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED),
                                  ),
                                ),
                                if (retailProvider.totalItemCount > 0) ...[
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF7C3AED),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${retailProvider.totalItemCount}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),

                      // 3. Pay Now Button
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: isCartEmpty
                              ? null
                              : () => showRetailCheckoutDialog(context, retailProvider, isDark),
                          borderRadius: BorderRadius.circular(6),
                          child: Opacity(
                            opacity: isCartEmpty ? 0.45 : 1.0,
                            child: Container(
                              height: 38,
                              padding: const EdgeInsets.symmetric(horizontal: 14),
                              decoration: BoxDecoration(
                                gradient: isCartEmpty
                                    ? null
                                    : const LinearGradient(
                                        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                color: isCartEmpty
                                    ? (isDark ? const Color(0xFF333333) : const Color(0xFFCBD5E1))
                                    : null,
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: isCartEmpty
                                    ? []
                                    : [
                                        BoxShadow(
                                          color: const Color(0xFF7C3AED).withValues(alpha: 0.35),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Pay Now',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(
                                    Icons.arrow_forward_rounded,
                                    size: 15,
                                    color: Colors.white,
                                  ),
                                ],
                              ),
                            ),
                          ),
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
  }
}

// ─────────────────────────────────────────────────────────────────
// QUICK RETAIL QUANTITY PRESET MODAL
// ─────────────────────────────────────────────────────────────────
Future<void> _showRetailQtyDialog(
  BuildContext context,
  RetailProvider retailProvider,
  int index,
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
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.edit_note_rounded, color: Color(0xFF4F46E5), size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Set Quantity', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                      Text(productName, maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 11, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B))),
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
                  TextField(
                    controller: dialogCtrl,
                    autofocus: true,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF4F46E5)),
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
                        retailProvider.updateQty(index, val);
                        Navigator.pop(ctx);
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Quick Presets:', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B))),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [5, 10, 25, 50, 100].map((preset) {
                      return InkWell(
                        onTap: () => updateVal(preset),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4F46E5).withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF4F46E5).withValues(alpha: 0.25)),
                          ),
                          child: Text('$preset', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF4F46E5))),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Quick Add (+):', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B))),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: [1, 5, 10, 50, 100].map((add) {
                      return InkWell(
                        onTap: () => addVal(add),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                          ),
                          child: Text('+$add', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF10B981))),
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
                child: Text('Cancel', style: TextStyle(color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B))),
              ),
              ElevatedButton(
                onPressed: () {
                  final val = int.tryParse(dialogCtrl.text);
                  if (val != null && val > 0) {
                    retailProvider.updateQty(index, val);
                    Navigator.pop(ctx);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
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
