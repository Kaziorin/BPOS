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
});

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError(null);
      try {
        await login(values.email, values.password);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Login failed. Please check credentials or backend connection."
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50/90 px-4 py-12">
      {/* Soft background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40"
        aria-hidden
      />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md">
        <form
          onSubmit={formik.handleSubmit}
          className="relative rounded-xl border border-slate-200 bg-white p-7 sm:p-8 shadow-xl shadow-slate-200/50 space-y-5 transition-all"
        >
          {/* Centered Brand Header & Sign In Title */}
          <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/20 mb-3">
              <siteConfig.logoIcon size={26} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-700">{siteConfig.name}</h1>
            <h2 className="mt-2 text-sm font-semibold text-slate-600">Sign In</h2>
          </div>

          <div className="space-y-4">
            <CustomInput
              label="Email"
              name="email"
              type="email"
              rounded="sm"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
              placeholder="user@example.com"
              leftIcon={<Mail size={15} />}
            />

            <CustomInput
              label="Password"
              name="password"
              type="password"
              rounded="sm"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? formik.errors.password : undefined}
              placeholder="••••••••"
              leftIcon={<Lock size={15} />}
            />

            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-600 text-center">
                {error}
              </div>
            )}

            <CustomButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={formik.isSubmitting}
              className="mt-2 text-xs font-bold uppercase tracking-wider rounded-md shadow-sm"
            >
              {formik.isSubmitting ? "Authenticating..." : "Sign In"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
