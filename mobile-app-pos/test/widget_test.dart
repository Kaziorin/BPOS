import 'package:flutter_test/flutter_test.dart';
import 'package:restaurant_pos/main.dart';

void main() {
  testWidgets('App loads successfully smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ZestBiteApp());
    expect(find.byType(ZestBiteApp), findsOneWidget);
  });
}

