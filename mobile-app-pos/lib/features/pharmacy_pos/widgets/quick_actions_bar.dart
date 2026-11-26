import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import 'dialogs/pharmacy_dialogs.dart';
import '../../../core/widgets/live_sales_history_dialog.dart';

class QuickActionsBar extends StatelessWidget {
  const QuickActionsBar({super.key});

  void _showMedicineReturnDialog(
    BuildContext context,
    PharmacyProvider provider,
  ) {
    final invoiceCtrl = TextEditingController();
    final ordersFuture = ApiService.instance.fetchSalesOrders(
      businessType: 'pharmacy',
      limit: 15,
    );
    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = ctx.isDark;
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
          insetPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 24,
          ),
          backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
          child: Container(
            width: 400,
            padding: const EdgeInsets.all(18),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.deepOrange.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.keyboard_return_rounded,
                          color: Colors.deepOrange,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Medicine Return',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.of(ctx).pop(),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(
                          minWidth: 32,
                          minHeight: 32,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: invoiceCtrl,
                    decoration: InputDecoration(
                      hintText: 'Enter or filter invoice no (e.g. INV-...)',
                      prefixIcon: const Icon(Icons.search_rounded, size: 18),
                      isDense: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FutureBuilder(
                    future: ordersFuture,
                    builder: (_, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Padding(
                          padding: EdgeInsets.symmetric(vertical: 24),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: Colors.deepOrange,
                            ),
                          ),
                        );
                      }
                      final orders = snapshot.data ?? [];
                      if (orders.isEmpty) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Text(
                            snapshot.hasError
                                ? 'Could not load recent invoices. Enter invoice number above.'
                                : 'No recent pharmacy invoices found. Enter invoice number above.',
                            style: TextStyle(
                              color: ctx.textSecondary,
                              fontSize: 12.5,
                            ),
                          ),
                        );
                      }
                      return ValueListenableBuilder<TextEditingValue>(
                        valueListenable: invoiceCtrl,
                        builder: (_, val, _) {
                          final q = val.text.trim().toLowerCase();
                          final filtered = orders.where((o) {
                            if (q.isEmpty) return true;
                            return o.orderNo.toLowerCase().contains(q) ||
                                o.customerName.toLowerCase().contains(q);
                          }).toList();
                          if (filtered.isEmpty) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Text(
                                'No matching invoice found.',
                                style: TextStyle(
                                  color: ctx.textSecondary,
                                  fontSize: 12.5,
                                ),
                              ),
                            );
                          }
                          return ConstrainedBox(
                            constraints: const BoxConstraints(maxHeight: 240),
                            child: SingleChildScrollView(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: filtered.map((order) {
                                  return Container(
                                    margin: const EdgeInsets.only(bottom: 6),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(0xFF262626)
                                          : Colors.grey.shade50,
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: ctx.dividerColor,
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                order.orderNo,
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w700,
                                                  fontSize: 12.5,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                              Text(
                                                '${order.customerName} • ৳${order.total.toStringAsFixed(0)}',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  color: ctx.textSecondary,
                                                ),
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                            ],
                                          ),
                                        ),
                                        TextButton(
                                          onPressed: () {
                                            provider.setSalesNote(
                                              'Return against ${order.orderNo}',
                                            );
                                            Navigator.of(ctx).pop();
                                            ScaffoldMessenger.of(
                                              context,
                                            ).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  'Return linked to ${order.orderNo}',
                                                ),
                                                backgroundColor:
                                                    Colors.deepOrange,
                                              ),
                                            );
                                          },
                                          child: const Text('Select'),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.of(ctx).pop(),
                        child: const Text('Close'),
                      ),
                      const SizedBox(width: 8),
                      ValueListenableBuilder<TextEditingValue>(
                        valueListenable: invoiceCtrl,
                        builder: (_, val, _) {
                          final inv = val.text.trim();
                          return ElevatedButton(
                            onPressed: inv.isEmpty
                                ? null
                                : () {
                                    provider.setSalesNote(
                                      'Return against $inv',
                                    );
                                    Navigator.of(ctx).pop();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Return linked to $inv'),
                                        backgroundColor: Colors.deepOrange,
                                      ),
                                    );
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.deepOrange,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            child: const Text('Link Invoice'),
                          );
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PharmacyProvider>();

    final docSubtitle = provider.attachedDoctor != null
        ? provider.attachedDoctor!['name']?.toString().split(' ').last ??
              'Attached'
        : 'Add Doctor';

    final rxSubtitle = provider.attachedPrescription != null
        ? 'Rx Attached'
        : 'View / Attach Rx';
    final noteSubtitle = provider.salesNote.isNotEmpty
        ? 'Note Added'
        : 'Add Note';
    final customerSubtitle = provider.selectedCustomer != null
        ? (provider.selectedCustomer!['name']?.toString() ?? 'Selected')
        : 'Select / Add';

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          _ActionButton(
            icon: Icons.medical_services_rounded,
            label: 'Prescription',
            subtitle: rxSubtitle,
            color: Colors.purple,
            isActive: provider.attachedPrescription != null,
            onTap: () => showPharmacyScanRxDialog(context, provider),
          ),
          const SizedBox(width: 8),
          _ActionButton(
            icon: Icons.person_outline_rounded,
            label: 'Doctor',
            subtitle: docSubtitle,
            color: Colors.indigo,
            isActive: provider.attachedDoctor != null,
            onTap: () => showPharmacyDoctorDialog(context, provider),
          ),
          const SizedBox(width: 8),
          _ActionButton(
            icon: Icons.refresh_rounded,
            label: 'Refill',
            subtitle: 'Quick Refill',
            color: Colors.orange,
            onTap: () => showPharmacyQuickRefillDialog(context, provider),
          ),
          const SizedBox(width: 8),
          _ActionButton(
            icon: Icons.star_rounded,
            label: 'Customer',
            subtitle: customerSubtitle,
            color: Colors.red,
            isActive: provider.selectedCustomer != null,
            onTap: () => showPharmacyCustomerDialog(context, provider),
          ),
          const SizedBox(width: 8),
          _ActionButton(
            icon: Icons.note_alt_rounded,
            label: 'Note',
            subtitle: noteSubtitle,
            color: Colors.teal,
            isActive: provider.salesNote.isNotEmpty,
            onTap: () => showPharmacyNoteDialog(context, provider),
          ),
          const SizedBox(width: 8),
          _ActionButton(
            icon: Icons.keyboard_return_rounded,
            label: 'Return',
            subtitle: 'Invoice Return',
            color: Colors.deepOrange,
            onTap: () => _showMedicineReturnDialog(context, provider),
          ),
          const SizedBox(width: 8),
          _ActionButton(
            icon: Icons.receipt_long_rounded,
            label: 'Sales History',
            subtitle: 'Live Database',
            color: const Color(0xFF009688),
            onTap: () =>
                showLiveSalesHistoryDialog(context, businessType: 'pharmacy'),
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
  final bool isActive;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    this.isActive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          constraints: const BoxConstraints(minWidth: 126, maxWidth: 156),
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
          decoration: BoxDecoration(
            color: isActive
                ? color.withValues(alpha: isDark ? 0.2 : 0.1)
                : (isDark ? context.cardBg : Colors.white),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isActive
                  ? color.withValues(alpha: 0.7)
                  : color.withValues(alpha: isDark ? 0.35 : 0.22),
              width: isActive ? 1.5 : 1,
            ),
            boxShadow: isDark
                ? null
                : [
                    BoxShadow(
                      color: color.withValues(alpha: 0.06),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: isDark ? 0.22 : 0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 9),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 12.5,
                        color: context.textPrimary,
                        height: 1.15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 1),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 10,
                        color: isActive ? color : context.textSecondary,
                        fontWeight: isActive
                            ? FontWeight.w700
                            : FontWeight.w500,
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
      ),
    );
  }
}
