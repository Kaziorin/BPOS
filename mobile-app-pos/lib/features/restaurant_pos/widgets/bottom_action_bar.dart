import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/theme/theme_extensions.dart';
import 'dialogs/pos_dialogs.dart';

class BottomActionBar extends StatelessWidget {
  const BottomActionBar({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final locale = context.watch<AppProvider>().locale;

    final actions = [
      {'label': AppStrings.get('coupon', locale), 'action': 'Coupon', 'icon': Icons.local_offer_outlined},
      {'label': AppStrings.get('discount', locale), 'action': 'Discount', 'icon': Icons.percent},
      {'label': AppStrings.get('promo', locale), 'action': 'Promo', 'icon': Icons.card_giftcard_outlined},
      {'label': AppStrings.get('note', locale), 'action': 'Note', 'icon': Icons.note_alt_outlined},
      {'label': AppStrings.get('kitchen_note', locale), 'action': 'Kitchen Note', 'icon': Icons.kitchen_outlined},
      {'label': AppStrings.get('bill_print', locale), 'action': 'Bill Print', 'icon': Icons.print_outlined},
    ];

    return Container(
      color: Colors.transparent,
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 12 : 24,
        vertical: 8,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isNarrow = constraints.maxWidth < 720;
          if (isNarrow) {
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: actions.asMap().entries.map((entry) {
                  final index = entry.key;
                  final action = entry.value;
                  final isLast = index == actions.length - 1;

                  return Padding(
                    padding: EdgeInsets.only(right: isLast ? 0 : 10),
                    child: SizedBox(
                      width: isMobile ? 60 : 120,
                      child: _BottomActionBtn(
                        icon: action['icon'] as IconData,
                        label: action['label'] as String,
                        isMobile: isMobile,
                        onTap: () => _handleAction(context, action['action'] as String),
                      ),
                    ),
                  );
                }).toList(),
              ),
            );
          }

          return Row(
            children: actions.asMap().entries.map((entry) {
              final index = entry.key;
              final action = entry.value;
              final isLast = index == actions.length - 1;

              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: isLast ? 0 : 12),
                  child: _BottomActionBtn(
                    icon: action['icon'] as IconData,
                    label: action['label'] as String,
                    isMobile: isMobile,
                    onTap: () => _handleAction(context, action['action'] as String),
                  ),
                ),
              );
            }).toList(),
          );
        },
      ),
    );
  }

  void _handleAction(BuildContext context, String action) {
    Widget dialog;
    switch (action) {
      case 'Coupon':
        dialog = CouponDialog();
        break;
      case 'Discount':
        dialog = DiscountDialog();
        break;
      case 'Promo':
        dialog = PromoDialog();
        break;
      case 'Note':
        dialog = NoteDialog(isKitchenNote: false);
        break;
      case 'Kitchen Note':
        dialog = NoteDialog(isKitchenNote: true);
        break;
      case 'Bill Print':
        dialog = BillPrintDialog();
        break;
      default:
        return;
    }

    showDialog(
      context: context,
      builder: (_) => dialog,
    );
  }
}

class _BottomActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isMobile;
  final VoidCallback onTap;

  const _BottomActionBtn({
    required this.icon,
    required this.label,
    this.isMobile = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: isMobile ? 40 : 48,
        decoration: BoxDecoration(
          color: context.isDark ? primaryOrange.withValues(alpha: 0.1) : primaryOrange.withValues(alpha: 0.04),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: primaryOrange.withValues(alpha: context.isDark ? 0.3 : 0.15),
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: isMobile ? 16 : 18,
              color: primaryOrange,
            ),
            if (!isMobile) ...[
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    color: primaryOrange,
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
