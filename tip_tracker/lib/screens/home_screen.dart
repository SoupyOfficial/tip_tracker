import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:tip_tracker/models/tip.dart';
import 'package:tip_tracker/services/database_helper.dart';
import 'package:tip_tracker/screens/add_edit_tip_screen.dart';
import 'package:tip_tracker/screens/tip_history_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _amountController = TextEditingController();
  final _dbHelper = DatabaseHelper.instance;
  double _todayTotal = 0.0;
  Map<String, double> _todayByMethod = {};
  bool _isLoading = true;
  List<String> _paymentMethods = [];
  String _selectedPaymentMethod = 'Cash';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final total = await _dbHelper.getTotalForDate(DateTime.now());
    final byMethod = await _dbHelper.getTotalsByPaymentMethodForDate(
      DateTime.now(),
    );
    final methods = await _dbHelper.getPaymentMethods();
    setState(() {
      _todayTotal = total;
      _todayByMethod = byMethod;
      _paymentMethods = methods;
      if (!methods.contains(_selectedPaymentMethod)) {
        _selectedPaymentMethod = methods.isNotEmpty ? methods.first : 'Cash';
      }
      _isLoading = false;
    });
  }

  Future<void> _addQuickTip() async {
    final text = _amountController.text.trim();
    final amount = double.tryParse(text);
    if (text.isEmpty || amount == null || amount <= 0) {
      FocusScope.of(context).unfocus();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Enter a valid amount')));
      return;
    }

    final now = DateTime.now();
    final tip = Tip(
      amount: amount,
      paymentMethod: _selectedPaymentMethod,
      date: now,
      createdAt: now,
      updatedAt: now,
    );
    await _dbHelper.insertTip(tip);
    _amountController.clear();

    if (!mounted) return;
    FocusScope.of(context).unfocus();
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Tip added!')));
    _loadData();
  }

  Future<void> _showAddPaymentMethodDialog() async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Payment Method'),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            hintText: 'e.g. Venmo, Cash App',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final text = controller.text.trim();
              if (text.isNotEmpty) Navigator.pop(ctx, text);
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (name != null && name.isNotEmpty) {
      await _dbHelper.insertPaymentMethod(name);
      final methods = await _dbHelper.getPaymentMethods();
      setState(() {
        _paymentMethods = methods;
        _selectedPaymentMethod = name;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tip Tracker'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSummaryCard(),
            const SizedBox(height: 16),
            _buildQuickEntryCard(),
            const SizedBox(height: 16),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard() {
    if (_isLoading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Text(
              DateFormat('MMMM d, yyyy').format(DateTime.now()),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Today\'s Tips: \$${_todayTotal.toStringAsFixed(2)}',
              style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            if (_todayByMethod.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 4),
              ..._todayByMethod.entries.map(
                (e) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        e.key,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      Text(
                        '\$${e.value.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickEntryCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              decoration: const InputDecoration(
                hintText: 'Tip amount',
                prefixText: '\$ ',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _paymentMethods.contains(_selectedPaymentMethod)
                  ? _selectedPaymentMethod
                  : null,
              decoration: const InputDecoration(
                labelText: 'Payment Method',
                border: OutlineInputBorder(),
              ),
              items: [
                ..._paymentMethods.map(
                  (m) => DropdownMenuItem(value: m, child: Text(m)),
                ),
                const DropdownMenuItem(
                  value: '_add_new',
                  child: Text('+ Add New...'),
                ),
              ],
              onChanged: (value) {
                if (value == '_add_new') {
                  _showAddPaymentMethodDialog();
                } else if (value != null) {
                  setState(() => _selectedPaymentMethod = value);
                }
              },
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _addQuickTip,
                child: const Text('Add Tip'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () async {
              final result = await Navigator.push<bool>(
                context,
                MaterialPageRoute(builder: (_) => const AddEditTipScreen()),
              );
              if (result == true) _loadData();
            },
            child: const Text('Backdate a Tip'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton(
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TipHistoryScreen()),
              );
              _loadData();
            },
            child: const Text('View History'),
          ),
        ),
      ],
    );
  }
}
