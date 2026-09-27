import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';
// ─────────────────────────────────────────────────────────────────
// SEARCH + TABS + FILTER BAR
// ─────────────────────────────────────────────────────────────────
class WholesalerSearchBar extends StatelessWidget {
  const WholesalerSearchBar({super.key});

  static const List<(String, IconData)> _tabs = [
    ('Sales Order', Icons.receipt_long_rounded),
    ('Warehouse', Icons.warehouse_rounded),
    ('Credit', Icons.account_balance_wallet_rounded),
    ('Delivery', Icons.local_shipping_rounded),
    ('Commission', Icons.percent_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      child: Column(
        children: [
          Row(
            children: [
              // Search Box
              Expanded(
                child: _SearchInput(isDark: isDark, w: w),
              ),
              if (!isMobile) ...[
                const SizedBox(width: 12),
                // Nav Tabs
                Expanded(
                  child: _NavTabs(isDark: isDark, tabs: _tabs),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),
          // Filter row
          _FilterRow(isDark: isDark, w: w),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _SearchInput extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _SearchInput({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: WholesalerColors.inputBg(isDark),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Row(
        children: [
          const SizedBox(width: 12),
          Icon(Icons.search_rounded, size: 18, color: WholesalerColors.textSecondary(isDark)),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              onChanged: (v) => context.read<WholesalerProvider>().setSearchQuery(v),
              style: TextStyle(fontSize: 13, color: WholesalerColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: 'Search by product name, SKU, barcode',
                hintStyle: TextStyle(
                  fontSize: 12,
                  color: WholesalerColors.textSecondary(isDark).withValues(alpha: 0.7),
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          // Barcode scanner
          GestureDetector(
            onTap: () => _showSnack(context, '📷 Barcode scanner activated'),
            child: Container(
              margin: const EdgeInsets.all(5),
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: WholesalerColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(Icons.qr_code_scanner_rounded, size: 16, color: WholesalerColors.primary),
            ),
          ),
        ],
      ),
    );
  }

  void _showSnack(BuildContext ctx, String msg) {
    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      backgroundColor: WholesalerColors.primary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }
}

class _NavTabs extends StatelessWidget {
  final bool isDark;
  final List<(String, IconData)> tabs;
  const _NavTabs({required this.isDark, required this.tabs});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tabs.length,
        separatorBuilder: (_, _) => const SizedBox(width: 6),
        itemBuilder: (_, i) {
          final isFirst = i == 0;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              gradient: isFirst ? WholesalerColors.primaryGradient : null,
              color: isFirst ? null : (isDark ? WholesalerColors.inputBg(true) : Colors.white),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isFirst
                    ? Colors.transparent
                    : WholesalerColors.border(isDark),
              ),
              boxShadow: isFirst
                  ? [BoxShadow(color: WholesalerColors.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
                  : WholesalerColors.softShadow(isDark),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  tabs[i].$2,
                  size: 14,
                  color: isFirst ? Colors.white : WholesalerColors.textSecondary(isDark),
                ),
                const SizedBox(width: 5),
                Text(
                  tabs[i].$1,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isFirst ? Colors.white : WholesalerColors.textSecondary(isDark),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _FilterRow({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Filters button
          _FilterBtn(isDark: isDark),
          const SizedBox(width: 8),
          // Warehouse dropdown
          _DropBtn(
            label: w.selectedWarehouse,
            isDark: isDark,
            onTap: () => _showWarehousePicker(context, w, isDark),
          ),
          const SizedBox(width: 8),
          // Low Stock toggle
          _LowStockToggle(isDark: isDark, w: w),
          const SizedBox(width: 12),
          // Sort
          _DropBtn(label: 'Sort by: Popular', isDark: isDark, onTap: () {}),
          const SizedBox(width: 8),
          // Grid / List toggle
          _ViewToggle(isDark: isDark, w: w),
        ],
      ),
    );
  }

  void _showWarehousePicker(BuildContext context, WholesalerProvider w, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => ChangeNotifierProvider.value(
        value: w,
        child: _WarehousePicker(isDark: isDark),
      ),
    );
  }
}

class _WarehousePicker extends StatelessWidget {
  final bool isDark;
  const _WarehousePicker({required this.isDark});

  static const warehouses = ['All Warehouses', 'WH-01 Main', 'WH-02 Annex', 'WH-03 Cold Store'];

  @override
  Widget build(BuildContext context) {
    final w = context.watch<WholesalerProvider>();
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Select Warehouse',
              style: TextStyle(
                fontSize: 16, fontWeight: FontWeight.w800,
                color: WholesalerColors.textPrimary(isDark),
              )),
          const SizedBox(height: 12),
          ...warehouses.map((wh) => ListTile(
                leading: Icon(Icons.warehouse_rounded,
                    color: w.selectedWarehouse == wh ? WholesalerColors.primary : WholesalerColors.textSecondary(isDark)),
                title: Text(wh,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: w.selectedWarehouse == wh ? WholesalerColors.primary : WholesalerColors.textPrimary(isDark),
                    )),
                onTap: () {
                  w.setWarehouse(wh);
                  Navigator.pop(context);
                },
              )),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _FilterBtn extends StatelessWidget {
  final bool isDark;
  const _FilterBtn({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: isDark ? WholesalerColors.inputBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.tune_rounded, size: 14, color: WholesalerColors.primary),
          const SizedBox(width: 5),
          Text('Filters',
              style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w700,
                color: WholesalerColors.textPrimary(isDark),
              )),
        ],
      ),
    );
  }
}

class _DropBtn extends StatelessWidget {
  final String label;
  final bool isDark;
  final VoidCallback onTap;
  const _DropBtn({required this.label, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: isDark ? WholesalerColors.inputBg(true) : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: WholesalerColors.border(isDark)),
          boxShadow: WholesalerColors.softShadow(isDark),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w600,
                color: WholesalerColors.textPrimary(isDark),
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down_rounded, size: 14,
                color: WholesalerColors.textSecondary(isDark)),
          ],
        ),
      ),
    );
  }
}

class _LowStockToggle extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _LowStockToggle({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.read<WholesalerProvider>().toggleLowStock(),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
        decoration: BoxDecoration(
          color: w.showLowStockOnly
              ? WholesalerColors.accentOrange.withValues(alpha: 0.15)
              : (isDark ? WholesalerColors.inputBg(true) : Colors.white),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: w.showLowStockOnly
                ? WholesalerColors.accentOrange.withValues(alpha: 0.5)
                : WholesalerColors.border(isDark),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Checkbox style
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: w.showLowStockOnly ? WholesalerColors.accentOrange : Colors.transparent,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: w.showLowStockOnly
                      ? WholesalerColors.accentOrange
                      : WholesalerColors.textSecondary(isDark),
                  width: 1.5,
                ),
              ),
              child: w.showLowStockOnly
                  ? const Icon(Icons.check_rounded, size: 10, color: Colors.white)
                  : null,
            ),
            const SizedBox(width: 6),
            Text(
              'Low Stock Only',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: w.showLowStockOnly
                    ? WholesalerColors.accentOrange
                    : WholesalerColors.textPrimary(isDark),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ViewToggle extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  const _ViewToggle({required this.isDark, required this.w});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? WholesalerColors.inputBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: WholesalerColors.border(isDark)),
        boxShadow: WholesalerColors.softShadow(isDark),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ViewBtn(
            icon: Icons.grid_view_rounded,
            active: w.isGridView,
            isDark: isDark,
            onTap: () { if (!w.isGridView) w.toggleView(); },
          ),
          _ViewBtn(
            icon: Icons.view_list_rounded,
            active: !w.isGridView,
            isDark: isDark,
            onTap: () { if (w.isGridView) w.toggleView(); },
          ),
        ],
      ),
    );
  }
}

class _ViewBtn extends StatelessWidget {
  final IconData icon;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;
  const _ViewBtn({required this.icon, required this.active, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: active ? WholesalerColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, size: 16,
            color: active ? Colors.white : WholesalerColors.textSecondary(isDark)),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// CATEGORY CHIPS
// ─────────────────────────────────────────────────────────────────
class WholesalerCategoryChips extends StatelessWidget {
  const WholesalerCategoryChips({super.key});

  static const _cats = [
    ('All Products', Icons.grid_view_rounded),
    ('Electronics', Icons.electrical_services_rounded),
    ('Mobiles', Icons.smartphone_rounded),
    ('Computers', Icons.computer_rounded),
    ('Home Appliances', Icons.home_rounded),
    ('Accessories', Icons.cable_rounded),
    ('Office Supplies', Icons.business_center_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _cats.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 7),
        itemBuilder: (ctx, i) {
          if (i == _cats.length) {
            return _CategoryChip(
              label: 'More',
              icon: Icons.more_horiz_rounded,
              selected: false,
              isDark: isDark,
              onTap: () {},
            );
          }
          final c = _cats[i];
          return _CategoryChip(
            label: c.$1,
            icon: c.$2,
            selected: w.selectedCategory == c.$1,
            isDark: isDark,
            onTap: () => w.setCategory(c.$1),
          );
        },
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;
  const _CategoryChip({
    required this.label, required this.icon, required this.selected,
    required this.isDark, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          gradient: selected ? WholesalerColors.primaryGradient : null,
          color: selected ? null : (isDark ? WholesalerColors.inputBg(true) : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? Colors.transparent : WholesalerColors.border(isDark),
          ),
          boxShadow: selected
              ? [BoxShadow(color: WholesalerColors.primary.withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))]
              : WholesalerColors.softShadow(isDark),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14,
                color: selected ? Colors.white : WholesalerColors.primary),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : WholesalerColors.textPrimary(isDark),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
