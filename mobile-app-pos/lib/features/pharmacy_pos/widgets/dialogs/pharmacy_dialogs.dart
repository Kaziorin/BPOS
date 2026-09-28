import 'package:flutter/material.dart';
import '../../../../core/theme/theme_extensions.dart';
import '../../models/medicine_model.dart';
import '../../models/pharmacy_cart_item.dart';
import '../../providers/pharmacy_provider.dart';

const primaryTeal = Color(0xFF00897B);
const darkTeal = Color(0xFF00695C);

// ─────────────────────────────────────────────────────────────
// 1. CUSTOMER DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyCustomerDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final searchCtrl = TextEditingController();
  final nameCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  final allergyCtrl = TextEditingController();

  final List<Map<String, dynamic>> defaultCustomers = [
    {'name': 'Walk-in Customer', 'phone': 'N/A', 'points': 0, 'allergy': 'None'},
    {'name': 'Rahim Uddin', 'phone': '01711223344', 'points': 145, 'allergy': 'Penicillin Allergy'},
    {'name': 'Farhana Akhtar', 'phone': '01899887766', 'points': 280, 'allergy': 'Sulfa Drugs'},
    {'name': 'Dr. Kazi Mostafa', 'phone': '01912345678', 'points': 520, 'allergy': 'None'},
    {'name': 'Nusrat Jahan', 'phone': '01655443322', 'points': 90, 'allergy': 'Aspirin'},
  ];

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) {
        final query = searchCtrl.text.toLowerCase();
        final filtered = defaultCustomers.where((c) =>
          c['name'].toString().toLowerCase().contains(query) ||
          c['phone'].toString().contains(query)
        ).toList();

        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          backgroundColor: isDark ? context.cardBg : Colors.white,
          child: Container(
            width: 480,
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.person_pin_rounded, color: primaryTeal, size: 24),
                        SizedBox(width: 10),
                        Text(
                          'Select or Add Patient/Customer',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Search box
                TextField(
                  controller: searchCtrl,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search by patient name or phone number...',
                    prefixIcon: const Icon(Icons.search, size: 18),
                    filled: true,
                    fillColor: isDark ? context.scaffoldBg : Colors.grey.shade100,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                const Text('Saved Patients:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 6),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 180),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) => const Divider(height: 1),
                    itemBuilder: (ctx, i) {
                      final c = filtered[i];
                      final isSelected = provider.selectedCustomer?['name'] == c['name'];
                      final hasAllergy = c['allergy'] != 'None';

                      return ListTile(
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        leading: CircleAvatar(
                          backgroundColor: primaryTeal.withValues(alpha: 0.1),
                          child: const Icon(Icons.person, color: primaryTeal, size: 18),
                        ),
                        title: Text(
                          c['name'] as String,
                          style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? primaryTeal : null),
                        ),
                        subtitle: Row(
                          children: [
                            Text(c['phone'] as String, style: const TextStyle(fontSize: 11)),
                            if (hasAllergy) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                decoration: BoxDecoration(
                                  color: Colors.red.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  c['allergy'] as String,
                                  style: const TextStyle(fontSize: 9, color: Colors.red, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ],
                        ),
                        trailing: Text('⭐ ${c['points']} pts', style: const TextStyle(fontSize: 11, color: Colors.amber)),
                        onTap: () {
                          provider.setCustomer(c);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Patient "${c['name']}" selected'), duration: const Duration(seconds: 1)),
                          );
                        },
                      );
                    },
                  ),
                ),
                const Divider(height: 20),
                const Text('Quick Add New Patient:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: primaryTeal)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: nameCtrl,
                        decoration: InputDecoration(
                          hintText: 'Full Name',
                          isDense: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: InputDecoration(
                          hintText: 'Mobile No.',
                          isDense: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: allergyCtrl,
                  decoration: InputDecoration(
                    hintText: 'Allergies / Special Notes (optional)',
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryTeal,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () {
                      if (nameCtrl.text.trim().isEmpty) return;
                      final newCust = {
                        'name': nameCtrl.text.trim(),
                        'phone': phoneCtrl.text.trim().isEmpty ? 'N/A' : phoneCtrl.text.trim(),
                        'points': 0,
                        'allergy': allergyCtrl.text.trim().isEmpty ? 'None' : allergyCtrl.text.trim(),
                      };
                      provider.setCustomer(newCust);
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Added & selected "${newCust['name']}"'), duration: const Duration(seconds: 1)),
                      );
                    },
                    child: const Text('Add & Select Patient'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 2. SCAN RX (PRESCRIPTION SCANNER) DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyScanRxDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final rxIdCtrl = TextEditingController(text: 'RX-2026-9041');
  final doctorCtrl = TextEditingController(text: 'Prof. Dr. Anwarul Islam, FCPS');
  final patientCtrl = TextEditingController(text: 'Kamal Hossain (Age: 42)');

  final List<MedicineModel> prescribedItems = [
    provider.allMedicines.firstWhere((m) => m.name == 'Augmentin', orElse: () => provider.allMedicines[1]),
    provider.allMedicines.firstWhere((m) => m.name == 'Napa Extra', orElse: () => provider.allMedicines[9]),
    provider.allMedicines.firstWhere((m) => m.name == 'Esomeprazole', orElse: () => provider.allMedicines[6]),
  ];

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? context.cardBg : Colors.white,
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.camera_alt_outlined, color: primaryTeal, size: 24),
                    SizedBox(width: 10),
                    Text('Scan / Attach Prescription (Rx)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.purple.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.purple.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.document_scanner_rounded, color: Colors.purple, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('AI Prescription OCR Scanner', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.purple)),
                        Text('Prescription scanned & validated. 3 prescribed medicines recognized.', style: TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: Colors.purple, borderRadius: BorderRadius.circular(6)),
                    child: const Text('Verified', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: rxIdCtrl,
                    decoration: const InputDecoration(labelText: 'Prescription ID', isDense: true),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: patientCtrl,
                    decoration: const InputDecoration(labelText: 'Patient Name & Age', isDense: true),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: doctorCtrl,
              decoration: const InputDecoration(labelText: 'Prescribing Doctor', isDense: true),
            ),
            const SizedBox(height: 14),
            const Text('Recognized Medicines to Dispense:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            ...prescribedItems.map((med) => Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isDark ? context.scaffoldBg : Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: context.dividerColor),
              ),
              child: Row(
                children: [
                  const Icon(Icons.medication, color: primaryTeal, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(med.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        Text('${med.genericName} • ${med.manufacturer}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                      ],
                    ),
                  ),
                  Text('৳ ${med.price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: primaryTeal)),
                ],
              ),
            )),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      provider.setPrescription({
                        'id': rxIdCtrl.text,
                        'patient': patientCtrl.text,
                        'doctor': doctorCtrl.text,
                        'date': DateTime.now(),
                      });
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Prescription attached without loading cart'), duration: Duration(seconds: 1)),
                      );
                    },
                    child: const Text('Attach Only'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white),
                    icon: const Icon(Icons.add_shopping_cart, size: 16),
                    label: const Text('Load All to Cart'),
                    onPressed: () {
                      provider.setPrescription({
                        'id': rxIdCtrl.text,
                        'patient': patientCtrl.text,
                        'doctor': doctorCtrl.text,
                        'date': DateTime.now(),
                      });
                      for (final m in prescribedItems) {
                        provider.addToCart(m);
                      }
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Rx attached & 3 medicines loaded to cart!'), duration: Duration(seconds: 1)),
                      );
                    },
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

// ─────────────────────────────────────────────────────────────
// 3. BARCODE SCANNER DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyBarcodeScanDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final codeCtrl = TextEditingController();
  MedicineModel? foundMed;

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: isDark ? context.cardBg : Colors.white,
        child: Container(
          width: 420,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.barcode_reader, color: primaryTeal, size: 24),
                      SizedBox(width: 8),
                      Text('Barcode Scanner', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                height: 90,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(Icons.qr_code_scanner, color: Colors.white70, size: 40),
                    Divider(color: Colors.red, thickness: 2, indent: 40, endIndent: 40),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: codeCtrl,
                autofocus: true,
                onChanged: (val) {
                  setState(() {
                    foundMed = provider.allMedicines.cast<MedicineModel?>().firstWhere(
                      (m) => m?.barcode == val.trim() || m?.name.toLowerCase().contains(val.trim().toLowerCase()) == true,
                      orElse: () => null,
                    );
                  });
                },
                decoration: InputDecoration(
                  hintText: 'Enter/Scan Barcode (e.g. 89411002)...',
                  isDense: true,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 10),
              // Sample barcode suggestions
              Wrap(
                spacing: 6,
                children: ['89411001', '89411002', '89411007', '89411013'].map((code) => ActionChip(
                  label: Text(code, style: const TextStyle(fontSize: 10)),
                  onPressed: () {
                    codeCtrl.text = code;
                    setState(() {
                      foundMed = provider.allMedicines.firstWhere((m) => m.barcode == code);
                    });
                  },
                )).toList(),
              ),
              const SizedBox(height: 12),
              if (foundMed != null)
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: primaryTeal.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: primaryTeal.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: primaryTeal),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(foundMed!.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                            Text('Price: ৳${foundMed!.price.toStringAsFixed(2)} • Stock: ${foundMed!.stock}', style: const TextStyle(fontSize: 11)),
                          ],
                        ),
                      ),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white),
                        onPressed: () {
                          provider.addToCart(foundMed!);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Added "${foundMed!.name}" to cart!'), duration: const Duration(seconds: 1)),
                          );
                        },
                        child: const Text('Add to Cart'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 4. QUICK REFILL DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyQuickRefillDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final List<Map<String, dynamic>> pastRefills = [
    {
      'patient': 'Al-Amin Sikder (01788990011)',
      'rxNumber': 'RX-8812',
      'lastFilled': '28 Aug 2026',
      'items': [
        provider.allMedicines.firstWhere((m) => m.name == 'Metformin', orElse: () => provider.allMedicines[8]),
        provider.allMedicines.firstWhere((m) => m.name == 'Zincovit', orElse: () => provider.allMedicines[16]),
      ],
    },
    {
      'patient': 'Shirin Sultana (01955443322)',
      'rxNumber': 'RX-7741',
      'lastFilled': '15 Aug 2026',
      'items': [
        provider.allMedicines.firstWhere((m) => m.name == 'Salbutamol', orElse: () => provider.allMedicines[13]),
        provider.allMedicines.firstWhere((m) => m.name == 'Cetirizine', orElse: () => provider.allMedicines[4]),
      ],
    },
  ];

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? context.cardBg : Colors.white,
      child: Container(
        width: 480,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.refresh_rounded, color: Colors.orange, size: 24),
                    SizedBox(width: 8),
                    Text('Patient Quick Refill', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            const Text('Choose past prescription to auto-refill:', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 10),
            ...pastRefills.map((refill) {
              final items = refill['items'] as List<MedicineModel>;
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? context.scaffoldBg : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: context.dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(refill['patient'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('Last: ${refill['lastFilled']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                      ],
                    ),
                    Text('Rx: ${refill['rxNumber']} • ${items.length} items', style: const TextStyle(fontSize: 11, color: primaryTeal)),
                    const SizedBox(height: 6),
                    Text(items.map((m) => '${m.name} (৳${m.price.toStringAsFixed(0)})').join(' + '), style: const TextStyle(fontSize: 11)),
                    const SizedBox(height: 8),
                    Align(
                      alignment: Alignment.centerRight,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white, elevation: 0),
                        icon: const Icon(Icons.restart_alt, size: 16),
                        label: const Text('Refill Now'),
                        onPressed: () {
                          for (final m in items) {
                            provider.addToCart(m);
                          }
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Refilled ${items.length} medicines for ${refill['patient']}'), duration: const Duration(seconds: 1)),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 5. ADD MEDICINE DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyAddMedicineDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final nameCtrl = TextEditingController();
  final genericCtrl = TextEditingController();
  final priceCtrl = TextEditingController();
  final stockCtrl = TextEditingController(text: '50');
  final manufacturerCtrl = TextEditingController(text: 'Square Pharma');
  String category = 'Antibiotics';
  bool isRx = false;

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: isDark ? context.cardBg : Colors.white,
        child: Container(
          width: 460,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.add_circle_outline, color: primaryTeal, size: 24),
                      SizedBox(width: 8),
                      Text('Add New Medicine to Stock', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Brand/Medicine Name (e.g. Ciprocin)', isDense: true),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: genericCtrl,
                decoration: const InputDecoration(labelText: 'Generic & Strength (e.g. Ciprofloxacin • 500mg)', isDense: true),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: priceCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Price (৳)', isDense: true),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: stockCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Initial Stock Qty', isDense: true),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: manufacturerCtrl,
                decoration: const InputDecoration(labelText: 'Manufacturer / Brand', isDense: true),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Category:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  DropdownButton<String>(
                    value: category,
                    items: ['Antibiotics', 'Pain Relief', 'Vitamins & Supplements', 'Skin Care', 'Diabetes Care', 'Gastrointestinal', 'Respiratory', 'Others']
                      .map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => category = val);
                    },
                  ),
                ],
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: const Text('Prescription Required (Rx)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                value: isRx,
                onChanged: (val) => setState(() => isRx = val),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white),
                  onPressed: () {
                    if (nameCtrl.text.trim().isEmpty || priceCtrl.text.trim().isEmpty) return;
                    final newMed = MedicineModel(
                      id: DateTime.now().millisecondsSinceEpoch.toString(),
                      name: nameCtrl.text.trim(),
                      genericName: genericCtrl.text.trim().isEmpty ? 'Tablet' : genericCtrl.text.trim(),
                      price: double.tryParse(priceCtrl.text) ?? 10.0,
                      stock: int.tryParse(stockCtrl.text) ?? 50,
                      category: category,
                      imagePath: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200',
                      isRx: isRx,
                      manufacturer: manufacturerCtrl.text.trim(),
                      barcode: '894${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
                    );
                    provider.addMedicine(newMed);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Medicine "${newMed.name}" added to catalog!'), duration: const Duration(seconds: 1)),
                    );
                  },
                  child: const Text('Save Medicine'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 6. GENERIC ALTERNATIVES COMPARISON DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyGenericAlternativesDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final current = provider.focusedMedicine;
  final alternatives = provider.getAlternativesFor(current);

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? context.cardBg : Colors.white,
      child: Container(
        width: 520,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.swap_horiz_rounded, color: primaryTeal, size: 26),
                    SizedBox(width: 8),
                    Text('Generic Alternatives Finder', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 10),
            // Current Medicine
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.medication, color: Colors.blue, size: 28),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Original: ${current.name}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.blue)),
                        Text('${current.genericName} • ${current.manufacturer}', style: const TextStyle(fontSize: 11)),
                      ],
                    ),
                  ),
                  Text('৳ ${current.price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.blue)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text('Cheaper / Equivalent Generic Brands (${alternatives.length} Available):', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 220),
              child: alternatives.isEmpty
                ? const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('No alternatives found in current catalog.')))
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: alternatives.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 6),
                    itemBuilder: (ctx, i) {
                      final alt = alternatives[i];
                      final savings = current.price - alt.price;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isDark ? context.scaffoldBg : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: context.dividerColor),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.eco_rounded, color: Colors.green, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(alt.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  Text('${alt.genericName} • ${alt.manufacturer}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                  if (savings > 0)
                                    Text('Save ৳${savings.toStringAsFixed(2)} per unit!', style: const TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            Text('৳ ${alt.price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: primaryTeal)),
                            const SizedBox(width: 10),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white, elevation: 0, padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6)),
                              onPressed: () {
                                provider.addToCart(alt);
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Added alternative "${alt.name}" to cart!'), duration: const Duration(seconds: 1)),
                                );
                              },
                              child: const Text('Select', style: TextStyle(fontSize: 11)),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
            ),
          ],
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 7. MEDICINE DETAILS DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyMedicineDetailsDialog(BuildContext context, PharmacyProvider provider, MedicineModel medicine) {
  final isDark = context.isDark;

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? context.cardBg : Colors.white,
      child: Container(
        width: 450,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(medicine.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                      Text(medicine.genericName, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const Divider(height: 20),
            Row(
              children: [
                _detailTile('Price', '৳${medicine.price.toStringAsFixed(2)}', primaryTeal),
                _detailTile('Stock', '${medicine.stock} units', medicine.isLowStock ? Colors.orange : Colors.green),
                _detailTile('Batch No.', medicine.batchNumber, Colors.blueGrey),
                _detailTile('Expiry', medicine.expiryDate, medicine.isExpiringSoon ? Colors.red : Colors.grey),
              ],
            ),
            const SizedBox(height: 12),
            _infoRow('Manufacturer', medicine.manufacturer),
            _infoRow('Category', medicine.category),
            _infoRow('Dosage Form', medicine.dosageForm),
            _infoRow('Rx Required', medicine.isRx ? 'Yes (Doctor Prescription Needed)' : 'No (OTC Available)'),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.swap_horiz, size: 16),
                    label: const Text('Alternatives'),
                    onPressed: () {
                      provider.setFocusedMedicine(medicine);
                      Navigator.pop(ctx);
                      showPharmacyGenericAlternativesDialog(context, provider);
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white),
                    icon: const Icon(Icons.add_shopping_cart, size: 16),
                    label: const Text('Add to Cart'),
                    onPressed: () {
                      provider.addToCart(medicine);
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Added "${medicine.name}" to cart!'), duration: const Duration(seconds: 1)),
                      );
                    },
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

Widget _detailTile(String label, String value, Color color) {
  return Expanded(
    child: Container(
      margin: const EdgeInsets.symmetric(horizontal: 2),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    ),
  );
}

Widget _infoRow(String label, String value) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 3),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 8. DOCTOR DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyDoctorDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final docCtrl = TextEditingController(text: provider.attachedDoctor?['name'] ?? '');
  final bmdcCtrl = TextEditingController(text: provider.attachedDoctor?['bmdc'] ?? '');
  final hospitalCtrl = TextEditingController(text: provider.attachedDoctor?['hospital'] ?? '');

  final List<Map<String, dynamic>> presetDoctors = [
    {'name': 'Prof. Dr. Anwarul Islam', 'bmdc': 'A-41203', 'hospital': 'Dhaka Medical College & Hospital'},
    {'name': 'Dr. Mahmuda Begum', 'bmdc': 'A-55912', 'hospital': 'Square Hospital Ltd'},
    {'name': 'Dr. Kazi Tanvir Ahmed', 'bmdc': 'A-33890', 'hospital': 'Apollo Imperial Hospital'},
  ];

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: isDark ? context.cardBg : Colors.white,
        child: Container(
          width: 440,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.person_outline_rounded, color: Colors.indigo, size: 24),
                      SizedBox(width: 8),
                      Text('Prescribing Doctor', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 10),
              const Text('Select from Registered Doctors:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
              const SizedBox(height: 6),
              ...presetDoctors.map((d) => ListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.local_hospital, color: Colors.indigo, size: 18),
                title: Text(d['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                subtitle: Text('BMDC: ${d['bmdc']} • ${d['hospital']}', style: const TextStyle(fontSize: 10)),
                trailing: TextButton(
                  child: const Text('Select'),
                  onPressed: () {
                    provider.setDoctor(d);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Doctor "${d['name']}" attached to order!'), duration: const Duration(seconds: 1)),
                    );
                  },
                ),
              )),
              const Divider(height: 16),
              TextField(controller: docCtrl, decoration: const InputDecoration(labelText: 'Doctor Name', isDense: true)),
              const SizedBox(height: 6),
              TextField(controller: bmdcCtrl, decoration: const InputDecoration(labelText: 'BMDC Registration No', isDense: true)),
              const SizedBox(height: 6),
              TextField(controller: hospitalCtrl, decoration: const InputDecoration(labelText: 'Hospital / Clinic', isDense: true)),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.indigo, foregroundColor: Colors.white),
                  onPressed: () {
                    if (docCtrl.text.trim().isEmpty) return;
                    provider.setDoctor({
                      'name': docCtrl.text.trim(),
                      'bmdc': bmdcCtrl.text.trim(),
                      'hospital': hospitalCtrl.text.trim(),
                    });
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Doctor "${docCtrl.text}" attached to order!'), duration: const Duration(seconds: 1)),
                    );
                  },
                  child: const Text('Attach Doctor'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 9. NOTE DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyNoteDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;
  final ctrl = TextEditingController(text: provider.salesNote);

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? context.cardBg : Colors.white,
      child: Container(
        width: 400,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.note_alt_rounded, color: primaryTeal, size: 24),
                    SizedBox(width: 8),
                    Text('Order & Dispensing Note', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: ctrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'e.g. Take 1 tablet after breakfast for 7 days. Store below 25°C.',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      provider.setSalesNote('');
                      Navigator.pop(ctx);
                    },
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white),
                    onPressed: () {
                      provider.setSalesNote(ctrl.text.trim());
                      Navigator.pop(ctx);
                    },
                    child: const Text('Save Note'),
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

// ─────────────────────────────────────────────────────────────
// 10. HELD BILLS DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyHeldBillsDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;

  showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        backgroundColor: isDark ? context.cardBg : Colors.white,
        child: Container(
          width: 480,
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.pause_circle_outline_rounded, color: primaryTeal, size: 24),
                      const SizedBox(width: 8),
                      Text('Held Bills (${provider.heldBills.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              if (provider.heldBills.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      children: [
                        Icon(Icons.inbox_outlined, size: 40, color: Colors.grey),
                        SizedBox(height: 8),
                        Text('No bills currently on hold.', style: TextStyle(color: Colors.grey)),
                      ],
                    ),
                  ),
                )
              else
                ConstrainedBox(
                  constraints: const BoxConstraints(maxHeight: 260),
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: provider.heldBills.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final held = provider.heldBills[i];
                      final customer = held['customer'] as Map<String, dynamic>?;
                      final count = held['itemCount'] as int? ?? 0;
                      final amount = held['total'] as double? ?? 0.0;

                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? context.scaffoldBg : Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: context.dividerColor),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(held['id'] as String, style: const TextStyle(fontWeight: FontWeight.bold, color: primaryTeal)),
                                  Text('Patient: ${customer?['name'] ?? 'Walk-in'} • $count Items', style: const TextStyle(fontSize: 11)),
                                  Text('Total: ৳ ${amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: primaryTeal, foregroundColor: Colors.white),
                              onPressed: () {
                                provider.resumeHeldCart(i);
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Held order resumed to cart!'), duration: Duration(seconds: 1)),
                                );
                              },
                              child: const Text('Resume'),
                            ),
                            const SizedBox(width: 6),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                              onPressed: () {
                                setState(() => provider.deleteHeldBill(i));
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────
// 11. CHECKOUT & RECEIPT DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyReceiptDialog(BuildContext context, Map<String, dynamic> order, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => PharmacyReceiptModal(order: order, isDark: isDark),
  );
}

void showPharmacyCheckoutDialog(BuildContext context, PharmacyProvider provider) {
  if (provider.cart.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Cart is empty! Add medicines before checking out.'), backgroundColor: Colors.orange),
    );
    return;
  }

  final isDark = context.isDark;

  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => PharmacyCheckoutPaymentModal(
      provider: provider,
      isDark: isDark,
      onPaymentComplete: (order) {
        showPharmacyReceiptDialog(ctx, order, isDark);
      },
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PHARMACY CHECKOUT & PAYMENT MODAL (Matching Retail POS reference)
// ─────────────────────────────────────────────────────────────────────────────
class PharmacyCheckoutPaymentModal extends StatefulWidget {
  final PharmacyProvider provider;
  final bool isDark;
  final void Function(Map<String, dynamic> order) onPaymentComplete;

  const PharmacyCheckoutPaymentModal({
    super.key,
    required this.provider,
    required this.isDark,
    required this.onPaymentComplete,
  });

  @override
  State<PharmacyCheckoutPaymentModal> createState() => _PharmacyCheckoutPaymentModalState();
}

class _PharmacyCheckoutPaymentModalState extends State<PharmacyCheckoutPaymentModal> {
  late String _selectedMethod;
  final TextEditingController _tenderedController = TextEditingController();
  double _tenderedAmount = 0.0;

  // Non-cash helpers
  String _cardType = 'Visa';
  final TextEditingController _cardAuthCtrl = TextEditingController();
  String _mobileProvider = 'bKash';
  final TextEditingController _trxIdCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    final current = widget.provider.selectedPaymentMethod.toUpperCase();
    if (current == 'CARD' || current == 'MOBILE_PAY' || current == 'CUSTOMER_DUE' || current == 'BKASH/NAGAD') {
      _selectedMethod = current == 'BKASH/NAGAD' ? 'MOBILE_PAY' : current;
    } else {
      _selectedMethod = 'CASH';
    }
    _tenderedController.text = '0';
    _tenderedAmount = 0.0;
  }

  @override
  void dispose() {
    _tenderedController.dispose();
    _cardAuthCtrl.dispose();
    _trxIdCtrl.dispose();
    super.dispose();
  }

  void _onTenderedChanged(String val) {
    setState(() {
      _tenderedAmount = double.tryParse(val) ?? 0.0;
    });
  }

  void _setExactAmount() {
    final total = widget.provider.total;
    setState(() {
      _tenderedAmount = total;
      _tenderedController.text = total % 1 == 0 ? total.toInt().toString() : total.toStringAsFixed(2);
    });
  }

  void _addDenomination(double amount) {
    setState(() {
      _tenderedAmount += amount;
      _tenderedController.text = _tenderedAmount % 1 == 0
          ? _tenderedAmount.toInt().toString()
          : _tenderedAmount.toStringAsFixed(2);
    });
  }

  void _submitPayment() {
    final total = widget.provider.total;
    final paid = _selectedMethod == 'CASH'
        ? (_tenderedAmount > 0 ? _tenderedAmount : total)
        : total;

    widget.provider.setPaymentMethod(_selectedMethod);
    final order = widget.provider.completeCheckout(
      paymentMethod: _selectedMethod,
      tenderedAmount: paid,
    );
    Navigator.of(context).pop();
    widget.onPaymentComplete(order);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2E2E2E) : const Color(0xFFE2E8F0);
    final total = widget.provider.total;
    final subtotal = widget.provider.subTotal;
    final tax = widget.provider.vat;
    final discount = widget.provider.totalDiscount;
    final itemCount = widget.provider.totalItemCount;
    final customer = widget.provider.selectedCustomer != null
        ? widget.provider.selectedCustomer!['name'] as String
        : 'Walk-in Customer';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: 500,
        constraints: const BoxConstraints(maxWidth: 520, maxHeight: 690),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(4),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.22),
              blurRadius: 28,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Top Bar with Red Close Button ──────────────────────────────
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 12, 10),
                child: Row(
                  children: [
                    const Spacer(),
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.close_rounded, size: 16, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),

              // ── Teal Gradient Banner ───────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [primaryTeal, darkTeal],
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Icon(Icons.medical_services_outlined, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Checkout & Payment',
                              style: TextStyle(
                                fontSize: 14.5,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$itemCount items • Customer: $customer • Pharmacist: Super Administrator',
                              style: const TextStyle(
                                fontSize: 10.5,
                                color: Color(0xFFCCFBF1),
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.of(context).pop(),
                        child: const Icon(Icons.close_rounded, size: 16, color: Colors.white70),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Total Payable Summary Card ─────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF262626) : Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Total Payable',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '৳${total.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: primaryTeal,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              const Text('Subtotal:   ', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                              Text(
                                '৳${subtotal.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                          if (discount > 0) ...[
                            const SizedBox(height: 3),
                            Row(
                              children: [
                                Text('Discount (${widget.provider.globalDiscount.toStringAsFixed(0)}%):   ', style: const TextStyle(fontSize: 11.5, color: Color(0xFF10B981))),
                                Text(
                                  '-৳${discount.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              const Text('Tax / VAT (5%):   ', style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                              Text(
                                '৳${tax.toStringAsFixed(2)}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ── Payment Method Label & Selector ────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PAYMENT METHOD',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _buildMethodItem('CASH', 'Cash', Icons.payments_outlined, isDark, borderColor),
                        const SizedBox(width: 8),
                        _buildMethodItem('CARD', 'Card / POS', Icons.credit_card_outlined, isDark, borderColor),
                        const SizedBox(width: 8),
                        _buildMethodItem('MOBILE_PAY', 'Mobile\nBanking', Icons.phone_android_outlined, isDark, borderColor),
                        const SizedBox(width: 8),
                        _buildMethodItem('CUSTOMER_DUE', 'Customer\nDue', Icons.receipt_long_outlined, isDark, borderColor),
                      ],
                    ),
                  ],
                ),
              ),

              // ── Dynamic Payment Detail Area ────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                child: _buildSelectedMethodArea(isDark, borderColor, total),
              ),

              // ── Bottom Action Button ───────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: _buildBottomActionButton(total),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMethodItem(String id, String label, IconData icon, bool isDark, Color borderColor) {
    final isSelected = _selectedMethod == id;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedMethod = id;
            if (id == 'CASH' && _tenderedAmount == 0) {
              _tenderedController.text = '0';
            }
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: 74,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          decoration: BoxDecoration(
            color: isSelected
                ? primaryTeal
                : (isDark ? const Color(0xFF262626) : Colors.white),
            gradient: isSelected
                ? const LinearGradient(
                    colors: [primaryTeal, darkTeal],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color: isSelected ? primaryTeal : borderColor,
              width: isSelected ? 1.5 : 1.0,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: primaryTeal.withValues(alpha: 0.3),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 20,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.grey.shade400 : const Color(0xFF334155)),
              ),
              const SizedBox(height: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? Colors.white
                      : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSelectedMethodArea(bool isDark, Color borderColor, double total) {
    if (_selectedMethod == 'CASH') {
      return _buildCashTenderedBox(isDark, borderColor, total);
    } else if (_selectedMethod == 'CARD') {
      return _buildCardPaymentBox(isDark, borderColor, total);
    } else if (_selectedMethod == 'MOBILE_PAY') {
      return _buildMobileBankingBox(isDark, borderColor, total);
    } else {
      return _buildCustomerDueBox(isDark, borderColor, total);
    }
  }

  // ── Cash Tendered Box (Exact Match to Retail Reference) ────────────────────
  Widget _buildCashTenderedBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'CASH TENDERED (৳)',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                  letterSpacing: 0.3,
                ),
              ),
              InkWell(
                onTap: _setExactAmount,
                borderRadius: BorderRadius.circular(3),
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Text(
                    'Exact Amount',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                      color: primaryTeal,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Large Input Box
          Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF181818) : Colors.white,
              borderRadius: BorderRadius.circular(4),
              border: Border.all(
                color: isDark ? const Color(0xFF3D3D3D) : const Color(0xFFCBD5E1),
              ),
            ),
            child: Row(
              children: [
                const Text(
                  '৳',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _tenderedController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    textAlign: TextAlign.end,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                    ),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      isDense: true,
                      hintText: '0',
                    ),
                    onChanged: _onTenderedChanged,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Quick Denomination Chips (+৳10, +৳20, +৳50, +৳100, +৳200, +৳500, +৳1000)
          Row(
            children: [10, 20, 50, 100, 200, 500, 1000].map((d) {
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 1.5),
                  child: InkWell(
                    onTap: () => _addDenomination(d.toDouble()),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF2C2C2C) : Colors.white,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: borderColor),
                      ),
                      child: Text(
                        '+৳$d',
                        style: TextStyle(
                          fontSize: d >= 1000 ? 9.5 : 10.0,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.grey.shade200 : const Color(0xFF334155),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 10),

          // Summary message box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    _tenderedAmount == 0
                        ? 'Please enter cash amount received'
                        : (_tenderedAmount < total
                            ? 'Remaining due: ৳${(total - _tenderedAmount).toStringAsFixed(2)}'
                            : 'Change return: ৳${(_tenderedAmount - total).toStringAsFixed(2)}'),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: _tenderedAmount >= total ? FontWeight.w700 : FontWeight.w500,
                      color: _tenderedAmount >= total
                          ? const Color(0xFF10B981)
                          : (_tenderedAmount > 0
                              ? const Color(0xFFEF4444)
                              : (isDark ? Colors.grey.shade400 : const Color(0xFF64748B))),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  'Total: ৳${total.toStringAsFixed(2)}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.grey.shade300 : const Color(0xFF334155),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Card Payment Box ──────────────────────────────────────────────────────
  Widget _buildCardPaymentBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.credit_card_rounded, size: 16, color: primaryTeal),
              const SizedBox(width: 6),
              Text(
                'POS Terminal Ready',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF1E293B)),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text('Terminal Online', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: ['Visa', 'MasterCard', 'Amex', 'Other'].map((b) {
              final sel = _cardType == b;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2.0),
                  child: InkWell(
                    onTap: () => setState(() => _cardType = b),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: sel ? primaryTeal : (isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        b,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: sel ? Colors.white : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _cardAuthCtrl,
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Approval / Auth Code (Optional)',
              hintStyle: const TextStyle(fontSize: 11),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: borderColor)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            ),
          ),
        ],
      ),
    );
  }

  // ── Mobile Banking Box ────────────────────────────────────────────────────
  Widget _buildMobileBankingBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: ['bKash', 'Nagad', 'Rocket', 'Upay'].map((p) {
              final sel = _mobileProvider == p;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2.0),
                  child: InkWell(
                    onTap: () => setState(() => _mobileProvider = p),
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: sel ? primaryTeal : (isDark ? const Color(0xFF2C2C2C) : const Color(0xFFF1F5F9)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        p,
                        style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: sel ? Colors.white : (isDark ? Colors.grey.shade300 : const Color(0xFF334155)),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _trxIdCtrl,
            decoration: InputDecoration(
              isDense: true,
              hintText: 'Transaction ID (TrxID) / Ref',
              hintStyle: const TextStyle(fontSize: 11),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: borderColor)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            ),
          ),
        ],
      ),
    );
  }

  // ── Customer Due Box ──────────────────────────────────────────────────────
  Widget _buildCustomerDueBox(bool isDark, Color borderColor, double total) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222222) : Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline_rounded, color: Color(0xFFF59E0B), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Post as Customer Due / Credit',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  'Total ৳${total.toStringAsFixed(2)} will be debited to customer receivable ledger.',
                  style: TextStyle(fontSize: 10.5, color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Bottom Action Button (Exact Match to Reference) ──────────────────────
  Widget _buildBottomActionButton(double total) {
    final isCashZero = _selectedMethod == 'CASH' && _tenderedAmount == 0;

    return InkWell(
      onTap: _submitPayment,
      borderRadius: BorderRadius.circular(4),
      child: Container(
        height: 46,
        decoration: BoxDecoration(
          color: isCashZero ? primaryTeal.withValues(alpha: 0.5) : null,
          gradient: isCashZero
              ? null
              : const LinearGradient(
                  colors: [primaryTeal, darkTeal],
                ),
          borderRadius: BorderRadius.circular(4),
          boxShadow: isCashZero
              ? null
              : [
                  BoxShadow(
                    color: primaryTeal.withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isCashZero
                  ? Icons.check_circle_outline_rounded
                  : Icons.check_circle_rounded,
              size: 18,
              color: Colors.white,
            ),
            const SizedBox(width: 8),
            Text(
              isCashZero
                  ? 'Enter Tendered Cash (৳${total.toStringAsFixed(2)})'
                  : 'Complete Payment (৳${total.toStringAsFixed(2)})',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                letterSpacing: 0.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHARMACY THERMAL POS RECEIPT MODAL (Pixel-perfect matching Retail POS reference)
// ─────────────────────────────────────────────────────────────────────────────
class PharmacyReceiptModal extends StatelessWidget {
  final Map<String, dynamic> order;
  final bool isDark;

  const PharmacyReceiptModal({
    super.key,
    required this.order,
    required this.isDark,
  });

  String _formatDate(DateTime dt) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    final m = months[dt.month];
    final hr = dt.hour.toString().padLeft(2, '0');
    final min = dt.minute.toString().padLeft(2, '0');
    return '${dt.day} $m ${dt.year}, $hr:$min';
  }

  Widget _buildDashedDivider() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boxWidth = constraints.constrainWidth();
        const dashWidth = 4.0;
        const dashSpace = 3.0;
        final dashCount = (boxWidth / (dashWidth + dashSpace)).floor();
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(dashCount, (_) {
            return const SizedBox(
              width: dashWidth,
              height: 1,
              child: DecoratedBox(
                decoration: BoxDecoration(color: Color(0xFFCBD5E1)),
              ),
            );
          }),
        );
      },
    );
  }

  Widget _buildBarcode() {
    final barPattern = [3, 1, 2, 2, 1, 3, 1, 2, 3, 1, 1, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 2, 1, 3];
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: barPattern.asMap().entries.map((entry) {
        final isBlack = entry.key % 2 == 0;
        final width = entry.value.toDouble() * 1.5;
        return Container(
          width: width,
          height: 38,
          color: isBlack ? (isDark ? Colors.grey.shade300 : const Color(0xFF1E293B)) : Colors.transparent,
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final receiptBg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final textDark = isDark ? Colors.white : const Color(0xFF0F172A);
    final textMuted = isDark ? Colors.grey.shade400 : const Color(0xFF475569);
    final borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFBFDBFE);

    final invoiceDisplay = order['invoiceNo'] as String? ?? 'RX-${DateTime.now().millisecondsSinceEpoch}';
    final customerData = order['customer'] as Map<String, dynamic>?;
    final cust = (customerData != null && customerData['name'] != null && customerData['name'].toString().isNotEmpty)
        ? customerData['name'].toString()
        : 'Walk-in Customer';
    final custShort = cust.length > 20 ? '${cust.substring(0, 18)}...' : cust;
    final doctorData = order['doctor'] as Map<String, dynamic>?;
    final doctorName = (doctorData != null && doctorData['name'] != null) ? doctorData['name'].toString() : '';

    final items = (order['items'] as List<dynamic>?) ?? [];
    final orderDate = (order['date'] as DateTime?) ?? DateTime.now();

    final subTotal = (order['subTotal'] as num?)?.toDouble() ?? 0.0;
    final discount = (order['discount'] as num?)?.toDouble() ?? 0.0;
    final discountPercent = (order['discountPercent'] as num?)?.toDouble() ?? 0.0;
    final vat = (order['vat'] as num?)?.toDouble() ?? 0.0;
    final total = (order['total'] as num?)?.toDouble() ?? 0.0;
    final tendered = (order['tendered'] as num?)?.toDouble() ?? total;
    final change = (order['change'] as num?)?.toDouble() ?? 0.0;
    final paymentMethod = order['paymentMethod'] as String? ?? 'Cash';

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Top Success Pill Badge ─────────────────────────────────────
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline_rounded, size: 16, color: Color(0xFF10B981)),
                  SizedBox(width: 6),
                  Text(
                    'SALE COMPLETED SUCCESSFULLY',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Thermal Receipt Card ───────────────────────────────────────
            Container(
              width: 380,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
              decoration: BoxDecoration(
                color: receiptBg,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: borderColor, width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Store Header
                  Center(
                    child: Text(
                      'MEDICARE PHARMACY',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.8,
                        color: textDark,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Center(
                    child: Text(
                      'House 42, Road 11, Dhanmondi, Dhaka • Counter #PH-01',
                      style: TextStyle(
                        fontSize: 9.5,
                        color: textMuted,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Center(
                    child: Text(
                      'DGDA Drug Lic: DL-DH-48291 • Mushak-6.3 • VAT: 002938194',
                      style: TextStyle(
                        fontSize: 9,
                        color: textMuted,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 2. Invoice & Dispenser Details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Invoice: $invoiceDisplay',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Date: ${_formatDate(orderDate)}',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          'Customer: $custShort',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Dispenser: Pharmacist',
                        style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (doctorName.isNotEmpty) ...[
                    const SizedBox(height: 3),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            'Doctor: $doctorName',
                            style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Rx: Validated',
                          style: TextStyle(fontSize: 10, color: textMuted, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 8),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 3. Table Headers
                  Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          'ITEM / GENERIC',
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'QTY',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'RATE',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'TOTAL',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            color: textMuted,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // 4. Item Rows
                  ...items.map((it) {
                    final item = it as PharmacyCartItem;
                    final m = item.medicine;
                    final itemTotal = m.price * item.quantity;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 5,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  m.name,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: textDark,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                Text(
                                  '${m.genericName} • ${m.manufacturer}',
                                  style: const TextStyle(
                                    fontSize: 8.5,
                                    color: Color(0xFF94A3B8),
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '${item.quantity}',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: textDark,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '৳${m.price.toStringAsFixed(2)}',
                                textAlign: TextAlign.right,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: textMuted,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                '৳${itemTotal.toStringAsFixed(2)}',
                                textAlign: TextAlign.right,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: textDark,
                                  fontFamily: 'monospace',
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 6),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 8),

                  // 5. Subtotal & VAT
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Subtotal:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${subTotal.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  if (discount > 0) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Discount (${discountPercent.toStringAsFixed(0)}%):',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                        Text(
                          '-৳${discount.toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669), fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'VAT (Mushak 6.3 - 5%):',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${vat.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Solid Line
                  const Divider(color: Color(0xFFCBD5E1), height: 1, thickness: 1),
                  const SizedBox(height: 6),

                  // Net Payable
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Net Payable:',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: textDark, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${total.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w900, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Solid Line
                  const Divider(color: Color(0xFFCBD5E1), height: 1, thickness: 1),
                  const SizedBox(height: 6),

                  // Tender Details
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Tender Method:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        paymentMethod,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Paid Amount:',
                        style: TextStyle(fontSize: 11, color: textMuted, fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${tendered.toStringAsFixed(2)}',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textDark, fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Return Amount:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF059669), fontFamily: 'monospace'),
                      ),
                      Text(
                        '৳${change.toStringAsFixed(2)}',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF059669), fontFamily: 'monospace'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Divider
                  _buildDashedDivider(),
                  const SizedBox(height: 12),

                  // 6. Barcode Section
                  Center(child: _buildBarcode()),
                  const SizedBox(height: 4),
                  const Center(
                    child: Text(
                      '** MEDICARE POS **',
                      style: TextStyle(fontSize: 10, color: Color(0xFF64748B), letterSpacing: 3),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 7. Footer Greetings
                  Center(
                    child: Text(
                      'Thank you for your visit! Wishing you good health.\nPlease visit us again.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                        color: textMuted,
                        fontFamily: 'monospace',
                        height: 1.3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: Text(
                      'Software by Blue Oceans POS',
                      style: TextStyle(
                        fontSize: 8.5,
                        color: isDark ? Colors.grey.shade500 : const Color(0xFF94A3B8),
                        fontFamily: 'monospace',
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Bottom Action Buttons ──────────────────────────────────────
            SizedBox(
              width: 380,
              child: Row(
                children: [
                  // Print Thermal (80mm)
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Printing Thermal Receipt (80mm) for $invoiceDisplay...'),
                            duration: const Duration(seconds: 2),
                            backgroundColor: primaryTeal,
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF242424) : Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF93C5FD)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.print_outlined, size: 16, color: isDark ? Colors.white : const Color(0xFF334155)),
                            const SizedBox(width: 8),
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Print Thermal',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                                    height: 1.1,
                                  ),
                                ),
                                Text(
                                  '(80mm)',
                                  style: TextStyle(
                                    fontSize: 9.5,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // New Sale Button
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.of(context).pop(),
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: primaryTeal,
                          borderRadius: BorderRadius.circular(4),
                          boxShadow: [
                            BoxShadow(
                              color: primaryTeal.withValues(alpha: 0.35),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.refresh_rounded, size: 18, color: Colors.white),
                            SizedBox(width: 6),
                            Text(
                              'New Sale',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// 12. NOTIFICATIONS & ALERTS DIALOG
// ─────────────────────────────────────────────────────────────
void showPharmacyNotificationDialog(BuildContext context, PharmacyProvider provider) {
  final isDark = context.isDark;

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: isDark ? context.cardBg : Colors.white,
      child: Container(
        width: 440,
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.notifications_active_rounded, color: Colors.orange, size: 24),
                    SizedBox(width: 8),
                    Text('Pharmacy Alerts & Notifications', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 10),
            _alertItem(context, '⚠️ Expiry Alert: Metformin 500mg batch MET-0043 expires in 28 days!'),
            _alertItem(context, '📦 Low Stock Alert: Azithromycin 500mg (18 units remaining). Refill recommended.'),
            _alertItem(context, '🔔 Shift Reminder: Shift handover scheduled at 04:00 PM for Cashier Ahmed R.'),
          ],
        ),
      ),
    ),
  );
}

Widget _alertItem(BuildContext context, String text) {
  return Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: Colors.orange.withValues(alpha: 0.08),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: Colors.orange.withValues(alpha: 0.2)),
    ),
    child: Row(
      children: [
        const Icon(Icons.info_outline, color: Colors.orange, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 11))),
      ],
    ),
  );
}
