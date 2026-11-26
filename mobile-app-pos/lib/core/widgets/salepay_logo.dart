import 'package:flutter/material.dart';

/// Displays the SalePay logo icon, automatically choosing the white 3D glossy
/// logo on colored/dark backgrounds and the glossy blue logo on light surfaces.
class SalePayLogo extends StatelessWidget {
  final double size;
  final bool onLightSurface;

  const SalePayLogo({
    super.key,
    this.size = 24,
    this.onLightSurface = false,
  });

  static const String whiteAsset = 'assets/icon/Glossy 3D Shopping Cart Logo.png';
  static const String blueAsset = 'assets/icon/Glossy Blue Cart Play Logo.png';

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      onLightSurface ? blueAsset : whiteAsset,
      width: size,
      height: size,
      fit: BoxFit.contain,
    );
  }
}
