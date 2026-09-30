import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../sales_orders/screens/sales_orders_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final locale = appProvider.locale;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final surfaceColor = isDark ? const Color(0xFF1A1A1A) : Colors.white;
    final bgColor = isDark ? const Color(0xFF0F0F0F) : Colors.grey.shade50;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ───────────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
              decoration: BoxDecoration(
                color: surfaceColor,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF6D00).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.storefront_rounded,
                      color: Color(0xFFFF6D00),
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppStrings.get('app_name', locale),
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: theme.colorScheme.onSurface,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          AppStrings.get('app_subtitle', locale),
                          style: TextStyle(
                            fontSize: 13,
                            color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  
                  // New Header Actions (Theme & Language)
                  if (MediaQuery.of(context).size.width >= 600) ...[
                    IconButton(
                      icon: Icon(
                        appProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                        color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                      onPressed: () => appProvider.toggleTheme(),
                      tooltip: AppStrings.get(appProvider.isDarkMode ? 'light_mode' : 'dark_mode', locale),
                    ),

                    const SizedBox(width: 4),
                    _HeaderLangButton(appProvider: appProvider, locale: locale, theme: theme),
                    const SizedBox(width: 12),
                  ],

                  // 3-dot menu for mobile (Settings, Theme, Lang)
                  if (MediaQuery.of(context).size.width < 600)
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_vert_rounded, color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
                      color: surfaceColor,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onSelected: (val) {
                        if (val == 'settings') {
                          _showSettings(context, appProvider, locale, theme);
                        } else if (val == 'toggle_theme') {
                          appProvider.toggleTheme();
                        } else if (val == 'toggle_lang') {
                          appProvider.setLocale(appProvider.locale == 'en' ? 'bn' : 'en');
                        }
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'toggle_theme',
                          child: Row(
                            children: [
                              Icon(appProvider.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded, size: 20),
                              const SizedBox(width: 12),
                              Text(AppStrings.get(appProvider.isDarkMode ? 'light_mode' : 'dark_mode', locale)),
                            ],
                          ),
                        ),

                        PopupMenuItem(
                          value: 'toggle_lang',
                          child: Row(
                            children: [
                              const Icon(Icons.language_rounded, size: 20),
                              const SizedBox(width: 12),
                              Text(appProvider.locale == 'en' ? 'বাংলা' : 'English'),
                            ],
                          ),
                        ),
                        const PopupMenuDivider(),
                        PopupMenuItem(
                          value: 'settings',
                          child: Row(
                            children: [
                              const Icon(Icons.settings_input_composite_rounded, size: 20),
                              const SizedBox(width: 12),
                              Text(AppStrings.get('hardware_settings', locale)),
                            ],
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),



            // ── Grid ─────────────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1000),
                    child: Wrap(
                      spacing: 20,
                      runSpacing: 20,
                      alignment: WrapAlignment.center,
                      children: [
                        _ModuleCard(
                          title: AppStrings.get('restaurant_pos', locale),
                          description: AppStrings.get('restaurant_pos_desc', locale),
                          icon: Icons.restaurant_rounded,
                          color: const Color(0xFFFF6D00),
                          isActive: true,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const BusinessSalesOrdersScreen(businessType: 'restaurant'),
                            ),
                          ),
                        ),
                        _ModuleCard(
                          title: AppStrings.get('grocery_pos', locale),
                          description: AppStrings.get('grocery_pos_desc', locale),
                          icon: Icons.local_grocery_store_rounded,
                          color: const Color(0xFF2E7D32),
                          isActive: true,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const BusinessSalesOrdersScreen(businessType: 'grocery'),
                            ),
                          ),
                        ),
                        _ModuleCard(
                          title: AppStrings.get('pharmacy_pos', locale),
                          description: AppStrings.get('pharmacy_pos_desc', locale),
                          icon: Icons.local_pharmacy_rounded,
                          color: const Color(0xFF1565C0),
                          isActive: true,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const BusinessSalesOrdersScreen(businessType: 'pharmacy'),
                            ),
                          ),
                        ),
                        _ModuleCard(
                          title: AppStrings.get('wholesaler_pos', locale),
                          description: AppStrings.get('wholesaler_pos_desc', locale),
                          icon: Icons.inventory_2_rounded,
                          color: const Color(0xFF4F46E5),
                          isActive: true,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const BusinessSalesOrdersScreen(businessType: 'wholesaler'),
                            ),
                          ),
                        ),
                        _ModuleCard(
                          title: AppStrings.get('fashion_retail', locale),
                          description: AppStrings.get('fashion_retail_desc', locale),
                          icon: Icons.shopping_bag_rounded,
                          color: const Color(0xFFC62828),
                          isActive: true,
                          isDark: isDark,
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const BusinessSalesOrdersScreen(businessType: 'retail'),
                            ),
                          ),
                        ),
                        _ModuleCard(
                          title: AppStrings.get('dashboard', locale),
                          description: AppStrings.get('dashboard_desc', locale),
                          icon: Icons.analytics_rounded,
                          color: const Color(0xFF00695C),
                          isActive: false,
                          isDark: isDark,
                          comingSoonLabel: AppStrings.get('coming_soon', locale),
                          onTap: () => _snack(context, '📊 ${AppStrings.get('dashboard', locale)} ${AppStrings.get('coming_soon_msg', locale)}'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _snack(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      backgroundColor: Colors.black87,
    ));
  }

  void _showSettings(
    BuildContext context,
    AppProvider appProvider,
    String locale,
    ThemeData theme,
  ) {
    showDialog(
      context: context,
      builder: (_) => ChangeNotifierProvider.value(
        value: appProvider,
        child: const _SettingsDialog(),
      ),
    );
  }
}

// ── Header Language Button ──────────────────────────────────────
class _HeaderLangButton extends StatelessWidget {
  final AppProvider appProvider;
  final String locale;
  final ThemeData theme;

  const _HeaderLangButton({required this.appProvider, required this.locale, required this.theme});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        appProvider.setLocale(appProvider.locale == 'en' ? 'bn' : 'en');
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: theme.colorScheme.onSurface.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: theme.colorScheme.onSurface.withValues(alpha: 0.1)),
        ),
        child: Text(
          appProvider.locale == 'en' ? 'BN' : 'EN',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.8),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SETTINGS DIALOG
// ─────────────────────────────────────────────────────────────────
class _SettingsDialog extends StatelessWidget {
  const _SettingsDialog();

  static const primaryOrange = Color(0xFFFF6D00);

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final locale = appProvider.locale;
    final isDark = appProvider.isDarkMode;
    final theme = Theme.of(context);
    final surfaceColor = isDark ? const Color(0xFF1A1A1A) : Colors.white;
    final dividerColor = isDark ? const Color(0xFF2A2A2A) : Colors.grey.shade100;
    final textColor = theme.colorScheme.onSurface;

    return AlertDialog(
      backgroundColor: surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      contentPadding: EdgeInsets.zero,
      titlePadding: EdgeInsets.zero,
      title: Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 8, 16),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: dividerColor)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: primaryOrange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.tune_rounded, color: primaryOrange, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                AppStrings.get('settings', locale),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: textColor,
                ),
              ),
            ),
            IconButton(
              icon: Icon(Icons.close_rounded, color: textColor.withValues(alpha: 0.5)),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
      content: SizedBox(
        width: 320,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── APPEARANCE ───────────────────────────────────────────
            _SettingsSectionHeader(
              label: AppStrings.get('appearance', locale),
              icon: Icons.palette_outlined,
              textColor: textColor,
            ),

            // Dark Mode toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.indigo.shade900.withValues(alpha: 0.5)
                          : Colors.indigo.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                      color: isDark ? Colors.indigo.shade300 : Colors.indigo.shade700,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      AppStrings.get('dark_mode', locale),
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: textColor,
                      ),
                    ),
                  ),
                  Switch(
                    value: isDark,
                    onChanged: (_) => appProvider.toggleTheme(),
                    activeThumbColor: primaryOrange,
                  ),
                ],
              ),
            ),

            Divider(color: dividerColor, height: 20, indent: 16, endIndent: 16),

            // ── LANGUAGE ─────────────────────────────────────────────
            _SettingsSectionHeader(
              label: AppStrings.get('language', locale),
              icon: Icons.language_rounded,
              textColor: textColor,
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Expanded(
                    child: _LangButton(
                      label: 'English',
                      flag: '🇬🇧',
                      selected: locale == 'en',
                      isDark: isDark,
                      onTap: () => appProvider.setLocale('en'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _LangButton(
                      label: 'বাংলা',
                      flag: '🇧🇩',
                      selected: locale == 'bn',
                      isDark: isDark,
                      onTap: () => appProvider.setLocale('bn'),
                    ),
                  ),
                ],
              ),
            ),

            Divider(color: dividerColor, height: 20, indent: 16, endIndent: 16),

            // ── CURRENCY ─────────────────────────────────────────────
            _SettingsSectionHeader(
              label: AppStrings.get('currency', locale),
              icon: Icons.monetization_on_outlined,
              textColor: textColor,
            ),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFF006400).withValues(alpha: isDark ? 0.2 : 0.07),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF006400).withValues(alpha: 0.25),
                  ),
                ),
                child: Row(
                  children: [
                    const Text('৳', style: TextStyle(fontSize: 22, color: Color(0xFF006400), fontWeight: FontWeight.w900)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppStrings.get('currency_desc', locale),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF006400),
                            ),
                          ),
                          Text(
                            locale == 'en' ? 'Fixed — cannot be changed' : 'নির্ধারিত — পরিবর্তন করা যাবে না',
                            style: TextStyle(
                              fontSize: 11,
                              color: const Color(0xFF006400).withValues(alpha: 0.75),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.lock_outline_rounded, color: Color(0xFF006400), size: 18),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Settings Section Header ──────────────────────────────────────
class _SettingsSectionHeader extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color textColor;

  const _SettingsSectionHeader({
    required this.label,
    required this.icon,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
      child: Row(
        children: [
          Icon(icon, size: 14, color: textColor.withValues(alpha: 0.45)),
          const SizedBox(width: 6),
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: textColor.withValues(alpha: 0.45),
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Language Button ──────────────────────────────────────────────
class _LangButton extends StatelessWidget {
  final String label;
  final String flag;
  final bool selected;
  final bool isDark;
  final VoidCallback onTap;

  const _LangButton({
    required this.label,
    required this.flag,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  static const primaryOrange = Color(0xFFFF6D00);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? primaryOrange.withValues(alpha: isDark ? 0.2 : 0.1)
              : (isDark ? const Color(0xFF2A2A2A) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? primaryOrange : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            Text(flag, style: const TextStyle(fontSize: 22)),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: selected ? primaryOrange : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// MODULE CARD
// ─────────────────────────────────────────────────────────────────
class _ModuleCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final bool isActive;
  final bool isDark;
  final String comingSoonLabel;
  final VoidCallback onTap;

  const _ModuleCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.isActive,
    required this.isDark,
    this.comingSoonLabel = 'SOON',
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final textColor = isDark ? Colors.white : Colors.black87;
    final subtextColor = isDark ? Colors.grey.shade400 : Colors.grey.shade500;
    final borderColor = isActive
        ? color.withValues(alpha: 0.4)
        : (isDark ? const Color(0xFF2A2A2A) : Colors.grey.shade200);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: 280,
        height: 185,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderColor, width: isActive ? 2 : 1),
          boxShadow: [
            BoxShadow(
              color: isActive
                  ? color.withValues(alpha: isDark ? 0.25 : 0.15)
                  : Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(11),
                  decoration: BoxDecoration(
                    color: isActive
                        ? color.withValues(alpha: isDark ? 0.2 : 0.1)
                        : (isDark ? const Color(0xFF2A2A2A) : Colors.grey.shade100),
                    borderRadius: BorderRadius.circular(13),
                  ),
                  child: Icon(
                    icon,
                    size: 28,
                    color: isActive ? color : (isDark ? Colors.grey.shade500 : Colors.grey.shade400),
                  ),
                ),
                if (!isActive)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF2A2A2A) : Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      comingSoonLabel,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.grey.shade500 : Colors.grey,
                      ),
                    ),
                  ),
              ],
            ),
            const Spacer(),
            Text(
              title,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w800,
                color: isActive ? textColor : subtextColor,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              description,
              style: TextStyle(
                fontSize: 12,
                color: subtextColor,
                fontWeight: FontWeight.w500,
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
