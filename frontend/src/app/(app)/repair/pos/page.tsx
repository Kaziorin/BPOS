"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  Plus,
  Trash2,
  Receipt,
  Printer,
  ChevronLeft,
  Clock,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Cpu,
  Smartphone,
  HardDrive,
  User,
} from "lucide-react";
import { api } from "@/lib/api";

interface SparePart {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQty: number;
}

interface RepairLineItem {
  id: string;
  type: "PART" | "LABOR";
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  warrantyMonths: number;
  lineTotal: number;
}

export default function RepairPOSPage() {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [deviceModel, setDeviceModel] = useState("iPhone 13 Pro");
  const [imeiSerial, setImeiSerial] = useState("354892019284729");
  const [customerName, setCustomerName] = useState("Rahim Uddin");
  const [customerPhone, setCustomerPhone] = useState("01711223344");
  const [diagnosisProblem, setDiagnosisProblem] = useState("Cracked OLED Screen + Battery Degradation");
  const [technicianName, setTechnicianName] = useState("Tech Karim");
  const [cart, setCart] = useState<RepairLineItem[]>([
    {
      id: "init-labor",
      type: "LABOR",
      name: "Screen & Battery Replacement Labor Service",
      qty: 1,
      unitPrice: 800,
      warrantyMonths: 1,
      lineTotal: 800,
    },
  ]);
  const [searchFilter, setSearchFilter] = useState("");
  const [laborName, setLaborName] = useState("");
  const [laborPrice, setLaborPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedTicket, setCompletedTicket] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await api.get("/products", { params: { limit: 100 } });
      const pData = (res.data as any)?.data ?? res.data ?? [];
      setParts(
        Array.isArray(pData) && pData.length > 0
          ? pData.map((p: any) => ({
              id: p.id,
              name: p.name,
              sku: p.sku || "PART",
              sellingPrice: Number(p.sellingPrice || 1000),
              stockQty: 10,
            }))
          : [
              { id: "P1", name: "iPhone 13 Pro OLED Display Panel (OEM)", sku: "DISP-IP13P", sellingPrice: 9500, stockQty: 5 },
              { id: "P2", name: "Genuine Apple Battery 3095mAh", sku: "BATT-IP13", sellingPrice: 3200, stockQty: 8 },
              { id: "P3", name: "Charging Port Flex Ribbon", sku: "FLEX-CHG", sellingPrice: 1200, stockQty: 12 },
              { id: "P4", name: "Camera Glass Lens Replacement", sku: "CAM-LENS", sellingPrice: 600, stockQty: 20 },
              { id: "P5", name: "Motherboard Audio IC Chip", sku: "IC-AUDIO", sellingPrice: 2800, stockQty: 3 },
            ]
      );
    } catch (err) {
      console.error("Failed to load spare parts:", err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const addPartToTicket = (part: SparePart) => {
    setCart((prev) => [
      {
        id: `${part.id}-${Date.now()}`,
        type: "PART",
        productId: part.id,
        name: part.name,
        qty: 1,
        unitPrice: part.sellingPrice,
        warrantyMonths: 3,
        lineTotal: part.sellingPrice,
      },
      ...prev,
    ]);
  };

  const addCustomLabor = () => {
    if (!laborName.trim() || !laborPrice) return;
    const price = parseFloat(laborPrice) || 0;
    setCart((prev) => [
      ...prev,
      {
        id: `labor-${Date.now()}`,
        type: "LABOR",
        name: laborName,
        qty: 1,
        unitPrice: price,
        warrantyMonths: 1,
        lineTotal: price,
      },
    ]);
    setLaborName("");
    setLaborPrice("");
  };

  const removeLine = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const partsSubtotal = cart.filter((i) => i.type === "PART").reduce((acc, i) => acc + i.lineTotal, 0);
  const laborSubtotal = cart.filter((i) => i.type === "LABOR").reduce((acc, i) => acc + i.lineTotal, 0);
  const grandTotal = partsSubtotal + laborSubtotal;

  const handleCheckoutTicket = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.productId,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        notes: `Type: ${i.type} · Warranty: ${i.warrantyMonths} months · Device: ${deviceModel} (${imeiSerial})`,
      }));

      const res = await api.post("/sales", {
        customerName,
        customerPhone,
        paymentMethod: "CASH",
        items: itemsPayload,
        subTotal: grandTotal,
        grandTotal,
        notes: `Repair Service Ticket · Model: ${deviceModel} · IMEI: ${imeiSerial} · Tech: ${technicianName} · Diagnosis: ${diagnosisProblem}`,
      });

      const invData = res.data?.data || res.data || { invoiceNo: `REP-${Date.now().toString().slice(-6)}` };
      setCompletedTicket({
        ...invData,
        deviceModel,
        imeiSerial,
        customerName,
        customerPhone,
        diagnosisProblem,
        technicianName,
        items: cart,
        partsSubtotal,
        laborSubtotal,
        grandTotal,
        date: new Date().toISOString(),
      });
      setCart([]);
    } catch (err) {
      setCompletedTicket({
        invoiceNo: `REP-${Date.now().toString().slice(-6)}`,
        deviceModel,
        imeiSerial,
        customerName,
        customerPhone,
        diagnosisProblem,
        technicianName,
        items: cart,
        partsSubtotal,
        laborSubtotal,
        grandTotal,
        date: new Date().toISOString(),
      });
      setCart([]);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParts = parts.filter((p) => {
    const q = searchFilter.toLowerCase().trim();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="h-screen w-screen flex flex-col gap-3 p-3 sm:p-4 bg-slate-950 text-slate-100 select-none overflow-hidden">
      
      {/* Top Repair Header */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-3 bg-slate-900 rounded-2xl p-3 sm:px-4 border border-cyan-900/60 shadow-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/repair"
            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                <Wrench size={16} className="text-cyan-400" /> Device Repair & Service Intake POS
              </h1>
              <span className="rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.2 text-[10px] font-bold uppercase">
                Diagnostic Bench
              </span>
            </div>
          </div>
        </div>

        {/* Technician Tag */}
        <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <User size={14} className="text-cyan-400" />
          <span className="text-slate-400">Assigned Tech:</span>
          <span className="font-bold text-white">{technicianName}</span>
        </div>
      </div>

      {/* Main Workspace: Left Spare Parts & Labor + Right Job Ticket Card */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        
        {/* Left 7 Columns: Spare Parts Catalog & Labor Service Adder */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          
          {/* Custom Labor Service Inline Adder */}
          <div className="flex-none p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Cpu size={13} /> Add Labor:
            </span>
            <input
              type="text"
              placeholder="e.g. IC Reballing, Water Wash..."
              value={laborName}
              onChange={(e) => setLaborName(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="৳ Fee"
              value={laborPrice}
              onChange={(e) => setLaborPrice(e.target.value)}
              className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white text-right focus:border-cyan-500 focus:outline-none"
            />
            <button
              onClick={addCustomLabor}
              className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1 font-bold text-slate-950 text-xs"
            >
              + Add
            </button>
          </div>

          {/* Spare Parts Search */}
          <div className="flex-none p-3 border-b border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search Spare Parts inventory by Model, SKU or Part Name..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Parts List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
            {filteredParts.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 transition flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-xs truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    SKU: {p.sku} · Available Stock: <strong className="text-emerald-400">{p.stockQty} pcs</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-cyan-400">{fmt(p.sellingPrice)}</span>
                  <button
                    onClick={() => addPartToTicket(p)}
                    className="rounded-xl bg-cyan-600/30 border border-cyan-500/40 hover:bg-cyan-600 px-3 py-1.5 text-xs font-black text-cyan-300 hover:text-slate-950 transition"
                  >
                    + Add Part
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Columns: Device Diagnostic Intake Card & Slip */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
          <div className="flex-none p-3.5 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">Repair Job Ticket</h2>
              <span className="text-[10px] text-slate-400">Parts + Labor Breakdown</span>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[11px] font-bold text-rose-400">
                Clear
              </button>
            )}
          </div>

          {/* Device Intake Details */}
          <div className="flex-none p-3 bg-slate-950/70 border-b border-slate-800 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Device Model..."
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="IMEI / Serial #..."
                value={imeiSerial}
                onChange={(e) => setImeiSerial(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone #..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Reported Problem & Diagnosis..."
              value={diagnosisProblem}
              onChange={(e) => setDiagnosisProblem(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Cart items */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Wrench size={36} className="mx-auto text-slate-600" />
                <p className="text-xs font-bold text-slate-400">No Parts or Labor Added</p>
                <p className="text-[11px]">Select replacement spare parts or add service labor.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="pt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className={`font-mono font-bold ${item.type === "PART" ? "text-cyan-300" : "text-amber-300"}`}>
                        [{item.type}]
                      </span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <ShieldCheck size={10} /> {item.warrantyMonths}m Warranty
                      </span>
                    </div>
                  </div>

                  <span className="font-black text-cyan-300 tabular-nums text-xs">{fmt(item.lineTotal)}</span>

                  <button onClick={() => removeLine(item.id)} className="text-slate-500 hover:text-rose-400 p-1">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals & Complete Repair */}
          <div className="flex-none p-3.5 bg-slate-950 border-t border-slate-800 space-y-2.5 text-xs">
            <div className="space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>Spare Parts Total:</span>
                <span className="text-slate-200 font-bold">{fmt(partsSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Labor Service Charge:</span>
                <span className="text-slate-200 font-bold">{fmt(laborSubtotal)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                <span className="text-xs uppercase font-bold text-cyan-400">Total Repair Cost</span>
                <span className="text-2xl font-black text-cyan-400 tabular-nums">{fmt(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutTicket}
              disabled={cart.length === 0 || submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-600/30 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> Complete & Print Warranty Slip ({fmt(grandTotal)})
            </button>
          </div>
        </div>
      </div>

      {/* REPAIR TICKET / WARRANTY SLIP MODAL */}
      {completedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4">
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded-full">
                Device Repair & Warranty Certificate
              </span>
              <h3 className="text-lg font-black uppercase mt-1">Service Claim Slip</h3>
              <p className="text-xs font-mono text-slate-600">Ticket #: {completedTicket.invoiceNo}</p>
              <p className="text-[10px] text-slate-400">{new Date(completedTicket.date).toLocaleString()}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Device Model:</span>
                <span className="font-bold text-slate-900">{completedTicket.deviceModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">IMEI / Serial:</span>
                <span className="font-mono font-bold text-cyan-800">{completedTicket.imeiSerial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-800">
                  {completedTicket.customerName} ({completedTicket.customerPhone})
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto text-xs">
              {(completedTicket.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="block text-[10px] text-emerald-700">
                      [{item.type}] · {item.warrantyMonths} Months Warranty
                    </span>
                  </div>
                  <span className="font-black tabular-nums">{fmt(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-xs space-y-1">
              <div className="flex justify-between font-black text-base text-cyan-900 pt-1">
                <span>Total Amount Paid:</span>
                <span>{fmt(completedTicket.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Printer size={14} /> Print Job Card
              </button>
              <button
                onClick={() => setCompletedTicket(null)}
                className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-700"
              >
                Next Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
