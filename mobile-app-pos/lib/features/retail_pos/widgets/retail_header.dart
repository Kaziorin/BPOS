import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import 'dialogs/retail_dialogs.dart';
import 'fullscreen_helper.dart' as fs;

class RetailHeader extends StatefulWidget {
  final TextEditingController searchController;

  const RetailHeader({
    super.key,
    required this.searchController,
  });

  @override
  State<RetailHeader> createState() => _RetailHeaderState();
}

class _RetailHeaderState extends State<RetailHeader> {
  late Timer _timer;
  late DateTime _now;
  bool _isFullScreen = false;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    // Tick every second for real-time clock
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    // Sync button icon when browser exits fullscreen (e.g. Escape key)
    fs.onFullscreenChange.listen((isFull) {
      if (mounted) setState(() => _isFullScreen = isFull);
    });
    // F key → toggle fullscreen
    HardwareKeyboard.instance.addHandler(_handleKeyEvent);
  }

  @override
  void dispose() {
    _timer.cancel();
    HardwareKeyboard.instance.removeHandler(_handleKeyEvent);
    super.dispose();
  }

  bool _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.keyF) {
      _toggleFullScreen();
      return true; // event consumed
    }
    return false;
  }

  String _formatDate(DateTime dt) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  String _formatTime(DateTime dt) {
    final hour = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
    final minute = dt.minute.toString().padLeft(2, '0');
    final second = dt.second.toString().padLeft(2, '0');
    final period = dt.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute:$second $period';
  }

  void _toggleFullScreen() {
    if (_isFullScreen) {
      fs.exitFullscreen();
    } else {
      fs.enterFullscreen();
    }
    // _isFullScreen state is updated via onFullscreenChange stream listener
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;
    final surfaceColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        children: [
          // 1. Back Button
          InkWell(
            onTap: () => Navigator.of(context).pop(),
            borderRadius: BorderRadius.circular(4),
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: const Icon(Icons.arrow_back_rounded, size: 18),
            ),
          ),
          const SizedBox(width: 8),

          // 2. Purple Icon Box
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
              ),
              borderRadius: BorderRadius.circular(4),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.check_box_outlined, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 8),

          // 3. Title & Subtitle
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Text(
                    'Enterprise POS',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : Colors.grey.shade800,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'Premium',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF8B5CF6),
                      ),
                    ),
                  ),
                ],
              ),
              if (screenWidth >= 950)
                Text(
                  'Terminal ID: T-01 • Outlet: fgd',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),

          // 4. Center Search Bar
          Expanded(
            child: Container(
              height: 38,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
              ),
              child: Row(
                children: [
                  Icon(Icons.search_rounded, size: 18, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: widget.searchController,
                      onChanged: (val) => retailProvider.setSearchQuery(val),
                      style: const TextStyle(fontSize: 12),
                      decoration: InputDecoration(
                        hintText: 'Search product by name, SKU or barcode...',
                        hintStyle: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                        ),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ),
                  Icon(Icons.crop_free_rounded, size: 18, color: isDark ? Colors.grey.shade400 : Colors.grey.shade400),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),

          // 5. Right Controls: Fullscreen, Quick Actions, Date/Time, Cashier
          if (screenWidth >= 700) ...[
            // Fullscreen Square Icon Button
            if (screenWidth >= 850) ...[
              InkWell(
                onTap: _toggleFullScreen,
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Icon(
                    _isFullScreen ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                    size: 20,
                    color: const Color(0xFF8B5CF6),
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],

            // Quick Actions Button – same height (36) as Date/Time pill
            if (screenWidth >= 950) ...[
              InkWell(
                onTap: () => showRetailHoldsDialog(context, retailProvider, isDark),
                borderRadius: BorderRadius.circular(4),
                child: Container(
                  height: 36,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                    ),
                    borderRadius: BorderRadius.circular(4),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withValues(alpha: 0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bolt_rounded, size: 16, color: Colors.amber),
                      SizedBox(width: 4),
                      Text(
                        'Quick Actions',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Colors.white),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],

            // Date & Time Pill – real-time, height 36
            if (screenWidth >= 1200) ...[
              Container(
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.access_time_rounded, size: 16, color: Color(0xFF8B5CF6)),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatDate(_now),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : Colors.grey.shade800,
                          ),
                        ),
                        Text(
                          _formatTime(_now),
                          style: TextStyle(
                            fontSize: 9,
                            color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
            ],

            // Cashier Dropdown Pill
            Container(
              height: 36,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Color(0xFF8B5CF6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_rounded, size: 12, color: Colors.white),
                  ),
                  if (screenWidth >= 1100) ...[
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Cashier',
                          style: TextStyle(fontSize: 9, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                        ),
                        Text(
                          'Super Administrator',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.grey.shade800),
                        ),
                      ],
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: isDark ? Colors.grey.shade400 : Colors.grey.shade500),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
