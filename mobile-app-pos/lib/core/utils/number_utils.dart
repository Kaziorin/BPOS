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
}
