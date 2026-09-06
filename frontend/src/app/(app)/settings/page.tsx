"use client";

import { useState } from "react";
import { Settings, Building, Monitor, DollarSign, FileText, CreditCard, Package, Bell, Users, Shield, Plug, Brain, Crown } from "lucide-react";

const SETTINGS_TABS = [
  { id: "company", label: "Company", icon: Building },
  { id: "branch", label: "Branch", icon: Building },
  { id: "pos", label: "POS", icon: Monitor },
  { id: "tax", label: "Tax", icon: DollarSign },
  { id: "invoice", label: "Invoice", icon: FileText },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "ai", label: "AI", icon: Brain },
  { id: "subscription", label: "Subscription", icon: Crown },
] as const;

type SettingsTab = typeof SETTINGS_TABS[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure your Blue Ocean POS system</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6">
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "branch" && <BranchSettings />}
          {activeTab === "pos" && <POSSettings />}
          {activeTab === "tax" && <TaxSettings />}
          {activeTab === "invoice" && <InvoiceSettings />}
          {activeTab === "payment" && <PaymentSettings />}
          {activeTab === "inventory" && <InventorySettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "users" && <UserSettings />}
          {activeTab === "roles" && <RoleSettings />}
          {activeTab === "integrations" && <IntegrationSettings />}
          {activeTab === "ai" && <AISettings />}
          {activeTab === "subscription" && <SubscriptionSettings />}
        </div>
      </div>
    </div>
  );
}

function CompanySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Company Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter company name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter legal name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} placeholder="Enter address" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter phone" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter email" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">VAT Registration Number</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter VAT number" />
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function BranchSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Branch Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Branch</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option>Select branch</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="INV-" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Numbering</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="AUTO">Automatic</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function POSSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">POS Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Warehouse</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option>Select warehouse</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="priceOverride" className="rounded" />
          <label htmlFor="priceOverride" className="text-sm text-gray-700">Allow Price Override</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="requireCustomer" className="rounded" />
          <label htmlFor="requireCustomer" className="text-sm text-gray-700">Require Customer for Sale</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="printReceipt" className="rounded" defaultChecked />
          <label htmlFor="printReceipt" className="text-sm text-gray-700">Print Receipt Automatically</label>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function TaxSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Tax Settings (§10.21)</h2>
      <p className="text-sm text-gray-500">
        ⚠️ All production VAT/NBR workflows must be reviewed by a qualified Bangladesh VAT professional.
      </p>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Registration Number</label>
          <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Enter tax registration number" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Manage Tax Rates & Rules</p>
          <a href="/tax" className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">
            Open Tax Engine →
          </a>
        </div>
      </div>
    </div>
  );
}

function InvoiceSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Invoice Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Template</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="standard">Standard</option>
            <option value="thermal">Thermal</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="showBarcode" className="rounded" defaultChecked />
          <label htmlFor="showBarcode" className="text-sm text-gray-700">Show Barcode on Invoice</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="showCustomer" className="rounded" defaultChecked />
          <label htmlFor="showCustomer" className="text-sm text-gray-700">Show Customer Details</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} placeholder="Enter terms and conditions" />
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enabled Payment Methods</label>
          <div className="space-y-2">
            {["CASH", "CARD", "BANK", "MOBILE_BANKING", "CREDIT"].map((method) => (
              <div key={method} className="flex items-center gap-2">
                <input type="checkbox" id={method} className="rounded" defaultChecked />
                <label htmlFor={method} className="text-sm text-gray-700">{method.replace("_", " ")}</label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Method</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="MOBILE_BANKING">Mobile Banking</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="partialPayment" className="rounded" defaultChecked />
          <label htmlFor="partialPayment" className="text-sm text-gray-700">Allow Partial Payment</label>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function InventorySettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Inventory Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Costing Method</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="FIFO">FIFO (First In, First Out)</option>
            <option value="FEFO">FEFO (First Expired, First Out)</option>
            <option value="WEIGHTED_AVERAGE">Weighted Average</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="negativeStock" className="rounded" />
          <label htmlFor="negativeStock" className="text-sm text-gray-700">Allow Negative Stock</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
          <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="10" />
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function NotificationSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="emailEnabled" className="rounded" />
          <label htmlFor="emailEnabled" className="text-sm text-gray-700">Email Notifications</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="smsEnabled" className="rounded" />
          <label htmlFor="smsEnabled" className="text-sm text-gray-700">SMS Notifications</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="pushEnabled" className="rounded" defaultChecked />
          <label htmlFor="pushEnabled" className="text-sm text-gray-700">Push Notifications</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="lowStockAlert" className="rounded" defaultChecked />
          <label htmlFor="lowStockAlert" className="text-sm text-gray-700">Low Stock Alerts</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="expiryAlert" className="rounded" defaultChecked />
          <label htmlFor="expiryAlert" className="text-sm text-gray-700">Expiry Alerts</label>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function UserSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">User Settings</h2>
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="requireApproval" className="rounded" />
          <label htmlFor="requireApproval" className="text-sm text-gray-700">Require Approval for New Users</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password Policy</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
          <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="60" />
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function RoleSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Role Settings</h2>
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="customRoles" className="rounded" defaultChecked />
          <label htmlFor="customRoles" className="text-sm text-gray-700">Allow Custom Roles</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Role for New Users</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function IntegrationSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Integration Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Gateways</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select payment gateway</option>
            <option value="stripe">Stripe</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select SMS provider</option>
            <option value="twilio">Twilio</option>
            <option value="bulk">Bulk SMS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Provider</label>
          <select className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="">Select email provider</option>
            <option value="sendgrid">SendGrid</option>
            <option value="ses">AWS SES</option>
          </select>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function AISettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">AI Settings</h2>
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="aiEnabled" className="rounded" />
          <label htmlFor="aiEnabled" className="text-sm text-gray-700">Enable AI Features</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="demandForecasting" className="rounded" />
          <label htmlFor="demandForecasting" className="text-sm text-gray-700">Demand Forecasting</label>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="productRecommendations" className="rounded" />
          <label htmlFor="productRecommendations" className="text-sm text-gray-700">Product Recommendations</label>
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}

function SubscriptionSettings() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Subscription Settings</h2>
      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Plan</label>
          <select defaultValue="BUSINESS" className="w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="STARTER">Starter</option>
            <option value="BUSINESS">Business</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Users</label>
          <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue={10} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Branches</label>
          <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue={5} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max POS Terminals</label>
          <input type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2" defaultValue={20} />
        </div>
      </div>
      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
        Save Changes
      </button>
    </div>
  );
}