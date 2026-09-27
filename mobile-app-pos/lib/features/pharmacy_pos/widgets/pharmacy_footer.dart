import 'package:flutter/material.dart';
import '../../../core/theme/theme_extensions.dart';
import 'package:intl/intl.dart';

class PharmacyFooter extends StatelessWidget {
  const PharmacyFooter({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final timeStr = DateFormat('hh:mm a').format(now);
    final dateStr = DateFormat('dd MMM yyyy, EEEE').format(now);

    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 24.0),
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
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF009688),
                ),
              ),
              Text(
                dateStr,
                style: TextStyle(
                  fontSize: 11,
                  color: context.textSecondary,
                ),
              ),
            ],
          ),
          
          // Dividers between items
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
          
          // Shortcuts
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'Shortcuts',
                style: TextStyle(fontSize: 10, color: context.textSecondary),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  _shortcutText('F1', 'Pay', context),
                  _shortcutDivider(context),
                  _shortcutText('F2', 'Add Item', context),
                  _shortcutDivider(context),
                  _shortcutText('F3', 'Search', context),
                  _shortcutDivider(context),
                  _shortcutText('F4', 'Hold', context),
                  _shortcutDivider(context),
                  _shortcutText('F5', 'Print', context),
                  _shortcutDivider(context),
                  _shortcutText('F6', 'Hold Bill', context),
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
      height: 24,
      margin: const EdgeInsets.symmetric(horizontal: 24),
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
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 16, color: iconColor),
        ),
        const SizedBox(width: 8),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 10, color: context.textSecondary),
            ),
            Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: valueColor ?? context.textPrimary,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _shortcutText(String key, String action, BuildContext context) {
    return Row(
      children: [
        Text(key, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: context.textPrimary)),
        const SizedBox(width: 2),
        Text(': $action', style: TextStyle(fontSize: 11, color: context.textSecondary)),
      ],
    );
  }

  Widget _shortcutDivider(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 6.0),
      child: Text('|', style: TextStyle(fontSize: 11, color: context.textSecondary)),
    );
  }
}