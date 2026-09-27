import 'package:flutter/material.dart';
import '../../../core/theme/theme_extensions.dart';

class DashboardAlerts extends StatelessWidget {
  const DashboardAlerts({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _AlertCard(
            title: 'Low Stock Alert',
            subtitle: '12 items are running low in stock',
            actionText: 'View Items',
            icon: Icons.notifications_none_rounded,
            color: Colors.red.shade400,
            bgColor: context.isDark ? Colors.red.withValues(alpha: 0.1) : Colors.red.shade50,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _AlertCard(
            title: 'Expiring Soon',
            subtitle: '08 items will expire within 30 days',
            actionText: 'View Items',
            icon: Icons.access_time_rounded,
            color: Colors.orange.shade400,
            bgColor: context.isDark ? Colors.orange.withValues(alpha: 0.1) : Colors.orange.shade50,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _AlertCard(
            title: 'Today\'s Offer',
            subtitle: 'Flat 10% off on selected items',
            actionText: 'View Offers',
            icon: Icons.percent_rounded,
            color: Colors.green.shade600,
            bgColor: context.isDark ? Colors.green.withValues(alpha: 0.1) : Colors.green.shade50,
          ),
        ),
      ],
    );
  }
}

class _AlertCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String actionText;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _AlertCard({
    required this.title,
    required this.subtitle,
    required this.actionText,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: context.isDark ? 0.1 : 1.0),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: context.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: context.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      actionText,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.arrow_forward_rounded, color: color, size: 14),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}