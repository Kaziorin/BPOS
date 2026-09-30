import 'dart:async';
import 'package:flutter/material.dart';

import 'package:provider/provider.dart';
import '../../../core/providers/app_provider.dart';
import '../providers/retail_provider.dart';
import 'dialogs/retail_dialogs.dart';
import '../../../core/widgets/fullscreen_button.dart';

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
  bool _isSearchOpen = false;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();
    // Tick every second for real-time clock
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
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

  Widget _buildTitleWidget(BuildContext context, bool isDark, double screenWidth) {
    return InkWell(
      onTap: () {
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop();
        } else {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      },
      borderRadius: BorderRadius.circular(4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'BPOS',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF1E293B),
              letterSpacing: 0.5,
            ),
          ),
          Text(
            'Retail',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF7C3AED),
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  void _showNotificationsDialog(BuildContext context, bool isDark) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.5),
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1E1E) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        titlePadding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        actionsPadding: const EdgeInsets.all(12),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.notifications_active_rounded, size: 18, color: Color(0xFF8B5CF6)),
            ),
            const SizedBox(width: 10),
            Text(
              'Notifications',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF1E293B),
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                '3 New',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFEF4444)),
              ),
            ),
          ],
        ),
        content: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildNotificationItem(
                title: 'Low Stock Alert',
                desc: 'Coca-Cola 500ml has only 4 units remaining in shelf.',
                time: '10m ago',
                icon: Icons.inventory_2_outlined,
                color: const Color(0xFFF59E0B),
                isDark: isDark,
              ),
              const SizedBox(height: 8),
              _buildNotificationItem(
                title: 'Data Sync Success',
                desc: 'All recent retail transactions synced with central cloud.',
                time: '25m ago',
                icon: Icons.cloud_done_outlined,
                color: const Color(0xFF10B981),
                isDark: isDark,
              ),
              const SizedBox(height: 8),
              _buildNotificationItem(
                title: 'Shift Opened',
                desc: 'Terminal T-01 opened by Super Administrator.',
                time: '1h ago',
                icon: Icons.lock_open_rounded,
                color: const Color(0xFF3B82F6),
                isDark: isDark,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: Color(0xFF8B5CF6), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationItem({
    required String title,
    required String desc,
    required String time,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF262626) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: isDark ? const Color(0xFF383838) : const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF1E293B),
                      ),
                    ),
                    Text(
                      time,
                      style: TextStyle(
                        fontSize: 10,
                        color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  desc,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.grey.shade400 : const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final retailProvider = context.watch<RetailProvider>();
    final isDark = appProvider.isDarkMode;
    final surfaceColor = isDark ? const Color(0xFF1E1E1E) : Colors.white;
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 900;

    return Container(
      decoration: BoxDecoration(
        color: surfaceColor,
        border: Border(
          bottom: BorderSide(
            color: isDark ? const Color(0xFF2C2C2C) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Main Header Row ───────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                // 1. Back Button (only shown on desktop / tablet >= 900px)
                if (!isMobile) ...[
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
                ],

                // 2. Purple Icon Box (Logo) - click navigates to Home Screen
                Tooltip(
                  message: 'Go to Home',
                  child: InkWell(
                    onTap: () {
                      if (Navigator.of(context).canPop()) {
                        Navigator.of(context).pop();
                      } else {
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      }
                    },
                    borderRadius: BorderRadius.circular(4),
                    child: Container(
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
                  ),
                ),
                const SizedBox(width: 8),

                // 3. Title & Subtitle - click navigates to Home Screen
                // Both mobile and desktop: natural/intrinsic width
                // On mobile the Spacer() pushes action buttons right, no Flexible needed
                _buildTitleWidget(context, isDark, screenWidth),

                // 4. Center Search Bar (Only shown on Desktop/Web >= 900px)
                if (!isMobile) ...[
                  const SizedBox(width: 12),
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
                ],

                // 5. Mobile Action Buttons (Search Toggle, Notification, 3-Dots)
                if (isMobile) ...[
                  const Spacer(),

                  // Search Toggle Button
                  Tooltip(
                    message: _isSearchOpen ? 'Close Search' : 'Search Products',
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _isSearchOpen = !_isSearchOpen;
                          if (!_isSearchOpen) {
                            widget.searchController.clear();
                            retailProvider.setSearchQuery('');
                          }
                        });
                      },
                      borderRadius: BorderRadius.circular(4),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: _isSearchOpen
                              ? const Color(0xFF8B5CF6)
                              : (isDark ? const Color(0xFF2A2A2A) : Colors.white),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: _isSearchOpen
                                ? const Color(0xFF8B5CF6)
                                : (isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ],
                        ),
                        child: Icon(
                          _isSearchOpen ? Icons.close_rounded : Icons.search_rounded,
                          size: 20,
                          color: _isSearchOpen
                              ? Colors.white
                              : (isDark ? Colors.white : const Color(0xFF475569)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Notification Button
                  Tooltip(
                    message: 'Notifications',
                    child: InkWell(
                      onTap: () => _showNotificationsDialog(context, isDark),
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
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Icon(
                              Icons.notifications_outlined,
                              size: 20,
                              color: isDark ? Colors.white : const Color(0xFF475569),
                            ),
                            Positioned(
                              top: 7,
                              right: 7,
                              child: Container(
                                width: 7,
                                height: 7,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // 3-Dot More Menu Button
                  Tooltip(
                    message: 'More Options & POS Tools',
                    child: InkWell(
                      onTap: () => showRetailMobileOptionsSheet(context, retailProvider, isDark),
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
                          Icons.more_vert_rounded,
                          size: 20,
                          color: isDark ? Colors.white : const Color(0xFF475569),
                        ),
                      ),
                    ),
                  ),
                ],

                // 6. Desktop Right Controls: Notification, Fullscreen, Quick Actions, Date/Time, Cashier
                if (!isMobile) ...[
                  // Desktop Notification Button
                  Tooltip(
                    message: 'Notifications',
                    child: InkWell(
                      onTap: () => _showNotificationsDialog(context, isDark),
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
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Icon(
                              Icons.notifications_outlined,
                              size: 20,
                              color: isDark ? Colors.white : const Color(0xFF475569),
                            ),
                            Positioned(
                              top: 7,
                              right: 7,
                              child: Container(
                                width: 7,
                                height: 7,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEF4444),
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Fullscreen Button
                  FullscreenButton(
                    iconColor: const Color(0xFF8B5CF6),
                    iconSize: 20,
                    backgroundColor: isDark ? const Color(0xFF2A2A2A) : Colors.white,
                    borderRadius: BorderRadius.circular(4),
                    border: Border.all(color: isDark ? const Color(0xFF3A3A3A) : Colors.grey.shade300),
                    constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                    padding: const EdgeInsets.all(8),
                  ),
                  const SizedBox(width: 8),

                  // Quick Actions Button
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

                  // Date & Time Pill
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
          ),

          // ── Collapsible Search Box Below Header (Mobile View Only) ────────
          if (_isSearchOpen && isMobile) ...[
            Container(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
              child: Container(
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: const Color(0xFF8B5CF6),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, size: 18, color: Color(0xFF8B5CF6)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: widget.searchController,
                        autofocus: true,
                        onChanged: (val) {
                          retailProvider.setSearchQuery(val);
                          setState(() {});
                        },
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? Colors.white : const Color(0xFF1E293B),
                        ),
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
                    if (widget.searchController.text.isNotEmpty)
                      GestureDetector(
                        onTap: () {
                          widget.searchController.clear();
                          retailProvider.setSearchQuery('');
                          setState(() {});
                        },
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.grey.shade700 : Colors.grey.shade300,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded, size: 14, color: Colors.white),
                        ),
                      )
                    else
                      Icon(Icons.crop_free_rounded, size: 18, color: isDark ? Colors.grey.shade400 : Colors.grey.shade400),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
