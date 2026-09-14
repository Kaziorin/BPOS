"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth";
import { Mail, Lock, Monitor, ShoppingBag, CreditCard, Barcode, Receipt } from "lucide-react";
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-300/80 px-4 py-8 sm:py-12">
      {/* ── Soft Mid-Deep Slate Canvas Backdrop ── */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#cbd5e1_0%,#94a3b8_100%)] opacity-45"
        aria-hidden
      />

      {/* ── Soft Ambient Top Lighting Orbs ── */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[550px] w-[650px] rounded-full bg-gradient-to-b from-[#14B8A6]/18 via-teal-200/20 to-transparent blur-[130px]"
        aria-hidden
      />

      {/* ── Subtle Geometric Grid Pattern Overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"
        aria-hidden
      />

      {/* ── Stationary Blinking POS Icons (Position Fixed, Smooth Pulse Blink) ── */}
      {/* Top-Left Stationary Blinking Icon */}
      <div
        className="pointer-events-none absolute top-8 left-8 sm:top-14 sm:left-14 lg:top-16 lg:left-24 z-10 hidden sm:flex text-[#14B8A6] drop-shadow-md animate-[icon-blink_3s_ease-in-out_infinite]"
        aria-hidden
      >
        <Monitor size={42} />
      </div>

      {/* Top-Right Stationary Blinking Icon */}
      <div
        className="pointer-events-none absolute top-8 right-8 sm:top-14 sm:right-14 lg:top-16 lg:right-24 z-10 hidden sm:flex text-[#14B8A6] drop-shadow-md animate-[icon-blink_3.5s_ease-in-out_infinite] [animation-delay:0.7s]"
        aria-hidden
      >
        <ShoppingBag size={42} />
      </div>

      {/* Bottom-Left Stationary Blinking Icon */}
      <div
        className="pointer-events-none absolute bottom-8 left-8 sm:bottom-14 sm:left-14 lg:bottom-16 lg:left-24 z-10 hidden sm:flex text-[#14B8A6] drop-shadow-md animate-[icon-blink_3.2s_ease-in-out_infinite] [animation-delay:1.4s]"
        aria-hidden
      >
        <CreditCard size={42} />
      </div>

      {/* Bottom-Right Stationary Blinking Icon */}
      <div
        className="pointer-events-none absolute bottom-8 right-8 sm:bottom-14 sm:right-14 lg:bottom-16 lg:right-24 z-10 hidden sm:flex text-[#14B8A6] drop-shadow-md animate-[icon-blink_3.8s_ease-in-out_infinite] [animation-delay:2.1s]"
        aria-hidden
      >
        <Barcode size={42} />
      </div>

      {/* Mid-Left Stationary Blinking Icon */}
      <div
        className="pointer-events-none absolute top-1/2 left-6 sm:left-10 lg:left-16 -translate-y-1/2 z-10 hidden md:flex text-[#14B8A6] drop-shadow-md animate-[icon-blink_3.4s_ease-in-out_infinite] [animation-delay:1.0s]"
        aria-hidden
      >
        <Receipt size={38} />
      </div>

      {/* ── Main Responsive Login Card ── */}
      <div className="relative w-full max-w-sm sm:max-w-md">
        <form
          onSubmit={formik.handleSubmit}
          className="relative rounded-2xl border border-slate-300/90 bg-white p-6 sm:p-9 shadow-xl shadow-slate-400/35 space-y-5 transition-all"
        >
          {/* Centered Brand Header & Sign In Title */}
          <div className="flex flex-col items-center text-center pb-4 sm:pb-5 border-b border-slate-100">
            <div className="flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#14B8A6] text-white shadow-md shadow-[#14B8A6]/30 ring-4 ring-[#14B8A6]/10 mb-3">
              <siteConfig.logoIcon size={28} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
              {siteConfig.name}
            </h1>
            <h2 className="mt-1.5 text-xs sm:text-sm font-semibold text-[#64748B]">Sign In</h2>
          </div>

          <div className="space-y-4">
            <CustomInput
              label="Email"
              name="email"
              type="email"
              darkMode={false}
              rounded="md"
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
              darkMode={false}
              rounded="md"
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
              className="mt-2 text-xs font-bold uppercase tracking-wider rounded-md bg-[#14B8A6] hover:bg-[#0EA5A0] text-white shadow-md shadow-[#14B8A6]/25 border-0"
            >
              {formik.isSubmitting ? "Authenticating..." : "Sign In"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
