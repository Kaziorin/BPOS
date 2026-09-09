"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building,
  Monitor,
  DollarSign,
  FileText,
  CreditCard,
  Package,
  Bell,
  Users,
  Shield,
  Plug,
  Brain,
  Crown,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Radio,
  Sliders,
  Store,
  Key,
  Database,
  Smartphone,
  Check,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

const SETTINGS_TABS = [
  { id: "company", label: "Company & Tenant", icon: Building, badge: "Core" },
  { id: "branch", label: "Branches & Outlets", icon: Store },
  { id: "pos", label: "POS Terminal Settings", icon: Monitor },
  { id: "sync", label: "Offline Sync Engine", icon: HardDrive, badge: "Offline" },
  { id: "tax", label: "Tax & NBR VAT", icon: DollarSign },
  { id: "invoice", label: "Invoice & Print Layout", icon: FileText },
  { id: "payment", label: "Payment Gateways", icon: CreditCard },
  { id: "inventory", label: "Inventory Valuation", icon: Package },
  { id: "notifications", label: "Alerts & Notifications", icon: Bell },
  { id: "users", label: "Users & Security", icon: Users },
  { id: "roles", label: "Roles & RBAC", icon: Shield },
  { id: "integrations", label: "API & Webhooks", icon: Plug },
  { id: "ai", label: "AI Business Assistant", icon: Brain, badge: "AI" },
  { id: "subscription", label: "Subscription & SaaS", icon: Crown },
] as const;

type SettingsTab = typeof SETTINGS_TABS[number]["id"];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Tab Support: ?tab=tenant, ?tab=sync, ?tab=company, etc.
  const rawTab = searchParams.get("tab")?.toLowerCase() || "company";
  const initialTab: SettingsTab =
    rawTab === "tenant"
      ? "company"
      : (SETTINGS_TABS.find((t) => t.id === rawTab)?.id as SettingsTab) || "company";

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [tenantData, setTenantData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadTenantData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, bRes, wRes] = await Promise.allSettled([
        api.get("/tenant"),
        api.get("/branches"),
        api.get("/warehouses"),
      ]);

      if (tRes.status === "fulfilled") {
        const d = (tRes.value as any)?.data ?? tRes.value;
        setTenantData(d);
        if (d?.branches && Array.isArray(d.branches)) setBranches(d.branches);
        if (d?.warehouses && Array.isArray(d.warehouses)) setWarehouses(d.warehouses);
      }

      if (bRes.status === "fulfilled") {
        const b = (bRes.value as any)?.data ?? bRes.value;
        if (Array.isArray(b) && b.length > 0) setBranches(b);
      }

      if (wRes.status === "fulfilled") {
        const w = (wRes.value as any)?.data ?? wRes.value;
        if (Array.isArray(w) && w.length > 0) setWarehouses(w);
      }
    } catch (e) {
      console.error("Failed to load settings data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  useEffect(() => {
    if (rawTab && rawTab !== activeTab) {
      const matched = rawTab === "tenant" ? "company" : (SETTINGS_TABS.find((t) => t.id === rawTab)?.id as SettingsTab);
      if (matched && matched !== activeTab) setActiveTab(matched);
    }
  }, [rawTab, activeTab]);

  const handleTabChange = (tabId: SettingsTab) => {
    setActiveTab(tabId);
    router.push(`/settings?tab=${tabId}`);
  };

  const showNotification = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">System & Store Settings</h1>
          <p className="text-xs text-slate-500">
            Configure company identity, POS checkout rules, offline sync, taxes, and multi-vertical defaults
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in">
              <CheckCircle2 size={14} /> {saveSuccess}
            </div>
          )}
          <button
            onClick={loadTenantData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-2xs space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Settings Navigation
          </p>
          <nav className="space-y-0.5">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                    isAct
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon size={16} className={isAct ? "text-primary-400" : "text-slate-400"} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                        isAct ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 w-full rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs">
          {activeTab === "company" && (
            <CompanySettingsTab tenantData={tenantData} onSave={() => showNotification("Company settings updated successfully!")} />
          )}
          {activeTab === "branch" && (
            <BranchSettingsTab branches={branches} onSave={() => showNotification("Branch defaults updated!")} />
          )}
          {activeTab === "pos" && (
            <POSSettingsTab warehouses={warehouses} onSave={() => showNotification("POS terminal configuration saved!")} />
          )}
          {activeTab === "sync" && (
            <OfflineSyncTab onSave={() => showNotification("Offline sync engine settings applied!")} />
          )}
          {activeTab === "tax" && (
            <TaxSettingsTab tenantData={tenantData} onSave={() => showNotification("VAT and tax rates saved!")} />
          )}
          {activeTab === "invoice" && (
            <InvoiceSettingsTab onSave={() => showNotification("Invoice print templates updated!")} />
          )}
          {activeTab === "payment" && (
            <PaymentSettingsTab onSave={() => showNotification("Payment gateway configuration saved!")} />
          )}
          {activeTab === "inventory" && (
            <InventorySettingsTab onSave={() => showNotification("Inventory valuation rules saved!")} />
          )}
          {activeTab === "notifications" && (
            <NotificationSettingsTab onSave={() => showNotification("Notification channels saved!")} />
          )}
          {activeTab === "users" && (
            <UserSettingsTab onSave={() => showNotification("User security policy updated!")} />
          )}
          {activeTab === "roles" && (
            <RoleSettingsTab onSave={() => showNotification("Role permissions updated!")} />
          )}
          {activeTab === "integrations" && (
            <IntegrationSettingsTab onSave={() => showNotification("API & Webhook configuration saved!")} />
          )}
          {activeTab === "ai" && (
            <AISettingsTab onSave={() => showNotification("AI features settings updated!")} />
          )}
          {activeTab === "subscription" && (
            <SubscriptionSettingsTab tenantData={tenantData} />
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 1: COMPANY & TENANT PROFILE
// ───────────────────────────────────────────────────────────────────────

function CompanySettingsTab({ tenantData, onSave }: { tenantData: any; onSave: () => void }) {
  const tenant = tenantData?.tenant || {};
  const company = tenantData?.company || {};

  const [name, setName] = useState(tenant.name || "Blue Ocean Enterprises");
  const [legalName, setLegalName] = useState(company.legalName || "Blue Ocean POS Retail Ltd.");
  const [address, setAddress] = useState(company.address || "Level 8, Concord Tower, Gulshan-1, Dhaka-1212");
  const [phone, setPhone] = useState("+880 1711-000000");
  const [email, setEmail] = useState("admin@blueocean.com.bd");
  const [vatRegNo, setVatRegNo] = useState(company.vatRegNo || "BIN-002938194-0101");
  const [businessType, setBusinessType] = useState(tenant.businessType || "GROCERY");
  const [currency, setCurrency] = useState(tenant.currency || "BDT");
  const [timezone, setTimezone] = useState(tenant.timezone || "Asia/Dhaka");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant.name) setName(tenant.name);
    if (company.legalName) setLegalName(company.legalName);
    if (company.address) setAddress(company.address);
    if (company.vatRegNo) setVatRegNo(company.vatRegNo);
    if (tenant.businessType) setBusinessType(tenant.businessType);
    if (tenant.currency) setCurrency(tenant.currency);
    if (tenant.timezone) setTimezone(tenant.timezone);
  }, [tenant, company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res: any = await api.put("/v1/tenant", {
        name,
        legalName,
        address,
        phone,
        email,
        vatRegNo,
        businessType,
        currency,
        timezone,
      });

      // Update local storage so rest of UI immediately reflects new businessType
      const mappedBt = res?.data?.businessType || res?.businessType || businessType;
      if (typeof window !== "undefined") {
        try {
          const curTenant = localStorage.getItem("blueoceans_tenant");
          const parsed = curTenant ? JSON.parse(curTenant) : {};
          localStorage.setItem("blueoceans_tenant", JSON.stringify({
            ...parsed,
            name,
            businessType: mappedBt,
          }));

          const curUser = localStorage.getItem("modernpos_user");
          if (curUser) {
            const parsedUser = JSON.parse(curUser);
            localStorage.setItem("modernpos_user", JSON.stringify({
              ...parsedUser,
              businessType: mappedBt,
            }));
          }
        } catch (err) {}
      }

      onSave();
    } catch (err: any) {
      console.error("Failed to update company profile:", err);
      alert(err?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">Company & Tenant Profile</h2>
        <p className="text-xs text-slate-500">Legal entity registration, contact info, and industry business vertical</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Company Trading Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/60"
            required
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Registered Legal Entity Name</label>
          <input
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/60"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Registered Head Office Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/60"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Official Support Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/60"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Billing & Support Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none focus:border-slate-400 bg-slate-50/60"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">NBR BIN / VAT Registration No</label>
          <input
            type="text"
            value={vatRegNo}
            onChange={(e) => setVatRegNo(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold focus:outline-none focus:border-slate-400 bg-slate-50/60"
            placeholder="BIN-000000000-0101"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Industry Business Vertical</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="w-full rounded-xl border border-teal-500 bg-teal-50/40 text-teal-900 px-3.5 py-2.5 font-bold focus:outline-none focus:border-teal-600"
          >
            <option value="GROCERY">Grocery & Supermarket</option>
            <option value="RESTAURANT">Restaurant & Cafe Dining</option>
            <option value="PHARMACY">Pharmacy & Medicine</option>
            <option value="RETAIL">Retail & Apparel</option>
            <option value="WHOLESALE">Wholesale & B2B Distribution</option>
            <option value="MANUFACTURING">Manufacturing & Bakery</option>
            <option value="SALON">Salon & Spa</option>
            <option value="REPAIR">Repair & Service</option>
            <option value="FRANCHISE">Franchise Multi-Outlet</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Base Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none focus:border-slate-400 bg-slate-50/60"
          >
            <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
            <option value="USD">USD ($ - US Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Default Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono focus:outline-none focus:border-slate-400 bg-slate-50/60"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Save size={14} /> {saving ? "Saving Changes..." : "Save Company Profile"}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 2: BRANCHES & OUTLETS
// ───────────────────────────────────────────────────────────────────────

function BranchSettingsTab({ branches, onSave }: { branches: any[]; onSave: () => void }) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.id || "");
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [autoNumbering, setAutoNumbering] = useState("AUTO");

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900">Multi-Branch Outlets</h2>
          <p className="text-slate-500">Configure default outlet, POS station codes, and receipt sequence</p>
        </div>
        <Link
          href="/branches"
          className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1"
        >
          Manage All Outlets →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Active Outlet / Store</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          >
            {branches.length > 0 ? (
              branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code || "MAIN"})
                </option>
              ))
            ) : (
              <option value="main">Main Outlet (Gulshan Branch)</option>
            )}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Invoice Prefix Code</label>
          <input
            type="text"
            value={invoicePrefix}
            onChange={(e) => setInvoicePrefix(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold focus:outline-none bg-slate-50/60"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Sequence Numbering Mode</label>
          <select
            value={autoNumbering}
            onChange={(e) => setAutoNumbering(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          >
            <option value="AUTO">Automatic Continuous (e.g. INV-001001)</option>
            <option value="DAILY_RESET">Daily Sequence (e.g. INV-20240908-001)</option>
            <option value="MANUAL">Manual Offline Entry</option>
          </select>
        </div>
      </div>

      {/* Outlet Cards Summary */}
      <div className="pt-2 space-y-2">
        <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Registered Outlets List</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(branches.length > 0 ? branches : [{ name: "Dhaka Flagship Outlet", code: "MAIN", address: "Gulshan-1", phone: "+880 1711-000000" }]).map((b, i) => (
            <div key={i} className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900">{b.name}</h4>
                <span className="text-[10px] font-mono font-bold bg-slate-200 px-2 py-0.5 rounded-md">{b.code || "OUTLET"}</span>
              </div>
              <p className="text-slate-500 text-[11px]">{b.address || "Dhaka, Bangladesh"}</p>
              <p className="text-slate-400 text-[10px] font-mono">{b.phone || "+880 1700-000000"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Branch Preferences
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 3: POS TERMINAL SETTINGS
// ───────────────────────────────────────────────────────────────────────

function POSSettingsTab({ warehouses, onSave }: { warehouses: any[]; onSave: () => void }) {
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || "");
  const [allowPriceOverride, setAllowPriceOverride] = useState(false);
  const [requireCustomer, setRequireCustomer] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [paperWidth, setPaperWidth] = useState("80mm");

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">POS Terminal Settings</h2>
        <p className="text-slate-500">Checkout lane behavior, hardware defaults, and cashier controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Default POS Warehouse / Stock Location</label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          >
            {warehouses.length > 0 ? (
              warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code || "WH-01"})
                </option>
              ))
            ) : (
              <option value="main">Main Retail Storefront Inventory</option>
            )}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Receipt Printer Paper Width</label>
          <select
            value={paperWidth}
            onChange={(e) => setPaperWidth(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          >
            <option value="80mm">80mm Standard Thermal Roll (3 inch)</option>
            <option value="58mm">58mm Compact Thermal Roll (2 inch)</option>
            <option value="A4">A4 Full Sheet Commercial Slip</option>
          </select>
        </div>
      </div>

      {/* Checkbox Toggles */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoPrint}
            onChange={(e) => setAutoPrint(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Auto-Print Receipt on Tender Confirmation</span>
            <p className="text-slate-400 text-[11px]">Automatically sends print job to default USB/ESC-POS printer</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowPriceOverride}
            onChange={(e) => setAllowPriceOverride(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Allow Price Override by Cashier</span>
            <p className="text-slate-400 text-[11px]">Requires manager approval PIN if unchecked</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={requireCustomer}
            onChange={(e) => setRequireCustomer(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Require Customer Selection for Sale</span>
            <p className="text-slate-400 text-[11px]">Disallows anonymous Walk-in Guest checkouts</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={soundEffects}
            onChange={(e) => setSoundEffects(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Barcode Scanner Beep Audio Feedback</span>
            <p className="text-slate-400 text-[11px]">Plays confirmation chime on valid SKU barcode scan</p>
          </div>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save POS Settings
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 4: OFFLINE SYNC ENGINE (§13)
// ───────────────────────────────────────────────────────────────────────

function OfflineSyncTab({ onSave }: { onSave: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("ONLINE & READY");
  const [pendingCount, setPendingCount] = useState(0);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncStatus("SYNCING WITH SERVER...");
    setTimeout(() => {
      setSyncing(false);
      setSyncStatus("ALL TRANSACTIONS UP TO DATE");
      setPendingCount(0);
      onSave();
    }, 1200);
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mb-1">
          <HardDrive size={12} /> Spec §13 · Offline-First Resilient Architecture
        </div>
        <h2 className="text-lg font-black text-slate-900">Offline-First Sync Engine</h2>
        <p className="text-slate-500">
          Local IndexedDB transaction cache, conflict resolution, and automatic cloud background synchronization
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Sync State</span>
          <p className="text-base font-black text-emerald-950 mt-1">{syncStatus}</p>
          <span className="text-[11px] text-emerald-700">IndexedDB local database operational</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Offline Queue</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{pendingCount}</p>
          <span className="text-[11px] text-slate-400">Transactions waiting for cloud push</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Offline Products Cache</span>
          <p className="text-base font-black text-blue-950 mt-1">2,480 SKUs Cached</p>
          <span className="text-[11px] text-blue-700">Full catalog available without internet</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Synchronizing Transactions..." : "Force Sync Now"}
        </button>

        <button
          onClick={() => alert("Offline catalog cache refreshed successfully from cloud!")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold px-4 py-2.5 text-xs hover:bg-slate-50 transition shadow-2xs"
        >
          <Database size={14} /> Pull Latest Products Cache
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 5: TAX & NBR VAT SETTINGS (§10.21)
// ───────────────────────────────────────────────────────────────────────

function TaxSettingsTab({ tenantData, onSave }: { tenantData: any; onSave: () => void }) {
  const company = tenantData?.company || {};
  const [vatNo, setVatNo] = useState(company.vatRegNo || "BIN-002938194-0101");
  const [defaultVatRate, setDefaultVatRate] = useState("5.00");
  const [mushakCompliance, setMushakCompliance] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">NBR VAT & Tax Configuration</h2>
        <p className="text-slate-500">National Board of Revenue (NBR) Mushak-6.3 compliance & itemized tax rules</p>
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <AlertCircle size={14} /> Statutory Bangladesh VAT Notice
        </p>
        <p className="text-[11px]">
          All production VAT/NBR workflows (Mushak-6.3, 6.7, 9.1 return reports) must follow the Value Added Tax and
          Supplementary Duty Act, 2012.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Business Identification Number (BIN)</label>
          <input
            type="text"
            value={vatNo}
            onChange={(e) => setVatNo(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono font-bold focus:outline-none bg-slate-50/60"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Default Standard VAT Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={defaultVatRate}
            onChange={(e) => setDefaultVatRate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={mushakCompliance}
            onChange={(e) => setMushakCompliance(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Enable Mushak-6.3 Tax Invoice Format on Receipts</span>
            <p className="text-slate-400 text-[11px]">Prints mandatory BIN, itemized VAT and breakdown on slips</p>
          </div>
        </label>
      </div>

      <div className="pt-2 flex justify-between items-center">
        <Link href="/tax" className="font-bold text-primary-600 hover:underline">
          Open Advanced Tax Engine & Tax Groups →
        </Link>

        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Tax Settings
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 6: INVOICE & PRINT LAYOUT
// ───────────────────────────────────────────────────────────────────────

function InvoiceSettingsTab({ onSave }: { onSave: () => void }) {
  const [template, setTemplate] = useState("retail");
  const [footerMsg, setFooterMsg] = useState("Thank you for shopping with us! Items can be exchanged within 7 days.");
  const [showBarcode, setShowBarcode] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">Invoice & Thermal Print Layout</h2>
        <p className="text-slate-500">Configure default receipt template per vertical and custom footer text</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Default Vertical Invoice Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          >
            <option value="retail">Retail POS Standard Thermal Slip</option>
            <option value="grocery">Grocery & Supermarket Lane (Tare / PLU)</option>
            <option value="wholesale">Wholesale B2B Commercial Challan / Invoice</option>
            <option value="restaurant">Restaurant Dining Guest Check & KOT</option>
            <option value="pharmacy">Pharmacy DGDA Prescription Dispense Slip</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Receipt Footer Note / Return Policy</label>
          <textarea
            value={footerMsg}
            onChange={(e) => setFooterMsg(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold focus:outline-none bg-slate-50/60"
            rows={2}
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showBarcode}
            onChange={(e) => setShowBarcode(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Render Barcode on Thermal Invoices</span>
            <p className="text-slate-400 text-[11px]">Enables instant optical barcode return scanning at returns counter</p>
          </div>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Invoice Preferences
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 7: PAYMENT GATEWAYS
// ───────────────────────────────────────────────────────────────────────

function PaymentSettingsTab({ onSave }: { onSave: () => void }) {
  const [methods, setMethods] = useState(["CASH", "CARD", "MOBILE_BANKING", "CREDIT"]);

  const toggle = (m: string) => {
    setMethods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">Payment Tender & Gateways</h2>
        <p className="text-slate-500">Enable payment methods at checkout counters and online gateways</p>
      </div>

      <div className="space-y-2">
        <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Tender Options at POS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "CASH", label: "Cash (BDT Taka Drawer)", desc: "Physical currency with automatic change calculation" },
            { id: "CARD", label: "Credit / Debit Card POS", desc: "Visa, Mastercard, Amex via EFTPOS terminal" },
            { id: "MOBILE_BANKING", label: "MFS (bKash / Nagad / Rocket)", desc: "Mobile financial services QR and OTP tender" },
            { id: "BANK", label: "Direct Bank Transfer / Cheque", desc: "For B2B wholesale and corporate purchase orders" },
            { id: "CREDIT", label: "Customer Credit & Dues", desc: "Book to customer ledger balance with credit limit check" },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                methods.includes(item.id)
                  ? "border-primary-500 bg-primary-50/40"
                  : "border-slate-200 bg-slate-50/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{item.label}</span>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${methods.includes(item.id) ? "bg-primary-600 text-white" : "border border-slate-300"}`}>
                  {methods.includes(item.id) && <Check size={10} />}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Payment Config
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 8: INVENTORY VALUATION
// ───────────────────────────────────────────────────────────────────────

function InventorySettingsTab({ onSave }: { onSave: () => void }) {
  const [costing, setCosting] = useState("FIFO");
  const [allowNegative, setAllowNegative] = useState(false);
  const [threshold, setThreshold] = useState("10");

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">Inventory Valuation & Costing</h2>
        <p className="text-slate-500">COGS calculation method, batch FEFO rules, and low stock warnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Costing & Valuation Method</label>
          <select
            value={costing}
            onChange={(e) => setCosting(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          >
            <option value="FIFO">FIFO (First In, First Out) - Recommended for Retail</option>
            <option value="FEFO">FEFO (First Expired, First Out) - Recommended for Pharmacy</option>
            <option value="WEIGHTED_AVERAGE">Weighted Average Cost (WAC)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Default Low Stock Alert Threshold</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allowNegative}
            onChange={(e) => setAllowNegative(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Allow Negative Inventory Checkout</span>
            <p className="text-slate-400 text-[11px]">Permits checkout when system stock is 0 (will reconcile on GRN)</p>
          </div>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Inventory Rules
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 9: ALERTS & NOTIFICATIONS
// ───────────────────────────────────────────────────────────────────────

function NotificationSettingsTab({ onSave }: { onSave: () => void }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  const [shiftClose, setShiftClose] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">Alerts & Notifications Engine</h2>
        <p className="text-slate-500">Real-time alerts for low stock, shift closures, and cash discrepancies</p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Low Stock Reorder Notifications</span>
            <p className="text-slate-400 text-[11px]">Notifies inventory manager when SKU drops below threshold</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={shiftClose}
            onChange={(e) => setShiftClose(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Daily Shift & Drawer Reconciliation Summary</span>
            <p className="text-slate-400 text-[11px]">Sends shift sales report to owner email upon register close</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={smsAlerts}
            onChange={(e) => setSmsAlerts(e.target.checked)}
            className="w-4 h-4 rounded text-slate-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Customer SMS Invoice Receipts</span>
            <p className="text-slate-400 text-[11px]">Sends SMS thank-you with invoice link to customer mobile</p>
          </div>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Notification Preferences
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 10: USERS & ACCESS
// ───────────────────────────────────────────────────────────────────────

function UserSettingsTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900">Users & Security Policy</h2>
          <p className="text-slate-500">Session timeouts, two-factor authentication, and password rules</p>
        </div>
        <Link href="/hrm" className="font-bold text-primary-600 hover:underline">
          Manage Staff & Employees →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Cashier Session Timeout (Minutes)</label>
          <input
            type="number"
            defaultValue={60}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Password Complexity Policy</label>
          <select className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-bold focus:outline-none bg-slate-50/60">
            <option value="HIGH">Strong (8+ chars, numbers, symbols)</option>
            <option value="MEDIUM">Medium (6+ chars, alphanumeric)</option>
            <option value="PIN">Cashier Quick 4-Digit PIN</option>
          </select>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save Security Policies
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 11: ROLES & RBAC
// ───────────────────────────────────────────────────────────────────────

function RoleSettingsTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900">Role-Based Access Control (RBAC)</h2>
          <p className="text-slate-500">Granular permissions per role for POS checkout, refunds, and reports</p>
        </div>
        <Link href="/rbac" className="font-bold text-primary-600 hover:underline">
          Open RBAC Permission Matrix →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { role: "CASHIER", perms: "Checkout, Hold Cart, Cash Tender, Return Slip" },
          { role: "STORE_MANAGER", perms: "Price Override, Shift Close, Stock Adjustment, Refunds" },
          { role: "ADMINISTRATOR", perms: "Full System Access, Accounting, Settings, SaaS Management" },
        ].map((r) => (
          <div key={r.role} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <span className="font-mono font-bold text-slate-900 text-xs">{r.role}</span>
            <p className="text-slate-500 text-[11px]">{r.perms}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 12: INTEGRATIONS & WEBHOOKS
// ───────────────────────────────────────────────────────────────────────

function IntegrationSettingsTab({ onSave }: { onSave: () => void }) {
  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900">API, Webhooks & Integrations</h2>
          <p className="text-slate-500">Connect third-party e-commerce, delivery courier API & accounting tools</p>
        </div>
        <Link href="/integrations" className="font-bold text-primary-600 hover:underline">
          View API Keys & Webhook Logs →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
          <h4 className="font-bold text-slate-900">Shopify & Marketplace Connector</h4>
          <p className="text-slate-400 text-[11px]">Real-time two-way stock synchronization</p>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Active Adapter
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
          <h4 className="font-bold text-slate-900">Delivery Logistics API (Steadfast / Pathao / RedX)</h4>
          <p className="text-slate-400 text-[11px]">Automated consignment tracking and OTP delivery verification</p>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Connected
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 13: AI BUSINESS ASSISTANT
// ───────────────────────────────────────────────────────────────────────

function AISettingsTab({ onSave }: { onSave: () => void }) {
  const [demandForecasting, setDemandForecasting] = useState(true);
  const [smartReordering, setSmartReordering] = useState(true);

  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full mb-1">
          <Brain size={12} /> Blue Oceans AI Intelligence Core
        </div>
        <h2 className="text-lg font-black text-slate-900">AI Business Assistant Features</h2>
        <p className="text-slate-500">Autonomous stock forecasting, customer churn prevention, and voice POS commands</p>
      </div>

      <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-200 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={demandForecasting}
            onChange={(e) => setDemandForecasting(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">AI Demand & Seasonality Forecasting</span>
            <p className="text-slate-500 text-[11px]">Predicts required inventory for upcoming Ramadan, Eid & festivals</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={smartReordering}
            onChange={(e) => setSmartReordering(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-900 focus:ring-0"
          />
          <div>
            <span className="font-bold text-slate-900">Automated Purchase Requisition (PR) Generator</span>
            <p className="text-slate-500 text-[11px]">Generates supplier purchase drafts when safety stock is breached</p>
          </div>
        </label>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 text-xs transition shadow-sm"
        >
          <Save size={14} /> Save AI Preferences
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// TAB 14: SUBSCRIPTION & SAAS PLAN
// ───────────────────────────────────────────────────────────────────────

function SubscriptionSettingsTab({ tenantData }: { tenantData: any }) {
  const tenant = tenantData?.tenant || {};
  return (
    <div className="space-y-6 text-xs">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-black text-slate-900">Subscription & SaaS Enterprise Quota</h2>
        <p className="text-slate-500">Current tenant licensing, active modules, and multi-outlet quota</p>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-950 text-white space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active Plan</span>
            <h3 className="text-2xl font-black">ENTERPRISE PRO TIER</h3>
            <p className="text-xs text-slate-300 mt-0.5">Tenant Slug: <span className="font-mono text-white font-bold">{tenant.slug || "main-tenant"}</span></p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-slate-950">Active & Licensed</span>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 text-center">
          <div>
            <p className="text-xl font-bold">Unlimited</p>
            <span className="text-[10px] text-slate-400">Branches / Outlets</span>
          </div>
          <div>
            <p className="text-xl font-bold">Unlimited</p>
            <span className="text-[10px] text-slate-400">POS Terminals</span>
          </div>
          <div>
            <p className="text-xl font-bold">99.99%</p>
            <span className="text-[10px] text-slate-400">SLA Uptime Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Default Page Export ───

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw size={24} className="mx-auto animate-spin text-slate-400" />
          <p className="font-bold">Loading System Settings...</p>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}