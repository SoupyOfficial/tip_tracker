import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:tip_tracker/models/tip.dart';
import 'package:intl/intl.dart';

class DatabaseHelper {
  DatabaseHelper._privateConstructor();
  static final DatabaseHelper instance = DatabaseHelper._privateConstructor();

  static const _databaseName = 'tip_tracker.db';
  static const _databaseVersion = 2;

  Database? _database;

  Future<Database> get database async {
    _database ??= await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _databaseName);
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE tips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Cash',
        date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
    await db.execute('''
      CREATE TABLE payment_methods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    ''');
    await db.insert('payment_methods', {'name': 'Cash'});
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute(
        "ALTER TABLE tips ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'Cash'",
      );
      await db.execute('''
        CREATE TABLE payment_methods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        )
      ''');
      await db.insert('payment_methods', {'name': 'Cash'});
    }
  }

  // --- Tip CRUD ---

  Future<int> insertTip(Tip tip) async {
    final db = await database;
    return await db.insert('tips', tip.toMap());
  }

  Future<List<Tip>> getTips() async {
    final db = await database;
    final maps = await db.query('tips', orderBy: 'date DESC, id DESC');
    return maps.map((map) => Tip.fromMap(map)).toList();
  }

  Future<List<Tip>> getTipsByDate(DateTime date) async {
    final db = await database;
    final dateStr = DateFormat('yyyy-MM-dd').format(date);
    final maps = await db.query(
      'tips',
      where: 'date = ?',
      whereArgs: [dateStr],
      orderBy: 'id DESC',
    );
    return maps.map((map) => Tip.fromMap(map)).toList();
  }

  Future<double> getTotalForDate(DateTime date) async {
    final db = await database;
    final dateStr = DateFormat('yyyy-MM-dd').format(date);
    final result = await db.rawQuery(
      'SELECT SUM(amount) as total FROM tips WHERE date = ?',
      [dateStr],
    );
    return (result.first['total'] as num?)?.toDouble() ?? 0.0;
  }

  Future<Map<String, double>> getTotalsByPaymentMethodForDate(
    DateTime date,
  ) async {
    final db = await database;
    final dateStr = DateFormat('yyyy-MM-dd').format(date);
    final result = await db.rawQuery(
      'SELECT payment_method, SUM(amount) as total FROM tips WHERE date = ? GROUP BY payment_method',
      [dateStr],
    );
    final map = <String, double>{};
    for (final row in result) {
      final method = row['payment_method'] as String;
      final total = (row['total'] as num?)?.toDouble() ?? 0.0;
      map[method] = total;
    }
    return map;
  }

  Future<int> updateTip(Tip tip) async {
    final db = await database;
    final now = DateTime.now();
    final updatedTip = tip.copyWith(updatedAt: now);
    return await db.update(
      'tips',
      updatedTip.toMap(),
      where: 'id = ?',
      whereArgs: [tip.id],
    );
  }

  Future<int> deleteTip(int id) async {
    final db = await database;
    return await db.delete('tips', where: 'id = ?', whereArgs: [id]);
  }

  // --- Payment Method CRUD ---

  Future<List<String>> getPaymentMethods() async {
    final db = await database;
    final maps = await db.query('payment_methods', orderBy: 'name ASC');
    return maps.map((m) => m['name'] as String).toList();
  }

  Future<void> insertPaymentMethod(String name) async {
    final db = await database;
    await db.insert('payment_methods', {
      'name': name,
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
  }

  Future<void> deletePaymentMethod(String name) async {
    final db = await database;
    await db.delete('payment_methods', where: 'name = ?', whereArgs: [name]);
  }
}
