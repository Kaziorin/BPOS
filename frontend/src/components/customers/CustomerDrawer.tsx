"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  X, Loader2, Phone, Mail, MapPin, DollarSign, ShoppingBag, 
  Award, MessageSquare, Plus, Clock, ExternalLink, Edit3, 
  CheckCircle2, ChevronRight, AlertCircle 
} from "lucide-react";
import { api } from "@/lib/api";

interface CustomerDrawerProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: any) => void;
  onCollectDue: (customer: any) => void;
}

export function CustomerDrawer({ customerId, isOpen, onClose, onEdit, onCollectDue }: CustomerDrawerProps) {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "notes">("overview");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (customerId && isOpen) {
      loadCustomerDetail();
    }
  }, [customerId, isOpen]);

  async function loadCustomerDetail() {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/v1/customers/${customerId}`);
      setCustomer(res.data);
    } catch (err) {
      console.error("Failed to load customer details:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim() || !customerId) return;
    setAddingNote(true);
    try {
      await api.post(`/v1/customers/${customerId}/notes`, { note: newNote.trim() });
      setNewNote("");
      await loadCustomerDetail();
    } catch (err: any) {
      alert(err.message || "Failed to add note");
    } finally {
      setAddingNote(false);
    }
  }

  if (!isOpen) return null;

  const segBadgeClass: Record<string, string> = {
    VIP: "bg-amber-50 text-amber-700 border-amber-200/60",
    HIGH_VALUE: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    WHOLESALE: "bg-primary-50 text-primary-700 border-primary-200/60",
    CORPORATE: "bg-purple-50 text-purple-700 border-purple-200/60",
    NEW: "bg-sky-50 text-sky-700 border-sky-200/60",
    REGULAR: "bg-gray-50 text-gray-700 border-gray-200",
    AT_RISK: "bg-rose-50 text-rose-700 border-rose-200/60",
    INACTIVE: "bg-gray-100 text-gray-500 border-gray-200",
  };

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  const due = Number(customer?.currentDue || 0);

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
                <span className="text-xs text-gray-500 font-medium">Loading details...</span>
              </div>
            ) : customer ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 border border-primary-200 text-base font-bold">
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-900 truncate">{customer.name}</h2>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-semibold ${segBadgeClass[customer.segmentation || "REGULAR"] || segBadgeClass.REGULAR}`}>
                        {customer.segmentation || "REGULAR"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {customer.group?.name || "General"} &bull; ID: #{customer.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                {/* Quick Action Chips */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Phone size={12} /> {customer.phone}
                    </a>
                  )}
                  {customer.phone && (
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[11px] font-medium hover:bg-emerald-100"
                    >
                      WhatsApp
                    </a>
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-300 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Mail size={12} /> Email
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 py-2">Customer not found.</p>
            )}
          </div>

          {/* Key Metric Strip */}
          {customer && (
            <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50/50 border-b border-gray-200">
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-gray-400">Current Due</p>
                <p className={`text-sm font-bold mt-0.5 ${due > 0 ? "text-rose-600" : "text-gray-900"}`}>
                  ৳{due.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-gray-400">Total Orders</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {customer.purchaseHistory?.totalOrders || 0}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-gray-400">Loyalty</p>
                <p className="text-sm font-bold text-amber-600 mt-0.5">
                  {customer.loyaltyPoints || 0} pts
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 bg-white px-5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 py-2.5 px-3 text-xs font-medium transition ${
                activeTab === "overview" ? "border-primary-600 text-primary-700 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`border-b-2 py-2.5 px-3 text-xs font-medium transition flex items-center gap-1 ${
                activeTab === "sales" ? "border-primary-600 text-primary-700 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Recent Orders
              {customer?.recentSales?.length > 0 && (
                <span className="rounded bg-gray-100 px-1 text-[10px] font-bold text-gray-600">
                  {customer.recentSales.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`border-b-2 py-2.5 px-3 text-xs font-medium transition flex items-center gap-1 ${
                activeTab === "notes" ? "border-primary-600 text-primary-700 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Activity & Notes
              {customer?.customerNotes?.length > 0 && (
                <span className="rounded bg-primary-50 px-1 text-[10px] font-bold text-primary-700">
                  {customer.customerNotes.length}
                </span>
              )}
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5">
            {customer && (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* Contact details */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-2.5 text-xs">
                      <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Contact & Address</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>
                          <p className="text-[10px] text-gray-400">Phone</p>
                          <p className="font-medium text-gray-800">{customer.phone || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Email</p>
                          <p className="font-medium text-gray-800 truncate">{customer.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">City</p>
                          <p className="font-medium text-gray-800">{customer.city || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">BIN / Tax ID</p>
                          <p className="font-medium text-gray-800">{customer.taxRegNo || "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-400">Address</p>
                          <p className="font-medium text-gray-800">{customer.address || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Terms */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-2.5 text-xs">
                      <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Credit Terms</h4>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>
                          <p className="text-[10px] text-gray-400">Credit Limit</p>
                          <p className="font-medium text-gray-800">৳{Number(customer.creditLimit || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Credit Period</p>
                          <p className="font-medium text-gray-800">{customer.creditPeriodDays ? `${customer.creditPeriodDays} Days` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Total Spent</p>
                          <p className="font-medium text-gray-800">৳{Number(customer.purchaseHistory?.totalSpent || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Status</p>
                          <p className={`font-medium ${customer.status === "ACTIVE" ? "text-emerald-600" : "text-gray-500"}`}>
                            {customer.status || "ACTIVE"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {customer.notes && (
                      <div className="rounded-xl border border-gray-200 bg-white p-3.5 text-xs">
                        <h4 className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">Notes</h4>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sales" && (
                  <div className="space-y-2.5">
                    {customer.recentSales && customer.recentSales.length > 0 ? (
                      customer.recentSales.map((sale: any) => (
                        <div
                          key={sale.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 text-xs hover:border-gray-300 transition"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{sale.invoiceNo}</p>
                            <p className="text-[11px] text-gray-400">
                              {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">৳{Number(sale.total).toLocaleString()}</p>
                            <span className="text-[10px] text-emerald-700 font-medium">
                              {sale.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-gray-400 text-xs">
                        No recent sales found.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Add interaction note or reminder..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-primary-500 focus:outline-none"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={addingNote || !newNote.trim()}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                        >
                          {addingNote ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                          Save Note
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2 pt-1">
                      {customer.customerNotes && customer.customerNotes.length > 0 ? (
                        customer.customerNotes.map((note: any) => (
                          <div key={note.id} className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs space-y-1">
                            <p className="text-gray-800 leading-relaxed">{note.note}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1 pt-0.5">
                              <Clock size={10} />
                              {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Just now"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-xs text-gray-400">No activity notes recorded.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Bottom Actions */}
          {customer && (
            <div className="border-t border-gray-200 bg-gray-50/50 p-3.5 flex items-center justify-between gap-2">
              <Link
                href={`/customers/${customer.id}`}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
              >
                Full CRM Page <ChevronRight size={13} />
              </Link>

              <div className="flex items-center gap-2">
                {due > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onCollectDue(customer);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                  >
                    <DollarSign size={13} /> Collect Due
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onEdit(customer);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <Edit3 size={13} /> Edit
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
