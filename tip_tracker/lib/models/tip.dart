import 'package:intl/intl.dart';

class Tip {
  final int? id;
  final double amount;
  final String paymentMethod;
  final DateTime date;
  final DateTime createdAt;
  final DateTime updatedAt;

  Tip({
    this.id,
    required this.amount,
    this.paymentMethod = 'Cash',
    required this.date,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    final map = <String, dynamic>{
      'amount': amount,
      'payment_method': paymentMethod,
      'date': DateFormat('yyyy-MM-dd').format(date),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
    if (id != null) {
      map['id'] = id;
    }
    return map;
  }

  static Tip fromMap(Map<String, dynamic> map) {
    return Tip(
      id: map['id'] as int,
      amount: (map['amount'] as num).toDouble(),
      paymentMethod: (map['payment_method'] as String?) ?? 'Cash',
      date: DateTime.parse(map['date'] as String),
      createdAt: DateTime.parse(map['created_at'] as String),
      updatedAt: DateTime.parse(map['updated_at'] as String),
    );
  }

  Tip copyWith({
    int? id,
    double? amount,
    String? paymentMethod,
    DateTime? date,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Tip(
      id: id ?? this.id,
      amount: amount ?? this.amount,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      date: date ?? this.date,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
