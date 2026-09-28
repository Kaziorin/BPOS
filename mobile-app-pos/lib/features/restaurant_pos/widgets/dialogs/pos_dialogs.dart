import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/models/menu_item.dart';
import '../../../../core/providers/pos_provider.dart';
import '../../../../core/providers/app_provider.dart';
import '../../../../core/localization/app_strings.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../../../core/utils/number_utils.dart';
import 'restaurant_checkout_dialog.dart';

export 'restaurant_checkout_dialog.dart';

// ─────────────────────────────────────────────────────────────────
// TABLE SELECTION DIALOG
// ─────────────────────────────────────────────────────────────────
class TableSelectionDialog extends StatelessWidget {
  const TableSelectionDialog({super.key});

  static const List<Map<String, dynamic>> tables = [
    {'name': 'T-01', 'capacity': 2, 'isOccupied': false},
    {'name': 'T-02', 'capacity': 4, 'isOccupied': true},
    {'name': 'T-03', 'capacity': 4, 'isOccupied': false},
    {'name': 'T-04', 'capacity': 6, 'isOccupied': false},
    {'name': 'T-05', 'capacity': 4, 'isOccupied': true},
    {'name': 'T-06', 'capacity': 2, 'isOccupied': false},
    {'name': 'T-07', 'capacity': 8, 'isOccupied': true},
    {'name': 'T-08', 'capacity': 4, 'isOccupied': false},
    {'name': 'VIP-01', 'capacity': 10, 'isOccupied': false},
    {'name': 'VIP-02', 'capacity': 12, 'isOccupied': true},
    {'name': 'Outdoor-01', 'capacity': 4, 'isOccupied': false},
    {'name': 'Outdoor-02', 'capacity': 4, 'isOccupied': false},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);

    return AlertDialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.table_restaurant_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(AppStrings.get('select_table', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 500, maxHeight: MediaQuery.of(context).size.height * 0.65),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLegend(Colors.green.shade600, AppStrings.get('available', locale)),
                  const SizedBox(width: 16),
                  _buildLegend(Colors.orange.shade800, AppStrings.get('occupied', locale)),
                  const SizedBox(width: 16),
                  _buildLegend(primaryOrange, AppStrings.get('selected_label', locale)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: tables.map<Widget>((t) {
                    final tableName = t['name'] as String;
                    final isCurrent = provider.tableNumber == tableName;
                    final isOccupied = t['isOccupied'] as bool;
                    Color cardColor = isCurrent ? primaryOrange : (isOccupied ? Colors.orange.shade50 : Colors.green.shade50);
                    Color borderColor = isCurrent ? primaryOrange : (isOccupied ? Colors.orange.shade300 : Colors.green.shade300);
                    Color textColor = isCurrent ? Colors.white : (isOccupied ? Colors.orange.shade900 : Colors.green.shade900);
                    return GestureDetector(
                      onTap: () { provider.selectTable(tableName); Navigator.of(context).pop(); },
                      child: Container(
                        width: 105,
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
                        decoration: BoxDecoration(color: cardColor, borderRadius: BorderRadius.circular(14), border: Border.all(color: borderColor, width: 2), boxShadow: isCurrent ? [BoxShadow(color: primaryOrange.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))] : []),
                        child: Column(
                          children: [
                            Text(NumberUtils.toLocalized(tableName, locale), style: TextStyle(color: textColor, fontWeight: FontWeight.w900, fontSize: 15)),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.person, size: 12, color: textColor.withValues(alpha: 0.8)),
                                const SizedBox(width: 2),
                                Text('${NumberUtils.toLocalized(t['capacity'], locale)} ${AppStrings.get('seats', locale)}', style: TextStyle(color: textColor.withValues(alpha: 0.8), fontSize: 11, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('close', locale)))],
    );
  }

  Widget _buildLegend(Color color, String label) {
    return Row(children: [Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)), const SizedBox(width: 6), Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w600))]);
  }
}

// ─────────────────────────────────────────────────────────────────
// WAITER SELECTION DIALOG
// ─────────────────────────────────────────────────────────────────
class WaiterSelectionDialog extends StatelessWidget {
  const WaiterSelectionDialog({super.key});

  static const List<Map<String, String>> waiters = [
    {'name': 'waiter_1', 'role': 'role_head', 'avatar': '👨‍🍳'},
    {'name': 'waiter_2', 'role': 'role_senior', 'avatar': '👨‍🍳'},
    {'name': 'waiter_3', 'role': 'role_waitress', 'avatar': '👩‍🍳'},
    {'name': 'waiter_4', 'role': 'role_waiter', 'avatar': '🧑‍🍳'},
    {'name': 'waiter_5', 'role': 'role_junior', 'avatar': '👩‍🍳'},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      title: Row(
        children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)), child: Icon(Icons.person_outline_rounded, color: primaryOrange)),
          const SizedBox(width: 12),
          Expanded(child: Text(AppStrings.get('select_server', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 360, maxHeight: MediaQuery.of(context).size.height * 0.65),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: waiters.map<Widget>((w) {
              final waiterKey = w['name']!;
              final waiterName = AppStrings.get(waiterKey, locale);
              final isSelected = provider.waiterKey == waiterKey;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(color: isSelected ? primaryOrange.withValues(alpha: 0.08) : Colors.grey.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: isSelected ? primaryOrange : Colors.grey.shade200, width: 1.5)),
                child: ListTile(
                  leading: Text(w['avatar']!, style: const TextStyle(fontSize: 24)),
                  title: Text(waiterName, style: TextStyle(fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600, color: isSelected ? primaryOrange : Colors.black87)),
                  subtitle: Text(AppStrings.get(w['role']!, locale)),
                  trailing: isSelected ? Icon(Icons.check_circle_rounded, color: primaryOrange) : null,
                  onTap: () { provider.selectWaiter(waiterKey); Navigator.of(context).pop(); },
                ),
              );
            }).toList(),
          ),
        ),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// HELD ORDERS DIALOG
// ─────────────────────────────────────────────────────────────────
class HeldOrdersDialog extends StatelessWidget {
  const HeldOrdersDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);
    final isBn = locale == 'bn';

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      title: Row(
        children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)), child: Icon(Icons.pause_circle_outline_rounded, color: primaryOrange)),
          const SizedBox(width: 12),
          Expanded(child: Text(AppStrings.get('held_orders', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
          Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: Text('${NumberUtils.toLocalized(provider.heldOrders.length, locale)} ${isBn ? 'হোল্ড' : 'Held'}', style: TextStyle(color: primaryOrange, fontWeight: FontWeight.bold, fontSize: 12))),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        height: 360,
        child: provider.heldOrders.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.inbox_outlined, size: 48, color: Colors.grey.shade400), const SizedBox(height: 12), Text(AppStrings.get('no_held_orders', locale), style: TextStyle(color: Colors.grey.shade600, fontSize: 15))]))
            : ListView.builder(
                itemCount: provider.heldOrders.length,
                itemBuilder: (context, index) {
                  final held = provider.heldOrders[index];
                  final timeStr = '${held.timestamp.hour.toString().padLeft(2, '0')}:${held.timestamp.minute.toString().padLeft(2, '0')}';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6, offset: const Offset(0, 2))]),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(held.id, style: TextStyle(fontWeight: FontWeight.w800, color: primaryOrange, fontSize: 14)), Text(timeStr, style: TextStyle(color: Colors.grey.shade500, fontSize: 12))]),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.table_restaurant, size: 14, color: Colors.grey.shade600), const SizedBox(width: 4), Text(held.tableNumber, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)), const SizedBox(width: 10), Icon(Icons.person, size: 14, color: Colors.grey.shade600), const SizedBox(width: 4),
                            Expanded(child: Text(AppStrings.get(held.waiter, locale), style: const TextStyle(fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                            Text('৳${NumberUtils.toLocalized(held.total.toStringAsFixed(2), locale)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Colors.black87)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('${NumberUtils.toLocalized(held.items.length, locale)} ${isBn ? 'আইটেম' : 'items'}: ${held.items.map((i) => "${NumberUtils.toLocalized(i.quantity, locale)}x ${i.menuItem.localizedName(locale)}").join(', ')}', style: TextStyle(color: Colors.grey.shade700, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(child: OutlinedButton.icon(onPressed: () { provider.deleteHeldOrder(held.id); }, style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: BorderSide(color: Colors.red.shade200), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8)), icon: const Icon(Icons.delete_outline, size: 14), label: FittedBox(fit: BoxFit.scaleDown, child: Text(AppStrings.get('delete', locale), style: const TextStyle(fontSize: 12))))),
                            const SizedBox(width: 8),
                            Expanded(child: ElevatedButton.icon(onPressed: () { provider.recallOrder(held); Navigator.of(context).pop(); }, style: ElevatedButton.styleFrom(backgroundColor: primaryOrange, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8)), icon: const Icon(Icons.restore, size: 14), label: FittedBox(fit: BoxFit.scaleDown, child: Text(AppStrings.get('recall_order', locale), style: const TextStyle(fontSize: 12))))),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('close', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SPLIT BILL DIALOG
// ─────────────────────────────────────────────────────────────────
class SplitBillDialog extends StatefulWidget {
  const SplitBillDialog({super.key});

  @override
  State<SplitBillDialog> createState() => _SplitBillDialogState();
}

class _SplitBillDialogState extends State<SplitBillDialog> {
  int _splitCount = 2;

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final total = provider.totalPayable;
    final perPerson = total / _splitCount;
    final primaryOrange = const Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(children: [Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)), child: Icon(Icons.call_split_rounded, color: primaryOrange)), const SizedBox(width: 12), Text(AppStrings.get('split_bill', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))]),
      content: SizedBox(
        width: 380,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(14), border: Border.all(color: primaryOrange.withValues(alpha: 0.2))), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('${AppStrings.get('total_bill', locale)}:', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)), Text('৳${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)}', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: primaryOrange))])),
            const SizedBox(height: 20),
            Text(AppStrings.get('split_equally', locale), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [IconButton.filledTonal(onPressed: _splitCount > 2 ? () => setState(() => _splitCount--) : null, icon: const Icon(Icons.remove)), Container(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8), child: Text('${NumberUtils.toLocalized(_splitCount, locale)} ${AppStrings.get('people', locale)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18))), IconButton.filledTonal(onPressed: _splitCount < 10 ? () => setState(() => _splitCount++) : null, icon: const Icon(Icons.add))]),
            const SizedBox(height: 20),
            Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(14)), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('${AppStrings.get('each_pays', locale)}:', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600)), Text('৳${NumberUtils.toLocalized(perPerson.toStringAsFixed(2), locale)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Colors.black87))])),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale))),
        ElevatedButton(onPressed: () { Navigator.of(context).pop(); final msg = locale == 'bn' ? 'বিলটি ${NumberUtils.toLocalized(_splitCount, locale)} জনের মধ্যে ভাগ করা হয়েছে (৳${NumberUtils.toLocalized(perPerson.toStringAsFixed(2), locale)} করে)' : 'Bill split into $_splitCount receipts (৳${perPerson.toStringAsFixed(2)} each)'; ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: primaryOrange)); }, style: ElevatedButton.styleFrom(backgroundColor: primaryOrange, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))), child: Text(AppStrings.get('confirm_split', locale))),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// TRANSFER ORDER DIALOG
// ─────────────────────────────────────────────────────────────────
class TransferOrderDialog extends StatelessWidget {
  const TransferOrderDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(children: [Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)), child: Icon(Icons.sync_alt_rounded, color: primaryOrange)), const SizedBox(width: 12), Expanded(child: Text(AppStrings.get('transfer_order', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)))]),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${AppStrings.get('current_table', locale)}: ${NumberUtils.toLocalized(provider.tableNumber, locale)}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 14),
            Text(AppStrings.get('destination_table', locale), style: const TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['T-01', 'T-02', 'T-03', 'T-04', 'T-06', 'T-07', 'T-08', 'VIP-01']
                  .where((t) => t != provider.tableNumber)
                  .map<Widget>((t) {
                return ChoiceChip(label: Text(NumberUtils.toLocalized(t, locale)), selected: false, onSelected: (selected) { provider.transferTable(t); Navigator.of(context).pop(); final msg = locale == 'bn' ? 'অর্ডারটি ${NumberUtils.toLocalized(t, locale)} এ স্থানান্তর করা হয়েছে' : 'Order transferred to $t'; ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: primaryOrange)); });
              }).toList(),
            ),
          ],
        ),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CHECKOUT PAYMENT DIALOG
// ─────────────────────────────────────────────────────────────────
class CheckoutPaymentDialog extends StatefulWidget {
  const CheckoutPaymentDialog({super.key});

  @override
  State<CheckoutPaymentDialog> createState() => _CheckoutPaymentDialogState();
}

class _CheckoutPaymentDialogState extends State<CheckoutPaymentDialog> {
  String _selectedMethod = 'Cash';
  double _cashTendered = 0.0;
  final TextEditingController _cashController = TextEditingController();

  @override
  void dispose() {
    _cashController.dispose();
    super.dispose();
  }

  void _updateCash(double amount) {
    setState(() {
      _cashTendered = amount;
      _cashController.text = amount > 0 ? amount.toStringAsFixed(2) : '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final total = provider.totalPayable;
    final change = _cashTendered >= total ? _cashTendered - total : 0.0;
    const primaryOrange = Color(0xFFFF6D00);

    return AlertDialog(
      backgroundColor: context.cardBg,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.payments_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              isBn ? 'চেকআউট ও পেমেন্ট' : 'Checkout & Payment',
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: context.textPrimary),
            ),
          ),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.75,
          maxWidth: 440,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Total Amount Box ──
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: primaryOrange.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: primaryOrange.withValues(alpha: 0.15)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isBn ? 'মোট পরিমাণ:' : 'Total Due:',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: context.textPrimary),
                    ),
                    Text(
                      '৳${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 26, color: primaryOrange),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Payment Method ──
              Text(
                isBn ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textPrimary),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _methodTile(context, AppStrings.get('payment_cash', locale), 'Cash', Icons.money, isBn),
                  const SizedBox(width: 10),
                  _methodTile(context, AppStrings.get('payment_card', locale), 'Card', Icons.credit_card, isBn),
                  const SizedBox(width: 10),
                  _methodTile(context, AppStrings.get('payment_qr', locale), 'QR Pay', Icons.qr_code, isBn),
                ],
              ),
              const SizedBox(height: 24),

              // ── Cash Tendered Section ──
              if (_selectedMethod == 'Cash') ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isBn ? 'প্রদত্ত নগদ:' : 'Cash Tendered:',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: context.textPrimary),
                    ),
                    TextButton(
                      onPressed: () => _updateCash(total),
                      child: Text(isBn ? 'পুরো টাকা' : 'Exact Amount', style: const TextStyle(color: primaryOrange, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                
                TextField(
                  controller: _cashController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                  textAlign: TextAlign.right,
                  onChanged: (val) {
                    setState(() {
                      _cashTendered = double.tryParse(val) ?? 0.0;
                    });
                  },
                  decoration: InputDecoration(
                    prefixText: '৳ ',
                    prefixStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: context.textPrimary),
                    hintText: '0.00',
                    filled: true,
                    fillColor: context.inputBg,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.borderColor)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.borderColor)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: primaryOrange, width: 2)),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Quick Presets - Fill full row evenly without gap
                Row(
                  children: [20, 50, 100, 200, 500, 1000].map<Widget>((amt) {
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2.0),
                        child: InkWell(
                          onTap: () => _updateCash(_cashTendered + amt.toDouble()),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: context.cardBg,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: context.borderColor, width: 1.5),
                            ),
                            child: Text(
                              '+৳${NumberUtils.toLocalized(amt, locale)}',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 11, color: context.textPrimary),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Change Row
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _cashTendered >= total && total > 0
                        ? Colors.green.withValues(alpha: context.isDark ? 0.15 : 0.08) 
                        : context.inputBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _cashTendered >= total && total > 0 ? Colors.green.withValues(alpha: 0.3) : context.borderColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isBn ? 'ফেরত দেওয়ার পরিমাণ:' : 'Change to Return:',
                        style: TextStyle(color: context.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      Text(
                        '৳${NumberUtils.toLocalized(change.toStringAsFixed(2), locale)}',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 22,
                          color: _cashTendered >= total && total > 0 ? Colors.green : context.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      actions: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  side: BorderSide(color: context.dividerColor),
                ),
                child: Text(AppStrings.get('cancel', locale), style: TextStyle(color: context.textSecondary, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: (_selectedMethod == 'Cash' && _cashTendered < total)
                    ? null
                    : () {
                        final paid = _selectedMethod == 'Cash'
                            ? (_cashTendered > 0 ? _cashTendered : total)
                            : total;
                        final change = (_selectedMethod == 'Cash' && paid > total) ? paid - total : 0.0;
                        final completedOrder = provider.placeOrder(
                          paymentMethod: _selectedMethod,
                          paidAmount: paid,
                          changeAmount: change,
                        );
                        Navigator.of(context).pop();
                        showRestaurantReceiptDialog(context, completedOrder, context.isDark);
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryOrange,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: context.isDark ? Colors.grey.shade800 : Colors.grey.shade200,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  isBn ? 'অর্ডার সম্পন্ন করুন' : 'Complete Order', 
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _methodTile(BuildContext context, String displayLabel, String key, IconData icon, bool isBn) {
    final isSel = _selectedMethod == key;
    const primaryOrange = Color(0xFFFF6D00);
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedMethod = key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSel ? primaryOrange : context.inputBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSel ? primaryOrange : context.borderColor),
            boxShadow: isSel ? [BoxShadow(color: primaryOrange.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))] : [],
          ),
          child: Column(
            children: [
              Icon(icon, color: isSel ? Colors.white : context.textSecondary, size: 24),
              const SizedBox(height: 6),
              Text(
                displayLabel,
                style: TextStyle(
                  color: isSel ? Colors.white : context.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

}


// ─────────────────────────────────────────────────────────────────
// NOTIFICATIONS DIALOG
// ─────────────────────────────────────────────────────────────────
class NotificationListDialog extends StatelessWidget {
  const NotificationListDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final primaryOrange = const Color(0xFFFF6D00);
    final notifications = [{'title': isBn ? 'রান্নাঘরের অর্ডার তৈরি' : 'Kitchen Order Ready', 'subtitle': isBn ? 'টেবিল T-02 এর অর্ডার পরিবেশনের জন্য তৈরি' : 'Table T-02 order is ready to serve', 'time': isBn ? '২ মিনিট আগে' : '2 mins ago'}, {'title': isBn ? 'বিল অনুরোধ' : 'Bill Requested', 'subtitle': isBn ? 'টেবিল T-05 বিল প্রিন্টের অনুরোধ করেছে' : 'Table T-05 requested bill print', 'time': isBn ? '৫ মিনিট আগে' : '5 mins ago'}, {'title': isBn ? 'নতুন ডেলিভারি অর্ডার' : 'New Delivery Order', 'subtitle': isBn ? 'অর্ডার #ORD-9812 ডেলিভারির মাধ্যমে' : 'Order #ORD-9812 via Delivery', 'time': isBn ? '১২ মিনিট আগে' : '12 mins ago'}];
    return AlertDialog(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)), title: Row(children: [Icon(Icons.notifications_rounded, color: primaryOrange), const SizedBox(width: 12), Expanded(child: Text(isBn ? 'বিজ্ঞপ্তি' : 'Notifications', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)))]), content: SizedBox(width: 360, child: Column(mainAxisSize: MainAxisSize.min, children: notifications.map<Widget>((n) { return ListTile(contentPadding: EdgeInsets.zero, leading: CircleAvatar(backgroundColor: primaryOrange.withValues(alpha: 0.1), child: Icon(Icons.notifications_active, color: primaryOrange, size: 18)), title: Text(n['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)), subtitle: Text(n['subtitle']!, style: const TextStyle(fontSize: 11)), trailing: Text(n['time']!, style: const TextStyle(fontSize: 10, color: Colors.grey))); }).toList())), actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('close', locale)))]);
  }
}

// ─────────────────────────────────────────────────────────────────
// BARCODE SCANNER DIALOG
// ─────────────────────────────────────────────────────────────────
class BarcodeScannerDialog extends StatelessWidget {
  const BarcodeScannerDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final primaryOrange = const Color(0xFFFF6D00);
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(isBn ? 'স্ক্যানার সক্রিয়' : 'Scanner Active', style: const TextStyle(fontWeight: FontWeight.bold)),
      content: SizedBox(
        width: 300,
        height: 240,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(border: Border.all(color: primaryOrange, width: 3), borderRadius: BorderRadius.circular(16)),
              child: Icon(Icons.qr_code_scanner, size: 80, color: primaryOrange),
            ),
            const SizedBox(height: 16),
            Text(isBn ? 'ক্যামেরাটি QR / বারকোডের দিকে ধরুন' : 'Point camera at QR / Barcode', style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('close', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// COUPON DIALOG
// ─────────────────────────────────────────────────────────────────
class CouponDialog extends StatelessWidget {
  const CouponDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);
    final controller = TextEditingController();

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.local_offer_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(AppStrings.get('coupon', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18))),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: locale == 'bn' ? 'কুপন কোড' : 'Coupon Code',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  if (provider.applyCoupon(controller.text)) {
                    Navigator.of(context).pop();
                  }
                },
                child: Text(locale == 'bn' ? 'প্রয়োগ' : 'Apply'),
              ),
            ],
          ),
        ],
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('close', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DISCOUNT DIALOG
// ─────────────────────────────────────────────────────────────────
class DiscountDialog extends StatelessWidget {
  const DiscountDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    const primaryOrange = Color(0xFFFF6D00);

    return AlertDialog(
      backgroundColor: context.cardBg,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(Icons.percent_rounded, color: primaryOrange),
          const SizedBox(width: 10),
          Text(AppStrings.get('discount', locale), style: const TextStyle(fontWeight: FontWeight.w800)),
        ],
      ),
      content: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [5, 10, 15, 20, 25, 50].map((p) => InkWell(
          onTap: () {
            provider.applyDiscount(percent: p.toDouble());
            Navigator.of(context).pop();
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: 70,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: primaryOrange.withValues(alpha: 0.3)),
            ),
            child: Text(
              '${NumberUtils.toLocalized(p, locale)}%',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w900, color: primaryOrange, fontSize: 16),
            ),
          ),
        )).toList(),
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PROMO DIALOG
// ─────────────────────────────────────────────────────────────────
class PromoDialog extends StatelessWidget {
  const PromoDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('promo', locale), style: const TextStyle(fontWeight: FontWeight.bold)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome, size: 48, color: Colors.orange.shade300),
          const SizedBox(height: 16),
          Text(isBn ? 'এই মুহূর্তে কোনো সক্রিয় প্রোমো নেই।' : 'No active promos available right now.', textAlign: TextAlign.center),
        ],
      ),
      actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('close', locale)))],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// NOTE DIALOG
// ─────────────────────────────────────────────────────────────────
class NoteDialog extends StatelessWidget {
  final bool isKitchenNote;
  const NoteDialog({super.key, required this.isKitchenNote});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final controller = TextEditingController(text: isKitchenNote ? provider.kitchenNote : provider.orderNote);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(isKitchenNote ? AppStrings.get('kitchen_note', locale) : AppStrings.get('note', locale), style: const TextStyle(fontWeight: FontWeight.bold)),
      content: TextField(
        controller: controller,
        maxLines: 4,
        decoration: InputDecoration(
          hintText: isBn ? 'এখানে নোট লিখুন...' : 'Write note here...',
          filled: true,
          fillColor: context.inputBg,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: context.borderColor)),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale))),
        ElevatedButton(
          onPressed: () {
            if (isKitchenNote) {
              provider.setKitchenNote(controller.text);
            } else {
              provider.setOrderNote(controller.text);
            }
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFFF6D00), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
          child: Text(AppStrings.get('save', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CUSTOM ITEM DIALOG
// ─────────────────────────────────────────────────────────────────
class CustomItemDialog extends StatelessWidget {
  const CustomItemDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    const primaryOrange = Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(AppStrings.get('add_custom_item', locale), style: const TextStyle(fontWeight: FontWeight.bold)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(decoration: InputDecoration(labelText: AppStrings.get('item_name', locale), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
          const SizedBox(height: 12),
          TextField(keyboardType: TextInputType.number, decoration: InputDecoration(labelText: AppStrings.get('price', locale), prefixText: '৳ ', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale))),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          style: ElevatedButton.styleFrom(backgroundColor: primaryOrange, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
          child: Text(AppStrings.get('add_to_cart', locale)),
        ),
      ],
    );
  }
}


// ─────────────────────────────────────────────────────────────────
// BILL PRINT DIALOG (Professional Thermal Receipt)
// ─────────────────────────────────────────────────────────────────
class BillPrintDialog extends StatelessWidget {
  const BillPrintDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    const primaryOrange = Color(0xFFFF6D00);

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: 400,
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: primaryOrange.withValues(alpha: 0.1),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.receipt_long_rounded, color: primaryOrange),
                    const SizedBox(width: 10),
                    Text(
                      AppStrings.get('bill_print', locale),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: primaryOrange),
                    ),
                  ],
                ),
              ),
            ),
            
            // Receipt Body (Paper Effect)
            Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.isDark ? Colors.grey.shade900 : Colors.white,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  Text(AppStrings.get('app_name', locale), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
                  Text(isBn ? 'বনানী শাখা, ঢাকা' : 'Banani Branch, Dhaka', style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 10),
                  const Text('------------------------------------------', style: TextStyle(color: Colors.grey)),
                  
                  _receiptInfoRow(AppStrings.get('table', locale), NumberUtils.toLocalized(provider.tableNumber, locale), isBn),
                  _receiptInfoRow(AppStrings.get('waiter', locale), AppStrings.get(provider.waiterKey, locale), isBn),
                  _receiptInfoRow(isBn ? 'তারিখ' : 'Date', NumberUtils.toLocalized(DateTime.now().toString().substring(0, 16), locale), isBn),
                  
                  const Text('------------------------------------------', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 10),
                  
                  // Items Header
                  Row(
                    children: [
                      Expanded(child: Text(isBn ? 'আইটেম' : 'Item', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
                      Text(isBn ? 'পরিমাণ' : 'Qty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(width: 20),
                      Text(isBn ? 'মূল্য' : 'Price', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  
                  // Cart Items
                  ...provider.cartItems.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.menuItem.localizedName(locale), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                              if (item.modifiers.isNotEmpty)
                                Text(
                                  item.modifiers.map((m) => AppStrings.get(m, locale)).join(', '),
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                            ],
                          ),
                        ),
                        Text(NumberUtils.toLocalized(item.quantity, locale), style: const TextStyle(fontSize: 12)),
                        const SizedBox(width: 20),
                        Text('৳${NumberUtils.toLocalized(item.totalPrice.toStringAsFixed(2), locale)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )),
                  
                  const SizedBox(height: 10),
                  const Text('------------------------------------------', style: TextStyle(color: Colors.grey)),
                  
                  _receiptPriceRow(AppStrings.get('subtotal', locale), '৳${NumberUtils.toLocalized(provider.subtotal.toStringAsFixed(2), locale)}', false),
                  _receiptPriceRow(AppStrings.get('tax', locale), '৳${NumberUtils.toLocalized(provider.tax.toStringAsFixed(2), locale)}', false),
                  _receiptPriceRow(AppStrings.get('total_payable', locale), '৳${NumberUtils.toLocalized(provider.totalPayable.toStringAsFixed(2), locale)}', true),
                  
                  const SizedBox(height: 20),
                  // QR Code Placeholder
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.qr_code_2, size: 60, color: Colors.black54),
                  ),
                  const SizedBox(height: 10),
                  Text(isBn ? 'আসার জন্য ধন্যবাদ!' : 'Thank you for visiting!', style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
                ],
              ),
            ),
            
            // Buttons
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(AppStrings.get('cancel', locale)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isBn ? 'রসিদ প্রিন্ট হচ্ছে...' : 'Printing receipt...'), backgroundColor: primaryOrange));
                      },
                      icon: const Icon(Icons.print, size: 18),
                      label: Text(isBn ? 'প্রিন্ট করুন' : 'Print Now'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryOrange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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

  Widget _receiptInfoRow(String label, String value, bool isBn) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
          Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _receiptPriceRow(String label, String value, bool isTotal) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: isTotal ? 14 : 12, fontWeight: isTotal ? FontWeight.w900 : FontWeight.bold)),
          Text(value, style: TextStyle(fontSize: isTotal ? 16 : 12, fontWeight: isTotal ? FontWeight.w900 : FontWeight.bold)),
        ],
      ),
    );
  }
}




// ─────────────────────────────────────────────────────────────────
// ITEM CUSTOMIZATION DIALOG
// ─────────────────────────────────────────────────────────────────
class ItemCustomizationDialog extends StatefulWidget {
  final MenuItem item;
  const ItemCustomizationDialog({super.key, required this.item});

  @override
  State<ItemCustomizationDialog> createState() => _ItemCustomizationDialogState();
}

class _ItemCustomizationDialogState extends State<ItemCustomizationDialog> {
  final Map<int, Set<int>> _selectedOptions = {};
  final TextEditingController _noteController = TextEditingController();

  @override
  void initState() { super.initState(); if (widget.item.modifierGroups != null) { for (int i = 0; i < widget.item.modifierGroups!.length; i++) { if (!widget.item.modifierGroups![i].multiSelect) { _selectedOptions[i] = {0}; } else { _selectedOptions[i] = {}; } } } }

  double get _extraPrice { double total = 0; if (widget.item.modifierGroups == null) return 0; _selectedOptions.forEach((groupIndex, optionIndices) { for (var optIndex in optionIndices) { total += widget.item.modifierGroups![groupIndex].options[optIndex].extraPrice; } }); return total; }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    const primaryOrange = Color(0xFFFF6D00);
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(children: [Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)), child: const Icon(Icons.tune_rounded, color: primaryOrange)), const SizedBox(width: 12), Expanded(child: Text(AppStrings.get('customize_item', locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)))]),
      content: SizedBox(
        width: 400,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.network(widget.item.imageUrl, width: 60, height: 60, fit: BoxFit.cover)), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(widget.item.localizedName(locale), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)), Text('৳${NumberUtils.toLocalized(widget.item.price.toStringAsFixed(2), locale)}', style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w600))]))]),
              const SizedBox(height: 20),
              if (widget.item.modifierGroups != null) ...widget.item.modifierGroups!.asMap().entries.map((entry) {
                final groupIndex = entry.key;
                final group = entry.value;
                return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(AppStrings.get(group.titleKey, locale), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)), const SizedBox(height: 8), Wrap(spacing: 8, children: group.options.asMap().entries.map((optEntry) { final optIndex = optEntry.key; final opt = optEntry.value; final isSelected = _selectedOptions[groupIndex]?.contains(optIndex) ?? false; return ChoiceChip(label: Text('${AppStrings.get(opt.nameKey, locale)}${opt.extraPrice > 0 ? " (+৳${NumberUtils.toLocalized(opt.extraPrice.toStringAsFixed(2), locale)})" : ""}', style: TextStyle(color: isSelected ? Colors.white : Colors.black87, fontSize: 12)), selected: isSelected, selectedColor: primaryOrange, onSelected: (selected) { setState(() { if (group.multiSelect) { if (selected) { _selectedOptions[groupIndex]!.add(optIndex); } else { _selectedOptions[groupIndex]!.remove(optIndex); } } else { _selectedOptions[groupIndex] = {optIndex}; } }); }); }).toList()), const SizedBox(height: 16)]);
              }),
              Text(AppStrings.get('special_instructions', locale), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 8),
              TextField(controller: _noteController, decoration: InputDecoration(hintText: AppStrings.get('add_instructions_hint', locale), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)), maxLines: 2),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(), child: Text(AppStrings.get('cancel', locale))),
        ElevatedButton(
          onPressed: () {
            final List<String> selectedModifiers = [];
            _selectedOptions.forEach((gIdx, opts) {
              for (var oIdx in opts) {
                final group = widget.item.modifierGroups![gIdx];
                final opt = group.options[oIdx];
                selectedModifiers.add(opt.nameKey);
              }
            });
            Provider.of<POSProvider>(context, listen: false).addToCart(
              widget.item,
              selectedModifiers: selectedModifiers,
              extraPrice: _extraPrice,
              note: _noteController.text,
            );
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(backgroundColor: primaryOrange, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
          child: Text('${AppStrings.get('add_to_cart', locale)} (৳${NumberUtils.toLocalized((widget.item.price + _extraPrice).toStringAsFixed(2), locale)})'),
        ),
      ],
    );
  }
}
