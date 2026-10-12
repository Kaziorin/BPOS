class SalesOrderItem {
  final String productId;
  final String name;
  final String sku;
  final int qty;
  final double unitPrice;
  final double lineTotal;

  const SalesOrderItem({
    required this.productId,
    required this.name,
    required this.sku,
    required this.qty,
    required this.unitPrice,
    required this.lineTotal,
  });

  factory SalesOrderItem.fromJson(Map<String, dynamic> json) {
    final qty = (json['qty'] ?? json['qtyOrdered'] ?? 1) as num;
    final price = (json['unitPrice'] ?? json['price'] ?? 0.0) as num;
    final total = (json['lineTotal'] ?? (qty * price)) as num;
    final rawName = json['name'] ?? json['productName'];

    return SalesOrderItem(
      productId: json['productId']?.toString() ?? 'prod_1',
      name: (rawName != null && rawName.toString().trim().isNotEmpty)
          ? rawName.toString()
          : 'Item',
      sku: json['sku']?.toString() ?? 'SKU-001',
      qty: qty.toInt(),
      unitPrice: price.toDouble(),
      lineTotal: total.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'name': name,
        'sku': sku,
        'qty': qty,
        'unitPrice': unitPrice,
        'lineTotal': lineTotal,
      };
}

class SalesOrder {
  final String id;
  final String orderNo;
  final String businessType;
  final String source;
  final String status;
  final String customerName;
  final String customerPhone;
  final String customerEmail;
  final String branchName;
  final DateTime orderDate;
  final List<SalesOrderItem> items;
  final double subtotal;
  final double taxTotal;
  final double discountTotal;
  final double serviceCharge;
  final double total;
  final double paidTotal;
  final double dueTotal;
  final double changeReturn;
  final double tenderedAmount;
  final String paymentStatus;
  final String paymentMethod;
  final String cashierName;

  const SalesOrder({
    required this.id,
    required this.orderNo,
    required this.businessType,
    required this.source,
    required this.status,
    required this.customerName,
    required this.customerPhone,
    this.customerEmail = '',
    this.branchName = '',
    required this.orderDate,
    required this.items,
    required this.subtotal,
    required this.taxTotal,
    required this.discountTotal,
    this.serviceCharge = 0.0,
    required this.total,
    this.paidTotal = 0.0,
    this.dueTotal = 0.0,
    this.changeReturn = 0.0,
    this.tenderedAmount = 0.0,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.cashierName,
  });

  int get itemsCount => items.fold(0, (sum, i) => sum + i.qty);

  bool get isToday {
    final now = DateTime.now();
    return orderDate.year == now.year &&
        orderDate.month == now.month &&
        orderDate.day == now.day;
  }

  factory SalesOrder.fromJson(Map<String, dynamic> json, {String defaultBiz = 'restaurant'}) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final itemsList = rawItems
        .map((e) => SalesOrderItem.fromJson(e as Map<String, dynamic>))
        .toList();

    DateTime parsedDate;
    try {
      parsedDate = DateTime.parse(json['orderDate'] ?? json['createdAt'] ?? DateTime.now().toIso8601String());
    } catch (_) {
      parsedDate = DateTime.now();
    }

    final rawCustName = json['customerName'] ??
        (json['customer'] is Map ? json['customer']['name'] : null);
    final custNameStr = rawCustName?.toString().trim();
    final customerName = (custNameStr != null && custNameStr.isNotEmpty)
        ? custNameStr
        : 'Walk-in Customer';

    final rawCustPhone = json['customerPhone'] ??
        (json['customer'] is Map ? json['customer']['phone'] : null);
    final customerPhone = rawCustPhone?.toString().trim() ?? '';

    final rawCustEmail = json['customerEmail'] ??
        (json['customer'] is Map ? json['customer']['email'] : null);
    final customerEmail = rawCustEmail?.toString().trim() ?? '';

    final branchName = json['branchName']?.toString() ?? '';

    final totalVal = ((json['total'] ?? 0) as num).toDouble();
    final rawPaidVal = ((json['paidTotal'] ?? totalVal) as num).toDouble();
    final paidVal = rawPaidVal > totalVal && totalVal > 0 ? totalVal : rawPaidVal;
    final dueVal = ((json['dueTotal'] ?? 0) as num).toDouble();
    final rawTendered = ((json['tenderedAmount'] ?? json['tendered'] ?? 0) as num).toDouble();
    final tenderedVal = rawTendered > 0 ? rawTendered : (rawPaidVal > totalVal ? rawPaidVal : totalVal);
    final changeVal = ((json['changeReturn'] ?? json['change'] ?? (tenderedVal > totalVal ? tenderedVal - totalVal : (rawPaidVal > totalVal ? rawPaidVal - totalVal : 0))) as num).toDouble();

    return SalesOrder(
      id: json['id']?.toString() ?? 'so_1',
      orderNo: json['orderNo']?.toString() ?? json['invoiceNo']?.toString() ?? 'SO-0001',
      businessType: json['businessType']?.toString() ?? defaultBiz,
      source: json['source']?.toString() ?? 'POS',
      status: (json['status']?.toString() ?? 'CONFIRMED').toUpperCase(),
      customerName: customerName,
      customerPhone: customerPhone,
      customerEmail: customerEmail,
      branchName: branchName,
      orderDate: parsedDate,
      items: itemsList,
      subtotal: ((json['subtotal'] ?? json['total'] ?? 0) as num).toDouble(),
      taxTotal: ((json['taxTotal'] ?? 0) as num).toDouble(),
      discountTotal: ((json['discountTotal'] ?? 0) as num).toDouble(),
      serviceCharge: ((json['serviceCharge'] ?? 0) as num).toDouble(),
      total: totalVal,
      paidTotal: paidVal,
      dueTotal: dueVal,
      changeReturn: changeVal,
      tenderedAmount: tenderedVal,
      paymentStatus: (json['paymentStatus']?.toString() ?? 'PAID').toUpperCase(),
      paymentMethod: (json['paymentMethod']?.toString() ?? 'CASH').toUpperCase(),
      cashierName: json['cashierName']?.toString() ?? 'Wadi Restaurant',
    );
  }
}

