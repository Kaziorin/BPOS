"use client";

import React, { useState } from "react";
import { X, User, Lock, Mail, Phone, ShieldCheck, Sparkles, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: Props) {
  const { login, loginAdmin, register } = useAuth();
  const [tab, setTab] = useState<"customer" | "register" | "admin">("customer");

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      toast.error("Please enter your phone/email and password");
      return;
    }
    setLoading(true);
    const ok = await login(identifier, password);
    setLoading(false);
    if (ok) onClose();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your admin email and password");
      return;
    }
    setLoading(true);
    const ok = await loginAdmin(email, password);
    setLoading(false);
    if (ok) onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    const ok = await register({ name, phone, email, password });
    setLoading(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            {tab === "admin" ? "Staff & Owner Login" : tab === "register" ? "Create Account" : "Welcome Back"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            {tab === "admin"
              ? "Login with POS Super Admin or Owner account to configure store theme & builder"
              : "Sign in to track orders, save wishlist and enjoy fast checkout"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 px-6 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTab("customer")}
            className={`pb-3 transition-colors border-b-2 ${
              tab === "customer"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Customer Login
          </button>
          <button
            type="button"
            onClick={() => setTab("register")}
            className={`pb-3 transition-colors border-b-2 ${
              tab === "register"
                ? "border-sky-600 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setTab("admin")}
            className={`pb-3 transition-colors border-b-2 flex items-center gap-1 ${
              tab === "admin"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-slate-500 hover:text-amber-600"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Owner / Admin</span>
          </button>
        </div>

        {/* Customer Login Form */}
        {tab === "customer" && (
          <form onSubmit={handleCustomerLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 01700000000 or customer@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              <LogIn className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Owner / Admin Login Form */}
        {tab === "admin" && (
          <form onSubmit={handleAdminLogin} className="p-6 space-y-4 bg-amber-50/40 dark:bg-zinc-950/40">
            <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Use your POS Admin credentials (e.g. admin@blueoceanspos.com) to access the Page Builder.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@blueoceanspos.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Verifying..." : "Login as Owner / Admin"}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Customer Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01700000000"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
                Create Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95 mt-2"
            >
              <span>{loading ? "Creating Account..." : "Create Free Account"}</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
