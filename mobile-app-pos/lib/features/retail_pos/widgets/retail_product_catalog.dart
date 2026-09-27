import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../models/retail_cart_item.dart';
import '../models/retail_product.dart';
import '../providers/retail_provider.dart';

class RetailProductCatalog extends StatelessWidget {
  final bool isGridView;
  final int currentPage;
  final ValueChanged<int> onPageChanged;
  static const int itemsPerPage = 10;

  const RetailProductCatalog({
    super.key,
    required this.isGridView,
    required this.currentPage,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;
    final products = retailProvider.filteredProducts;

    final totalPages = (products.length / itemsPerPage).ceil().clamp(1, 9999);
    final validCurrentPage = currentPage.clamp(1, totalPages);
    final startIndex = (validCurrentPage - 1) * itemsPerPage;
    final endIndex = (startIndex + itemsPerPage).clamp(0, products.length);
    final paginatedProducts = startIndex < products.length
        ? products.sublist(startIndex, endIndex)
        : <RetailProduct>[];

    return Column(
      children: [
        // Product Grid / List
        Expanded(
          child: products.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 10),
                      Text(
                        'No products found',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                )
              : isGridView
                  ? _buildGridView(context, retailProvider, paginatedProducts, isDark)
                  : _buildListView(context, retailProvider, paginatedProducts, isDark),
        ),

        // Pagination Footer Bar
        _buildPaginationFooter(
          context,
          products.length,
          validCurrentPage,
          totalPages,
          isDark,
        ),
      ],
    );
  }

  Widget _buildListView(
    BuildContext context,
    RetailProvider retailProvider,
    List<RetailProduct> paginatedProducts,
    bool isDark,
  ) {
    return ListView.separated(
      padding: const EdgeInsets.all(8),
      itemCount: paginatedProducts.length,
      separatorBuilder: (_, _) => const SizedBox(height: 6),
      itemBuilder: (context, index) {
        final p = paginatedProducts[index];
        final inCart = retailProvider.cart.firstWhere(
          (item) => item.product.id == p.id,
          orElse: () => RetailCartItem(product: p, qty: 0),
        );

        return Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF242424) : Colors.white,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: inCart.qty > 0
                  ? const Color(0xFF8B5CF6)
                  : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: Image.network(
                  p.imageUrl,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Container(
                    width: 44,
                    height: 44,
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    child: const Icon(Icons.inventory_2_outlined, size: 18, color: Color(0xFF94A3B8)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      'SKU: ${p.sku} • Stock: ${p.stock}',
                      style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontFamily: 'monospace'),
                    ),
                  ],
                ),
              ),
              Text(
                '৳${p.price.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(width: 10),
              InkWell(
                onTap: () => retailProvider.addToCart(p),
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B5CF6),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    '+ Add',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGridView(
    BuildContext context,
    RetailProvider retailProvider,
    List<RetailProduct> paginatedProducts,
    bool isDark,
  ) {
    return LayoutBuilder(
      builder: (context, catalogConstraints) {
        final catalogWidth = catalogConstraints.maxWidth;
        int crossAxisCount = 2;
        if (catalogWidth >= 1100) {
          crossAxisCount = 5;
        } else if (catalogWidth >= 800) {
          crossAxisCount = 4;
        } else if (catalogWidth >= 520) {
          crossAxisCount = 3;
        }

        return GridView.builder(
          padding: const EdgeInsets.all(10),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            childAspectRatio: 0.88,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: paginatedProducts.length,
          itemBuilder: (context, index) {
            final p = paginatedProducts[index];
            final inCartItem = retailProvider.cart.firstWhere(
              (item) => item.product.id == p.id,
              orElse: () => RetailCartItem(product: p, qty: 0),
            );

            return GestureDetector(
              onTap: () => retailProvider.addToCart(p),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF242424) : Colors.white,
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(
                    color: inCartItem.qty > 0
                        ? const Color(0xFF8B5CF6)
                        : (isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0)),
                    width: inCartItem.qty > 0 ? 1.5 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: inCartItem.qty > 0
                          ? const Color(0xFF8B5CF6).withValues(alpha: 0.15)
                          : Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Top Image Container (63% Height)
                    Expanded(
                      flex: 63,
                      child: Stack(
                        children: [
                          Positioned.fill(
                            child: ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(3.5)),
                              child: p.imageUrl.isNotEmpty
                                  ? Image.network(
                                      p.imageUrl,
                                      width: double.infinity,
                                      height: double.infinity,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) => Container(
                                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                        child: const Center(
                                          child: Column(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(Icons.inventory_2_outlined, size: 22, color: Color(0xFF94A3B8)),
                                              SizedBox(height: 2),
                                              Text(
                                                'NO IMAGE',
                                                style: TextStyle(
                                                  fontSize: 8,
                                                  fontWeight: FontWeight.bold,
                                                  color: Color(0xFF94A3B8),
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    )
                                  : Container(
                                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                                      child: const Center(
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(Icons.inventory_2_outlined, size: 22, color: Color(0xFF94A3B8)),
                                            SizedBox(height: 2),
                                            Text(
                                              'NO IMAGE',
                                              style: TextStyle(
                                                fontSize: 8,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF94A3B8),
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                            ),
                          ),
                          // Stock Badge
                          Positioned(
                            top: 6,
                            left: 6,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B).withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                '${p.stock}',
                                style: const TextStyle(
                                  fontSize: 9.5,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          // Cart Qty Badge
                          if (inCartItem.qty > 0)
                            Positioned(
                              top: 6,
                              right: 6,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF8B5CF6),
                                  borderRadius: BorderRadius.circular(4),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Text(
                                  '${inCartItem.qty} in cart',
                                  style: const TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),

                    // 2. Bottom Content Container (37% Height)
                    Expanded(
                      flex: 37,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.name,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 1),
                                Text(
                                  'SKU: ${p.sku}',
                                  style: const TextStyle(
                                    fontSize: 9,
                                    color: Color(0xFF94A3B8),
                                    fontFamily: 'monospace',
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      FittedBox(
                                        fit: BoxFit.scaleDown,
                                        alignment: Alignment.centerLeft,
                                        child: Text(
                                          '৳${p.price.toStringAsFixed(2)}',
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w900,
                                            color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 1),
                                      Row(
                                        children: [
                                          Container(
                                            width: 4.5,
                                            height: 4.5,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF10B981),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 3),
                                          const Text(
                                            'In Stock',
                                            style: TextStyle(
                                              fontSize: 8,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF10B981),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 4),
                                InkWell(
                                  onTap: () => retailProvider.addToCart(p),
                                  borderRadius: BorderRadius.circular(4),
                                  child: Container(
                                    width: 24,
                                    height: 24,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF8B5CF6),
                                      borderRadius: BorderRadius.circular(4),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1.5),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(Icons.add_rounded, size: 15, color: Colors.white),
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
            );
          },
        );
      },
    );
  }

  Widget _buildPaginationFooter(
    BuildContext context,
    int totalProducts,
    int currentPage,
    int totalPages,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Text(
              'Showing ${totalProducts < itemsPerPage ? totalProducts : itemsPerPage} of $totalProducts products (Page $currentPage of $totalPages)',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Prev Button
                InkWell(
                  onTap: currentPage > 1 ? () => onPageChanged(currentPage - 1) : null,
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.chevron_left_rounded,
                          size: 14,
                          color: currentPage > 1
                              ? (isDark ? Colors.white : const Color(0xFF475569))
                              : Colors.grey.shade400,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          'Prev',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: currentPage > 1
                                ? (isDark ? Colors.white : const Color(0xFF475569))
                                : Colors.grey.shade400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 4),

                // Page Numbers
                ...List.generate(totalPages, (index) {
                  final pageNum = index + 1;
                  final isActive = pageNum == currentPage;
                  return Padding(
                    padding: const EdgeInsets.only(right: 4.0),
                    child: InkWell(
                      onTap: () => onPageChanged(pageNum),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFF8B5CF6)
                              : (isDark ? const Color(0xFF2A2A2A) : Colors.white),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: isActive
                                ? const Color(0xFF8B5CF6)
                                : (isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1)),
                          ),
                        ),
                        child: Center(
                          child: Text(
                            '$pageNum',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isActive ? Colors.white : (isDark ? Colors.white : const Color(0xFF475569)),
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),

                // Next Button
                InkWell(
                  onTap: currentPage < totalPages ? () => onPageChanged(currentPage + 1) : null,
                  borderRadius: BorderRadius.circular(4),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: isDark ? const Color(0xFF3A3A3A) : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(
                          'Next',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: currentPage < totalPages
                                ? (isDark ? Colors.white : const Color(0xFF475569))
                                : Colors.grey.shade400,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 14,
                          color: currentPage < totalPages
                              ? (isDark ? Colors.white : const Color(0xFF475569))
                              : Colors.grey.shade400,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
