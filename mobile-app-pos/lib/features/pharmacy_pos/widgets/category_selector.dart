import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';

class CategorySelector extends StatelessWidget {
  const CategorySelector({super.key});

  static const primaryTeal = Color(0xFF009688);

  static const List<Map<String, dynamic>> _categories = [
    {'name': 'All', 'icon': Icons.grid_view_rounded, 'color': primaryTeal},
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

  static const List<Map<String, dynamic>> _quickFilters = [
    {'tag': 'Popular', 'label': 'Popular', 'icon': Icons.trending_up_rounded, 'color': Colors.blue},
    {'tag': 'Low Stock', 'label': 'Low Stock', 'icon': Icons.warning_amber_rounded, 'color': Colors.orange},
    {'tag': 'Expiring Soon', 'label': 'Expiring', 'icon': Icons.calendar_today_rounded, 'color': Colors.red},
    {'tag': 'Generic Available', 'label': 'Generic', 'icon': Icons.eco_rounded, 'color': Colors.green},
  ];

  @override
  Widget build(BuildContext context) {
    return Consumer<PharmacyProvider>(
      builder: (context, provider, child) {
        final isDark = context.isDark;
        final cardBg = isDark ? context.cardBg : Colors.white;
        final borderColor = isDark ? context.dividerColor : Colors.grey.shade200;

        return Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isDark ? context.surfaceBg : Colors.white,
            border: Border(
              bottom: BorderSide(color: borderColor, width: 1),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── ROW 1: PRIMARY CATEGORIES ──
              SizedBox(
                height: 34,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  scrollDirection: Axis.horizontal,
                  itemCount: _categories.length,
                  separatorBuilder: (context, index) => const SizedBox(width: 6),
                  itemBuilder: (context, index) {
                    final category = _categories[index];
                    final catName = category['name'] as String;
                    final isSelected = provider.selectedCategory == catName;
                    final color = category['color'] as Color;

                    return InkWell(
                      onTap: () => provider.setCategory(catName),
                      borderRadius: BorderRadius.circular(17),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isSelected ? primaryTeal : cardBg,
                          borderRadius: BorderRadius.circular(17),
                          border: Border.all(
                            color: isSelected ? primaryTeal : (isDark ? context.dividerColor : Colors.grey.shade300),
                            width: isSelected ? 1.4 : 1,
                          ),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: primaryTeal.withValues(alpha: 0.25),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1.5),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              category['icon'] as IconData,
                              size: 14,
                              color: isSelected ? Colors.white : color,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              catName,
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                color: isSelected
                                    ? Colors.white
                                    : (isDark ? Colors.white70 : const Color(0xFF334155)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 7),

              // ── ROW 2: CONTROLS & SECONDARY FILTERS ──
              SizedBox(
                height: 28,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Sort Dropdown Button
                      _buildSortButton(context, provider, isDark, cardBg),

                      const SizedBox(width: 6),

                      // Rx Only Filter Button
                      _buildRxButton(context, provider, isDark, cardBg),

                      const SizedBox(width: 8),

                      // Subtle Divider
                      Container(
                        width: 1,
                        height: 16,
                        color: isDark ? context.dividerColor : Colors.grey.shade300,
                      ),

                      const SizedBox(width: 8),

                      // Quick Filter Status Chips (Popular, Low Stock, Expiring, Generic)
                      ..._quickFilters.map((filter) {
                        final tag = filter['tag'] as String;
                        final isSelected = provider.selectedFilterTag == tag;
                        final color = filter['color'] as Color;

                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: InkWell(
                            onTap: () {
                              // Tapping an active filter deselects it back to All Medicines
                              provider.setFilterTag(isSelected ? 'All Medicines' : tag);
                            },
                            borderRadius: BorderRadius.circular(14),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                              decoration: BoxDecoration(
                                color: isSelected ? primaryTeal : cardBg,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected
                                      ? primaryTeal
                                      : (isDark ? context.dividerColor : Colors.grey.shade300),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    filter['icon'] as IconData,
                                    size: 13,
                                    color: isSelected ? Colors.white : color,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    filter['label'] as String,
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                      color: isSelected
                                          ? Colors.white
                                          : (isDark ? Colors.white70 : const Color(0xFF475569)),
                                    ),
                                  ),
                                  if (isSelected) ...[
                                    const SizedBox(width: 3),
                                    const Icon(Icons.close_rounded, size: 12, color: Colors.white),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSortButton(
    BuildContext context,
    PharmacyProvider provider,
    bool isDark,
    Color cardBg,
  ) {
    const sortOptions = [
      'Name A-Z',
      'Name Z-A',
      'Price: Low to High',
      'Price: High to Low',
      'Stock: High to Low',
    ];
    final isCustomSort = provider.selectedSort != 'Name A-Z';

    return PopupMenuButton<String>(
      initialValue: provider.selectedSort,
      tooltip: 'Sort Medicines',
      onSelected: (val) => provider.setSort(val),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      itemBuilder: (ctx) => sortOptions
          .map((opt) => PopupMenuItem(
                value: opt,
                child: Text(
                  opt,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: provider.selectedSort == opt ? FontWeight.bold : FontWeight.normal,
                    color: provider.selectedSort == opt ? primaryTeal : null,
                  ),
                ),
              ))
          .toList(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isCustomSort ? primaryTeal.withValues(alpha: 0.12) : cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isCustomSort ? primaryTeal : (isDark ? context.dividerColor : Colors.grey.shade300),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.swap_vert_rounded,
              size: 13,
              color: isCustomSort ? primaryTeal : (isDark ? Colors.white70 : Colors.grey.shade700),
            ),
            const SizedBox(width: 3),
            Text(
              isCustomSort ? provider.selectedSort.split(':')[0] : 'Sort',
              style: TextStyle(
                fontSize: 11,
                fontWeight: isCustomSort ? FontWeight.w700 : FontWeight.w600,
                color: isCustomSort ? primaryTeal : (isDark ? Colors.white70 : const Color(0xFF475569)),
              ),
            ),
            const SizedBox(width: 2),
            Icon(
              Icons.arrow_drop_down_rounded,
              size: 14,
              color: isCustomSort ? primaryTeal : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRxButton(
    BuildContext context,
    PharmacyProvider provider,
    bool isDark,
    Color cardBg,
  ) {
    final isRx = provider.isRxMode;

    return InkWell(
      onTap: () {
        provider.toggleRxMode();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              provider.isRxMode
                  ? 'Rx Filter ON: Showing prescription medicines only'
                  : 'Rx Filter OFF: Showing all medicines',
            ),
            duration: const Duration(seconds: 1),
          ),
        );
      },
      borderRadius: BorderRadius.circular(14),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isRx ? primaryTeal : cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isRx ? primaryTeal : (isDark ? context.dividerColor : Colors.grey.shade300),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isRx ? Icons.medical_services_rounded : Icons.medical_services_outlined,
              size: 12.5,
              color: isRx ? Colors.white : Colors.purple,
            ),
            const SizedBox(width: 4),
            Text(
              'Rx Only',
              style: TextStyle(
                fontSize: 11,
                fontWeight: isRx ? FontWeight.w700 : FontWeight.w600,
                color: isRx ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF475569)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}