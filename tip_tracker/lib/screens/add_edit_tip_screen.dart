import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:tip_tracker/models/tip.dart';
import 'package:tip_tracker/services/database_helper.dart';

class AddEditTipScreen extends StatefulWidget {
  final Tip? tip;

  const AddEditTipScreen({super.key, this.tip});

  @override
  State<AddEditTipScreen> createState() => _AddEditTipScreenState();
}

class _AddEditTipScreenState extends State<AddEditTipScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _dbHelper = DatabaseHelper.instance;
  late DateTime _selectedDate;
  List<String> _paymentMethods = [];
  late String _selectedPaymentMethod;

  bool get _isEditMode => widget.tip != null;

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      _amountController.text = widget.tip!.amount.toStringAsFixed(2);
      _selectedDate = widget.tip!.date;
      _selectedPaymentMethod = widget.tip!.paymentMethod;
    } else {
      _selectedDate = DateTime.now();
      _selectedPaymentMethod = 'Cash';
    }
    _loadPaymentMethods();
  }

  Future<void> _loadPaymentMethods() async {
    final methods = await _dbHelper.getPaymentMethods();
    setState(() {
      _paymentMethods = methods;
      // Ensure the selected method is in the list (for historical tips with deleted methods)
      if (!methods.contains(_selectedPaymentMethod)) {
        _paymentMethods = [_selectedPaymentMethod, ...methods];
      }
    });
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020, 1, 1),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
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

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final amount = double.parse(_amountController.text.trim());
    final now = DateTime.now();

    if (_isEditMode) {
      final updated = widget.tip!.copyWith(
        amount: amount,
        paymentMethod: _selectedPaymentMethod,
        date: _selectedDate,
        updatedAt: now,
      );
      await _dbHelper.updateTip(updated);
    } else {
      final tip = Tip(
        amount: amount,
        paymentMethod: _selectedPaymentMethod,
        date: _selectedDate,
        createdAt: now,
        updatedAt: now,
      );
      await _dbHelper.insertTip(tip);
    }

    if (!mounted) return;
    Navigator.pop(context, true);
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete this tip?'),
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
      await _dbHelper.deleteTip(widget.tip!.id!);
      if (!mounted) return;
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditMode ? 'Edit Tip' : 'Add Tip'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  prefixText: '\$ ',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Enter an amount';
                  }
                  final amount = double.tryParse(value.trim());
                  if (amount == null || amount <= 0) {
                    return 'Enter a valid amount greater than 0';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedPaymentMethod,
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
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      DateFormat('MMMM d, yyyy').format(_selectedDate),
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  TextButton(onPressed: _pickDate, child: const Text('Change')),
                ],
              ),
              const SizedBox(height: 24),
              ElevatedButton(onPressed: _save, child: const Text('Save')),
              if (_isEditMode) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _delete,
                  child: const Text(
                    'Delete Tip',
                    style: TextStyle(color: Colors.red),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
