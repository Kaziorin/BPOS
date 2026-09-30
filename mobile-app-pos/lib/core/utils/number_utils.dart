class NumberUtils {
  NumberUtils._();

  static const Map<String, String> _bnNumbers = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
    '.': '.',
    ',': ',',
  };

  /// Converts English numbers in a string to Bengali numbers if locale is 'bn'.
  static String toLocalized(dynamic input, String locale) {
    String text = input.toString();
    if (locale != 'bn') return text;

    StringBuffer buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      String char = text[i];
      buffer.write(_bnNumbers[char] ?? char);
    }
    return buffer.toString();
  }

  /// Formats a number with Bengali numerals if locale is 'bn'.
  static String formatNumber(num input, String locale) {
    final text = input is int
        ? input.toString()
        : input.toStringAsFixed(input.truncateToDouble() == input ? 0 : 2);
    return toLocalized(text, locale);
  }

  /// Formats an amount as currency with the Taka sign (৳) and localized numerals.
  static String formatCurrency(num amount, String locale) {
    final text = amount is int
        ? amount.toString()
        : amount.toStringAsFixed(amount.truncateToDouble() == amount ? 0 : 2);
    return '৳ ${toLocalized(text, locale)}';
  }
}
