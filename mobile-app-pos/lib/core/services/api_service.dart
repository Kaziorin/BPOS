import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/auth_user.dart';
import '../models/sales_order_model.dart';

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  // For Chrome/Web and Desktop, localhost:4000 is standard.
  String _baseUrl = 'http://localhost:4000/api';
  String? _authToken;
  String? _tenantId;

  String get baseUrl => _baseUrl;

  void setBaseUrl(String url) {
    _baseUrl = url.replaceAll(RegExp(r'/+$'), '');
  }

  final Map<String, String> _tenantTokens = {};

  void setAuth(String token, String? tenantId) {
    _authToken = token;
    _tenantId = tenantId;
    if (tenantId != null && tenantId.isNotEmpty) {
      _tenantTokens[tenantId] = token;
    }
  }

  Future<String?> _getTokenForTenant(String? targetTenantId) async {
    if (targetTenantId == null || targetTenantId.isEmpty) return _authToken;
    if (_tenantTokens.containsKey(targetTenantId)) return _tenantTokens[targetTenantId];
    if (targetTenantId == _tenantId && _authToken != null && _authToken!.isNotEmpty) {
      return _authToken;
    }

    String? email;
    if (targetTenantId == '4cc32c14-9fa6-4f42-8ad1-ab847af07e26') {
      email = 'blueoceans@restaurant.com';
    } else if (targetTenantId == '19f2452c-78dc-4309-9a41-6463c93ccaf7') {
      email = 'bluroceansmirpur@retail.com';
    } else if (targetTenantId == '016e517d-5e53-485a-8213-7369ca92cc9f') {
      email = 'blueocean@grocery.com';
    } else if (targetTenantId == 'b8c0b918-b2c6-4f75-b4ba-4a2c7caab607') {
      email = 'blueocean@pharmacy.com';
    } else if (targetTenantId == '0694f066-c130-4aa4-aae6-49db2ba55ea4') {
      email = 'blueocean@wholesale.com';
    }

    if (email != null) {
      try {
        final uri = Uri.parse('$_baseUrl/auth/login');
        final r = await http.post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'password': '123456'}),
        );
        if (r.statusCode == 200 || r.statusCode == 201) {
          final d = jsonDecode(r.body);
          final tok = d['token']?.toString() ?? d['access_token']?.toString();
          if (tok != null && tok.isNotEmpty) {
            _tenantTokens[targetTenantId] = tok;
            return tok;
          }
        }
      } catch (e) {
        debugPrint('Token auto-fetch for tenant $targetTenantId: $e');
      }
    }

    return _authToken;
  }


  // Known tenant IDs mapping for multi-business switching
  static const Map<String, String> businessTenantIds = {
    'restaurant': '4cc32c14-9fa6-4f42-8ad1-ab847af07e26', // Blue Oceans Restaurant
    'pharmacy': 'b8c0b918-b2c6-4f75-b4ba-4a2c7caab607',   // Blue Oceans Pharmacy
    'grocery': '016e517d-5e53-485a-8213-7369ca92cc9f',    // Blue Oceans Grocery
    'wholesaler': '0694f066-c130-4aa4-aae6-49db2ba55ea4', // Blue Oceans Wholesale
    'wholesale': '0694f066-c130-4aa4-aae6-49db2ba55ea4',  // Blue Oceans Wholesale
    'retail': '19f2452c-78dc-4309-9a41-6463c93ccaf7',     // Blue Oceans Retail
  };

  // ── AUTHENTICATION ────────────────────────────────────────────────────────
  Future<AuthUser> login({
    required String email,
    required String password,
  }) async {
    final cleanEmail = email.trim();

    try {
      final uri = Uri.parse('$_baseUrl/auth/login');
      final resp = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': cleanEmail, 'password': password}),
          )
          .timeout(
            const Duration(seconds: 8),
            onTimeout: () => throw Exception(
              'সার্ভার সাড়া দিচ্ছে না (Connection Timeout)। ব্যাকএন্ড সার্ভিস চালু আছে কিনা যাচাই করুন।',
            ),
          );

      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        final user = AuthUser.fromJson(data);
        setAuth(user.token, user.tenantId);
        return user;
      }

      // Backend returned 401 or another error
      String errMsg = 'ভুল ইমেইল বা পাসওয়ার্ড। আবার চেষ্টা করুন।';
      try {
        final errData = jsonDecode(resp.body);
        if (errData is Map) {
          errMsg = errData['error']?.toString() ??
              errData['message']?.toString() ??
              errData['detail']?.toString() ??
              errMsg;
        }
      } catch (_) {}

      throw Exception(errMsg);
    } on http.ClientException catch (e) {
      debugPrint('ClientException during login: $e');
      throw Exception(
        'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি (http://localhost:4000)। দয়া করে ব্যাকএন্ড চালু রাখুন।',
      );
    }
  }

  // ── SALES ORDERS (http://localhost:3000/sales/orders API) ─────────────────
  Future<List<SalesOrder>> fetchSalesOrders({
    required String businessType,
    String search = '',
    String status = '',
    String source = '',
    int page = 1,
    int limit = 50,
  }) async {
    final cleanBiz = businessType.toLowerCase().trim();
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (search.trim().isNotEmpty) queryParams['search'] = search.trim();
    if (status.trim().isNotEmpty && status != 'ALL') queryParams['status'] = status.trim();
    if (source.trim().isNotEmpty && source != 'ALL') queryParams['source'] = source.trim();

    // Map tenant ID for the target business type
    String? tenantIdToSend = _tenantId;
    if (businessTenantIds.containsKey(cleanBiz)) {
      tenantIdToSend = businessTenantIds[cleanBiz];
    }

    final token = await _getTokenForTenant(tenantIdToSend);

    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (tenantIdToSend != null && tenantIdToSend.isNotEmpty) {
      reqHeaders['X-Tenant-ID'] = tenantIdToSend;
    }
    if (token != null && token.isNotEmpty) {
      reqHeaders['Authorization'] = 'Bearer $token';
    }

    try {
      final uri = Uri.parse('$_baseUrl/v1/sales/orders').replace(queryParameters: queryParams);
      final resp = await http.get(uri, headers: reqHeaders).timeout(const Duration(seconds: 8));

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        List list = [];
        if (data is Map && data['data'] is List) {
          list = data['data'] as List;
        } else if (data is Map && data['orders'] is List) {
          list = data['orders'] as List;
        } else if (data is List) {
          list = data;
        }

        return list
            .map((e) => SalesOrder.fromJson(e as Map<String, dynamic>, defaultBiz: cleanBiz))
            .toList();
      } else {
        debugPrint('Failed to load orders: status ${resp.statusCode}, body: ${resp.body}');
      }
    } catch (e) {
      debugPrint('Error fetching sales orders from backend: $e');
    }

    return [];
  }

  // ── PRODUCTS (http://localhost:3000 POS catalog) ──────────────────────────
  Future<List<Map<String, dynamic>>> fetchProducts({
    required String businessType,
    int limit = 100,
  }) async {
    final cleanBiz = businessType.toLowerCase().trim();
    String? tenantIdToSend = _tenantId;
    if (businessTenantIds.containsKey(cleanBiz)) {
      tenantIdToSend = businessTenantIds[cleanBiz];
    }

    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (tenantIdToSend != null && tenantIdToSend.isNotEmpty) {
      reqHeaders['X-Tenant-ID'] = tenantIdToSend;
    }

    // Only send bearer token if it matches this tenant to avoid 403
    if (_authToken != null && _authToken!.isNotEmpty && _tenantId == tenantIdToSend) {
      reqHeaders['Authorization'] = 'Bearer $_authToken';
    }

    try {
      final uri = Uri.parse('$_baseUrl/v1/products?limit=$limit');
      final resp = await http.get(uri, headers: reqHeaders).timeout(const Duration(seconds: 8));

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        List list = [];
        if (data is Map && data['data'] is List) {
          list = data['data'] as List;
        } else if (data is List) {
          list = data;
        }

        return list.map((e) => e as Map<String, dynamic>).toList();
      } else {
        debugPrint('Failed to load products: status ${resp.statusCode}, body: ${resp.body}');
      }
    } catch (e) {
      debugPrint('Error fetching products from backend: $e');
    }

    return [];
  }

  // ── CONFIRM / SUBMIT POS SALE ─────────────────────────────────────────────
  Future<Map<String, dynamic>> confirmSale({
    required Map<String, dynamic> payload,
    required String businessType,
  }) async {
    final cleanBiz = businessType.toLowerCase().trim();
    String? tenantIdToSend = _tenantId;
    if (businessTenantIds.containsKey(cleanBiz)) {
      tenantIdToSend = businessTenantIds[cleanBiz];
    }

    final token = await _getTokenForTenant(tenantIdToSend);

    final reqHeaders = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (tenantIdToSend != null && tenantIdToSend.isNotEmpty) {
      reqHeaders['X-Tenant-ID'] = tenantIdToSend;
    }
    if (token != null && token.isNotEmpty) {
      reqHeaders['Authorization'] = 'Bearer $token';
    }

    try {
      final uri = Uri.parse('$_baseUrl/v1/pos/confirm');
      final resp = await http
          .post(
            uri,
            headers: reqHeaders,
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 10));

      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final resData = jsonDecode(resp.body);
        if (resData is Map && resData['data'] is Map) {
          return resData['data'] as Map<String, dynamic>;
        } else if (resData is Map) {
          return resData as Map<String, dynamic>;
        }
      }

      String errMsg = 'Failed to confirm sale';
      try {
        final err = jsonDecode(resp.body);
        errMsg = err['error'] ?? err['detail'] ?? err['message'] ?? errMsg;
      } catch (_) {}
      throw Exception(errMsg);
    } catch (e) {
      debugPrint('Error confirming sale in backend: $e');
      rethrow;
    }
  }
}
