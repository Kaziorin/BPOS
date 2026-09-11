"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  X, Loader2, Phone, Mail, MapPin, DollarSign, ShoppingBag, 
  Award, MessageSquare, AlertCircle, Plus, Calendar, Clock, 
  ExternalLink, Edit, CheckCircle2, ChevronRight 
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
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "notes" | "complaints">("overview");
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
    VIP: "bg-amber-100 text-amber-800 border-amber-200",
    HIGH_VALUE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    WHOLESALE: "bg-blue-100 text-blue-800 border-blue-200",
    CORPORATE: "bg-purple-100 text-purple-800 border-purple-200",
    NEW: "bg-teal-100 text-teal-800 border-teal-200",
    REGULAR: "bg-slate-100 text-slate-700 border-slate-200",
    AT_RISK: "bg-rose-100 text-rose-800 border-rose-200",
    INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const getInitials = (name: string) => {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Drawer Header */}
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
            >
              <X size={20} />
            </button>

            {loading ? (
              <div className="flex items-center gap-4 py-4">
                <Loader2 size={24} className="animate-spin text-blue-400" />
                <span className="text-sm text-slate-300">Loading customer profile...</span>
              </div>
            ) : customer ? (
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 text-xl font-black text-white shadow-lg shadow-blue-500/30">
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-white truncate">{customer.name}</h2>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${segBadgeClass[customer.segmentation || "REGULAR"] || segBadgeClass.REGULAR}`}>
                        {customer.segmentation || "REGULAR"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                      <span>{customer.group?.name || "General Group"}</span>
                      <span>•</span>
                      <span>Customer #{customer.id.slice(0, 8)}</span>
                    </p>
                  </div>
                </div>

                {/* Quick Contact & Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {customer.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                    >
                      <Phone size={13} /> {customer.phone}
                    </a>
                  )}
                  {customer.phone && (
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-600/40 transition"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-300 py-4">Customer not found.</p>
            )}
          </div>

          {/* Balance & Stat Cards Banner */}
          {customer && (
            <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-200/80">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Due</p>
                <div className="flex items-baseline justify-between mt-1">
                  <p className={`text-base font-bold ${Number(customer.currentDue) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    ৳{Number(customer.currentDue || 0).toLocaleString()}
                  </p>
                </div>
                {Number(customer.currentDue) > 0 && (
                  <button
                    onClick={() => onCollectDue(customer)}
                    className="mt-2 w-full rounded-lg bg-red-600/10 hover:bg-red-600 text-red-700 hover:text-white text-[11px] font-bold py-1 transition text-center"
                  >
                    Collect Due
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-base font-bold text-slate-800 mt-1">
                  {customer.purchaseHistory?.totalOrders || customer._count?.sales || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Spent ৳{Number(customer.purchaseHistory?.totalSpent || 0).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loyalty Points</p>
                <p className="text-base font-bold text-amber-600 mt-1 flex items-center gap-1">
                  <Award size={16} /> {customer.loyaltyPoints || 0}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Credit Limit: ৳{Number(customer.creditLimit || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-white px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`border-b-2 py-3 px-3 text-xs font-bold transition ${
                activeTab === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview & Details
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`border-b-2 py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "sales" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Recent Orders
              {customer?.recentSales?.length > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                  {customer.recentSales.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`border-b-2 py-3 px-3 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "notes" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Activity & Notes
              {customer?.customerNotes?.length > 0 && (
                <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.2 text-[10px]">
                  {customer.customerNotes.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {customer && (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in duration-100">
                    {/* Information Grid */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact & Address</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400">Phone</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{customer.phone || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Email</p>
                          <p className="font-semibold text-slate-800 mt-0.5 truncate">{customer.email || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">City / Region</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{customer.city || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Tax / BIN No</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{customer.taxRegNo || "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-slate-400">Full Address</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{customer.address || "No address on file"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Terms & CRM Info */}
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Credit Terms & Classification</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400">Credit Limit</p>
                          <p className="font-semibold text-slate-800 mt-0.5">৳{Number(customer.creditLimit || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Credit Period</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{customer.creditPeriodDays ? `${customer.creditPeriodDays} Days` : "Immediate / None"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Opening Balance</p>
                          <p className="font-semibold text-slate-800 mt-0.5">৳{Number(customer.openingDue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Account Status</p>
                          <p className={`font-semibold mt-0.5 ${customer.status === "ACTIVE" ? "text-emerald-600" : "text-red-600"}`}>
                            {customer.status || "ACTIVE"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {customer.notes && (
                      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4">
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Profile Notes</h4>
                        <p className="text-xs text-amber-800 mt-1 whitespace-pre-wrap">{customer.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sales" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    {customer.recentSales && customer.recentSales.length > 0 ? (
                      <div className="space-y-2">
                        {customer.recentSales.map((sale: any) => (
                          <div
                            key={sale.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-blue-200 hover:shadow-sm transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <ShoppingBag size={16} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{sale.invoiceNo}</p>
                                <p className="text-[11px] text-slate-400">
                                  {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : "Recent"}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-900">৳{Number(sale.total).toLocaleString()}</p>
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                                sale.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                              }`}>
                                {sale.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs">No orders recorded for this customer yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4 animate-in fade-in duration-100">
                    {/* Add note input */}
                    <form onSubmit={handleAddNote} className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Log customer interaction, phone call, or promise..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={addingNote || !newNote.trim()}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          {addingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                          Add Note
                        </button>
                      </div>
                    </form>

                    {/* Notes timeline */}
                    {customer.customerNotes && customer.customerNotes.length > 0 ? (
                      <div className="space-y-2.5 pt-2">
                        {customer.customerNotes.map((note: any) => (
                          <div key={note.id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 space-y-1">
                            <p className="text-xs text-slate-800 leading-relaxed">{note.note}</p>
                            <p className="text-[10px] text-slate-400 pt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {note.createdAt ? new Date(note.createdAt).toLocaleString() : "Just now"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <MessageSquare size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs">No activity logs or CRM notes yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drawer Footer */}
          {customer && (
            <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex items-center justify-between gap-3">
              <Link
                href={`/customers/${customer.id}`}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Full CRM Page <ChevronRight size={14} />
              </Link>

              <div className="flex items-center gap-2">
                {Number(customer.currentDue) > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onCollectDue(customer);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <DollarSign size={14} /> Collect Payment
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onEdit(customer);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Edit size={14} /> Edit Customer
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
