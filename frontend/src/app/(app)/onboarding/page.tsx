"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Building,
  MapPin,
  Warehouse,
  DollarSign,
  CreditCard,
  Users,
  Play,
  ShoppingBag,
  Utensils,
  Pill,
  Truck,
  ShoppingCart,
  Sparkles,
  Wrench,
  Factory,
  Building2,
  Check,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomInput } from "@/components/custom/CustomInput";

const STEPS = [
  { id: "business-type", title: "Business Type", icon: Building },
  { id: "company", title: "Company Setup", icon: Building },
  { id: "branch", title: "Branch Setup", icon: MapPin },
  { id: "warehouse", title: "Warehouse Setup", icon: Warehouse },
  { id: "tax", title: "Tax Setup", icon: DollarSign },
  { id: "payment", title: "Payment Setup", icon: CreditCard },
  { id: "users", title: "Owner Setup", icon: Users },
  { id: "complete", title: "Launch Store", icon: CheckCircle },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const BUSINESS_TYPES = [
  { id: "RETAIL", name: "Retail", description: "General retail, apparel, electronics, lifestyle", icon: ShoppingBag },
  { id: "RESTAURANT", name: "Restaurant", description: "Food service, cafes, QSR, cloud kitchens", icon: Utensils },
  { id: "PHARMACY", name: "Pharmacy", description: "Medicine retail with batch & expiry tracking", icon: Pill },
  { id: "GROCERY", name: "Grocery & Supermarket", description: "Fast barcode checkout, weighing scales", icon: ShoppingCart },
  { id: "WHOLESALE", name: "Wholesale & Distribution", description: "B2B distribution, bulk pricing, credit accounts", icon: Truck },
  { id: "MANUFACTURING", name: "Manufacturing & Bakery", description: "Bill of materials, light assembly, production", icon: Factory },
  { id: "SALON", name: "Salon & Spa", description: "Beauty salon and spa services", icon: Sparkles },
  { id: "REPAIR", name: "Repair & Service Center", description: "Job ticketing, warranty & device tracking", icon: Wrench },
  { id: "FRANCHISE", name: "Franchise Management", description: "Multi-outlet franchise operations, royalty tracking & master control", icon: Building2 },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("business-type");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [provisionResult, setProvisionResult] = useState<any>(null);

  // Form states (Clean client-side state)
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("GROCERY");
  const [companyForm, setCompanyForm] = useState({
    name: "",
    legalName: "",
    phone: "",
    email: "",
    address: "",
    vatRegNo: "",
  });
  const [branchForm, setBranchForm] = useState({
    code: "MAIN",
    name: "Main Branch",
    phone: "",
    email: "",
    address: "",
  });
  const [warehouseForm, setWarehouseForm] = useState({
    code: "WH-MAIN",
    name: "Main Warehouse",
    type: "CENTRAL",
  });
  const [taxForm, setTaxForm] = useState({
    taxEnabled: true,
    vatRate: 15,
    taxRegistrationNumber: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    enabledMethods: ["CASH", "CARD", "MOBILE_BANKING", "BANK", "CREDIT"],
    defaultMethod: "CASH",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    roleId: "Owner",
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (currentStep === "business-type") {
        if (!selectedBusinessType) {
          throw new Error("Please select a business type to continue.");
        }
        setCompletedSteps((prev) => new Set([...prev, "business-type"]));
      } else if (currentStep === "company") {
        if (!companyForm.name.trim()) {
          throw new Error("Store / Business name is required.");
        }
        setCompletedSteps((prev) => new Set([...prev, "company"]));
      } else if (currentStep === "branch") {
        if (!branchForm.name.trim() || !branchForm.code.trim()) {
          throw new Error("Branch name and branch code are required.");
        }
        setCompletedSteps((prev) => new Set([...prev, "branch"]));
      } else if (currentStep === "warehouse") {
        if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
          throw new Error("Warehouse name and warehouse code are required.");
        }
        setCompletedSteps((prev) => new Set([...prev, "warehouse"]));
      } else if (currentStep === "tax") {
        setCompletedSteps((prev) => new Set([...prev, "tax"]));
      } else if (currentStep === "payment") {
        setCompletedSteps((prev) => new Set([...prev, "payment"]));
      } else if (currentStep === "users") {
        if (!userForm.name.trim()) {
          throw new Error("Owner name is required.");
        }
        if (!userForm.email.trim()) {
          throw new Error("Owner login email is required.");
        }
        if (!userForm.password || userForm.password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        setCompletedSteps((prev) => new Set([...prev, "users"]));
      }

      const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
      setCurrentStep(STEPS[nextIndex].id);
    } catch (error: any) {
      setErrorMessage(error.message || "Please complete all required fields.");
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEPS[prevIndex].id);
  };

  const handleProvisionTenant = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload = {
        businessType: selectedBusinessType,
        company: companyForm,
        branch: branchForm,
        warehouse: warehouseForm,
        tax: taxForm,
        payment: paymentForm,
        user: userForm,
      };

      const res: any = await api.post("/onboarding/provision", payload);
      const data = res?.data || res;
      setProvisionResult(data);
      setCompletedSteps((prev) => new Set([...prev, "complete"]));
      setSuccessMessage("🎉 New Isolated Tenant Store Successfully Provisioned!");
    } catch (error: any) {
      const msg = error.message || error.error || "Failed to provision tenant store. Please verify email and input.";
      setErrorMessage(msg);
      console.error("Provisioning error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetWizard = () => {
    setSelectedBusinessType("GROCERY");
    setCompanyForm({ name: "", legalName: "", phone: "", email: "", address: "", vatRegNo: "" });
    setBranchForm({ code: "MAIN", name: "Main Branch", phone: "", email: "", address: "" });
    setWarehouseForm({ code: "WH-MAIN", name: "Main Warehouse", type: "CENTRAL" });
    setTaxForm({ taxEnabled: true, vatRate: 15, taxRegistrationNumber: "" });
    setUserForm({ name: "", email: "", password: "", phone: "", roleId: "Owner" });
    setCompletedSteps(new Set());
    setProvisionResult(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setCurrentStep("business-type");
  };

  const handleSwitchToNewTenant = (token: string, tenant: any, owner: any) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("modernpos_token", token);
        localStorage.setItem("modernpos_user", JSON.stringify({
          ...owner,
          role: "Owner",
          roleName: "Owner",
          businessType: tenant.businessType,
        }));
        localStorage.setItem("blueoceans_tenant", JSON.stringify({
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          businessType: tenant.businessType,
        }));
      } catch (e) {}
    }
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">
            ✨ Client Provisioning Wizard
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Single Tenant Onboarding</h1>
          <p className="mt-1 text-sm text-slate-600">
            Provision a brand new isolated business client with its own dedicated store, branch, warehouse, and owner credentials.
          </p>
        </div>

        {/* Stepper Navigation */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-none">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center flex-1 min-w-[75px]">
                  <div
                    onClick={() => {
                      if (isCompleted || index <= currentStepIndex) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`flex flex-col items-center cursor-pointer transition ${
                      isCurrent ? "scale-105" : "hover:opacity-80"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-200 shadow-xs ${
                        isCompleted
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-emerald-200"
                          : isCurrent
                          ? "border-primary-600 bg-primary-600 text-white shadow-primary-200 ring-4 ring-primary-100"
                          : "border-slate-300 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {isCompleted ? <Check size={18} /> : <Icon size={16} />}
                    </div>
                    <span
                      className={`mt-1.5 text-[11px] font-medium text-center whitespace-nowrap ${
                        isCurrent
                          ? "text-primary-700 font-semibold"
                          : isCompleted
                          ? "text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 min-w-[15px] transition-colors ${
                        isCompleted || completedSteps.has(STEPS[index + 1].id)
                          ? "bg-emerald-500"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-fadeIn">
            <AlertCircle size={18} className="shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 animate-fadeIn">
            <CheckCircle size={18} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Card Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {currentStep === "business-type" && (
            <BusinessTypeStep
              selected={selectedBusinessType}
              onSelect={(type) => {
                setSelectedBusinessType(type);
                setErrorMessage(null);
              }}
            />
          )}

          {currentStep === "company" && (
            <CompanySetupStep
              form={companyForm}
              onChange={(k, v) => setCompanyForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "branch" && (
            <BranchSetupStep
              form={branchForm}
              onChange={(k, v) => setBranchForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "warehouse" && (
            <WarehouseSetupStep
              form={warehouseForm}
              onChange={(k, v) => setWarehouseForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "tax" && (
            <TaxSetupStep
              form={taxForm}
              onChange={(k, v) => setTaxForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "payment" && (
            <PaymentSetupStep
              form={paymentForm}
              onChange={(k, v) => setPaymentForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "users" && (
            <OwnerSetupStep
              form={userForm}
              onChange={(k, v) => setUserForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "complete" && (
            <CompleteStep
              provisionResult={provisionResult}
              businessType={selectedBusinessType}
              company={companyForm}
              branch={branchForm}
              warehouse={warehouseForm}
              tax={taxForm}
              user={userForm}
              onProvision={handleProvisionTenant}
              onReset={handleResetWizard}
              onSwitch={handleSwitchToNewTenant}
              loading={loading}
            />
          )}

          {/* Navigation Controls */}
          {currentStep !== "complete" && (
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              {currentStepIndex > 0 ? (
                <CustomButton
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back
                </CustomButton>
              ) : (
                <div />
              )}

              <CustomButton
                onClick={handleNext}
                disabled={loading || (currentStep === "business-type" && !selectedBusinessType)}
                className="px-6 py-2.5 font-semibold shadow-xs bg-teal-600 hover:bg-teal-700 text-white"
              >
                {currentStepIndex === STEPS.length - 2 ? "Review & Finalize" : "Save & Continue"}
                <ArrowRight size={16} className="ml-2" />
              </CustomButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Business Type Step
// ─────────────────────────────────────────────────────────────────────────────
function BusinessTypeStep({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (type: string) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">What type of business are you operating?</h2>
        <p className="text-sm text-slate-500 mt-1">
          Selecting your business type configures intelligent defaults, modules, and workflows specifically tailored for your vertical.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {BUSINESS_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-150 flex items-start gap-3.5 ${
                isSelected
                  ? "border-primary-600 bg-primary-50/50 shadow-xs ring-2 ring-primary-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  isSelected ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">{type.name}</span>
                  {isSelected && <Check size={16} className="text-primary-600" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Company Setup Step
// ─────────────────────────────────────────────────────────────────────────────
function CompanySetupStep({
  form,
  onChange,
}: {
  form: any;
  onChange: (key: string, val: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Setup your organization</h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter official legal and contact details for invoice headings, reports, and receipts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomInput
          label="Business / Trading Name *"
          placeholder="e.g., Blue Ocean Superstore"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
        <CustomInput
          label="Legal Entity Name"
          placeholder="e.g., Blue Ocean Trading Ltd."
          value={form.legalName}
          onChange={(e) => onChange("legalName", e.target.value)}
        />
        <CustomInput
          label="Official Phone *"
          placeholder="e.g., +8801700000000"
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
        <CustomInput
          label="Official Email *"
          type="email"
          placeholder="e.g., info@blueocean.com"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Registered Address</label>
        <textarea
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-slate-400"
          rows={2}
          placeholder="e.g., House 12, Road 4, Dhanmondi, Dhaka-1205"
          value={form.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </div>

      <CustomInput
        label="VAT / Tax Registration Number (BIN / TIN)"
        placeholder="e.g., BIN-001234567-0101"
        value={form.vatRegNo}
        onChange={(e) => onChange("vatRegNo", e.target.value)}
        hint="Used automatically on NBR Mushak-6.3 and POS receipt tax headers."
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Branch Setup Step
// ─────────────────────────────────────────────────────────────────────────────
function BranchSetupStep({
  form,
  onChange,
}: {
  form: any;
  onChange: (key: string, val: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Setup your primary branch / outlet</h2>
        <p className="text-sm text-slate-500 mt-1">
          Every transaction and register session is anchored to an active branch location.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomInput
          label="Branch Code *"
          placeholder="e.g., MAIN or DHK-01"
          value={form.code}
          onChange={(e) => onChange("code", e.target.value.toUpperCase())}
        />
        <CustomInput
          label="Branch Name *"
          placeholder="e.g., Flagship Store - Dhanmondi"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
        <CustomInput
          label="Branch Contact Phone"
          placeholder="e.g., +8801700000000"
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
        <CustomInput
          label="Branch Email"
          type="email"
          placeholder="e.g., branch1@blueocean.com"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Branch Location Address</label>
        <textarea
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:text-slate-400"
          rows={2}
          placeholder="e.g., Plot 24, Satmasjid Road, Dhanmondi, Dhaka"
          value={form.address}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Warehouse Setup Step
// ─────────────────────────────────────────────────────────────────────────────
function WarehouseSetupStep({
  form,
  onChange,
}: {
  form: any;
  onChange: (key: string, val: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Setup your primary warehouse / stock room</h2>
        <p className="text-sm text-slate-500 mt-1">
          Stock levels, purchase receiving (GRN), and inventory audits are stored in this warehouse.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomInput
          label="Warehouse Code *"
          placeholder="e.g., WH-01"
          value={form.code}
          onChange={(e) => onChange("code", e.target.value.toUpperCase())}
        />
        <CustomInput
          label="Warehouse Name *"
          placeholder="e.g., Central Distribution Center"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Warehouse Type</label>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          value={form.type}
          onChange={(e) => onChange("type", e.target.value)}
        >
          <option value="CENTRAL">Central Warehouse</option>
          <option value="BRANCH_STORE">Branch Backroom / Store</option>
          <option value="TRANSIT">Transit Warehouse</option>
          <option value="DAMAGE">Damaged / Quarantine Stock</option>
        </select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Tax Setup Step
// ─────────────────────────────────────────────────────────────────────────────
function TaxSetupStep({
  form,
  onChange,
}: {
  form: any;
  onChange: (key: string, val: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Configure tax and VAT policies</h2>
        <p className="text-sm text-slate-500 mt-1">
          Set default tax rate and VAT calculation rules for POS checkouts and invoice generation.
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
        <p className="text-xs leading-relaxed text-amber-900">
          <strong>Tax Engine Notice:</strong> Blue Ocean POS supports configurable tax tiers, NBR Mushak-6.3 compliance, and zero-rated items. You can customize additional tax rules anytime from the Tax module.
        </p>
      </div>

      <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
        <input
          type="checkbox"
          id="taxEnabled"
          checked={form.taxEnabled}
          onChange={(e) => onChange("taxEnabled", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="taxEnabled" className="text-sm font-medium text-slate-800 cursor-pointer">
          Enable automatic VAT calculation on POS transactions
        </label>
      </div>

      {form.taxEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
          <CustomInput
            label="Standard VAT Rate (%)"
            type="number"
            placeholder="15"
            value={form.vatRate}
            onChange={(e) => onChange("vatRate", e.target.value)}
            hint="Default standard rate in Bangladesh is 15%."
          />
          <CustomInput
            label="Tax Registration (BIN / TIN)"
            placeholder="e.g., BIN-001234567-0101"
            value={form.taxRegistrationNumber}
            onChange={(e) => onChange("taxRegistrationNumber", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Payment Setup Step
// ─────────────────────────────────────────────────────────────────────────────
function PaymentSetupStep({
  form,
  onChange,
}: {
  form: any;
  onChange: (key: string, val: any) => void;
}) {
  const methods = [
    { id: "CASH", label: "Cash" },
    { id: "CARD", label: "Credit / Debit Card (POS Terminal)" },
    { id: "MOBILE_BANKING", label: "Mobile Banking (bKash / Nagad / Rocket)" },
    { id: "BANK", label: "Bank Transfer / Cheque" },
    { id: "CREDIT", label: "Customer Credit / Due Account" },
  ];

  const toggleMethod = (methodId: string) => {
    const current: string[] = form.enabledMethods || [];
    if (current.includes(methodId)) {
      if (current.length === 1) return; // Keep at least one
      onChange(
        "enabledMethods",
        current.filter((m) => m !== methodId)
      );
    } else {
      onChange("enabledMethods", [...current, methodId]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Configure payment tender options</h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose which payment channels your cashiers can accept at the checkout counter.
        </p>
      </div>

      <div className="space-y-2">
        {methods.map((m) => {
          const isEnabled = (form.enabledMethods || []).includes(m.id);
          return (
            <div
              key={m.id}
              onClick={() => toggleMethod(m.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                isEnabled
                  ? "border-primary-400 bg-primary-50/40"
                  : "border-slate-200 bg-white opacity-70"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleMethod(m.id)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-800">{m.label}</span>
              </div>
              {isEnabled && <Check size={16} className="text-primary-600" />}
            </div>
          );
        })}
      </div>

      <div className="pt-2">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Payment Method</label>
        <select
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          value={form.defaultMethod}
          onChange={(e) => onChange("defaultMethod", e.target.value)}
        >
          {(form.enabledMethods || []).map((m: string) => (
            <option key={m} value={m}>
              {m.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Users Setup Step
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 7. Owner Setup Step
// ─────────────────────────────────────────────────────────────────────────────
function OwnerSetupStep({
  form,
  onChange,
}: {
  form: any;
  onChange: (key: string, val: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Client Owner & Administrator Credentials</h2>
        <p className="text-sm text-slate-500 mt-1">
          Create the primary Owner account for this business client. They will have full administrative access to their dedicated tenant store.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomInput
          label="Owner Full Name *"
          placeholder="e.g., Jane Doe"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
        <CustomInput
          label="Owner Login Email *"
          type="email"
          placeholder="e.g., owner@clientstore.com"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
          hint="This email will be used to log into their dedicated store."
        />
        <CustomInput
          label="Initial Password *"
          type="password"
          placeholder="Min 6 characters"
          value={form.password}
          onChange={(e) => onChange("password", e.target.value)}
        />
        <CustomInput
          label="Contact Phone"
          placeholder="e.g., +8801700000000"
          value={form.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 leading-relaxed">
        <strong>Single Tenant Isolation:</strong> This owner account will be strictly linked only to this new tenant. No data (products, sales, customers) will be shared with other stores.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Complete Step (Review & Launch Tenant)
// ─────────────────────────────────────────────────────────────────────────────
function CompleteStep({
  provisionResult,
  businessType,
  company,
  branch,
  warehouse,
  tax,
  user,
  onProvision,
  onReset,
  onSwitch,
  loading,
}: {
  provisionResult: any;
  businessType: string;
  company: any;
  branch: any;
  warehouse: any;
  tax: any;
  user: any;
  onProvision: () => void;
  onReset: () => void;
  onSwitch: (token: string, tenant: any, owner: any) => void;
  loading: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = () => {
    if (!provisionResult) return;
    const text = `=== Blue Oceans POS Client Tenant Credentials ===
Store Name: ${provisionResult.tenant?.name}
Business Type: ${provisionResult.tenant?.businessType}
Tenant ID: ${provisionResult.tenant?.id}
Store Slug: ${provisionResult.tenant?.slug}
Owner Name: ${provisionResult.owner?.name}
Login Email: ${provisionResult.owner?.email}
Initial Password: ${user.password}
Login URL: ${window.location.origin}/login
=================================================`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (provisionResult) {
    return (
      <div className="py-2 text-center animate-fadeIn">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
          <CheckCircle size={44} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Tenant Store Ready!</h2>
        <p className="mt-1 text-sm text-slate-600 max-w-lg mx-auto">
          A dedicated, isolated single-tenant business has been created with clean inventory & zero seed bleed.
        </p>

        {/* Credentials Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/90 p-5 text-left max-w-xl mx-auto space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Business Client</span>
              <h3 className="text-lg font-bold text-slate-900">{provisionResult.tenant?.name}</h3>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 uppercase">
              {provisionResult.tenant?.businessType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 font-medium">Tenant Slug:</span>
              <p className="font-mono text-slate-800 font-semibold">{provisionResult.tenant?.slug}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Tenant ID:</span>
              <p className="font-mono text-slate-700 truncate">{provisionResult.tenant?.id}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Owner Name:</span>
              <p className="text-slate-800 font-semibold">{provisionResult.owner?.name}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Login Email:</span>
              <p className="font-mono text-teal-700 font-semibold">{provisionResult.owner?.email}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={handleCopyCredentials}
              className="text-xs py-1.5"
            >
              {copied ? "✓ Copied to Clipboard" : "📋 Copy Client Credentials"}
            </CustomButton>

            <CustomButton
              size="sm"
              onClick={() => onSwitch(provisionResult.token, provisionResult.tenant, provisionResult.owner)}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs py-1.5"
            >
              ⚡ Log In as Store Owner
            </CustomButton>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <CustomButton
            variant="outline"
            onClick={onReset}
            className="text-sm font-semibold text-slate-700"
          >
            ➕ Onboard Another Business Client
          </CustomButton>
        </div>
      </div>
    );
  }

  // Pre-provision Review Screen
  return (
    <div className="py-2 space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Review &amp; Provision Client Store</h2>
        <p className="text-sm text-slate-500 mt-1">
          Verify configuration before provisioning the dedicated database tenant and owner account.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business & Company Info */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Business &amp; Vertical</span>
          <div className="text-sm font-semibold text-slate-900">{company.name || "Untitled Business"}</div>
          <div className="text-xs text-slate-600">Type: <span className="font-semibold text-teal-700">{businessType}</span></div>
          {company.legalName && <div className="text-xs text-slate-600">Legal: {company.legalName}</div>}
          <div className="text-xs text-slate-600">Contact: {company.phone || "—"} | {company.email || "—"}</div>
        </div>

        {/* Branch & Warehouse */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Branch &amp; Stock Ledger</span>
          <div className="text-sm font-semibold text-slate-900">Branch: {branch.name} ({branch.code})</div>
          <div className="text-xs text-slate-600">Warehouse: <span className="font-semibold">{warehouse.name} ({warehouse.code})</span></div>
          <div className="text-xs text-slate-600">Tax / VAT: {tax.taxEnabled ? `${tax.vatRate}% Standard VAT` : "Disabled"}</div>
        </div>

        {/* Owner Credentials */}
        <div className="sm:col-span-2 p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Dedicated Owner Account</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Owner Name:</span>
              <span className="font-semibold text-slate-900">{user.name || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Login Email:</span>
              <span className="font-semibold font-mono text-teal-800">{user.email || "—"}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Initial Password:</span>
              <span className="font-mono text-slate-700">••••••••</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
        <CustomButton
          onClick={onProvision}
          disabled={loading}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Provisioning Isolated Tenant...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              🚀 Provision &amp; Launch Client Store
            </span>
          )}
        </CustomButton>
      </div>
    </div>
  );
}