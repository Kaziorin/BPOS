"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth";
import { Mail, Lock } from "lucide-react";
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
    initialValues: { email: "", password: "", tenantSlug: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        await login(values.email, values.password, values.tenantSlug);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Login failed");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-ink-950 px-4">
      <div
        className="pointer-events-none absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-primary-700/20 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/20">
            <siteConfig.logoIcon size={24} />
          </div>
          <h1 className="text-xl font-semibold text-white">{siteConfig.name}</h1>
          <p className="text-sm text-ink-400">Sign in to your workspace</p>
        </div>

        <form
          onSubmit={formik.handleSubmit}
          className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/40"
        >
          <div className="space-y-4">
            <CustomInput
              label="Email"
              name="email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
              placeholder="you@company.com"
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
              label="Tenant Slug (Optional)"
              name="tenantSlug"
              type="text"
              value={formik.values.tenantSlug}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.tenantSlug ? formik.errors.tenantSlug : undefined}
              placeholder="demo-shop"
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <CustomButton type="submit" loading={formik.isSubmitting} fullWidth size="lg">
              {formik.isSubmitting ? "Signing in..." : "Sign in"}
            </CustomButton>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-ink-400">
          Demo login: admin@blueoceanspos.com / Admin@123 (Tenant: demo-shop)
        </p>
      </div>
    </div>
  );
}
