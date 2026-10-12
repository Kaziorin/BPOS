import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/utils/number_utils.dart';
import '../providers/grocery_provider.dart';
import '../theme/grocery_colors.dart';
import '../../../core/widgets/fullscreen_button.dart';
import 'dialogs/grocery_dialogs.dart';

class GroceryHeader extends StatelessWidget {
  const GroceryHeader({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    final locale = app.locale;
    final isDark = app.isDarkMode;
    final width = MediaQuery.of(context).size.width;
    final isCompact = width < 900;
    final isMobile = width < 600;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 12 : 16,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: GroceryColors.cardBg(isDark).withValues(alpha: 0.92),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        border: Border(
          bottom: BorderSide(color: GroceryColors.border(isDark), width: 1),
        ),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Row(
        children: [
          // Back button on web/desktop view (only shown if there is a previous route)
          if (!isMobile && (ModalRoute.of(context)?.canPop ?? false)) ...[
            _BackBtn(isDark: isDark),
            const SizedBox(width: 10),
          ],

          // Logo
          _Logo(locale: locale, compact: isCompact),
          SizedBox(width: isMobile ? 8 : 16),

          // Search
          Expanded(child: _SearchBar(locale: locale, isDark: isDark)),

          if (!isMobile) ...[
            const SizedBox(width: 12),
            _StatusTiles(locale: locale, isDark: isDark, compact: isCompact),
          ],

          const SizedBox(width: 8),
          // Fullscreen (Desktop only)
          if (!isMobile) ...[
            FullscreenButton(
              builder: (context, isFull, toggle) => _IconChip(
                icon: isFull ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                isDark: isDark,
                onTap: toggle,
              ),
            ),
            const SizedBox(width: 6),
          ],
          // Theme
          _IconChip(
            icon: app.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
            isDark: isDark,
            onTap: () => app.toggleTheme(),
          ),
          const SizedBox(width: 6),
          // Language
          _LangChip(
            label: locale == 'en' ? 'BN' : 'EN',
            isDark: isDark,
            onTap: () => app.setLocale(locale == 'en' ? 'bn' : 'en'),
          ),
          const SizedBox(width: 4),
          // Back
          _IconChip(
            icon: Icons.home_rounded,
            isDark: isDark,
            onTap: () => Navigator.of(context).maybePop(),
          ),
        ],
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  final String locale;
  final bool compact;
  const _Logo({required this.locale, required this.compact});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: compact ? 36 : 42,
          height: compact ? 36 : 42,
          decoration: BoxDecoration(
            gradient: GroceryColors.primaryGradient,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: GroceryColors.primary.withValues(alpha: 0.35),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(Icons.shopping_cart_rounded, color: Colors.white, size: 22),
        ),
        if (!compact) ...[
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                AppStrings.get('freshmart', locale),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: isDark ? GroceryColors.accent : GroceryColors.primaryDark,
                  height: 1.1,
                  letterSpacing: -0.3,
                ),
              ),
              Text(
                AppStrings.get('pos_system', locale),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: GroceryColors.textSecondary(isDark),
                  letterSpacing: 0.8,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _SearchBar extends StatelessWidget {
  final String locale;
  final bool isDark;
  const _SearchBar({required this.locale, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: isDark ? GroceryColors.inputBg(true) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: GroceryColors.border(isDark)),
        boxShadow: GroceryColors.softShadow(isDark),
      ),
      child: Row(
        children: [
          const SizedBox(width: 14),
          Icon(Icons.search_rounded, size: 20, color: GroceryColors.textSecondary(isDark)),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              onChanged: (v) => context.read<GroceryProvider>().setSearchQuery(v),
              style: TextStyle(fontSize: 13, color: GroceryColors.textPrimary(isDark)),
              decoration: InputDecoration(
                hintText: AppStrings.get('g_search_hint', locale),
                hintStyle: TextStyle(
                  fontSize: 12,
                  color: GroceryColors.textSecondary(isDark).withValues(alpha: 0.7),
                ),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
          Container(
            margin: const EdgeInsets.all(4),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  final provider = context.read<GroceryProvider>();
                  showDialog(
                    context: context,
                    builder: (_) => ChangeNotifierProvider.value(
                      value: provider,
                      child: const GroceryBarcodeDialog(),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: GroceryColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(Icons.qr_code_scanner_rounded, size: 18, color: GroceryColors.primary),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusTiles extends StatelessWidget {
  final String locale;
  final bool isDark;
  final bool compact;
  const _StatusTiles({required this.locale, required this.isDark, required this.compact});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<GroceryProvider>();
    final now = DateTime.now();
    final time = DateFormat('h:mm a').format(now);
    final date = DateFormat('d MMM yyyy').format(now);

    final tiles = [
      _TileData(
        icon: Icons.person_rounded,
        title: provider.customer.localizedName(locale),
        subtitle: provider.customer.id == 'c0'
            ? AppStrings.get('default_customer', locale)
            : provider.customer.phone,
        color: GroceryColors.primary,
        onTap: () {
          showDialog(
            context: context,
            builder: (_) => ChangeNotifierProvider.value(
              value: provider,
              child: const GroceryCustomerDialog(),
            ),
          );
        },
      ),
      _TileData(
        icon: Icons.star_rounded,
        title: AppStrings.get('loyalty_points', locale),
        subtitle: '${NumberUtils.toLocalized(provider.loyaltyPoints, locale)} ${AppStrings.get('pts', locale)}',
        color: const Color(0xFFF59E0B),
      ),
      if (!compact)
        _TileData(
          icon: Icons.receipt_long_rounded,
          title: AppStrings.get('invoice', locale),
          subtitle: provider.invoiceNo,
          color: const Color(0xFF3B82F6),
          onTap: () {
            showDialog(
              context: context,
              builder: (_) => ChangeNotifierProvider.value(
                value: provider,
                child: const GrocerySalesHistoryDialog(),
              ),
            );
          },
        ),
      _TileData(
        icon: Icons.access_time_rounded,
        title: NumberUtils.toLocalized(time, locale),
        subtitle: NumberUtils.toLocalized(date, locale),
        color: const Color(0xFF8B5CF6),
      ),
    ];

    return Row(
      children: [
        for (int i = 0; i < tiles.length; i++) ...[
          if (i > 0) const SizedBox(width: 8),
          _StatusTile(data: tiles[i], isDark: isDark),
        ],
      ],
    );
  }
}

class _TileData {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback? onTap;
  const _TileData({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    this.onTap,
  });
}

class _StatusTile extends StatelessWidget {
  final _TileData data;
  final bool isDark;
  const _StatusTile({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: data.onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isDark ? GroceryColors.inputBg(true) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: GroceryColors.border(isDark)),
            boxShadow: GroceryColors.softShadow(isDark),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: data.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(data.icon, size: 14, color: data.color),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    data.title,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: GroceryColors.textPrimary(isDark),
                      height: 1.2,
                    ),
                  ),
                  Text(
                    data.subtitle,
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w500,
                      color: GroceryColors.textSecondary(isDark),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IconChip extends StatelessWidget {
  final IconData icon;
  final bool isDark;
  final VoidCallback onTap;
  const _IconChip({required this.icon, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark ? GroceryColors.inputBg(true) : GroceryColors.primarySoft,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: GroceryColors.border(isDark)),
          ),
          child: Icon(icon, size: 18, color: GroceryColors.primaryDark),
        ),
      ),
    );
  }
}

class _LangChip extends StatelessWidget {
  final String label;
  final bool isDark;
  final VoidCallback onTap;
  const _LangChip({required this.label, required this.isDark, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            gradient: GroceryColors.primaryGradient,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: GroceryColors.primary.withValues(alpha: 0.3),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}

class _BackBtn extends StatelessWidget {
  final bool isDark;
  const _BackBtn({required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          if (Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
          } else {
            Navigator.of(context).maybePop();
          }
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: isDark ? GroceryColors.inputBg(true) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: GroceryColors.border(isDark)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Icon(
            Icons.arrow_back_rounded,
            size: 20,
            color: GroceryColors.textPrimary(isDark),
          ),
        ),
      ),
    );
  }
}
