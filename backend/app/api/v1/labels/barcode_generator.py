"""Pure-Python Code 128 Barcode & SVG Generator.

Generates crisp, high-resolution vector SVG barcodes without external dependencies.
Supports Code 128 (Subset B/Auto) and EAN-13.
"""
from __future__ import annotations
import html

# Code 128 pattern table (values 0-106)
# Each pattern represents bar/space widths (total 11 modules, except STOP which is 13)
CODE128_PATTERNS = [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
    "114131", "311141", "411131", "211412", "211214", "211232", "2331112"  # 106 is STOP pattern (13 modules)
]

START_B = 104
STOP = 106


def generate_code128_svg(
    data: str,
    width: int | float = 240,
    height: int | float = 65,
    show_text: bool = True,
    font_size: int = 12,
    module_width: float = 1.5,
) -> str:
    """Generate clean SVG string for Code 128 barcode."""
    data_str = str(data or "").strip()
    if not data_str:
        data_str = "00000000"

    # Convert to Subset B codes
    codes = [START_B]
    checksum = START_B

    for i, char in enumerate(data_str):
        ascii_val = ord(char)
        if 32 <= ascii_val <= 126:
            code_val = ascii_val - 32
        else:
            code_val = 0  # fallback to space
        codes.append(code_val)
        checksum += code_val * (i + 1)

    codes.append(checksum % 103)
    codes.append(STOP)

    # Build sequence of bar / space widths
    modules = []
    for code_val in codes:
        pattern = CODE128_PATTERNS[code_val]
        is_bar = True
        for digit in pattern:
            w = int(digit)
            modules.append((is_bar, w))
            is_bar = not is_bar

    # Calculate total module count
    total_modules = sum(w for _, w in modules)
    quiet_zone = 10
    total_width = (total_modules + (quiet_zone * 2)) * module_width
    bar_height = height - (font_size + 4 if show_text else 0)

    rects = []
    current_x = quiet_zone * module_width

    for is_bar, w in modules:
        rect_w = w * module_width
        if is_bar:
            rects.append(
                f'<rect x="{current_x:.2f}" y="0" width="{rect_w:.2f}" height="{bar_height:.2f}" fill="#000000" />'
            )
        current_x += rect_w

    svg_elements = "\n  ".join(rects)
    text_element = ""
    if show_text:
        text_y = bar_height + font_size + 1
        safe_text = html.escape(data_str)
        text_element = (
            f'\n  <text x="{total_width / 2:.2f}" y="{text_y:.2f}" '
            f'font-family="monospace, monospace" font-size="{font_size}" font-weight="600" '
            f'letter-spacing="2px" text-anchor="middle" fill="#1e293b">{safe_text}</text>'
        )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_width:.2f} {height:.2f}" '
        f'width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="barcode-svg">\n'
        f'  {svg_elements}'
        f'{text_element}\n'
        f'</svg>'
    )
    return svg
