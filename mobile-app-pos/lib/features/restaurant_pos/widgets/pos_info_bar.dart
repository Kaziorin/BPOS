import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/theme/theme_extensions.dart';
import '../../../core/utils/number_utils.dart';
import 'dialogs/pos_dialogs.dart';

class POSInfoBar extends StatelessWidget {
  const POSInfoBar({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;
    final isTablet = screenWidth >= 768 && screenWidth < 1100;
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        if (isMobile) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _InfoCard(
                      icon: Icons.groups_outlined,
                      label: AppStrings.get('table', locale),
                      value: NumberUtils.toLocalized(provider.tableNumber, locale),
                      hasDropdown: true,
                      isMobile: true,
                      onTap: () {
                        showDialog(context: context, builder: (_) => const TableSelectionDialog());
                      },
                    ),
                    const SizedBox(width: 6),
                    _GuestsCard(isMobile: true, locale: locale),
                  ],
                ),
                _ActionButtons(isMobile: true, isTablet: isTablet, locale: locale),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(
            children: [
              _InfoCard(
                icon: Icons.groups_outlined,
                label: AppStrings.get('table', locale),
                value: NumberUtils.toLocalized(provider.tableNumber, locale),
                hasDropdown: true,
                isMobile: false,
                onTap: () {
                  showDialog(context: context, builder: (_) => const TableSelectionDialog());
                },
              ),
              const SizedBox(width: 16),
              _GuestsCard(isMobile: false, locale: locale),
              const SizedBox(width: 16),
              _InfoCard(
                icon: Icons.person_outline,
                label: AppStrings.get('waiter', locale),
                value: AppStrings.get(provider.waiterKey, locale),
                hasDropdown: true,
                isMobile: false,
                onTap: () {
                  showDialog(context: context, builder: (_) => const WaiterSelectionDialog());
                },
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Align(
                  alignment: Alignment.centerRight,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: _ActionButtons(isMobile: false, isTablet: isTablet, locale: locale),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// INFO CARD
// ─────────────────────────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool hasDropdown;
  final bool isMobile;
  final VoidCallback onTap;

  const _InfoCard({
    required this.icon,
    required this.label,
    required this.value,
    this.hasDropdown = false,
    this.isMobile = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: isMobile ? 7 : 16, vertical: isMobile ? 4 : 10),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(8),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.02), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: isMobile ? 15 : 26, color: context.textPrimary),
            SizedBox(width: isMobile ? 5 : 12),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: isMobile ? 8.5 : 11, color: context.textSecondary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 1),
                Text(
                  value,
                  style: TextStyle(fontSize: isMobile ? 12 : 16, color: context.textPrimary, fontWeight: FontWeight.w800, height: 1.1),
                ),
              ],
            ),
            if (hasDropdown) ...[
              SizedBox(width: isMobile ? 6 : 20),
              Icon(Icons.keyboard_arrow_down, size: isMobile ? 13 : 18, color: context.textPrimary),
            ],
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GUESTS CARD
// ─────────────────────────────────────────────────────────────────
class _GuestsCard extends StatelessWidget {
  final bool isMobile;
  final String locale;
  const _GuestsCard({this.isMobile = false, required this.locale});

  @override
  Widget build(BuildContext context) {
    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Container(
          padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : 14, vertical: isMobile ? 6 : 10),
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.02), blurRadius: 4, offset: const Offset(0, 2)),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.people_outline, size: isMobile ? 18 : 24, color: context.textPrimary),
              SizedBox(width: isMobile ? 6 : 10),
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppStrings.get('guests', locale),
                    style: TextStyle(fontSize: isMobile ? 9 : 11, color: context.textSecondary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    NumberUtils.toLocalized(provider.guests, locale),
                    style: TextStyle(fontSize: isMobile ? 13 : 16, color: context.textPrimary, fontWeight: FontWeight.w800, height: 1.1),
                  ),
                ],
              ),
              SizedBox(width: isMobile ? 8 : 12),
              GestureDetector(
                onTap: provider.decrementGuests,
                behavior: HitTestBehavior.opaque,
                child: Container(
                  width: isMobile ? 22 : 26,
                  height: isMobile ? 22 : 26,
                  decoration: BoxDecoration(border: Border.all(color: context.borderColor, width: 1.5), borderRadius: BorderRadius.circular(5)),
                  child: Icon(Icons.remove, size: isMobile ? 12 : 16, color: context.textPrimary),
                ),
              ),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: provider.incrementGuests,
                behavior: HitTestBehavior.opaque,
                child: Container(
                  width: isMobile ? 22 : 26,
                  height: isMobile ? 22 : 26,
                  decoration: BoxDecoration(border: Border.all(color: context.borderColor, width: 1.5), borderRadius: BorderRadius.circular(5)),
                  child: Icon(Icons.add, size: isMobile ? 12 : 16, color: context.textPrimary),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ACTION BUTTONS
// ─────────────────────────────────────────────────────────────────
class _ActionButtons extends StatelessWidget {
  final bool isMobile;
  final bool isTablet;
  final String locale;

  const _ActionButtons({this.isMobile = false, this.isTablet = false, required this.locale});

  @override
  Widget build(BuildContext context) {
    final buttons = [
      {'label': AppStrings.get('hold', locale), 'action': 'Hold', 'icon': Icons.pause, 'color': const Color(0xFFFF7043)},
      {'label': AppStrings.get('recall', locale), 'action': 'Recall', 'icon': Icons.restore, 'color': const Color(0xFF7E57C2)},
      {'label': AppStrings.get('split', locale), 'action': 'Split', 'icon': Icons.data_array, 'color': const Color(0xFF42A5F5)},
      {'label': AppStrings.get('transfer', locale), 'action': 'Transfer', 'icon': Icons.sync_alt, 'color': const Color(0xFF66BB6A)},
      {'label': AppStrings.get('clear_order', locale), 'action': 'Clear Order', 'icon': Icons.delete_outline, 'color': const Color(0xFFEF5350)},
    ];

    final visibleButtons = isMobile ? buttons.sublist(0, 2) : (isTablet ? buttons.sublist(0, 3) : buttons);

    return Row(
      children: visibleButtons.map((btn) {
        return _ActionButton(
          label: btn['label'] as String,
          actionName: btn['action'] as String,
          icon: btn['icon'] as IconData,
          color: btn['color'] as Color,
          isMobile: isMobile,
          isTablet: isTablet,
        );
      }).toList(),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final String actionName;
  final IconData icon;
  final Color color;
  final bool isMobile;
  final bool isTablet;

  const _ActionButton({
    required this.label,
    required this.actionName,
    required this.icon,
    required this.color,
    required this.isMobile,
    required this.isTablet,
  });

  void _handleTap(BuildContext context) {
    final provider = Provider.of<POSProvider>(context, listen: false);

    switch (actionName) {
      case 'Hold':
        if (provider.cartItems.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty. Add items to hold order.'), backgroundColor: Colors.orange));
        } else {
          final held = provider.holdCurrentOrder();
          if (held) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order saved to Held Orders!'), backgroundColor: Color(0xFFFF7043)));
          }
        }
        break;
      case 'Recall':
        showDialog(context: context, builder: (_) => const HeldOrdersDialog());
        break;
      case 'Split':
        if (provider.cartItems.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty. Add items to split bill.'), backgroundColor: Colors.orange));
        } else {
          showDialog(context: context, builder: (_) => const SplitBillDialog());
        }
        break;
      case 'Transfer':
        showDialog(context: context, builder: (_) => const TransferOrderDialog());
        break;
      case 'Clear Order':
        if (provider.cartItems.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is already empty.'), backgroundColor: Colors.grey));
        } else {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              backgroundColor: ctx.cardBg,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: Text('Clear Order?', style: TextStyle(color: ctx.textPrimary)),
              content: Text('Are you sure you want to remove all items from the current order?', style: TextStyle(color: ctx.textSecondary)),
              actions: [
                TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: () {
                    provider.clearCart();
                    Navigator.of(ctx).pop();
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                  child: const Text('Clear All'),
                ),
              ],
            ),
          );
        }
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(left: isMobile ? 5 : 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _handleTap(context),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : (isTablet ? 12 : 16), vertical: isMobile ? 6 : (isTablet ? 8 : 10)),
            decoration: BoxDecoration(
              color: color.withValues(alpha: context.isDark ? 0.1 : 0.04),
              border: Border.all(color: color.withValues(alpha: context.isDark ? 0.4 : 0.2), width: 1.5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: isMobile ? 14 : (isTablet ? 16 : 18), color: color),
                if (!isMobile) ...[
                  const SizedBox(width: 8),
                  Text(label, style: TextStyle(fontSize: isTablet ? 13 : 14, color: color, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
