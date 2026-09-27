import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/pos_provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/theme/theme_extensions.dart';
import '../widgets/pos_header.dart';
import '../widgets/pos_info_bar.dart';
import '../widgets/category_sidebar.dart';
import '../widgets/menu_grid.dart';
import '../widgets/order_summary_panel.dart';
import '../widgets/bottom_action_bar.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({super.key});

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isTablet = screenWidth >= 768;

    return Scaffold(
      backgroundColor: context.scaffoldBg,
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxHeight < 200) {
            return const SingleChildScrollView(
              child: Column(
                children: [
                  POSHeader(),
                  POSInfoBar(),
                ],
              ),
            );
          }

          return Column(
            children: [
              const POSHeader(),
              const POSInfoBar(),
              Expanded(
                child: isTablet ? _buildTabletLayout(context) : _buildMobileLayout(context),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildTabletLayout(BuildContext context) {
    return const Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Column(
            children: [
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    CategorySidebar(),
                    Expanded(child: MenuGrid()),
                  ],
                ),
              ),
              BottomActionBar(),
            ],
          ),
        ),
        OrderSummaryPanel(),
      ],
    );
  }

  Widget _buildMobileLayout(BuildContext context) {
    final locale = context.watch<AppProvider>().locale;
    return Consumer<POSProvider>(
      builder: (context, provider, _) {
        return Stack(
          children: [
            Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 6, 12, 4),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: OrderTypeSegmentedControl(isMobile: true, locale: locale),
                  ),
                ),
                if (provider.isMobileSearchOpen)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(12, 4, 12, 4),
                    child: Material(
                      color: context.cardBg,
                      elevation: 0,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: context.cardBg,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.3 : 0.05), blurRadius: 16, offset: const Offset(0, 4)),
                            BoxShadow(color: Colors.black.withValues(alpha: context.isDark ? 0.2 : 0.03), blurRadius: 4, offset: const Offset(0, 2)),
                          ],
                        ),
                        child: Row(
                          children: [
                            const SizedBox(width: 8),
                            Container(
                              width: 28, height: 28,
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFFFF6D00), Color(0xFFFF9E45)],
                                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.search_rounded, color: Colors.white, size: 16),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: TextField(
                                autofocus: true,
                                onChanged: provider.setSearchQuery,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: context.textPrimary,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: 0.1,
                                ),
                                decoration: InputDecoration(
                                  hintText: AppStrings.get('find_dish', locale),
                                  hintStyle: TextStyle(color: context.textHint, fontSize: 13, fontWeight: FontWeight.w400),
                                  border: InputBorder.none,
                                  isDense: true,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () => provider.setMobileSearchOpen(false),
                              behavior: HitTestBehavior.opaque,
                              child: Icon(Icons.close_rounded, color: context.textSecondary, size: 18),
                            ),
                            const SizedBox(width: 10),
                          ],
                        ),
                      ),
                    ),
                  ),
                const MobileCategoryBar(),
                const Expanded(child: MenuGrid(isMobile: true)),
              ],
            ),
            Positioned(
              bottom: 16, right: 16,
              child: FloatingActionButton.extended(
                onPressed: () => _showMobileOrderSummary(context),
                backgroundColor: const Color(0xFFFF6D00),
                icon: const Icon(Icons.shopping_cart, color: Colors.white),
                label: Text(
                  '${provider.totalItemCount} ${AppStrings.get('items', locale).toLowerCase()} • ৳${provider.totalPayable.toStringAsFixed(2)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showMobileOrderSummary(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.5),
      builder: (ctx) => GestureDetector(
        onTap: () => Navigator.of(ctx).pop(),
        behavior: HitTestBehavior.opaque,
        child: DraggableScrollableSheet(
          initialChildSize: 0.85, maxChildSize: 0.95, minChildSize: 0.3,
          snap: true, snapSizes: const [0.3, 0.85, 0.95],
          builder: (_, scrollController) => GestureDetector(
            onTap: () {},
            behavior: HitTestBehavior.opaque,
            child: Container(
              decoration: BoxDecoration(
                color: context.cardBg,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(top: 12, bottom: 4),
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(color: context.dividerColor, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const Expanded(child: OrderSummaryPanel(isBottomSheet: true)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
