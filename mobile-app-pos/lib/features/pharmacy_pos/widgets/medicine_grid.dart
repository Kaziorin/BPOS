import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import '../models/medicine_model.dart';
import 'dialogs/pharmacy_dialogs.dart';

class MedicineGrid extends StatelessWidget {
  final bool isMobile;
  const MedicineGrid({super.key, this.isMobile = false});

  static const List<Map<String, dynamic>> _filterTags = [
    {'label': 'All Medicines', 'icon': Icons.medication_rounded},
    {'label': 'Popular', 'icon': Icons.trending_up_rounded},
    {'label': 'Low Stock', 'icon': Icons.warning_amber_rounded, 'color': Colors.orange},
    {'label': 'Expiring Soon', 'icon': Icons.calendar_today_rounded, 'color': Colors.red},
    {'label': 'Prescription Required', 'icon': Icons.medical_services_rounded, 'color': Colors.purple},
    {'label': 'Generic Available', 'icon': Icons.eco_rounded, 'color': Colors.green},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Top Navigation/Filter Bar ──
        Row(
          children: [
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _filterTags.map((tag) {
                    final label = tag['label'] as String;
                    final isSelected = provider.selectedFilterTag == label;
                    final color = tag['color'] as Color?;

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: InkWell(
                        onTap: () => provider.setFilterTag(label),
                        borderRadius: BorderRadius.circular(10),
                        child: _NavButton(
                          label: label,
                          icon: tag['icon'] as IconData?,
                          iconColor: color,
                          isSelected: isSelected,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // ── Sort & Filter Section ──
            _buildSortAndFilter(context, provider),
          ],
        ),
        
        SizedBox(height: isMobile ? 10 : 16),
        
        // ── Medicine Grid ──
        Expanded(
          child: Consumer<PharmacyProvider>(
            builder: (context, prov, _) {
              final items = prov.filteredMedicines;

              if (items.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.search_off_rounded, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      Text(
                        'No medicines found matching filters',
                        style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          prov.setCategory('All');
                          prov.setFilterTag('All Medicines');
                          prov.setSearchQuery('');
                        },
                        child: const Text('Reset All Filters'),
                      ),
                    ],
                  ),
                );
              }

              return GridView.builder(
                padding: const EdgeInsets.only(bottom: 20),
                gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: isMobile ? 185 : 220,
                  mainAxisExtent: isMobile ? 205 : 210,
                  crossAxisSpacing: isMobile ? 8 : 12,
                  mainAxisSpacing: isMobile ? 8 : 12,
                ),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  return _MedicineCard(medicine: items[index]);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSortAndFilter(BuildContext context, PharmacyProvider provider) {
    final sortOptions = [
      'Name A-Z',
      'Name Z-A',
      'Price: Low to High',
      'Price: High to Low',
      'Stock: High to Low',
    ];

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!isMobile) ...[
          const Text(
            'Sort by:',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey),
          ),
          const SizedBox(width: 8),
        ],
        // Interactive Sort Popup Menu
        PopupMenuButton<String>(
          initialValue: provider.selectedSort,
          tooltip: 'Sort Medicines',
          onSelected: (val) => provider.setSort(val),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          itemBuilder: (ctx) => sortOptions.map((opt) => PopupMenuItem(
            value: opt,
            child: Text(
              opt,
              style: TextStyle(
                fontSize: 12,
                fontWeight: provider.selectedSort == opt ? FontWeight.bold : FontWeight.normal,
                color: provider.selectedSort == opt ? primaryTeal : null,
              ),
            ),
          )).toList(),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : 10, vertical: isMobile ? 5 : 6),
            decoration: BoxDecoration(
              color: context.isDark ? context.inputBg : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: context.isDark ? context.dividerColor : Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Text(
                  isMobile ? 'Sort' : provider.selectedSort,
                  style: TextStyle(fontSize: isMobile ? 11 : 12, fontWeight: FontWeight.w700, color: context.textPrimary),
                ),
                const SizedBox(width: 4),
                Icon(Icons.keyboard_arrow_down_rounded, size: isMobile ? 14 : 16, color: Colors.grey),
              ],
            ),
          ),
        ),
        SizedBox(width: isMobile ? 6 : 10),
        // Filter Icon Button (toggles Rx Mode or resets)
        InkWell(
          onTap: () {
            provider.toggleRxMode();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(provider.isRxMode ? 'Rx Filter ON: Showing prescription-only medicines' : 'Rx Filter OFF: Showing all medicines'),
                duration: const Duration(seconds: 1),
              ),
            );
          },
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: EdgeInsets.all(isMobile ? 6 : 8),
            decoration: BoxDecoration(
              color: provider.isRxMode
                  ? primaryTeal.withValues(alpha: 0.15)
                  : (context.isDark ? context.inputBg : Colors.white),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: provider.isRxMode ? primaryTeal : (context.isDark ? context.dividerColor : Colors.grey.shade200),
              ),
            ),
            child: Icon(
              Icons.tune_rounded,
              size: isMobile ? 15 : 18,
              color: provider.isRxMode ? primaryTeal : context.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color? iconColor;
  final bool isSelected;

  const _NavButton({required this.label, this.icon, this.iconColor, this.isSelected = false});

  @override
  Widget build(BuildContext context) {
    const activeTeal = Color(0xFF00695C);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? activeTeal : (context.isDark ? context.inputBg : Colors.grey.shade100),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isSelected ? activeTeal : context.dividerColor),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: isSelected ? Colors.white : (iconColor ?? Colors.grey)),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isSelected ? Colors.white : context.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _MedicineCard extends StatelessWidget {
  final MedicineModel medicine;
  const _MedicineCard({required this.medicine});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();
    final cartItem = provider.cart.cast<dynamic>().firstWhere(
      (it) => it.medicine.id == medicine.id,
      orElse: () => null,
    );
    final inCartQty = cartItem?.quantity ?? 0;

    return InkWell(
      onTap: () {
        provider.setFocusedMedicine(medicine);
        showPharmacyMedicineDetailsDialog(context, provider, medicine);
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: inCartQty > 0 ? primaryTeal : context.dividerColor,
            width: inCartQty > 0 ? 1.6 : 1.2,
          ),
          boxShadow: [
            if (!context.isDark)
              BoxShadow(
                color: inCartQty > 0 ? primaryTeal.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Area
            Expanded(
              flex: 5,
              child: Stack(
                children: [
                  Center(
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(10, 10, 10, 4),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: Image.network(
                          medicine.imagePath,
                          fit: BoxFit.contain,
                          errorBuilder: (_, _, _) => const Center(
                            child: Icon(Icons.medication, size: 36, color: primaryTeal),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 10, left: 10, right: 10,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (medicine.isRx) 
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.purple.shade50,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.purple.shade200),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.medical_services, size: 10, color: Colors.purple),
                                SizedBox(width: 2),
                                Text('Rx', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.purple)),
                              ],
                            ),
                          )
                        else
                          const SizedBox(),
                        if (medicine.alternatives != null && medicine.alternatives! > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: Colors.green.shade200),
                            ),
                            child: Text(
                              'Alt: ${medicine.alternatives}',
                              style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.green),
                            ),
                          ),
                      ],
                    ),
                  ),
                  // In Cart Badge
                  if (inCartQty > 0)
                    Positioned(
                      bottom: 6,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: primaryTeal,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$inCartQty in cart',
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Details Area
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          medicine.name,
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
                          medicine.genericName,
                          style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Stock: ${medicine.stock} • ${medicine.manufacturer.split(' ').first}',
                          style: TextStyle(
                            fontSize: 9.5,
                            color: medicine.isLowStock ? Colors.orange : Colors.grey,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '৳ ${medicine.price.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontSize: 14,
                            color: primaryTeal,
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            provider.addToCart(medicine);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: const BoxDecoration(
                              color: primaryTeal,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add, size: 18, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
