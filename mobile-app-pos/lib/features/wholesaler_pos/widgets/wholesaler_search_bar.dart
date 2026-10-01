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
    ('Sales Order', Icons.description_outlined),
    ('Warehouse', Icons.warehouse_outlined),
    ('Credit', Icons.credit_card_outlined),
    ('Delivery', Icons.local_shipping_outlined),
    ('% Commission', Icons.percent_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 700;

    return Container(
      padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
      child: Row(
        children: [
          // Search Box
          Expanded(
            flex: 44,
            child: _SearchInput(isDark: isDark, w: w),
          ),
          if (!isMobile) ...[
            const SizedBox(width: 8),
            // Quick Action Buttons
            Expanded(
              flex: 56,
              child: _NavTabs(isDark: isDark, tabs: _tabs),
            ),
          ],
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
    final isMobile = MediaQuery.of(context).size.width < 700;

    return Container(
      height: isMobile ? 44 : 36,
      decoration: BoxDecoration(
        color: isDark ? WholesalerColors.surfaceBg(isDark) : Colors.white,
        borderRadius: BorderRadius.circular(isMobile ? 16 : 4),
        border: Border.all(
          color: isDark ? WholesalerColors.border(isDark) : const Color(0xFFE2E8F0),
          width: isMobile ? 1.2 : 1.0,
        ),
      ),
      child: Row(
        children: [
          const SizedBox(width: 12),
          Icon(
            Icons.search_rounded,
            size: isMobile ? 20 : 16,
            color: isDark ? WholesalerColors.textSecondary(isDark) : const Color(0xFF64748B),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              onChanged: (v) => context.read<WholesalerProvider>().setSearchQuery(v),
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: WholesalerColors.textPrimary(isDark),
              ),
              decoration: InputDecoration(
                hintText: 'Search by product name, SKU, barcode',
                hintStyle: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w400,
                  color: isDark ? WholesalerColors.textSecondary(isDark) : const Color(0xFF94A3B8),
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
              margin: const EdgeInsets.only(right: 6),
              width: isMobile ? 32 : null,
              height: isMobile ? 32 : null,
              padding: EdgeInsets.all(isMobile ? 0 : 4),
              decoration: isMobile
                  ? BoxDecoration(
                      color: isDark
                          ? const Color(0xFF4F46E5).withValues(alpha: 0.22)
                          : const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(10),
                    )
                  : null,
              child: Center(
                child: Icon(
                  isMobile ? Icons.qr_code_scanner_rounded : Icons.crop_free_rounded,
                  size: isMobile ? 18 : 16,
                  color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                ),
              ),
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
      backgroundColor: const Color(0xFF146EF5),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
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
      height: 36,
      child: Row(
        children: [
          for (int i = 0; i < tabs.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
            Expanded(
              child: _NavTabItem(
                tab: tabs[i],
                isDark: isDark,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _NavTabItem extends StatelessWidget {
  final (String, IconData) tab;
  final bool isDark;
  const _NavTabItem({required this.tab, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: WholesalerColors.border(isDark),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            tab.$2,
            size: 13,
            color: WholesalerColors.primary,
          ),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              tab.$1,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFF10213D),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// FILTER & ACTION TOOLBAR (Below Categories)
// ─────────────────────────────────────────────────────────────────
class WholesalerFilterToolbar extends StatelessWidget {
  const WholesalerFilterToolbar({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 620;
        if (isNarrow) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            child: Row(
              children: [
                Expanded(
                  flex: 37,
                  child: _DropBtn(
                    label: w.selectedWarehouse,
                    isDark: isDark,
                    compact: true,
                    onTap: () => _showWarehousePicker(context, w, isDark),
                  ),
                ),
                const SizedBox(width: 5),
                Expanded(
                  flex: 33,
                  child: _LowStockToggle(
                    isDark: isDark,
                    w: w,
                    compact: true,
                  ),
                ),
                const SizedBox(width: 5),
                Expanded(
                  flex: 30,
                  child: _DropBtn(
                    label: 'Sort: Pop',
                    isDark: isDark,
                    compact: true,
                    onTap: () => _showSortPicker(context, isDark),
                  ),
                ),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            children: [
              // ── Left side: All Warehouses & Low stock ───────────
              _DropBtn(
                label: w.selectedWarehouse,
                isDark: isDark,
                onTap: () => _showWarehousePicker(context, w, isDark),
              ),
              const SizedBox(width: 8),
              _LowStockToggle(isDark: isDark, w: w),

              const Spacer(),

              // ── Right side: Sort by Popular, Filter & Grid/List ──
              _DropBtn(
                label: 'Sort by: Popular',
                isDark: isDark,
                onTap: () => _showSortPicker(context, isDark),
              ),
              const SizedBox(width: 8),
              _FilterBtn(isDark: isDark),
              const SizedBox(width: 8),
              _ViewToggle(isDark: isDark, w: w),
            ],
          ),
        );
      },
    );
  }

  void _showSortPicker(BuildContext context, bool isDark) {
    showModalBottomSheet(
      context: context,
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sort Products',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: WholesalerColors.textPrimary(isDark),
              ),
            ),
            const SizedBox(height: 12),
            ...['Popular', 'Price: Low to High', 'Price: High to Low', 'Name (A-Z)', 'Stock Level'].map(
              (s) => ListTile(
                leading: const Icon(Icons.sort_rounded, color: WholesalerColors.primary),
                title: Text(
                  s,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: WholesalerColors.textPrimary(isDark),
                  ),
                ),
                onTap: () => Navigator.pop(context),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: WholesalerColors.border(isDark),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.tune_rounded, size: 14, color: WholesalerColors.primary),
          const SizedBox(width: 5),
          Text('Filters',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
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
  final bool compact;
  const _DropBtn({
    required this.label,
    required this.isDark,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 6 : 10,
          vertical: compact ? 5 : 6,
        ),
        decoration: BoxDecoration(
          color: WholesalerColors.cardBg(isDark),
          borderRadius: BorderRadius.circular(compact ? 6 : 4),
          border: Border.all(
            color: WholesalerColors.border(isDark),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: compact ? 10 : 11,
                  fontWeight: FontWeight.w600,
                  color: WholesalerColors.textPrimary(isDark),
                ),
              ),
            ),
            SizedBox(width: compact ? 2 : 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: compact ? 13 : 14,
              color: WholesalerColors.textSecondary(isDark),
            ),
          ],
        ),
      ),
    );
  }
}

class _LowStockToggle extends StatelessWidget {
  final bool isDark;
  final WholesalerProvider w;
  final bool compact;
  const _LowStockToggle({
    required this.isDark,
    required this.w,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.read<WholesalerProvider>().toggleLowStock(),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 6 : 10,
          vertical: compact ? 5 : 6,
        ),
        decoration: BoxDecoration(
          color: WholesalerColors.cardBg(isDark),
          borderRadius: BorderRadius.circular(compact ? 6 : 4),
          border: Border.all(
            color: WholesalerColors.border(isDark),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: compact ? 12 : 14,
              height: compact ? 12 : 14,
              decoration: BoxDecoration(
                color: w.showLowStockOnly ? WholesalerColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
                border: Border.all(
                  color: w.showLowStockOnly
                      ? WholesalerColors.primary
                      : WholesalerColors.border(isDark),
                  width: 1.5,
                ),
              ),
              child: w.showLowStockOnly
                  ? Icon(Icons.check_rounded, size: compact ? 9 : 10, color: Colors.white)
                  : null,
            ),
            SizedBox(width: compact ? 4 : 6),
            Text(
              compact ? 'Low Stock' : 'Low Stock Only',
              style: TextStyle(
                fontSize: compact ? 10 : 11,
                fontWeight: FontWeight.w600,
                color: WholesalerColors.textPrimary(isDark),
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
        color: WholesalerColors.cardBg(isDark),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: WholesalerColors.border(isDark),
        ),
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
      child: Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF146EF5) : Colors.transparent,
          borderRadius: BorderRadius.circular(3),
        ),
        child: Icon(
          icon,
          size: 15,
          color: active ? Colors.white : WholesalerColors.textSecondary(isDark),
        ),
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
    ('Electronics', Icons.headphones_outlined),
    ('Mobiles', Icons.smartphone_rounded),
    ('Computers', Icons.laptop_rounded),
    ('Accessories', Icons.inventory_2_outlined),
    ('Home Appliances', Icons.home_outlined),
    ('Fashion', Icons.checkroom_rounded),
    ('Sports', Icons.fitness_center_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        itemCount: _cats.length,
        separatorBuilder: (_, _) => const SizedBox(width: 6),
        itemBuilder: (ctx, i) {
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
    final isMobile = MediaQuery.of(context).size.width < 700;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: isMobile ? 14 : 12, vertical: isMobile ? 8 : 6),
        decoration: BoxDecoration(
          color: selected
              ? WholesalerColors.primary
              : (isDark ? WholesalerColors.cardBg(isDark) : Colors.white),
          borderRadius: BorderRadius.circular(isMobile ? 12 : 4),
          border: Border.all(
            color: selected
                ? WholesalerColors.primary
                : WholesalerColors.border(isDark),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 13.5,
              color: selected ? Colors.white : WholesalerColors.primary,
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : (isDark ? Colors.white : const Color(0xFF10213D)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
