import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import 'package:intl/intl.dart';
import '../providers/pharmacy_provider.dart';
import 'dialogs/pharmacy_dialogs.dart';

class PharmacyFooter extends StatelessWidget {
  const PharmacyFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final timeStr = DateFormat('hh:mm a').format(now);
    final dateStr = DateFormat('dd MMM yyyy, EEEE').format(now);
    final provider = context.watch<PharmacyProvider>();

    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      decoration: BoxDecoration(
        color: context.isDark ? context.cardBg : Colors.white,
        border: Border(
          top: BorderSide(color: context.isDark ? context.dividerColor : Colors.grey.withValues(alpha: 0.2)),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Time & Date
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                timeStr,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF009688),
                ),
              ),
              Text(
                dateStr,
                style: TextStyle(
                  fontSize: 10,
                  color: context.textSecondary,
                ),
              ),
            ],
          ),
          
          // Status items
          Row(
            children: [
              _buildVerticalDivider(context),
              _buildInfoItem(
                context,
                icon: Icons.person,
                iconColor: Colors.blue.shade400,
                iconBg: Colors.blue.withValues(alpha: 0.1),
                label: 'Cashier',
                value: 'Ahmed R.',
              ),
              _buildVerticalDivider(context),
              _buildInfoItem(
                context,
                icon: Icons.computer,
                iconColor: Colors.indigo.shade400,
                iconBg: Colors.indigo.withValues(alpha: 0.1),
                label: 'Terminal',
                value: 'PC-01',
              ),
              _buildVerticalDivider(context),
              _buildInfoItem(
                context,
                icon: Icons.cloud_done,
                iconColor: Colors.green,
                iconBg: Colors.green.withValues(alpha: 0.1),
                label: 'Sync Status',
                value: 'Online',
                valueColor: Colors.green,
              ),
              _buildVerticalDivider(context),
              _buildInfoItem(
                context,
                icon: Icons.access_time_rounded,
                iconColor: Colors.purple.shade400,
                iconBg: Colors.purple.withValues(alpha: 0.1),
                label: 'Last Backup',
                value: '11:30 AM',
              ),
            ],
          ),
          
          // Clickable Shortcuts
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Shortcuts (Clickable)',
                style: TextStyle(fontSize: 9, color: context.textSecondary, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  _clickableShortcut('F1', 'Pay', context, () => showPharmacyCheckoutDialog(context, provider)),
                  _shortcutDivider(context),
                  _clickableShortcut('F2', 'Add Item', context, () => showPharmacyAddMedicineDialog(context, provider)),
                  _shortcutDivider(context),
                  _clickableShortcut('F3', 'Scan', context, () => showPharmacyBarcodeScanDialog(context, provider)),
                  _shortcutDivider(context),
                  _clickableShortcut('F4', 'Rx', context, () => showPharmacyScanRxDialog(context, provider)),
                  _shortcutDivider(context),
                  _clickableShortcut('F6', 'Hold (${provider.heldBills.length})', context, () => showPharmacyHeldBillsDialog(context, provider)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildVerticalDivider(BuildContext context) {
    return Container(
      width: 1,
      height: 20,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      color: context.isDark ? context.dividerColor : Colors.grey.withValues(alpha: 0.2),
    );
  }

  Widget _buildInfoItem(BuildContext context, {
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 14, color: iconColor),
        ),
        const SizedBox(width: 6),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 9, color: context.textSecondary),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: valueColor ?? context.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _clickableShortcut(String key, String action, BuildContext context, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2.0, vertical: 1.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: const Color(0xFF009688).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Text(key, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF009688))),
            ),
            const SizedBox(width: 3),
            Text(action, style: TextStyle(fontSize: 10.5, color: context.textSecondary, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _shortcutDivider(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4.0),
      child: Text('|', style: TextStyle(fontSize: 10, color: context.textSecondary.withValues(alpha: 0.5))),
    );
  }
}