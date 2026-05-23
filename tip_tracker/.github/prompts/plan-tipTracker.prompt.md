# Plan: Tip Tracker MVP

Build an MVP Flutter app for tip workers to quickly record, backdate, view, edit, and delete tips using a local SQLite database. Three screens, one data model, minimal architecture — easy to extend later with Firestore and multi-account.

---

## Constraints & Decisions

- **Database**: `sqflite` — no code generation, simplest for MVP
- **State management**: plain `StatefulWidget` + `setState` — trivially upgradeable later
- **Multiple tips per day allowed** — each entry is its own row, not aggregated
- **Date-only granularity** — tips track which day, not time of day
- **Excluded from MVP**: charts, export, categories, authentication, cloud sync, multi-account
- **Loading states**: screens show `CircularProgressIndicator` while awaiting first DB load; initialize with safe defaults (`0.0` for totals, `[]` for lists)
- **Amount display**: use `toStringAsFixed(2)` with a `$` prefix everywhere (e.g. `'\$${amount.toStringAsFixed(2)}'`)
- **Imports**: all cross-file imports use package-style `import 'package:tip_tracker/...'` paths

---

## File Manifest

| Operation | Path | Depends On |
|-----------|------|------------|
| MODIFY | `pubspec.yaml` | — |
| CREATE | `lib/models/tip.dart` | — |
| CREATE | `lib/services/database_helper.dart` | `tip.dart` |
| CREATE | `lib/screens/home_screen.dart` | `database_helper.dart` |
| CREATE | `lib/screens/add_edit_tip_screen.dart` | `database_helper.dart` |
| CREATE | `lib/screens/tip_history_screen.dart` | `database_helper.dart`, `add_edit_tip_screen.dart` |
| MODIFY | `lib/main.dart` | `home_screen.dart` |
| MODIFY | `test/widget_test.dart` | `main.dart` |

---

## Tasks

Execute tasks in order. Each task lists its exact inputs, outputs, contracts, and acceptance criteria so an executor agent can complete it without additional context.

---

### Task 1 — Add dependencies to `pubspec.yaml`

**Operation**: MODIFY `pubspec.yaml`
**Depends on**: nothing
**What to do**: Under `dependencies:`, add:
```yaml
  sqflite: ^2.3.0
  path: ^1.9.0
  intl: ^0.19.0
```
Under `dev_dependencies:`, add:
```yaml
  sqflite_common_ffi: ^2.3.0
```
**Post-step**: Run `flutter pub get` — must exit 0
**Acceptance**: `flutter pub get` succeeds; `pubspec.lock` contains sqflite, sqflite_common_ffi, path, intl entries

---

### Task 2 — Create `Tip` data model

**Operation**: CREATE `lib/models/tip.dart`
**Depends on**: nothing (no imports outside dart core + intl)

**Contract — class `Tip`**:
```
Fields:
  int? id
  double amount
  DateTime date          // date-only (time portion ignored)
  DateTime createdAt
  DateTime updatedAt

Constructors:
  Tip({this.id, required this.amount, required this.date, required this.createdAt, required this.updatedAt})

Methods:
  Map<String, dynamic> toMap()
    → { if (id != null) 'id': id, 'amount': amount, 'date': DateFormat('yyyy-MM-dd').format(date), 'created_at': createdAt.toIso8601String(), 'updated_at': updatedAt.toIso8601String() }
    Note: conditionally include 'id' only when non-null so autoincrement works cleanly on insert

  static Tip fromMap(Map<String, dynamic> map)
    → constructs Tip from DB row; parses 'date' as DateTime, 'created_at'/'updated_at' as DateTime.parse

  Tip copyWith({int? id, double? amount, DateTime? date, DateTime? createdAt, DateTime? updatedAt})
    → returns new Tip with overridden fields
```

**Acceptance**: File compiles (`flutter analyze` reports no errors on this file)

---

### Task 3 — Create `DatabaseHelper` service

**Operation**: CREATE `lib/services/database_helper.dart`
**Depends on**: Task 2 (`Tip` model import)

**Contract — class `DatabaseHelper`**:
```
Access:
  DatabaseHelper._privateConstructor()          // private constructor
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor()

Database:
  static const _databaseName = 'tip_tracker.db'
  static const _databaseVersion = 1
  Database? _database
  Future<Database> get database async           // lazy-init, calls _initDatabase()

Schema (tips table):
  id            INTEGER PRIMARY KEY AUTOINCREMENT
  amount        REAL NOT NULL
  date          TEXT NOT NULL                   // 'yyyy-MM-dd'
  created_at    TEXT NOT NULL                   // ISO 8601
  updated_at    TEXT NOT NULL                   // ISO 8601

CRUD methods:
  Future<int> insertTip(Tip tip)
    → inserts tip.toMap() into 'tips', returns new row id (no ConflictAlgorithm — default abort on conflict)

  Future<List<Tip>> getTips()
    → SELECT * FROM tips ORDER BY date DESC, id DESC → List<Tip>

  Future<List<Tip>> getTipsByDate(DateTime date)
    → WHERE date = 'yyyy-MM-dd' formatted, ORDER BY id DESC → List<Tip>

  Future<double> getTotalForDate(DateTime date)
    → SELECT SUM(amount) WHERE date = 'yyyy-MM-dd' → double (0.0 if null)

  Future<int> updateTip(Tip tip)
    → UPDATE tips SET ... WHERE id = tip.id, auto-set updated_at to now → affected row count

  Future<int> deleteTip(int id)
    → DELETE FROM tips WHERE id = ? → affected row count
```

**Acceptance**: File compiles; all six public methods exist with correct return types

---

### Task 4 — Create Home Screen

**Operation**: CREATE `lib/screens/home_screen.dart`
**Depends on**: Task 3 (`DatabaseHelper`)

**Widget**: `HomeScreen` (StatefulWidget)

**Layout (top → bottom)**:
1. **AppBar** — title "Tip Tracker"
2. **Today's Summary Card** — shows formatted date (`MMMM d, yyyy`) and "Today's Tips: $XX.XX" from `getTotalForDate(DateTime.now())`
3. **Quick Entry Section** — card containing:
   - `TextField` with `TextInputType.numberWithOptions(decimal: true)`, hint "Tip amount", prefix "$"
   - "Add Tip" `ElevatedButton` — calls `insertTip()` with current date, clears field, shows `SnackBar("Tip added!")`, refreshes today's total
   - Validation: if field is empty or parses to <= 0, show `SnackBar("Enter a valid amount")`; do not insert
4. **Action Buttons Row** (two `OutlinedButton`s):
   - "Backdate a Tip" → `Navigator.push` to `AddEditTipScreen()` (no tip argument = add mode). On pop, if result == `true`, refresh today's total
   - "View History" → `Navigator.push` to `TipHistoryScreen()`. On pop, refresh today's total (data may have changed)

**Lifecycle**:
- `_isLoading` bool, starts `true`
- `initState()` calls `_loadTodayTotal()` which sets `_todayTotal` and flips `_isLoading = false` via `setState`
- While `_isLoading`, show `CircularProgressIndicator` in place of the summary card

**After quick-entry**: call `FocusScope.of(context).unfocus()` to dismiss keyboard before showing SnackBar

**Acceptance**: Screen renders; loading indicator appears briefly; quick-entry saves a tip, dismisses keyboard, updates summary; both nav buttons open correct screens

---

### Task 5 — Create Add/Edit Tip Screen

**Operation**: CREATE `lib/screens/add_edit_tip_screen.dart`
**Depends on**: Task 3 (`DatabaseHelper`), Task 2 (`Tip`)

**Widget**: `AddEditTipScreen` (StatefulWidget)

**Constructor**: `AddEditTipScreen({Tip? tip})` — if `tip` is non-null, screen is in **edit mode**; otherwise **add mode**

**Layout**:
1. **AppBar** — title "Add Tip" or "Edit Tip" based on mode
2. **Amount Field** — `TextFormField`, decimal keyboard, prefix "$", pre-filled with `tip.amount` in edit mode
   - Validator: non-empty, parses to double > 0
3. **Date Picker Row** — displays selected date (`MMMM d, yyyy`) + "Change" button that opens `showDatePicker`
   - Initial date: `tip.date` in edit mode, `DateTime.now()` in add mode
   - First date: `DateTime(2020, 1, 1)`
   - Last date: `DateTime.now()` (no future dates)
4. **Save Button** — full-width `ElevatedButton`:
   - Validates form
   - **Add mode**: calls `insertTip(Tip(amount: ..., date: selectedDate, createdAt: now, updatedAt: now))`
   - **Edit mode**: calls `updateTip(tip.copyWith(amount: ..., date: selectedDate, updatedAt: now))`
   - On success: `Navigator.pop(context, true)` — the `true` signals the caller to refresh
5. **Delete Button** (edit mode only) — `TextButton` with red text:
   - Shows `AlertDialog` confirmation: "Delete this tip?"
   - On confirm: calls `deleteTip(tip.id!)`, then `Navigator.pop(context, true)`

**Acceptance**: Add mode saves new tip and pops `true`; edit mode pre-fills and updates; delete shows dialog then removes tip; future dates are blocked

---

### Task 6 — Create Tip History Screen

**Operation**: CREATE `lib/screens/tip_history_screen.dart`
**Depends on**: Task 3 (`DatabaseHelper`), Task 5 (`AddEditTipScreen` for navigation)

**Widget**: `TipHistoryScreen` (StatefulWidget)

**Layout**:
1. **AppBar** — title "Tip History"
2. **Body** — if tips list is empty, show centered "No tips recorded yet" message. Otherwise:
   - `ListView.builder` of tip entries
   - Each `ListTile`:
     - **Title**: formatted date (`MMM d, yyyy`)
     - **Trailing**: formatted amount (`$XX.XX`) + `IconButton(Icons.edit)` + `IconButton(Icons.delete)`
   - **Edit tap**: `Navigator.push` to `AddEditTipScreen(tip: tip)`. On pop, if result == `true`, reload list
   - **Delete tap**: show `AlertDialog` "Delete this $XX.XX tip from <date>?". On confirm, call `deleteTip(tip.id!)`, reload list, show `SnackBar("Tip deleted")`

**Lifecycle**:
- `_isLoading` bool, starts `true`
- `initState()` calls `_loadTips()` which sets `_tips` list and flips `_isLoading = false` via `setState`
- While `_isLoading`, show centered `CircularProgressIndicator`

**Acceptance**: All tips display in descending date order; loading indicator shows briefly; edit navigates and returns refreshed; delete removes and refreshes; empty state shows message

---

### Task 7 — Update `lib/main.dart`

**Operation**: MODIFY `lib/main.dart` — replace entire file contents
**Depends on**: Task 4 (`HomeScreen`)

**Contract**:
```dart
import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TipTrackerApp());
}

class TipTrackerApp extends StatelessWidget {
  const TipTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tip Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
```

**Acceptance**: App launches showing HomeScreen with green-themed UI

---

### Task 8 — Update `test/widget_test.dart`

**Operation**: MODIFY `test/widget_test.dart` — replace entire file contents
**Depends on**: Task 7

**Contract**: Smoke test that initializes sqflite FFI (so `DatabaseHelper` works in test), pumps `TipTrackerApp`, and verifies the app renders:
```dart
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
    await tester.pumpAndSettle();
    expect(find.text('Tip Tracker'), findsOneWidget);
  });
}
```
**Why `sqflite_common_ffi`**: `sqflite` uses platform channels unavailable in `flutter test`. The FFI variant uses dart:ffi to talk to SQLite directly, making the real DB work in tests without mocks.

**Acceptance**: `flutter test` passes with no platform channel errors

---

## Execution Order & Parallelism

```
Task 1 (pubspec) ──────────────────────────┐
Task 2 (Tip model) ───────┐               │
                           ├─→ Task 3 (DatabaseHelper) ──┐
                           │                              ├─→ Task 4 (HomeScreen)
                           │                              ├─→ Task 5 (AddEditTipScreen)
                           │                              │          │
                           │                              │          ▼
                           │                              └─→ Task 6 (TipHistoryScreen)
                           │                                         │
                           └─────────────────────────────────────────┤
                                                                     ▼
                                                              Task 7 (main.dart)
                                                                     │
                                                                     ▼
                                                              Task 8 (widget_test)
```

- **Tasks 1 & 2**: independent, can execute in parallel
- **Task 3**: blocked on Task 2 (imports Tip model); Task 1 must have completed for `flutter pub get`
- **Tasks 4, 5**: independent of each other, both blocked on Task 3
- **Task 6**: blocked on Tasks 3 and 5 (navigates to AddEditTipScreen)
- **Task 7**: blocked on Task 4 (imports HomeScreen)
- **Task 8**: blocked on Task 7 (imports main.dart)

---

## Final Verification Checklist

Run these after all tasks are complete:

1. `flutter pub get` — exits 0
2. `flutter analyze` — zero errors, zero warnings
3. `flutter test` — all tests pass
4. Manual smoke test on iOS simulator:
   - [ ] Quick-entry: type amount → tap Add → SnackBar confirms → today's total updates
   - [ ] Backdate: tap "Backdate a Tip" → pick past date → enter amount → save → returns home
   - [ ] History: tap "View History" → all tips listed newest-first
   - [ ] Edit: tap edit icon on a tip → modify amount → save → history reflects change
   - [ ] Delete: tap delete icon → confirm dialog → tip removed → SnackBar confirms
   - [ ] Empty state: delete all tips → history shows "No tips recorded yet"
   - [ ] Validation: try adding $0 or empty → error SnackBar, no tip saved
   - [ ] Future date blocked: date picker won't allow dates past today
