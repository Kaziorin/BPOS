import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import 'dialogs/pharmacy_dialogs.dart';

class CategorySidebar extends StatefulWidget {
  const CategorySidebar({super.key});

  @override
  State<CategorySidebar> createState() => _CategorySidebarState();
}

class _CategorySidebarState extends State<CategorySidebar> {
  String _categorySearchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  static Map<String, dynamic> _metaForCategory(String name) {
    final lower = name.toLowerCase();
    if (lower == 'all') return {'icon': Icons.grid_view_rounded, 'color': const Color(0xFF00897B)};
    if (lower.contains('antibiotic')) return {'icon': Icons.link_rounded, 'color': Colors.deepPurple};
    if (lower.contains('pain')) return {'icon': Icons.water_drop_rounded, 'color': Colors.orange};
    if (lower.contains('vitamin') || lower.contains('supplement')) return {'icon': Icons.eco_rounded, 'color': Colors.green};
    if (lower.contains('skin')) return {'icon': Icons.face_retouching_natural_rounded, 'color': Colors.pink};
    if (lower.contains('diabet')) return {'icon': Icons.opacity_rounded, 'color': Colors.blue};
    if (lower.contains('cardio')) return {'icon': Icons.favorite_rounded, 'color': Colors.red};
    if (lower.contains('gastro')) return {'icon': Icons.restaurant_menu_rounded, 'color': Colors.deepOrange};
    if (lower.contains('respir')) return {'icon': Icons.air_rounded, 'color': Colors.indigo};
    if (lower.contains('eye') || lower.contains('ear')) return {'icon': Icons.visibility_rounded, 'color': Colors.blueGrey};
    return {'icon': Icons.category_rounded, 'color': const Color(0xFF00897B)};
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();
    final filteredCats = provider.categories.where((name) {
      if (name == 'All') return true;
      return name.toLowerCase().contains(_categorySearchQuery.toLowerCase());
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
                final catName = filteredCats[index];
                final meta = _metaForCategory(catName);
                final isSelected = provider.selectedCategory == catName;
                final color = meta['color'] as Color;
                final icon = meta['icon'] as IconData;

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
                        Icon(icon, color: Colors.white, size: 20),
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
                          child: Icon(icon, color: color, size: 18),
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
              },
            ),
          ),

          // ── Customer Button (Bottom) ──
          Consumer<PharmacyProvider>(
            builder: (context, provider, _) {
              final cust = provider.selectedCustomer;
              final custName = cust?['name'] ?? 'Customer';
              final custSub = cust != null ? (cust['phone'] ?? 'Selected Patient') : 'Add / View Customer';

              return Padding(
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
                child: InkWell(
                  onTap: () => showPharmacyCustomerDialog(context, provider),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
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
                                custName,
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 13,
                                  color: context.textPrimary,
                                  height: 1.1,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                custSub,
                                style: TextStyle(
                                  fontSize: 9,
                                  color: context.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, size: 16, color: Colors.blue),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
