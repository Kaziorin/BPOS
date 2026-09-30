import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/localization/app_strings.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController(text: 'blueoceans@restaurant.com');
  final _passCtrl = TextEditingController(text: '123456');
  bool _obscurePass = true;
  bool _isLoading = false;
  String? _errorMsg;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin(String email, String password) async {
    _emailCtrl.text = email;
    _passCtrl.text = password;

    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    try {
      final user = await ApiService.instance.login(
        email: email,
        password: password,
      );

      if (!mounted) return;
      context.read<AppProvider>().login(user);
    } catch (e) {
      if (mounted) {
        final cleanErr = e.toString().replaceAll('Exception: ', '').trim();
        setState(() {
          _errorMsg = cleanErr;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final isDark = appProvider.isDarkMode;
    final locale = appProvider.locale;

    final bgColor = isDark ? const Color(0xFF0D1117) : const Color(0xFFF1F5F9);
    final cardBg = isDark ? const Color(0xFF161B22) : Colors.white;
    final borderColor = isDark ? const Color(0xFF30363D) : const Color(0xFFE2E8F0);
    final textPrimary = isDark ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDark ? const Color(0xFF8B949E) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo / Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF146EF5), Color(0xFF0B46B3)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF146EF5).withValues(alpha: 0.35),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.point_of_sale_rounded, color: Colors.white, size: 36),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Blue Oceans POS',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    locale == 'bn' ? 'সেলস অর্ডার ও পিওএস এন্টারপ্রাইজ পোর্টাল' : 'Sales Orders & Multi-POS Enterprise Portal',
                    style: TextStyle(fontSize: 13, color: textSecondary, fontWeight: FontWeight.w500),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),

                  // Main Login Box
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_errorMsg != null) ...[
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.red.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              _errorMsg!,
                              style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 14),
                        ],

                        // Email
                        Text(
                          locale == 'bn' ? 'ইমেইল বা ইউজারনেম' : 'Email or Username',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _emailCtrl,
                          style: TextStyle(fontSize: 13, color: textPrimary),
                          decoration: InputDecoration(
                            prefixIcon: Icon(Icons.email_outlined, size: 18, color: textSecondary),
                            hintText: 'admin@blueoceanspos.com',
                            hintStyle: TextStyle(fontSize: 12, color: textSecondary),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Password
                        Text(
                          locale == 'bn' ? 'পাসওয়ার্ড' : 'Password',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textPrimary),
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _passCtrl,
                          obscureText: _obscurePass,
                          style: TextStyle(fontSize: 13, color: textPrimary),
                          decoration: InputDecoration(
                            prefixIcon: Icon(Icons.lock_outline_rounded, size: 18, color: textSecondary),
                            suffixIcon: IconButton(
                              icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility, size: 18, color: textSecondary),
                              onPressed: () => setState(() => _obscurePass = !_obscurePass),
                            ),
                            hintText: '••••••••',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Login Button
                        ElevatedButton(
                          onPressed: _isLoading
                              ? null
                              : () => _handleLogin(_emailCtrl.text, _passCtrl.text),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF146EF5),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : Text(
                                  locale == 'bn' ? 'লগইন করুন' : 'Sign In',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white),
                                ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  // Quick Preset Accounts for testing routing
                  Text(
                    locale == 'bn'
                        ? '⚡ সিস্টেমের লাইভ টেস্ট অ্যাকাউন্টসমূহ:'
                        : '⚡ Live System Accounts (Single vs Multi-Business):',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: textSecondary),
                  ),
                  const SizedBox(height: 10),

                  // Preset 1: Restaurant ONLY (Single business routing!)
                  _testAccountCard(
                    title: locale == 'bn' ? '১. ব্লু ওশান রেস্তোরাঁ (একক ব্যবসা)' : '1. Blue Oceans Restaurant (Single Business)',
                    subtitle: locale == 'bn' ? 'সরাসরি রেস্তোরাঁ লাইভ সেলস অর্ডার ও পিওএস এ যাবে' : 'Directly opens Restaurant live Orders & POS',
                    color: const Color(0xFFFF6D00),
                    icon: Icons.restaurant_rounded,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    onTap: () => _handleLogin('blueoceans@restaurant.com', '123456'),
                  ),
                  const SizedBox(height: 8),

                  // Preset 2: Pharmacy ONLY (Single business routing!)
                  _testAccountCard(
                    title: locale == 'bn' ? '২. ব্লু ওশান ফার্মেসি (একক ব্যবসা)' : '2. Blue Oceans Pharmacy (Single Business)',
                    subtitle: locale == 'bn' ? 'সরাসরি ফার্মেসি লাইভ সেলস অর্ডার ও পিওএস এ যাবে' : 'Directly opens Pharmacy live Orders & POS',
                    color: const Color(0xFF00897B),
                    icon: Icons.local_pharmacy_rounded,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    onTap: () => _handleLogin('blueocean@pharmacy.com', '12345678'),
                  ),
                  const SizedBox(height: 8),

                  // Preset 3: Grocery ONLY (Single business routing!)
                  _testAccountCard(
                    title: locale == 'bn' ? '৩. ব্লু ওশান গ্রোসারি (একক ব্যবসা)' : '3. Blue Oceans Grocery (Single Business)',
                    subtitle: locale == 'bn' ? 'সরাসরি গ্রোসারি লাইভ সেলস অর্ডার ও পিওএস এ যাবে' : 'Directly opens Grocery live Orders & POS',
                    color: const Color(0xFF22C55E),
                    icon: Icons.local_grocery_store_rounded,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    onTap: () => _handleLogin('blueocean@grocery.com', '12345678'),
                  ),
                  const SizedBox(height: 8),

                  // Preset 4: Wholesale ONLY (Single business routing!)
                  _testAccountCard(
                    title: locale == 'bn' ? '৪. ব্লু ওশান পাইকারি / হোলসেল (একক ব্যবসা)' : '4. Blue Oceans Wholesale (Single Business)',
                    subtitle: locale == 'bn' ? 'সরাসরি হোলসেল লাইভ সেলস অর্ডার ও চালানে যাবে' : 'Directly opens Wholesale live Orders & POS',
                    color: const Color(0xFF4F46E5),
                    icon: Icons.inventory_2_rounded,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    onTap: () => _handleLogin('blueocean@wholesale.com', '12345678'),
                  ),
                  const SizedBox(height: 8),

                  // Preset 5: Multi-Business Super Admin (Multiple businesses!)
                  _testAccountCard(
                    title: locale == 'bn' ? '৫. সুপার অ্যাডমিন (একাধিক ব্যবসা)' : '5. Super Admin (Multi-Business Group)',
                    subtitle: locale == 'bn' ? 'সকল ব্যবসার তালিকা দেখাবে এবং যেকোনোটিতে প্রবেশ করা যাবে' : 'Displays authorized businesses to choose from',
                    color: const Color(0xFF146EF5),
                    icon: Icons.business_center_rounded,
                    cardBg: cardBg,
                    borderColor: borderColor,
                    textPrimary: textPrimary,
                    textSecondary: textSecondary,
                    onTap: () => _handleLogin('admin@gmail.com', '123456'),
                  ),

                  const SizedBox(height: 20),
                  // Footer language & theme toggle
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton.icon(
                        onPressed: () => appProvider.toggleTheme(),
                        icon: Icon(isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, size: 16),
                        label: Text(AppStrings.get(isDark ? 'light_mode' : 'dark_mode', locale)),
                      ),
                      const SizedBox(width: 12),
                      TextButton.icon(
                        onPressed: () => appProvider.setLocale(locale == 'en' ? 'bn' : 'en'),
                        icon: const Icon(Icons.language_rounded, size: 16),
                        label: Text(locale == 'en' ? 'বাংলা' : 'English'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _testAccountCard({
    required String title,
    required String subtitle,
    required Color color,
    required IconData icon,
    required Color cardBg,
    required Color borderColor,
    required Color textPrimary,
    required Color textSecondary,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: _isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.35)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: textPrimary)),
                  Text(subtitle, style: TextStyle(fontSize: 10.5, color: textSecondary)),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios_rounded, size: 12, color: color),
          ],
        ),
      ),
    );
  }
}
