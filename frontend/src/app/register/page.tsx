"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import Link from "next/link";
import { useAuth, ApiError } from "@/lib/auth";
import {
  Mail,
  Lock,
  Building,
  User,
  Phone,
  ArrowRight,
  ShoppingBag,
  Utensils,
  Pill,
  ShoppingCart,
  Truck,
  Factory,
  Sparkles,
  Wrench,
  Building2,
} from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { siteConfig } from "@/config/site";

const BUSINESS_TYPES = [
  { id: "RETAIL", name: "Retail & Apparel", icon: ShoppingBag },
  { id: "RESTAURANT", name: "Restaurant & Cafe", icon: Utensils },
  { id: "PHARMACY", name: "Pharmacy & Medicine", icon: Pill },
  { id: "GROCERY", name: "Grocery & Supermarket", icon: ShoppingCart },
  { id: "WHOLESALE", name: "Wholesale & Distribution", icon: Truck },
  { id: "MANUFACTURING", name: "Manufacturing & Bakery", icon: Factory },
  { id: "SALON", name: "Salon & Spa", icon: Sparkles },
  { id: "REPAIR", name: "Repair & Service", icon: Wrench },
  { id: "FRANCHISE", name: "Franchise Store", icon: Building2 },
];

const registerSchema = Yup.object({
  businessName: Yup.string().required("Business name is required"),
  businessType: Yup.string().required("Please select a business type"),
  name: Yup.string().required("Owner name is required"),
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  phone: Yup.string().optional(),
});

export default function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      businessName: "",
      businessType: "RETAIL",
      name: "",
      email: "",
      password: "",
      phone: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        await register(values);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#0369a1] to-[#0284c7] px-4 py-8">
      {/* ── Center White Radial Spotlight Glow ── */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.25)_0%,transparent_65%)]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-xl">
        {/* Brand header */}
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex h-13 w-13 items-center justify-center rounded-sm bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white shadow-md mb-2.5">
            <siteConfig.logoIcon size={26} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Create New Business Account</h1>
          <p className="mt-1 text-xs text-sky-100 font-medium tracking-wide uppercase">
            Start your isolated store on Blue Ocean POS
          </p>
        </div>

        {/* Register Card */}
        <form
          onSubmit={formik.handleSubmit}
          className="rounded-sm border border-sky-100/90 bg-white/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl space-y-4"
        >
          <div>
            <h2 className="text-sm font-bold text-gray-600">Step 1: Choose Your Business Type</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Configures tailored categories, units, and POS features automatically.
            </p>
          </div>

          {/* Business Type selector grid */}
          <div className="grid grid-cols-3 gap-2">
            {BUSINESS_TYPES.map((bt) => {
              const Icon = bt.icon;
              const isSelected = formik.values.businessType === bt.id;
              return (
                <button
                  key={bt.id}
                  type="button"
                  onClick={() => formik.setFieldValue("businessType", bt.id)}
                  className={`flex flex-col items-center p-2 rounded-sm border text-center transition cursor-pointer ${
                    isSelected
                      ? "border-[#0284C7] bg-sky-50 text-[#0369A1] shadow-2xs font-bold ring-1 ring-[#0284C7]"
                      : "border-sky-100 bg-white text-slate-600 hover:border-sky-300 hover:bg-sky-50/50"
                  }`}
                >
                  <Icon size={18} className={isSelected ? "text-[#0284C7] mb-1" : "text-slate-400 mb-1"} />
                  <span className="text-[11px] leading-tight">{bt.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-sky-100">
            <h2 className="text-sm font-bold text-gray-600 mb-2.5">Step 2: Store & Owner Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomInput
                label="Store / Business Name *"
                name="businessName"
                rounded="sm"
                value={formik.values.businessName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.businessName ? formik.errors.businessName : undefined}
                placeholder="e.g., Green Valley Grocery"
                leftIcon={<Building size={15} />}
              />

              <CustomInput
                label="Owner / Manager Name *"
                name="name"
                rounded="sm"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name ? formik.errors.name : undefined}
                placeholder="e.g., Rahim Ahmed"
                leftIcon={<User size={15} />}
              />

              <CustomInput
                label="Login Email Address *"
                name="email"
                type="email"
                rounded="sm"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email ? formik.errors.email : undefined}
                placeholder="owner@greenvalley.com"
                leftIcon={<Mail size={15} />}
              />

              <CustomInput
                label="Contact Phone"
                name="phone"
                rounded="sm"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone ? formik.errors.phone : undefined}
                placeholder="e.g., +8801700000000"
                leftIcon={<Phone size={15} />}
              />
            </div>

            <div className="mt-3">
              <CustomInput
                label="Account Password *"
                name="password"
                type="password"
                rounded="sm"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password ? formik.errors.password : undefined}
                placeholder="At least 6 characters"
                leftIcon={<Lock size={15} />}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-sm border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-600 font-medium text-center">
              {error}
            </div>
          )}

          <CustomButton
            type="submit"
            loading={formik.isSubmitting}
            fullWidth
            size="lg"
            variant="primary"
            className="font-bold rounded-sm py-2.5"
          >
            {formik.isSubmitting ? "Setting up your store..." : "Create Store & Launch POS"}
            <ArrowRight size={16} className="ml-2" />
          </CustomButton>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Already have an account? </span>
            <Link href="/login" className="text-xs font-bold text-[#0284C7] hover:underline">
              Sign In to Terminal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
