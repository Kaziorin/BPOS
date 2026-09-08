"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Tags,
  Loader2,
  CheckCircle2,
  FolderTree,
  Edit3,
  Trash2,
  Search,
  Check,
  ToggleLeft,
  ToggleRight,
  CornerDownRight,
  ShoppingBag,
  Utensils,
  Pill,
  ShoppingCart,
  Truck,
  Factory,
  Sparkles,
  Wrench,
  Building2,
} from "lucide-react";
import { api } from "@/lib/api";
import { SearchableSelect } from "@/components/custom/SearchableSelect";
import { ConfirmModal } from "@/components/custom/ConfirmModal";
import { CustomTable, CustomTableColumn } from "@/components/custom/CustomTable";
import { CustomModal } from "@/components/custom/CustomModal";
import { CustomBreadcrumb } from "@/components/custom/CustomBreadcrumb";
import { CustomButton } from "@/components/custom/CustomButton";
import { toast } from "react-toastify";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  status?: string;
  businessTypes?: string | null;
}

const BUSINESS_VERTICALS = [
  { id: "RETAIL", label: "Retail", icon: ShoppingBag },
  { id: "RESTAURANT", label: "Restaurant", icon: Utensils },
  { id: "PHARMACY", label: "Pharmacy", icon: Pill },
  { id: "GROCERY", label: "Grocery", icon: ShoppingCart },
  { id: "WHOLESALE", label: "Wholesale", icon: Truck },
  { id: "MANUFACTURING", label: "Manufacturing", icon: Factory },
  { id: "SALON", label: "Salon", icon: Sparkles },
  { id: "REPAIR", label: "Repair", icon: Wrench },
  { id: "FRANCHISE", label: "Franchise", icon: Building2 },
];

type ModalMode = "ADD_MAIN" | "EDIT_MAIN" | "ADD_SUB" | "EDIT_SUB" | null;

export default function CategoriesPage() {
  const [msg, setMsg] = useState<string | null>(null);

  // Main Categories State (Server Paginated)
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [mainLoading, setMainLoading] = useState(true);
  const [mainTotal, setMainTotal] = useState(0);
  const [mainPage, setMainPage] = useState(1);
  const [mainLimit, setMainLimit] = useState(5);
  const [searchMain, setSearchMain] = useState("");
  const [statusFilterMain, setStatusFilterMain] = useState<string>("ALL");
  const [verticalFilterMain, setVerticalFilterMain] = useState<string>("");

  // Subcategories State (Server Paginated)
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [subLoading, setSubLoading] = useState(true);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subLimit, setSubLimit] = useState(5);
  const [searchSub, setSearchSub] = useState("");
  const [statusFilterSub, setStatusFilterSub] = useState<string>("ALL");
  const [verticalFilterSub, setVerticalFilterSub] = useState<string>("");

  // All Parent Main Categories for Modal Dropdown
  const [allMainCats, setAllMainCats] = useState<Category[]>([]);

  // Modal State
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleBusinessType(vId: string) {
    setSelectedBusinessTypes((prev) =>
      prev.includes(vId) ? prev.filter((id) => id !== vId) : [...prev, vId]
    );
  }

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status toggle
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // API Call: Load Main Categories
  const loadMainData = useCallback(async () => {
    setMainLoading(true);
    try {
      const res = await api.get<any>("/v1/products/categories", {
        params: {
          isMain: true,
          page: mainPage,
          limit: mainLimit,
          search: searchMain || undefined,
          status: statusFilterMain !== "ALL" ? statusFilterMain : undefined,
          businessType: verticalFilterMain || undefined,
        },
      });

      const rows = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const totalCount = typeof res?.data?.total === "number"
        ? res.data.total
        : typeof res?.total === "number"
        ? res.total
        : rows.length;

      setMainCategories(rows);
      setMainTotal(totalCount);
    } catch (e) {
      console.error("Failed to load main categories", e);
    } finally {
      setMainLoading(false);
    }
  }, [mainPage, mainLimit, searchMain, statusFilterMain, verticalFilterMain]);

  // API Call: Load Subcategories
  const loadSubData = useCallback(async () => {
    setSubLoading(true);
    try {
      const res = await api.get<any>("/v1/products/categories", {
        params: {
          isMain: false,
          page: subPage,
          limit: subLimit,
          search: searchSub || undefined,
          status: statusFilterSub !== "ALL" ? statusFilterSub : undefined,
          businessType: verticalFilterSub || undefined,
        },
      });

      const rows = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      const totalCount = typeof res?.data?.total === "number"
        ? res.data.total
        : typeof res?.total === "number"
        ? res.total
        : rows.length;

      setSubCategories(rows);
      setSubTotal(totalCount);
    } catch (e) {
      console.error("Failed to load subcategories", e);
    } finally {
      setSubLoading(false);
    }
  }, [subPage, subLimit, searchSub, statusFilterSub, verticalFilterSub]);

  // API Call: Load All Main Categories for Modal Dropdown
  const loadAllMainCats = useCallback(async () => {
    try {
      const res = await api.get<any>("/v1/products/categories", {
        params: { isMain: true },
      });
      const list = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setAllMainCats(list);
    } catch (e) {
      console.error("Failed to load parent main categories dropdown", e);
    }
  }, []);

  useEffect(() => {
    loadMainData();
  }, [loadMainData]);

  useEffect(() => {
    loadSubData();
  }, [loadSubData]);

  useEffect(() => {
    loadAllMainCats();
  }, [loadAllMainCats]);

  // Open Handlers
  function handleOpenAddMain() {
    setEditingCategory(null);
    setFormName("");
    setFormParentId("");
    setSelectedBusinessTypes([]);
    setModalMode("ADD_MAIN");
  }

  function handleOpenEditMain(cat: Category) {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormParentId("");
    const parsedBt = cat.businessTypes ? cat.businessTypes.split(",").filter(Boolean) : [];
    setSelectedBusinessTypes(parsedBt);
    setModalMode("EDIT_MAIN");
  }

  function handleOpenAddSub() {
    setEditingCategory(null);
    setFormName("");
    setFormParentId(allMainCats.length > 0 ? allMainCats[0].id : "");
    setSelectedBusinessTypes([]);
    setModalMode("ADD_SUB");
  }

  function handleOpenEditSub(cat: Category) {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormParentId(cat.parentId || (allMainCats.length > 0 ? allMainCats[0].id : ""));
    const parsedBt = cat.businessTypes ? cat.businessTypes.split(",").filter(Boolean) : [];
    setSelectedBusinessTypes(parsedBt);
    setModalMode("EDIT_SUB");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    if ((modalMode === "ADD_SUB" || modalMode === "EDIT_SUB") && !formParentId) {
      toast.error("Please select a parent category for the subcategory.");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "EDIT_MAIN" || modalMode === "EDIT_SUB") {
        if (!editingCategory) return;
        await api.put(`/v1/products/categories/${editingCategory.id}`, {
          name: formName,
          parentId: modalMode === "EDIT_SUB" ? formParentId : null,
          businessTypes: selectedBusinessTypes,
        });
        toast.success("Category updated successfully!");
      } else {
        await api.post("/v1/products/categories", {
          name: formName,
          parentId: modalMode === "ADD_SUB" ? formParentId : undefined,
          businessTypes: selectedBusinessTypes,
        });
        toast.success(
          modalMode === "ADD_SUB"
            ? "Subcategory created successfully!"
            : "Main Category created successfully!"
        );
      }
      setModalMode(null);
      loadMainData();
      loadSubData();
      loadAllMainCats();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res: any = await api.del(`/v1/products/categories/${deleteId}`);
      if (res?.deactivated) {
        setMsg(`Category deactivated (${res.reason})`);
      } else {
        setMsg("Category deleted!");
      }
      setDeleteId(null);
      loadMainData();
      loadSubData();
      loadAllMainCats();
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleStatus(cat: Category) {
    setTogglingId(cat.id);
    const newStatus = cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api.put(`/v1/products/categories/${cat.id}`, { status: newStatus });
      loadMainData();
      loadSubData();
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  }

  // Columns for Main Categories Table
  const mainColumns: CustomTableColumn<Category>[] = [
    {
      key: "name",
      header: "Category",
      sortable: true,
      render: (cat) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-50 text-teal-600 shrink-0">
            <Tags size={16} />
          </div>
          <span className="font-bold text-gray-600 text-sm">{cat.name}</span>
        </div>
      ),
    },

    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (cat) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(cat);
          }}
          disabled={togglingId === cat.id}
          className="flex items-center justify-center gap-1 group cursor-pointer"
          title="Toggle status"
        >
          {togglingId === cat.id ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : cat.status === "ACTIVE" ? (
            <>
              <ToggleRight className="h-4.5 w-4.5 text-emerald-600" />
              <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 group-hover:bg-emerald-100 transition">
                Active
              </span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4.5 w-4.5 text-red-400" />
              <span className="rounded-md bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 group-hover:bg-red-100 transition">
                Inactive
              </span>
            </>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (cat) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditMain(cat)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition"
            title="Edit Main Category"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteId(cat.id)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete Main Category"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Columns for Subcategories Table
  const subColumns: CustomTableColumn<Category>[] = [
    {
      key: "subName",
      header: "Subcategory",
      sortable: true,
      getSortValue: (row) => row.name,
      render: (cat) => (
        <div className="flex items-center gap-2 font-bold text-gray-600 text-sm">
          <CornerDownRight size={15} className="text-teal-600 shrink-0" />
          <span>{cat.name}</span>
        </div>
      ),
    },
    {
      key: "parentName",
      header: "Category",
      sortable: true,
      align: "center",
      getSortValue: (row) => allMainCats.find((c) => c.id === row.parentId)?.name || "",
      render: (cat) => {
        const parentObj = allMainCats.find((c) => c.id === cat.parentId);
        return (
          <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 border border-teal-100">
            {parentObj?.name || "Parent"}
          </span>
        );
      },
    },
    {
      key: "businessTypes",
      header: "Business Verticals",
      render: (cat) => {
        const bts = cat.businessTypes ? cat.businessTypes.split(",").filter(Boolean) : [];
        if (bts.length === 0) {
          return (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              🏢 All Verticals
            </span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
              {bts.map((bt) => {
                const vObj = BUSINESS_VERTICALS.find((v) => v.id === bt);
                const VIcon = vObj?.icon || Tags;
                return (
                  <span key={bt} className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                    <VIcon size={11} className="text-teal-600" />
                    <span>{vObj?.label || bt}</span>
                  </span>
                );
              })}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (cat) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(cat);
          }}
          disabled={togglingId === cat.id}
          className="flex items-center justify-center gap-1 group cursor-pointer"
          title="Toggle status"
        >
          {togglingId === cat.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : cat.status === "ACTIVE" ? (
            <>
              <ToggleRight className="h-4 w-4 text-emerald-600" />
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 group-hover:bg-emerald-100 transition">
                Active
              </span>
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4 text-red-400" />
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 group-hover:bg-red-100 transition">
                Inactive
              </span>
            </>
          )}
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (cat) => (
        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEditSub(cat)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition"
            title="Edit Subcategory"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeleteId(cat.id)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete Subcategory"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-full space-y-4 p-4 bg-slate-50/50 min-h-screen">
      {/* Reusable Custom Breadcrumb Header */}
      <CustomBreadcrumb
        title="Category & Subcategory Management"
        icon={<FolderTree size={20} />}
        items={[{ label: "Catalog", href: "/products" }, { label: "Categories" }]}
      />

      {/* Toast Notification */}
      {msg && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {msg}
        </div>
      )}

      {/* 2-COLUMN SIDE BY SIDE LAYOUT — Dynamic Height items-start */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* LEFT COLUMN: MAIN CATEGORIES TABLE */}
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
          {/* Top Bar with Add Button */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-gray-600">Main Categories ({mainTotal})</h2>
            </div>
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenAddMain}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Main Category
            </CustomButton>
          </div>

          {/* Search & Status Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchMain}
                onChange={(e) => {
                  setSearchMain(e.target.value);
                  setMainPage(1);
                }}
                placeholder="Search main categories..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-600 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <select
              value={statusFilterMain}
              onChange={(e) => {
                setStatusFilterMain(e.target.value);
                setMainPage(1);
              }}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Table with Real API Pagination */}
          <div className="pt-1">
            <CustomTable
              columns={mainColumns}
              data={mainCategories}
              rowKey={(cat) => cat.id}
              loading={mainLoading}
              pageSize={mainLimit}
              totalItems={mainTotal}
              currentPage={mainPage}
              onPageChange={(p) => setMainPage(p)}
              onPageSizeChange={(s) => {
                setMainLimit(s);
                setMainPage(1);
              }}
              emptyMessage="No main categories found."
            />
          </div>
        </div>

        {/* RIGHT COLUMN: SUBCATEGORIES TABLE */}
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-2xs space-y-3">
          {/* Top Bar with Add Button */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CornerDownRight className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-bold text-gray-600">Subcategories ({subTotal})</h2>
            </div>
            <CustomButton
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenAddSub}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold"
            >
              Add Subcategory
            </CustomButton>
          </div>

          {/* Search & Status Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchSub}
                onChange={(e) => {
                  setSearchSub(e.target.value);
                  setSubPage(1);
                }}
                placeholder="Search subcategories..."
                className="w-full rounded-md border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
              />
            </div>
            <select
              value={statusFilterSub}
              onChange={(e) => {
                setStatusFilterSub(e.target.value);
                setSubPage(1);
              }}
              className="rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Table with Real API Pagination */}
          <div className="pt-1">
            <CustomTable
              columns={subColumns}
              data={subCategories}
              rowKey={(cat) => cat.id}
              loading={subLoading}
              pageSize={subLimit}
              totalItems={subTotal}
              currentPage={subPage}
              onPageChange={(p) => setSubPage(p)}
              onPageSizeChange={(s) => {
                setSubLimit(s);
                setSubPage(1);
              }}
              emptyMessage="No subcategories found."
            />
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL FOR MAIN CATEGORY */}
      <CustomModal
        open={modalMode === "ADD_MAIN" || modalMode === "EDIT_MAIN"}
        onClose={() => setModalMode(null)}
        title={modalMode === "EDIT_MAIN" ? "Edit Main Category" : "Create New Main Category"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Beverages, Electronics, Clothing"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-teal-500 focus:outline-none"
              required
              autoFocus
            />
          </div>



          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalMode(null)}
              className="rounded-md text-xs"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={saving}
              leftIcon={<Check size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs"
            >
              {modalMode === "EDIT_MAIN" ? "Update Category" : "Save Category"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ADD / EDIT MODAL FOR SUBCATEGORY */}
      <CustomModal
        open={modalMode === "ADD_SUB" || modalMode === "EDIT_SUB"}
        onClose={() => setModalMode(null)}
        title={modalMode === "EDIT_SUB" ? "Edit Subcategory" : "Create New Subcategory"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <SearchableSelect
              label="Parent Main Category"
              required
              options={allMainCats.map((c) => ({ value: c.id, label: c.name }))}
              value={formParentId}
              onChange={(val) => setFormParentId(val)}
              placeholder="Select Parent Main Category..."
            />
          </div>

          <div>
            <label className="block text-[15px] font-semibold text-gray-600 mb-1.5 capitalize">
              Subcategory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Soft Drinks, Laptops, Men Shirts"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 focus:border-teal-500 focus:outline-none"
              required
              autoFocus
            />
          </div>



          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalMode(null)}
              className="rounded-md text-xs"
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              size="sm"
              loading={saving}
              leftIcon={<Check size={14} />}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs"
            >
              {modalMode === "EDIT_SUB" ? "Update Subcategory" : "Save Subcategory"}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="This action cannot be undone. If category is assigned to products, it will be safely deactivated instead."
        type="DANGER"
        loading={deleting}
      />
    </div>
  );
}
