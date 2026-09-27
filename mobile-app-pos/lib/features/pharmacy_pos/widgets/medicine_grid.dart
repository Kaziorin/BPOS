import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import '../models/medicine_model.dart';

class MedicineGrid extends StatelessWidget {
  const MedicineGrid({super.key});

  @override
  Widget build(BuildContext context) {
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
                  children: [
                    _NavButton(label: 'All Medicines', icon: Icons.medication_rounded, isSelected: true),
                    const SizedBox(width: 8),
                    _NavButton(label: 'Popular'),
                    const SizedBox(width: 8),
                    _NavButton(label: 'Low Stock', icon: Icons.warning_amber_rounded, iconColor: Colors.orange),
                    const SizedBox(width: 8),
                    _NavButton(label: 'Expiring Soon', icon: Icons.calendar_today_rounded, iconColor: Colors.red),
                    const SizedBox(width: 8),
                    _NavButton(label: 'Prescription Required', icon: Icons.medical_services_rounded, iconColor: Colors.purple),
                    const SizedBox(width: 8),
                    _NavButton(label: 'Generic Available', icon: Icons.eco_rounded, iconColor: Colors.green),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 16),
            // ── Sort & Filter Section (From Image) ──
            _buildSortAndFilter(context),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // ── Medicine Grid ──
        Expanded(
          child: Consumer<PharmacyProvider>(
            builder: (context, provider, _) {
              final items = provider.filteredMedicines;
              return GridView.builder(
                padding: const EdgeInsets.only(bottom: 20),
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 220,
                  mainAxisExtent: 210,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
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

  Widget _buildSortAndFilter(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text(
          'Sort by:',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey),
        ),
        const SizedBox(width: 8),
        // Sort Box
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: context.isDark ? context.inputBg : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: context.isDark ? context.dividerColor : Colors.grey.shade200),
          ),
          child: Row(
            children: [
              Text(
                'Name A-Z',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: context.textPrimary),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Colors.grey),
            ],
          ),
        ),
        const SizedBox(width: 12),
        // Filter Icon Box
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: context.isDark ? context.inputBg : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: context.isDark ? context.dividerColor : Colors.grey.shade200),
          ),
          child: Icon(Icons.tune_rounded, size: 18, color: context.textPrimary),
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
    const primaryTeal = Color(0xFF00695C);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? primaryTeal : (context.isDark ? context.inputBg : Colors.grey.shade100),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isSelected ? primaryTeal : context.dividerColor),
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
    return Container(
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.dividerColor, width: 1.2),
        boxShadow: [
          if (!context.isDark)
            BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2)),
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
                        errorBuilder: (_, _, _) => const Center(child: Icon(Icons.medication, size: 36, color: Colors.grey)),
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
                         Container(padding: const EdgeInsets.all(2), decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(4)), child: const Icon(Icons.medical_services, size: 10, color: Colors.purple)),
                      const Spacer(),
                      if (medicine.alternatives != null)
                        Container(padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2), decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(4)), child: Text('Alt: ${medicine.alternatives}', style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.green))),
                    ],
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
                      Text(medicine.name, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: context.textPrimary, height: 1.1), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(medicine.genericName, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text('Stock: ${medicine.stock}', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('৳ ${medicine.price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF009688))),
                      GestureDetector(
                        onTap: () => context.read<PharmacyProvider>().addToCart(medicine),
                        child: Container(padding: const EdgeInsets.all(5), decoration: const BoxDecoration(color: Color(0xFF009688), shape: BoxShape.circle), child: const Icon(Icons.add, size: 18, color: Colors.white)),
                      ),
                    ],
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
