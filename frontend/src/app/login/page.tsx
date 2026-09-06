"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth";
import { Mail, Lock, ShieldCheck, ShoppingCart, UserCheck, Sparkles } from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { siteConfig } from "@/config/site";

const loginSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
  tenantSlug: Yup.string().optional(),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "", password: "", tenantSlug: "demo-shop" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        await login(values.email, values.password, values.tenantSlug);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Login failed. Please check credentials or backend connection.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  function fillDemo(email: string, pass: string, slug = "demo-shop") {
    formik.setFieldValue("email", email);
    formik.setFieldValue("password", pass);
    formik.setFieldValue("tenantSlug", slug);
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-radial from-slate-900 via-ink-950 to-black px-4 py-12">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary-500/15 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[140px]"
        aria-hidden
      />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-600 to-cyan-400 text-white shadow-xl shadow-primary-500/25 ring-4 ring-white/10 mb-3">
            <siteConfig.logoIcon size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{siteConfig.name}</h1>
          <p className="mt-1 text-xs text-ink-300 font-medium tracking-wide uppercase">
            Omnichannel POS & Business Operating System
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={formik.handleSubmit}
          className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-7 shadow-2xl shadow-black/60"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Sign in to Terminal</h2>
              <p className="text-xs text-gray-500">Enter your credentials or use a 1-click demo profile</p>
            </div>

            <CustomInput
              label="Email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
              placeholder="admin@blueoceanspos.com"
              leftIcon={<Mail size={15} />}
            />
            <CustomInput
              label="Password"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? formik.errors.password : undefined}
              placeholder="••••••••"
              leftIcon={<Lock size={15} />}
            />
            <CustomInput
              label="Tenant / Store Slug"
              name="tenantSlug"
              type="text"
              value={formik.values.tenantSlug}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.tenantSlug ? formik.errors.tenantSlug : undefined}
              placeholder="demo-shop"
            />

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <CustomButton type="submit" loading={formik.isSubmitting} fullWidth size="lg">
              {formik.isSubmitting ? "Authenticating..." : "Sign In to POS"}
            </CustomButton>
          </div>
        </form>

        {/* Quick 1-Click Demo Profiles */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 text-white">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-300 flex items-center gap-1">
              <Sparkles size={12} /> 1-Click Demo Credentials
            </span>
            <span className="text-[10px] text-ink-400">Click to fill</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo("admin@blueoceanspos.com", "Admin@123")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/5 text-center group"
            >
              <ShieldCheck size={16} className="text-cyan-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold">Super Admin</span>
              <span className="text-[10px] text-ink-300">Full ERP</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("manager@blueoceanspos.com", "Admin@123")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/5 text-center group"
            >
              <UserCheck size={16} className="text-emerald-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold">Manager</span>
              <span className="text-[10px] text-ink-300">Branch Ops</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo("cashier@blueoceanspos.com", "Admin@123")}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 hover:bg-white/20 transition border border-white/5 text-center group"
            >
              <ShoppingCart size={16} className="text-amber-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-semibold">Cashier</span>
              <span className="text-[10px] text-ink-300">Fast POS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

