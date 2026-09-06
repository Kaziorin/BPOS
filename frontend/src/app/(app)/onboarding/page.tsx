"use client";

import { useState } from "react";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, Building, MapPin, Warehouse, DollarSign, CreditCard, Users, Play } from "lucide-react";
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

type StepId = typeof STEPS[number]["id"];

const BUSINESS_TYPES = [
  { id: "RETAIL", name: "Retail", description: "General retail, clothing, electronics, etc." },
  { id: "RESTAURANT", name: "Restaurant", description: "Food service, cafes, QSR, cloud kitchen" },
  { id: "PHARMACY", name: "Pharmacy", description: "Medicine sales with batch/expiry tracking" },
  { id: "WHOLESALE", name: "Wholesale", description: "B2B distribution and wholesale" },
  { id: "GROCERY", name: "Grocery", description: "Super markets and grocery stores" },
  { id: "SALON", name: "Salon/Spa", description: "Beauty salon and spa services" },
  { id: "REPAIR", name: "Repair Service", description: "Electronics and device repair centers" },
  { id: "MANUFACTURING", name: "Manufacturing", description: "Light manufacturing and production" },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<StepId>("business-type");
  const [loading, setLoading] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("");
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleNext = async () => {
    setLoading(true);
    try {
      // Handle step-specific logic
      if (currentStep === "business-type" && selectedBusinessType) {
        await api.post("/api/v1/onboarding/business-type", { businessType: selectedBusinessType });
        setCompletedSteps((prev) => new Set([...prev, "business-type"]));
      }
      // Add more step handlers as needed
      
      const nextIndex = Math.min(currentStepIndex + 1, STEPS.length - 1);
      setCurrentStep(STEPS[nextIndex].id);
    } catch (error) {
      console.error("Step failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(STEPS[prevIndex].id);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.post("/api/v1/onboarding/complete");
      setCompletedSteps((prev) => new Set([...prev, "complete"]));
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Completion failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(step.id);
              const isCurrent = currentStep === step.id;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? "border-green-500 bg-green-500 text-white"
                          : isCurrent
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                    </div>
                    <span className="mt-2 text-xs font-medium text-gray-600">{step.title}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted || completedSteps.has(STEPS[index + 1].id)
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          {currentStep === "business-type" && (
            <BusinessTypeStep
              selected={selectedBusinessType}
              onSelect={setSelectedBusinessType}
            />
          )}
          {currentStep === "company" && <CompanySetupStep />}
          {currentStep === "branch" && <BranchSetupStep />}
          {currentStep === "warehouse" && <WarehouseSetupStep />}
          {currentStep === "tax" && <TaxSetupStep />}
          {currentStep === "payment" && <PaymentSetupStep />}
          {currentStep === "users" && <UsersSetupStep />}
          {currentStep === "complete" && <CompleteStep />}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {currentStepIndex > 0 && (
              <CustomButton
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </CustomButton>
            )}
            <div className="flex-1" />
            {currentStep === "complete" ? (
              <CustomButton onClick={handleComplete} loading={loading}>
                <Play size={16} className="mr-2" />
                Start Using Blue Ocean POS
              </CustomButton>
            ) : (
              <CustomButton
                onClick={handleNext}
                disabled={loading || (currentStep === "business-type" && !selectedBusinessType)}
              >
                {loading ? "Processing..." : "Next"}
                <ArrowRight size={16} className="ml-2" />
              </CustomButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessTypeStep({ selected, onSelect }: { selected: string; onSelect: (type: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What type of business do you have?</h2>
      <p className="text-gray-600 mb-6">Select your business type to configure Blue Ocean POS for your needs.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              selected === type.id
                ? "border-primary-500 bg-primary-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold text-gray-900">{type.name}</div>
            <div className="text-sm text-gray-600 mt-1">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompanySetupStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup your company</h2>
      <p className="text-gray-600 mb-6">Enter your company details to get started.</p>
      
      <div className="space-y-4">
        <CustomInput label="Company Name" placeholder="Enter company name" />
        <CustomInput label="Legal Name" placeholder="Enter legal name (optional)" />
        <CustomInput label="Phone" placeholder="Enter phone number" />
        <CustomInput label="Email" type="email" placeholder="Enter email address" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} placeholder="Enter address" />
        </div>
        <CustomInput label="VAT Registration Number" placeholder="Enter VAT number (optional)" />
      </div>
    </div>
  );
}

function BranchSetupStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup your first branch</h2>
      <p className="text-gray-600 mb-6">Create your primary business location.</p>
      
      <div className="space-y-4">
        <CustomInput label="Branch Code" placeholder="e.g., DHK-01" />
        <CustomInput label="Branch Name" placeholder="e.g., Dhanmondi Branch" />
        <CustomInput label="Phone" placeholder="Enter phone number" />
        <CustomInput label="Email" type="email" placeholder="Enter email address" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} placeholder="Enter address" />
        </div>
      </div>
    </div>
  );
}

function WarehouseSetupStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup your warehouse</h2>
      <p className="text-gray-600 mb-6">Create a warehouse to manage your inventory.</p>
      
      <div className="space-y-4">
        <CustomInput label="Warehouse Code" placeholder="e.g., WH-DHK-01" />
        <CustomInput label="Warehouse Name" placeholder="e.g., Dhanmondi Warehouse" />
        <CustomInput label="Type" placeholder="e.g., Central, Branch, Transit" />
      </div>
    </div>
  );
}

function TaxSetupStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure tax settings</h2>
      <p className="text-gray-600 mb-6">Set up your tax configuration for VAT and sales tax.</p>

      {/* §10.21 go-live disclaimer — shown during tenant onboarding (Prompt 43) */}
      <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-amber-800">
          <strong>Disclaimer:</strong> The VAT/tax engine is configurable and version-controlled
          (Bangladesh NBR workflows incl. Mushak forms where applicable), but tax rules are never
          hard-coded into core business logic. All production VAT/NBR workflows and Mushak forms
          must be reviewed against the currently applicable regulations by a qualified Bangladesh
          VAT professional before production deployment.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="taxEnabled" className="rounded" />
          <label htmlFor="taxEnabled" className="text-sm text-gray-700">Enable tax calculation</label>
        </div>
        <CustomInput label="VAT Rate (%)" type="number" placeholder="15" />
        <CustomInput label="Tax Registration Number" placeholder="Enter tax registration number" />
      </div>
    </div>
  );
}

function PaymentSetupStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure payment methods</h2>
      <p className="text-gray-600 mb-6">Select the payment methods you want to accept.</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Payment Methods</label>
          <div className="space-y-2">
            {["CASH", "CARD", "BANK", "MOBILE_BANKING", "CREDIT"].map((method) => (
              <div key={method} className="flex items-center gap-2">
                <input type="checkbox" id={method} className="rounded" defaultChecked />
                <label htmlFor={method} className="text-sm text-gray-700">{method.replace("_", " ")}</label>
              </div>
            ))}
          </div>
        </div>
        <CustomInput label="Default Payment Method" placeholder="CASH" />
      </div>
    </div>
  );
}

function UsersSetupStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create users</h2>
      <p className="text-gray-600 mb-6">Add users who will access the system (optional).</p>
      
      <div className="space-y-4">
        <CustomInput label="User Name" placeholder="Enter user name" />
        <CustomInput label="Email" type="email" placeholder="Enter email address" />
        <CustomInput label="Password" type="password" placeholder="Enter password" />
        <CustomInput label="Role" placeholder="Select role" />
      </div>
      
      <p className="text-sm text-gray-500 mt-4">You can add more users later from the Settings menu.</p>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
      <p className="text-gray-600 mb-6">
        Your Blue Ocean POS is now configured. Click the button below to start selling.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <h3 className="font-semibold text-gray-900 mb-2">What&apos;s next?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• Add products to your catalog</li>
          <li>• Set up opening stock</li>
          <li>• Create customer profiles</li>
          <li>• Start making sales from POS</li>
        </ul>
      </div>
    </div>
  );
}