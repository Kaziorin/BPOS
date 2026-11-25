/**
 * ESC/POS Thermal Receipt & Hardware Peripherals Utility
 * Supports direct WebSerial / WebUSB printing and ESC/POS raw byte stream generation.
 */

export interface ReceiptPrintData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  binNumber?: string;
  invoiceNo: string;
  dateStr: string;
  cashierName?: string;
  customerName?: string;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  vatAmount: number;
  discountTotal?: number;
  netPayable: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  footerMessage?: string;
  autoKickDrawer?: boolean;
}

/**
 * Builds raw ESC/POS byte array for standard 80mm / 58mm thermal printers.
 */
export function buildEscPosBytes(data: ReceiptPrintData, paperWidth: "80mm" | "58mm" = "80mm"): Uint8Array {
  const enc = new TextEncoder();
  const bytes: number[] = [];

  const add = (...b: number[]) => bytes.push(...b);
  const addStr = (str: string) => {
    const encoded = enc.encode(str);
    for (let i = 0; i < encoded.length; i++) bytes.push(encoded[i]);
  };
  const addLine = (str: string) => {
    addStr(str + "\n");
  };

  const colWidth = paperWidth === "58mm" ? 32 : 48;
  const divider = "-".repeat(colWidth);

  // 1. Initialize printer
  add(0x1B, 0x40);

  // Optional: Kick cash drawer pulse before print
  if (data.autoKickDrawer) {
    add(0x1B, 0x70, 0x00, 0x19, 0xFA);
  }

  // 2. Center Align & Header
  add(0x1B, 0x61, 0x01); // Center align
  add(0x1B, 0x45, 0x01); // Bold on
  add(0x1D, 0x21, 0x11); // Double height & width
  addLine(data.storeName || "BLUE OCEANS POS");
  add(0x1D, 0x21, 0x00); // Normal size
  add(0x1B, 0x45, 0x00); // Bold off

  if (data.storeAddress) addLine(data.storeAddress);
  if (data.storePhone) addLine(`Tel: ${data.storePhone}`);
  if (data.binNumber) addLine(`BIN / Mushak: ${data.binNumber}`);
  addLine("TAX INVOICE (MUSHAK 6.3)");
  addLine(divider);

  // 3. Left Align - Invoice Metadata
  add(0x1B, 0x61, 0x00); // Left align
  addLine(`Invoice : ${data.invoiceNo}`);
  addLine(`Date    : ${data.dateStr}`);
  if (data.cashierName) addLine(`Cashier : ${data.cashierName}`);
  if (data.customerName && data.customerName !== "Walk-in Customer") {
    addLine(`Customer: ${data.customerName}`);
  }
  addLine(divider);

  // 4. Items Table
  add(0x1B, 0x45, 0x01); // Bold headers
  if (paperWidth === "58mm") {
    addLine("Item           Qty     Total");
  } else {
    addLine("Item Description          Qty   Price      Total");
  }
  add(0x1B, 0x45, 0x00); // Bold off
  addLine(divider);

  for (const item of data.items) {
    const name = item.name.length > 20 ? item.name.substring(0, 19) + "." : item.name;
    const qtyStr = `${item.qty}`;
    const priceStr = `৳${item.unitPrice.toFixed(0)}`;
    const totalStr = `৳${item.lineTotal.toFixed(0)}`;

    if (paperWidth === "58mm") {
      const line = `${name.padEnd(14)} ${qtyStr.padStart(4)} ${totalStr.padStart(11)}`;
      addLine(line);
    } else {
      const line = `${name.padEnd(25)} ${qtyStr.padStart(4)} ${priceStr.padStart(8)} ${totalStr.padStart(9)}`;
      addLine(line);
    }
  }

  addLine(divider);

  // 5. Financial Summary (Right aligned totals)
  const padRow = (label: string, val: string) => {
    const space = colWidth - label.length - val.length;
    return label + " ".repeat(Math.max(1, space)) + val;
  };

  addLine(padRow("Subtotal:", `৳${data.subtotal.toFixed(2)}`));
  if (data.vatAmount > 0) {
    addLine(padRow("VAT (Mushak 6.3):", `৳${data.vatAmount.toFixed(2)}`));
  }
  if (data.discountTotal && data.discountTotal > 0) {
    addLine(padRow("Discount:", `-৳${data.discountTotal.toFixed(2)}`));
  }

  add(0x1B, 0x45, 0x01); // Bold on
  addLine(padRow("NET PAYABLE:", `৳${data.netPayable.toFixed(2)}`));
  add(0x1B, 0x45, 0x00); // Bold off

  addLine(padRow(`Paid (${data.paymentMethod}):`, `৳${data.paidAmount.toFixed(2)}`));
  if (data.changeAmount > 0) {
    addLine(padRow("Change Returned:", `৳${data.changeAmount.toFixed(2)}`));
  }

  addLine(divider);

  // 6. Footer & Thank You
  add(0x1B, 0x61, 0x01); // Center align
  addLine(data.footerMessage || "Thank you for shopping with us!");
  addLine("Software Powered by Blue Oceans POS");
  addLine("");
  addLine("");

  // 7. Cut paper (GS V 0)
  add(0x1D, 0x56, 0x00);

  return new Uint8Array(bytes);
}

/**
 * Triggers ESC/POS solenoid cash drawer kick without printing receipt.
 */
export async function kickCashDrawerDirect(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  // ESC p 0 25 250 (pulse 50ms to pin 2)
  const kickBytes = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);

  try {
    // 1. Try WebSerial
    if ("serial" in navigator) {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      const writer = port.writable.getWriter();
      await writer.write(kickBytes);
      writer.releaseLock();
      await port.close();
      return true;
    }
  } catch (err) {
    console.warn("Direct serial cash drawer kick error", err);
  }

  return false;
}

/**
 * Direct thermal printer execution via WebSerial
 */
export async function printDirectThermal(data: ReceiptPrintData, paperWidth: "80mm" | "58mm" = "80mm"): Promise<{ success: boolean; message?: string }> {
  if (typeof navigator === "undefined" || !("serial" in navigator)) {
    return { success: false, message: "WebSerial is not supported in this browser. Please use Google Chrome or Edge." };
  }

  try {
    const rawBytes = buildEscPosBytes(data, paperWidth);
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    await writer.write(rawBytes);
    writer.releaseLock();
    await port.close();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to communicate with serial thermal printer." };
  }
}
