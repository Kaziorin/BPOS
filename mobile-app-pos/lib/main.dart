import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/app_provider.dart';
import 'core/providers/pos_provider.dart';
import 'features/retail_pos/providers/retail_provider.dart';
import 'features/wholesaler_pos/providers/wholesaler_provider.dart';
import 'features/pharmacy_pos/providers/pharmacy_provider.dart';
import 'features/grocery_pos/providers/grocery_provider.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/sales_orders/screens/sales_orders_screen.dart';
import 'features/home/screens/business_selection_screen.dart';

class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.trackpad,
        PointerDeviceKind.stylus,
      };
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final appProvider = AppProvider();
  await appProvider.init();
  runApp(ZestBiteApp(appProvider: appProvider));
}

class ZestBiteApp extends StatelessWidget {
  final AppProvider appProvider;
  const ZestBiteApp({super.key, required this.appProvider});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: appProvider),
        ChangeNotifierProvider(create: (_) => POSProvider()),
        ChangeNotifierProvider(create: (_) => RetailProvider()),
        ChangeNotifierProvider(create: (_) => WholesalerProvider()),
        ChangeNotifierProvider(create: (_) => PharmacyProvider()),
        ChangeNotifierProvider(create: (_) => GroceryProvider()),
      ],
      child: Consumer<AppProvider>(
        builder: (context, appProvider, _) {
          return MaterialApp(
            title: 'Blue Oceans POS',
            debugShowCheckedModeBanner: false,
            scrollBehavior: const AppScrollBehavior(),
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: appProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
            locale: Locale(appProvider.locale),
            supportedLocales: const [
              Locale('en', ''),
              Locale('bn', ''),
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: _resolveRootScreen(appProvider),
          );
        },
      ),
    );
  }

  Widget _resolveRootScreen(AppProvider appProvider) {
    // 1. Not logged in -> Show Login Screen
    if (!appProvider.isAuthenticated) {
      return const LoginScreen();
    }

    // 2. Logged in and has an active selected business (or single business account) ->
    // Directly lands on that business's Sales Orders & POS view!
    if (appProvider.selectedBusiness != null) {
      return BusinessSalesOrdersScreen(
        businessType: appProvider.activeBusiness,
      );
    }

    // 3. Multi-business account without active selection -> Show Business Selector
    return const BusinessSelectionScreen();
  }
}
