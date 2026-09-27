import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import 'dialogs/grocery_dialogs.dart';

class QuickActionsRow extends StatelessWidget {
  const QuickActionsRow({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    final actions = [
      _Action('price_check', 'F3', Icons.sell_outlined, const Color(0xFF3B82F6), () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GroceryPriceCheckDialog(),
        ));
      }),
      _Action('recent_items', 'F4', Icons.history_rounded, const Color(0xFF8B5CF6), () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider,
          child: GroceryProductListDialog(titleKey: 'recent_items', products: provider.recentProducts),
        ));
      }),
      _Action('stock_check', 'F5', Icons.inventory_2_outlined, const Color(0xFFF59E0B), () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider,
          child: GroceryProductListDialog(titleKey: 'stock_check', products: provider.lowStockProducts, showStock: true),
        ));
      }),
      _Action('offers', 'F6', Icons.local_offer_outlined, const Color(0xFFEF4444), () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider,
          child: GroceryProductListDialog(titleKey: 'offers', products: provider.offerProducts, showOffer: true),
        ));
      }),
      _Action('hold_bill', 'F7', Icons.pause_circle_outline_rounded, GroceryColors.primary, () {
        if (!gRequireCart(context)) return;
        final ok = provider.holdCurrentBill();
        if (ok) gSnack(context, AppStrings.get('g_bill_held', locale));
      }),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final spacing = 10.0;
          final count = actions.length;
          final itemWidth = (constraints.maxWidth - spacing * (count - 1)) / count;

          return Row(
            children: [
              for (int i = 0; i < actions.length; i++) ...[
                if (i > 0) SizedBox(width: spacing),
                SizedBox(
                  width: itemWidth,
                  child: _QuickActionCard(action: actions[i], locale: locale, isDark: isDark),
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _Action {
  final String key;
  final String shortcut;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _Action(this.key, this.shortcut, this.icon, this.color, this.onTap);
}

class _QuickActionCard extends StatefulWidget {
  final _Action action;
  final String locale;
  final bool isDark;
  const _QuickActionCard({required this.action, required this.locale, required this.isDark});

  @override
  State<_QuickActionCard> createState() => _QuickActionCardState();
}

class _QuickActionCardState extends State<_QuickActionCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final a = widget.action;
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      onTap: a.onTap,
      child: AnimatedScale(
        scale: _pressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
          decoration: BoxDecoration(
            color: widget.isDark ? GroceryColors.inputBg(true) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: GroceryColors.border(widget.isDark)),
            boxShadow: GroceryColors.elevatedShadow(widget.isDark),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: a.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(a.icon, size: 18, color: a.color),
              ),
              const SizedBox(height: 6),
              Text(
                AppStrings.get(a.key, widget.locale),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: GroceryColors.textPrimary(widget.isDark)),
              ),
              Text(a.shortcut, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: GroceryColors.textSecondary(widget.isDark))),
            ],
          ),
        ),
      ),
    );
  }
}
