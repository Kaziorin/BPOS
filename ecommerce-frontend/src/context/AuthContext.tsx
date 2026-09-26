"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { StorefrontAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface AuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isLoading: boolean;
  login: (ident: string, pass: string) => Promise<boolean>;
  register: (data: { name: string; phone: string; email?: string; password: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("customer_token");
      const savedUser = localStorage.getItem("customer_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setCustomer(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (ident: string, pass: string) => {
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
    localStorage.removeItem("customer_token");
    localStorage.removeItem("customer_user");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ customer, token, isLoading, login, register, logout }}>
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
