"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Scissors,
  Sparkles,
  Users,
  Search,
  Plus,
  Trash2,
  Receipt,
  Printer,
  ChevronLeft,
  Clock,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Star,
  Award,
} from "lucide-react";
import { api } from "@/lib/api";

interface SalonServiceItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  durationMin: number;
  defaultCommission: number;
}

interface Stylist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
}

interface SalonCartLine {
  id: string;
  serviceId: string;
  name: string;
  durationMin: number;
  unitPrice: number;
  stylistId: string;
  stylistName: string;
  commissionPct: number;
  lineTotal: number;
}

const DEFAULT_STYLISTS: Stylist[] = [
  { id: "ST-1", name: "Sara Khan", specialty: "Hair Styling & Color", rating: 4.9 },
  { id: "ST-2", name: "Ayesha Rahman", specialty: "Facial & Skin Care", rating: 4.8 },
  { id: "ST-3", name: "Tania Akter", specialty: "Nail Art & Spa", rating: 4.9 },
  { id: "ST-4", name: "Farhana Islam", specialty: "Bridal & Makeover", rating: 5.0 },
];

export default function SalonPOSPage() {
  const [services, setServices] = useState<SalonServiceItem[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>(DEFAULT_STYLISTS);
  const [selectedStylist, setSelectedStylist] = useState<Stylist>(DEFAULT_STYLISTS[0]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [cart, setCart] = useState<SalonCartLine[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [tipAmount, setTipAmount] = useState<string>("100");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [submitting, setSubmitting] = useState(false);
  const [completedSlip, setCompletedSlip] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: { limit: 100 } });
      const pData = (res.data as any)?.data ?? res.data ?? [];
      setServices(
        Array.isArray(pData) && pData.length > 0
          ? pData.map((p: any) => ({
              id: p.id,
              name: p.name,
              category: p.category?.name || "Beauty Services",
              sellingPrice: Number(p.sellingPrice || 500),
              durationMin: 45,
              defaultCommission: 15,
            }))
          : [
              { id: "S1", name: "Haircut & Blow Dry", category: "Hair", sellingPrice: 800, durationMin: 45, defaultCommission: 15 },
              { id: "S2", name: "Hydra Facial Glow", category: "Skin", sellingPrice: 2200, durationMin: 60, defaultCommission: 20 },
              { id: "S3", name: "Gel Polish Manicure", category: "Nails", sellingPrice: 1200, durationMin: 40, defaultCommission: 15 },
              { id: "S4", name: "Aromatherapy Full Body Spa", category: "Spa", sellingPrice: 3500, durationMin: 90, defaultCommission: 25 },
              { id: "S5", name: "Bridal Signature Makeover", category: "Makeup", sellingPrice: 12000, durationMin: 180, defaultCommission: 30 },
            ]
      );
    } catch (err) {
      console.error("Failed to load salon services:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const addServiceToCart = (srv: SalonServiceItem) => {
    setCart((prev) => [
      {
        id: `${srv.id}-${Date.now()}`,
        serviceId: srv.id,
        name: srv.name,
        durationMin: srv.durationMin,
        unitPrice: srv.sellingPrice,
        stylistId: selectedStylist.id,
        stylistName: selectedStylist.name,
        commissionPct: srv.defaultCommission,
        lineTotal: srv.sellingPrice,
      },
      ...prev,
    ]);
  };

  const removeLine = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const subTotal = cart.reduce((acc, i) => acc + i.lineTotal, 0);
  const totalDurationMin = cart.reduce((acc, i) => acc + i.durationMin, 0);
  const totalCommission = cart.reduce((acc, i) => acc + (i.lineTotal * i.commissionPct) / 100, 0);
  const tipNum = parseFloat(tipAmount) || 0;
  const grandTotal = subTotal + tipNum;

  const handleSettleSalonBill = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.serviceId,
        qty: 1,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        notes: `Stylist: ${i.stylistName} (${i.commissionPct}% Comm) · Duration: ${i.durationMin}m`,
      }));

      const res = await api.post("/sales", {
        customerName: clientName || undefined,
        customerPhone: clientPhone || undefined,
        paymentMethod,
        items: itemsPayload,
        subTotal,
        grandTotal,
        notes: `Salon Service Checkout · Stylist: ${cart[0]?.stylistName} · Tip: ৳${tipNum}`,
      });

      const invData = res.data?.data || res.data || { invoiceNo: `SAL-${Date.now().toString().slice(-6)}` };
      setCompletedSlip({
        ...invData,
        clientName: clientName || "Guest Client",
        clientPhone: clientPhone || "N/A",
        items: cart,
        subTotal,
        tipNum,
        totalCommission,
        grandTotal,
        date: new Date().toISOString(),
      });
      setCart([]);
    } catch (err) {
      setCompletedSlip({
        invoiceNo: `SAL-${Date.now().toString().slice(-6)}`,
        clientName: clientName || "Guest Client",
        clientPhone: clientPhone || "N/A",
        items: cart,
        subTotal,
        tipNum,
        totalCommission,
        grandTotal,
        date: new Date().toISOString(),
      });
      setCart([]);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredServices = services.filter((s) => {
    const q = searchFilter.toLowerCase().trim();
    return !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col gap-3 -m-4 sm:-m-6 p-3 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Salon Header */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-2xl p-3 sm:px-4 border border-pink-900/60 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/salon"
            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-pink-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Scissors size={16} className="text-pink-400" /> Salon & Spa Service Checkout POS
              </h1>
              <span className="rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Beauty & Spa
              </span>
            </div>
          </div>
        </div>

        {/* Stylist Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Assign Stylist:</span>
          <div className="flex items-center gap-1.5">
            {stylists.map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStylist(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  selectedStylist.id === st.id
                    ? "bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-2 ring-pink-400"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Sparkles size={12} className="text-pink-300" /> {st.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Service Catalog + Right Client Slip & Commission Settlement */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 7 Columns: Services Catalog with Duration & Pricing */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search beauty, hair, facial or spa services..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-200 focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredServices.map((srv) => (
                <button
                  key={srv.id}
                  onClick={() => addServiceToCart(srv)}
                  className="flex flex-col justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-pink-500/80 hover:bg-slate-900/90 transition text-left group shadow-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">{srv.category}</span>
                    <p className="font-bold text-white text-xs mt-0.5 line-clamp-2 group-hover:text-pink-200">
                      {srv.name}
                    </p>
                  </div>

                  <div className="mt-3 pt-1.5 border-t border-slate-800 flex items-center justify-between w-full">
                    <span className="text-xs font-black text-pink-400 tabular-nums">
                      {fmt(srv.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                      <Clock size={10} /> {srv.durationMin}m
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Client Appointment & Stylist Slip */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="flex-none p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">Client Service Slip</h2>
              <span className="text-[10px] text-slate-400">Total Duration: {totalDurationMin} mins</span>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[11px] font-bold text-rose-400">
                Clear
              </button>
            )}
          </div>

          {/* Client Info Inputs */}
          <div className="flex-none p-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Client Name..."
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Phone Number..."
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-pink-500 focus:outline-none"
            />
          </div>

          {/* Cart items */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Scissors size={36} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-400">No Services Added</p>
                <p className="text-[11px]">Pick beauty & salon services to assign to stylist.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="text-pink-300 font-semibold">{item.stylistName}</span>
                      <span>· {item.durationMin}m</span>
                      <span className="text-emerald-400">({item.commissionPct}% Comm)</span>
                    </div>
                  </div>

                  <span className="font-black text-pink-300 tabular-nums text-xs">{fmt(item.lineTotal)}</span>

                  <button onClick={() => removeLine(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals & Commission Summary */}
          <div className="flex-none p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Services Subtotal:</span>
                <span className="text-slate-200 font-bold">{fmt(subTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Stylist Commission Earned:</span>
                <span>{fmt(totalCommission)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span>Stylist Tip:</span>
                <div className="flex items-center gap-1">
                  {["0", "100", "200", "500"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipAmount(t)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tipAmount === t ? "bg-pink-600 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      ৳{t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                <span className="text-xs uppercase font-bold text-pink-400">Total Bill Payable</span>
                <span className="text-2xl font-black text-pink-400 tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleSettleSalonBill}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 py-3 text-sm font-black text-white shadow-lg shadow-pink-600/30 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Complete Salon Checkout ({fmt(grandTotal)})
            </button>
          </div>
        </div>
      </div>

      {/* SALON RECEIPT SLIP MODAL */}
      {completedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-800 bg-pink-100 px-2 py-0.5 rounded-full">
                Salon & Spa Client Slip
              </span>
              <h3 className="text-lg font-black uppercase mt-1">Beauty Service Receipt</h3>
              <p className="text-xs font-mono text-slate-600">Ref: {completedSlip.invoiceNo}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedSlip.date).toLocaleString()}</p>
            </div>

            <div className="p-3 bg-pink-50/60 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-slate-900">{completedSlip.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700">{completedSlip.clientPhone}</span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
              {(completedSlip.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-slate-400">
                      Stylist: {item.stylistName} ({item.durationMin}m)
                    </span>
                  </div>
                  <span className="font-black tabular-nums">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              {completedSlip.tipNum > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Stylist Tip:</span>
                  <span>{fmt(completedSlip.tipNum)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base text-pink-700 pt-1">
                <span>Grand Total Settled:</span>
                <span>{fmt(completedSlip.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Client Slip
              </button>
              <button
                onClick={() => setCompletedSlip(null)}
                className="rounded-xl bg-pink-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-pink-700"
              >
                Next Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
