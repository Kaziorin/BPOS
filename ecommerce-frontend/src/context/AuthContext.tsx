"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { StorefrontAPI } from "@/lib/api";
import toast from "react-hot-toast";

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName?: string;
  branchId?: string;
  tenantId?: string;
}

interface AuthContextType {
  customer: CustomerUser | null;
  adminUser: AdminUser | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (ident: string, pass: string) => Promise<boolean>;
  loginAdmin: (email: string, pass: string) => Promise<boolean>;
  register: (data: { name: string; phone: string; email?: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Check customer session
      const savedCustomerToken = localStorage.getItem("customer_token");
      const savedCustomerUser = localStorage.getItem("customer_user");
      if (savedCustomerToken && savedCustomerUser) {
        setToken(savedCustomerToken);
        setCustomer(JSON.parse(savedCustomerUser));
      }

      // Check admin session (from POS or Ecommerce Admin login)
      const savedAdminToken = localStorage.getItem("modernpos_token");
      const savedAdminUser = localStorage.getItem("modernpos_user");
      if (savedAdminToken && savedAdminUser) {
        setAdminUser(JSON.parse(savedAdminUser));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (ident: string, pass: string) => {
    // 1. If it looks like an admin email, also try POS admin auth
    if (ident.includes("@")) {
      try {
        const adminOk = await loginAdmin(ident, pass, true);
        if (adminOk) return true;
      } catch {
        // Fallback to customer login
      }
    }

    // 2. Customer login
    try {
      const res = await StorefrontAPI.login(ident, pass);
      if (res.token && res.customer) {
        setToken(res.token);
        setCustomer(res.customer);
        localStorage.setItem("customer_token", res.token);
        localStorage.setItem("customer_user", JSON.stringify(res.customer));
        toast.success(`Welcome back, ${res.customer.name}!`);
        return true;
      }
      return false;
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Invalid credentials");
      return false;
    }
  };

  const loginAdmin = async (email: string, pass: string, silentError = false) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/storefront\/?$/, "") || "http://127.0.0.1:4000";
      const res = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password: pass,
      });

      if (res.data?.token && res.data?.user) {
        const userObj: AdminUser = {
          id: res.data.user.id,
          name: res.data.user.name || res.data.user.email,
          email: res.data.user.email,
          role: res.data.user.roleName || res.data.user.role || "ADMIN",
          branchId: res.data.user.branchId,
          tenantId: res.data.user.tenantId,
        };
        setAdminUser(userObj);
        localStorage.setItem("modernpos_token", res.data.token);
        localStorage.setItem("modernpos_user", JSON.stringify(userObj));
        toast.success(`Welcome Admin / Owner: ${userObj.name}! Setup mode unlocked.`);
        return true;
      }
      return false;
    } catch (e: any) {
      if (!silentError) {
        toast.error(e.response?.data?.detail || e.response?.data?.error || "Admin login failed");
      }
      return false;
    }
  };

  const register = async (data: { name: string; phone: string; email?: string; password: string }) => {
    try {
      const res = await StorefrontAPI.register(data);
      if (res.token && res.customer) {
        setToken(res.token);
        setCustomer(res.customer);
        localStorage.setItem("customer_token", res.token);
        localStorage.setItem("customer_user", JSON.stringify(res.customer));
        toast.success("Account created successfully!");
        return true;
      }
      return false;
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Registration failed");
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    setAdminUser(null);
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    localStorage.removeItem("modernpos_token");
    localStorage.removeItem("modernpos_user");
    toast.success("Logged out successfully");
  };

  const isAdmin = Boolean(
    adminUser &&
      (adminUser.role === "SUPER_ADMIN" ||
        adminUser.role === "ADMIN" ||
        adminUser.role === "OWNER" ||
        adminUser.role === "MANAGER" ||
        adminUser.role?.toLowerCase().includes("admin") ||
        adminUser.role?.toLowerCase().includes("owner"))
  );

  return (
    <AuthContext.Provider
      value={{
        customer,
        adminUser,
        token,
        isAdmin,
        isLoading,
        login,
        loginAdmin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
