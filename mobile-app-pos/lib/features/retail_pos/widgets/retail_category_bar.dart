import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';

class RetailCategoryBar extends StatelessWidget {
  final bool isGridView;
  final ValueChanged<bool> onViewModeChanged;
  final VoidCallback onCategorySelected;

  const RetailCategoryBar({
    super.key,
    required this.isGridView,
    required this.onViewModeChanged,
    required this.onCategorySelected,
  });

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          // Scrollable Category Chips
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: retailProvider.categories.map((cat) {
                  final selected = retailProvider.selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 6.0),
                    child: InkWell(
                      onTap: () {
                        retailProvider.setSelectedCategory(cat);
                        onCategorySelected();
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFF8B5CF6)
                              : (isDark ? const Color(0xFF2A2A2A) : Colors.white),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: selected
                                ? const Color(0xFF8B5CF6)
                                : (isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE2E8F0)),
                          ),
                          boxShadow: selected
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Text(
                          cat,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                            color: selected
                                ? Colors.white
                                : (isDark ? Colors.grey.shade300 : const Color(0xFF475569)),
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Grid / List Toggle
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                InkWell(
                  onTap: () => onViewModeChanged(true),
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isGridView
                          ? (isDark ? const Color(0xFF3A3A3A) : Colors.white)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: isGridView && !isDark
                          ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.grid_view_rounded,
                          size: 14,
                          color: isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade500,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'Grid',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                InkWell(
                  onTap: () => onViewModeChanged(false),
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: !isGridView
                          ? (isDark ? const Color(0xFF3A3A3A) : Colors.white)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: !isGridView && !isDark
                          ? [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4)]
                          : null,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.format_list_bulleted_rounded,
                          size: 14,
                          color: !isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade500,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          'List',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: !isGridView ? const Color(0xFF8B5CF6) : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
