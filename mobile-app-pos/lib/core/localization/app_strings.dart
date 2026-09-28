/// Central place for all UI strings in English (en) and Bengali (bn).
/// Usage: AppStrings.get('table', locale)
class AppStrings {
  AppStrings._();

  /// BDT currency symbol used throughout the app.
  static const String currency = '৳';

  static String get(String key, String locale) {
    return _strings[key]?[locale] ?? _strings[key]?['en'] ?? key;
  }

  static const Map<String, Map<String, String>> _strings = {
    // ── App ──────────────────────────────────────────────
    'app_name': {
      'en': 'ZestBite Enterprise',
      'bn': 'জেস্টবাইট এন্টারপ্রাইজ',
    },
    'app_subtitle': {
      'en': 'Select a point of sale system',
      'bn': 'পয়েন্ট অব সেল সিস্টেম বেছে নিন',
    },

    // ── Home Screen – Module Names ────────────────────────
    'restaurant_pos': {'en': 'Restaurant POS', 'bn': 'রেস্তোরাঁ POS'},
    'restaurant_pos_desc': {
      'en': 'Dine-in, Takeaway, Tables, Kitchen',
      'bn': 'ডাইন-ইন, টেকঅ্যাওয়ে, টেবিল, রান্নাঘর',
    },
    'grocery_pos': {'en': 'Grocery POS', 'bn': 'মুদিখানা POS'},
    'grocery_pos_desc': {
      'en': 'Barcode scanning, Weight scaling, Inventory',
      'bn': 'বারকোড স্ক্যান, ওজন মাপা, ইনভেন্টরি',
    },
    'pharmacy_pos': {'en': 'Pharmacy POS', 'bn': 'ফার্মেসি POS'},
    'pharmacy_pos_desc': {
      'en': 'Prescriptions, Expiry tracking, Batch mgmt',
      'bn': 'প্রেসক্রিপশন, মেয়াদ ট্র্যাকিং, ব্যাচ',
    },
    'wholesaler_pos': {'en': 'Wholesaler POS', 'bn': 'পাইকারি POS'},
    'wholesaler_pos_desc': {
      'en': 'Bulk orders, Customer credit, B2B pricing',
      'bn': 'বাল্ক অর্ডার, ক্রেডিট, B2B মূল্য',
    },
    'fashion_retail': {'en': 'Retail & Superstore', 'bn': 'রিটেইল ও সুপারস্টোর'},
    'fashion_retail_desc': {
      'en': 'Daily essentials, General store, Quick checkout & Stock',
      'bn': 'নিত্যপণ্য, মুদি দোকান, দ্রুত বিলিং ও স্টক',
    },
    'dashboard': {'en': 'Dashboard & Reports', 'bn': 'ড্যাশবোর্ড ও রিপোর্ট'},
    'dashboard_desc': {
      'en': 'Analytics, Multi-store management',
      'bn': 'বিশ্লেষণ, মাল্টি-স্টোর ব্যবস্থাপনা',
    },
    'coming_soon': {'en': 'SOON', 'bn': 'শীঘ্রই'},
    'coming_soon_msg': {
      'en': 'is coming soon!',
      'bn': 'শীঘ্রই আসছে!',
    },

    // ── Settings ──────────────────────────────────────────
    'settings': {'en': 'Settings', 'bn': 'সেটিংস'},
    'appearance': {'en': 'Appearance', 'bn': 'চেহারা'},
    'dark_mode': {'en': 'Dark Mode', 'bn': 'ডার্ক মোড'},
    'light_mode': {'en': 'Light Mode', 'bn': 'লাইট মোড'},
    'language': {'en': 'Language', 'bn': 'ভাষা'},
    'currency': {'en': 'Currency', 'bn': 'মুদ্রা'},
    'currency_desc': {
      'en': 'Bangladeshi Taka (৳)',
      'bn': 'বাংলাদেশি টাকা (৳)',
    },
    'close': {'en': 'Close', 'bn': 'বন্ধ করুন'},
    'done': {'en': 'Done', 'bn': 'সম্পন্ন'},

    // ── POS Info Bar ─────────────────────────────────────
    'table': {'en': 'Table', 'bn': 'টেবিল'},
    'guests': {'en': 'Guests', 'bn': 'অতিথি'},
    'waiter': {'en': 'Waiter', 'bn': 'ওয়েটার'},

    // ── Action Buttons ────────────────────────────────────
    'hold': {'en': 'Hold', 'bn': 'হোল্ড'},
    'recall': {'en': 'Recall', 'bn': 'রিকল'},
    'split': {'en': 'Split', 'bn': 'বিভক্ত'},
    'transfer': {'en': 'Transfer', 'bn': 'স্থানান্তর'},
    'clear_order': {'en': 'Clear Order', 'bn': 'মুছুন'},

    // ── Order Summary ─────────────────────────────────────
    'total': {'en': 'Total', 'bn': 'মোট'},
    'pay_now': {'en': 'PAY NOW', 'bn': 'পেমেন্ট করুন'},

    // ── General ───────────────────────────────────────────
    'cancel': {'en': 'Cancel', 'bn': 'বাতিল'},
    'save': {'en': 'Save', 'bn': 'সংরক্ষণ'},
    // ── Order Summary / Payment ───────────────────────────────────
    'order_summary': {'en': 'Order Summary', 'bn': 'অর্ডার সারাংশ'},
    'items': {'en': 'Items', 'bn': 'আইটেম'},
    'clear_all': {'en': 'Clear All', 'bn': 'সব মুছুন'},
    'clear_cart': {'en': 'Clear Cart?', 'bn': 'কার্ট মুছবেন?'},
    'clear_cart_msg': {'en': 'Are you sure you want to clear all items in the cart?', 'bn': 'আপনি কি কার্টের সব আইটেম মুছতে চান?'},
    'subtotal': {'en': 'Subtotal', 'bn': 'সাবটোটাল'},
    'tax': {'en': 'Tax (8%)', 'bn': 'ট্যাক্স (৮%)'},
    'service_charge': {'en': 'Service Charge (4%)', 'bn': 'সার্ভিস চার্জ (৪%)'},
    'total_payable': {'en': 'Total Payable', 'bn': 'মোট পরিশোধযোগ্য'},
    'place_order': {'en': 'Place an Order', 'bn': 'অর্ডার দিন'},
    'cart_empty': {'en': 'Cart is empty', 'bn': 'কার্ট খালি'},
    'add_order_note': {'en': 'Add Order Note...', 'bn': 'অর্ডার নোট যোগ করুন...'},
    'discount_label': {'en': 'Discount', 'bn': 'ছাড়'},

    // ── Bottom Action Bar ────────────────────────────────────────
    'coupon': {'en': 'Coupon', 'bn': 'কুপন'},
    'discount': {'en': 'Discount', 'bn': 'ছাড়'},
    'promo': {'en': 'Promo', 'bn': 'প্রোমো'},
    'note': {'en': 'Note', 'bn': 'নোট'},
    'kitchen_note': {'en': 'Kitchen Note', 'bn': 'কিচেন নোট'},
    'bill_print': {'en': 'Bill Print', 'bn': 'বিল প্রিন্ট'},

    // ── POS Header ───────────────────────────────────────────────
    'dine_in': {'en': 'Dine In', 'bn': 'রেস্তোরাঁয়'},
    'take_away': {'en': 'Take Away', 'bn': 'নিয়ে যান'},
    'delivery': {'en': 'Delivery', 'bn': 'ডেলিভারি'},
    'search_hint': {'en': 'Search menu items...', 'bn': 'মেনু আইটেম খুঁজুন...'},
    'find_dish': {'en': 'Find your favourite dish...', 'bn': 'পছন্দের খাবার খুঁজুন...'},
    'all_items': {'en': 'All Items', 'bn': 'সব আইটেম'},
    'popular': {'en': 'Popular', 'bn': 'জনপ্রিয়'},

    // ── POS 3-dot Menu ───────────────────────────────────────────
    'waiter_menu': {'en': 'Waiter', 'bn': 'ওয়েটার'},
    'custom_item': {'en': 'Custom Item', 'bn': 'কাস্টম আইটেম'},
    'split_bill': {'en': 'Split Bill', 'bn': 'বিল ভাগ'},
    'transfer_order': {'en': 'Transfer Order', 'bn': 'অর্ডার স্থানান্তর'},
    'held_orders': {'en': 'Held Orders', 'bn': 'হোল্ড অর্ডার'},
    'shift_report': {'en': 'Shift Report', 'bn': 'শিফট রিপোর্ট'},
    'hardware_settings': {'en': 'Hardware Settings', 'bn': 'হার্ডওয়্যার সেটিংস'},
    'system_info': {'en': 'System Info', 'bn': 'সিস্টেম তথ্য'},
    'clear_cart_menu': {'en': 'Clear Cart', 'bn': 'কার্ট মুছুন'},

    // ── Dialogs ───────────────────────────────────────────
    'select_table': {'en': 'Select Table', 'bn': 'টেবিল নির্বাচন করুন'},
    'available': {'en': 'Available', 'bn': 'উপলব্ধ'},
    'occupied': {'en': 'Occupied', 'bn': 'অধিকৃত'},
    'selected_label': {'en': 'Selected', 'bn': 'নির্বাচিত'},
    'seats': {'en': 'seats', 'bn': 'সিট'},
    'select_server': {'en': 'Select Server / Waiter', 'bn': 'সার্ভার / ওয়েটার নির্বাচন করুন'},
    'no_held_orders': {'en': 'No held orders found', 'bn': 'কোনো হোল্ড করা অর্ডার পাওয়া যায়নি'},
    'recall_order': {'en': 'Recall Order', 'bn': 'অর্ডার রিকল'},
    'total_bill': {'en': 'Total Bill', 'bn': 'মোট বিল'},
    'split_equally': {'en': 'Split Equally Among People', 'bn': 'সবার মধ্যে সমানভাবে ভাগ করুন'},
    'people': {'en': 'People', 'bn': 'জন'},
    'each_pays': {'en': 'Each Person Pays', 'bn': 'জনপ্রতি পরিশোধ'},
    'confirm_split': {'en': 'Confirm Split', 'bn': 'বিভক্তি নিশ্চিত করুন'},
    'current_table': {'en': 'Current Table', 'bn': 'বর্তমান টেবিল'},
    'destination_table': {'en': 'Select Destination Table', 'bn': 'গন্তব্য টেবিল বেছে নিন'},
    'add_custom_item': {'en': 'Add Custom Item', 'bn': 'কাস্টম আইটেম যোগ করুন'},
    'item_name': {'en': 'Item Name', 'bn': 'আইটেমের নাম'},
    'price': {'en': 'Price', 'bn': 'মূল্য'},
    'category': {'en': 'Category', 'bn': 'ক্যাটাগরি'},
    'veg_item': {'en': 'Vegetarian Item', 'bn': 'নিরামিষ আইটেম'},
    'add_to_cart': {'en': 'Add to Cart', 'bn': 'কার্টে যোগ করুন'},
    'delete': {'en': 'Delete', 'bn': 'মুছে ফেলুন'},

    // ── Hardware & System ────────────────────────────────
    'hardware_settings_title': {'en': 'Hardware Settings', 'bn': 'হার্ডওয়্যার সেটিংস'},
    'thermal_printer': {'en': 'Thermal Receipt Printer', 'bn': 'থার্মাল রসিদ প্রিন্টার'},
    'cash_drawer': {'en': 'Cash Drawer', 'bn': 'ক্যাশ ড্রয়ার'},
    'barcode_scanner': {'en': 'Barcode Scanner', 'bn': 'বারকোড স্ক্যানার'},
    'kitchen_printer': {'en': 'Kitchen Printer', 'bn': 'কিচেন প্রিন্টার'},
    'card_terminal': {'en': 'Card Terminal', 'bn': 'কার্ড টার্মিনাল'},
    'customer_display': {'en': 'Customer Display', 'bn': 'কাস্টমার ডিসপ্লে'},
    'disabled': {'en': 'Disabled', 'bn': 'নিষ্ক্রিয়'},
    'enabled': {'en': 'Enabled', 'bn': 'সক্রিয়'},
    'save_settings': {'en': 'Save Settings', 'bn': 'সেটিংস সংরক্ষণ করুন'},
    'connection_type': {'en': 'Connection type', 'bn': 'সংযোগের ধরন'},
    'test': {'en': 'Test', 'bn': 'পরীক্ষা'},
    'printer_ip': {'en': 'Printer IP Address', 'bn': 'প্রিন্টার IP ঠিকানা'},
    'hardware_notice': {
      'en': 'Full hardware activation requires SDK/driver integration. UI is ready — connect ESC/POS, Bluetooth or USB packages in the backend to activate.',
      'bn': 'সম্পূর্ণ হার্ডওয়্যার সক্রিয় করতে SDK/ড্রাইভার ইন্টিগ্রেশন প্রয়োজন। ইউজার ইন্টারফেস প্রস্তুত — ব্যাকএন্ডে ESC/POS, ব্লুটুথ বা USB প্যাকেজ যুক্ত করুন।',
    },
    'view_licenses': {'en': 'View licenses', 'bn': 'লাইসেন্স দেখুন'},
    'connected': {'en': 'Connected', 'bn': 'সংযুক্ত'},
    'ready_to_trigger': {'en': 'Ready to trigger', 'bn': 'প্রস্তুত'},
    'listening_scans': {'en': 'Listening for scans', 'bn': 'স্ক্যান করার জন্য প্রস্তুত'},
    'ready_for_payment': {'en': 'Ready for payment', 'bn': 'পেমেন্টের জন্য প্রস্তুত'},
    'showing_customer_view': {'en': 'Showing customer view', 'bn': 'কাস্টমার ভিউ দেখাচ্ছে'},
    'test_print_sent': {'en': 'Test print sent', 'bn': 'টেস্ট প্রিন্ট পাঠানো হয়েছে'},
    'cash_drawer_open': {'en': 'Cash drawer open signal sent', 'bn': 'ক্যাশ ড্রয়ার সিগনাল পাঠানো হয়েছে'},
    'scan_test_msg': {'en': 'Scan a barcode to test scanner', 'bn': 'পরীক্ষার জন্য একটি বারকোড স্ক্যান করুন'},
    'card_terminal_ping': {'en': 'Card terminal ping sent', 'bn': 'কার্ড টার্মিনাল পিং পাঠানো হয়েছে'},
    'customer_display_test': {'en': 'Customer display test sent', 'bn': 'কাস্টমার ডিসপ্লে টেস্ট পাঠানো হয়েছে'},
    'settings_saved': {'en': 'Hardware settings saved', 'bn': 'হার্ডওয়্যার সেটিংস সংরক্ষিত হয়েছে'},
    'shift_sales_total': {'en': 'Daily Shift Sales Total', 'bn': 'দৈনিক শিফট বিক্রয় মোট'},

    // ── Modifiers & Customization ────────────────────────
    'customize_item': {'en': 'Customize Item', 'bn': 'আইটেম কাস্টমাইজ করুন'},
    'select_size': {'en': 'Select Size', 'bn': 'সাইজ বেছে নিন'},
    'extra_toppings': {'en': 'Extra Toppings', 'bn': 'অতিরিক্ত টপিংস'},
    'special_instructions': {'en': 'Special Instructions', 'bn': 'বিশেষ নির্দেশাবলী'},
    'add_instructions_hint': {'en': 'e.g. No onion, extra spicy...', 'bn': 'যেমন: পেঁয়াজ ছাড়া, বেশি ঝাল...'},
    'regular': {'en': 'Regular', 'bn': 'সাধারণ'},
    'large': {'en': 'Large', 'bn': 'বড়'},
    'extra_cheese': {'en': 'Extra Cheese', 'bn': 'অতিরিক্ত চিজ'},
    'extra_chicken': {'en': 'Extra Chicken', 'bn': 'অতিরিক্ত চিকেন'},
    'extra_sauce': {'en': 'Extra Sauce', 'bn': 'অতিরিক্ত সস'},
    'no_onion': {'en': 'No Onion', 'bn': 'পেঁয়াজ ছাড়া'},

    // ── Payment Methods ──────────────────────────────────
    'payment_cash': {'en': 'Cash', 'bn': 'নগদ'},
    'payment_card': {'en': 'Card', 'bn': 'কার্ড'},
    'payment_qr': {'en': 'QR Pay', 'bn': 'QR পে'},
    'cash_tendered': {'en': 'Cash Tendered', 'bn': 'নগদ গ্রহণ / টেন্ডার'},
    'change_return': {'en': 'Change Return', 'bn': 'ফেরত / চেঞ্জ'},
    'remaining_due': {'en': 'Remaining Due', 'bn': 'অবশিষ্ট বাকি'},
    'exact_amount': {'en': 'Exact Amount', 'bn': 'পুরো টাকা'},

    // ── Waiter Names ─────────────────────────────────────
    'waiter_1': {'en': 'Rahim Uddin', 'bn': 'রহিম উদ্দিন'},
    'waiter_2': {'en': 'Karim Ahmed', 'bn': 'করিম আহমেদ'},
    'waiter_3': {'en': 'Sumaiya Akter', 'bn': 'সুমাইয়া আক্তার'},
    'waiter_4': {'en': 'Abdur Rahman', 'bn': 'আব্দুর রহমান'},
    'waiter_5': {'en': 'Fatima Begum', 'bn': 'ফাতেমা বেগম'},

    // ── Roles ─────────────────────────────────────────────
    'role_head': {'en': 'Head Server', 'bn': 'প্রধান পরিবেশক'},
    'role_senior': {'en': 'Senior Waiter', 'bn': 'সিনিয়র ওয়েটার'},
    'role_waiter': {'en': 'Waiter', 'bn': 'ওয়েটার'},
    'role_waitress': {'en': 'Waitress', 'bn': 'ওয়েট্রেস'},
    'role_junior': {'en': 'Junior Waiter', 'bn': 'জুনিয়র ওয়েটার'},

    // ── Grocery POS ───────────────────────────────────────
    'freshmart': {'en': 'FreshMart', 'bn': 'ফ্রেশমার্ট'},
    'pos_system': {'en': 'POS SYSTEM', 'bn': 'POS সিস্টেম'},
    'g_search_hint': {
      'en': 'Search product by name, barcode or scan...',
      'bn': 'নাম, বারকোড বা স্ক্যান দিয়ে খুঁজুন...',
    },
    'walk_in_customer': {'en': 'Walk-in Customer', 'bn': 'ওয়াক-ইন কাস্টমার'},
    'default_customer': {'en': 'Default Customer', 'bn': 'ডিফল্ট কাস্টমার'},
    'loyalty_points': {'en': 'Loyalty Points', 'bn': 'লয়ালটি পয়েন্ট'},
    'pts': {'en': 'Pts', 'bn': 'পয়েন্ট'},
    'invoice': {'en': 'Invoice', 'bn': 'ইনভয়েস'},
    'cat_all': {'en': 'All Items', 'bn': 'সব আইটেম'},
    'cat_fruits': {'en': 'Fruits & Veg', 'bn': 'ফল ও সবজি'},
    'cat_grocery': {'en': 'Grocery', 'bn': 'মুদি'},
    'cat_beverages': {'en': 'Beverages', 'bn': 'পানীয়'},
    'cat_snacks': {'en': 'Snacks', 'bn': 'স্ন্যাকস'},
    'cat_dairy': {'en': 'Dairy', 'bn': 'ডেইরি'},
    'cat_household': {'en': 'Household', 'bn': 'গৃহস্থালি'},
    'more': {'en': 'More', 'bn': 'আরও'},
    'price_check': {'en': 'Price Check', 'bn': 'মূল্য যাচাই'},
    'recent_items': {'en': 'Recent Items', 'bn': 'সাম্প্রতিক'},
    'stock_check': {'en': 'Stock Check', 'bn': 'স্টক চেক'},
    'offers': {'en': 'Offers', 'bn': 'অফার'},
    'hold_bill': {'en': 'Hold Bill', 'bn': 'বিল হোল্ড'},
    'top_products': {'en': 'Top Products', 'bn': 'টপ প্রোডাক্ট'},
    'view_all': {'en': 'View All', 'bn': 'সব দেখুন'},
    'total_items': {'en': 'Total Items', 'bn': 'মোট আইটেম'},
    'total_qty': {'en': 'Total Qty', 'bn': 'মোট পরিমাণ'},
    'total_savings': {'en': 'Total Savings', 'bn': 'মোট সাশ্রয়'},
    'sales_history': {'en': 'Sales History', 'bn': 'বিক্রয় ইতিহাস'},
    'open_drawer': {'en': 'Open Drawer', 'bn': 'ড্রয়ার খুলুন'},
    'add_customer': {'en': 'Add Customer', 'bn': 'কাস্টমার যোগ'},
    'save_print': {'en': 'Save & Print', 'bn': 'সেভ ও প্রিন্ট'},
    'cart': {'en': 'Cart', 'bn': 'কার্ট'},
    'hold_f7': {'en': 'Hold (F7)', 'bn': 'হোল্ড (F7)'},
    'clear_cart_btn': {'en': 'Clear Cart', 'bn': 'কার্ট মুছুন'},
    'add_note': {'en': 'Add Note', 'bn': 'নোট যোগ'},
    'add_discount': {'en': 'Add Discount', 'bn': 'ছাড় যোগ'},
    'add_coupon': {'en': 'Add Coupon', 'bn': 'কুপন যোগ'},
    'discount_pct': {'en': 'Discount (%)', 'bn': 'ছাড় (%)'},
    'coupon_code': {'en': 'Coupon Code', 'bn': 'কুপন কোড'},
    'apply': {'en': 'Apply', 'bn': 'প্রয়োগ'},
    'sales_note': {'en': 'Sales Note', 'bn': 'বিক্রয় নোট'},
    'sales_note_hint': {
      'en': 'Write a note for this sale...',
      'bn': 'এই বিক্রয়ের জন্য নোট লিখুন...',
    },
    'barcode_lookup': {'en': 'Barcode Lookup', 'bn': 'বারকোড খোঁজা'},
    'recent_sales': {'en': 'Recent Sales', 'bn': 'সাম্প্রতিক বিক্রয়'},
    'return_refund': {'en': 'Return / Refund', 'bn': 'রিটার্ন / রিফান্ড'},
    'vat_label': {'en': 'VAT (0%)', 'bn': 'ভ্যাট (০%)'},
    'you_save': {'en': 'You Save', 'bn': 'সাশ্রয়'},
    'payment_upi': {'en': 'UPI / QR', 'bn': 'UPI / QR'},
    'payment_wallet': {'en': 'Wallet', 'bn': 'ওয়ালেট'},
    'payment_split': {'en': 'Split Payment', 'bn': 'বিভক্ত পেমেন্ট'},
    'pay': {'en': 'Pay', 'bn': 'পেমেন্ট'},
    'save_print_bill': {'en': 'Save & Print Bill', 'bn': 'বিল সেভ ও প্রিন্ট'},
    'view_cart': {'en': 'View Cart', 'bn': 'কার্ট দেখুন'},
    'enter': {'en': 'Enter', 'bn': 'এন্টার'},
    'g_checkout': {'en': 'Checkout', 'bn': 'চেকআউট'},
    'g_bill_held': {'en': 'Bill held successfully', 'bn': 'বিল হোল্ড হয়েছে'},
    'g_drawer_opened': {'en': 'Cash drawer opened', 'bn': 'ক্যাশ ড্রয়ার খোলা হয়েছে'},
    'g_qty_applied': {'en': 'Quantity updated', 'bn': 'পরিমাণ আপডেট হয়েছে'},
  };
}
