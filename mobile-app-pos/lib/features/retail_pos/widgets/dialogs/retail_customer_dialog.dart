import 'package:flutter/material.dart';
import '../../../../core/services/api_service.dart';
import '../../providers/retail_provider.dart';

void showRetailCustomerDialog(
  BuildContext context,
  RetailProvider retailProvider,
  bool isDark, {
  int initialTab = 1,
}) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RetailSelectCustomerModal(
      retailProvider: retailProvider,
      isDark: isDark,
      initialTab: initialTab,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECT CUSTOMER MODAL (Pixel-perfect matching reference image)
// ─────────────────────────────────────────────────────────────────────────────
class RetailSelectCustomerModal extends StatefulWidget {
  final RetailProvider retailProvider;
  final bool isDark;
  final int initialTab;

  const RetailSelectCustomerModal({
    super.key,
    required this.retailProvider,
    required this.isDark,
    this.initialTab = 1,
  });

  @override
  State<RetailSelectCustomerModal> createState() => _RetailSelectCustomerModalState();
}

class _RetailSelectCustomerModalState extends State<RetailSelectCustomerModal> {
  late int _activeTab; // 0: View Customer, 1: Add Customer
  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _addressCtrl = TextEditingController();

  final List<Map<String, String>> _customers = [
    {'name': 'Wahid', 'phone': '016965841462'},
    {'name': 'Wadi', 'phone': '015787865785'},
    {'name': 'Mamun', 'phone': '01677951406'},
    {'name': 'P41E2E-2FF937 ChainCust', 'phone': '01725873717'},
  ];

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTab;
    _fetchCustomers();
  }

  Future<void> _fetchCustomers() async {
    try {
      final list = await ApiService.instance.fetchCustomers(businessType: 'retail');
      if (list.isNotEmpty && mounted) {
        setState(() {
          _customers.clear();
          for (var c in list) {
            _customers.add({
              'name': c['name']?.toString() ?? 'Customer',
              'phone': c['phone']?.toString() ?? 'N/A',
            });
          }
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  void _selectCustomer(String name) {
    widget.retailProvider.setSelectedCustomer(name);
    Navigator.of(context).pop();
  }

  Future<void> _saveNewCustomer() async {
    final name = _nameCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter customer name'),
          backgroundColor: Color(0xFFEF4444),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }
    try {
      final res = await ApiService.instance.createCustomer(
        businessType: 'retail',
        payload: {
          'name': name,
          if (phone.isNotEmpty) 'phone': phone,
          if (_emailCtrl.text.trim().isNotEmpty) 'email': _emailCtrl.text.trim(),
          if (_addressCtrl.text.trim().isNotEmpty) 'address': _addressCtrl.text.trim(),
          'segmentation': 'RETAIL',
        },
      );
      if (res != null && mounted) {
        setState(() {
          _customers.insert(0, {'name': name, 'phone': phone.isNotEmpty ? phone : 'N/A'});
        });
        _selectCustomer(name);
      }
    } catch (e) {
      if (mounted) {
        final errText = e.toString().replaceAll('Exception: ', '').trim();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errText),
            backgroundColor: const Color(0xFFEF4444),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0);

    final query = _searchCtrl.text.trim().toLowerCase();
    final filtered = _customers.where((c) {
      if (query.isEmpty) return true;
      return c['name']!.toLowerCase().contains(query) || c['phone']!.contains(query);
    }).toList();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: 560,
        constraints: const BoxConstraints(maxWidth: 580),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 28,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── 1. Header Bar ──────────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 16, 16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  const Text(
                    'Select Customer',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1D4ED8),
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE11D48),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.close_rounded, size: 18, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),

            // ── 2. Tab Switcher (View Customer | Add Customer) ─────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 18, 24, 16),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF262626) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    // View Customer Tab
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _activeTab = 0),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: _activeTab == 0
                                ? const Color(0xFF7065F0)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(
                            'View Customer',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: _activeTab == 0 ? FontWeight.w700 : FontWeight.w600,
                              color: _activeTab == 0
                                  ? Colors.white
                                  : (isDark ? Colors.grey.shade400 : const Color(0xFF475569)),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Add Customer Tab
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _activeTab = 1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: _activeTab == 1
                                ? const Color(0xFF7065F0)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(5),
                          ),
                          child: Text(
                            'Add Customer',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: _activeTab == 1 ? FontWeight.w700 : FontWeight.w600,
                              color: _activeTab == 1
                                  ? Colors.white
                                  : (isDark ? Colors.grey.shade400 : const Color(0xFF475569)),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── 3. Tab Body ────────────────────────────────────────────────
            if (_activeTab == 0)
              SizedBox(
                height: 380,
                child: _buildViewCustomerTab(isDark, borderColor, filtered),
              )
            else
              _buildAddCustomerTab(isDark, borderColor),
          ],
        ),
      ),
    );
  }

  // ── Tab 1: View Customer (Search + Walk-in + Customer List) ────────────────
  Widget _buildViewCustomerTab(bool isDark, Color borderColor, List<Map<String, String>> filtered) {
    return Column(
      children: [
        // Search Input
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Container(
            height: 42,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262626) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: isDark ? const Color(0xFF383838) : const Color(0xFFCBD5E1)),
            ),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (_) => setState(() {}),
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white : const Color(0xFF1E293B)),
              decoration: const InputDecoration(
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                hintText: 'Search by name or phone...',
                hintStyle: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
              ),
            ),
          ),
        ),
        const SizedBox(height: 10),

        // Walk-in Customer Item
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: InkWell(
            onTap: () => _selectCustomer('Walk-in Customer'),
            borderRadius: BorderRadius.circular(6),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF262626) : Colors.white,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: isDark ? const Color(0xFF3B4861) : const Color(0xFF93C5FD),
                  style: BorderStyle.solid,
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.person_outline_rounded, size: 18, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
                  const SizedBox(width: 10),
                  Text(
                    'Walk-in Customer',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : const Color(0xFF334155),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),

        // Customer Cards List
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text(
                    'No customers found',
                    style: TextStyle(fontSize: 12, color: isDark ? Colors.grey.shade500 : const Color(0xFF94A3B8)),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(24, 2, 24, 14),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final c = filtered[index];
                    final initial = c['name']!.isNotEmpty ? c['name']![0].toUpperCase() : 'C';

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: InkWell(
                        onTap: () => _selectCustomer(c['name']!),
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF262626) : Colors.white,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: borderColor),
                          ),
                          child: Row(
                            children: [
                              // Avatar circle
                              Container(
                                width: 36,
                                height: 36,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEDE9FE),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    initial,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF7C3AED),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Name & Phone
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      c['name']!,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      c['phone']!,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // ── Tab 2: Add Customer Form (Pixel-Perfect Match to Screenshot) ─────────
  Widget _buildAddCustomerTab(bool isDark, Color borderColor) {
    final labelColor = isDark ? Colors.grey.shade300 : const Color(0xFF334155);
    final fieldBorderColor = isDark ? const Color(0xFF383838) : const Color(0xFFCBD5E1);

    Widget buildFormField({
      required String label,
      required TextEditingController controller,
      TextInputType keyboardType = TextInputType.text,
    }) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
              color: labelColor,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            height: 42,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF262626) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: fieldBorderColor, width: 1.0),
            ),
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              cursorColor: const Color(0xFF7065F0),
              style: TextStyle(
                fontSize: 13,
                color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
              decoration: const InputDecoration(
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ),
        ],
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. NAME *
          buildFormField(label: 'NAME *', controller: _nameCtrl),
          const SizedBox(height: 16),

          // 2. PHONE NUMBER
          buildFormField(
            label: 'PHONE NUMBER',
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 16),

          // 3. EMAIL
          buildFormField(
            label: 'EMAIL',
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 16),

          // 4. ADDRESS
          buildFormField(label: 'ADDRESS', controller: _addressCtrl),
          const SizedBox(height: 22),

          // 5. Save Customer Button (Pixel-perfect matching screenshot)
          InkWell(
            onTap: _saveNewCustomer,
            borderRadius: BorderRadius.circular(6),
            child: Container(
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: const Color(0xFF7065F0),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'Save Customer',
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
