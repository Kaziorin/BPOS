import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/theme_extensions.dart';
import '../providers/pharmacy_provider.dart';
import '../widgets/pharmacy_header.dart';
import '../widgets/category_sidebar.dart';
import '../widgets/medicine_grid.dart';
import '../widgets/quick_actions_bar.dart';
import '../widgets/generic_alternative_box.dart';
import '../widgets/pharmacy_cart_panel.dart';
import '../widgets/pharmacy_footer.dart';

class PharmacyPOSScreen extends StatefulWidget {
  const PharmacyPOSScreen({super.key});

  @override
  State<PharmacyPOSScreen> createState() => _PharmacyPOSScreenState();
}

class _PharmacyPOSScreenState extends State<PharmacyPOSScreen> {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => PharmacyProvider(),
      child: Scaffold(
        backgroundColor: context.scaffoldBg,
        body: Column(
          children: [
            Expanded(
              child: Row(
                children: [
                  // ── MAIN CONTENT (Left + Center) ──
                  Expanded(
                    flex: 7,
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(12, 8, 6, 8),
                      decoration: BoxDecoration(
                        color: context.isDark ? context.cardBg : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          if (!context.isDark)
                            BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 15, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Column(
                        children: [
                          const PharmacyHeader(),
                          const Divider(height: 1),
                          Expanded(
                            child: Row(
                              children: [
                                // Left Categories Sidebar
                                const CategorySidebar(),
                                
                                // Center Medicine Grid Area
                                Expanded(
                                  child: Column(
                                    children: [
                                      const SizedBox(height: 12),
                                      const Expanded(
                                        child: Padding(
                                          padding: EdgeInsets.symmetric(horizontal: 16.0),
                                          child: MedicineGrid(),
                                        ),
                                      ),
                                      const Padding(
                                        padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                                        child: GenericAlternativeBox(),
                                      ),
                                      const Padding(
                                        padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                                        child: QuickActionsBar(),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  
                  // ── CART PANEL (Right) ──
                  Expanded(
                    flex: 3,
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(6, 8, 12, 8),
                      child: const PharmacyCartPanel(),
                    ),
                  ),
                ],
              ),
            ),
            const PharmacyFooter(),
          ],
        ),
      ),
    );
  }
}
