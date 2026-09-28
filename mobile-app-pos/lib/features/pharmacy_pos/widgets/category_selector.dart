import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';

class CategorySelector extends StatelessWidget {
  const CategorySelector({super.key});

  static const List<Map<String, dynamic>> _categories = [
    {'name': 'All', 'icon': Icons.grid_view_rounded, 'color': Color(0xFF00897B)},
    {'name': 'Antibiotics', 'icon': Icons.link_rounded, 'color': Colors.deepPurple},
    {'name': 'Pain Relief', 'icon': Icons.water_drop_rounded, 'color': Colors.orange},
    {'name': 'Vitamins & Supplements', 'icon': Icons.eco_rounded, 'color': Colors.green},
    {'name': 'Skin Care', 'icon': Icons.face_retouching_natural_rounded, 'color': Colors.pink},
    {'name': 'Diabetes Care', 'icon': Icons.opacity_rounded, 'color': Colors.blue},
    {'name': 'Cardiovascular', 'icon': Icons.favorite_rounded, 'color': Colors.red},
    {'name': 'Gastrointestinal', 'icon': Icons.restaurant_menu_rounded, 'color': Colors.deepOrange},
    {'name': 'Respiratory', 'icon': Icons.air_rounded, 'color': Colors.indigo},
    {'name': 'Eye & Ear Care', 'icon': Icons.visibility_rounded, 'color': Colors.blueGrey},
    {'name': 'Others', 'icon': Icons.category_rounded, 'color': Colors.amber},
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<PharmacyProvider>(
      builder: (context, provider, child) {
        return SizedBox(
          height: 38,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            scrollDirection: Axis.horizontal,
            itemCount: _categories.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final category = _categories[index];
              final catName = category['name'] as String;
              final isSelected = provider.selectedCategory == catName;
              final color = category['color'] as Color;

              return InkWell(
                onTap: () => provider.setCategory(catName),
                borderRadius: BorderRadius.circular(20),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF00897B)
                        : (context.isDark ? context.cardBg : Colors.white),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFF00897B)
                          : (context.isDark ? context.dividerColor : Colors.grey.shade300),
                      width: isSelected ? 1.5 : 1,
                    ),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: const Color(0xFF00897B).withValues(alpha: 0.25),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        category['icon'] as IconData,
                        size: 16,
                        color: isSelected ? Colors.white : color,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        catName,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : (context.isDark ? Colors.white70 : const Color(0xFF334155)),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}