"use client";

import React, { useState, useMemo } from "react";
import { UserPlus, Users, Search, Phone, User, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { CustomModal, CustomButton, CustomInput, CustomTabs } from "@/components/custom";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tier?: string;
}

interface WholesaleCustomerModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onAddCustomer: (customer: any) => void;
  onSelectCustomer: (customerId: string) => void;
  darkMode?: boolean;
}

export function WholesaleCustomerModal({
  open,
  onClose,
  customers,
  onAddCustomer,
  onSelectCustomer,
  darkMode = false,
}: WholesaleCustomerModalProps) {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newCust = {
      id: `CUST-${Date.now().toString().slice(-6)}`,
      ...formData,
      tier: "Standard",
    };
    onAddCustomer(newCust);
    setFormData({ name: "", phone: "", email: "", address: "" });
    setActiveTab("view");
  };

  const tabs = [
    { id: "view", label: "View Customers", icon: <Users size={15} /> },
    { id: "add", label: "Add Customer", icon: <UserPlus size={15} /> },
  ];

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Customer Management"
      size="2xl"
      darkMode={darkMode}
    >
      <div className="flex flex-col gap-5">
        {/* Modern Tab Switcher */}
        <div className={cn(
          "p-1.5 rounded-2xl transition-colors",
          darkMode ? "bg-slate-800/80" : "bg-slate-100"
        )}>
          <div className="grid grid-cols-2 gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                    isActive
                      ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                      : darkMode
                        ? "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                        : "text-slate-600 hover:bg-white hover:text-primary-600"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "view" ? (
          <div className="flex flex-col gap-4">
            <CustomInput
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={18} />}
              darkMode={darkMode}
              className="!h-11 !rounded-xl"
            />

            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
              {filteredCustomers.length === 0 ? (
                <div className={cn(
                  "py-16 text-center rounded-2xl border border-dashed transition-colors",
                  darkMode ? "bg-slate-900/40 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                )}>
                  <Users size={40} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-wider">No customers found</p>
                </div>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectCustomer(c.id);
                      onClose();
                    }}
                    className={cn(
                      "group flex w-full items-center justify-between p-3.5 rounded-2xl border transition-all text-left",
                      darkMode
                        ? "bg-slate-800 border-slate-700 hover:border-primary-500/50 hover:bg-slate-700/40"
                        : "bg-white border-slate-100 hover:border-primary-200 hover:shadow-md hover:shadow-primary-500/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm transition-colors",
                        darkMode ? "bg-slate-900 text-primary-400" : "bg-primary-50 text-primary-600"
                      )}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className={cn("text-[14px] font-bold", darkMode ? "text-slate-100" : "text-slate-900")}>
                          {c.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                            <Phone size={11} /> {c.phone}
                          </span>
                          {c.tier && (
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                              darkMode ? "bg-primary-500/10 text-primary-400" : "bg-primary-50 text-primary-600"
                            )}>
                              {c.tier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity",
                      darkMode ? "bg-primary-500/20 text-primary-300" : "bg-primary-600 text-white"
                    )}>
                      Select
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAdd} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Customer Name"
                placeholder="e.g. Acme Corp"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon={<User size={16} />}
                darkMode={darkMode}
              />
              <CustomInput
                label="Mobile Number"
                placeholder="01xxx-xxxxxx"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                leftIcon={<Phone size={16} />}
                darkMode={darkMode}
              />
              <CustomInput
                label="Email Address"
                placeholder="customer@example.com"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail size={16} />}
                darkMode={darkMode}
              />
              <CustomInput
                label="Full Address"
                placeholder="City, State, Zip"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                leftIcon={<MapPin size={16} />}
                darkMode={darkMode}
              />
            </div>

            <div className={cn(
              "flex items-center justify-end gap-3 pt-5 border-t",
              darkMode ? "border-slate-800" : "border-slate-100"
            )}>
              <CustomButton
                variant="ghost"
                onClick={onClose}
                darkMode={darkMode}
                className="!rounded-xl px-6 font-bold"
              >
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                themeColor="primary"
                darkMode={darkMode}
                className="!rounded-xl px-8 !h-11 shadow-lg shadow-primary-600/20 font-black uppercase tracking-wide"
              >
                Register & Select
              </CustomButton>
            </div>
          </form>
        )}
      </div>
    </CustomModal>
  );
}
