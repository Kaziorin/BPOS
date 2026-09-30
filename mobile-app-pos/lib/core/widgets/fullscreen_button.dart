import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../localization/app_strings.dart';
import '../providers/app_provider.dart';
import '../utils/fullscreen_helper.dart' as fs;

/// A reusable fullscreen toggle button that:
/// 1. Toggles browser/app full screen on click.
/// 2. Listens to keyboard press of key 'F' / 'f' to toggle fullscreen (ignoring when user is typing in a TextField).
/// 3. Synchronizes its icon when the user exits fullscreen via Escape or browser controls.
class FullscreenButton extends StatefulWidget {
  final Color? iconColor;
  final double iconSize;
  final Color? backgroundColor;
  final BoxBorder? border;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry padding;
  final BoxConstraints? constraints;
  final Widget Function(BuildContext context, bool isFullScreen, VoidCallback toggle)? builder;

  const FullscreenButton({
    super.key,
    this.iconColor,
    this.iconSize = 20,
    this.backgroundColor,
    this.border,
    this.borderRadius,
    this.padding = const EdgeInsets.all(8),
    this.constraints,
    this.builder,
  });

  @override
  State<FullscreenButton> createState() => _FullscreenButtonState();
}

class _FullscreenButtonState extends State<FullscreenButton> {
  bool _isFullScreen = false;
  StreamSubscription<bool>? _sub;

  @override
  void initState() {
    super.initState();
    _isFullScreen = fs.isFullscreen();
    _sub = fs.onFullscreenChange.listen((isFull) {
      if (mounted) {
        setState(() => _isFullScreen = isFull);
      }
    });
    HardwareKeyboard.instance.addHandler(_handleKeyEvent);
  }

  @override
  void dispose() {
    _sub?.cancel();
    HardwareKeyboard.instance.removeHandler(_handleKeyEvent);
    super.dispose();
  }

  bool _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.keyF) {
      final primaryFocus = FocusManager.instance.primaryFocus;
      // Do not trigger fullscreen if the user is typing in a text field
      if (primaryFocus != null && primaryFocus.context?.widget is EditableText) {
        return false;
      }
      _toggle();
      return true;
    }
    return false;
  }

  void _toggle() {
    fs.toggleFullscreen();
    if (mounted) {
      setState(() => _isFullScreen = !_isFullScreen);
    }
    Future.delayed(const Duration(milliseconds: 150), () {
      if (mounted) {
        setState(() => _isFullScreen = fs.isFullscreen());
      }
    });
    Future.delayed(const Duration(milliseconds: 350), () {
      if (mounted) {
        setState(() => _isFullScreen = fs.isFullscreen());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.builder != null) {
      return widget.builder!(context, _isFullScreen, _toggle);
    }

    final locale = context.watch<AppProvider>().locale;
    final tooltip = _isFullScreen
        ? AppStrings.get('exit_fullscreen', locale)
        : AppStrings.get('fullscreen', locale);

    final icon = _isFullScreen ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded;

    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _toggle,
          borderRadius: widget.borderRadius ?? BorderRadius.circular(10),
          child: Container(
            constraints: widget.constraints,
            padding: widget.padding,
            decoration: BoxDecoration(
              color: widget.backgroundColor,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(10),
              border: widget.border,
            ),
            child: Icon(
              icon,
              size: widget.iconSize,
              color: widget.iconColor ?? Theme.of(context).colorScheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
