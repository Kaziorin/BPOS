import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';

class PharmacyMobileBottomBar extends StatelessWidget {
  final VoidCallback onOpenCart;

  const PharmacyMobileBottomBar({super.key, required this.onOpenCart});

  @override
  Widget build(BuildContext context) {
    const primaryTeal = Color(0xFF00897B);

    return Consumer<PharmacyProvider>(
      builder: (context, provider, _) {
        final totalCount = provider.cart.fold<int>(0, (sum, item) => sum + item.quantity);
        final totalAmount = provider.total;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: context.isDark ? context.cardBg : Colors.white,
            border: Border(
              top: BorderSide(
                color: context.isDark ? context.dividerColor : Colors.grey.shade200,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: Row(
            children: [
              // Order total & item count
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$totalCount ${totalCount == 1 ? 'ITEM' : 'ITEMS'} IN CART',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: primaryTeal,
                      letterSpacing: 0.4,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '৳ ${totalAmount.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: context.textPrimary,
                    ),
                  ),
                ],
              ),
              const Spacer(),

              // View Cart Button
              ElevatedButton.icon(
                onPressed: onOpenCart,
                icon: const Icon(Icons.shopping_cart_outlined, size: 18),
                label: Text(
                  totalCount > 0 ? 'View Cart ($totalCount)' : 'View Cart',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryTeal,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
