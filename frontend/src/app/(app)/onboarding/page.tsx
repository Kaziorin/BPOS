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
  { id: "users", title: "Create Users", icon: Users },
  { id: "complete", title: "Complete", icon: CheckCircle },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const BUSINESS_TYPES = [
  { id: "RETAIL", name: "Retail", description: "General retail, apparel, electronics, lifestyle", icon: ShoppingBag },
  { id: "RESTAURANT", name: "Restaurant", description: "Food service, cafes, QSR, cloud kitchens", icon: Utensils },
  { id: "PHARMACY", name: "Pharmacy", description: "Medicine retail with batch & expiry tracking", icon: Pill },
  { id: "WHOLESALE", name: "Wholesale & B2B", description: "B2B distribution, bulk pricing, credit accounts", icon: Truck },
  { id: "GROCERY", name: "Grocery & Supermarket", description: "Fast barcode checkout, weighing scales", icon: ShoppingCart },
  { id: "SALON", name: "Salon & Spa", description: "Beauty salon and spa services", icon: Sparkles },
  { id: "REPAIR", name: "Repair & Service", description: "Job ticketing, warranty & device tracking", icon: Wrench },
  { id: "MANUFACTURING", name: "Manufacturing", description: "Bill of materials, light assembly, production", icon: Factory },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("business-type");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  // Form states
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("RETAIL");
  const [companyForm, setCompanyForm] = useState({
    name: "My Business",
    legalName: "",
    phone: "+8801700000000",
    email: "contact@mybusiness.com",
    address: "Dhaka, Bangladesh",
    vatRegNo: "BIN-001234567-0101",
  });
  const [branchForm, setBranchForm] = useState({
    code: "MAIN",
    name: "Main Branch",
    phone: "+8801700000000",
    email: "branch@mybusiness.com",
    address: "Dhaka, Bangladesh",
  });
  const [warehouseForm, setWarehouseForm] = useState({
    code: "WH-01",
    name: "Main Central Warehouse",
    type: "CENTRAL",
  });
  const [taxForm, setTaxForm] = useState({
    taxEnabled: true,
    vatRate: 15,
    taxRegistrationNumber: "BIN-001234567-0101",
  });
  const [paymentForm, setPaymentForm] = useState({
    enabledMethods: ["CASH", "CARD", "MOBILE_BANKING", "BANK", "CREDIT"],
    defaultMethod: "CASH",
  });
  const [userForm, setUserForm] = useState({
    name: "Store Manager",
    email: "",
    password: "",
    roleId: "",
  });
  const [rolesList, setRolesList] = useState<Array<{ id: string; name: string; description?: string }>>([]);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // Load existing onboarding state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const res = await api.get<{ data: any }>("/api/v1/onboarding/state");
        const state = (res as any)?.data || (res as any);
        if (state) {
          if (state.businessType) setSelectedBusinessType(state.businessType);
          if (state.company) {
            setCompanyForm((prev) => ({
              ...prev,
              name: state.company.name || prev.name,
              legalName: state.company.legalName || prev.legalName,
              phone: state.company.phone || prev.phone,
              email: state.company.email || prev.email,
              address: state.company.address || prev.address,
              vatRegNo: state.company.vatRegNo || prev.vatRegNo,
            }));
          }
          if (state.branch) {
            setBranchForm((prev) => ({
              ...prev,
              code: state.branch.code || prev.code,
              name: state.branch.name || prev.name,
              phone: state.branch.phone || prev.phone,
              email: state.branch.email || prev.email,
              address: state.branch.address || prev.address,
            }));
          }
          if (state.warehouse) {
            setWarehouseForm((prev) => ({
              ...prev,
              code: state.warehouse.code || prev.code,
              name: state.warehouse.name || prev.name,
              type: state.warehouse.type || prev.type,
            }));
          }
          if (state.tax) {
            setTaxForm((prev) => ({
              ...prev,
              taxEnabled: state.tax.taxEnabled ?? prev.taxEnabled,
              vatRate: state.tax.vatRate ?? prev.vatRate,
              taxRegistrationNumber: state.tax.taxRegistrationNumber || prev.taxRegistrationNumber,
            }));
          }
          if (state.roles && Array.isArray(state.roles)) {
            setRolesList(state.roles);
            if (state.roles.length > 0 && !userForm.roleId) {
              setUserForm((u) => ({ ...u, roleId: state.roles[0].id }));
            }
          }
        }
      } catch (err) {
        console.warn("Could not pre-load onboarding state, using defaults:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadState();
  }, []);

  const handleNext = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (currentStep === "business-type") {
        if (!selectedBusinessType) {
          throw new Error("Please select a business type to continue.");
        }
        await api.post("/api/v1/onboarding/business-type", { businessType: selectedBusinessType });
        setCompletedSteps((prev) => new Set([...prev, "business-type"]));
      } else if (currentStep === "company") {
        if (!companyForm.name.trim()) {
          throw new Error("Company name is required.");
        }
        await api.post("/api/v1/onboarding/company", companyForm);
        setCompletedSteps((prev) => new Set([...prev, "company"]));
      } else if (currentStep === "branch") {
        if (!branchForm.name.trim() || !branchForm.code.trim()) {
          throw new Error("Branch name and branch code are required.");
        }
        await api.post("/api/v1/onboarding/branch", branchForm);
        setCompletedSteps((prev) => new Set([...prev, "branch"]));
      } else if (currentStep === "warehouse") {
        if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
          throw new Error("Warehouse name and warehouse code are required.");
        }
        await api.post("/api/v1/onboarding/warehouse", warehouseForm);
        setCompletedSteps((prev) => new Set([...prev, "warehouse"]));
      } else if (currentStep === "tax") {
        await api.post("/api/v1/onboarding/tax", taxForm);
        setCompletedSteps((prev) => new Set([...prev, "tax"]));
      } else if (currentStep === "payment") {
        await api.post("/api/v1/onboarding/payment", paymentForm);
        setCompletedSteps((prev) => new Set([...prev, "payment"]));
      } else if (currentStep === "users") {
        if (userForm.name.trim() && userForm.email.trim()) {
          await api.post("/api/v1/onboarding/users", userForm);
        }
        setCompletedSteps((prev) => new Set([...prev, "users"]));
      }

      const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
      setCurrentStep(STEPS[nextIndex].id);
    } catch (error: any) {
      const msg = error.message || error.error || "Failed to save step configuration. Please try again.";
      setErrorMessage(msg);
      console.error("Step submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEPS[prevIndex].id);
  };

  const handleComplete = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await api.post("/api/v1/onboarding/complete");
      setCompletedSteps((prev) => new Set([...prev, "complete"]));
      setSuccessMessage("Onboarding complete! Redirecting to Dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (error: any) {
      const msg = error.message || error.error || "Failed to complete onboarding. Please try again.";
      setErrorMessage(msg);
      console.error("Completion error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-800 text-xs font-semibold mb-2">
            <span>🚀 Quick Setup Wizard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Welcome to Blue Ocean POS
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Complete the guided setup below to configure your store, tax rules, payment channels, and team.
          </p>
        </div>

        {/* Progress Stepper Bar */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-xs border border-slate-200">
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
            <UsersSetupStep
              form={userForm}
              roles={rolesList}
              onChange={(k, v) => setUserForm((prev) => ({ ...prev, [k]: v }))}
            />
          )}

          {currentStep === "complete" && <CompleteStep />}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStepIndex > 0 && currentStep !== "complete" ? (
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

            <div className="flex items-center gap-3">
              {currentStep === "users" && (
                <CustomButton
                  variant="ghost"
                  onClick={() => {
                    const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
                    setCurrentStep(STEPS[nextIndex].id);
                  }}
                  disabled={loading}
                >
                  Skip for now
                </CustomButton>
              )}

              {currentStep === "complete" ? (
                <CustomButton
                  onClick={handleComplete}
                  loading={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 shadow-md"
                >
                  <Play size={16} className="mr-2" />
                  Launch Dashboard
                </CustomButton>
              ) : (
                <CustomButton
                  onClick={handleNext}
                  loading={loading}
                  disabled={loading || (currentStep === "business-type" && !selectedBusinessType)}
                  className="px-6 py-2.5 font-semibold shadow-xs"
                >
                  {loading ? "Saving..." : currentStepIndex === STEPS.length - 2 ? "Finalize Setup" : "Save & Continue"}
                  <ArrowRight size={16} className="ml-2" />
                </CustomButton>
              )}
            </div>
          </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
function UsersSetupStep({
  form,
  roles,
  onChange,
}: {
  form: any;
  roles: Array<{ id: string; name: string }>;
  onChange: (key: string, val: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Add an initial staff member (optional)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Create an account for a store manager or cashier. You can also add more users later from the Settings menu.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CustomInput
          label="Full Name"
          placeholder="e.g., Store Cashier"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
        <CustomInput
          label="Work Email Address"
          type="email"
          placeholder="e.g., staff@blueocean.com"
          value={form.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
        <CustomInput
          label="Initial Password"
          type="password"
          placeholder="e.g., Password@123"
          value={form.password}
          onChange={(e) => onChange("password", e.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned Role</label>
          <select
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            value={form.roleId}
            onChange={(e) => onChange("roleId", e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Complete Step
// ─────────────────────────────────────────────────────────────────────────────
function CompleteStep() {
  return (
    <div className="text-center py-6">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
        <CheckCircle size={44} />
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Configuration Complete!</h2>
      <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
        Your business environment, branches, inventory ledger, tax rules, and POS channels have been provisioned successfully.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-left max-w-lg mx-auto">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Recommended Next Steps:</h3>
        <ul className="space-y-2.5 text-xs text-slate-600">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">1</span>
            <span>Import or add items to your <strong>Products Catalog</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">2</span>
            <span>Receive opening stock via <strong>Purchasing &amp; GRN</strong></span>
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">3</span>
            <span>Open register and start checkout from <strong>POS Counter</strong></span>
          </li>
        </ul>
      </div>
    </div>
  );
}