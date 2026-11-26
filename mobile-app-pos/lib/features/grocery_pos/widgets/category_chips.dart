import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';

class CategoryChips extends StatelessWidget {
  const CategoryChips({super.key});

  static IconData _iconForCategory(String name) {
    final lower = name.toLowerCase();
    if (lower == 'all items' || lower == 'all') return Icons.grid_view_rounded;
    if (lower.contains('fruit') || lower.contains('veg'))
      return Icons.eco_rounded;
    if (lower.contains('grocery')) return Icons.shopping_bag_rounded;
    if (lower.contains('beverage') || lower.contains('drink'))
      return Icons.local_drink_rounded;
    if (lower.contains('snack')) return Icons.cookie_rounded;
    if (lower.contains('dairy') || lower.contains('milk'))
      return Icons.water_drop_rounded;
    if (lower.contains('household') || lower.contains('clean'))
      return Icons.home_rounded;
    return Icons.category_rounded;
  }

  static String _labelForCategory(String name, String locale) {
    if (name == 'All Items') return AppStrings.get('cat_all', locale);
    return name;
  }

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final provider = context.watch<GroceryProvider>();
    final selected = provider.selectedCategory;
    final categories = provider.categories;

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == categories.length) {
            return _Chip(
              label: AppStrings.get('more', locale),
              icon: Icons.more_horiz_rounded,
              selected: false,
              isDark: isDark,
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  backgroundColor: GroceryColors.cardBg(isDark),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                  ),
                  builder: (_) => ChangeNotifierProvider.value(
                    value: provider,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            AppStrings.get('category', locale),
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: categories.map((cat) {
                              return ActionChip(
                                avatar: Icon(
                                  _iconForCategory(cat),
                                  size: 16,
                                  color: GroceryColors.primary,
                                ),
                                label: Text(_labelForCategory(cat, locale)),
                                onPressed: () {
                                  provider.setCategory(cat);
                                  Navigator.pop(context);
                                },
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          }
          final cat = categories[index];
          final isSelected = selected == cat;
          return _Chip(
            label: _labelForCategory(cat, locale),
            icon: _iconForCategory(cat),
            selected: isSelected,
            isDark: isDark,
            onTap: () => provider.setCategory(cat),
          );
        },
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  const _Chip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          gradient: selected ? GroceryColors.primaryGradient : null,
          color: selected
              ? null
              : (isDark ? GroceryColors.inputBg(true) : Colors.white),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? Colors.transparent : GroceryColors.border(isDark),
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: GroceryColors.primary.withValues(alpha: 0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ]
              : GroceryColors.softShadow(isDark),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: selected ? Colors.white : GroceryColors.primary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected
                    ? Colors.white
                    : GroceryColors.textPrimary(isDark),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
