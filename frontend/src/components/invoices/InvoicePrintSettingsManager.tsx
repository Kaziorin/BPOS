"use client";

import { useState, useEffect } from "react";
import {
  Printer,
  Save,
  RotateCcw,
  Sliders,
  Store,
  FileText,
  DollarSign,
  Tag,
  ShieldCheck,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  type InvoiceSettings,
  type InvoiceBusinessType,
  type InvoicePaperWidth,
  getInvoiceSettings,
  saveInvoiceSettings,
  resetInvoiceSettings,
  DEFAULT_INVOICE_SETTINGS,
} from "@/lib/invoiceSettings";
import {
  CustomButton,
  CustomInput,
  CustomSelect,
  CustomCheckbox,
  CustomTextarea,
} from "@/components/custom";
import { toast } from "react-toastify";

interface Props {
  onSaved?: () => void;
}

export function InvoicePrintSettingsManager({ onSaved }: Props) {
  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setSettings(getInvoiceSettings());

    const handleUpdate = (e: any) => {
      if (e?.detail) setSettings(e.detail);
    };
    window.addEventListener("invoice-settings-changed", handleUpdate);
    return () => window.removeEventListener("invoice-settings-changed", handleUpdate);
  }, []);

  const handleBusinessTypeChange = (type: InvoiceBusinessType) => {
    const isRestaurant = type === "restaurant";
    setSettings((prev) => ({
      ...prev,
      businessType: type,
      showReturnPolicy: isRestaurant ? false : true,
      storeSubtitle: isRestaurant ? "Restaurant & Dine-in Guest Check" : prev.storeSubtitle,
      footerMessage: isRestaurant
        ? "Thank you for dining with us! Please visit us again."
        : "Thank you for shopping with us! Please visit us again.",
      returnPolicyText: isRestaurant ? "" : "Items can be exchanged within 7 days with original receipt.",
    }));
  };

  const handleToggle = (key: keyof InvoiceSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTextChange = (key: keyof InvoiceSettings, val: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSave = () => {
    saveInvoiceSettings(settings);
    toast.success("Invoice & thermal receipt settings saved successfully!");
    if (onSaved) onSaved();
  };

  const handleReset = () => {
    const res = resetInvoiceSettings();
    setSettings(res);
    toast.info("Invoice print settings reset to defaults.");
  };

  if (!isClient) return null;

  const isRestaurant = settings.businessType === "restaurant";

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-sm bg-gradient-to-r from-teal-50 via-slate-50 to-blue-50 border border-teal-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-sm bg-teal-600 text-white">
              <Sliders size={15} />
            </span>
            <h3 className="text-sm font-bold text-gray-800">
              POS Receipt & Thermal Print Control Center
            </h3>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Configure show/hide toggles, return policies, store credentials, and paper widths for all POS slips & invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CustomButton variant="outline" size="sm" onClick={handleReset} icon={RotateCcw}>
            Reset Defaults
          </CustomButton>
          <CustomButton variant="primary" size="sm" onClick={handleSave} icon={Save}>
            Save Settings
          </CustomButton>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls (7 cols) */}
        <div className="xl:col-span-7 space-y-5">
          {/* General Presets */}
          <div className="p-4 rounded-sm border border-slate-200 bg-white shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Store size={14} className="text-teal-600" />
              1. Business Type & Paper Layout
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomSelect
                label="Business Vertical Preset"
                value={settings.businessType}
                onChange={(e) => handleBusinessTypeChange(e.target.value as InvoiceBusinessType)}
                options={[
                  { value: "retail", label: "Retail Store (Standard Exchange Policy)" },
                  { value: "restaurant", label: "Restaurant & Cafe (No 7-Day Exchange, Dining Note)" },
                  { value: "grocery", label: "Grocery & Supermarket (Weight/PLU Lane)" },
                  { value: "pharmacy", label: "Pharmacy (Batch & Expiry Slip)" },
                  { value: "wholesale", label: "Wholesale & Distribution B2B" },
                  { value: "general", label: "General Commercial Services" },
                ]}
              />

              <CustomSelect
                label="Thermal Roll Paper Width"
                value={settings.paperWidth}
                onChange={(e) => handleTextChange("paperWidth", e.target.value)}
                options={[
                  { value: "80mm", label: "80mm (Standard Desktop POS Roll - 78mm printable)" },
                  { value: "58mm", label: "58mm (Compact Mobile / Handheld Roll - 54mm printable)" },
                ]}
              />
            </div>

            {isRestaurant && (
              <div className="p-3 rounded-sm bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                <UtensilsCrossed size={16} className="shrink-0 mt-0.5 text-amber-700" />
                <div>
                  <strong className="font-bold">Restaurant Mode Active:</strong> Retail return/exchange notice ("Items can be exchanged within 7 days") is automatically disabled. Dining thank-you greetings and service charge rows are prioritized.
                </div>
              </div>
            )}
          </div>

          {/* Header & Store Credentials */}
          <div className="p-4 rounded-sm border border-slate-200 bg-white shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-teal-600" />
              2. Store Header & Regulatory Info
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomInput
                label="Store Header Name"
                value={settings.storeName}
                onChange={(e) => handleTextChange("storeName", e.target.value)}
                placeholder="e.g. BLUE OCEANS POS"
              />
              <CustomInput
                label="Outlet Subtitle / Counter"
                value={settings.storeSubtitle}
                onChange={(e) => handleTextChange("storeSubtitle", e.target.value)}
                placeholder="e.g. Dhaka Flagship • Counter #POS-01"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomInput
                label="NBR BIN / Mushak 6.3 Reg No"
                value={settings.vatBinNo}
                onChange={(e) => handleTextChange("vatBinNo", e.target.value)}
                placeholder="e.g. 002938194-0101 • Mushak-6.3"
              />
              <CustomInput
                label="Store Contact Phone"
                value={settings.phoneContact}
                onChange={(e) => handleTextChange("phoneContact", e.target.value)}
                placeholder="e.g. +880 1711-000000"
              />
            </div>
          </div>

          {/* Show / Hide Checkboxes */}
          <div className="p-4 rounded-sm border border-slate-200 bg-white shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} className="text-teal-600" />
              3. Dynamic Show / Hide Component Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
              {/* Header & Meta */}
              <div className="space-y-2.5">
                <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider block border-b border-slate-100 pb-1">
                  Header & Order Meta
                </span>
                <CustomCheckbox
                  label="Show Store Header Name"
                  checked={settings.showStoreHeader}
                  onChange={() => handleToggle("showStoreHeader")}
                />
                <CustomCheckbox
                  label="Show Outlet Subtitle"
                  checked={settings.showStoreSubtitle}
                  onChange={() => handleToggle("showStoreSubtitle")}
                />
                <CustomCheckbox
                  label="Show NBR BIN / Mushak Reg"
                  checked={settings.showVatBin}
                  onChange={() => handleToggle("showVatBin")}
                />
                <CustomCheckbox
                  label="Show Contact Phone No"
                  checked={settings.showPhoneContact}
                  onChange={() => handleToggle("showPhoneContact")}
                />
                <CustomCheckbox
                  label="Show Invoice Number"
                  checked={settings.showInvoiceNo}
                  onChange={() => handleToggle("showInvoiceNo")}
                />
                <CustomCheckbox
                  label="Show Date & Timestamp"
                  checked={settings.showDateTime}
                  onChange={() => handleToggle("showDateTime")}
                />
                <CustomCheckbox
                  label="Show Customer Name"
                  checked={settings.showCustomer}
                  onChange={() => handleToggle("showCustomer")}
                />
                <CustomCheckbox
                  label="Show Cashier / Server Name"
                  checked={settings.showCashier}
                  onChange={() => handleToggle("showCashier")}
                />
                <CustomCheckbox
                  label="Show Order Type / Table"
                  checked={settings.showOrderType}
                  onChange={() => handleToggle("showOrderType")}
                />
              </div>

              {/* Items & Financial Breakdown */}
              <div className="space-y-2.5">
                <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider block border-b border-slate-100 pb-1">
                  Items & Financial Totals
                </span>
                <CustomCheckbox
                  label="Show Item SKU Code"
                  checked={settings.showItemSku}
                  onChange={() => handleToggle("showItemSku")}
                />
                <CustomCheckbox
                  label="Show Unit Price Rate"
                  checked={settings.showUnitPrice}
                  onChange={() => handleToggle("showUnitPrice")}
                />
                <CustomCheckbox
                  label="Show Items Subtotal"
                  checked={settings.showSubtotal}
                  onChange={() => handleToggle("showSubtotal")}
                />
                <CustomCheckbox
                  label="Show Discount Row"
                  checked={settings.showDiscount}
                  onChange={() => handleToggle("showDiscount")}
                />
                <CustomCheckbox
                  label="Show VAT (Mushak 6.3) Line"
                  checked={settings.showVatBreakdown}
                  onChange={() => handleToggle("showVatBreakdown")}
                />
                <CustomCheckbox
                  label="Show Service Charge Line"
                  checked={settings.showServiceCharge}
                  onChange={() => handleToggle("showServiceCharge")}
                />
                <CustomCheckbox
                  label="Show Net Payable Banner"
                  checked={settings.showNetPayable}
                  onChange={() => handleToggle("showNetPayable")}
                />
                <CustomCheckbox
                  label="Show Payment Tender Method"
                  checked={settings.showPaymentMethod}
                  onChange={() => handleToggle("showPaymentMethod")}
                />
                <CustomCheckbox
                  label="Show Paid Amount"
                  checked={settings.showPaidAmount}
                  onChange={() => handleToggle("showPaidAmount")}
                />
                <CustomCheckbox
                  label="Show Change / Return Due"
                  checked={settings.showChangeReturn}
                  onChange={() => handleToggle("showChangeReturn")}
                />
              </div>
            </div>

            {/* Footer Section Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="font-bold text-gray-500 uppercase text-[10px] tracking-wider block border-b border-slate-100 pb-1">
                Footer, Barcode & Policy
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <CustomCheckbox
                  label="Render Barcode on Receipt"
                  checked={settings.showBarcode}
                  onChange={() => handleToggle("showBarcode")}
                />
                <CustomCheckbox
                  label="Show Return & Exchange Policy Notice"
                  checked={settings.showReturnPolicy}
                  onChange={() => handleToggle("showReturnPolicy")}
                  description={isRestaurant ? "Normally disabled for restaurant/food orders" : undefined}
                />
                <CustomCheckbox
                  label="Show Thank-You Footer Note"
                  checked={settings.showFooterNote}
                  onChange={() => handleToggle("showFooterNote")}
                />
                <CustomCheckbox
                  label="Show Software Attribution Watermark"
                  checked={settings.showWatermark}
                  onChange={() => handleToggle("showWatermark")}
                />
              </div>
            </div>
          </div>

          {/* Footer Note & Return Policy Text */}
          <div className="p-4 rounded-sm border border-slate-200 bg-white shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-teal-600" />
              4. Custom Footer Messages & Policies
            </h4>

            <CustomTextarea
              label="Customer Thank-You & Greeting Message"
              value={settings.footerMessage}
              onChange={(e) => handleTextChange("footerMessage", e.target.value)}
              rows={2}
              placeholder="e.g. Thank you for dining with us! Please visit us again."
            />

            {settings.showReturnPolicy && (
              <CustomTextarea
                label="Return & Exchange Policy Clause (Visible only if enabled)"
                value={settings.returnPolicyText}
                onChange={(e) => handleTextChange("returnPolicyText", e.target.value)}
                rows={2}
                placeholder="e.g. Items can be exchanged within 7 days with original receipt."
              />
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <CustomButton variant="outline" onClick={handleReset} icon={RotateCcw}>
              Reset
            </CustomButton>
            <CustomButton variant="primary" onClick={handleSave} icon={Save}>
              Save All Settings
            </CustomButton>
          </div>
        </div>

        {/* Right Live Thermal Receipt Preview (5 cols) */}
        <div className="xl:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-bold text-gray-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Printer size={14} className="text-teal-600" />
              Live WYSIWYG Thermal Slip ({settings.paperWidth})
            </span>
            <span className="text-[10px] font-mono text-teal-700 font-bold bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              Real-time Preview
            </span>
          </div>

          {/* Render Preview */}
          <div
            className={`mx-auto bg-white p-5 rounded-sm border border-dashed border-slate-300 shadow-md font-sans text-xs text-gray-800 space-y-2.5 transition-all ${
              settings.paperWidth === "58mm" ? "max-w-[280px]" : "max-w-[340px]"
            }`}
          >
            {/* Store Header */}
            {settings.showStoreHeader && (
              <div className="text-center space-y-0.5">
                <h3 className="font-black text-sm tracking-wider text-black uppercase">
                  {settings.storeName || "BLUE OCEANS POS"}
                </h3>
                {settings.showStoreSubtitle && (
                  <p className="text-[11px] text-gray-700 font-medium">
                    {settings.storeSubtitle || "Dhaka Flagship Outlet • Counter #POS-01"}
                  </p>
                )}
                {settings.showVatBin && (
                  <p className="text-[10px] text-gray-600">
                    {settings.vatBinNo || "002938194-0101 • Mushak-6.3"}
                  </p>
                )}
                {settings.showPhoneContact && settings.phoneContact && (
                  <p className="text-[10px] text-gray-500 font-mono">
                    Tel: {settings.phoneContact}
                  </p>
                )}
              </div>
            )}

            {(settings.showStoreHeader || settings.showStoreSubtitle) && (
              <div className="border-t border-dashed border-gray-400 my-1.5" />
            )}

            {/* Meta */}
            <div className="space-y-1 text-xs">
              {settings.showInvoiceNo && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Invoice No:</span>
                  <span className="font-bold text-black font-mono tracking-tight">INV-202609-0821</span>
                </div>
              )}
              {settings.showDateTime && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Date & Time:</span>
                  <span className="text-gray-900 font-mono text-[11px]">20 Sept 2026, 17:15</span>
                </div>
              )}
              {settings.showCustomer && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Customer:</span>
                  <span className="font-semibold text-black text-right">Walk-in Customer</span>
                </div>
              )}
              {settings.showCashier && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">{isRestaurant ? "Server:" : "Cashier:"}</span>
                  <span className="font-semibold text-black text-right">Sumon R. (POS-01)</span>
                </div>
              )}
              {settings.showOrderType && isRestaurant && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Table / Order:</span>
                  <span className="font-bold text-amber-800">Table T-04 (Dine-in)</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5" />

            {/* Items Table */}
            <div>
              <div className="grid grid-cols-12 text-[10px] font-bold text-gray-800 uppercase tracking-wider border-b border-dashed border-gray-400 pb-1 mb-1.5">
                <span className="col-span-6">ITEM / SKU</span>
                <span className="col-span-1 text-center">QTY</span>
                <span className="col-span-2 text-right">RATE</span>
                <span className="col-span-3 text-right">TOTAL</span>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-12 items-baseline text-xs leading-tight py-0.5">
                  <div className="col-span-6 pr-1">
                    <div className="font-bold text-black leading-tight">
                      {isRestaurant ? "Chicken Biryani Special" : "Pran Mustard Oil 1L"}
                    </div>
                    {settings.showItemSku && (
                      <div className="text-[10px] text-gray-500 font-mono">
                        SKU: {isRestaurant ? "REST-4821" : "PRD-94821"}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 text-center font-bold text-black font-mono">1</div>
                  <div className="col-span-2 text-right text-gray-800 font-mono">
                    {settings.showUnitPrice ? "৳320.00" : "—"}
                  </div>
                  <div className="col-span-3 text-right font-bold text-black font-mono">৳320.00</div>
                </div>

                <div className="grid grid-cols-12 items-baseline text-xs leading-tight py-0.5">
                  <div className="col-span-6 pr-1">
                    <div className="font-bold text-black leading-tight">
                      {isRestaurant ? "Fresh Lime Soda" : "Aarong Milk 1L"}
                    </div>
                    {settings.showItemSku && (
                      <div className="text-[10px] text-gray-500 font-mono">
                        SKU: {isRestaurant ? "BEV-1029" : "PRD-20192"}
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 text-center font-bold text-black font-mono">2</div>
                  <div className="col-span-2 text-right text-gray-800 font-mono">
                    {settings.showUnitPrice ? "৳70.00" : "—"}
                  </div>
                  <div className="col-span-3 text-right font-bold text-black font-mono">৳140.00</div>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5" />

            {/* Totals */}
            <div className="space-y-1 text-xs py-0.5">
              {settings.showSubtotal && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-mono font-bold text-black">৳460.00</span>
                </div>
              )}

              {settings.showDiscount && (
                <div className="flex justify-between items-baseline text-emerald-800 font-medium">
                  <span>Discount (10%):</span>
                  <span className="font-mono">-৳46.00</span>
                </div>
              )}

              {settings.showVatBreakdown && (
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>VAT (Mushak 6.3 - 5%):</span>
                  <span className="font-mono text-black">৳20.70</span>
                </div>
              )}

              {settings.showServiceCharge && isRestaurant && (
                <div className="flex justify-between items-baseline text-gray-700">
                  <span>Service Charge (3%):</span>
                  <span className="font-mono text-black">৳12.42</span>
                </div>
              )}

              {settings.showNetPayable && (
                <div className="flex justify-between items-baseline font-black text-sm text-black border-t-2 border-b-2 border-black py-1.5 my-1.5">
                  <span className="uppercase tracking-wider">NET PAYABLE:</span>
                  <span className="font-mono text-base tracking-tight">
                    {isRestaurant ? "৳447.12" : "৳434.70"}
                  </span>
                </div>
              )}

              {settings.showPaymentMethod && (
                <div className="flex justify-between items-baseline pt-0.5">
                  <span className="text-gray-600">Tender Method:</span>
                  <span className="font-bold text-black font-mono">CASH</span>
                </div>
              )}

              {settings.showPaidAmount && (
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-600">Paid Amount:</span>
                  <span className="font-bold text-black font-mono">৳500.00</span>
                </div>
              )}

              {settings.showChangeReturn && (
                <div className="flex justify-between items-baseline font-bold text-emerald-900">
                  <span>Change / Return:</span>
                  <span className="font-mono">{isRestaurant ? "৳52.88" : "৳65.30"}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-gray-400 my-1.5" />

            {/* Footer */}
            <div className="text-center space-y-1 pt-1">
              {settings.showBarcode && (
                <div>
                  <div className="h-7 bg-slate-900/10 rounded-sm flex items-center justify-center font-mono tracking-widest text-[9px] text-slate-800">
                    |||| | | |||| | ||| || ||| |
                  </div>
                  <p className="text-[9px] text-gray-700 font-mono tracking-wider mt-0.5">
                    *INV-202609-0821*
                  </p>
                </div>
              )}

              {settings.showReturnPolicy && settings.returnPolicyText && !isRestaurant && (
                <p className="text-xs font-semibold text-gray-800 text-center max-w-[280px] mx-auto mt-2 leading-tight">
                  {settings.returnPolicyText}
                </p>
              )}

              {settings.showFooterNote && settings.footerMessage && (
                <p className="text-xs font-semibold text-gray-700 text-center max-w-[280px] mx-auto mt-1 leading-tight">
                  {settings.footerMessage}
                </p>
              )}

              {settings.showWatermark && (
                <p className="text-[10px] text-gray-400 text-center mt-2">
                  Software by Blue Oceans POS
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
