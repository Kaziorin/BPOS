import 'package:flutter/material.dart';

class GenericAlternativeBox extends StatelessWidget {
  const GenericAlternativeBox({super.key});

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF00897B);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1FDFB), // Very light teal
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: tealColor.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          // Leaf Icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.eco_rounded, color: tealColor, size: 24),
          ),
          const SizedBox(width: 16),
          // Text Content
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Generic Alternative Available',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    color: Color(0xFF1E293B),
                  ),
                ),
                Text(
                  'This medicine has 3 generic alternatives',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          // Action Button
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: tealColor,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Row(
              children: [
                Text('View Alternatives', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                SizedBox(width: 8),
                Icon(Icons.arrow_forward_rounded, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
