import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';

class SummaryStatsBar extends StatelessWidget {
  const SummaryStatsBar({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final p = context.watch<GroceryProvider>();

    final stats = [
      _Stat(Icons.shopping_bag_outlined, 'total_items',
          NumberUtils.toLocalized(p.totalItems, locale), const Color(0xFF3B82F6)),
      _Stat(Icons.tag_rounded, 'total_qty',
          NumberUtils.toLocalized(p.totalQty, locale), const Color(0xFF8B5CF6)),
      _Stat(Icons.receipt_outlined, 'subtotal',
          '${AppStrings.currency} ${NumberUtils.toLocalized(p.subtotal.toStringAsFixed(2), locale)}',
          GroceryColors.primary),
      _Stat(Icons.percent_rounded, 'discount_label',
          '${AppStrings.currency} ${NumberUtils.toLocalized(p.totalDiscount.toStringAsFixed(2), locale)}',
          const Color(0xFFEF4444)),
      _Stat(Icons.savings_outlined, 'total_savings',
          '${AppStrings.currency} ${NumberUtils.toLocalized(p.totalSavings.toStringAsFixed(2), locale)}',
          const Color(0xFFF59E0B)),
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: GroceryColors.border(isDark)),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Row(
        children: [
          for (int i = 0; i < stats.length; i++) ...[
            if (i > 0)
              Container(
                width: 1,
                height: 28,
                color: GroceryColors.border(isDark),
                margin: const EdgeInsets.symmetric(horizontal: 4),
              ),
            Expanded(
              child: _StatItem(stat: stats[i], locale: locale, isDark: isDark),
            ),
          ],
        ],
      ),
    );
  }
}

class _Stat {
  final IconData icon;
  final String labelKey;
  final String value;
  final Color color;
  const _Stat(this.icon, this.labelKey, this.value, this.color);
}

class _StatItem extends StatelessWidget {
  final _Stat stat;
  final String locale;
  final bool isDark;
  const _StatItem({required this.stat, required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(stat.icon, size: 14, color: stat.color),
        const SizedBox(height: 2),
        Text(
          AppStrings.get(stat.labelKey, locale),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.w600,
            color: GroceryColors.textSecondary(isDark),
          ),
        ),
        Text(
          stat.value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: GroceryColors.textPrimary(isDark),
          ),
        ),
      ],
    );
  }
}
