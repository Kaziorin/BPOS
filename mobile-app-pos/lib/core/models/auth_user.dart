class AuthUser {
  final String id;
  final String name;
  final String email;
  final String token;
  final String tenantId;
  final String tenantName;
  final String role;
  final List<String> businessTypes;

  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.token,
    required this.tenantId,
    required this.tenantName,
    required this.role,
    required this.businessTypes,
  });

  bool get isMultiBusiness => businessTypes.length > 1;
  bool get isSingleBusiness => businessTypes.length == 1;
  String get primaryBusiness =>
      businessTypes.isNotEmpty ? businessTypes.first : 'restaurant';

  factory AuthUser.fromJson(Map<String, dynamic> json, {String? token}) {
    final user = json['user'] is Map<String, dynamic>
        ? json['user'] as Map<String, dynamic>
        : json;
    final tenant = json['tenant'] is Map<String, dynamic>
        ? json['tenant'] as Map<String, dynamic>
        : <String, dynamic>{};

    final rawToken = token ?? json['token'] as String? ?? '';
    final roleName = (user['roleName'] ?? user['role'] ?? 'Admin').toString();
    final userEmail = (user['email'] ?? '').toString().toLowerCase().trim();

    final rawBiz = (user['businessType'] ?? tenant['businessType'] ?? '')
        .toString()
        .toUpperCase()
        .trim();

    String normalizeBiz(String b) {
      final s = b.toLowerCase().trim();
      if (s.contains('restaurant')) return 'restaurant';
      if (s.contains('pharma')) return 'pharmacy';
      if (s.contains('groc')) return 'grocery';
      if (s.contains('whole') || s.contains('b2b')) return 'wholesaler';
      if (s.contains('retail')) return 'retail';
      return 'restaurant';
    }

    List<String> list = [];
    if (json['businessTypes'] is List && (json['businessTypes'] as List).isNotEmpty) {
      list = (json['businessTypes'] as List).map((e) => e.toString()).toList();
    } else if (roleName.toLowerCase().contains('super admin') ||
        userEmail == 'admin@gmail.com') {
      list = ['restaurant', 'pharmacy', 'grocery', 'wholesaler', 'retail'];
    } else if (rawBiz.isNotEmpty) {
      list = [normalizeBiz(rawBiz)];
    } else {
      list = ['restaurant'];
    }

    return AuthUser(
      id: (user['id'] ?? json['id'])?.toString() ?? 'usr_1',
      name: (user['name'] ?? json['name'])?.toString() ?? 'Store Manager',
      email: userEmail.isNotEmpty ? userEmail : (json['email'] ?? '').toString(),
      token: rawToken.isNotEmpty ? rawToken : (json['token'] ?? '').toString(),
      tenantId: (tenant['id'] ?? user['tenantId'] ?? json['tenantId'])?.toString() ?? '',
      tenantName: (tenant['name'] ?? user['tenantName'] ?? json['tenantName'])?.toString() ?? 'Blue Oceans POS',
      role: roleName,
      businessTypes: list,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'token': token,
        'tenantId': tenantId,
        'tenantName': tenantName,
        'role': role,
        'businessTypes': businessTypes,
      };
}
