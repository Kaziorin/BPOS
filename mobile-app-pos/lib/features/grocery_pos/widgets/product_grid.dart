import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../models/grocery_product.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import 'dialogs/grocery_dialogs.dart';

class ProductGrid extends StatelessWidget {
  const ProductGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    final isDark = context.watch<AppProvider>().isDarkMode;
    final products = context.watch<GroceryProvider>().filteredProducts;
    final width = MediaQuery.of(context).size.width;

    int crossAxisCount;
    if (width >= 1400) {
      crossAxisCount = 6;
    } else if (width >= 1100) {
      crossAxisCount = 5;
    } else if (width >= 800) {
      crossAxisCount = 4;
    } else if (width >= 500) {
      crossAxisCount = 3;
    } else {
      crossAxisCount = 2;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
          child: Row(
            children: [
              Text(
                AppStrings.get('top_products', locale),
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: GroceryColors.textPrimary(isDark),
                ),
              ),
              const Spacer(),
              InkWell(
                onTap: () {
                  final provider = context.read<GroceryProvider>();
                  showDialog(
                    context: context,
                    builder: (_) => ChangeNotifierProvider.value(
                      value: provider,
                      child: GroceryProductListDialog(
                        titleKey: 'top_products',
                        products: provider.allProducts,
                      ),
                    ),
                  );
                },
                child: Text(
                  AppStrings.get('view_all', locale),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: GroceryColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 0.72,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              return _ProductCard(
                product: products[index],
                locale: locale,
                isDark: isDark,
                index: index,
              );
            },
          ),
        ),
      ],
    );
  }
}

class _ProductCard extends StatefulWidget {
  final GroceryProduct product;
  final String locale;
  final bool isDark;
  final int index;

  const _ProductCard({
    required this.product,
    required this.locale,
    required this.isDark,
    required this.index,
  });

  @override
  State<_ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<_ProductCard>
    with SingleTickerProviderStateMixin {
  bool _hovered = false;
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 280 + (widget.index % 6) * 40),
    );
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack);
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Color get _bgTint {
    switch (widget.product.colorHint) {
      case ColorHint.green:
        return const Color(0xFFE8F8EE);
      case ColorHint.red:
        return const Color(0xFFFDE8E8);
      case ColorHint.yellow:
        return const Color(0xFFFFF8E1);
      case ColorHint.orange:
        return const Color(0xFFFFF0E0);
      case ColorHint.brown:
        return const Color(0xFFF5EDE4);
      case ColorHint.blue:
        return const Color(0xFFE8F1FE);
      case ColorHint.purple:
        return const Color(0xFFF3E8FD);
      case ColorHint.teal:
        return const Color(0xFFE0F7F5);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;
    final isDark = widget.isDark;

    return ScaleTransition(
      scale: _scale,
      child: MouseRegion(
        onEnter: (_) => setState(() => _hovered = true),
        onExit: (_) => setState(() => _hovered = false),
        child: AnimatedScale(
          scale: _hovered ? 1.03 : 1.0,
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            decoration: BoxDecoration(
              color: isDark ? GroceryColors.inputBg(true) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _hovered
                    ? GroceryColors.primary.withValues(alpha: 0.4)
                    : GroceryColors.border(isDark),
              ),
              boxShadow: _hovered
                  ? [
                      BoxShadow(
                        color: GroceryColors.primary.withValues(alpha: 0.2),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ]
                  : GroceryColors.elevatedShadow(isDark),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () => context.read<GroceryProvider>().addToCart(p),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Image
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: isDark
                                ? GroceryColors.primary.withValues(alpha: 0.08)
                                : _bgTint,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: p.imageUrl,
                              fit: BoxFit.cover,
                              placeholder: (_, _) => Center(
                                child: Text(p.emoji, style: const TextStyle(fontSize: 36)),
                              ),
                              errorWidget: (_, _, _) => Center(
                                child: Text(p.emoji, style: const TextStyle(fontSize: 36)),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        p.localizedName(widget.locale),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: GroceryColors.textPrimary(isDark),
                        ),
                      ),
                      Text(
                        p.localizedUnit(widget.locale),
                        style: TextStyle(
                          fontSize: 10,
                          color: GroceryColors.textSecondary(isDark),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              '${AppStrings.currency} ${NumberUtils.toLocalized(p.price.toStringAsFixed(2), widget.locale)}',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: GroceryColors.primaryDark,
                              ),
                            ),
                          ),
                          // + button
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              gradient: GroceryColors.primaryGradient,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: GroceryColors.primary.withValues(alpha: 0.4),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
