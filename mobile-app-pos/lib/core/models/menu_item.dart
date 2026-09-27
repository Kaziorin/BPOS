class MenuItem {
  final int id;
  final String name;
  final String nameBn;
  final double price;
  final String category;
  final String imageUrl;
  final bool isPopular;
  final bool isVeg;
  final List<ModifierGroup>? modifierGroups;

  const MenuItem({
    required this.id,
    required this.name,
    this.nameBn = '',
    required this.price,
    required this.category,
    required this.imageUrl,
    this.isPopular = false,
    this.isVeg = false,
    this.modifierGroups,
  });

  /// Returns the locale-appropriate name.
  String localizedName(String locale) =>
      (locale == 'bn' && nameBn.isNotEmpty) ? nameBn : name;
}

class ModifierGroup {
  final String titleKey; // Key for AppStrings
  final bool multiSelect;
  final List<ModifierOption> options;

  const ModifierGroup({
    required this.titleKey,
    this.multiSelect = false,
    required this.options,
  });
}

class ModifierOption {
  final String nameKey; // Key for AppStrings
  final double extraPrice;

  const ModifierOption({
    required this.nameKey,
    this.extraPrice = 0.0,
  });
}

class CartItem {
  final MenuItem menuItem;
  int quantity;
  List<String> modifiers; // Store display strings (localized)
  String note;
  double extraPricePerUnit;

  CartItem({
    required this.menuItem,
    this.quantity = 1,
    this.modifiers = const [],
    this.note = '',
    this.extraPricePerUnit = 0.0,
  });

  double get totalPrice => (menuItem.price + extraPricePerUnit) * quantity;
}


class OrderType {
  final String id;
  final String name;
  final String icon;

  const OrderType({required this.id, required this.name, required this.icon});
}

class MenuCategory {
  final String id;
  final String name;
  final String nameBn;
  final String icon;

  const MenuCategory({
    required this.id,
    required this.name,
    this.nameBn = '',
    required this.icon,
  });

  /// Returns the locale-appropriate name.
  String localizedName(String locale) =>
      (locale == 'bn' && nameBn.isNotEmpty) ? nameBn : name;
}

class HeldOrder {
  final String id;
  final String tableNumber;
  final String waiter;
  final int guests;
  final String orderType;
  final List<CartItem> items;
  final String note;
  final DateTime timestamp;

  HeldOrder({
    required this.id,
    required this.tableNumber,
    required this.waiter,
    required this.guests,
    required this.orderType,
    required this.items,
    this.note = '',
    required this.timestamp,
  });

  double get total => items.fold(0, (sum, i) => sum + i.totalPrice);
}

class CompletedOrder {
  final String id;
  final String orderType;
  final String tableNumber;
  final String waiter;
  final List<CartItem> items;
  final double subtotal;
  final double discount;
  final double tax;
  final double serviceCharge;
  final double total;
  final String paymentMethod;
  final DateTime timestamp;

  CompletedOrder({
    required this.id,
    required this.orderType,
    required this.tableNumber,
    required this.waiter,
    required this.items,
    required this.subtotal,
    required this.discount,
    required this.tax,
    required this.serviceCharge,
    required this.total,
    required this.paymentMethod,
    required this.timestamp,
  });
}

class CouponModel {
  final String code;
  final String description;
  final double discountPercentage;
  final double? fixedDiscountAmount;

  const CouponModel({
    required this.code,
    required this.description,
    this.discountPercentage = 0.0,
    this.fixedDiscountAmount,
  });
}


// Sample Data
class AppData {
  static const List<MenuCategory> categories = [
    MenuCategory(id: 'all',          name: 'All Items',      nameBn: 'সব আইটেম',        icon: '🍽️'),
    MenuCategory(id: 'popular',      name: 'Popular',        nameBn: 'জনপ্রিয়',          icon: '⭐'),
    MenuCategory(id: 'starters',     name: 'Starters',       nameBn: 'স্টার্টার',          icon: '🥗'),
    MenuCategory(id: 'main_course',  name: 'Main Course',    nameBn: 'প্রধান খাবার',       icon: '🍖'),
    MenuCategory(id: 'pizza',        name: 'Pizza',          nameBn: 'পিজা',              icon: '🍕'),
    MenuCategory(id: 'burgers',      name: 'Burgers',        nameBn: 'বার্গার',            icon: '🍔'),
    MenuCategory(id: 'pasta',        name: 'Pasta',          nameBn: 'পাস্তা',             icon: '🍝'),
    MenuCategory(id: 'rice_noodles', name: 'Rice & Noodles', nameBn: 'ভাত ও নুডলস',      icon: '🍜'),
    MenuCategory(id: 'drinks',       name: 'Drinks',         nameBn: 'পানীয়',             icon: '🥤'),
    MenuCategory(id: 'desserts',     name: 'Desserts',       nameBn: 'মিষ্টি',             icon: '🍰'),
    MenuCategory(id: 'sides',        name: 'Sides',          nameBn: 'পার্শ্ব খাবার',       icon: '🍟'),
    MenuCategory(id: 'addons',       name: 'Add-ons',        nameBn: 'অ্যাড-অন',           icon: '➕'),
  ];

  static const List<OrderType> orderTypes = [
    OrderType(id: 'dine_in',   name: 'Dine In',   icon: '🍽️'),
    OrderType(id: 'take_away', name: 'Take Away', icon: '🛍️'),
    OrderType(id: 'delivery',  name: 'Delivery',  icon: '🛵'),
  ];

  static final List<MenuItem> menuItems = [
    MenuItem(
      id: 1,
      name: 'Chicken Burger',
      nameBn: 'চিকেন বার্গার',
      price: 250.0,
      category: 'burgers',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      isPopular: true,
      modifierGroups: [
        const ModifierGroup(
          titleKey: 'select_size',
          options: [
            ModifierOption(nameKey: 'regular'),
            ModifierOption(nameKey: 'large', extraPrice: 80.0),
          ],
        ),
        const ModifierGroup(
          titleKey: 'extra_toppings',
          multiSelect: true,
          options: [
            ModifierOption(nameKey: 'extra_cheese', extraPrice: 50.0),
            ModifierOption(nameKey: 'extra_chicken', extraPrice: 70.0),
            ModifierOption(nameKey: 'extra_sauce', extraPrice: 20.0),
          ],
        ),
      ],
    ),
    MenuItem(
      id: 2,
      name: 'Margherita Pizza',
      nameBn: 'মার্গেরিটা পিজা',
      price: 550.0,
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
      isPopular: true,
      modifierGroups: [
        const ModifierGroup(
          titleKey: 'select_size',
          options: [
            ModifierOption(nameKey: 'regular'),
            ModifierOption(nameKey: 'large', extraPrice: 200.0),
          ],
        ),
        const ModifierGroup(
          titleKey: 'extra_toppings',
          multiSelect: true,
          options: [
            ModifierOption(nameKey: 'extra_cheese', extraPrice: 80.0),
            ModifierOption(nameKey: 'extra_sauce', extraPrice: 30.0),
          ],
        ),
      ],
    ),
    MenuItem(
      id: 3,
      name: 'Grilled Chicken',
      nameBn: 'গ্রিলড চিকেন',
      price: 420.0,
      category: 'main_course',
      imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop',
      isPopular: true,
    ),

    MenuItem(
      id: 4,
      name: 'Beef Steak',
      nameBn: 'বিফ স্টেক',
      price: 850.0,
      category: 'main_course',
      imageUrl: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 5,
      name: 'Chicken Alfredo Pasta',
      nameBn: 'চিকেন আলফ্রেডো পাস্তা',
      price: 380.0,
      category: 'pasta',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
      isVeg: false,
    ),
    MenuItem(
      id: 6,
      name: 'Caesar Salad',
      nameBn: 'সিজার সালাদ',
      price: 280.0,
      category: 'starters',
      imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      isVeg: true,
    ),
    MenuItem(
      id: 7,
      name: 'BBQ Wings',
      nameBn: 'বিবিকিউ উইংস',
      price: 320.0,
      category: 'starters',
      imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop',
      isPopular: true,
    ),
    MenuItem(
      id: 8,
      name: 'French Fries',
      nameBn: 'ফ্রেঞ্চ ফ্রাই',
      price: 150.0,
      category: 'sides',
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 9,
      name: 'Veg Fried Rice',
      nameBn: 'ভেজ ফ্রাইড রাইস',
      price: 250.0,
      category: 'rice_noodles',
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
      isVeg: true,
    ),
    MenuItem(
      id: 10,
      name: 'Chocolate Lava Cake',
      nameBn: 'চকলেট লাভা কেক',
      price: 180.0,
      category: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1617305855058-336d24456869?w=400&h=300&fit=crop',
      isPopular: true,
    ),
    MenuItem(
      id: 11,
      name: 'Mojito',
      nameBn: 'মোহিতো',
      price: 120.0,
      category: 'drinks',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
      isVeg: true,
    ),
    MenuItem(
      id: 12,
      name: 'Coca Cola (Can)',
      nameBn: 'কোকা কোলা (ক্যান)',
      price: 50.0,
      category: 'drinks',
      imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 13,
      name: 'Paneer Tikka',
      nameBn: 'পনির টিক্কা',
      price: 350.0,
      category: 'starters',
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop',
      isVeg: true,
      isPopular: true,
    ),
    MenuItem(
      id: 14,
      name: 'Mushroom Soup',
      nameBn: 'মাশরুম স্যুপ',
      price: 180.0,
      category: 'starters',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
      isVeg: true,
    ),
    MenuItem(
      id: 15,
      name: 'Pepperoni Pizza',
      nameBn: 'পেপারোনি পিজা',
      price: 650.0,
      category: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 16,
      name: 'Fish & Chips',
      nameBn: 'ফিশ অ্যান্ড চিপস',
      price: 450.0,
      category: 'main_course',
      imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 17,
      name: 'Spaghetti Bolognese',
      nameBn: 'স্প্যাগেটি বোলোনিজ',
      price: 380.0,
      category: 'pasta',
      imageUrl: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 18,
      name: 'Tiramisu',
      nameBn: 'তিরামিসু',
      price: 220.0,
      category: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 19,
      name: 'Garlic Bread',
      nameBn: 'গার্লিক ব্রেড',
      price: 120.0,
      category: 'sides',
      imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop',
      isVeg: true,
    ),
    MenuItem(
      id: 20,
      name: 'Mango Lassi',
      nameBn: 'আমের লাচ্ছি',
      price: 150.0,
      category: 'drinks',
      imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop',
      isVeg: true,
    ),
    MenuItem(
      id: 21,
      name: 'Extra Patty',
      nameBn: 'অতিরিক্ত প্যাটি',
      price: 100.0,
      category: 'addons',
      imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=300&fit=crop',
    ),
    MenuItem(
      id: 22,
      name: 'Gulab Jamun',
      nameBn: 'গোলাপ জামুন',
      price: 120.0,
      category: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400&h=300&fit=crop',
    ),
  ];

}
