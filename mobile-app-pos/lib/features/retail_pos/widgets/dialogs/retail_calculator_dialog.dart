import 'package:flutter/material.dart';

void showRetailCalculatorDialog(BuildContext context, bool isDark) {
  showDialog(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.55),
    builder: (ctx) => RetailCalculatorModal(isDark: isDark),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULATOR MODAL (Pixel-perfect matching reference image)
// ─────────────────────────────────────────────────────────────────────────────
class RetailCalculatorModal extends StatefulWidget {
  final bool isDark;

  const RetailCalculatorModal({super.key, required this.isDark});

  @override
  State<RetailCalculatorModal> createState() => _RetailCalculatorModalState();
}

class _RetailCalculatorModalState extends State<RetailCalculatorModal> {
  String _display = '0';
  double? _firstOperand;
  String? _operator;
  bool _resetNext = false;

  void _onDigit(String d) {
    setState(() {
      if (_resetNext || _display == '0') {
        _display = d;
        _resetNext = false;
      } else {
        if (_display.length < 12) {
          _display += d;
        }
      }
    });
  }

  void _onOperator(String op) {
    setState(() {
      _firstOperand = double.tryParse(_display);
      _operator = op;
      _resetNext = true;
    });
  }

  void _onEqual() {
    if (_firstOperand == null || _operator == null) return;
    final secondOperand = double.tryParse(_display) ?? 0;
    double res = 0;
    if (_operator == '+') res = _firstOperand! + secondOperand;
    if (_operator == '-') res = _firstOperand! - secondOperand;
    if (_operator == '*') res = _firstOperand! * secondOperand;
    if (_operator == '/') res = secondOperand != 0 ? _firstOperand! / secondOperand : 0;

    setState(() {
      if (res == res.roundToDouble() && !res.isInfinite && !res.isNaN) {
        _display = res.toInt().toString();
      } else {
        _display = res.toStringAsFixed(2);
      }
      _firstOperand = null;
      _operator = null;
      _resetNext = true;
    });
  }

  void _onClear() {
    setState(() {
      _display = '0';
      _firstOperand = null;
      _operator = null;
      _resetNext = false;
    });
  }

  Widget _buildKey({
    required String label,
    required VoidCallback onTap,
    required Color bg,
    required Color textColor,
    Border? border,
  }) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(6),
          child: Container(
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(6),
              border: border,
            ),
            child: Text(
              label,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: textColor,
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final bg = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final borderColor = isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0);
    final numBg = isDark ? const Color(0xFF262626) : Colors.white;
    final numBorder = Border.all(color: isDark ? const Color(0xFF383838) : const Color(0xFFE2E8F0));
    final numText = isDark ? Colors.white : const Color(0xFF334155);
    final opBg = isDark ? const Color(0xFF333333) : const Color(0xFFE2E8F0);
    final opText = isDark ? Colors.white : const Color(0xFF334155);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        width: 380,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 28,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header Bar
            Container(
              padding: const EdgeInsets.fromLTRB(24, 16, 16, 16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor)),
              ),
              child: Row(
                children: [
                  const Text(
                    'Calculator',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1D4ED8),
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE11D48),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Icon(Icons.close_rounded, size: 18, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),

            // Calculator Body
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Display Screen
                  Container(
                    height: 58,
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF262626) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _display,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : const Color(0xFF334155),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Keypad Rows
                  Row(
                    children: [
                      _buildKey(label: '7', onTap: () => _onDigit('7'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '8', onTap: () => _onDigit('8'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '9', onTap: () => _onDigit('9'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '/', onTap: () => _onOperator('/'), bg: opBg, textColor: opText),
                    ],
                  ),
                  Row(
                    children: [
                      _buildKey(label: '4', onTap: () => _onDigit('4'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '5', onTap: () => _onDigit('5'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '6', onTap: () => _onDigit('6'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '*', onTap: () => _onOperator('*'), bg: opBg, textColor: opText),
                    ],
                  ),
                  Row(
                    children: [
                      _buildKey(label: '1', onTap: () => _onDigit('1'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '2', onTap: () => _onDigit('2'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '3', onTap: () => _onDigit('3'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(label: '-', onTap: () => _onOperator('-'), bg: opBg, textColor: opText),
                    ],
                  ),
                  Row(
                    children: [
                      _buildKey(
                        label: 'C',
                        onTap: _onClear,
                        bg: isDark ? const Color(0xFF451A1A) : const Color(0xFFFFE4E6),
                        textColor: const Color(0xFFEF4444),
                      ),
                      _buildKey(label: '0', onTap: () => _onDigit('0'), bg: numBg, textColor: numText, border: numBorder),
                      _buildKey(
                        label: '=',
                        onTap: _onEqual,
                        bg: const Color(0xFF7065F0),
                        textColor: Colors.white,
                      ),
                      _buildKey(label: '+', onTap: () => _onOperator('+'), bg: opBg, textColor: opText),
                    ],
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
