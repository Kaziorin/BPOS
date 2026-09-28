import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import 'dialogs/pharmacy_dialogs.dart';

class PharmacyCartPanel extends StatefulWidget {
  final bool isMobile;
  const PharmacyCartPanel({super.key, this.isMobile = false});

  @override
  State<PharmacyCartPanel> createState() => _PharmacyCartPanelState();
}

class _PharmacyCartPanelState extends State<PharmacyCartPanel> {
  final TextEditingController _discountCtrl = TextEditingController();
  final TextEditingController _noteCtrl = TextEditingController();

  @override
  void dispose() {
    _discountCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: context.isDark ? context.cardBg : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          if (!context.isDark)
            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 15, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          // ── TOP HEADER (Rx Mode, Notif, Profile) ──
          _buildPharmacistHeader(context),
          const Divider(height: 1),
          
          // ── CART TITLE & CUSTOMER ──
          _buildCartHeader(context),
          
          // ── CART ITEMS LIST ──
          Expanded(child: _buildCartItemList(context)),
          
          // ── PHARMACY SAFETY CHECK ──
          _buildSafetyCheck(context),
          
          const Divider(height: 1),
          
          // ── SUMMARY & INPUTS ──
          _buildSummarySection(context),
          
          // ── PAYMENT METHODS ──
          _buildPaymentMethods(context),
          
          // ── FINAL ACTIONS (Hold & Pay) ──
          _buildCheckoutActions(context),
        ],
      ),
    );
  }

  Widget _buildPharmacistHeader(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();

    return Container(
      height: 58,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          // Rx Mode Toggle
          InkWell(
            onTap: () {
              provider.toggleRxMode();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(provider.isRxMode ? 'Rx Mode Activated: Prescriptions strictly enforced.' : 'Rx Mode Deactivated: Standard OTC mode.'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: provider.isRxMode ? const Color(0xFF00695C) : Colors.grey.shade400,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Icon(Icons.medical_services_outlined, color: Colors.white, size: 14),
                  const SizedBox(width: 5),
                  const Text('Rx Mode', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 6),
                  Container(
                    width: 22, height: 13,
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 200),
                      alignment: provider.isRxMode ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        width: 9, height: 9,
                        margin: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: provider.isRxMode ? const Color(0xFF00695C) : Colors.grey,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const Spacer(),
          if (widget.isMobile)
            IconButton(
              icon: const Icon(Icons.close_rounded),
              onPressed: () => Navigator.of(context).pop(),
              tooltip: 'Close Cart',
            )
          else ...[
            // Notification Bell
            InkWell(
              onTap: () => showPharmacyNotificationDialog(context, provider),
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.all(4.0),
                child: Stack(
                  children: [
                    Icon(Icons.notifications_none_rounded, color: Colors.grey.shade600),
                    Positioned(
                      right: 0, top: 0,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                        child: const Text('3', style: TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            const VerticalDivider(width: 1, indent: 8, endIndent: 8),
            const SizedBox(width: 10),
            // Profile
            InkWell(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Logged in as: Pharmacist Ahmed R. (Terminal PC-01)'), duration: Duration(seconds: 1)),
                );
              },
              child: const Row(
                children: [
                  CircleAvatar(
                    radius: 13,
                    backgroundColor: Color(0xFF00695C),
                    child: Icon(Icons.person, color: Colors.white, size: 15),
                  ),
                  SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Pharmacist',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, height: 1.1),
                      ),
                      Text(
                        'Shop-01',
                        style: TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCartHeader(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();
    final customer = provider.selectedCustomer;
    final customerName = customer?['name'] ?? 'Walk-in';

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.shopping_cart_outlined, color: Color(0xFF00695C), size: 20),
              const SizedBox(width: 8),
              Text(
                'Cart (${provider.totalItemCount} Items)',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: Color(0xFF00695C)),
              ),
              if (provider.cart.isNotEmpty) ...[
                const SizedBox(width: 6),
                InkWell(
                  onTap: () => provider.clearCart(),
                  child: const Icon(Icons.delete_sweep_outlined, size: 18, color: Colors.redAccent),
                ),
              ],
            ],
          ),
          Row(
            children: [
              // Customer Pill
              InkWell(
                onTap: () => showPharmacyCustomerDialog(context, provider),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: context.isDark ? context.scaffoldBg : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: customer != null ? const Color(0xFF00695C) : Colors.transparent,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.person_rounded, size: 14, color: customer != null ? const Color(0xFF00695C) : Colors.grey.shade700),
                      const SizedBox(width: 5),
                      Text(
                        'Customer: $customerName',
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          color: customer != null ? const Color(0xFF00695C) : (context.isDark ? Colors.white70 : Colors.grey.shade800),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),
              // Add Icon Circle
              InkWell(
                onTap: () => showPharmacyCustomerDialog(context, provider),
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(5),
                  decoration: const BoxDecoration(
                    color: Color(0xFF00695C),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.add, size: 12, color: Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCartItemList(BuildContext context) {
    return Consumer<PharmacyProvider>(
      builder: (context, provider, _) {
        final cartItems = provider.cart;
        if (cartItems.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shopping_cart_outlined, size: 48, color: Colors.grey.shade300),
                const SizedBox(height: 8),
                Text('Cart is empty', style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Click + on medicines to add', style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          itemCount: cartItems.length,
          separatorBuilder: (context, index) => const Divider(height: 8),
          itemBuilder: (context, index) {
            final item = cartItems[index];
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                children: [
                  // Image
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      item.medicine.imagePath,
                      width: 38,
                      height: 38,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 38, height: 38,
                        color: Colors.grey.shade100,
                        child: const Icon(Icons.medication, size: 20, color: Color(0xFF00695C)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              item.medicine.name,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (item.medicine.isRx) 
                              Container(
                                margin: const EdgeInsets.only(left: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(4)),
                                child: const Text('Rx', style: TextStyle(color: Colors.purple, fontSize: 8, fontWeight: FontWeight.bold)),
                              ),
                          ],
                        ),
                        Text(
                          '৳${item.medicine.price.toStringAsFixed(2)} • Stock: ${item.medicine.stock}',
                          style: const TextStyle(fontSize: 10, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  // Qty
                  Row(
                    children: [
                      _qtyBtn(context, Icons.remove, () => provider.updateQuantity(item.medicine.id, -1)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                      _qtyBtn(context, Icons.add, () => provider.updateQuantity(item.medicine.id, 1)),
                    ],
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '৳ ${item.total.toStringAsFixed(2)}',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12.5, color: Color(0xFF00695C)),
                  ),
                  const SizedBox(width: 6),
                  InkWell(
                    onTap: () => provider.removeItem(item.medicine.id),
                    child: const Icon(Icons.close_rounded, size: 16, color: Colors.redAccent),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _qtyBtn(BuildContext context, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: context.isDark ? context.scaffoldBg : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Icon(icon, size: 14, color: context.textPrimary),
      ),
    );
  }

  Widget _buildSafetyCheck(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();
    final checks = provider.safetyChecks;

    return Container(
      margin: const EdgeInsets.fromLTRB(12, 4, 12, 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: context.isDark ? context.scaffoldBg : const Color(0xFFE0F2F1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF00695C).withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_outlined, color: Color(0xFF00695C), size: 16),
              const SizedBox(width: 6),
              const Text(
                'Pharmacy Safety & Drug Interactions',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Color(0xFF00695C)),
              ),
              const Spacer(),
              if (provider.attachedPrescription != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: Colors.green, borderRadius: BorderRadius.circular(4)),
                  child: const Text('Rx Verified', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 6),
          ...checks.map((chk) {
            Color c = Colors.green;
            IconData ic = Icons.check_circle_outline;
            if (chk['type'] == 'warning') {
              c = Colors.orange;
              ic = Icons.warning_amber_rounded;
            } else if (chk['type'] == 'danger') {
              c = Colors.red;
              ic = Icons.error_outline_rounded;
            }

            return Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Row(
                children: [
                  Icon(ic, size: 13, color: c),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      chk['title'] as String,
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: c),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSummarySection(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left: Discount & Note Inputs
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Apply Discount', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        height: 32,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: context.isDark ? context.scaffoldBg : Colors.white,
                          border: Border.all(color: Colors.grey.shade300),
                          borderRadius: const BorderRadius.horizontal(left: Radius.circular(6)),
                        ),
                        child: TextField(
                          controller: _discountCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: const TextStyle(fontSize: 11),
                          decoration: const InputDecoration(
                            hintText: 'Discount %',
                            hintStyle: TextStyle(fontSize: 10, color: Colors.grey),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.only(top: 8),
                          ),
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: () {
                        final val = double.tryParse(_discountCtrl.text) ?? 0.0;
                        provider.setDiscount(val);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Applied ${val.toStringAsFixed(0)}% discount!'), duration: const Duration(seconds: 1)),
                        );
                      },
                      child: Container(
                        height: 32,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: const BoxDecoration(
                          color: Color(0xFF00695C),
                          borderRadius: BorderRadius.horizontal(right: Radius.circular(6)),
                        ),
                        child: const Center(
                          child: Text('Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('Sales Note', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 4),
                Container(
                  height: 32,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: context.isDark ? context.scaffoldBg : Colors.white,
                    border: Border.all(color: Colors.grey.shade300),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: TextField(
                    controller: _noteCtrl,
                    onChanged: (val) => provider.setSalesNote(val),
                    style: const TextStyle(fontSize: 11),
                    decoration: const InputDecoration(
                      hintText: 'Add instructions...',
                      hintStyle: TextStyle(fontSize: 10, color: Colors.grey),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.only(top: 8),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Right: Subtotal, Discount, VAT, Total
          Expanded(
            child: Column(
              children: [
                _totalRow('Sub Total', '৳ ${provider.subTotal.toStringAsFixed(2)}'),
                if (provider.globalDiscount > 0)
                  _totalRow('Discount (${provider.globalDiscount}%)', '- ৳ ${provider.totalDiscount.toStringAsFixed(2)}', color: Colors.green),
                _totalRow('VAT (5%)', '৳ ${provider.vat.toStringAsFixed(2)}'),
                const Divider(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                    Text(
                      '৳ ${provider.total.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF00695C)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _totalRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.w500)),
          Text(value, style: TextStyle(color: color ?? Colors.black87, fontWeight: FontWeight.bold, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildPaymentMethods(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();
    final methods = [
      {'name': 'Cash', 'icon': Icons.money},
      {'name': 'Card', 'icon': Icons.credit_card},
      {'name': 'Mobile', 'icon': Icons.phone_android},
      {'name': 'Bank', 'icon': Icons.account_balance},
      {'name': 'Credit', 'icon': Icons.credit_score},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: methods.map((m) {
            final name = m['name'] as String;
            final isSel = provider.selectedPaymentMethod == name;

            return InkWell(
              onTap: () => provider.setPaymentMethod(name),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                margin: const EdgeInsets.only(right: 6),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isSel ? const Color(0xFFE0F2F1) : (context.isDark ? context.scaffoldBg : Colors.white),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSel ? const Color(0xFF00695C) : Colors.grey.shade300,
                    width: isSel ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(m['icon'] as IconData, size: 13, color: isSel ? const Color(0xFF00695C) : Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      name,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isSel ? const Color(0xFF00695C) : Colors.grey.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildCheckoutActions(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();
    final heldCount = provider.heldBills.length;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        children: [
          // Hold Button
          InkWell(
            onTap: () {
              if (provider.cart.isNotEmpty) {
                final held = provider.holdCurrentCart();
                if (held) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Order placed on Hold!'), duration: Duration(seconds: 1)),
                  );
                }
              } else if (heldCount > 0) {
                showPharmacyHeldBillsDialog(context, provider);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Cart is empty to hold.'), duration: Duration(seconds: 1)),
                );
              }
            },
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: heldCount > 0 ? Colors.orange.withValues(alpha: 0.1) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: heldCount > 0 ? Colors.orange : Colors.grey.shade300),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.pause_circle_outline_rounded, color: heldCount > 0 ? Colors.orange : const Color(0xFF00695C), size: 18),
                  Text(
                    heldCount > 0 ? 'Hold ($heldCount)' : 'Hold Bill',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: heldCount > 0 ? Colors.orange : null),
                  ),
                  const Text('(F6)', style: TextStyle(fontSize: 8.5, color: Colors.grey)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Pay Button
          Expanded(
            child: InkWell(
              onTap: () => showPharmacyCheckoutDialog(context, provider),
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFF00695C),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00695C).withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 18),
                        SizedBox(width: 8),
                        Text('Pay', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    Text(
                      '৳ ${provider.total.toStringAsFixed(2)}',
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                    ),
                    const Row(
                      children: [
                        Text('(F1)', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                      ],
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
