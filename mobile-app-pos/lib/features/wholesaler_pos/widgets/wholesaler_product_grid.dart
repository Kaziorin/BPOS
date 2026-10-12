import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';

// ─────────────────────────────────────────────────────────────────
// PRODUCT GRID / LIST VIEW
// ─────────────────────────────────────────────────────────────────
class WholesalerProductGrid extends StatelessWidget {
  const WholesalerProductGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final products = w.filteredProducts;
    final width = MediaQuery.of(context).size.width;

    // Grid cross axis calculation
    int crossAxis;
    if (width >= 1400) {
      crossAxis = 5;
    } else if (width >= 1100) {
      crossAxis = 4;
    } else if (width >= 800) {
      crossAxis = 3;
    } else if (width >= 550) {
      crossAxis = 3;
    } else {
      crossAxis = 2;
    }

    Widget content;
    if (products.isEmpty) {
      content = LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.search_off_rounded, size: 48,
                      color: WholesalerColors.textSecondary(isDark)),
                  const SizedBox(height: 12),
                  Text('No products found',
                      style: TextStyle(
                        fontSize: 14, fontWeight: FontWeight.w600,
                        color: WholesalerColors.textSecondary(isDark),
                      )),
                  const SizedBox(height: 6),
                  Text('Pull down to refresh',
                      style: TextStyle(
                        fontSize: 11,
                        color: WholesalerColors.textSecondary(isDark).withValues(alpha: 0.6),
                      )),
                ],
              ),
            ),
          ),
        ),
      );
    } else if (!w.isGridView) {
      content = ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
        itemCount: products.length,
        separatorBuilder: (_, _) => const SizedBox(height: 8),
        itemBuilder: (_, i) => _ProductListTile(
          product: products[i],
          isDark: isDark,
          index: i,
        ),
      );
    } else {
      content = GridView.builder(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(14, 4, 14, 8),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxis,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.82,
        ),
        itemCount: products.length,
        itemBuilder: (_, i) => _ProductCard(
          product: products[i],
          isDark: isDark,
          index: i,
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF146EF5),
      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
      onRefresh: () async {
        await Future.wait([
          w.loadProducts(),
          w.syncActiveCartWithBackend(),
        ]);
      },
      child: content,
    );
  }
}

// ── Product Card (Grid) ──────────────────────────────────────────
class _ProductCard extends StatefulWidget {
  final WProduct product;
  final bool isDark;
  final int index;
  const _ProductCard({required this.product, required this.isDark, required this.index});

  @override
  State<_ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<_ProductCard>
    with SingleTickerProviderStateMixin {
  bool _hovered = false;
  late AnimationController _ctrl;
  late Animation<double> _scale;
  late Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 250 + (widget.index % 5) * 40),
    );
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack);
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    Future.delayed(Duration(milliseconds: widget.index * 30), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Color get _statusColor {
    switch (widget.product.stockStatus) {
      case WStockStatus.inStock:
        return const Color(0xFF16A34A);
      case WStockStatus.lowStock:
        return const Color(0xFFEA580C);
      case WStockStatus.outOfStock:
        return WholesalerColors.outOfStock;
    }
  }

  String get _statusLabel {
    switch (widget.product.stockStatus) {
      case WStockStatus.inStock:
        return '● In Stock';
      case WStockStatus.lowStock:
        return '● Low Stock';
      case WStockStatus.outOfStock:
        return '● Out of Stock';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final isDark = widget.isDark;
    final isOutOfStock = p.stockStatus == WStockStatus.outOfStock || p.stock <= 0;
    final isMobile = MediaQuery.of(context).size.width < 700;

    return FadeTransition(
      opacity: _opacity,
      child: ScaleTransition(
        scale: _scale,
        child: MouseRegion(
          onEnter: (_) => setState(() => _hovered = true),
          onExit: (_) => setState(() => _hovered = false),
          child: AnimatedScale(
            scale: _hovered ? 1.025 : 1.0,
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOutCubic,
            child: GestureDetector(
              onTap: () {
                if (isOutOfStock) {
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${p.name} বর্তমানে স্টকে নেই (Out of Stock)!'),
                      backgroundColor: const Color(0xFFDC2626),
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                  return;
                }
                final added = context.read<WholesalerProvider>().addProduct(p);
                if (!added) {
                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${p.name} এর সর্বোচ্চ স্টক (${p.stock}) কার্টে যোগ করা হয়েছে!'),
                      backgroundColor: const Color(0xFFD97706),
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                }
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                decoration: BoxDecoration(
                  color: isDark
                      ? (_hovered ? const Color(0xFF252262) : WholesalerColors.cardBg(isDark))
                      : Colors.white,
                  borderRadius: BorderRadius.circular(isMobile ? 14 : 4),
                  border: Border.all(
                    color: _hovered
                        ? WholesalerColors.primary
                        : WholesalerColors.border(isDark),
                    width: 1,
                  ),
                  boxShadow: _hovered
                      ? [
                          BoxShadow(
                            color: WholesalerColors.primary.withValues(alpha: 0.15),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ]
                      : WholesalerColors.softShadow(isDark),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Image area ───────────────────────────────
                    Expanded(
                      flex: 55,
                      child: Stack(
                        children: [
                          // Product Image Container
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: isDark
                                  ? WholesalerColors.surfaceBg(isDark)
                                  : const Color(0xFFF1F5FF),
                              borderRadius: BorderRadius.vertical(
                                top: Radius.circular(isMobile ? 13 : 3),
                              ),
                            ),
                            padding: const EdgeInsets.fromLTRB(12, 22, 12, 8),
                            child: Center(
                              child: CachedNetworkImage(
                                imageUrl: p.imageUrl,
                                fit: BoxFit.cover,
                                placeholder: (_, _) => Center(
                                  child: Text(p.emoji,
                                      style: const TextStyle(fontSize: 34)),
                                ),
                                errorWidget: (_, _, _) => Center(
                                  child: Text(p.emoji,
                                      style: const TextStyle(fontSize: 34)),
                                ),
                              ),
                            ),
                          ),
                          // Stock status badge
                          Positioned(
                            top: 6,
                            left: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2.5),
                              decoration: BoxDecoration(
                                color: _statusColor.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                    color: _statusColor.withValues(alpha: 0.3)),
                              ),
                              child: Text(
                                _statusLabel,
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w700,
                                  color: _statusColor,
                                ),
                              ),
                            ),
                          ),
                          // B2B Pill at top right (subtle)
                          Positioned(
                            top: 6,
                            right: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 5, vertical: 2),
                              decoration: BoxDecoration(
                                color: WholesalerColors.primary.withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(5),
                              ),
                              child: const Text(
                                'B2B',
                                style: TextStyle(
                                  fontSize: 7.5,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // ── Info area ────────────────────────────────
                    Expanded(
                      flex: 45,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(10, 6, 10, 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  p.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w800,
                                    color: WholesalerColors.textPrimary(isDark),
                                    letterSpacing: -0.2,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'SKU: ${p.sku}',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w500,
                                    color: WholesalerColors.textSecondary(isDark),
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        '৳${p.price.toStringAsFixed(2)}',
                                        style: TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w900,
                                          color: WholesalerColors.primary,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Circular add button matching reference
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    color: isOutOfStock
                                        ? (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))
                                        : null,
                                    gradient: isOutOfStock ? null : WholesalerColors.primaryGradient,
                                    shape: BoxShape.circle,
                                    boxShadow: isOutOfStock
                                        ? null
                                        : [
                                            BoxShadow(
                                              color: WholesalerColors.primary
                                                  .withValues(alpha: 0.4),
                                              blurRadius: 8,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                  ),
                                  child: Icon(
                                    isOutOfStock ? Icons.block_rounded : Icons.add_rounded,
                                    color: isOutOfStock
                                        ? (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))
                                        : Colors.white,
                                    size: 15,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Product List Tile ─────────────────────────────────────────────
class _ProductListTile extends StatefulWidget {
  final WProduct product;
  final bool isDark;
  final int index;
  const _ProductListTile({required this.product, required this.isDark, required this.index});

  @override
  State<_ProductListTile> createState() => _ProductListTileState();
}

class _ProductListTileState extends State<_ProductListTile>
    with SingleTickerProviderStateMixin {
  bool _hovered = false;
  late AnimationController _ctrl;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _slide = Tween<Offset>(begin: const Offset(-0.2, 0), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    Future.delayed(Duration(milliseconds: widget.index * 30), () {
      if (mounted) _ctrl.forward();
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final isDark = widget.isDark;
    final isOutOfStock = p.stockStatus == WStockStatus.outOfStock || p.stock <= 0;

    return SlideTransition(
      position: _slide,
      child: MouseRegion(
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: GestureDetector(
          onTap: () {
            if (isOutOfStock) {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${p.name} বর্তমানে স্টকে নেই (Out of Stock)!'),
                  backgroundColor: const Color(0xFFDC2626),
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 2),
                ),
              );
              return;
            }
            final added = context.read<WholesalerProvider>().addProduct(p);
            if (!added) {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${p.name} এর সর্বোচ্চ স্টক (${p.stock}) কার্টে যোগ করা হয়েছে!'),
                  backgroundColor: const Color(0xFFD97706),
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 2),
                ),
              );
            }
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark
                  ? (_hovered ? const Color(0xFF252262) : WholesalerColors.cardBg(isDark))
                  : Colors.white,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: _hovered
                    ? WholesalerColors.primary
                    : WholesalerColors.border(isDark),
              ),
              boxShadow: WholesalerColors.softShadow(isDark),
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: Container(
                    width: 48, height: 48,
                    color: isDark ? WholesalerColors.surfaceBg(isDark) : const Color(0xFFF1F5FF),
                    child: CachedNetworkImage(
                      imageUrl: p.imageUrl, fit: BoxFit.cover,
                      placeholder: (_, _) => Center(child: Text(p.emoji, style: const TextStyle(fontSize: 24))),
                      errorWidget: (_, _, _) => Center(child: Text(p.emoji, style: const TextStyle(fontSize: 24))),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.name, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: WholesalerColors.textPrimary(isDark))),
                      Text('SKU: ${p.sku}  •  ${p.warehouseId}', style: TextStyle(fontSize: 9, color: WholesalerColors.textSecondary(isDark))),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('৳${p.price.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: WholesalerColors.primary)),
                    Text(
                      isOutOfStock ? '● Out of Stock' : 'Stock: ${p.stock}',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: isOutOfStock ? FontWeight.w700 : FontWeight.normal,
                        color: isOutOfStock ? WholesalerColors.outOfStock : WholesalerColors.textSecondary(isDark),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 8),
                Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(
                    color: isOutOfStock
                        ? (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))
                        : null,
                    gradient: isOutOfStock ? null : WholesalerColors.deliveryGradient,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isOutOfStock ? Icons.block_rounded : Icons.add_rounded,
                    color: isOutOfStock
                        ? (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B))
                        : Colors.white,
                    size: 17,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// PAGINATION DOTS  (decorative)
// ─────────────────────────────────────────────────────────────────
class WholesalerPaginationDots extends StatelessWidget {
  const WholesalerPaginationDots({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (int i = 0; i < 4; i++) ...[
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: i == 0 ? 18 : 6,
              height: 6,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: i == 0
                    ? WholesalerColors.primary
                    : WholesalerColors.border(isDark),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
