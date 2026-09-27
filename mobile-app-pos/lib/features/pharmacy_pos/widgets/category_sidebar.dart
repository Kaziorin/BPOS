import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';

class CategorySidebar extends StatefulWidget {
  const CategorySidebar({super.key});

  @override
  State<CategorySidebar> createState() => _CategorySidebarState();
}

class _CategorySidebarState extends State<CategorySidebar> {
  String _categorySearchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  static const _allCategories = [
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
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredCats = _allCategories.where((cat) {
      if (cat['name'] == 'All') return true;
      return cat['name']!.toString().toLowerCase().contains(_categorySearchQuery.toLowerCase());
    }).toList();

    return Container(
      width: 200,
      decoration: BoxDecoration(
        color: context.isDark ? context.cardBg : const Color(0xFFF8FAFC),
        border: Border(right: BorderSide(color: context.dividerColor)),
      ),
      child: Column(
        children: [
          // ── Search Category ──
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 16, 12, 8),
            child: Container(
              height: 38,
              decoration: BoxDecoration(
                color: context.isDark ? context.scaffoldBg : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _categorySearchQuery = val),
                style: const TextStyle(fontSize: 12),
                textAlignVertical: TextAlignVertical.center, // Center the text vertically
                decoration: InputDecoration(
                  hintText: 'Search category...',
                  hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 12),
                  prefixIcon: Icon(Icons.search, size: 16, color: Colors.grey.shade400),
                  border: InputBorder.none,
                  isDense: true,
                ),
              ),
            ),
          ),

          // ── Category List ──
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
              itemCount: filteredCats.length,
              itemBuilder: (context, index) {
                final cat = filteredCats[index];
                final catName = cat['name'] as String;
                
                return Consumer<PharmacyProvider>(
                  builder: (context, provider, _) {
                    final isSelected = provider.selectedCategory == catName;
                    final color = cat['color'] as Color;

                    if (isSelected) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00897B),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Icon(cat['icon'] as IconData, color: Colors.white, size: 20),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                catName,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    return InkWell(
                      onTap: () => provider.setCategory(catName),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: color.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(cat['icon'] as IconData, color: color, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                catName,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: context.isDark ? Colors.white70 : const Color(0xFF334155),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                );
              },
            ),
          ),

          // ── Customer Button (Bottom) ──
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.withValues(alpha: 0.12)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.person_add_rounded, color: Colors.blue, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Customer',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: context.textPrimary,
                            height: 1.1,
                          ),
                        ),
                        Text(
                          'Add / View Customer',
                          style: TextStyle(
                            fontSize: 9,
                            color: context.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
