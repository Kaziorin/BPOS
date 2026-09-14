"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth";
import { Mail, Lock, Eye, EyeOff, Store } from "lucide-react";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";

const loginSchema = Yup.object({
  email: Yup.string().email("Enter a valid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const currentYear = new Date().getFullYear();

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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#738496] via-[#8fa3b5] to-[#687a8b] px-4 py-8">
      {/* ── Center White Radial Spotlight Glow ── */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,transparent_60%)]"
        aria-hidden
      />

      {/* ── Left Constellation & Sine Wave Graphics ── */}
      <svg
        className="pointer-events-none absolute left-0 top-0 h-full w-1/2 opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="rgba(255,255,255,0.7)">
          <line x1="8%" y1="20%" x2="18%" y2="35%" />
          <line x1="18%" y1="35%" x2="12%" y2="55%" />
          <line x1="12%" y1="55%" x2="22%" y2="72%" />
          <line x1="22%" y1="72%" x2="8%" y2="85%" />
          <line x1="18%" y1="35%" x2="28%" y2="25%" />
          <line x1="12%" y1="55%" x2="4%" y2="40%" />

          <circle cx="8%" cy="20%" r="3.5" />
          <circle cx="18%" cy="35%" r="4.5" />
          <circle cx="12%" cy="55%" r="5" />
          <circle cx="22%" cy="72%" r="4" />
          <circle cx="8%" cy="85%" r="3" />
          <circle cx="28%" cy="25%" r="3" />
          <circle cx="4%" cy="40%" r="3" />
        </g>

        <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2">
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d={`M -50 ${280 + i * 14} C 120 ${220 + i * 12}, 240 ${380 - i * 10}, 450 ${
                300 + i * 8
              }`}
            />
          ))}
        </g>
      </svg>

      {/* ── Right Constellation & Sine Wave Graphics ── */}
      <svg
        className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <g stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="rgba(255,255,255,0.7)">
          <line x1="90%" y1="18%" x2="78%" y2="32%" />
          <line x1="78%" y1="32%" x2="85%" y2="52%" />
          <line x1="85%" y1="52%" x2="72%" y2="68%" />
          <line x1="72%" y1="68%" x2="88%" y2="82%" />
          <line x1="78%" y1="32%" x2="68%" y2="22%" />

          <circle cx="90%" cy="18%" r="4" />
          <circle cx="78%" cy="32%" r="5" />
          <circle cx="85%" cy="52%" r="4" />
          <circle cx="72%" cy="68%" r="5.5" />
          <circle cx="88%" cy="82%" r="3.5" />
          <circle cx="68%" cy="22%" r="3" />
        </g>

        <g fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.2">
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d={`M 550 ${240 + i * 14} C 380 ${320 - i * 10}, 220 ${180 + i * 12}, -50 ${
                310 + i * 8
              }`}
            />
          ))}
        </g>
      </svg>

      {/* ── Main Login Container ── */}
      <div className="relative z-10 flex flex-col items-center max-w-[420px] w-full">
        <form
          onSubmit={formik.handleSubmit}
          className="relative w-full rounded-lg border border-white/80 bg-white/92 backdrop-blur-2xl pt-7 sm:pt-8 px-7 sm:px-8 pb-4 sm:pb-5 shadow-[0_25px_60px_rgba(0,0,0,0.18)] space-y-4 transition-all"
        >
          {/* Brand Logo & Header */}
          <div className="flex flex-col items-center text-center pb-1">
            <div className="flex h-13 w-13 items-center justify-center rounded-md bg-[#00c9b7]/15 text-[#12a597] shadow-inner mb-2.5">
              <Store size={26} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-700">Blue Oceans POS</h1>
            <h2 className="mt-1 text-xs font-semibold text-gray-600">Sign In</h2>
          </div>

          <div className="space-y-3.5">
            <CustomInput
              label="Email or Username"
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
              type={showPassword ? "text" : "password"}
              darkMode={false}
              rounded="md"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password ? formik.errors.password : undefined}
              placeholder="••••••••"
              leftIcon={<Lock size={15} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="flex items-center justify-center h-full p-1 text-gray-400 hover:text-slate-600 transition focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#14a397] accent-[#14a397] focus:ring-[#14a397] cursor-pointer shadow-2xs"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="text-xs font-medium text-[#12a597] hover:underline"
              >
                Forgot password?
              </button>
            </div>

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
              className="mt-1 text-sm font-semibold rounded-md bg-gradient-to-r from-[#14a397] via-[#1bb5a9] to-[#25c4b8] hover:opacity-95 text-white shadow-md shadow-[#14a397]/25 border-0 py-3"
            >
              {formik.isSubmitting ? "Authenticating..." : "Sign In"}
            </CustomButton>
          </div>

          {/* Copyright text inside card with compact bottom padding & slightly larger text */}
          <div className="pt-2 mt-1.5 border-t border-slate-100/90 text-center">
            <p className="text-xs font-semibold text-gray-600 tracking-wide">
              © Blue Oceans {currentYear}. All rights reserved. Support
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
