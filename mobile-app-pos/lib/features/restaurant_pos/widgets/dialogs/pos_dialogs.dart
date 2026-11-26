import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/models/menu_item.dart';
import '../../../../core/providers/pos_provider.dart';
import '../../../../core/providers/app_provider.dart';
import '../../../../core/localization/app_strings.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../../../core/utils/number_utils.dart';
import 'restaurant_checkout_dialog.dart';

export 'restaurant_checkout_dialog.dart';

// ─────────────────────────────────────────────────────────────────
// TABLE SELECTION DIALOG
// ─────────────────────────────────────────────────────────────────
class TableSelectionDialog extends StatelessWidget {
  const TableSelectionDialog({super.key});

  static const List<Map<String, dynamic>> _fallbackTables = [
    {'tableNo': 'T-01', 'capacity': 2, 'status': 'AVAILABLE'},
    {'tableNo': 'T-02', 'capacity': 4, 'status': 'OCCUPIED'},
    {'tableNo': 'T-03', 'capacity': 4, 'status': 'AVAILABLE'},
    {'tableNo': 'T-04', 'capacity': 6, 'status': 'AVAILABLE'},
    {'tableNo': 'T-05', 'capacity': 4, 'status': 'OCCUPIED'},
    {'tableNo': 'T-06', 'capacity': 2, 'status': 'AVAILABLE'},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final appProvider = context.watch<AppProvider>();
    final locale = appProvider.locale;
    final isDark =
        appProvider.isDarkMode ||
        Theme.of(context).brightness == Brightness.dark;
    const primaryOrange = Color(0xFFFF6D00);

    final tableList = provider.tables.isNotEmpty
        ? provider.tables
        : _fallbackTables;

    return AlertDialog(
      backgroundColor: isDark ? const Color(0xFF141B29) : Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.table_restaurant_rounded,
              color: primaryOrange,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppStrings.get('select_table', locale),
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ),
          IconButton(
            onPressed: provider.isLoadingTables ? null : provider.refreshTables,
            icon: provider.isLoadingTables
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: primaryOrange,
                    ),
                  )
                : Icon(
                    Icons.refresh_rounded,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                    size: 20,
                  ),
          ),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 500,
          maxHeight: MediaQuery.of(context).size.height * 0.65,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLegend(
                    Colors.green.shade600,
                    AppStrings.get('available', locale),
                    isDark,
                  ),
                  const SizedBox(width: 16),
                  _buildLegend(
                    Colors.orange.shade700,
                    AppStrings.get('occupied', locale),
                    isDark,
                  ),
                  const SizedBox(width: 16),
                  _buildLegend(
                    primaryOrange,
                    AppStrings.get('selected_label', locale),
                    isDark,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: tableList.map<Widget>((t) {
                    final tableId = t['id']?.toString();
                    final tableName = (t['tableNo'] ?? t['name'] ?? 'T-01')
                        .toString();
                    final capacity =
                        int.tryParse((t['capacity'] ?? 4).toString()) ?? 4;
                    final statusStr = (t['status'] ?? 'AVAILABLE')
                        .toString()
                        .toUpperCase();
                    final floorName =
                        (t['floorName'] ??
                                (t['floor'] is Map ? t['floor']['name'] : '') ??
                                '')
                            .toString();

                    final isCurrent = provider.tableNumber == tableName;
                    final isOccupied = statusStr != 'AVAILABLE';

                    final cardColor = isCurrent
                        ? primaryOrange
                        : isDark
                        ? (isOccupied
                              ? const Color(0xFF2D1E12)
                              : const Color(0xFF132A22))
                        : (isOccupied
                              ? Colors.orange.shade50
                              : Colors.green.shade50);
                    final borderColor = isCurrent
                        ? primaryOrange
                        : isDark
                        ? (isOccupied
                              ? Colors.orange.shade700
                              : const Color(0xFF10B981).withValues(alpha: 0.4))
                        : (isOccupied
                              ? Colors.orange.shade300
                              : Colors.green.shade300);
                    final textColor = isCurrent
                        ? Colors.white
                        : isDark
                        ? Colors.white
                        : (isOccupied
                              ? Colors.orange.shade900
                              : Colors.green.shade900);

                    return GestureDetector(
                      onTap: () {
                        provider.selectTable(tableName, tableId: tableId);
                        Navigator.of(context).pop();
                      },
                      child: Container(
                        width: 108,
                        padding: const EdgeInsets.symmetric(
                          vertical: 12,
                          horizontal: 10,
                        ),
                        decoration: BoxDecoration(
                          color: cardColor,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: borderColor, width: 1.8),
                          boxShadow: isCurrent
                              ? [
                                  BoxShadow(
                                    color: primaryOrange.withValues(alpha: 0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ]
                              : [],
                        ),
                        child: Column(
                          children: [
                            Text(
                              NumberUtils.toLocalized(tableName, locale),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: textColor,
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                              ),
                            ),
                            if (floorName.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                floorName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: textColor.withValues(alpha: 0.72),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.person,
                                  size: 12,
                                  color: textColor.withValues(alpha: 0.8),
                                ),
                                const SizedBox(width: 2),
                                Text(
                                  '${NumberUtils.toLocalized(capacity, locale)} ${AppStrings.get('seats', locale)}',
                                  style: TextStyle(
                                    color: textColor.withValues(alpha: 0.85),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('close', locale)),
        ),
      ],
    );
  }

  Widget _buildLegend(Color color, String label, bool isDark) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? Colors.white70 : Colors.grey.shade700,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// WAITER / ASSIGN STAFF SELECTION DIALOG
// ─────────────────────────────────────────────────────────────────
class WaiterSelectionDialog extends StatelessWidget {
  const WaiterSelectionDialog({super.key});

  static const List<Map<String, String>> _fallbackWaiters = [
    {'id': 'waiter_1', 'name': 'waiter_1', 'role': 'role_head'},
    {'id': 'waiter_2', 'name': 'waiter_2', 'role': 'role_senior'},
    {'id': 'waiter_3', 'name': 'waiter_3', 'role': 'role_waitress'},
    {'id': 'waiter_4', 'name': 'waiter_4', 'role': 'role_waiter'},
    {'id': 'waiter_5', 'name': 'waiter_5', 'role': 'role_junior'},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final appProvider = context.watch<AppProvider>();
    final locale = appProvider.locale;
    final isDark =
        appProvider.isDarkMode ||
        Theme.of(context).brightness == Brightness.dark;
    const primaryOrange = Color(0xFFFF6D00);

    final hasLiveStaff = provider.staffList.isNotEmpty;

    return AlertDialog(
      backgroundColor: isDark ? const Color(0xFF141B29) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.person_outline_rounded,
              color: primaryOrange,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppStrings.get('select_server', locale),
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ),
          IconButton(
            onPressed: provider.isLoadingStaff ? null : provider.refreshStaff,
            icon: provider.isLoadingStaff
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: primaryOrange,
                    ),
                  )
                : Icon(
                    Icons.refresh_rounded,
                    color: isDark ? Colors.white70 : Colors.grey.shade600,
                    size: 20,
                  ),
          ),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 380,
          maxHeight: MediaQuery.of(context).size.height * 0.65,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: (hasLiveStaff ? provider.staffList : _fallbackWaiters)
                .map<Widget>((staff) {
                  final staffId = staff['id']?.toString();
                  final String displayName;
                  final String subtitleText;

                  if (hasLiveStaff) {
                    final first = (staff['firstName'] ?? staff['name'] ?? '')
                        .toString()
                        .trim();
                    final last = (staff['lastName'] ?? '').toString().trim();
                    final combined = [
                      first,
                      last,
                    ].where((s) => s.isNotEmpty).join(' ').trim();
                    displayName = combined.isNotEmpty ? combined : 'Staff';
                    final desig = staff['designation'] is Map
                        ? (staff['designation']['name'] ?? '').toString()
                        : '';
                    final dept = staff['department'] is Map
                        ? (staff['department']['name'] ?? '').toString()
                        : '';
                    subtitleText = [
                      desig,
                      dept,
                    ].where((s) => s.isNotEmpty).join(' • ');
                  } else {
                    displayName = AppStrings.get(
                      (staff['name'] ?? '').toString(),
                      locale,
                    );
                    subtitleText = AppStrings.get(
                      (staff['role'] ?? '').toString(),
                      locale,
                    );
                  }

                  final isSelected = hasLiveStaff
                      ? (provider.waiterId == staffId ||
                            provider.waiterDisplayName == displayName)
                      : provider.waiterKey == staff['name'];

                  final initials = displayName.isNotEmpty
                      ? displayName.trim()[0].toUpperCase()
                      : 'S';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? primaryOrange.withValues(
                              alpha: isDark ? 0.22 : 0.10,
                            )
                          : (isDark
                                ? const Color(0xFF1D2638)
                                : Colors.grey.shade50),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? primaryOrange
                            : (isDark
                                  ? const Color(0xFF2D3B55)
                                  : Colors.grey.shade200),
                        width: 1.5,
                      ),
                    ),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isSelected
                            ? primaryOrange
                            : primaryOrange.withValues(alpha: 0.16),
                        child: Text(
                          initials,
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: isSelected ? Colors.white : primaryOrange,
                          ),
                        ),
                      ),
                      title: Text(
                        displayName,
                        style: TextStyle(
                          fontWeight: isSelected
                              ? FontWeight.w800
                              : FontWeight.w600,
                          color: isSelected
                              ? primaryOrange
                              : (isDark ? Colors.white : Colors.black87),
                        ),
                      ),
                      subtitle: subtitleText.isNotEmpty
                          ? Text(
                              subtitleText,
                              style: TextStyle(
                                color: isDark
                                    ? Colors.white60
                                    : Colors.grey.shade600,
                                fontSize: 12,
                              ),
                            )
                          : null,
                      trailing: isSelected
                          ? const Icon(
                              Icons.check_circle_rounded,
                              color: primaryOrange,
                            )
                          : null,
                      onTap: () {
                        provider.selectWaiter(
                          hasLiveStaff
                              ? displayName
                              : (staff['name'] ?? displayName).toString(),
                          waiterId: hasLiveStaff ? staffId : null,
                          displayName: displayName,
                        );
                        Navigator.of(context).pop();
                      },
                    ),
                  );
                })
                .toList(),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('cancel', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// HELD ORDERS DIALOG
// ─────────────────────────────────────────────────────────────────
class HeldOrdersDialog extends StatelessWidget {
  const HeldOrdersDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);
    final isBn = locale == 'bn';

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.pause_circle_outline_rounded,
              color: primaryOrange,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppStrings.get('held_orders', locale),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${NumberUtils.toLocalized(provider.heldOrders.length, locale)} ${isBn ? 'হোল্ড' : 'Held'}',
              style: TextStyle(
                color: primaryOrange,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        height: 360,
        child: provider.heldOrders.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.inbox_outlined,
                      size: 48,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      AppStrings.get('no_held_orders', locale),
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                itemCount: provider.heldOrders.length,
                itemBuilder: (context, index) {
                  final held = provider.heldOrders[index];
                  final timeStr =
                      '${held.timestamp.hour.toString().padLeft(2, '0')}:${held.timestamp.minute.toString().padLeft(2, '0')}';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.grey.shade200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              held.id,
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                color: primaryOrange,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              timeStr,
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(
                              Icons.table_restaurant,
                              size: 14,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              held.tableNumber,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Icon(
                              Icons.person,
                              size: 14,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                AppStrings.get(held.waiter, locale),
                                style: const TextStyle(fontSize: 13),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              '৳${NumberUtils.toLocalized(held.total.toStringAsFixed(2), locale)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 15,
                                color: Colors.black87,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${NumberUtils.toLocalized(held.items.length, locale)} ${isBn ? 'আইটেম' : 'items'}: ${held.items.map((i) => "${NumberUtils.toLocalized(i.quantity, locale)}x ${i.menuItem.localizedName(locale)}").join(', ')}',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  provider.deleteHeldOrder(held.id);
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.red,
                                  side: BorderSide(color: Colors.red.shade200),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 8,
                                  ),
                                ),
                                icon: const Icon(
                                  Icons.delete_outline,
                                  size: 14,
                                ),
                                label: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    AppStrings.get('delete', locale),
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  provider.recallOrder(held);
                                  Navigator.of(context).pop();
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryOrange,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 8,
                                  ),
                                ),
                                icon: const Icon(Icons.restore, size: 14),
                                label: FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    AppStrings.get('recall_order', locale),
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('close', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SPLIT BILL DIALOG
// ─────────────────────────────────────────────────────────────────
class SplitBillDialog extends StatefulWidget {
  const SplitBillDialog({super.key});

  @override
  State<SplitBillDialog> createState() => _SplitBillDialogState();
}

class _SplitBillDialogState extends State<SplitBillDialog> {
  int _splitCount = 2;

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final total = provider.totalPayable;
    final perPerson = total / _splitCount;
    final primaryOrange = const Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.call_split_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Text(
            AppStrings.get('split_bill', locale),
            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
          ),
        ],
      ),
      content: SizedBox(
        width: 380,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: primaryOrange.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: primaryOrange.withValues(alpha: 0.2)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${AppStrings.get('total_bill', locale)}:',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    '৳${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)}',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                      color: primaryOrange,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              AppStrings.get('split_equally', locale),
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton.filledTonal(
                  onPressed: _splitCount > 2
                      ? () => setState(() => _splitCount--)
                      : null,
                  icon: const Icon(Icons.remove),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 8,
                  ),
                  child: Text(
                    '${NumberUtils.toLocalized(_splitCount, locale)} ${AppStrings.get('people', locale)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ),
                IconButton.filledTonal(
                  onPressed: _splitCount < 10
                      ? () => setState(() => _splitCount++)
                      : null,
                  icon: const Icon(Icons.add),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${AppStrings.get('each_pays', locale)}:',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '৳${NumberUtils.toLocalized(perPerson.toStringAsFixed(2), locale)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                      color: Colors.black87,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('cancel', locale)),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            final msg = locale == 'bn'
                ? 'বিলটি ${NumberUtils.toLocalized(_splitCount, locale)} জনের মধ্যে ভাগ করা হয়েছে (৳${NumberUtils.toLocalized(perPerson.toStringAsFixed(2), locale)} করে)'
                : 'Bill split into $_splitCount receipts (৳${perPerson.toStringAsFixed(2)} each)';
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(msg), backgroundColor: primaryOrange),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryOrange,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Text(AppStrings.get('confirm_split', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// TRANSFER ORDER DIALOG
// ─────────────────────────────────────────────────────────────────
class TransferOrderDialog extends StatelessWidget {
  const TransferOrderDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.sync_alt_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppStrings.get('transfer_order', locale),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${AppStrings.get('current_table', locale)}: ${NumberUtils.toLocalized(provider.tableNumber, locale)}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
            ),
            const SizedBox(height: 14),
            Text(
              AppStrings.get('destination_table', locale),
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  [
                    'T-01',
                    'T-02',
                    'T-03',
                    'T-04',
                    'T-06',
                    'T-07',
                    'T-08',
                    'VIP-01',
                  ].where((t) => t != provider.tableNumber).map<Widget>((t) {
                    return ChoiceChip(
                      label: Text(NumberUtils.toLocalized(t, locale)),
                      selected: false,
                      onSelected: (selected) {
                        provider.transferTable(t);
                        Navigator.of(context).pop();
                        final msg = locale == 'bn'
                            ? 'অর্ডারটি ${NumberUtils.toLocalized(t, locale)} এ স্থানান্তর করা হয়েছে'
                            : 'Order transferred to $t';
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(msg),
                            backgroundColor: primaryOrange,
                          ),
                        );
                      },
                    );
                  }).toList(),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('cancel', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CHECKOUT PAYMENT DIALOG
// ─────────────────────────────────────────────────────────────────
class CheckoutPaymentDialog extends StatefulWidget {
  const CheckoutPaymentDialog({super.key});

  @override
  State<CheckoutPaymentDialog> createState() => _CheckoutPaymentDialogState();
}

class _CheckoutPaymentDialogState extends State<CheckoutPaymentDialog> {
  String _selectedMethod = 'Cash';
  double _cashTendered = 0.0;
  final TextEditingController _cashController = TextEditingController();

  @override
  void dispose() {
    _cashController.dispose();
    super.dispose();
  }

  void _updateCash(double amount) {
    setState(() {
      _cashTendered = amount;
      _cashController.text = amount > 0 ? amount.toStringAsFixed(2) : '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final total = provider.totalPayable;
    final change = _cashTendered >= total ? _cashTendered - total : 0.0;
    const primaryOrange = Color(0xFFFF6D00);

    return AlertDialog(
      backgroundColor: context.cardBg,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      contentPadding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.payments_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              isBn ? 'চেকআউট ও পেমেন্ট' : 'Checkout & Payment',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 20,
                color: context.textPrimary,
              ),
            ),
          ),
        ],
      ),
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.75,
          maxWidth: 440,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Total Amount Box ──
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: primaryOrange.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: primaryOrange.withValues(alpha: 0.15),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isBn ? 'মোট পরিমাণ:' : 'Total Due:',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: context.textPrimary,
                      ),
                    ),
                    Text(
                      '৳${NumberUtils.toLocalized(total.toStringAsFixed(2), locale)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 26,
                        color: primaryOrange,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // ── Payment Method ──
              Text(
                isBn ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: context.textPrimary,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _methodTile(
                    context,
                    AppStrings.get('payment_cash', locale),
                    'Cash',
                    Icons.money,
                    isBn,
                  ),
                  const SizedBox(width: 10),
                  _methodTile(
                    context,
                    AppStrings.get('payment_card', locale),
                    'Card',
                    Icons.credit_card,
                    isBn,
                  ),
                  const SizedBox(width: 10),
                  _methodTile(
                    context,
                    AppStrings.get('payment_qr', locale),
                    'QR Pay',
                    Icons.qr_code,
                    isBn,
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Cash Tendered Section ──
              if (_selectedMethod == 'Cash') ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isBn ? 'প্রদত্ত নগদ:' : 'Cash Tendered:',
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        color: context.textPrimary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => _updateCash(total),
                      child: Text(
                        isBn ? 'পুরো টাকা' : 'Exact Amount',
                        style: const TextStyle(
                          color: primaryOrange,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                TextField(
                  controller: _cashController,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                  textAlign: TextAlign.right,
                  onChanged: (val) {
                    setState(() {
                      _cashTendered = double.tryParse(val) ?? 0.0;
                    });
                  },
                  decoration: InputDecoration(
                    prefixText: '৳ ',
                    prefixStyle: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: context.textPrimary,
                    ),
                    hintText: '0.00',
                    filled: true,
                    fillColor: context.inputBg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: context.borderColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: context.borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(
                        color: primaryOrange,
                        width: 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Quick Presets - Fill full row evenly without gap
                Row(
                  children: [20, 50, 100, 200, 500, 1000].map<Widget>((amt) {
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2.0),
                        child: InkWell(
                          onTap: () =>
                              _updateCash(_cashTendered + amt.toDouble()),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: context.cardBg,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: context.borderColor,
                                width: 1.5,
                              ),
                            ),
                            child: Text(
                              '+৳${NumberUtils.toLocalized(amt, locale)}',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                                color: context.textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Change Row
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _cashTendered >= total && total > 0
                        ? Colors.green.withValues(
                            alpha: context.isDark ? 0.15 : 0.08,
                          )
                        : context.inputBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _cashTendered >= total && total > 0
                          ? Colors.green.withValues(alpha: 0.3)
                          : context.borderColor,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        isBn ? 'ফেরত দেওয়ার পরিমাণ:' : 'Change to Return:',
                        style: TextStyle(
                          color: context.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        '৳${NumberUtils.toLocalized(change.toStringAsFixed(2), locale)}',
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 22,
                          color: _cashTendered >= total && total > 0
                              ? Colors.green
                              : context.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      actions: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  side: BorderSide(color: context.dividerColor),
                ),
                child: Text(
                  AppStrings.get('cancel', locale),
                  style: TextStyle(
                    color: context.textSecondary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: (_selectedMethod == 'Cash' && _cashTendered < total)
                    ? null
                    : () async {
                        final paid = _selectedMethod == 'Cash'
                            ? (_cashTendered > 0 ? _cashTendered : total)
                            : total;
                        final change =
                            (_selectedMethod == 'Cash' && paid > total)
                            ? paid - total
                            : 0.0;
                        final completedOrder = await provider.placeOrder(
                          paymentMethod: _selectedMethod,
                          paidAmount: paid,
                          changeAmount: change,
                        );
                        if (!context.mounted) return;
                        Navigator.of(context).pop();
                        showRestaurantReceiptDialog(
                          context,
                          completedOrder,
                          context.isDark,
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryOrange,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: context.isDark
                      ? Colors.grey.shade800
                      : Colors.grey.shade200,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  isBn ? 'অর্ডার সম্পন্ন করুন' : 'Complete Order',
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _methodTile(
    BuildContext context,
    String displayLabel,
    String key,
    IconData icon,
    bool isBn,
  ) {
    final isSel = _selectedMethod == key;
    const primaryOrange = Color(0xFFFF6D00);
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedMethod = key),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSel ? primaryOrange : context.inputBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSel ? primaryOrange : context.borderColor,
            ),
            boxShadow: isSel
                ? [
                    BoxShadow(
                      color: primaryOrange.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : [],
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSel ? Colors.white : context.textSecondary,
                size: 24,
              ),
              const SizedBox(height: 6),
              Text(
                displayLabel,
                style: TextStyle(
                  color: isSel ? Colors.white : context.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// NOTIFICATIONS DIALOG
// ─────────────────────────────────────────────────────────────────
class NotificationListDialog extends StatelessWidget {
  const NotificationListDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final primaryOrange = const Color(0xFFFF6D00);
    final notifications = [
      {
        'title': isBn ? 'রান্নাঘরের অর্ডার তৈরি' : 'Kitchen Order Ready',
        'subtitle': isBn
            ? 'টেবিল T-02 এর অর্ডার পরিবেশনের জন্য তৈরি'
            : 'Table T-02 order is ready to serve',
        'time': isBn ? '২ মিনিট আগে' : '2 mins ago',
      },
      {
        'title': isBn ? 'বিল অনুরোধ' : 'Bill Requested',
        'subtitle': isBn
            ? 'টেবিল T-05 বিল প্রিন্টের অনুরোধ করেছে'
            : 'Table T-05 requested bill print',
        'time': isBn ? '৫ মিনিট আগে' : '5 mins ago',
      },
      {
        'title': isBn ? 'নতুন ডেলিভারি অর্ডার' : 'New Delivery Order',
        'subtitle': isBn
            ? 'অর্ডার #ORD-9812 ডেলিভারির মাধ্যমে'
            : 'Order #ORD-9812 via Delivery',
        'time': isBn ? '১২ মিনিট আগে' : '12 mins ago',
      },
    ];
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Icon(Icons.notifications_rounded, color: primaryOrange),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              isBn ? 'বিজ্ঞপ্তি' : 'Notifications',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: 360,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: notifications.map<Widget>((n) {
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                backgroundColor: primaryOrange.withValues(alpha: 0.1),
                child: Icon(
                  Icons.notifications_active,
                  color: primaryOrange,
                  size: 18,
                ),
              ),
              title: Text(
                n['title']!,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              subtitle: Text(
                n['subtitle']!,
                style: const TextStyle(fontSize: 11),
              ),
              trailing: Text(
                n['time']!,
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            );
          }).toList(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('close', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// BARCODE SCANNER DIALOG
// ─────────────────────────────────────────────────────────────────
class BarcodeScannerDialog extends StatelessWidget {
  const BarcodeScannerDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final primaryOrange = const Color(0xFFFF6D00);
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        isBn ? 'স্ক্যানার সক্রিয়' : 'Scanner Active',
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: SizedBox(
        width: 300,
        height: 240,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                border: Border.all(color: primaryOrange, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                Icons.qr_code_scanner,
                size: 80,
                color: primaryOrange,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isBn
                  ? 'ক্যামেরাটি QR / বারকোডের দিকে ধরুন'
                  : 'Point camera at QR / Barcode',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('close', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// COUPON DIALOG
// ─────────────────────────────────────────────────────────────────
class CouponDialog extends StatelessWidget {
  const CouponDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final primaryOrange = const Color(0xFFFF6D00);
    final controller = TextEditingController();

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: primaryOrange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.local_offer_rounded, color: primaryOrange),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppStrings.get('coupon', locale),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: locale == 'bn' ? 'কুপন কোড' : 'Coupon Code',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  if (provider.applyCoupon(controller.text)) {
                    Navigator.of(context).pop();
                  }
                },
                child: Text(locale == 'bn' ? 'প্রয়োগ' : 'Apply'),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('close', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// DISCOUNT DIALOG
// ─────────────────────────────────────────────────────────────────
class DiscountDialog extends StatelessWidget {
  const DiscountDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    const primaryOrange = Color(0xFFFF6D00);

    return AlertDialog(
      backgroundColor: context.cardBg,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          const Icon(Icons.percent_rounded, color: primaryOrange),
          const SizedBox(width: 10),
          Text(
            AppStrings.get('discount', locale),
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ],
      ),
      content: Wrap(
        spacing: 12,
        runSpacing: 12,
        children: [5, 10, 15, 20, 25, 50]
            .map(
              (p) => InkWell(
                onTap: () {
                  provider.applyDiscount(percent: p.toDouble());
                  Navigator.of(context).pop();
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 70,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: primaryOrange.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: primaryOrange.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Text(
                    '${NumberUtils.toLocalized(p, locale)}%',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: primaryOrange,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            )
            .toList(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('cancel', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PROMO DIALOG
// ─────────────────────────────────────────────────────────────────
class PromoDialog extends StatelessWidget {
  const PromoDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        AppStrings.get('promo', locale),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome, size: 48, color: Colors.orange.shade300),
          const SizedBox(height: 16),
          Text(
            isBn
                ? 'এই মুহূর্তে কোনো সক্রিয় প্রোমো নেই।'
                : 'No active promos available right now.',
            textAlign: TextAlign.center,
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('close', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// NOTE DIALOG
// ─────────────────────────────────────────────────────────────────
class NoteDialog extends StatelessWidget {
  final bool isKitchenNote;
  const NoteDialog({super.key, required this.isKitchenNote});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    final controller = TextEditingController(
      text: isKitchenNote ? provider.kitchenNote : provider.orderNote,
    );

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        isKitchenNote
            ? AppStrings.get('kitchen_note', locale)
            : AppStrings.get('note', locale),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: TextField(
        controller: controller,
        maxLines: 4,
        decoration: InputDecoration(
          hintText: isBn ? 'এখানে নোট লিখুন...' : 'Write note here...',
          filled: true,
          fillColor: context.inputBg,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: context.borderColor),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('cancel', locale)),
        ),
        ElevatedButton(
          onPressed: () {
            if (isKitchenNote) {
              provider.setKitchenNote(controller.text);
            } else {
              provider.setOrderNote(controller.text);
            }
            Navigator.of(context).pop();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFFF6D00),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Text(AppStrings.get('save', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CUSTOM ITEM DIALOG
// ─────────────────────────────────────────────────────────────────
class CustomItemDialog extends StatelessWidget {
  const CustomItemDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    const primaryOrange = Color(0xFFFF6D00);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text(
        AppStrings.get('add_custom_item', locale),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            decoration: InputDecoration(
              labelText: AppStrings.get('item_name', locale),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              labelText: AppStrings.get('price', locale),
              prefixText: '৳ ',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(AppStrings.get('cancel', locale)),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(),
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryOrange,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Text(AppStrings.get('add_to_cart', locale)),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// BILL PRINT DIALOG (Professional Thermal Receipt)
// ─────────────────────────────────────────────────────────────────
class BillPrintDialog extends StatelessWidget {
  const BillPrintDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<POSProvider>(context);
    final locale = context.watch<AppProvider>().locale;
    final isBn = locale == 'bn';
    const primaryOrange = Color(0xFFFF6D00);

    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: 400,
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: primaryOrange.withValues(alpha: 0.1),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(20),
                ),
              ),
              child: Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.receipt_long_rounded,
                      color: primaryOrange,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      AppStrings.get('bill_print', locale),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        color: primaryOrange,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Receipt Body (Paper Effect)
            Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: context.isDark ? Colors.grey.shade900 : Colors.white,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Image.asset(
                      context.isDark
                          ? 'assets/images/salepay-logo-white.png'
                          : 'assets/images/salepay-logo-blue.png',
                      height: 28,
                      fit: BoxFit.contain,
                    ),
                  ),
                  Text(
                    AppStrings.get('app_name', locale),
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 20,
                    ),
                  ),
                  Text(
                    isBn ? 'বনানী শাখা, ঢাকা' : 'Banani Branch, Dhaka',
                    style: const TextStyle(fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    '------------------------------------------',
                    style: TextStyle(color: Colors.grey),
                  ),

                  _receiptInfoRow(
                    AppStrings.get('table', locale),
                    NumberUtils.toLocalized(provider.tableNumber, locale),
                    isBn,
                  ),
                  _receiptInfoRow(
                    AppStrings.get('waiter', locale),
                    AppStrings.get(provider.waiterKey, locale),
                    isBn,
                  ),
                  _receiptInfoRow(
                    isBn ? 'তারিখ' : 'Date',
                    NumberUtils.toLocalized(
                      DateTime.now().toString().substring(0, 16),
                      locale,
                    ),
                    isBn,
                  ),

                  const Text(
                    '------------------------------------------',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 10),

                  // Items Header
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          isBn ? 'আইটেম' : 'Item',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      Text(
                        isBn ? 'পরিমাণ' : 'Qty',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(width: 20),
                      Text(
                        isBn ? 'মূল্য' : 'Price',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Cart Items
                  ...provider.cartItems.map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.menuItem.localizedName(locale),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (item.modifiers.isNotEmpty)
                                  Text(
                                    item.modifiers
                                        .map((m) => AppStrings.get(m, locale))
                                        .join(', '),
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: Colors.grey,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          Text(
                            NumberUtils.toLocalized(item.quantity, locale),
                            style: const TextStyle(fontSize: 12),
                          ),
                          const SizedBox(width: 20),
                          Text(
                            '৳${NumberUtils.toLocalized(item.totalPrice.toStringAsFixed(2), locale)}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),
                  const Text(
                    '------------------------------------------',
                    style: TextStyle(color: Colors.grey),
                  ),

                  _receiptPriceRow(
                    AppStrings.get('subtotal', locale),
                    '৳${NumberUtils.toLocalized(provider.subtotal.toStringAsFixed(2), locale)}',
                    false,
                  ),
                  _receiptPriceRow(
                    AppStrings.get('tax', locale),
                    '৳${NumberUtils.toLocalized(provider.tax.toStringAsFixed(2), locale)}',
                    false,
                  ),
                  _receiptPriceRow(
                    AppStrings.get('total_payable', locale),
                    '৳${NumberUtils.toLocalized(provider.totalPayable.toStringAsFixed(2), locale)}',
                    true,
                  ),

                  const SizedBox(height: 20),
                  // QR Code Placeholder
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.shade300),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.qr_code_2,
                      size: 60,
                      color: Colors.black54,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    isBn ? 'আসার জন্য ধন্যবাদ!' : 'Thank you for visiting!',
                    style: const TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Software By Blue Oceans Technologies Ltd',
                    style: TextStyle(fontSize: 9, color: Colors.grey),
                  ),
                ],
              ),
            ),

            // Buttons
            Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(AppStrings.get('cancel', locale)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop();
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              isBn
                                  ? 'রসিদ প্রিন্ট হচ্ছে...'
                                  : 'Printing receipt...',
                            ),
                            backgroundColor: primaryOrange,
                          ),
                        );
                      },
                      icon: const Icon(Icons.print, size: 18),
                      label: Text(isBn ? 'প্রিন্ট করুন' : 'Print Now'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryOrange,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _receiptInfoRow(String label, String value, bool isBn) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _receiptPriceRow(String label, String value, bool isTotal) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 14 : 12,
              fontWeight: isTotal ? FontWeight.w900 : FontWeight.bold,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 16 : 12,
              fontWeight: isTotal ? FontWeight.w900 : FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ITEM CUSTOMIZATION DIALOG
// ─────────────────────────────────────────────────────────────────
class ItemCustomizationDialog extends StatefulWidget {
  final MenuItem item;
  const ItemCustomizationDialog({super.key, required this.item});

  @override
  State<ItemCustomizationDialog> createState() =>
      _ItemCustomizationDialogState();
}

class _ItemCustomizationDialogState extends State<ItemCustomizationDialog> {
  final Map<int, Set<int>> _selectedOptions = {};
  final TextEditingController _noteController = TextEditingController();
  int _quantity = 1;

  @override
  void initState() {
    super.initState();
    if (widget.item.modifierGroups != null) {
      for (int i = 0; i < widget.item.modifierGroups!.length; i++) {
        if (!widget.item.modifierGroups![i].multiSelect) {
          _selectedOptions[i] = {0};
        } else {
          _selectedOptions[i] = {};
        }
      }
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  double get _extraPrice {
    double total = 0;
    if (widget.item.modifierGroups == null) return 0;
    _selectedOptions.forEach((groupIndex, optionIndices) {
      for (var optIndex in optionIndices) {
        total += widget
            .item
            .modifierGroups![groupIndex]
            .options[optIndex]
            .extraPrice;
      }
    });
    return total;
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final locale = appProvider.locale;
    final isDark =
        appProvider.isDarkMode ||
        Theme.of(context).brightness == Brightness.dark;

    const primaryOrange = Color(0xFFFF6D00);
    const accentAmber = Color(0xFFFF9E40);
    final dialogBg = isDark ? const Color(0xFF141B29) : Colors.white;
    final surfaceBg = isDark
        ? const Color(0xFF1D2638)
        : const Color(0xFFF8FAFC);
    final borderColor = isDark
        ? const Color(0xFF2D3B55)
        : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    final unitTotal = widget.item.price + _extraPrice;
    final grandTotal = unitTotal * _quantity;

    return Dialog(
      backgroundColor: dialogBg,
      insetPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: borderColor, width: 1.2),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── HEADER ──
            Container(
              padding: const EdgeInsets.fromLTRB(18, 16, 12, 14),
              decoration: BoxDecoration(
                color: surfaceBg,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(22),
                ),
                border: Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: primaryOrange.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(11),
                      border: Border.all(
                        color: primaryOrange.withValues(alpha: 0.35),
                      ),
                    ),
                    child: const Icon(
                      Icons.tune_rounded,
                      color: primaryOrange,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      AppStrings.get('customize_item', locale),
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 17,
                        color: textPrimary,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(
                      Icons.close_rounded,
                      color: textSecondary,
                      size: 20,
                    ),
                    splashRadius: 20,
                  ),
                ],
              ),
            ),

            // ── SCROLLABLE CONTENT ──
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Item Summary Banner
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: surfaceBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 58,
                              height: 58,
                              color: primaryOrange.withValues(alpha: 0.12),
                              child: widget.item.imageUrl.isNotEmpty
                                  ? CachedNetworkImage(
                                      imageUrl: widget.item.imageUrl,
                                      width: 58,
                                      height: 58,
                                      fit: BoxFit.cover,
                                      placeholder: (_, _) => const Center(
                                        child: SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: primaryOrange,
                                          ),
                                        ),
                                      ),
                                      errorWidget: (_, _, _) => const Center(
                                        child: Icon(
                                          Icons.fastfood_rounded,
                                          color: primaryOrange,
                                          size: 26,
                                        ),
                                      ),
                                    )
                                  : const Center(
                                      child: Icon(
                                        Icons.fastfood_rounded,
                                        color: primaryOrange,
                                        size: 26,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.item.localizedName(locale),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15.5,
                                    color: textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 5),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: primaryOrange.withValues(
                                      alpha: 0.14,
                                    ),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    '৳${NumberUtils.toLocalized(widget.item.price.toStringAsFixed(2), locale)}',
                                    style: TextStyle(
                                      color: isDark
                                          ? accentAmber
                                          : primaryOrange,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 18),

                    // Modifier Groups
                    if (widget.item.modifierGroups != null)
                      ...widget.item.modifierGroups!.asMap().entries.map((
                        entry,
                      ) {
                        final groupIndex = entry.key;
                        final group = entry.value;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    AppStrings.get(group.titleKey, locale),
                                    style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 13.5,
                                      color: textPrimary,
                                    ),
                                  ),
                                  Text(
                                    group.multiSelect
                                        ? (locale == 'bn'
                                              ? 'একাধিক নির্বাচন'
                                              : 'Multi-select')
                                        : (locale == 'bn'
                                              ? '১টি নির্বাচন'
                                              : 'Choose 1'),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Column(
                                children: group.options.asMap().entries.map((
                                  optEntry,
                                ) {
                                  final optIndex = optEntry.key;
                                  final opt = optEntry.value;
                                  final isSelected =
                                      _selectedOptions[groupIndex]?.contains(
                                        optIndex,
                                      ) ??
                                      false;

                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(12),
                                      onTap: () {
                                        setState(() {
                                          if (group.multiSelect) {
                                            if (isSelected) {
                                              _selectedOptions[groupIndex]!
                                                  .remove(optIndex);
                                            } else {
                                              _selectedOptions[groupIndex]!.add(
                                                optIndex,
                                              );
                                            }
                                          } else {
                                            _selectedOptions[groupIndex] = {
                                              optIndex,
                                            };
                                          }
                                        });
                                      },
                                      child: AnimatedContainer(
                                        duration: const Duration(
                                          milliseconds: 160,
                                        ),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 11,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isSelected
                                              ? primaryOrange.withValues(
                                                  alpha: isDark ? 0.22 : 0.10,
                                                )
                                              : surfaceBg,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: isSelected
                                                ? primaryOrange
                                                : borderColor,
                                            width: isSelected ? 1.5 : 1.0,
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            Icon(
                                              group.multiSelect
                                                  ? (isSelected
                                                        ? Icons
                                                              .check_box_rounded
                                                        : Icons
                                                              .check_box_outline_blank_rounded)
                                                  : (isSelected
                                                        ? Icons
                                                              .radio_button_checked_rounded
                                                        : Icons
                                                              .radio_button_unchecked_rounded),
                                              size: 19,
                                              color: isSelected
                                                  ? primaryOrange
                                                  : textSecondary,
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: Text(
                                                AppStrings.get(
                                                  opt.nameKey,
                                                  locale,
                                                ),
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: isSelected
                                                      ? FontWeight.w700
                                                      : FontWeight.w600,
                                                  color: textPrimary,
                                                ),
                                              ),
                                            ),
                                            if (opt.extraPrice > 0)
                                              Text(
                                                '+৳${NumberUtils.toLocalized(opt.extraPrice.toStringAsFixed(2), locale)}',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w800,
                                                  color: isSelected
                                                      ? (isDark
                                                            ? accentAmber
                                                            : primaryOrange)
                                                      : textSecondary,
                                                ),
                                              ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        );
                      }),

                    // Special Instructions
                    Text(
                      AppStrings.get('special_instructions', locale),
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13.5,
                        color: textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _noteController,
                      style: TextStyle(color: textPrimary, fontSize: 13),
                      maxLines: 2,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: surfaceBg,
                        hintText: AppStrings.get(
                          'add_instructions_hint',
                          locale,
                        ),
                        hintStyle: TextStyle(
                          color: textSecondary,
                          fontSize: 12.5,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderColor),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(
                            color: primaryOrange,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── FOOTER: QUANTITY STEPPER + ADD TO CART ──
            Container(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 16),
              decoration: BoxDecoration(
                color: surfaceBg,
                borderRadius: const BorderRadius.vertical(
                  bottom: Radius.circular(22),
                ),
                border: Border(top: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: dialogBg,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: borderColor),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          constraints: const BoxConstraints(
                            minWidth: 36,
                            minHeight: 38,
                          ),
                          padding: EdgeInsets.zero,
                          icon: Icon(
                            Icons.remove_rounded,
                            size: 18,
                            color: _quantity > 1 ? textPrimary : textSecondary,
                          ),
                          onPressed: _quantity > 1
                              ? () => setState(() => _quantity--)
                              : null,
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 6),
                          child: Text(
                            NumberUtils.toLocalized('$_quantity', locale),
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                              color: textPrimary,
                            ),
                          ),
                        ),
                        IconButton(
                          constraints: const BoxConstraints(
                            minWidth: 36,
                            minHeight: 38,
                          ),
                          padding: EdgeInsets.zero,
                          icon: const Icon(
                            Icons.add_rounded,
                            size: 18,
                            color: primaryOrange,
                          ),
                          onPressed: () => setState(() => _quantity++),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final List<String> selectedModifiers = [];
                        _selectedOptions.forEach((gIdx, opts) {
                          for (var oIdx in opts) {
                            final group = widget.item.modifierGroups![gIdx];
                            final opt = group.options[oIdx];
                            selectedModifiers.add(opt.nameKey);
                          }
                        });
                        final pos = Provider.of<POSProvider>(
                          context,
                          listen: false,
                        );
                        for (int q = 0; q < _quantity; q++) {
                          pos.addToCart(
                            widget.item,
                            selectedModifiers: selectedModifiers,
                            extraPrice: _extraPrice,
                            note: _noteController.text,
                          );
                        }
                        Navigator.of(context).pop();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryOrange,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        '${AppStrings.get('add_to_cart', locale)} • ৳${NumberUtils.toLocalized(grandTotal.toStringAsFixed(2), locale)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13.5,
                        ),
                      ),
                    ),
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
