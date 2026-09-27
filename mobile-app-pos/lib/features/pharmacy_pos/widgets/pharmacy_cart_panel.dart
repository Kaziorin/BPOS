import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';

class PharmacyCartPanel extends StatelessWidget {
  const PharmacyCartPanel({super.key});

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
    return Container(
      height: 64, // Same height as left header for perfect alignment
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          // Rx Mode Toggle
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF00695C),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.medical_services_outlined, color: Colors.white, size: 14),
                const SizedBox(width: 6),
                const Text('Rx Mode', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                Container(
                  width: 24, height: 14,
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                  child: Align(
                    alignment: Alignment.centerRight,
                    child: Container(width: 10, height: 10, margin: const EdgeInsets.all(2), decoration: const BoxDecoration(color: Color(0xFF00695C), shape: BoxShape.circle)),
                  ),
                ),
              ],
            ),
          ),
          const Spacer(),
          // Notification Bell
          Stack(
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
          const SizedBox(width: 12),
          const VerticalDivider(width: 1, indent: 5, endIndent: 5),
          const SizedBox(width: 12),
          // Profile
          const CircleAvatar(
            radius: 14,
            backgroundColor: Color(0xFF00695C),
            child: Icon(Icons.person, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 10),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center, // Center the text vertically
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
          const SizedBox(width: 4),
          Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Colors.grey.shade600),
        ],
      ),
    );
  }

  Widget _buildCartHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.shopping_cart_outlined, color: Color(0xFF00695C), size: 20),
              const SizedBox(width: 8),
              Consumer<PharmacyProvider>(
                builder: (context, provider, _) => Text(
                  'Cart (${provider.totalItemCount} Items)',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: Color(0xFF00695C)),
                ),
              ),
            ],
          ),
          Row(
            children: [
              // Customer Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: context.isDark ? context.scaffoldBg : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Icon(Icons.person_rounded, size: 16, color: Colors.grey.shade700),
                    const SizedBox(width: 6),
                    Text(
                      'Customer: Walk-in',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: context.isDark ? Colors.white70 : Colors.grey.shade800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Add Icon Circle
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: context.isDark ? context.scaffoldBg : Colors.grey.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.add, size: 14, color: Colors.grey.shade700),
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
        if (provider.cart.isEmpty) {
          return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.shopping_basket_outlined, size: 40, color: Colors.grey.shade300), const SizedBox(height: 12), const Text('Cart is empty', style: TextStyle(color: Colors.grey))]));
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: provider.cart.length,
          itemBuilder: (context, index) {
            final item = provider.cart[index];
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  Row(
                    children: [
                      // Product Image
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.network(item.medicine.imagePath, width: 36, height: 36, fit: BoxFit.contain, errorBuilder: (_, _, _) => const Icon(Icons.medication)),
                      ),
                      const SizedBox(width: 12),
                      // Name & Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(item.medicine.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                if (item.medicine.isRx) 
                                  Container(margin: const EdgeInsets.only(left: 4), padding: const EdgeInsets.all(2), decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(4)), child: const Text('Rx', style: TextStyle(color: Colors.red, fontSize: 7, fontWeight: FontWeight.bold))),
                              ],
                            ),
                            Text('Stock: ${item.medicine.stock}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                          ],
                        ),
                      ),
                      // Qty
                      Row(
                        children: [
                          _qtyBtn(context, Icons.remove, () => provider.updateQuantity(item.medicine.id, -1)),
                          Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold))),
                          _qtyBtn(context, Icons.add, () => provider.updateQuantity(item.medicine.id, 1)),
                        ],
                      ),
                      const SizedBox(width: 16),
                      Text('৳ ${item.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Color(0xFF00695C))),
                      const SizedBox(width: 8),
                      GestureDetector(onTap: () => provider.removeItem(item.medicine.id), child: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red)),
                    ],
                  ),
                  // Interaction Message (Mock)
                  if (item.medicine.name == 'Metformin')
                    Padding(
                      padding: const EdgeInsets.only(left: 48, top: 4),
                      child: Row(children: [const Icon(Icons.check_circle, size: 12, color: Colors.green), const SizedBox(width: 4), const Text('No interaction detected', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.w600))]),
                    ),
                  if (item.medicine.name == 'Vitamin C')
                    Padding(
                      padding: const EdgeInsets.only(left: 48, top: 4),
                      child: Row(children: [const Icon(Icons.warning_amber_rounded, size: 12, color: Colors.orange), const SizedBox(width: 4), const Text('May reduce effect of some antibiotics', style: TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.w600))]),
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
      child: Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
        child: Icon(icon, size: 14, color: Colors.grey.shade700),
      ),
    );
  }

  Widget _buildSafetyCheck(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFE0F2F1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Row(
            children: [
              Icon(Icons.shield_outlined, color: Color(0xFF00695C), size: 18),
              SizedBox(width: 8),
              Text('Pharmacy Safety Check', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF00695C))),
              Spacer(),
              Icon(Icons.keyboard_arrow_up_rounded, size: 18, color: Color(0xFF00695C)),
            ],
          ),
          const SizedBox(height: 8),
          _safetyItem(Icons.check_circle, 'Prescription verified', Colors.green),
          _safetyItem(Icons.check_circle, 'No drug interaction detected', Colors.green),
          _safetyItem(Icons.warning_amber_rounded, '1 item expires soon (Metformin)', Colors.orange),
        ],
      ),
    );
  }

  Widget _safetyItem(IconData icon, String text, Color color) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 8),
          Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color.withValues(alpha: 0.9))),
        ],
      ),
    );
  }

  Widget _buildSummarySection(BuildContext context) {
    return Consumer<PharmacyProvider>(
      builder: (context, provider, _) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Discount & Note
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Apply Discount', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Expanded(child: Container(height: 36, padding: const EdgeInsets.symmetric(horizontal: 10), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.grey.shade200), borderRadius: const BorderRadius.horizontal(left: Radius.circular(8))), child: const Align(alignment: Alignment.centerLeft, child: Text('%', style: TextStyle(color: Colors.grey))))),
                          Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: const Color(0xFFE0F2F1), borderRadius: const BorderRadius.horizontal(right: Radius.circular(8))), child: const Text('Apply', style: TextStyle(color: Color(0xFF00695C), fontWeight: FontWeight.bold, fontSize: 11))),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Sales Note',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF475569)),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        height: 44,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: context.isDark ? context.scaffoldBg : Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Add note...',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                // Totals
                Expanded(
                  child: Column(
                    children: [
                      _totalRow('Sub Total', '৳ ${provider.subTotal.toStringAsFixed(2)}'),
                      _totalRow('Discount', '- ৳ ${provider.totalDiscount.toStringAsFixed(2)}', color: Colors.green),
                      _totalRow('VAT (5%)', '৳ ${provider.vat.toStringAsFixed(2)}'),
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                          Text('৳ ${provider.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF009688))),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _totalRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w500)), Text(value, style: TextStyle(color: color ?? Colors.black87, fontWeight: FontWeight.bold, fontSize: 12))]),
    );
  }

  Widget _buildPaymentMethods(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _payMethod(Icons.money, 'Cash', true),
            _payMethod(Icons.credit_card, 'Card', false),
            _payMethod(Icons.phone_android, 'Mobile', false),
            _payMethod(Icons.account_balance, 'Bank', false),
            _payMethod(Icons.credit_score, 'Credit', false),
          ],
        ),
      ),
    );
  }

  Widget _payMethod(IconData icon, String label, bool isSelected) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFFE0F2F1) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isSelected ? const Color(0xFF00695C) : Colors.grey.shade200),
      ),
      child: Row(children: [Icon(icon, size: 14, color: isSelected ? const Color(0xFF00695C) : Colors.grey), const SizedBox(width: 6), Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF00695C) : Colors.grey))]),
    );
  }

  Widget _buildCheckoutActions(BuildContext context) {
    return Consumer<PharmacyProvider>(
      builder: (context, provider, _) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Row(
          children: [
            // Hold Button
            InkWell(
              onTap: () {},
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.pause_circle_outline_rounded, color: Color(0xFF00695C), size: 20),
                    const Text('Hold Bill', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    Text('(F6)', style: TextStyle(fontSize: 9, color: Colors.grey.shade600)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Pay Button
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
                decoration: BoxDecoration(
                  color: const Color(0xFF00695C),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(children: [Icon(Icons.point_of_sale_rounded, color: Colors.white), SizedBox(width: 12), Text('Pay', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900))]),
                    Text('৳ ${provider.total.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                    const Row(children: [Text('(F1)', style: TextStyle(color: Colors.white70, fontSize: 12)), SizedBox(width: 8), Icon(Icons.arrow_forward_rounded, color: Colors.white)]),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
