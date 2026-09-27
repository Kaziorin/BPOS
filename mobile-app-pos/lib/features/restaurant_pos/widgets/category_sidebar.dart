import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/models/menu_item.dart';
import '../../../core/theme/theme_extensions.dart';
import 'dialogs/pos_dialogs.dart';

class CategorySidebar extends StatelessWidget {
  final bool isMobile;
  const CategorySidebar({super.key, this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    final sidebarWidth = isMobile ? 80.0 : 250.0;
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Container(
      width: sidebarWidth,
      padding: EdgeInsets.only(left: isMobile ? 12 : 24, right: isMobile ? 12 : 24, top: 0, bottom: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.03), blurRadius: 8, offset: const Offset(0, 3)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: const BoxDecoration(
                      color: primaryOrange,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.grid_view_rounded, color: Colors.white, size: isMobile ? 16 : 18),
                        if (!isMobile) ...[
                          const SizedBox(width: 8),
                          Text(
                            AppStrings.get('all_items', locale),
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Expanded(
                    child: Consumer<POSProvider>(
                      builder: (context, provider, _) {
                        return ListView.builder(
                          padding: EdgeInsets.symmetric(horizontal: isMobile ? 6 : 10, vertical: 8),
                          itemCount: AppData.categories.length,
                          itemBuilder: (context, index) {
                            final category = AppData.categories[index];
                            final isSelected = provider.selectedCategory == category.id;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: _CategoryItem(
                                category: category,
                                isSelected: isSelected,
                                isMobile: isMobile,
                                onTap: () => provider.selectCategory(category.id),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            height: 48,
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: context.isDark ? 0.1 : 0.04),
              border: Border.all(color: primaryOrange.withValues(alpha: context.isDark ? 0.3 : 0.2), width: 1.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  showDialog(context: context, builder: (_) => CustomItemDialog());
                },
                borderRadius: BorderRadius.circular(12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.soup_kitchen, color: primaryOrange, size: isMobile ? 20 : 22),
                    if (!isMobile) ...[
                      const SizedBox(width: 8),
                      Text(
                        AppStrings.get('custom_item', locale),
                        style: const TextStyle(color: primaryOrange, fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CategoryItem extends StatelessWidget {
  final MenuCategory category;
  final bool isSelected;
  final bool isMobile;
  final VoidCallback onTap;

  const _CategoryItem({
    required this.category,
    required this.isSelected,
    required this.isMobile,
    required this.onTap,
  });

  IconData _getIconForCategory(String name) {
    final lowerName = name.toLowerCase();
    if (lowerName.contains('popular')) return Icons.star_border;
    if (lowerName.contains('starter')) return Icons.soup_kitchen_outlined;
    if (lowerName.contains('main')) return Icons.set_meal_outlined;
    if (lowerName.contains('pizza')) return Icons.local_pizza_outlined;
    if (lowerName.contains('burger')) return Icons.lunch_dining_outlined;
    if (lowerName.contains('pasta')) return Icons.dinner_dining_outlined;
    if (lowerName.contains('rice')) return Icons.rice_bowl_outlined;
    if (lowerName.contains('drink')) return Icons.local_cafe_outlined;
    if (lowerName.contains('dessert')) return Icons.cake_outlined;
    if (lowerName.contains('side')) return Icons.fastfood_outlined;
    if (lowerName.contains('add')) return Icons.add_box_outlined;
    return Icons.restaurant_menu;
  }

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final iconColor = isSelected ? primaryOrange : context.textSecondary;
    final textColor = isSelected ? primaryOrange : context.textPrimary;
    final locale = context.watch<AppProvider>().locale;
    final translatedName = category.localizedName(locale);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: isSelected ? primaryOrange.withValues(alpha: 0.1) : context.inputBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? primaryOrange.withValues(alpha: 0.4) : context.borderColor,
          width: 1.5,
        ),
        boxShadow: isSelected
            ? [BoxShadow(color: primaryOrange.withValues(alpha: 0.12), blurRadius: 8, offset: const Offset(0, 3))]
            : [BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.03), blurRadius: 4, offset: const Offset(0, 2))],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : 16, vertical: 11),
            child: Row(
              mainAxisAlignment: isMobile ? MainAxisAlignment.center : MainAxisAlignment.start,
              children: [
                Icon(_getIconForCategory(category.name), size: 20, color: iconColor),
                if (!isMobile) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      translatedName,
                      style: TextStyle(
                        fontSize: 13,
                        color: textColor,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isSelected) Container(width: 6, height: 6, decoration: const BoxDecoration(color: primaryOrange, shape: BoxShape.circle)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class MobileCategoryBar extends StatelessWidget {
  const MobileCategoryBar({super.key});

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Container(
      height: 52,
      color: context.cardBg,
      child: Consumer<POSProvider>(
        builder: (context, provider, _) {
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: AppData.categories.length,
            itemBuilder: (context, index) {
              final category = AppData.categories[index];
              final isSelected = provider.selectedCategory == category.id;
              final translatedName = category.localizedName(locale);

              return GestureDetector(
                onTap: () => provider.selectCategory(category.id),
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? primaryOrange : context.inputBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? Colors.transparent : context.borderColor,
                    ),
                    boxShadow: [
                      if (isSelected) BoxShadow(color: primaryOrange.withValues(alpha: 0.35), blurRadius: 8, offset: const Offset(0, 3))
                      else BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.04), blurRadius: 6, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      translatedName,
                      style: TextStyle(
                        color: isSelected ? Colors.white : context.textPrimary,
                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                        fontSize: 13,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
