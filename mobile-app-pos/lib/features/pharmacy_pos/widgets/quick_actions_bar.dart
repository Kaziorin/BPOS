import 'package:flutter/material.dart';
import '../../../core/theme/theme_extensions.dart';

class QuickActionsBar extends StatelessWidget {
  const QuickActionsBar({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _ActionButton(icon: Icons.medical_services_rounded, label: 'Prescription', subtitle: 'View / Attach Rx', color: Colors.purple),
          const SizedBox(width: 12),
          _ActionButton(icon: Icons.person_outline_rounded, label: 'Doctor', subtitle: 'Add Doctor', color: Colors.indigo),
          const SizedBox(width: 12),
          _ActionButton(icon: Icons.refresh_rounded, label: 'Refill', subtitle: 'Quick Refill', color: Colors.orange),
          const SizedBox(width: 12),
          _ActionButton(icon: Icons.star_rounded, label: 'Loyalty', subtitle: 'Add Points', color: Colors.red),
          const SizedBox(width: 12),
          _ActionButton(icon: Icons.note_alt_rounded, label: 'Note', subtitle: 'Add Note', color: Colors.teal),
          const SizedBox(width: 12),
          _ActionButton(icon: Icons.keyboard_return_rounded, label: 'Return', subtitle: 'Quick Return', color: Colors.deepOrange),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;

  const _ActionButton({required this.icon, required this.label, required this.subtitle, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: context.textPrimary, height: 1.1)),
                Text(subtitle, style: TextStyle(fontSize: 9, color: context.textSecondary, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
