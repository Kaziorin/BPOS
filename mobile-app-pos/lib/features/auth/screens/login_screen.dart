import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../../../core/services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _rememberMe = false;
  bool _isLoading = false;
  String? _errorMsg;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailCtrl.text.trim();
    final password = _passCtrl.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMsg = 'Please enter both email and password';
      });
      return;
    }

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
    final currentYear = DateTime.now().year;

    return Scaffold(
      body: Stack(
        children: [
          // ── 1. DEEP OCEAN BLUE GRADIENT BACKGROUND ──
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF0C4A6E), // #0c4a6e
                    Color(0xFF0369A1), // #0369a1
                    Color(0xFF0284C7), // #0284c7
                  ],
                ),
              ),
            ),
          ),

          // ── 2. CENTER WHITE RADIAL SPOTLIGHT GLOW ──
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 0.75,
                  colors: [
                    Colors.white.withValues(alpha: 0.22),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ── 3. CONSTELLATIONS & SINE WAVE GRAPHICS ──
          Positioned.fill(
            child: CustomPaint(
              painter: _ConstellationBackgroundPainter(),
            ),
          ),

          // ── 4. MAIN CENTERED LOGIN FORM CARD ──
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 420),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.96),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: const Color(0xFFE0F2FE),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.28),
                            blurRadius: 36,
                            offset: const Offset(0, 14),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 28),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // ── Store Logo in Gradient Box ──
                          Center(
                            child: Container(
                              height: 52,
                              width: 52,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  begin: Alignment.bottomLeft,
                                  end: Alignment.topRight,
                                  colors: [Color(0xFF0284C7), Color(0xFF38BDF8)],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF0284C7).withValues(alpha: 0.35),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.storefront_rounded,
                                color: Colors.white,
                                size: 26,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // ── Brand Title & Subtitle ──
                          const Text(
                            'Blue Oceans POS',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF334155),
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'Sign In to Workspace',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0369A1),
                            ),
                          ),
                          const SizedBox(height: 22),

                          // ── Error Message Banner (if any) ──
                          if (_errorMsg != null) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFFF1F2),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFFECDD3)),
                              ),
                              child: Text(
                                _errorMsg!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFFE11D48),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],

                          // ── Field 1: Email Or Username ──
                          const Text(
                            'Email Or Username',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 6),
                          SizedBox(
                            height: 42,
                            child: TextField(
                              controller: _emailCtrl,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF0F172A),
                                fontWeight: FontWeight.w600,
                              ),
                              decoration: InputDecoration(
                                prefixIcon: const Icon(
                                  Icons.mail_outline_rounded,
                                  color: Color(0xFF0284C7),
                                  size: 18,
                                ),
                                hintText: 'user@example.com',
                                hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
                                filled: true,
                                fillColor: const Color(0xFFF0F9FF),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // ── Field 2: Password ──
                          const Text(
                            'Password',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 6),
                          SizedBox(
                            height: 42,
                            child: TextField(
                              controller: _passCtrl,
                              obscureText: _obscurePass,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF0F172A),
                                fontWeight: FontWeight.w600,
                              ),
                              decoration: InputDecoration(
                                prefixIcon: const Icon(
                                  Icons.lock_outline_rounded,
                                  color: Color(0xFF0284C7),
                                  size: 18,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                    size: 18,
                                    color: const Color(0xFF94A3B8),
                                  ),
                                  onPressed: () => setState(() => _obscurePass = !_obscurePass),
                                ),
                                hintText: '••••••••',
                                hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
                                filled: true,
                                fillColor: const Color(0xFFF0F9FF),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(0xFFBAE6FD)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(color: Color(0xFF0284C7), width: 1.5),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // ── Remember Me & Forgot Password ──
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              InkWell(
                                onTap: () => setState(() => _rememberMe = !_rememberMe),
                                borderRadius: BorderRadius.circular(4),
                                child: Row(
                                  children: [
                                    SizedBox(
                                      height: 18,
                                      width: 18,
                                      child: Checkbox(
                                        value: _rememberMe,
                                        onChanged: (v) => setState(() => _rememberMe = v ?? false),
                                        activeColor: const Color(0xFF0284C7),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                        side: const BorderSide(color: Color(0xFFBAE6FD), width: 1.5),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Remember me',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF475569),
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Please contact your administrator to reset credentials.'),
                                      duration: Duration(seconds: 2),
                                    ),
                                  );
                                },
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  'Forgot password?',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF0284C7),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 18),

                          // ── Full-Width Vibrant "Sign In" Button ──
                          Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: _isLoading ? null : _handleLogin,
                              borderRadius: BorderRadius.circular(8),
                              child: Ink(
                                height: 44,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF0284C7), Color(0xFF0EA5E9)],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF0284C7).withValues(alpha: 0.35),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                                        )
                                      : const Text(
                                          'Sign In',
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            letterSpacing: 0.2,
                                          ),
                                        ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // ── Card Footer Copyright ──
                          Container(
                            padding: const EdgeInsets.only(top: 14),
                            decoration: const BoxDecoration(
                              border: Border(
                                top: BorderSide(color: Color(0xFFE0F2FE)),
                              ),
                            ),
                            child: Text(
                              '© Blue Oceans $currentYear. All rights reserved.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                ],
              ),
            ),
          ),

          // ── 5. BOTTOM-LEFT NEXT/BRAND BADGE ──
          Positioned(
            left: 18,
            bottom: 18,
            child: Container(
              height: 30,
              width: 30,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.45),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: const Center(
                child: Text(
                  'N',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── CONSTELLATION & SINE WAVES CUSTOM PAINTER ──
class _ConstellationBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final linePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.22)
      ..strokeWidth = 1.0
      ..style = PaintingStyle.stroke;

    final dotPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.48)
      ..style = PaintingStyle.fill;

    final wavePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 1.1
      ..style = PaintingStyle.stroke;

    // Left constellation nodes
    final leftNodes = [
      Offset(size.width * 0.04, size.height * 0.20),
      Offset(size.width * 0.14, size.height * 0.35),
      Offset(size.width * 0.06, size.height * 0.55),
      Offset(size.width * 0.11, size.height * 0.72),
      Offset(size.width * 0.04, size.height * 0.85),
      Offset(size.width * 0.18, size.height * 0.25),
      Offset(size.width * 0.02, size.height * 0.40),
    ];

    canvas.drawLine(leftNodes[0], leftNodes[1], linePaint);
    canvas.drawLine(leftNodes[1], leftNodes[2], linePaint);
    canvas.drawLine(leftNodes[2], leftNodes[3], linePaint);
    canvas.drawLine(leftNodes[3], leftNodes[4], linePaint);
    canvas.drawLine(leftNodes[1], leftNodes[5], linePaint);
    canvas.drawLine(leftNodes[2], leftNodes[6], linePaint);

    for (final node in leftNodes) {
      canvas.drawCircle(node, 3.5, dotPaint);
    }

    // Right constellation nodes
    final rightNodes = [
      Offset(size.width * 0.95, size.height * 0.18),
      Offset(size.width * 0.84, size.height * 0.32),
      Offset(size.width * 0.92, size.height * 0.52),
      Offset(size.width * 0.86, size.height * 0.68),
      Offset(size.width * 0.94, size.height * 0.82),
      Offset(size.width * 0.78, size.height * 0.22),
    ];

    canvas.drawLine(rightNodes[0], rightNodes[1], linePaint);
    canvas.drawLine(rightNodes[1], rightNodes[2], linePaint);
    canvas.drawLine(rightNodes[2], rightNodes[3], linePaint);
    canvas.drawLine(rightNodes[3], rightNodes[4], linePaint);
    canvas.drawLine(rightNodes[1], rightNodes[5], linePaint);

    for (final node in rightNodes) {
      canvas.drawCircle(node, 3.5, dotPaint);
    }

    // Sine wave curves flowing across the background
    for (int i = 0; i < 9; i++) {
      final path = Path();
      final yOffset = size.height * 0.30 + (i * 12);
      path.moveTo(0, yOffset);
      path.cubicTo(
        size.width * 0.28,
        yOffset - 35 + (i * 5),
        size.width * 0.72,
        yOffset + 35 - (i * 4),
        size.width,
        yOffset,
      );
      canvas.drawPath(path, wavePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
