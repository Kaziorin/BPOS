"""Labels Router — Barcode & Shelf Label Printing (Prompts 6, 35, 38, §10.4, §38.3-4).

Provides print-ready vector SVG barcode stickers and shelf-edge price labels for thermal label printers,
continuous rolls, and standard A4 laser/inkjet sticker sheets.
"""
from __future__ import annotations

import html
import json
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import HTMLResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from util import ok, err, rows_to_dicts, ApiJSONResponse
from app.api.v1.labels.barcode_generator import generate_code128_svg

router = APIRouter(tags=["Labels"])


async def _fetch_product_data(db: AsyncSession, product_id: str, tenant_id: Optional[str] = None) -> Optional[dict]:
    """Fetch product details with joined category, brand, unit, and tenant information."""
    where = "p.id = :id"
    params = {"id": product_id}
    if tenant_id:
        where += " AND (p.tenantId = :t OR :t = '')"
        params["t"] = tenant_id

    query = text(f"""
        SELECT 
            p.*,
            c.name AS categoryName,
            subc.name AS subCategoryName,
            b.name AS brandName,
            u.name AS unitName,
            u.code AS unitCode,
            sup.name AS supplierName,
            t.name AS tenantName,
            t.currency AS tenantCurrency
        FROM products p
        LEFT JOIN categories c ON c.id = p.categoryId
        LEFT JOIN categories subc ON subc.id = p.subCategoryId
        LEFT JOIN brands b ON b.id = p.brandId
        LEFT JOIN units u ON u.id = p.unitId
        LEFT JOIN suppliers sup ON sup.id = p.supplierId
        LEFT JOIN tenants t ON t.id = p.tenantId
        WHERE {where}
        LIMIT 1
    """)
    res = (await db.execute(query, params)).first()
    if not res:
        return None
    d = dict(res._mapping)
    if isinstance(d.get("attributes"), str):
        try:
            d["attributes"] = json.loads(d["attributes"])
        except Exception:
            pass
    return d


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: BARCODE LABELS
# ─────────────────────────────────────────────────────────────────────────────

def _build_barcode_html(product: dict, qty: int = 4, size: str = "standard", show_price: bool = True,
                        show_name: bool = True, show_sku: bool = True, show_store: bool = True,
                        currency_symbol: str = "৳") -> str:
    name = product.get("name") or "Unnamed Product"
    sku = product.get("sku") or "SKU-001"
    barcode_val = product.get("barcode") or sku or product.get("id", "")[:12]
    selling_price = float(product.get("sellingPrice") or 0)
    store_name = product.get("tenantName") or "BlueOceans POS"

    # Generate vector barcode SVG (clean without text inside svg, text rendered via CSS)
    svg_markup = generate_code128_svg(barcode_val, height=40, font_size=11, show_text=False)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Barcode Labels — {html.escape(name)}</title>
  <style>
    :root {{
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: var(--slate-800);
      line-height: 1.3;
      padding-top: 70px;
    }}

    /* Control Toolbar (Hidden during print) */
    .toolbar {{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 999;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }}
    .toolbar-left {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .toolbar-title {{
      font-size: 14px;
      font-weight: 700;
      color: var(--slate-900);
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 8px;
      background: #e0f2fe;
      color: var(--primary-dark);
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }}
    .toolbar-center {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .btn-group {{
      display: flex;
      align-items: center;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      padding: 2px;
    }}
    .btn-group-item {{
      border: none;
      background: transparent;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.15s ease;
    }}
    .btn-group-item.active {{
      background: #ffffff;
      color: var(--slate-900);
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }}
    .qty-control {{
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      padding: 2px 6px;
    }}
    .qty-btn {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      width: 26px;
      height: 26px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .qty-btn:hover {{
      background: var(--slate-50);
    }}
    .qty-input {{
      width: 48px;
      text-align: center;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 700;
      color: var(--slate-900);
    }}
    .toolbar-right {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .btn-print {{
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }}
    .btn-print:hover {{
      background: #0369a1;
    }}
    .btn-close {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      color: var(--slate-600);
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }}
    .btn-close:hover {{
      background: var(--slate-50);
    }}

    /* Main Container */
    .container {{
      max-width: 1200px;
      margin: 20px auto;
      padding: 0 20px;
    }}

    /* Label Layout Matrix */
    .labels-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: flex-start;
      margin-bottom: 40px;
    }}

    /* Standard Label Card (50mm x 30mm) */
    .label-card {{
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      width: 50mm;
      height: 30mm;
      min-width: 50mm;
      min-height: 30mm;
      max-width: 50mm;
      max-height: 30mm;
      padding: 1.5mm 2.5mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: stretch;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      background-clip: padding-box;
      box-sizing: border-box;
    }}

    /* Top text header group */
    .label-top {{
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      text-align: center;
      line-height: 1.2;
      flex-shrink: 0;
      padding-top: 0.5mm;
    }}
    .label-header {{
      width: 100%;
      font-size: 6pt;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin: 0;
    }}
    .label-product-name {{
      width: 100%;
      font-size: 7.5pt;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
      margin: 0.5px 0 0 0;
    }}

    /* Middle Barcode Group */
    .label-barcode {{
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-height: 0;
      padding: 0.5mm 0;
    }}
    .barcode-svg-wrap {{
      width: 100%;
      max-width: 96%;
      height: 8.5mm;
      max-height: 8.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }}
    .barcode-svg {{
      width: 100%;
      height: 100%;
      object-fit: contain;
    }}
    .label-code-text {{
      font-family: "Courier New", Courier, monospace;
      font-size: 6.5pt;
      font-weight: 700;
      letter-spacing: 1px;
      color: #0f172a;
      line-height: 1;
      margin-top: 0.6mm;
    }}

    /* Bottom Footer Group */
    .label-footer {{
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 0.5pt solid #cbd5e1;
      padding-top: 0.8mm;
      line-height: 1;
      flex-shrink: 0;
    }}
    .label-sku {{
      font-family: monospace;
      font-size: 6pt;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 55%;
    }}
    .label-price {{
      font-size: 9pt;
      font-weight: 900;
      color: #0f172a;
      white-space: nowrap;
      letter-spacing: -0.2px;
    }}

    /* Size variants */
    .size-compact .label-card {{
      width: 40mm;
      height: 25mm;
      min-width: 40mm;
      min-height: 25mm;
      max-width: 40mm;
      max-height: 25mm;
      padding: 1.2mm 2mm;
    }}
    .size-compact .label-header {{ font-size: 5.5pt; }}
    .size-compact .label-product-name {{ font-size: 6.5pt; }}
    .size-compact .barcode-svg-wrap {{ height: 6.5mm; max-height: 6.5mm; }}
    .size-compact .label-code-text {{ font-size: 5.5pt; margin-top: 0.4mm; }}
    .size-compact .label-price {{ font-size: 7.5pt; }}
    .size-compact .label-sku {{ font-size: 5.5pt; }}

    .size-large .label-card {{
      width: 60mm;
      height: 40mm;
      min-width: 60mm;
      min-height: 40mm;
      max-width: 60mm;
      max-height: 40mm;
      padding: 2.5mm 3.5mm;
    }}
    .size-large .label-header {{ font-size: 8pt; }}
    .size-large .label-product-name {{ font-size: 9pt; }}
    .size-large .barcode-svg-wrap {{ height: 13mm; max-height: 13mm; }}
    .size-large .label-code-text {{ font-size: 8pt; margin-top: 1mm; }}
    .size-large .label-price {{ font-size: 11pt; }}
    .size-large .label-sku {{ font-size: 7.5pt; }}

    .size-sheet .labels-grid {{
      display: grid;
      grid-template-columns: repeat(3, 70mm);
      gap: 0;
      background: #ffffff;
      padding: 10mm;
      border: 1px solid var(--slate-200);
      margin: 0 auto;
      width: 210mm;
    }}
    .size-sheet .label-card {{
      width: 70mm;
      height: 37mm;
      min-width: 70mm;
      min-height: 37mm;
      max-width: 70mm;
      max-height: 37mm;
      border: 1px dotted #e2e8f0;
      border-radius: 0;
      box-shadow: none;
      padding: 2mm 3mm;
    }}

    /* ════════ PRINT STYLES ════════ */
    @media print {{
      @page {{
        margin: 0;
        size: auto;
      }}
      body {{
        padding: 0 !important;
        background: #ffffff !important;
      }}
      .toolbar, .no-print {{
        display: none !important;
      }}
      .container {{
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }}
      .labels-grid {{
        gap: 0 !important;
        margin: 0 !important;
      }}
      .label-card {{
        border: none !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        break-inside: avoid;
        margin: 0;
      }}
      .size-sheet .labels-grid {{
        padding: 0 !important;
        border: none !important;
      }}
      .size-sheet .label-card {{
        border: none !important;
      }}
    }}
  </style>
</head>
<body class="size-{size}">

  <!-- STICKY CONTROL TOOLBAR -->
  <header class="toolbar no-print">
    <div class="toolbar-left">
      <span class="toolbar-title">
        🏷️ Barcode Labels
        <span class="badge">{html.escape(sku)}</span>
      </span>
      <span style="font-size: 13px; font-weight: 600; color: var(--slate-600); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        {html.escape(name)}
      </span>
    </div>

    <div class="toolbar-center">
      <!-- Quantity controls -->
      <div class="qty-control">
        <button class="qty-btn" onclick="adjustQty(-1)">−</button>
        <input type="number" id="qtyInput" class="qty-input" value="{qty}" min="1" max="200" onchange="updateQty(this.value)">
        <button class="qty-btn" onclick="adjustQty(1)">+</button>
      </div>

      <!-- Quick Presets -->
      <div class="btn-group">
        <button class="btn-group-item" onclick="setQty(4)">4 Pcs</button>
        <button class="btn-group-item" onclick="setQty(10)">10 Pcs</button>
        <button class="btn-group-item" onclick="setQty(24)">24 (A4)</button>
        <button class="btn-group-item" onclick="setQty(48)">48 (2x A4)</button>
      </div>

      <!-- Size Switcher -->
      <div class="btn-group">
        <button class="btn-group-item {'active' if size == 'standard' else ''}" onclick="setSize('standard')">50x30mm</button>
        <button class="btn-group-item {'active' if size == 'compact' else ''}" onclick="setSize('compact')">40x25mm</button>
        <button class="btn-group-item {'active' if size == 'large' else ''}" onclick="setSize('large')">60x40mm</button>
        <button class="btn-group-item {'active' if size == 'sheet' else ''}" onclick="setSize('sheet')">A4 Sheet</button>
      </div>
    </div>

    <div class="toolbar-right">
      <button class="btn-print" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print Labels
      </button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </header>

  <!-- LABEL GRID PREVIEW -->
  <main class="container">
    <div class="labels-grid" id="labelsContainer">
      {''.join([f'''
      <div class="label-card">
        <div class="label-top">
          {f'<div class="label-header">{html.escape(store_name)}</div>' if show_store else ''}
          {f'<div class="label-product-name">{html.escape(name)}</div>' if show_name else ''}
        </div>
        <div class="label-barcode">
          <div class="barcode-svg-wrap">
            {svg_markup}
          </div>
          <span class="label-code-text">{html.escape(barcode_val)}</span>
        </div>
        <div class="label-footer">
          {f'<span class="label-sku">SKU: {html.escape(sku)}</span>' if show_sku else '<span class="label-sku"></span>'}
          {f'<span class="label-price">{currency_symbol}{selling_price:,.2f}</span>' if show_price else ''}
        </div>
      </div>
      ''' for _ in range(max(1, qty))])}
    </div>
  </main>

  <script>
    const singleLabelTemplate = `
      <div class="label-card">
        <div class="label-top">
          {f'<div class="label-header">{html.escape(store_name)}</div>' if show_store else ''}
          {f'<div class="label-product-name">{html.escape(name)}</div>' if show_name else ''}
        </div>
        <div class="label-barcode">
          <div class="barcode-svg-wrap">
            {svg_markup}
          </div>
          <span class="label-code-text">{html.escape(barcode_val)}</span>
        </div>
        <div class="label-footer">
          {f'<span class="label-sku">SKU: {html.escape(sku)}</span>' if show_sku else '<span class="label-sku"></span>'}
          {f'<span class="label-price">{currency_symbol}{selling_price:,.2f}</span>' if show_price else ''}
        </div>
      </div>
    `;

    function renderLabels(count) {{
      const container = document.getElementById("labelsContainer");
      container.innerHTML = singleLabelTemplate.repeat(count);
    }}

    function adjustQty(delta) {{
      const input = document.getElementById("qtyInput");
      let val = parseInt(input.value || "1", 10) + delta;
      if (val < 1) val = 1;
      if (val > 200) val = 200;
      input.value = val;
      renderLabels(val);
    }}

    function updateQty(val) {{
      let count = parseInt(val, 10);
      if (isNaN(count) || count < 1) count = 1;
      if (count > 200) count = 200;
      document.getElementById("qtyInput").value = count;
      renderLabels(count);
    }}

    function setQty(val) {{
      document.getElementById("qtyInput").value = val;
      renderLabels(val);
    }}

    function setSize(sizeClass) {{
      document.body.className = "size-" + sizeClass;
      document.querySelectorAll(".toolbar-center .btn-group button").forEach(btn => {{
        if (btn.innerText.toLowerCase().includes(sizeClass)) {{
          btn.classList.add("active");
        }} else if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes("setSize")) {{
          btn.classList.remove("active");
        }}
      }});
    }}
  </script>
</body>
</html>
"""


# ─────────────────────────────────────────────────────────────────────────────
# HTML BUILDER: SHELF LABELS
# ─────────────────────────────────────────────────────────────────────────────

def _build_shelf_html(product: dict, qty: int = 4, size: str = "standard", show_barcode: bool = True,
                      show_unit: bool = True, show_category: bool = True, show_cost: bool = False,
                      currency_symbol: str = "৳") -> str:
    name = product.get("name") or "Unnamed Product"
    sku = product.get("sku") or "SKU-001"
    barcode_val = product.get("barcode") or sku or product.get("id", "")[:12]
    selling_price = float(product.get("sellingPrice") or 0)
    cost_price = float(product.get("costPrice") or 0)
    store_name = product.get("tenantName") or "BlueOceans POS"
    category = product.get("categoryName") or product.get("subCategoryName") or ""
    brand = product.get("brandName") or ""
    unit_name = product.get("unitName") or product.get("unitCode") or "Pcs"

    # Generate compact barcode SVG
    svg_markup = generate_code128_svg(barcode_val, height=36, font_size=10, show_text=False)

    # Shelf location from attributes if present
    attrs = product.get("attributes") or {}
    shelf_loc = attrs.get("shelfLocation") or attrs.get("aisle") or ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shelf Edge Price Labels — {html.escape(name)}</title>
  <style>
    :root {{
      --primary: #0284c7;
      --primary-dark: #0369a1;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-400: #94a3b8;
      --slate-600: #475569;
      --slate-700: #334155;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: var(--slate-800);
      line-height: 1.3;
      padding-top: 70px;
    }}

    /* Control Toolbar (Hidden during print) */
    .toolbar {{
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #ffffff;
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 999;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }}
    .toolbar-left {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .toolbar-title {{
      font-size: 14px;
      font-weight: 700;
      color: var(--slate-900);
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .badge {{
      display: inline-block;
      padding: 2px 8px;
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }}
    .toolbar-center {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .btn-group {{
      display: flex;
      align-items: center;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      padding: 2px;
    }}
    .btn-group-item {{
      border: none;
      background: transparent;
      padding: 5px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.15s ease;
    }}
    .btn-group-item.active {{
      background: #ffffff;
      color: var(--slate-900);
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }}
    .qty-control {{
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: 6px;
      padding: 2px 6px;
    }}
    .qty-btn {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      color: var(--slate-700);
      width: 26px;
      height: 26px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .qty-btn:hover {{
      background: var(--slate-50);
    }}
    .qty-input {{
      width: 48px;
      text-align: center;
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 700;
      color: var(--slate-900);
    }}
    .toolbar-right {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .btn-print {{
      background: #0284c7;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }}
    .btn-print:hover {{
      background: #0369a1;
    }}
    .btn-close {{
      background: #ffffff;
      border: 1px solid var(--slate-200);
      color: var(--slate-600);
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }}
    .btn-close:hover {{
      background: var(--slate-50);
    }}

    /* Main Container */
    .container {{
      max-width: 1200px;
      margin: 20px auto;
      padding: 0 20px;
    }}

    /* Shelf Label Layout Matrix */
    .labels-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: flex-start;
      margin-bottom: 40px;
    }}

    /* Standard Shelf Label Card (70mm x 35mm) */
    .shelf-card {{
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 3px;
      width: 70mm;
      height: 35mm;
      min-width: 70mm;
      min-height: 35mm;
      max-width: 70mm;
      max-height: 35mm;
      padding: 2mm 3mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      box-sizing: border-box;
    }}

    /* Size variants */
    .size-compact .shelf-card {{
      width: 50mm;
      height: 30mm;
      min-width: 50mm;
      min-height: 30mm;
      max-width: 50mm;
      max-height: 30mm;
      padding: 1.5mm 2.5mm;
    }}
    .size-large .shelf-card {{
      width: 100mm;
      height: 50mm;
      min-width: 100mm;
      min-height: 50mm;
      max-width: 100mm;
      max-height: 50mm;
      padding: 3mm 4mm;
    }}

    /* Shelf Header Section */
    .shelf-top {{
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1.2mm;
      gap: 6px;
      flex-shrink: 0;
    }}
    .shelf-name {{
      font-size: 8.5pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      max-height: 2.3em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }}
    .shelf-category-badge {{
      font-size: 6pt;
      font-weight: 700;
      background: #f1f5f9;
      color: #475569;
      padding: 1px 4px;
      border-radius: 2px;
      white-space: nowrap;
      text-transform: uppercase;
    }}

    /* Shelf Center Hero Pricing Section */
    .shelf-body {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1mm 0;
      flex: 1;
      min-height: 0;
    }}
    .price-wrap {{
      display: flex;
      flex-direction: column;
    }}
    .retail-tag {{
      font-size: 5.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }}
    .price-main {{
      font-size: 18pt;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
      letter-spacing: -1px;
    }}
    .size-compact .price-main {{ font-size: 14pt; }}
    .size-large .price-main {{ font-size: 26pt; }}
    .unit-tag {{
      font-size: 7pt;
      font-weight: 700;
      color: #475569;
      margin-top: 1px;
    }}

    /* Shelf Barcode & Metadata Side */
    .shelf-meta {{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }}
    .shelf-barcode-svg {{
      width: 26mm;
      height: 7mm;
      max-height: 7mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .size-large .shelf-barcode-svg {{
      width: 36mm;
      height: 11mm;
      max-height: 11mm;
    }}
    .shelf-sku {{
      font-family: monospace;
      font-size: 6pt;
      font-weight: 700;
      color: #334155;
      margin-top: 1px;
    }}

    /* Shelf Footer Strip */
    .shelf-footer {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 6pt;
      color: #64748b;
      font-weight: 600;
      border-top: 0.5pt solid #e2e8f0;
      padding-top: 0.8mm;
      flex-shrink: 0;
    }}
    .shelf-brand {{
      font-weight: 700;
      color: #0f172a;
    }}

    /* ════════ PRINT STYLES ════════ */
    @media print {{
      @page {{
        margin: 0;
        size: auto;
      }}
      body {{
        padding: 0 !important;
        background: #ffffff !important;
      }}
      .toolbar, .no-print {{
        display: none !important;
      }}
      .container {{
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }}
      .labels-grid {{
        gap: 0 !important;
        margin: 0 !important;
      }}
      .shelf-card {{
        border: 1px dashed #94a3b8 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        break-inside: avoid;
        margin: 0;
      }}
    }}
  </style>
</head>
<body class="size-{size}">

  <!-- STICKY CONTROL TOOLBAR -->
  <header class="toolbar no-print">
    <div class="toolbar-left">
      <span class="toolbar-title">
        🏷️ Shelf Edge Price Labels
        <span class="badge">Shelf Tag</span>
      </span>
      <span style="font-size: 13px; font-weight: 600; color: var(--slate-600); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        {html.escape(name)}
      </span>
    </div>

    <div class="toolbar-center">
      <!-- Quantity controls -->
      <div class="qty-control">
        <button class="qty-btn" onclick="adjustQty(-1)">−</button>
        <input type="number" id="qtyInput" class="qty-input" value="{qty}" min="1" max="200" onchange="updateQty(this.value)">
        <button class="qty-btn" onclick="adjustQty(1)">+</button>
      </div>

      <!-- Quick Presets -->
      <div class="btn-group">
        <button class="btn-group-item" onclick="setQty(4)">4 Pcs</button>
        <button class="btn-group-item" onclick="setQty(8)">8 Pcs</button>
        <button class="btn-group-item" onclick="setQty(16)">16 Pcs</button>
        <button class="btn-group-item" onclick="setQty(32)">32 Pcs</button>
      </div>

      <!-- Size Switcher -->
      <div class="btn-group">
        <button class="btn-group-item {'active' if size == 'standard' else ''}" onclick="setSize('standard')">70x35mm</button>
        <button class="btn-group-item {'active' if size == 'compact' else ''}" onclick="setSize('compact')">50x30mm</button>
        <button class="btn-group-item {'active' if size == 'large' else ''}" onclick="setSize('large')">100x50mm</button>
      </div>
    </div>

    <div class="toolbar-right">
      <button class="btn-print" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Print Shelf Labels
      </button>
      <button class="btn-close" onclick="window.close()">Close</button>
    </div>
  </header>

  <!-- LABEL GRID PREVIEW -->
  <main class="container">
    <div class="labels-grid" id="labelsContainer">
      {''.join([f'''
      <div class="shelf-card">
        <div class="shelf-top">
          <div class="shelf-name">{html.escape(name)}</div>
          {f'<span class="shelf-category-badge">{html.escape(category)}</span>' if (show_category and category) else ''}
        </div>
        <div class="shelf-body">
          <div class="price-wrap">
            <span class="retail-tag">Our Price (Incl. VAT)</span>
            <span class="price-main">{currency_symbol}{selling_price:,.2f}</span>
            {f'<span class="unit-tag">Per {html.escape(unit_name)}</span>' if show_unit else ''}
          </div>
          <div class="shelf-meta">
            {f'<div class="shelf-barcode-svg">{svg_markup}</div>' if show_barcode else ''}
            <span class="shelf-sku">{html.escape(barcode_val)}</span>
            {f'<span style="font-size:5.5pt; color:#94a3b8; font-family:monospace;">Loc: {html.escape(shelf_loc)}</span>' if shelf_loc else ''}
          </div>
        </div>
        <div class="shelf-footer">
          <span class="shelf-brand">{html.escape(brand or store_name)}</span>
          <span>SKU: {html.escape(sku)}</span>
          <span>{product.get("status", "ACTIVE")}</span>
        </div>
      </div>
      ''' for _ in range(max(1, qty))])}
    </div>
  </main>

  <script>
    const singleShelfTemplate = `
      <div class="shelf-card">
        <div class="shelf-top">
          <div class="shelf-name">{html.escape(name)}</div>
          {f'<span class="shelf-category-badge">{html.escape(category)}</span>' if (show_category and category) else ''}
        </div>
        <div class="shelf-body">
          <div class="price-wrap">
            <span class="retail-tag">Our Price (Incl. VAT)</span>
            <span class="price-main">{currency_symbol}{selling_price:,.2f}</span>
            {f'<span class="unit-tag">Per {html.escape(unit_name)}</span>' if show_unit else ''}
          </div>
          <div class="shelf-meta">
            {f'<div class="shelf-barcode-svg">{svg_markup}</div>' if show_barcode else ''}
            <span class="shelf-sku">{html.escape(barcode_val)}</span>
            {f'<span style="font-size:5.5pt; color:#94a3b8; font-family:monospace;">Loc: {html.escape(shelf_loc)}</span>' if shelf_loc else ''}
          </div>
        </div>
        <div class="shelf-footer">
          <span class="shelf-brand">{html.escape(brand or store_name)}</span>
          <span>SKU: {html.escape(sku)}</span>
          <span>{product.get("status", "ACTIVE")}</span>
        </div>
      </div>
    `;

    function renderLabels(count) {{
      const container = document.getElementById("labelsContainer");
      container.innerHTML = singleShelfTemplate.repeat(count);
    }}

    function adjustQty(delta) {{
      const input = document.getElementById("qtyInput");
      let val = parseInt(input.value || "1", 10) + delta;
      if (val < 1) val = 1;
      if (val > 200) val = 200;
      input.value = val;
      renderLabels(val);
    }}

    function updateQty(val) {{
      let count = parseInt(val, 10);
      if (isNaN(count) || count < 1) count = 1;
      if (count > 200) count = 200;
      document.getElementById("qtyInput").value = count;
      renderLabels(count);
    }}

    function setQty(val) {{
      document.getElementById("qtyInput").value = val;
      renderLabels(val);
    }}

    function setSize(sizeClass) {{
      document.body.className = "size-" + sizeClass;
      document.querySelectorAll(".toolbar-center .btn-group button").forEach(btn => {{
        if (btn.innerText.toLowerCase().includes(sizeClass)) {{
          btn.classList.add("active");
        }} else if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes("setSize")) {{
          btn.classList.remove("active");
        }}
      }});
    }}
  </script>
</body>
</html>
"""


# ─────────────────────────────────────────────────────────────────────────────
# ROUTE HANDLERS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/api/v1/labels/barcode/{productId}")
async def get_barcode_label(
    productId: str,
    qty: int = Query(4, ge=1, le=500),
    size: str = Query("standard", pattern="^(standard|compact|large|sheet)$"),
    showPrice: bool = Query(True),
    showName: bool = Query(True),
    showSku: bool = Query(True),
    showStore: bool = Query(True),
    currency: str = Query("৳"),
    format: str = Query("html", pattern="^(html|json)$"),
    tenantId: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Generate printable barcode sticker labels for a product."""
    product = await _fetch_product_data(db, productId, tenantId)
    if not product:
        if format == "json":
            return err("Product not found", 404)
        return HTMLResponse(
            f"""<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Product Not Found</h2><p>Product ID: <code>{html.escape(productId)}</code> could not be found.</p>
            <button onclick="window.close()" style="margin-top:16px;padding:8px 16px;cursor:pointer;">Close Window</button>
            </body></html>""",
            status_code=404,
        )

    if format == "json":
        barcode_val = product.get("barcode") or product.get("sku") or product.get("id", "")[:12]
        return ok({
            "product": product,
            "barcode": barcode_val,
            "svg": generate_code128_svg(barcode_val, height=50),
            "qty": qty,
            "size": size,
        })

    html_content = _build_barcode_html(
        product=product,
        qty=qty,
        size=size,
        show_price=showPrice,
        show_name=showName,
        show_sku=showSku,
        show_store=showStore,
        currency_symbol=currency or "৳",
    )
    return HTMLResponse(content=html_content, status_code=200)


@router.get("/api/v1/labels/shelf/{productId}")
async def get_shelf_label(
    productId: str,
    qty: int = Query(4, ge=1, le=500),
    size: str = Query("standard", pattern="^(standard|compact|large)$"),
    showBarcode: bool = Query(True),
    showUnit: bool = Query(True),
    showCategory: bool = Query(True),
    showCost: bool = Query(False),
    currency: str = Query("৳"),
    format: str = Query("html", pattern="^(html|json)$"),
    tenantId: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Generate printable shelf-edge price labels for a product."""
    product = await _fetch_product_data(db, productId, tenantId)
    if not product:
        if format == "json":
            return err("Product not found", 404)
        return HTMLResponse(
            f"""<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
            <h2>Product Not Found</h2><p>Product ID: <code>{html.escape(productId)}</code> could not be found.</p>
            <button onclick="window.close()" style="margin-top:16px;padding:8px 16px;cursor:pointer;">Close Window</button>
            </body></html>""",
            status_code=404,
        )

    if format == "json":
        barcode_val = product.get("barcode") or product.get("sku") or product.get("id", "")[:12]
        return ok({
            "product": product,
            "barcode": barcode_val,
            "qty": qty,
            "size": size,
        })

    html_content = _build_shelf_html(
        product=product,
        qty=qty,
        size=size,
        show_barcode=showBarcode,
        show_unit=showUnit,
        show_category=showCategory,
        show_cost=showCost,
        currency_symbol=currency or "৳",
    )
    return HTMLResponse(content=html_content, status_code=200)


@router.get("/api/v1/labels/presets")
async def list_label_presets():
    """Return available label sizes and printer profiles."""
    return ok({
        "barcodeSizes": [
            {"id": "standard", "name": "Standard Thermal", "widthMm": 50, "heightMm": 30, "cols": 1},
            {"id": "compact", "name": "Compact Sticker", "widthMm": 40, "heightMm": 25, "cols": 1},
            {"id": "large", "name": "Box / Shipping", "widthMm": 60, "heightMm": 40, "cols": 1},
            {"id": "sheet", "name": "A4 Sticker Sheet", "widthMm": 70, "heightMm": 37, "cols": 3, "labelsPerPage": 24},
        ],
        "shelfSizes": [
            {"id": "standard", "name": "Standard Shelf Edge", "widthMm": 70, "heightMm": 35},
            {"id": "compact", "name": "Compact Shelf Tag", "widthMm": 50, "heightMm": 30},
            {"id": "large", "name": "Promo Shelf Talker", "widthMm": 100, "heightMm": 50},
        ],
    })
