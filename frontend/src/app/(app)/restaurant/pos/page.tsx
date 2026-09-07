"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, Monitor, UtensilsCrossed, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomButton } from "@/components/custom/CustomButton";
import { PaymentPanel } from "../../pos/PaymentPanel";
import { ReceiptModal } from "../../pos/ReceiptModal";
import { RestaurantCartPanel, type KOTItem } from "./RestaurantCartPanel";
import type { CartItem, SaleResult, PaymentLine } from "../../pos/pos-types";

interface Table {
  id: string;
  tableNo: string;
  name: string;
  capacity: number;
  status: string;
  currentOrderNo?: string;
  floor?: { id: string; name: string };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQty?: number;
  category?: string;
}

export default function RestaurantPosPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");

  // Cart State
  const [newItems, setNewItems] = useState<CartItem[]>([]);
  const [sentItems, setSentItems] = useState<KOTItem[]>([]);
  const [discountTotal, setDiscountTotal] = useState(0);

  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment UI
  const [payments, setPayments] = useState<PaymentLine[]>([{ method: "CASH", amount: 0 }]);
  const [result, setResult] = useState<SaleResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // For demo, we just fetch tables and a few products
      const [tablesRes, productsRes] = await Promise.all([
        api.get<{ data: Table[] }>("/v1/restaurant/tables"),
        api.get<{ data: Product[] }>("/products").catch(() => ({ data: [] })),
      ]);
      setTables(tablesRes.data || []);
      
      const loadedProducts = productsRes.data || [];
      if (loadedProducts.length === 0) {
        // Fallback demo data if products API fails
        setProducts([
          { id: "p1", name: "Beef Burger", sku: "BB-01", sellingPrice: 450, category: "Fast Food" },
          { id: "p2", name: "Chicken Biryani", sku: "CB-01", sellingPrice: 320, category: "Main Course" },
          { id: "p3", name: "Cold Coffee", sku: "CC-01", sellingPrice: 180, category: "Beverages" },
          { id: "p4", name: "French Fries", sku: "FF-01", sellingPrice: 120, category: "Snacks" },
        ]);
      } else {
        setProducts(loadedProducts);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load restaurant data");
    } finally {
      setLoading(false);
    }
  };

  const loadTableKOTs = async (tableId: string) => {
    try {
      const res = await api.get<{ data: any[] }>(`/v1/restaurant/kot?tableId=${tableId}`);
      const kots = res.data || [];
      const loadedSentItems: KOTItem[] = [];
      kots.forEach(kot => {
        if (kot.status !== "CANCELLED" && kot.status !== "SERVED") {
          kot.items?.forEach((it: any) => {
            loadedSentItems.push({
              id: it.id,
              productId: it.productId,
              name: it.name,
              qty: parseFloat(it.qty),
              status: it.status,
              unitPrice: 0, // KOT items don't have price natively, we'll map it later if needed for display
            });
          });
        }
      });
      setSentItems(loadedSentItems);
    } catch (err) {
      console.error("Failed to load KOTs", err);
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setNewItems([]);
    setSentItems([]);
    if (table.status !== "AVAILABLE" && table.status !== "CLEANING") {
      loadTableKOTs(table.id);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const handleAddProduct = (prod: Product) => {
    if (!selectedTable) {
      alert("Please select a table first!");
      return;
    }
    setNewItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === prod.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].qty += 1;
        copy[idx].lineTotal = copy[idx].qty * copy[idx].unitPrice - copy[idx].discountAmount;
        return copy;
      }
      return [
        {
          productId: prod.id,
          name: prod.name,
          qty: 1,
          unitPrice: prod.sellingPrice,
          discountAmount: 0,
          lineTotal: prod.sellingPrice,
        },
        ...prev,
      ];
    });
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable || newItems.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        branchId: "branch-main", // Hardcoded for demo, normally from context
        tableId: selectedTable.id,
        orderType: "DINE_IN",
        station: "KITCHEN",
        items: newItems.map(it => ({
          productId: it.productId,
          name: it.name,
          qty: it.qty,
        })),
      };
      await api.post("/v1/restaurant/kot", payload);
      alert("Sent to kitchen successfully!");
      setNewItems([]);
      // Refresh table status & KOTs
      await loadData();
      handleTableSelect(selectedTable);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedTable) return;
    
    // In a real POS we'd merge sentItems + newItems to calculate total bill.
    // For this demo, let's just assume we bill what's in newItems for simplicity, 
    // or map sentItems back to CartItems if they have prices.
    // Since KOT items lack prices in the raw endpoint, we'll mock it by falling back to newItems logic.
    
    // Simulate payment panel by auto-setting total
    const total = newItems.reduce((acc, it) => acc + it.lineTotal, 0);
    if (total === 0) {
      alert("Nothing to bill (Sent items billing requires full product mapping).");
      return;
    }
    
    setPayments([{ method: "CASH", amount: total }]);
    
    setSubmitting(true);
    try {
      const res = await api.post<{ data: SaleResult }>("/v1/pos/confirm", {
        items: newItems,
        payments: [{ method: "CASH", amount: total }],
      });
      
      // Free the table
      await api.patch(`/v1/restaurant/tables/${selectedTable.id}/status`, { status: "AVAILABLE" });
      
      setResult(res.data);
      setNewItems([]);
      setSentItems([]);
      setSelectedTable(null);
      loadData();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case "AVAILABLE": return "bg-emerald-100 border-emerald-300 text-emerald-800";
      case "OCCUPIED": return "bg-blue-100 border-blue-300 text-blue-800";
      case "ORDERING": return "bg-amber-100 border-amber-300 text-amber-800";
      case "PREPARING": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  if (loading && tables.length === 0) {
    return <div className="flex h-screen items-center justify-center">Loading Restaurant POS...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between bg-indigo-900 px-4 text-white shadow">
        <div className="flex items-center gap-2 font-bold text-lg">
          <UtensilsCrossed size={20} />
          BPOS Restaurant Terminal
        </div>
        <div className="flex items-center gap-4 text-sm">
          {selectedTable ? (
            <span className="bg-indigo-800 px-3 py-1 rounded-full font-semibold">
              Serving: {selectedTable.name}
            </span>
          ) : (
            <span className="text-indigo-200">Please select a table</span>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Table List */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-2">Tables</h2>
          {tables.map(t => (
            <button
              key={t.id}
              onClick={() => handleTableSelect(t)}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedTable?.id === t.id ? "ring-2 ring-indigo-500 shadow-md scale-105" : "hover:bg-gray-50"
              } ${getTableColor(t.status)}`}
            >
              <div className="font-bold text-lg">{t.tableNo}</div>
              <div className="text-xs opacity-80 mt-1 font-medium">{t.status}</div>
            </button>
          ))}
        </div>

        {/* Middle: Products Grid */}
        <div className="flex-1 flex flex-col bg-slate-50 p-4">
          <div className="mb-4">
            <CustomInput
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
              className="bg-white"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pb-20">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleAddProduct(p)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white p-4 shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all active:scale-95"
              >
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <UtensilsCrossed size={24} />
                </div>
                <div className="text-center w-full">
                  <div className="font-bold text-gray-800 truncate text-sm">{p.name}</div>
                  <div className="text-xs font-semibold text-emerald-600 mt-1">৳{p.sellingPrice.toFixed(2)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cart & Actions */}
        <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Monitor size={18} className="text-indigo-500" />
              Order Ticket
            </h2>
            {selectedTable && (
              <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                {selectedTable.tableNo}
              </span>
            )}
          </div>

          <div className="flex-1 p-3 overflow-hidden flex flex-col">
            <RestaurantCartPanel
              newItems={newItems}
              sentItems={sentItems}
              onQtyChange={(idx, qty) => {
                if (qty <= 0) {
                  setNewItems(prev => prev.filter((_, i) => i !== idx));
                } else {
                  setNewItems(prev => {
                    const copy = [...prev];
                    copy[idx].qty = qty;
                    copy[idx].lineTotal = qty * copy[idx].unitPrice - copy[idx].discountAmount;
                    return copy;
                  });
                }
              }}
              onRemove={(idx) => setNewItems(prev => prev.filter((_, i) => i !== idx))}
              onDiscountChange={(idx, d) => setNewItems(prev => {
                const copy = [...prev];
                copy[idx].discountAmount = d;
                copy[idx].lineTotal = copy[idx].qty * copy[idx].unitPrice - d;
                return copy;
              })}
              onPriceOverride={(idx, p) => setNewItems(prev => {
                const copy = [...prev];
                copy[idx].unitPrice = p;
                copy[idx].lineTotal = copy[idx].qty * p - copy[idx].discountAmount;
                return copy;
              })}
            />
          </div>

          {/* Totals & Actions */}
          <div className="p-4 bg-slate-50 border-t border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium text-sm">New Items Total</span>
              <span className="text-2xl font-black text-gray-900">
                ৳{newItems.reduce((a, b) => a + b.lineTotal, 0).toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <CustomButton
                variant="outline"
                className="h-12 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                onClick={handleSendToKitchen}
                disabled={submitting || newItems.length === 0 || !selectedTable}
              >
                Send KOT
              </CustomButton>
              <CustomButton
                variant="primary"
                className="h-12 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleCheckout}
                disabled={submitting || (newItems.length === 0 && sentItems.length === 0) || !selectedTable}
              >
                Checkout
              </CustomButton>
            </div>
          </div>
        </div>
      </div>

      {result && (
        <ReceiptModal
          result={result}
          onClose={() => setResult(null)}
          onNewSale={() => setResult(null)}
        />
      )}
    </div>
  );
}
