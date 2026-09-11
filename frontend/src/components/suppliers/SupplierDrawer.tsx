"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  X, Loader2, Phone, Mail, MapPin, DollarSign, ShoppingCart, 
  Award, MessageSquare, Clock, ExternalLink, Edit3, 
  CheckCircle2, ChevronRight, AlertCircle, Truck, Building2, Package, ShieldCheck
} from "lucide-react";
import { api } from "@/lib/api";

interface SupplierDrawerProps {
  supplierId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (supplier: any) => void;
  onPayDue: (supplier: any) => void;
}

export function SupplierDrawer({ supplierId, isOpen, onClose, onEdit, onPayDue }: SupplierDrawerProps) {
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "purchases" | "performance" | "notes">("overview");

  useEffect(() => {
    if (supplierId && isOpen) {
      loadSupplierDetail();
    }
  }, [supplierId, isOpen]);

  async function loadSupplierDetail() {
    if (!supplierId) return;
    setLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/v1/suppliers/${supplierId}`);
      setSupplier(res.data);
    } catch (err) {
      console.error("Failed to load supplier details:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const due = Number(supplier?.currentDue || 0);
  const totalPurchased = Number(supplier?.purchaseHistory?.totalPurchased || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-100">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-150">
          
          {/* Drawer Top Header */}
          <div className="border-b border-gray-200 bg-gray-50/80 p-5 relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>

            {loading ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 size={18} className="animate-spin text-primary-600" />
                <span className="text-xs text-gray-500 font-medium">Loading supplier details...</span>
              </div>
            ) : supplier ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200 text-base font-bold">
                    {getInitials(supplier.name)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900 truncate">{supplier.name}</h2>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        supplier.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full mr-1 ${supplier.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {supplier.status || "ACTIVE"}
                      </span>
                    </div>
                    {supplier.company && (
                      <p className="text-[11px] font-medium text-gray-600 mt-0.5 flex items-center gap-1">
                        <Building2 size={11} className="text-gray-400" /> {supplier.company}
                      </p>
                    )}
                    {supplier.city && (
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} /> {supplier.city}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {supplier.phone && (
                    <a
                      href={`tel:${supplier.phone}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Phone size={12} className="text-primary-600" />
                      Call
                    </a>
                  )}

                  {supplier.phone && (
                    <a
                      href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      <MessageSquare size={12} />
                      WhatsApp
                    </a>
                  )}

                  {supplier.email && (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Mail size={12} className="text-primary-600" />
                      Email
                    </a>
                  )}

                  {due > 0 && (
                    <button
                      onClick={() => onPayDue(supplier)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 transition"
                    >
                      <DollarSign size={12} />
                      Pay Due
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(supplier)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Edit3 size={12} />
                    Edit
                  </button>

                  <Link
                    href={`/suppliers/${supplier.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-primary-600 transition ml-auto"
                  >
                    <span>Full Page</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Key Metrics Bar */}
          {supplier && (
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-200 bg-white text-center py-3">
              <div className="px-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Payable Due</span>
                <p className={`text-sm font-bold mt-0.5 ${due > 0 ? "text-rose-600" : "text-gray-800"}`}>
                  ৳{due.toLocaleString()}
                </p>
              </div>
              <div className="px-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Purchases</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  ৳{totalPurchased.toLocaleString()}
                </p>
              </div>
              <div className="px-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total POs</span>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {supplier.purchaseHistory?.totalOrders || supplier._count?.purchaseOrders || 0}
                </p>
              </div>
            </div>
          )}

          {/* Drawer Navigation Tabs */}
          <div className="flex border-b border-gray-200 px-5 bg-white">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === "overview"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("purchases")}
              className={`border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === "purchases"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Recent POs ({supplier?.recentPOs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === "performance"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`border-b-2 px-3 py-2.5 text-xs font-semibold transition ${
                activeTab === "notes"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              Notes
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-400">Loading details...</div>
            ) : !supplier ? (
              <div className="py-12 text-center text-xs text-gray-400">No supplier found</div>
            ) : activeTab === "overview" ? (
              <div className="space-y-4">
                {/* Contact & Company Details Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Contact & Address</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Contact Person</span>
                      <span className="font-semibold text-gray-800">{supplier.contactPerson || "—"}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Phone</span>
                      <span className="font-semibold text-gray-800">{supplier.phone || "—"}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Email</span>
                      <span className="font-semibold text-gray-800 truncate block">{supplier.email || "—"}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">VAT / Tax Reg</span>
                      <span className="font-semibold text-gray-800">{supplier.vatRegNo || "—"}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[11px] text-gray-400 block font-medium">Full Address</span>
                      <span className="font-semibold text-gray-800">{supplier.address || "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Financial & Terms Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Financial & Terms</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Credit Limit</span>
                      <span className="font-semibold text-gray-800">৳{Number(supplier.creditLimit || 0).toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Payment Terms</span>
                      <span className="font-semibold text-gray-800">{supplier.paymentTermsDays ? `${supplier.paymentTermsDays} days` : "Net 30"}</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Trade Rebate</span>
                      <span className="font-semibold text-gray-800">{supplier.rebatePercent || 0}%</span>
                    </div>

                    <div>
                      <span className="text-[11px] text-gray-400 block font-medium">Supplied Products</span>
                      <span className="font-semibold text-gray-800">{supplier._count?.products || 0} items</span>
                    </div>
                  </div>
                </div>

                {/* Quick Due Settle Banner */}
                {due > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-800">Pending Payable Due</p>
                      <p className="text-[11px] text-rose-600 mt-0.5">Clear outstanding vendor invoices</p>
                    </div>
                    <button
                      onClick={() => onPayDue(supplier)}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-2xs transition"
                    >
                      Pay ৳{due.toLocaleString()}
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === "purchases" ? (
              <div className="space-y-3">
                {supplier.recentPOs && supplier.recentPOs.length > 0 ? (
                  supplier.recentPOs.map((po: any) => (
                    <div
                      key={po.id}
                      className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs hover:border-gray-300 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-gray-900">{po.poNo || `PO-${po.id.slice(0, 8)}`}</span>
                          <span className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            po.status === "COMPLETED" || po.status === "RECEIVED" ? "bg-emerald-50 text-emerald-700" :
                            po.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {po.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-900">৳{Number(po.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No purchase orders recorded yet.
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href={`/purchasing/orders?supplierId=${supplier.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    View All Purchasing Orders <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            ) : activeTab === "performance" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-primary-600" />
                    Supplier Scorecard
                  </h3>

                  <div className="space-y-3 pt-1">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-600">On-Time Delivery Score</span>
                        <span className="text-primary-600">{supplier.deliveryPerformanceScore || 95}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${supplier.deliveryPerformanceScore || 95}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-600">Product Quality Rating</span>
                        <span className="text-emerald-600">{supplier.qualityScore || 98}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${supplier.qualityScore || 98}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-gray-600">Defect Rate</span>
                        <span className="text-gray-700">{supplier.defectRate || 1.2}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (supplier.defectRate || 1.2) * 10)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Supplier Notes</h3>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {supplier.notes || "No notes entered for this supplier."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50/80 p-4 flex items-center justify-between">
            <button
              onClick={() => onEdit(supplier)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <Edit3 size={13} />
              Edit Supplier
            </button>

            <Link
              href={`/suppliers/${supplier?.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition"
            >
              Full Profile & Ledger &rarr;
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
