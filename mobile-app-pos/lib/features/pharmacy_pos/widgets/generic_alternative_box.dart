import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import 'dialogs/pharmacy_dialogs.dart';

class GenericAlternativeBox extends StatelessWidget {
  const GenericAlternativeBox({super.key});

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF00897B);
    final provider = context.watch<PharmacyProvider>();
    final focused = provider.focusedMedicine;
    final alternatives = provider.getAlternativesFor(focused);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: context.isDark ? context.cardBg : const Color(0xFFF1FDFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tealColor.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          // Leaf Icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: tealColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.eco_rounded, color: tealColor, size: 24),
          ),
          const SizedBox(width: 14),
          // Text Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Generic Alternatives: ${focused.name}',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: context.isDark ? Colors.white : const Color(0xFF1E293B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${alternatives.length} cheaper generic alternatives found (${focused.genericName})',
                  style: TextStyle(
                    fontSize: 11,
                    color: context.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Action Button
          ElevatedButton(
            onPressed: () => showPharmacyGenericAlternativesDialog(context, provider),
            style: ElevatedButton.styleFrom(
              backgroundColor: tealColor,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('View Alternatives', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward_rounded, size: 15),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
