import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';

// ─────────────────────────────────────────────────────────────────
// CUSTOMER DIALOG
// ─────────────────────────────────────────────────────────────────
class WCustomerDialog extends StatelessWidget {
  const WCustomerDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440, maxHeight: 520),
        child: Padding(
          padding: const EdgeInsets.all(0),
          child: Column(
            children: [
              // Header
              _DialogHeader(
                title: 'Select Customer',
                icon: Icons.people_rounded,
                isDark: isDark,
              ),
              // Search
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                child: _SearchField(isDark: isDark),
              ),
              // Customer list
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: w.customers.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (_, i) => _CustomerCard(
                    customer: w.customers[i],
                    isSelected: w.customers[i].id == w.customer.id,
                    isDark: isDark,
                    onTap: () {
                      w.selectCustomer(w.customers[i]);
                      Navigator.pop(context);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  final bool isDark;
  const _SearchField({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: WholesalerColors.inputBg(isDark),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: WholesalerColors.border(isDark)),
      ),
      child: Row(
        children: [
          const SizedBox(width: 10),
          Icon(Icons.search_rounded, size: 16,
              color: WholesalerColors.textSecondary(isDark)),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              style: TextStyle(fontSize: 13, color: WholesalerColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: 'Search customer name or ID...',
                hintStyle: TextStyle(fontSize: 12, color: WholesalerColors.textSecondary(isDark)),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CustomerCard extends StatelessWidget {
  final WCustomer customer;
  final bool isSelected;
  final bool isDark;
  final VoidCallback onTap;
  const _CustomerCard({
    required this.customer,
    required this.isSelected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tierColor = switch (customer.tier) {
      WCustomerTier.platinum => WholesalerColors.accentOrange,
      WCustomerTier.gold => const Color(0xFFFFD700),
      WCustomerTier.silver => Colors.grey.shade400,
      WCustomerTier.regular => WholesalerColors.accentBlue,
    };
    final fmt = NumberFormat('#,##0.00');

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected
              ? WholesalerColors.primary.withValues(alpha: isDark ? 0.2 : 0.08)
              : (isDark ? WholesalerColors.inputBg(true) : WholesalerColors.panelBg(false)),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? WholesalerColors.primary
                : WholesalerColors.border(isDark),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: tierColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.business_rounded, size: 16, color: tierColor),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(customer.name,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: WholesalerColors.textPrimary(isDark),
                          )),
                      Text('${customer.customerId}  •  ${customer.phone}',
                          style: TextStyle(
                            fontSize: 10,
                            color: WholesalerColors.textSecondary(isDark),
                          )),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: tierColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(7),
                    border: Border.all(color: tierColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(customer.tierLabel,
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: tierColor,
                      )),
                ),
              ],
            ),
            if (customer.creditLimit > 0) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  _MiniCredit(label: 'Limit', value: '৳${fmt.format(customer.creditLimit)}',
                      color: WholesalerColors.textSecondary(isDark), isDark: isDark),
                  const SizedBox(width: 6),
                  _MiniCredit(label: 'Available', value: '৳${fmt.format(customer.availableCredit)}',
                      color: WholesalerColors.accentGreen, isDark: isDark),
                  const SizedBox(width: 6),
                  _MiniCredit(label: 'Outstanding', value: '৳${fmt.format(customer.outstanding)}',
                      color: WholesalerColors.accentRed, isDark: isDark),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MiniCredit extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isDark;
  const _MiniCredit({required this.label, required this.value, required this.color, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 8, color: WholesalerColors.textSecondary(isDark))),
            Text(value, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: color)),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// HOLD ORDER DIALOG
// ─────────────────────────────────────────────────────────────────
class WHoldOrderDialog extends StatefulWidget {
  const WHoldOrderDialog({super.key});

  @override
  State<WHoldOrderDialog> createState() => _WHoldOrderDialogState();
}

class _WHoldOrderDialogState extends State<WHoldOrderDialog> {
  final _noteCtrl = TextEditingController();

  @override
  void dispose() { _noteCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.read<WholesalerProvider>();

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 380),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: WholesalerColors.accentOrange.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.pause_circle_filled_rounded, size: 32,
                    color: WholesalerColors.accentOrange),
              ),
              const SizedBox(height: 14),
              Text('Hold This Order?',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: WholesalerColors.textPrimary(isDark),
                  )),
              const SizedBox(height: 6),
              Text('The order will be saved and can be recalled later.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: WholesalerColors.textSecondary(isDark),
                  )),
              const SizedBox(height: 16),
              TextField(
                controller: _noteCtrl,
                style: TextStyle(fontSize: 13, color: WholesalerColors.textPrimary(isDark)),
                decoration: InputDecoration(
                  hintText: 'Add a note (optional)',
                  hintStyle: TextStyle(color: WholesalerColors.textSecondary(isDark)),
                  filled: true,
                  fillColor: WholesalerColors.inputBg(isDark),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: WholesalerColors.border(isDark)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: WholesalerColors.border(isDark)),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: WholesalerColors.border(isDark)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text('Cancel',
                          style: TextStyle(color: WholesalerColors.textPrimary(isDark))),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        w.holdCurrentOrder(_noteCtrl.text);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: const Text('✅ Order held successfully'),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: WholesalerColors.accentGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: WholesalerColors.accentOrange,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Hold Order',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// RECENT ORDERS DIALOG
// ─────────────────────────────────────────────────────────────────
class WRecentOrdersDialog extends StatelessWidget {
  const WRecentOrdersDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 500),
        child: Column(
          children: [
            _DialogHeader(title: 'Held Orders / Recent', icon: Icons.history_rounded, isDark: isDark),
            Expanded(
              child: w.heldOrders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_rounded, size: 40,
                              color: WholesalerColors.textSecondary(isDark)),
                          const SizedBox(height: 10),
                          Text('No held orders',
                              style: TextStyle(
                                color: WholesalerColors.textSecondary(isDark),
                                fontWeight: FontWeight.w600,
                              )),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: w.heldOrders.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final o = w.heldOrders[i];
                        return ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: WholesalerColors.border(isDark)),
                          ),
                          tileColor: isDark ? WholesalerColors.inputBg(true) : WholesalerColors.panelBg(false),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: WholesalerColors.accentOrange.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.pause_rounded, size: 18,
                                color: WholesalerColors.accentOrange),
                          ),
                          title: Text(o.id,
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: WholesalerColors.textPrimary(isDark),
                              )),
                          subtitle: Text(
                            '${o.items.length} items${o.note.isNotEmpty ? '  •  ${o.note}' : ''}',
                            style: TextStyle(fontSize: 11, color: WholesalerColors.textSecondary(isDark)),
                          ),
                          trailing: ElevatedButton(
                            onPressed: () {
                              w.recallOrder(o);
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: WholesalerColors.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            ),
                            child: const Text('Recall', style: TextStyle(color: Colors.white, fontSize: 11)),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ORDER CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────
class WOrderConfirmDialog extends StatelessWidget {
  const WOrderConfirmDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final fmt = NumberFormat('#,##0.00');

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: WholesalerColors.primaryGradient,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: WholesalerColors.primary.withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(Icons.local_shipping_rounded,
                    size: 32, color: Colors.white),
              ),
              const SizedBox(height: 16),
              Text('Confirm Order & Dispatch',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: WholesalerColors.textPrimary(isDark),
                  )),
              const SizedBox(height: 6),
              Text('Order will be sent to delivery queue.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: WholesalerColors.textSecondary(isDark))),
              const SizedBox(height: 16),
              // Summary
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: WholesalerColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: WholesalerColors.primary.withValues(alpha: 0.2)),
                ),
                child: Column(
                  children: [
                    _ConfirmRow('Customer', w.customer.name, isDark),
                    _ConfirmRow('Items', '${w.totalItems} items', isDark),
                    _ConfirmRow('Subtotal', '৳${fmt.format(w.subtotal)}', isDark),
                    _ConfirmRow('Discount', '-৳${fmt.format(w.discountFlat)}', isDark),
                    _ConfirmRow('Tax', '৳${fmt.format(w.taxAmount)}', isDark),
                    _ConfirmRow('Shipping', '৳${fmt.format(w.shippingCost)}', isDark),
                    const Divider(height: 12),
                    Row(
                      children: [
                        Text('Total',
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700,
                              color: WholesalerColors.textPrimary(isDark),
                            )),
                        const Spacer(),
                        Text('৳${fmt.format(w.grandTotal)}',
                            style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w900,
                              color: WholesalerColors.primary,
                            )),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: WholesalerColors.border(isDark)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text('Cancel',
                          style: TextStyle(color: WholesalerColors.textPrimary(isDark))),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        w.clearOrder();
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: const Text('🚚 Order dispatched successfully!'),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: WholesalerColors.accentGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ));
                      },
                      icon: const Icon(Icons.local_shipping_rounded, size: 16, color: Colors.white),
                      label: const Text('Dispatch Now',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: WholesalerColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  const _ConfirmRow(this.label, this.value, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(label,
              style: TextStyle(fontSize: 11, color: WholesalerColors.textSecondary(isDark))),
          const Spacer(),
          Text(value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: WholesalerColors.textPrimary(isDark),
              )),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SHARED: Dialog Header
// ─────────────────────────────────────────────────────────────────
class _DialogHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isDark;
  const _DialogHeader({required this.title, required this.icon, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 10, 14),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: WholesalerColors.border(isDark))),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: WholesalerColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: WholesalerColors.textPrimary(isDark),
                )),
          ),
          IconButton(
            icon: Icon(Icons.close_rounded,
                color: WholesalerColors.textSecondary(isDark)),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}
