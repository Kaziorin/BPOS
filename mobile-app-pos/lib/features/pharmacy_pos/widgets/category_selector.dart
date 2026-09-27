import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';

class CategorySelector extends StatelessWidget {
  const CategorySelector({super.key});

  final List<Map<String, dynamic>> _categories = const [
    {'name': 'All', 'icon': Icons.widgets_rounded, 'color': Color(0xFF009688)},
    {'name': 'Prescription', 'icon': Icons.description_rounded, 'color': Color(0xFF9C27B0)},
    {'name': 'OTC', 'icon': Icons.health_and_safety_rounded, 'color': Color(0xFF4CAF50)},
    {'name': 'Supplements', 'icon': Icons.medication_liquid_rounded, 'color': Color(0xFFFF9800)},
    {'name': 'Baby Care', 'icon': Icons.child_care_rounded, 'color': Color(0xFFE91E63)},
    {'name': 'Personal Care', 'icon': Icons.clean_hands_rounded, 'color': Color(0xFF2196F3)},
    {'name': 'Medical Devices', 'icon': Icons.monitor_heart_rounded, 'color': Color(0xFF00BCD4)},
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<PharmacyProvider>(
      builder: (context, provider, child) {
        return SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _categories.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final category = _categories[index];
              final isSelected = provider.selectedCategory == category['name'];
              final color = category['color'] as Color;

              return InkWell(
                onTap: () => provider.setCategory(category['name'] as String),
                borderRadius: BorderRadius.circular(24),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? color : (context.isDark ? context.cardBg : Colors.white),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isSelected ? color : (context.isDark ? context.dividerColor : Colors.grey.withValues(alpha: 0.2)),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        category['icon'] as IconData,
                        size: 18,
                        color: isSelected ? Colors.white : color,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        category['name'] as String,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          color: isSelected ? Colors.white : context.textPrimary,
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