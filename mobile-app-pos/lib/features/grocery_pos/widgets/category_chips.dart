import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';

class CategoryChips extends StatelessWidget {
  const CategoryChips({super.key});

  static const _categories = [
    ('cat_all', 'All Items', Icons.grid_view_rounded),
    ('cat_fruits', 'Fruits & Veg', Icons.eco_rounded),
    ('cat_grocery', 'Grocery', Icons.shopping_bag_rounded),
    ('cat_beverages', 'Beverages', Icons.local_drink_rounded),
    ('cat_snacks', 'Snacks', Icons.cookie_rounded),
    ('cat_dairy', 'Dairy', Icons.water_drop_rounded),
    ('cat_household', 'Household', Icons.home_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final selected = context.watch<GroceryProvider>().selectedCategory;

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _categories.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          if (index == _categories.length) {
            return _Chip(
              label: AppStrings.get('more', locale),
              icon: Icons.more_horiz_rounded,
              selected: false,
              isDark: isDark,
              onTap: () {
                final provider = context.read<GroceryProvider>();
                showModalBottomSheet(
                  context: context,
                  backgroundColor: GroceryColors.cardBg(isDark),
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  ),
                  builder: (_) => ChangeNotifierProvider.value(
                    value: provider,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(AppStrings.get('category', locale),
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: _categories.map((c) {
                              return ActionChip(
                                avatar: Icon(c.$3, size: 16, color: GroceryColors.primary),
                                label: Text(AppStrings.get(c.$1, locale)),
                                onPressed: () {
                                  provider.setCategory(c.$2);
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
          final cat = _categories[index];
          final key = cat.$1;
          final value = cat.$2;
          final icon = cat.$3;
          final isSelected = selected == value;
          return _Chip(
            label: AppStrings.get(key, locale),
            icon: icon,
            selected: isSelected,
            isDark: isDark,
            onTap: () => context.read<GroceryProvider>().setCategory(value),
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
