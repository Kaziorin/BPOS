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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-radial from-slate-900 via-ink-950 to-black px-4 py-12">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary-500/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[140px]"
        aria-hidden
      />

      <div className="relative w-full max-w-xl">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-400 text-white shadow-xl shadow-primary-500/25 ring-4 ring-white/10 mb-3">
            <siteConfig.logoIcon size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Create New Business Account</h1>
          <p className="mt-1 text-xs text-ink-300 font-medium tracking-wide uppercase">
            Start your isolated store on Blue Ocean POS
          </p>
        </div>

        {/* Register Card */}
        <form
          onSubmit={formik.handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-7 sm:p-8 shadow-2xl shadow-black/60 space-y-5"
        >
          <div>
            <h2 className="text-base font-bold text-gray-900">Step 1: Choose Your Business Type</h2>
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
                  className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/80 text-teal-900 shadow-2xs font-bold ring-2 ring-teal-200"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={18} className={isSelected ? "text-teal-600 mb-1" : "text-slate-400 mb-1"} />
                  <span className="text-[11px] leading-tight">{bt.name}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h2 className="text-base font-bold text-gray-900 mb-3">Step 2: Store & Owner Information</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <CustomInput
                label="Store / Business Name *"
                name="businessName"
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
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone ? formik.errors.phone : undefined}
                placeholder="e.g., +8801700000000"
                leftIcon={<Phone size={15} />}
              />
            </div>

            <div className="mt-3.5">
              <CustomInput
                label="Account Password *"
                name="password"
                type="password"
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
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          <CustomButton type="submit" loading={formik.isSubmitting} fullWidth size="lg" className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
            {formik.isSubmitting ? "Setting up your store..." : "Create Store & Launch POS"}
            <ArrowRight size={16} className="ml-2" />
          </CustomButton>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Already have an account? </span>
            <Link href="/login" className="text-xs font-bold text-teal-600 hover:underline">
              Sign In to Terminal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
