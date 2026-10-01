import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/wholesaler_provider.dart';
import '../theme/wholesaler_colors.dart';

// ─────────────────────────────────────────────────────────────────
// CUSTOMER DIALOG
// ─────────────────────────────────────────────────────────────────
class WCustomerDialog extends StatefulWidget {
  final int initialTab;
  const WCustomerDialog({super.key, this.initialTab = 0});

  @override
  State<WCustomerDialog> createState() => _WCustomerDialogState();
}

class _WCustomerDialogState extends State<WCustomerDialog> {
  late int _activeTab;
  final _searchCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _activeTab = widget.initialTab;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final w = context.read<WholesalerProvider>();
      w.loadCustomers();
    });
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

  Future<void> _submitCustomer(WholesalerProvider w) async {
    final name = _nameCtrl.text.trim();
    final phone = _phoneCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Customer name is required'), backgroundColor: Colors.red),
      );
      return;
    }
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mobile number is required'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final newCust = await w.addCustomer(
        name: name,
        phone: phone,
        email: _emailCtrl.text.trim(),
        address: _addressCtrl.text.trim(),
      );

      if (mounted) {
        setState(() => _isSubmitting = false);
        if (newCust != null) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Customer "${newCust.name}" registered & selected'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to register customer'), backgroundColor: Colors.red),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    final query = _searchCtrl.text.toLowerCase().trim();
    final filteredCustomers = w.customers.where((c) {
      if (query.isEmpty) return true;
      return c.name.toLowerCase().contains(query) ||
          c.phone.contains(query) ||
          c.customerId.toLowerCase().contains(query);
    }).toList();

    return Dialog(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Modal Header matching web design
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 14),
              child: Row(
                children: [
                  Text(
                    'Customer Management',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : const Color(0xFF1E3A8A),
                      letterSpacing: -0.2,
                    ),
                  ),
                  const Spacer(),
                  // Web style red close button
                  InkWell(
                    onTap: () => Navigator.of(context).pop(),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE11D48),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ),
            Container(height: 1, color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),

            // Tab bar switcher
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _TabButton(
                        label: 'View Customers',
                        icon: Icons.people_outline_rounded,
                        isActive: _activeTab == 0,
                        isDark: isDark,
                        onTap: () => setState(() => _activeTab = 0),
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: _TabButton(
                        label: 'Add Customer',
                        icon: Icons.person_add_alt_1_outlined,
                        isActive: _activeTab == 1,
                        isDark: isDark,
                        onTap: () => setState(() => _activeTab = 1),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Tab Contents
            Expanded(
              child: _activeTab == 0
                  ? _buildViewCustomersTab(context, w, filteredCustomers, isDark)
                  : _buildAddCustomerTab(context, w, isDark),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildViewCustomersTab(
    BuildContext context,
    WholesalerProvider w,
    List<WCustomer> filteredCustomers,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Column(
        children: [
          // Blue border search box matching web design
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: const Color(0xFF3B82F6),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                const SizedBox(width: 12),
                const Icon(
                  Icons.search_rounded,
                  size: 20,
                  color: Color(0xFF3B82F6),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search by name or phone number...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ),
                ),
                if (_searchCtrl.text.isNotEmpty)
                  IconButton(
                    icon: const Icon(Icons.clear, size: 16),
                    onPressed: () {
                      _searchCtrl.clear();
                      setState(() {});
                    },
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Customer list
          Expanded(
            child: w.isLoadingCustomers && w.customers.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : filteredCustomers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.people_outline_rounded,
                              size: 48,
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'NO CUSTOMERS FOUND',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: filteredCustomers.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final c = filteredCustomers[i];
                          final isSelected = c.id == w.customer.id;
                          final initial = c.name.trim().isNotEmpty
                              ? c.name.trim()[0].toUpperCase()
                              : 'C';

                          return InkWell(
                            onTap: () {
                              w.selectCustomer(c);
                              Navigator.of(context).pop();
                            },
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFF2563EB)
                                      : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                                  width: isSelected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  // Avatar with initial matching web
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFEFF6FF),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Center(
                                      child: Text(
                                        initial,
                                        style: const TextStyle(
                                          color: Color(0xFF2563EB),
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          c.name,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: isDark ? Colors.white : const Color(0xFF1E293B),
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.phone_outlined,
                                              size: 13,
                                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                            ),
                                            const SizedBox(width: 5),
                                            Text(
                                              c.phone,
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (isSelected)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'SELECTED',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF2563EB),
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddCustomerTab(BuildContext context, WholesalerProvider w, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Customer Name
          _FormField(
            label: 'Customer Name',
            isRequired: true,
            hint: 'e.g. Acme Corp',
            icon: Icons.person_outline_rounded,
            controller: _nameCtrl,
            isDark: isDark,
          ),
          const SizedBox(height: 12),

          // Mobile Number
          _FormField(
            label: 'Mobile Number',
            isRequired: true,
            hint: '01xxx-xxxxxx',
            icon: Icons.phone_outlined,
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            isDark: isDark,
          ),
          const SizedBox(height: 12),

          // Email Address
          _FormField(
            label: 'Email Address',
            isRequired: false,
            hint: 'customer@example.com',
            icon: Icons.mail_outline_rounded,
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            isDark: isDark,
          ),
          const SizedBox(height: 12),

          // Full Address
          _FormField(
            label: 'Full Address',
            isRequired: false,
            hint: 'City, State, Zip',
            icon: Icons.location_on_outlined,
            controller: _addressCtrl,
            isDark: isDark,
          ),
          const SizedBox(height: 20),

          // Action buttons matching web design
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: Text(
                  'Cancel',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _isSubmitting ? null : () => _submitCustomer(w),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'REGISTER & SELECT',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isActive;
  final bool isDark;
  final VoidCallback onTap;

  const _TabButton({
    required this.label,
    required this.icon,
    required this.isActive,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF2563EB) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isActive
                  ? Colors.white
                  : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569)),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isActive
                    ? Colors.white
                    : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final String label;
  final bool isRequired;
  final String hint;
  final IconData icon;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final bool isDark;

  const _FormField({
    required this.label,
    this.isRequired = false,
    required this.hint,
    required this.icon,
    required this.controller,
    this.keyboardType = TextInputType.text,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
              ),
            ),
            if (isRequired)
              const Text(
                ' *',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          height: 42,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
            ),
          ),
          child: Row(
            children: [
              const SizedBox(width: 12),
              Icon(
                icon,
                size: 16,
                color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: keyboardType,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                  ),
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: TextStyle(
                      fontSize: 12,
                      color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}


// ─────────────────────────────────────────────────────────────────
// HOLD ORDER DIALOG
// ─────────────────────────────────────────────────────────────────
class WHoldOrderDialog extends StatefulWidget {
  const WHoldOrderDialog({super.key});

  @override
  State<WHoldOrderDialog> createState() => _WHoldOrderDialogState();
}

class _WHoldOrderDialogState extends State<WHoldOrderDialog> {
  final _noteCtrl = TextEditingController();

  @override
  void dispose() { _noteCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.read<WholesalerProvider>();

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 380),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: WholesalerColors.accentOrange.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.pause_circle_filled_rounded, size: 32,
                    color: WholesalerColors.accentOrange),
              ),
              const SizedBox(height: 14),
              Text('Hold This Order?',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: WholesalerColors.textPrimary(isDark),
                  )),
              const SizedBox(height: 6),
              Text('The order will be saved and can be recalled later.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: WholesalerColors.textSecondary(isDark),
                  )),
              const SizedBox(height: 16),
              TextField(
                controller: _noteCtrl,
                style: TextStyle(fontSize: 13, color: WholesalerColors.textPrimary(isDark)),
                decoration: InputDecoration(
                  hintText: 'Add a note (optional)',
                  hintStyle: TextStyle(color: WholesalerColors.textSecondary(isDark)),
                  filled: true,
                  fillColor: WholesalerColors.inputBg(isDark),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: WholesalerColors.border(isDark)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: WholesalerColors.border(isDark)),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: WholesalerColors.border(isDark)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text('Cancel',
                          style: TextStyle(color: WholesalerColors.textPrimary(isDark))),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        w.holdCurrentOrder(_noteCtrl.text);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: const Text('✅ Order held successfully'),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: WholesalerColors.accentGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: WholesalerColors.accentOrange,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Hold Order',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// RECENT ORDERS DIALOG
// ─────────────────────────────────────────────────────────────────
class WRecentOrdersDialog extends StatelessWidget {
  const WRecentOrdersDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480, maxHeight: 500),
        child: Column(
          children: [
            _DialogHeader(title: 'Held Orders / Recent', icon: Icons.history_rounded, isDark: isDark),
            Expanded(
              child: w.heldOrders.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inbox_rounded, size: 40,
                              color: WholesalerColors.textSecondary(isDark)),
                          const SizedBox(height: 10),
                          Text('No held orders',
                              style: TextStyle(
                                color: WholesalerColors.textSecondary(isDark),
                                fontWeight: FontWeight.w600,
                              )),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: w.heldOrders.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (_, i) {
                        final o = w.heldOrders[i];
                        return ListTile(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: WholesalerColors.border(isDark)),
                          ),
                          tileColor: isDark ? WholesalerColors.inputBg(true) : WholesalerColors.panelBg(false),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: WholesalerColors.accentOrange.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(Icons.pause_rounded, size: 18,
                                color: WholesalerColors.accentOrange),
                          ),
                          title: Text(o.id,
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                                color: WholesalerColors.textPrimary(isDark),
                              )),
                          subtitle: Text(
                            '${o.items.length} items${o.note.isNotEmpty ? '  •  ${o.note}' : ''}',
                            style: TextStyle(fontSize: 11, color: WholesalerColors.textSecondary(isDark)),
                          ),
                          trailing: ElevatedButton(
                            onPressed: () {
                              w.recallOrder(o);
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: WholesalerColors.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            ),
                            child: const Text('Recall', style: TextStyle(color: Colors.white, fontSize: 11)),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// ORDER CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────
class WOrderConfirmDialog extends StatelessWidget {
  const WOrderConfirmDialog({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<AppProvider>().isDarkMode;
    final w = context.watch<WholesalerProvider>();
    final fmt = NumberFormat('#,##0.00');

    return Dialog(
      backgroundColor: WholesalerColors.cardBg(isDark),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: WholesalerColors.primaryGradient,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: WholesalerColors.primary.withValues(alpha: 0.4),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: const Icon(Icons.local_shipping_rounded,
                    size: 32, color: Colors.white),
              ),
              const SizedBox(height: 16),
              Text('Confirm Order & Dispatch',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: WholesalerColors.textPrimary(isDark),
                  )),
              const SizedBox(height: 6),
              Text('Order will be sent to delivery queue.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: WholesalerColors.textSecondary(isDark))),
              const SizedBox(height: 16),
              // Summary
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: WholesalerColors.primary.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: WholesalerColors.primary.withValues(alpha: 0.2)),
                ),
                child: Column(
                  children: [
                    _ConfirmRow('Customer', w.customer.name, isDark),
                    _ConfirmRow('Items', '${w.totalItems} items', isDark),
                    _ConfirmRow('Subtotal', '৳${fmt.format(w.subtotal)}', isDark),
                    _ConfirmRow('Discount', '-৳${fmt.format(w.discountFlat)}', isDark),
                    _ConfirmRow('Tax', '৳${fmt.format(w.taxAmount)}', isDark),
                    _ConfirmRow('Shipping', '৳${fmt.format(w.shippingCost)}', isDark),
                    const Divider(height: 12),
                    Row(
                      children: [
                        Text('Total',
                            style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700,
                              color: WholesalerColors.textPrimary(isDark),
                            )),
                        const Spacer(),
                        Text('৳${fmt.format(w.grandTotal)}',
                            style: TextStyle(
                              fontSize: 18, fontWeight: FontWeight.w900,
                              color: WholesalerColors.primary,
                            )),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: WholesalerColors.border(isDark)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: Text('Cancel',
                          style: TextStyle(color: WholesalerColors.textPrimary(isDark))),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        w.clearOrder();
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: const Text('🚚 Order dispatched successfully!'),
                          behavior: SnackBarBehavior.floating,
                          backgroundColor: WholesalerColors.accentGreen,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ));
                      },
                      icon: const Icon(Icons.local_shipping_rounded, size: 16, color: Colors.white),
                      label: const Text('Dispatch Now',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: WholesalerColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  const _ConfirmRow(this.label, this.value, this.isDark);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Text(label,
              style: TextStyle(fontSize: 11, color: WholesalerColors.textSecondary(isDark))),
          const Spacer(),
          Text(value,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: WholesalerColors.textPrimary(isDark),
              )),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// SHARED: Dialog Header
// ─────────────────────────────────────────────────────────────────
class _DialogHeader extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isDark;
  const _DialogHeader({required this.title, required this.icon, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 10, 14),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: WholesalerColors.border(isDark))),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: WholesalerColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  color: WholesalerColors.textPrimary(isDark),
                )),
          ),
          IconButton(
            icon: Icon(Icons.close_rounded,
                color: WholesalerColors.textSecondary(isDark)),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }
}
