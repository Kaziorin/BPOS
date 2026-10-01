import 'package:flutter_test/flutter_test.dart';
import 'package:restaurant_pos/core/providers/app_provider.dart';
import 'package:restaurant_pos/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('App loads successfully smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    final appProvider = AppProvider();
    await appProvider.init();
    await tester.pumpWidget(ZestBiteApp(appProvider: appProvider));
    expect(find.byType(ZestBiteApp), findsOneWidget);
  });
}
