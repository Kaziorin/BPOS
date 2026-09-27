import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import 'dialogs/grocery_dialogs.dart';

class FooterActionBar extends StatelessWidget {
  const FooterActionBar({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.read<GroceryProvider>();

    final actions = [
      _FooterAction('sales_history', 'F8', Icons.receipt_long_rounded, const Color(0xFF3B82F6), () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GrocerySalesHistoryDialog(),
        ));
      }),
      _FooterAction('open_drawer', 'F9', Icons.point_of_sale_rounded, const Color(0xFFF59E0B), () {
        gSnack(context, AppStrings.get('g_drawer_opened', locale), color: const Color(0xFFF59E0B));
      }),
      _FooterAction('add_customer', 'F10', Icons.person_add_alt_1_rounded, const Color(0xFF8B5CF6), () {
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GroceryCustomerDialog(),
        ));
      }),
      _FooterAction('clear_cart_btn', 'F11', Icons.delete_outline_rounded, const Color(0xFFEF4444), () async {
        if (!gRequireCart(context)) return;
        if (await gConfirmClearCart(context)) {
          if (!context.mounted) return;
          provider.clearCart();
          gSnack(context, AppStrings.get('clear_all', locale), color: const Color(0xFFEF4444));
        }
      }),
      _FooterAction('save_print', 'F12', Icons.print_rounded, GroceryColors.primary, () {
        if (!gRequireCart(context)) return;
        showDialog(context: context, builder: (_) => ChangeNotifierProvider.value(
          value: provider, child: const GroceryBillPrintDialog(),
        ));
      }),
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: GroceryColors.border(isDark)),
        boxShadow: GroceryColors.elevatedShadow(isDark),
      ),
      child: Row(
        children: [
          for (int i = 0; i < actions.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(child: _FooterBtn(action: actions[i], locale: locale, isDark: isDark)),
          ],
        ],
      ),
    );
  }
}

class _FooterAction {
  final String key;
  final String shortcut;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _FooterAction(this.key, this.shortcut, this.icon, this.color, this.onTap);
}

class _FooterBtn extends StatefulWidget {
  final _FooterAction action;
  final String locale;
  final bool isDark;
  const _FooterBtn({required this.action, required this.locale, required this.isDark});

  @override
  State<_FooterBtn> createState() => _FooterBtnState();
}

class _FooterBtnState extends State<_FooterBtn> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final a = widget.action;
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: a.onTap,
      child: AnimatedScale(
        scale: _down ? 0.96 : 1,
        duration: const Duration(milliseconds: 100),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: a.color.withValues(alpha: widget.isDark ? 0.15 : 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(a.icon, size: 18, color: a.color),
              const SizedBox(height: 3),
              Text(
                AppStrings.get(a.key, widget.locale),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: GroceryColors.textPrimary(widget.isDark)),
              ),
              Text(a.shortcut, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w600, color: GroceryColors.textSecondary(widget.isDark))),
            ],
          ),
        ),
      ),
    );
  }
}
