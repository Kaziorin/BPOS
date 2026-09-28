import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import 'dialogs/pharmacy_dialogs.dart';

class QuickActionsBar extends StatelessWidget {
  const QuickActionsBar({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();

    final docSubtitle = provider.attachedDoctor != null
        ? provider.attachedDoctor!['name']?.toString().split(' ').last ?? 'Attached'
        : 'Add Doctor';

    final rxSubtitle = provider.attachedPrescription != null ? 'Rx Attached' : 'View / Attach Rx';
    final noteSubtitle = provider.salesNote.isNotEmpty ? 'Note Added' : 'Add Note';

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _ActionButton(
            icon: Icons.medical_services_rounded,
            label: 'Prescription',
            subtitle: rxSubtitle,
            color: Colors.purple,
            onTap: () => showPharmacyScanRxDialog(context, provider),
          ),
          const SizedBox(width: 12),
          _ActionButton(
            icon: Icons.person_outline_rounded,
            label: 'Doctor',
            subtitle: docSubtitle,
            color: Colors.indigo,
            onTap: () => showPharmacyDoctorDialog(context, provider),
          ),
          const SizedBox(width: 12),
          _ActionButton(
            icon: Icons.refresh_rounded,
            label: 'Refill',
            subtitle: 'Quick Refill',
            color: Colors.orange,
            onTap: () => showPharmacyQuickRefillDialog(context, provider),
          ),
          const SizedBox(width: 12),
          _ActionButton(
            icon: Icons.star_rounded,
            label: 'Loyalty',
            subtitle: 'Add Points',
            color: Colors.red,
            onTap: () => showPharmacyCustomerDialog(context, provider),
          ),
          const SizedBox(width: 12),
          _ActionButton(
            icon: Icons.note_alt_rounded,
            label: 'Note',
            subtitle: noteSubtitle,
            color: Colors.teal,
            onTap: () => showPharmacyNoteDialog(context, provider),
          ),
          const SizedBox(width: 12),
          _ActionButton(
            icon: Icons.keyboard_return_rounded,
            label: 'Return',
            subtitle: 'Quick Return',
            color: Colors.deepOrange,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Medicine Return: Enter invoice number from previous sale to return item.'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
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
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 140,
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
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
                  Text(
                    label,
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
                    subtitle,
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
          ],
        ),
      ),
    );
  }
}
