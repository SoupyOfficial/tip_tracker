import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:tip_tracker/models/tip.dart';
import 'package:tip_tracker/services/database_helper.dart';
import 'package:tip_tracker/screens/add_edit_tip_screen.dart';

class TipHistoryScreen extends StatefulWidget {
  const TipHistoryScreen({super.key});

  @override
  State<TipHistoryScreen> createState() => _TipHistoryScreenState();
}

class _TipHistoryScreenState extends State<TipHistoryScreen> {
  final _dbHelper = DatabaseHelper.instance;
  List<Tip> _tips = [];
  bool _isLoading = true;
  String? _filterMethod;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final tips = await _dbHelper.getTips();
    setState(() {
      _tips = tips;
      _isLoading = false;
    });
  }

  List<Tip> get _filteredTips {
    if (_filterMethod == null) return _tips;
    return _tips.where((t) => t.paymentMethod == _filterMethod).toList();
  }

  Future<void> _deleteTip(Tip tip) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'Delete this \$${tip.amount.toStringAsFixed(2)} tip from ${DateFormat('MMM d, yyyy').format(tip.date)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _dbHelper.deleteTip(tip.id!);
      _loadData();
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Tip deleted')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tip History'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_tips.isEmpty) {
      return const Center(child: Text('No tips recorded yet'));
    }
    return Column(
      children: [
        _buildFilterChips(),
        Expanded(child: _buildTipList()),
      ],
    );
  }

  Widget _buildFilterChips() {
    // Collect all unique methods from actual tips (not just the payment_methods table)
    final usedMethods = _tips.map((t) => t.paymentMethod).toSet().toList()
      ..sort();
    if (usedMethods.length <= 1) return const SizedBox.shrink();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          FilterChip(
            label: const Text('All'),
            selected: _filterMethod == null,
            onSelected: (_) => setState(() => _filterMethod = null),
          ),
          const SizedBox(width: 8),
          ...usedMethods.map(
            (m) => Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(m),
                selected: _filterMethod == m,
                onSelected: (_) => setState(
                  () => _filterMethod = _filterMethod == m ? null : m,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTipList() {
    final tips = _filteredTips;
    if (tips.isEmpty) {
      return const Center(child: Text('No tips for this filter'));
    }
    return ListView.builder(
      itemCount: tips.length,
      itemBuilder: (context, index) {
        final tip = tips[index];
        return ListTile(
          title: Text(DateFormat('MMM d, yyyy').format(tip.date)),
          subtitle: Text(tip.paymentMethod),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '\$${tip.amount.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () async {
                  final result = await Navigator.push<bool>(
                    context,
                    MaterialPageRoute(
                      builder: (_) => AddEditTipScreen(tip: tip),
                    ),
                  );
                  if (result == true) _loadData();
                },
              ),
              IconButton(
                icon: const Icon(Icons.delete),
                onPressed: () => _deleteTip(tip),
              ),
            ],
          ),
        );
      },
    );
  }
}
