import 'medicine_model.dart';

class PharmacyCartItem {
  final MedicineModel medicine;
  int quantity;
  final double discount; // percentage

  PharmacyCartItem({
    required this.medicine,
    this.quantity = 1,
    this.discount = 0.0,
  });

  double get total => (medicine.price * quantity) * (1 - discount / 100);
}
