import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/models/menu_item.dart';
import '../../../core/theme/theme_extensions.dart';
import '../../../core/utils/number_utils.dart';
import 'dialogs/pos_dialogs.dart';

class MenuGrid extends StatelessWidget {
  final bool isMobile;
  const MenuGrid({super.key, this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    if (isMobile) {
      return Container(
        color: context.cardBg,
        child: Column(
          children: [
            _MenuHeader(isMobile: isMobile),
            Expanded(
              child: Consumer<POSProvider>(
                builder: (context, provider, _) {
                  final items = provider.filteredMenuItems;
                  if (items.isEmpty) {
                    return Center(
                      child: Text('No items found', style: TextStyle(color: context.textHint)),
                    );
                  }
                  if (provider.viewMode == 'list') {
                    return _MenuListView(items: items, isMobile: isMobile);
                  }
                  return _MenuGridView(items: items, isMobile: isMobile);
                },
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: _PaginationDots(),
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(left: 0, right: 16, top: 0, bottom: 6),
      child: Container(
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: context.isDark ? 0.4 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Column(
            children: [
              _MenuHeader(isMobile: isMobile),
              Expanded(
                child: Consumer<POSProvider>(
                  builder: (context, provider, _) {
                    final items = provider.filteredMenuItems;
                    if (items.isEmpty) {
                      return Center(
                        child: Text('No items found', style: TextStyle(color: context.textHint)),
                      );
                    }
                    if (provider.viewMode == 'list') {
                      return _MenuListView(items: items, isMobile: isMobile);
                    }
                    return _MenuGridView(items: items, isMobile: isMobile);
                  },
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: _PaginationDots(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────
class _MenuHeader extends StatelessWidget {
  final bool isMobile;
  const _MenuHeader({this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    if (isMobile) return const SizedBox.shrink();

    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        final category = AppData.categories.firstWhere((c) => c.id == provider.selectedCategory);
        final categoryName = category.localizedName(locale);

        return Container(
          padding: EdgeInsets.only(left: isMobile ? 12 : 24, right: isMobile ? 12 : 24, top: 16),
          decoration: BoxDecoration(
            color: context.cardBg,
            border: Border(bottom: BorderSide(color: context.dividerColor, width: 2)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.only(bottom: 12),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: primaryOrange, width: 3)),
                ),
                child: Text(
                  categoryName,
                  style: TextStyle(fontSize: isMobile ? 16 : 18, fontWeight: FontWeight.w700, color: primaryOrange),
                ),
              ),
              const Spacer(),
              if (!isMobile)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: context.inputBg,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: context.borderColor),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _ViewToggleBtn(
                        icon: Icons.grid_view_rounded,
                        label: 'Grid',
                        isSelected: provider.viewMode == 'grid',
                        onTap: () => provider.setViewMode('grid'),
                      ),
                      _ViewToggleBtn(
                        icon: Icons.format_list_bulleted_rounded,
                        label: 'List',
                        isSelected: provider.viewMode == 'list',
                        onTap: () => provider.setViewMode('list'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _ViewToggleBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ViewToggleBtn({required this.icon, required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? primaryOrange : Colors.transparent,
          borderRadius: BorderRadius.circular(7),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isSelected ? Colors.white : context.textSecondary),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? Colors.white : context.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GRID VIEW
// ─────────────────────────────────────────────────────────────────
class _MenuGridView extends StatelessWidget {
  final List<MenuItem> items;
  final bool isMobile;
  const _MenuGridView({required this.items, this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    int crossAxisCount = screenWidth >= 1200 ? 4 : (screenWidth >= 900 ? 3 : 2);

    return GridView.builder(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 10 : 24, vertical: isMobile ? 12 : 24),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        crossAxisSpacing: isMobile ? 10 : 20,
        mainAxisSpacing: isMobile ? 10 : 20,
        childAspectRatio: isMobile ? 0.78 : 0.80,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) => _MenuItemCard(item: items[index], isMobile: isMobile),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ITEM CARD
// ─────────────────────────────────────────────────────────────────
class _MenuItemCard extends StatelessWidget {
  final MenuItem item;
  final bool isMobile;
  const _MenuItemCard({required this.item, this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        final inCart = provider.isInCart(item.id);

        return Container(
          decoration: BoxDecoration(
            color: context.cardBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: context.borderColor, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.03),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Stack(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                      child: Container(
                        width: double.infinity,
                        color: context.inputBg,
                        child: CachedNetworkImage(
                          imageUrl: item.imageUrl,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => const Center(child: CircularProgressIndicator(strokeWidth: 2, color: primaryOrange)),
                          errorWidget: (context, url, error) => Center(child: Icon(Icons.fastfood, color: context.dividerColor, size: 36)),
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: isMobile ? 8 : 12, vertical: isMobile ? 6 : 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          item.localizedName(locale),
                          style: TextStyle(fontSize: isMobile ? 13 : 16, fontWeight: FontWeight.w700, color: context.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: isMobile ? 4 : 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '৳${NumberUtils.toLocalized(item.price.toStringAsFixed(2), locale)}',
                                style: TextStyle(fontSize: isMobile ? 12 : 15, fontWeight: FontWeight.w700, color: context.textSecondary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 4),
                            inCart
                                ? Container(
                                    height: isMobile ? 26 : 34,
                                    decoration: BoxDecoration(
                                      color: primaryOrange.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        GestureDetector(
                                          onTap: () => provider.decrementById(item.id),
                                          behavior: HitTestBehavior.opaque,
                                          child: Container(
                                            width: isMobile ? 18 : 30, height: double.infinity, alignment: Alignment.center,
                                            decoration: BoxDecoration(color: primaryOrange, borderRadius: BorderRadius.circular(6)),
                                            child: Icon(Icons.remove, color: Colors.white, size: isMobile ? 10 : 16),
                                          ),
                                        ),
                                        Container(
                                          width: isMobile ? 16 : 30, alignment: Alignment.center,
                                          child: Text(
                                            NumberUtils.toLocalized(provider.getQuantity(item.id), locale),
                                            style: TextStyle(fontSize: isMobile ? 10 : 14, fontWeight: FontWeight.w800, color: primaryOrange),
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: () {
                                            if (item.modifierGroups != null) {
                                              showDialog(context: context, builder: (_) => ItemCustomizationDialog(item: item));
                                            } else {
                                              provider.addToCart(item);
                                            }
                                          },
                                          behavior: HitTestBehavior.opaque,
                                          child: Container(
                                            width: isMobile ? 18 : 30, height: double.infinity, alignment: Alignment.center,
                                            decoration: BoxDecoration(color: primaryOrange, borderRadius: BorderRadius.circular(6)),
                                            child: Icon(Icons.add, color: Colors.white, size: isMobile ? 10 : 16),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : GestureDetector(
                                    onTap: () {
                                      if (item.modifierGroups != null) {
                                        showDialog(context: context, builder: (_) => ItemCustomizationDialog(item: item));
                                      } else {
                                        provider.addToCart(item);
                                      }
                                    },
                                    behavior: HitTestBehavior.opaque,
                                    child: Container(
                                      width: isMobile ? 26 : 34, height: isMobile ? 26 : 34,
                                      decoration: BoxDecoration(color: primaryOrange, borderRadius: BorderRadius.circular(6)),
                                      child: Icon(Icons.add, color: Colors.white, size: isMobile ? 16 : 22),
                                    ),
                                  ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Add a transparent inkwell over the image to trigger customization too
              Positioned.fill(
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      if (item.modifierGroups != null) {
                        showDialog(context: context, builder: (_) => ItemCustomizationDialog(item: item));
                      } else {
                        provider.addToCart(item);
                      }
                    },
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),

              Positioned(
                top: 10, left: 10, right: 10,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (item.isPopular)
                      Container(
                        width: 26, height: 26,
                        decoration: BoxDecoration(color: Colors.red, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                        child: const Icon(Icons.star, color: Colors.white, size: 14),
                      )
                    else
                      const SizedBox.shrink(),
                    if (item.isVeg)
                      Container(
                        width: 26, height: 26,
                        decoration: BoxDecoration(color: Colors.green.shade600, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                        child: const Icon(Icons.eco, color: Colors.white, size: 14),
                      )
                    else
                      const SizedBox.shrink(),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// LIST VIEW
// ─────────────────────────────────────────────────────────────────
class _MenuListView extends StatelessWidget {
  final List<MenuItem> items;
  final bool isMobile;
  const _MenuListView({required this.items, this.isMobile = false});

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    final locale = context.watch<AppProvider>().locale;

    return ListView.builder(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 12 : 24, vertical: 16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Consumer<POSProvider>(
          builder: (context, provider, _) {
            final inCart = provider.isInCart(item.id);
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.inputBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: context.borderColor, width: 1.5),
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: 80,
                      height: 80,
                      color: primaryOrange.withValues(alpha: 0.08),
                      child: CachedNetworkImage(
                        imageUrl: item.imageUrl,
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: primaryOrange),
                          ),
                        ),
                        errorWidget: (context, url, error) => Center(
                          child: Icon(Icons.fastfood, color: context.dividerColor, size: 32),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.localizedName(locale), style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: context.textPrimary)),
                        const SizedBox(height: 8),
                        Text('৳${NumberUtils.toLocalized(item.price.toStringAsFixed(2), locale)}', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: context.textSecondary)),
                      ],
                    ),
                  ),
                  inCart
                      ? Container(
                          height: 36,
                          decoration: BoxDecoration(color: primaryOrange.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              GestureDetector(
                                onTap: () => provider.decrementById(item.id),
                                behavior: HitTestBehavior.opaque,
                                child: Container(
                                  width: 36, height: double.infinity, alignment: Alignment.center,
                                  decoration: BoxDecoration(color: primaryOrange, borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.remove, color: Colors.white, size: 16),
                                ),
                              ),
                              Container(
                                width: 36, alignment: Alignment.center,
                                child: Text(NumberUtils.toLocalized(provider.getQuantity(item.id), locale), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: primaryOrange)),
                              ),
                              GestureDetector(
                                onTap: () {
                                  if (item.modifierGroups != null) {
                                    showDialog(context: context, builder: (_) => ItemCustomizationDialog(item: item));
                                  } else {
                                    provider.addToCart(item);
                                  }
                                },
                                behavior: HitTestBehavior.opaque,
                                child: Container(
                                  width: 36, height: double.infinity, alignment: Alignment.center,
                                  decoration: BoxDecoration(color: primaryOrange, borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.add, color: Colors.white, size: 16),
                                ),
                              ),
                            ],
                          ),
                        )
                      : GestureDetector(
                          onTap: () {
                            if (item.modifierGroups != null) {
                              showDialog(context: context, builder: (_) => ItemCustomizationDialog(item: item));
                            } else {
                              provider.addToCart(item);
                            }
                          },
                          behavior: HitTestBehavior.opaque,
                          child: Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(color: primaryOrange, borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.add, color: Colors.white, size: 20),
                          ),
                        ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}


class _PaginationDots extends StatelessWidget {
  const _PaginationDots();

  @override
  Widget build(BuildContext context) {
    const primaryOrange = Color(0xFFFF6D00);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildDot(primaryOrange),
        const SizedBox(width: 8),
        _buildDot(context.textHint),
        const SizedBox(width: 8),
        _buildDot(context.textHint),
      ],
    );
  }

  Widget _buildDot(Color color) {
    return Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle));
  }
}
