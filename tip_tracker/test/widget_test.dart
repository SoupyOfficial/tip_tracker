import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:tip_tracker/main.dart';

void main() {
  setUpAll(() {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  });

  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const TipTrackerApp());
    await tester.pump();
    expect(find.text('Tip Tracker'), findsOneWidget);
  });
}
