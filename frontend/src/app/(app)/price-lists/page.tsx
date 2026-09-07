"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, DollarSign, Package, Eye, X, Tag, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { ConfirmModal, ModalType } from "@/components/custom/ConfirmModal";
import { SearchableSelect } from "@/components/custom/SearchableSelect";

interface PriceList {
  id: string;
  name: string;
  currency: string;
  isDefault: boolean;
  validFrom: string | null;
  validTo: string | null;
  status: string;
  _count: { items: number };
}

interface PriceListItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  defaultSellingPrice: number;
  price: number;
  minQty: number;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
}

export default function PriceListsPage() {
  const [lists, setLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCurrency, setNewCurrency] = useState("BDT");

  // Selected Price List Items Drawer
  const [activeList, setActiveList] = useState<PriceList | null>(null);
  const [listItems, setListItems] = useState<PriceListItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Available Products for adding to price list
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [minQty, setMinQty] = useState("1");
  const [addingItem, setAddingItem] = useState(false);

  // Modal alert / confirm state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: ModalType;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    message: "",
    type: "INFO",
  });

  function showAlert(message: string, type: ModalType = "WARNING", title?: string) {
    setModalState({
      isOpen: true,
      message,
      type,
      title,
      onConfirm: undefined,
    });
  }

  function showConfirm(message: string, onConfirm: () => void, title?: string, type: ModalType = "DANGER") {
    setModalState({
      isOpen: true,
      message,
      type,
      title,
      onConfirm: () => {
        setModalState((p) => ({ ...p, isOpen: false }));
        onConfirm();
      },
    });
  }

  useEffect(() => {
    loadLists();
    loadProducts();
  }, []);

  async function loadLists() {
    try {
      const result = await api.get<{ data: PriceList[] }>("/v1/price-lists");
      setLists(result.data || []);
    } catch (err: any) {
      console.error("Failed to load price lists:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const res = await api.get<{ data: any[] }>("/v1/products?limit=100");
      const items = (res as any)?.data || (res as any)?.items || res || [];
      if (Array.isArray(items)) {
        setProducts(
          items.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            sellingPrice: Number(p.sellingPrice || 0),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }

  async function createList() {
    if (!newName.trim()) {
      showAlert("Please enter a valid price list name.", "WARNING", "Validation Error");
      return;
    }
    try {
      await api.post("/v1/price-lists", { name: newName, currency: newCurrency });
      setShowCreate(false);
      setNewName("");
      setNewCurrency("BDT");
      await loadLists();
      showAlert("New Price List created successfully!", "SUCCESS", "Success");
    } catch (err: any) {
      showAlert(err.message || "Failed to create price list.", "DANGER", "Error");
    }
  }

  function confirmDelete(id: string, name: string) {
    showConfirm(
      `Are you sure you want to delete the price list "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await api.del(`/v1/price-lists/${id}`);
          if (activeList?.id === id) setActiveList(null);
          await loadLists();
          showAlert("Price list deleted successfully.", "SUCCESS", "Deleted");
        } catch (err: any) {
          showAlert(err.message || "Delete failed.", "DANGER", "Error");
        }
      },
      "Delete Price List",
      "DANGER"
    );
  }

  async function openListItems(pl: PriceList) {
    setActiveList(pl);
    setLoadingItems(true);
    try {
      const res = await api.get<{ data: PriceListItem[] }>(`/v1/price-lists/${pl.id}/items`);
      setListItems(res.data || []);
    } catch (err: any) {
      showAlert("Failed to load price list items.", "DANGER");
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleAddItem() {
    if (!activeList || !selectedProductId || !customPrice) {
      showAlert("Please select a product and enter custom price.", "WARNING");
      return;
    }
    setAddingItem(true);
    try {
      await api.post(`/v1/price-lists/${activeList.id}/items`, {
        productId: selectedProductId,
        price: Number(customPrice),
        minQty: Number(minQty || 1),
      });
      setSelectedProductId("");
      setCustomPrice("");
      setMinQty("1");
      await openListItems(activeList);
      await loadLists();
      showAlert("Product price updated in price list!", "SUCCESS");
    } catch (err: any) {
      showAlert(err.message || "Failed to add product price.", "DANGER");
    } finally {
      setAddingItem(false);
    }
  }

  const productOptions = products.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.sku}) — Standard ৳${p.sellingPrice}`,
  }));

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Custom Reusable Warning/Confirmation Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((p) => ({ ...p, isOpen: false }))}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      {/* Reusable Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title="Price Lists & Pricing Tiers"
        icon={<Tag size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Price Lists" }]}
        actions={
          <CustomButton
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setShowCreate(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
          >
            Create Price List
          </CustomButton>
        }
      />

      {/* Explanation Banner */}
      <div className="rounded-md border border-teal-100 bg-teal-50/50 p-4 text-xs text-teal-900 leading-relaxed flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-indigo-950 mb-0.5">How Price Lists work with Products:</span>
          Each Price List defines custom prices for products. When a wholesale or VIP customer buys a product, POS automatically applies the custom rate set in that customer's Price List instead of standard retail price. Click <b>"Manage Product Prices"</b> on any list below to set custom rates per product!
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-teal-600" />
        </div>
      ) : lists.length === 0 ? (
        <div className="rounded-md border-2 border-dashed border-slate-200 p-12 text-center bg-white">
          <DollarSign size={44} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-gray-600">No price lists created yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first Price List (e.g. Wholesale Rate) to customize product prices!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700"
          >
            <Plus size={14} /> Create Price List
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((pl) => (
            <div
              key={pl.id}
              className={`rounded-md border bg-white p-5 shadow-2xs transition hover:shadow-xs ${
                activeList?.id === pl.id ? "border-teal-500 ring-2 ring-teal-500/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-600 text-sm">{pl.name}</h3>
                    {pl.isDefault && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Currency: <span className="font-bold text-gray-600">{pl.currency}</span> · Custom Prices:{" "}
                    <span className="font-bold text-teal-600">{pl._count?.items || 0} products</span>
                  </p>
                </div>
                <button
                  onClick={() => confirmDelete(pl.id, pl.name)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Delete Price List"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {pl.validFrom ? `Valid from ${new Date(pl.validFrom).toLocaleDateString()}` : "Active permanent"}
                </span>
                <button
                  onClick={() => openListItems(pl)}
                  className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-md transition"
                >
                  <Eye size={13} /> Manage Product Prices
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-gray-600">Create New Price List</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
                  Price List Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Wholesale Tier / Corporate Rate"
                  className="w-full rounded-md border border-slate-200 px-3.5 py-2 text-xs text-gray-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">Currency</label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-gray-600 focus:border-teal-500 focus:outline-none"
                >
                  <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={createList}
                disabled={!newName.trim()}
                className="rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                Save Price List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PRODUCT PRICES DRAWER / MODAL */}
      {activeList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-md bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-600 flex items-center gap-2">
                  <Package className="h-5 w-5 text-teal-600" /> Manage Prices — {activeList.name}
                </h3>
                <p className="text-xs text-slate-500">Set custom price rates for products under this list</p>
              </div>
              <button onClick={() => setActiveList(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Form to Add/Set Product Price */}
            <div className="rounded-md border border-teal-100 bg-teal-50/40 p-4 mb-4 space-y-3">
              <h4 className="text-xs font-bold text-teal-900">Add / Edit Product Custom Price</h4>
              <div className="grid gap-3 sm:grid-cols-12 items-end">
                <div className="sm:col-span-6">
                  <SearchableSelect
                    label="Select Product"
                    options={productOptions}
                    value={selectedProductId}
                    onChange={(val) => {
                      setSelectedProductId(val);
                      const prod = products.find((p) => p.id === val);
                      if (prod && !customPrice) setCustomPrice(String(prod.sellingPrice));
                    }}
                    placeholder="Search product..."
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">Custom Rate (৳)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="e.g. 85.00"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-gray-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    onClick={handleAddItem}
                    disabled={addingItem || !selectedProductId || !customPrice}
                    className="w-full rounded-md bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {addingItem ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Save Rate
                  </button>
                </div>
              </div>
            </div>

            {/* List of Custom Product Prices */}
            <div className="flex-1 overflow-y-auto space-y-2">
              <h4 className="text-xs font-bold text-gray-600">Current Product Rates in List ({listItems.length})</h4>
              {loadingItems ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading products...</div>
              ) : listItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-md">
                  No custom product prices set yet. Use the form above to add a custom rate for any product!
                </div>
              ) : (
                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-gray-600 text-left">
                        <th className="px-3.5 py-2 font-semibold">Product Name</th>
                        <th className="px-3.5 py-2 font-semibold">SKU</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Standard Price</th>
                        <th className="px-3.5 py-2 font-semibold text-right">Custom List Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {listItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="px-3.5 py-2.5 font-semibold text-gray-600">{item.productName}</td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-500">{item.productSku}</td>
                          <td className="px-3.5 py-2.5 text-right text-slate-500 line-through">৳{item.defaultSellingPrice.toLocaleString()}</td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-teal-700 bg-teal-50/50">
                            ৳{item.price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveList(null)}
                className="rounded-md bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
