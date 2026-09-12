"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Utensils,
  ChefHat,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  ChevronLeft,
  Users,
  LayoutGrid,
  List,
  Flame,
  QrCode,
  Bell,
  PauseCircle,
  RotateCcw,
  Split,
  ArrowRightLeft,
  Star,
  Leaf,
  Tag,
  Percent,
  Gift,
  FileText,
  ShoppingBag,
  X,
  Coffee,
  RefreshCw,
  Clock,
  Sparkles,
  Info,
  Play,
  Square,
  Edit3,
  SlidersHorizontal,
  Building2,
  Armchair,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, TENANT_STORAGE_KEY } from "@/lib/api";
import { toast } from "react-toastify";
import { ConfirmModal, CustomModal, CustomPromptModal, CustomInput, CustomButton } from "@/components/custom";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { DEFAULT_FLOORS } from "@/components/restaurant/FloorPlanView";
import { publishRestaurantCart } from "@/lib/customer-display";

interface TableOption {
  id: string;
  tableNo: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";
  currentBill?: number;
  guestCount?: number;
  floorId?: string;
  floorName?: string;
}

interface FloorOption {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface PortionSizeOption {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
  isEnabled?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  image: string;
  isPopular?: boolean;
  isVeg?: boolean;
  isKitchenProduct?: boolean;
  timeSlotIds?: string[];
  allTimeSlots?: boolean;
  hasAddons?: boolean;
  portionSizes?: PortionSizeOption[];
  addons?: { name: string; price: number }[];
  description?: string;
}

interface CartModifier {
  label: string;
  value: string;
}

interface RestaurantCartItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  image?: string;
  modifiers?: CartModifier[];
  extras?: { label: string; price: number }[];
  notes?: string;
  isKitchenProduct?: boolean;
  kotStatus: "PENDING" | "SENT_TO_KITCHEN" | "PREPARING" | "SERVED" | "READY_TO_SERVE";
}

interface StaffOption {
  id: string;
  name: string;
  role?: string;
  shift?: string;
  avatarColor?: string;
}

const DEFAULT_STAFF: StaffOption[] = [
  { id: "staff-1", name: "Staff 1", role: "Captain / Waiter", shift: "Morning", avatarColor: "bg-orange-100 text-orange-700" },
  { id: "staff-2", name: "Staff 2", role: "Table Server", shift: "Morning", avatarColor: "bg-amber-100 text-amber-700" },
  { id: "staff-3", name: "Sumon", role: "Head Waiter", shift: "Evening", avatarColor: "bg-blue-100 text-blue-700" },
  { id: "staff-4", name: "Kabir", role: "Server / Runner", shift: "Evening", avatarColor: "bg-emerald-100 text-emerald-700" },
  { id: "staff-5", name: "Anis", role: "Beverage Barista", shift: "Full Day", avatarColor: "bg-purple-100 text-purple-700" },
  { id: "staff-6", name: "Manager", role: "Floor Manager", shift: "General", avatarColor: "bg-rose-100 text-rose-700" },
];

const DEMO_TABLES: TableOption[] = [
  { id: "tbl-01", tableNo: "Table 01", capacity: 4, status: "AVAILABLE" },
  { id: "tbl-02", tableNo: "Table 02", capacity: 2, status: "AVAILABLE" },
  { id: "tbl-03", tableNo: "Table 03", capacity: 4, status: "OCCUPIED", currentBill: 1250, guestCount: 3 },
  { id: "tbl-04", tableNo: "Table 04", capacity: 6, status: "AVAILABLE" },
  { id: "tbl-05", tableNo: "VIP Booth 01", capacity: 8, status: "RESERVED" },
  { id: "tbl-06", tableNo: "Terrace T-1", capacity: 4, status: "AVAILABLE" },
];

function mapApiProductToMenuItem(p: any): MenuItem {
  let catName = "Main Course";
  if (typeof p.category === "string" && p.category.trim()) {
    catName = p.category;
  } else if (p.category && typeof p.category === "object") {
    catName = p.category.name || p.category.label || "Main Course";
  } else if (p.categoryName) {
    catName = String(p.categoryName);
  }

  let isKitchen = true;
  let timeSlotIds: string[] = [];
  let allTimeSlots = true;
  let portionSizes: PortionSizeOption[] = [];
  let addons: { name: string; price: number }[] = [];

  try {
    const rawAttrs =
      typeof p.attributes === "string"
        ? JSON.parse(p.attributes)
        : p.attributes || {};
    const restAttrs = rawAttrs.restaurant || rawAttrs;
    if (restAttrs?.isKitchenProduct !== undefined) {
      isKitchen = Boolean(restAttrs.isKitchenProduct);
    }
    if (Array.isArray(restAttrs?.timeSlotIds)) {
      timeSlotIds = restAttrs.timeSlotIds;
    }
    if (restAttrs?.allTimeSlots !== undefined) {
      allTimeSlots = Boolean(restAttrs.allTimeSlots);
    } else if (timeSlotIds.length > 0) {
      allTimeSlots = false;
    }
    if (Array.isArray(restAttrs?.portionSizes)) {
      portionSizes = restAttrs.portionSizes
        .filter((s: any) => s.isEnabled !== false && s.price !== undefined && s.price !== "")
        .map((s: any) => ({
          id: String(s.id || s.name),
          name: String(s.name),
          price: Number(s.price || 0),
          isDefault: Boolean(s.isDefault),
          isEnabled: true,
        }));
    }

    if (Array.isArray(restAttrs?.addons)) {
      addons = restAttrs.addons.map((a: any) => ({
        name: String(a.name),
        price: Number(a.price || 0),
      }));
    }
  } catch (e) {}

  return {
    id: String(p.id || p._id),
    name: p.name || "Untitled Item",
    category: catName,
    sellingPrice: Number(p.sellingPrice || p.price || 0),
    image: p.imageUrl || p.image || "",
    isPopular: Boolean(p.isPopular),
    isVeg: Boolean(p.isVeg),
    isKitchenProduct: isKitchen,
    timeSlotIds,
    allTimeSlots,
    hasAddons:
      typeof p.hasAddons === "boolean"
        ? p.hasAddons
        : portionSizes.length > 0 || addons.length > 0 || !["beverages", "drinks", "water"].includes(catName.toLowerCase()),
    portionSizes,
    addons,
    description: p.description || "",
  };
}

const DEFAULT_PRESET_SLOTS = [
  { id: "shift-breakfast", name: "Breakfast / Morning", startTime: "07:00", endTime: "11:30", color: "#f59e0b", description: "Morning breakfast, tea & coffee", isActive: true },
  { id: "shift-lunch", name: "Lunch Shift", startTime: "12:00", endTime: "16:00", color: "#0d9488", description: "Lunch meals, biryani, thali & combos", isActive: true },
  { id: "shift-snacks", name: "Evening Snacks", startTime: "16:00", endTime: "19:00", color: "#6366f1", description: "Tea, street snacks, quick bites & fries", isActive: true },
  { id: "shift-dinner", name: "Dinner Shift", startTime: "19:00", endTime: "23:30", color: "#ec4899", description: "Dinner menu, steaks, grills & platters", isActive: true },
  { id: "shift-latenight", name: "Late Night Express", startTime: "23:30", endTime: "04:00", color: "#8b5cf6", description: "Late night cravings & takeaway", isActive: true },
];

function computeActiveShiftsFromClock(slots: any[], overrides: Record<string, any> = {}) {
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return slots.filter((s) => {
    const ov = overrides[s.id];
    if (ov) {
      if (ov.action === "FORCE_ACTIVE") return true;
      if (ov.action === "FORCE_INACTIVE") return false;
      if (ov.untilTime) {
        const st = s.startTime;
        const et = ov.untilTime;
        if (st <= et) return nowStr >= st && nowStr <= et;
        return nowStr >= st || nowStr <= et;
      }
    }
    const st = s.startTime || "00:00";
    const et = s.endTime || "23:59";
    if (st <= et) return nowStr >= st && nowStr <= et;
    return nowStr >= st || nowStr <= et;
  });
}

interface CategorySidebarItem {
  id: string;
  label: string;
  icon?: any;
  subcategories?: { id: string; label: string }[];
}

const DEFAULT_CATEGORIES: CategorySidebarItem[] = [
  { id: "All Items", label: "All Items", icon: Utensils },
  { id: "Popular", label: "Popular", icon: Flame },
];

const fmt = (amount: number) =>
  `৳${(amount || 0).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const getCategoryName = (cat: any): string => {
  if (typeof cat === "string") return cat;
  if (cat && typeof cat === "object") return cat.name || cat.label || "";
  return String(cat || "");
};

export default function RestaurantPOSPage() {
  const [storeName, setStoreName] = useState<string>("BlueOceans POS SYSTEM");
  const [branchName, setBranchName] = useState<string>("Main Branch");
  const [branchAddress, setBranchAddress] = useState<string>("Dhaka, Bangladesh");
  const [tables, setTables] = useState<TableOption[]>(DEMO_TABLES);
  const [floors, setFloors] = useState<FloorOption[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableOption | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedId = localStorage.getItem("bpos_restaurant_selected_table_id");
        if (savedId) {
          const match = DEMO_TABLES.find((t) => t.id === savedId);
          if (match) return match;
        }
      } catch (_) {}
    }
    return DEMO_TABLES[0];
  });
  const [guestCount, setGuestCount] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const c = localStorage.getItem("bpos_restaurant_guest_count");
        if (c !== null) {
          const n = parseInt(c, 10);
          if (n >= 1 && n <= 20) return n;
        }
      } catch (_) {}
    }
    return 2;
  });
  const [waiterName, setWaiterName] = useState("Staff 1");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategorySidebarItem[]>(DEFAULT_CATEGORIES);
  const [cart, setCart] = useState<RestaurantCartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("bpos_restaurant_cart");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed as RestaurantCartItem[];
        }
      } catch (_) {}
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchFilter, setSearchFilter] = useState("");
  const [searchResults, setSearchResults] = useState<MenuItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [orderNote, setOrderNote] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modals & Dialogs
  const [showSelectTableModal, setShowSelectTableModal] = useState(false);
  const [tableModalFloorId, setTableModalFloorId] = useState<string>("");
  const [tableModalStep, setTableModalStep] = useState<1 | 2 | 3>(1);
  const [staffList, setStaffList] = useState<StaffOption[]>(DEFAULT_STAFF);
  const [customStaffName, setCustomStaffName] = useState("");
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState(250);
  const [heldOrders, setHeldOrders] = useState<any[]>([]);
  const [completedBill, setCompletedBill] = useState<any | null>(null);
  const [showShiftDetailsModal, setShowShiftDetailsModal] = useState(false);

  const [promptModalState, setPromptModalState] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    placeholder?: string;
    defaultValue?: string;
    inputType?: "text" | "number" | "textarea";
    onSubmit?: (val: string) => void;
  }>({
    isOpen: false,
    title: "",
  });

  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // Add-ons Modal State
  const [selectedProductForAddons, setSelectedProductForAddons] = useState<MenuItem | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<RestaurantCartItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<{ label: string; price: number }>({ label: "Regular", price: 0 });
  const [selectedSpice, setSelectedSpice] = useState<string>("Medium");
  const [selectedExtras, setSelectedExtras] = useState<{ label: string; price: number }[]>([]);
  const [itemNote, setItemNote] = useState<string>("");

  // Time Slots / Meal Shifts State (Always active with automatic live clock matching)
  const [timeSlotFilterEnabled, setTimeSlotFilterEnabled] = useState<boolean>(true);
  const [timeSlots, setTimeSlots] = useState<any[]>(DEFAULT_PRESET_SLOTS);
  const [todayOverrides, setTodayOverrides] = useState<Record<string, any>>({});
  const initialActive = computeActiveShiftsFromClock(DEFAULT_PRESET_SLOTS);
  const [activeSlots, setActiveSlots] = useState<any[]>(initialActive.length > 0 ? initialActive : [DEFAULT_PRESET_SLOTS[1]]);
  const [activeSlot, setActiveSlot] = useState<any | null>(initialActive[0] || DEFAULT_PRESET_SLOTS[1]);
  const [activeSlotIds, setActiveSlotIds] = useState<string[]>(
    initialActive.length > 0 ? initialActive.map((s) => s.id) : [DEFAULT_PRESET_SLOTS[1].id]
  );
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Dynamic Shift Override Handler for Today's Demand
  const handleShiftOverride = async (slotId: string, action: string) => {
    setOverrideLoading(true);
    try {
      await api.post("/v1/restaurant/time-slots/override", { slotId, action });
      await loadData();
      if (action === "START_NOW") toast.success("Shift started & active for today's menu!");
      else if (action === "END_EARLY") toast.info("Shift ended early for today.");
      else if (action === "EXTEND_1H") toast.success("Shift extended by +1 Hour today!");
      else if (action === "EXTEND_30M") toast.success("Shift extended by +30 Mins today!");
      else if (action === "RESET" || action === "RESET_ALL") toast.info("Reverted to standard scheduled hours.");
    } catch (err: any) {
      console.error("Shift override error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to update shift for today.");
    } finally {
      setOverrideLoading(false);
    }
  };

  // Load tenant/store info & real DB data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let loadedProducts: MenuItem[] = [];

      // 1. Fetch products for this tenant
      try {
        const resProd: any = await api.get("/products", { params: { limit: 150 } });
        const pData = (resProd?.data as any)?.data ?? resProd?.data ?? resProd ?? [];
        if (Array.isArray(pData) && pData.length > 0) {
          loadedProducts = pData.map((p: any) => mapApiProductToMenuItem(p));
          setProducts(loadedProducts);
        } else {
          setProducts([]);
          loadedProducts = [];
        }
      } catch (errProd) {
        setProducts([]);
        loadedProducts = [];
      }

      // 1b. Fetch tenant/store info for bill header
      try {
        const resTenant: any = await api.get("/api/v1/tenant");
        const tData = (resTenant?.data as any)?.data ?? resTenant?.data ?? resTenant ?? {};
        if (tData?.tenant?.name) setStoreName(tData.tenant.name);
        if (tData?.branches?.[0]?.name) setBranchName(tData.branches[0].name);
        if (tData?.branches?.[0]?.address) setBranchAddress(tData.branches[0].address);
      } catch (_) {}

      // 1c. Fetch staff/employees from HRM if available
      try {
        const empRes: any = await api.get("/hrm/employees?status=ACTIVE&limit=50").catch(() => null);
        const empData = (empRes?.data as any)?.data ?? empRes?.data ?? empRes ?? [];
        if (Array.isArray(empData) && empData.length > 0) {
          const COLORS = [
            "bg-orange-100 text-orange-700",
            "bg-amber-100 text-amber-700",
            "bg-blue-100 text-blue-700",
            "bg-emerald-100 text-emerald-700",
            "bg-purple-100 text-purple-700",
            "bg-rose-100 text-rose-700",
          ];
          setStaffList(
            empData.map((e: any, idx: number) => ({
              id: String(e.id || idx),
              name: e.name || e.fullName || `${e.firstName || ""} ${e.lastName || ""}`.trim() || `Staff ${idx + 1}`,
              role: e.designation || e.role || "Waiter",
              shift: e.shift || "Active",
              avatarColor: COLORS[idx % COLORS.length],
            }))
          );
        }
      } catch (_) {}

      // 2. Fetch created categories for current tenant & business
      const catRes: any = await api.get("/v1/products/categories").catch(() => null);
      const dbCategoriesList: any[] = (catRes?.data as any)?.data ?? catRes?.data ?? catRes ?? [];
      if (Array.isArray(dbCategoriesList)) {
        setDbCategories(dbCategoriesList);
      }

      let dynamicCats: CategorySidebarItem[] = [
        { id: "All Items", label: "All Items", icon: Utensils },
        { id: "Popular", label: "Popular", icon: Flame },
      ];

      if (Array.isArray(dbCategoriesList) && dbCategoriesList.length > 0) {
        const mainCatMap: Record<string, CategorySidebarItem> = {};
        const subCatMap: Record<string, { id: string; label: string }[]> = {};

        // First pass: separate main categories & subcategories
        dbCategoriesList.forEach((cat: any) => {
          const name = cat.name || cat.label || cat.title;
          if (!name) return;

          if (cat.parentId) {
            const pId = String(cat.parentId);
            if (!subCatMap[pId]) subCatMap[pId] = [];
            if (!subCatMap[pId].some((s) => s.id.toLowerCase() === name.toLowerCase())) {
              subCatMap[pId].push({ id: name, label: name });
            }
          } else {
            if (!mainCatMap[String(cat.id)]) {
              mainCatMap[String(cat.id)] = {
                id: name,
                label: name,
                icon: getCategoryIcon(cat.icon, name),
                subcategories: [],
              };
            }
          }
        });

        // Attach subcategories to main categories
        dbCategoriesList.forEach((cat: any) => {
          if (!cat.parentId && mainCatMap[String(cat.id)]) {
            mainCatMap[String(cat.id)].subcategories = subCatMap[String(cat.id)] || [];
          }
        });

        Object.values(mainCatMap).forEach((mCat) => {
          if (!dynamicCats.some((c) => c.id.toLowerCase() === mCat.id.toLowerCase())) {
            dynamicCats.push(mCat);
          }
        });
      }

      // Collect categories present in actual tenant products
      loadedProducts.forEach((p) => {
        const pCatName = getCategoryName(p.category);
        if (
          pCatName &&
          pCatName !== "All Items" &&
          pCatName !== "Popular" &&
          !dynamicCats.some((c) => c.id.toLowerCase() === pCatName.toLowerCase())
        ) {
          dynamicCats.push({
            id: pCatName,
            label: pCatName,
            icon: getCategoryIcon(null, pCatName),
            subcategories: [],
          });
        }
      });

      setCategories(dynamicCats);

      // 3. Load Time Slots and Settings
      try {
        const [resSlots, resSettings] = await Promise.allSettled([
          api.get("/v1/restaurant/time-slots"),
          api.get("/v1/restaurant/time-slots/settings"),
        ]);

        let isFilterOn = false;
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("bpos_restaurant_time_slot_filter");
          if (cached !== null) isFilterOn = cached === "true";
        }

        if (resSettings.status === "fulfilled") {
          const sData = (resSettings.value as any)?.data ?? resSettings.value ?? {};
          if (sData?.timeSlotFilterEnabled !== undefined) {
            isFilterOn = Boolean(sData.timeSlotFilterEnabled);
          }
        }

        if (resSlots.status === "fulfilled") {
          const slData = (resSlots.value as any)?.data ?? resSlots.value ?? {};
          if (slData?.timeSlotFilterEnabled !== undefined) {
            isFilterOn = Boolean(slData.timeSlotFilterEnabled);
          }
          const slotsList = Array.isArray(slData.slots)
            ? slData.slots
            : Array.isArray(slData)
            ? slData
            : [];
          if (slotsList.length > 0) {
            setTimeSlots(slotsList);
          }

          const curActiveSlots = Array.isArray(slData.activeSlots)
            ? slData.activeSlots
            : slData.activeSlot
            ? [slData.activeSlot]
            : [];
          if (curActiveSlots.length > 0) {
            setActiveSlots(curActiveSlots);
            setActiveSlot(slData.activeSlot || curActiveSlots[0] || null);
          }

          const curActiveIds = Array.isArray(slData.activeSlotIds)
            ? slData.activeSlotIds
            : curActiveSlots.map((s: any) => s.id);
          if (curActiveIds.length > 0) {
            setActiveSlotIds(curActiveIds);
          }
          setTodayOverrides(slData.todayOverrides || {});
        }

        setTimeSlotFilterEnabled(isFilterOn);
        if (typeof window !== "undefined") {
          localStorage.setItem("bpos_restaurant_time_slot_filter", String(isFilterOn));
        }
      } catch (e) {
        console.error("Failed to load time slots in POS:", e);
      }

      // 4. Load Sections \Load Floors & Tables (floors power the Floor → Table picker Tables (sections power the Section → Table picker in the Select Table modal)
      let loadedFloors: FloorOption[] = [];
      try {
        const [resFloors, resTables]: any[] = await Promise.all([
          api.get("/v1/restaurant/floors").catch(() => null),
          api.get("/v1/restaurant/tables").catch(() => null),
        ]);

        // Sections — when the API has none yet, fall back to the same defaults the
        // Sections page shows, so the modal can always ask "pick a section" first.
        const fData = resFloors?.data?.data ?? resFloors?.data ?? resFloors ?? [];
        loadedFloors =
          Array.isArray(fData) && fData.length > 0
            ? fData.map((f: any, i: number) => ({
                id: String(f.id),
                name: f.name || `Section ${i + 1}`,
                sortOrder: f.sortOrder !== undefined && f.sortOrder !== null ? Number(f.sortOrder) : i,
              }))
            : DEFAULT_FLOORS.map((f) => ({ id: f.id, name: f.name, sortOrder: f.sortOrder }));
        setFloors(loadedFloors);

        const tData = resTables?.data?.data ?? resTables?.data ?? resTables ?? [];
        if (Array.isArray(tData) && tData.length > 0) {
          const mappedTables: TableOption[] = tData.map((t: any) => ({
            id: String(t.id),
            tableNo: t.tableNo || t.name || `Table ${String(t.id).slice(0, 4)}`,
            capacity: Number(t.capacity || 4),
            status: t.status || "AVAILABLE",
            currentBill: t.currentBill ? Number(t.currentBill) : undefined,
            guestCount: t.guestCount ? Number(t.guestCount) : undefined,
            floorId: t.floorId ? String(t.floorId) : undefined,
            floorName: t.floorName || undefined,
          }));
          // Display-only fallback: if none of the tables is assigned to a section yet,
          // spread them across floors (round-robin) so every floor shows tables.
          const anyAssigned = mappedTables.some((t) => t.floorId);
          const withFloors: TableOption[] = anyAssigned
            ? mappedTables
            : mappedTables.map((t, i) => ({
                ...t,
                floorId: loadedFloors[i % loadedFloors.length].id,
                floorName: loadedFloors[i % loadedFloors.length].name,
              }));
          setTables(withFloors);
          setSelectedTable(() => {
            try {
              const savedId = typeof window !== "undefined" ? localStorage.getItem("bpos_restaurant_selected_table_id") : null;
              if (savedId) {
                const match = withFloors.find((t) => t.id === savedId);
                if (match) return match;
              }
            } catch (_) {}
            return withFloors[0];
          });
        } else {
          // Demo fallback: spread demo tables across sections (round-robin) so the
          // Section → Table picker stays fully usable without seeded tables.
          const demoTables: TableOption[] = DEMO_TABLES.map((t, i) => ({
            ...t,
            floorId: loadedFloors[i % loadedFloors.length].id,
            floorName: loadedFloors[i % loadedFloors.length].name,
          }));
          setTables(demoTables);
          setSelectedTable(() => {
            try {
              const savedId = typeof window !== "undefined" ? localStorage.getItem("bpos_restaurant_selected_table_id") : null;
              if (savedId) {
                const match = demoTables.find((t) => t.id === savedId);
                if (match) return match;
              }
            } catch (_) {}
            return demoTables[0];
          });
        }
      } catch (errTables) {
        if (loadedFloors.length === 0) {
          loadedFloors = DEFAULT_FLOORS.map((f) => ({ id: f.id, name: f.name, sortOrder: f.sortOrder }));
        }
        setFloors(loadedFloors);
        const demoTables: TableOption[] = DEMO_TABLES.map((t, i) => ({
          ...t,
          floorId: loadedFloors[i % loadedFloors.length].id,
          floorName: loadedFloors[i % loadedFloors.length].name,
        }));
        setTables(demoTables);
        setSelectedTable(() => {
          try {
            const savedId = typeof window !== "undefined" ? localStorage.getItem("bpos_restaurant_selected_table_id") : null;
            if (savedId) {
              const match = demoTables.find((t) => t.id === savedId);
              if (match) return match;
            }
          } catch (_) {}
          return demoTables[0];
        });
      }
    } catch (err) {
      console.error("Failed to load restaurant POS data:", err);
      setCategories(DEFAULT_CATEGORIES);
      setTables(DEMO_TABLES);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("bpos_restaurant_time_slot_filter");
        if (cached !== null) {
          setTimeSlotFilterEnabled(cached === "true");
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadData]);

  // ── Persist the live order across page reloads ──
  // (cart, selected table & guest count survive refresh so a half-built
  //  order is never lost; completing/clearing the order clears the save too)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("bpos_restaurant_cart", JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (selectedTable) {
        localStorage.setItem("bpos_restaurant_selected_table_id", selectedTable.id);
      } else {
        localStorage.removeItem("bpos_restaurant_selected_table_id");
      }
      localStorage.setItem("bpos_restaurant_guest_count", String(guestCount));
    } catch (_) {}
  }, [selectedTable, guestCount]);

  // ── Customer-facing display: sync live cart to Customer Display in real-time ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawSub = cart.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    const discAmt = (rawSub * discountPercent) / 100;
    const sTotal = Math.max(0, rawSub - discAmt);
    const estTax = sTotal * 0.15;
    const estService = sTotal * 0.04;
    const estTotal = sTotal + estTax + estService;

    publishRestaurantCart({
      updatedAt: Date.now(),
      source: "RESTAURANT",
      lines: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice,
        discountAmount: 0,
        sku: i.id || i.productId,
        image: i.image,
        category:
          i.modifiers && i.modifiers.length > 0
            ? i.modifiers.map((m) => `${m.label}: ${m.value}`).join(" • ")
            : undefined,
        notes: [
          ...(i.extras || []).map((e) => `+${e.label}`),
          ...(i.notes ? [i.notes] : []),
        ].join(", ") || undefined,
      })),
      subtotal: rawSub,
      discountTotal: discAmt,
      taxTotal: estTax,
      serviceCharge: estService,
      total: estTotal,
      status: cart.length > 0 ? "ACTIVE" : "IDLE",
      customerName: customerName || undefined,
      customerTier: "Guest",
      merchantName: storeName || "BPOS Restaurant",
      cashierName: waiterName || "Staff",
      tableNo:
        selectedTable?.tableNo ||
        (orderType === "TAKEAWAY"
          ? "Takeaway"
          : orderType === "DELIVERY"
          ? "Delivery"
          : undefined),
      orderType,
      guestCount,
    });
  }, [
    cart,
    discountPercent,
    selectedTable,
    orderType,
    customerName,
    customerPhone,
    guestCount,
    waiterName,
    storeName,
  ]);

  // ── Header search: query the API so the search works across ALL restaurant products ──
  useEffect(() => {
    const q = searchFilter.trim();
    if (q.length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res: any = await api.get("/products", { params: { search: q, limit: 60 } });
        const pData = (res?.data as any)?.data ?? res?.data ?? res ?? [];
        setSearchResults(Array.isArray(pData) ? pData.map((p: any) => mapApiProductToMenuItem(p)) : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchFilter]);

  // ── Select-Table modal helpers ──
  // The modal ALWAYS asks to pick a section first and then
  // shows ONLY that section's tables in the grid below.
  const showFloorStep = floors.length > 0;
  const tableModalTables = tableModalFloorId
    ? tables.filter((t) => t.floorId === tableModalFloorId)
    : tables;



  const SPICE_OPTIONS = [
    { label: "Mild", icon: "🟢" },
    { label: "Medium", icon: "🟡" },
    { label: "Spicy", icon: "🌶️" },
    { label: "Extra Spicy", icon: "🔥" },
  ];

  const EXTRA_TOPPINGS: { label: string; price: number; image?: string }[] = [
    { label: "Extra Cheese", price: 30, image: "" },
    { label: "Extra Patty / Meat", price: 50, image: "" },
    { label: "Mushroom & Olives", price: 40, image: "" },
    { label: "French Fries Combo", price: 60, image: "" },
    { label: "Cold Drinks Combo", price: 50, image: "" },
    { label: "Garlic Toast Combo", price: 45, image: "" },
  ];

  const handleOpenAddonModal = (product: MenuItem) => {
    setSelectedProductForAddons(product);
    setEditingCartItem(null);

    if (product.portionSizes && product.portionSizes.length > 0) {
      const def = product.portionSizes.find((s) => s.isDefault) || product.portionSizes[0];
      setSelectedSize({ label: def.name, price: def.price });
    } else {
      setSelectedSize({ label: "Standard", price: product.sellingPrice });
    }
    setSelectedSpice("Medium");
    setSelectedExtras([]);
    setItemNote("");
  };

  const handleEditCartItemAddons = (cartItem: RestaurantCartItem) => {
    const prod = products.find((p) => p.id === cartItem.productId) || {
      id: cartItem.productId,
      name: cartItem.name,
      category: "General",
      sellingPrice: cartItem.unitPrice,
      image: cartItem.image || "",
    };
    setSelectedProductForAddons(prod);
    setEditingCartItem(cartItem);
    setItemNote(cartItem.notes || "");
    setSelectedSpice("Medium");
    setSelectedExtras([]);

    if (prod.portionSizes && prod.portionSizes.length > 0) {
      const def = prod.portionSizes.find((s) => s.isDefault) || prod.portionSizes[0];
      setSelectedSize({ label: def.name, price: def.price });
    } else {
      setSelectedSize({ label: "Standard", price: prod.sellingPrice });
    }
  };

  const toggleExtraTopping = (topping: { label: string; price: number; image?: string }) => {
    setSelectedExtras((prev) =>
      prev.some((e) => e.label === topping.label)
        ? prev.filter((e) => e.label !== topping.label)
        : [...prev, topping]
    );
  };

  const handleConfirmAddons = () => {
    if (!selectedProductForAddons) return;

    const hasSizes = Boolean(selectedProductForAddons.portionSizes && selectedProductForAddons.portionSizes.length > 0);
    const sizeBasePrice = hasSizes ? selectedSize.price : selectedProductForAddons.sellingPrice;
    const extraTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
    const finalUnitPrice = sizeBasePrice + extraTotal;

    const modifiersList: CartModifier[] = [
      ...(hasSizes ? [{ label: "Size", value: `${selectedSize.label} (${fmt(selectedSize.price)})` }] : []),
      { label: "Spice", value: selectedSpice },
      ...selectedExtras.map((e) => ({ label: "Extra", value: `${e.label} (+${fmt(e.price)})` })),
    ];

    if (editingCartItem) {
      setCart((prev) =>
        prev.map((i) =>
          i.id === editingCartItem.id
            ? {
                ...i,
                unitPrice: finalUnitPrice,
                modifiers: modifiersList,
                notes: itemNote,
              }
            : i
        )
      );
      toast.success(`Updated add-ons for ${editingCartItem.name}`);
    } else {
      const isKitchen = selectedProductForAddons.isKitchenProduct ?? true;
      setCart((prev) => [
        ...prev,
        {
          id: `${selectedProductForAddons.id}-${Date.now()}`,
          productId: selectedProductForAddons.id,
          name: selectedProductForAddons.name,
          image: selectedProductForAddons.image || "",
          qty: 1,
          unitPrice: finalUnitPrice,
          modifiers: modifiersList,
          notes: itemNote,
          isKitchenProduct: isKitchen,
          kotStatus: isKitchen ? "PENDING" : "READY_TO_SERVE",
        },
      ]);
      reserveSelectedTable();
      toast.success(`Added ${selectedProductForAddons.name} with add-ons to order`);
    }

    setSelectedProductForAddons(null);
    setEditingCartItem(null);
  };

  const formatDaysOfWeek = (days: any) => {
    if (!days || days === "ALL") return "Everyday";
    if (Array.isArray(days)) return days.join(", ");
    if (typeof days === "string") {
      try {
        const parsed = JSON.parse(days);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch (e) {}
      return days;
    }
    return String(days);
  };

  // ── Booking flow: adding the first item hard-locks the table server-side ──
  // so another POS terminal cannot take this table until the bill is paid
  // or the order is cleared. (Idempotent: only pushes a PATCH while AVAILABLE.)
  const reserveSelectedTable = () => {
    if (!selectedTable) return;
    const cur = tables.find((t) => t.id === selectedTable.id);
    if (cur && (cur.status === "AVAILABLE" || !cur.status)) {
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTable.id ? { ...t, status: "RESERVED" as const } : t))
      );
      api
        .patch(`/v1/restaurant/tables/${selectedTable.id}/status`, { status: "RESERVED" })
        .catch(() => {});
    }
  };

  const addToCart = (item: MenuItem) => {
    const isKitchen = item.isKitchenProduct ?? true;
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === item.id);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].qty += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: `${item.id}-${Date.now()}`,
          productId: item.id,
          name: item.name,
          image: item.image || "",
          qty: 1,
          unitPrice: item.sellingPrice,
          isKitchenProduct: isKitchen,
          kotStatus: isKitchen ? "PENDING" : "READY_TO_SERVE",
        },
      ];
    });
    reserveSelectedTable();
    toast.success(`Added ${item.name} to order`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || customPrice <= 0) return;
    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: customName,
      category: "Add-ons",
      sellingPrice: customPrice,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    };
    setProducts((prev) => [newItem, ...prev]);
    addToCart(newItem);
    setShowCustomItemModal(false);
    setCustomName("");
    setCustomPrice(250);
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders((prev) => [
      ...prev,
      {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        table: selectedTable,
        guestCount,
        waiterName,
        cart,
        time: new Date().toLocaleTimeString(),
      },
    ]);
    setCart([]);
    toast.info(`Order for Table ${selectedTable?.tableNo || "N/A"} put on Hold!`);
  };

  const handleRecallOrder = (heldOrder: any) => {
    if (heldOrder.table) setSelectedTable(heldOrder.table);
    setGuestCount(heldOrder.guestCount);
    setWaiterName(heldOrder.waiterName);
    setCart(heldOrder.cart);
    setHeldOrders((prev) => prev.filter((o) => o.id !== heldOrder.id));
    setShowHoldModal(false);
    toast.success(`Recalled order ${heldOrder.id}!`);
  };

  const sendKotToKitchen = () => {
    if (cart.length === 0) return;
    const kitchenItems = cart.filter((item) => item.isKitchenProduct !== false);
    if (kitchenItems.length === 0) {
      toast.info("All items in cart are ready-to-serve (No kitchen KOT needed)");
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.isKitchenProduct !== false
          ? { ...item, kotStatus: "SENT_TO_KITCHEN" }
          : item
      )
    );
    toast.success(
      `KOT Ticket sent (${kitchenItems.length} kitchen items) to KDS for Table ${selectedTable?.tableNo || "N/A"}!`
    );
  };

  const rawSubtotal = cart.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const discountAmount = (rawSubtotal * discountPercent) / 100;
  const subTotal = Math.max(0, rawSubtotal - discountAmount);
  const estimateTax = subTotal * 0.15;
  const estimateService = subTotal * 0.04;
  const estimateGrandTotal = subTotal + estimateTax + estimateService;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      // Build payload for the backend POS confirm endpoint
      // Let the backend calculate tax and totals (server-side tax rules)
      const payload = {
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: null,
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: 0,
          lineTotal: i.qty * i.unitPrice,
        })),
        payments: [{ method: "CASH", amount: estimateGrandTotal }],
        discountTotal: discountAmount,
        serviceCharge: estimateService,
        source: "RESTAURANT",
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        note: `Restaurant | Table: ${selectedTable?.tableNo || "N/A"} | ${orderType} | Waiter: ${waiterName}`,
      };

      // Call backend to save the sale and deduct inventory
      const res: any = await api.post("/api/v1/pos/confirm", payload);
      const saleResult = res?.data ?? res ?? {};
      const invNo = saleResult.invoiceNo || `REST-${Math.floor(100000 + Math.random() * 900000)}`;

      const billData = {
        invoiceNo: invNo,
        table: selectedTable,
        guestCount,
        waiterName,
        orderType,
        customerName: customerName || "",
        customerPhone: customerPhone || "",
        items: cart,
        rawSubtotal,
        discountAmount,
        subTotal: saleResult.subtotal || subTotal,
        taxAmount: saleResult.taxTotal || 0,
        serviceCharge: saleResult.serviceCharge || 0,
        grandTotal: saleResult.total || subTotal,
        date: new Date().toISOString(),
      };

      setCompletedBill(billData);

      // Publish paid status to Customer Display
      publishRestaurantCart({
        updatedAt: Date.now(),
        source: "RESTAURANT",
        invoiceNo: invNo,
        lines: cart.map((i) => ({
          name: i.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          discountAmount: 0,
          sku: i.id || i.productId,
          image: i.image,
        })),
        subtotal: rawSubtotal,
        discountTotal: discountAmount,
        taxTotal: saleResult.taxTotal || estimateTax,
        serviceCharge: saleResult.serviceCharge || estimateService,
        total: saleResult.total || estimateGrandTotal,
        paidTotal: saleResult.total || estimateGrandTotal,
        status: "PAID",
        customerName: customerName || undefined,
        merchantName: storeName || "BPOS Restaurant",
        cashierName: waiterName,
        tableNo: selectedTable?.tableNo || (orderType === "TAKEAWAY" ? "Takeaway" : orderType === "DELIVERY" ? "Delivery" : undefined),
        orderType,
        guestCount,
      });

      setCart([]);
      setDiscountPercent(0);
      setCustomerName("");
      setCustomerPhone("");
      toast.success(`Order #${invNo} placed & synced to system!`);

      // ── Booking flow: the table becomes free again once the bill is paid ──
      if (selectedTable) {
        const finishedTableId = selectedTable.id;
        setTables((prev) =>
          prev.map((x) => (x.id === finishedTableId ? { ...x, status: "AVAILABLE" as const } : x))
        );
        try {
          await api.patch(`/v1/restaurant/tables/${finishedTableId}/status`, { status: "AVAILABLE" });
        } catch {}
      }

      // Reload product list to reflect updated stock
      loadData();
    } catch (err: any) {
      console.error("Restaurant POS order error:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to place order. Please try again.");
    }
  };

  const getCategoryName = (cat: any): string => {
    if (typeof cat === "string") return cat;
    if (cat && typeof cat === "object") return cat.name || cat.label || "";
    return String(cat || "");
  };

  const isItemCustomizable = (item: MenuItem): boolean => {
    if (typeof item.hasAddons === "boolean") return item.hasAddons;
    const cat = getCategoryName(item.category).toLowerCase();
    return !["beverages", "drinks", "water", "soft drinks"].includes(cat);
  };

  const handleProductAction = (item: MenuItem) => {
    if (isItemCustomizable(item)) {
      handleOpenAddonModal(item);
    } else {
      addToCart(item);
    }
  };

  const searchQ = searchFilter.toLowerCase().trim();
  const isSearching = searchQ.length > 0;
  // While searching, use the API-backed results (all restaurant products);
  // otherwise browse the base catalog with the sidebar category selection.
  const sourceProducts = isSearching && searchResults !== null ? searchResults : products;

  const filteredProducts = sourceProducts.filter((p) => {
    // 1. Shift filtering if enabled (supports single or multi-shift concurrent active shifts!)
    //    Skipped during an explicit search so any restaurant product can be found.
    if (!isSearching && timeSlotFilterEnabled && activeSlotIds.length > 0) {
      const inAnyActiveShift =
        p.allTimeSlots ||
        (Array.isArray(p.timeSlotIds) &&
          p.timeSlotIds.some((id) => activeSlotIds.includes(id)));
      if (!inAnyActiveShift) return false;
    }

    const pCat = getCategoryName(p.category);
    // 2. Search runs across ALL categories; the sidebar filter applies only while browsing.
    const matchesCategory = isSearching
      ? true
      : selectedCategory === "All Items"
      ? true
      : selectedCategory === "Popular"
      ? p.isPopular
      : pCat.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      !searchQ || p.name.toLowerCase().includes(searchQ) || pCat.toLowerCase().includes(searchQ);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-gray-600 font-sans select-none overflow-hidden">
      {/* ══════════════ 1. TOP ORANGE HEADER BAR ══════════════ */}
      <header className="flex-none flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/restaurant"
            className="flex items-center justify-center p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition"
            title="Back to Restaurant Dashboard"
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-orange-600 shadow-xs">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none text-white flex items-center gap-1.5">
                {storeName}{" "}
                <span className="text-orange-200 text-[10px] sm:text-xs font-bold capitalize tracking-wider">
                  POS SYSTEM
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white/20 p-1 rounded-md shadow-inner">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              orderType === "DINE_IN"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Utensils size={13} /> Dine In
          </button>
          <button
            onClick={() => setOrderType("TAKEAWAY")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              orderType === "TAKEAWAY"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-white hover:bg-white/10"
            }`}
          >
            <ShoppingBag size={13} /> Take Away
          </button>
          <button
            onClick={() => setOrderType("DELIVERY")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              orderType === "DELIVERY"
                ? "bg-white text-orange-600 shadow-xs"
                : "text-white hover:bg-white/10"
            }`}
          >
            <Flame size={13} /> Delivery
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-44 sm:w-60">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-200"
            />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search food & drinks..."
              className="w-full rounded-md bg-white/15 border border-white/20 py-1.5 pl-8 pr-8 text-xs font-medium text-white placeholder-orange-100/70 focus:bg-white focus:text-gray-600 focus:placeholder-gray-400 focus:outline-none transition"
            />
            {searching && (
              <RefreshCw
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white animate-spin"
              />
            )}
          </div>
          <button
            onClick={loadData}
            title="Refresh Data"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/20 text-white transition"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/20 text-white transition">
            <QrCode size={16} />
          </button>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/20 text-white transition">
            <Bell size={16} />
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
              3
            </span>
          </button>
        </div>
      </header>

      {/* ══════════════ 2. SUB-HEADER CONTROLS BAR ══════════════ */}
      <div className="flex-none flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-white border-b border-slate-200 shadow-2xs z-10">
        <div className="flex flex-wrap items-center gap-3 text-gray-600">
          <button
            onClick={() => {
              setTableModalStep(1);
              setShowSelectTableModal(true);
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-orange-50 hover:border-orange-300 transition cursor-pointer"
            title="Select Section and Table"
          >
            <LayoutGrid size={15} className="text-orange-600" />
            <span className="text-xs font-medium text-gray-500">Table:</span>
            <span className="text-xs font-bold text-gray-700">
              {selectedTable ? `${selectedTable.tableNo} (${selectedTable.capacity} Seats)` : "Select Table"}
            </span>
            {selectedTable?.floorName && (
              <span className="text-[10px] bg-orange-100 text-orange-700 font-semibold px-1.5 py-0.5 rounded">
                {selectedTable.floorName}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <Users size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Guests:</span>
            <button
              onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
              disabled={guestCount <= 1}
              className={`flex h-5 w-5 items-center justify-center rounded-md border font-bold ${
                guestCount <= 1
                  ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                  : "bg-white border-slate-200 text-gray-700 hover:bg-slate-100 cursor-pointer"
              }`}
            >
              <Minus size={11} />
            </button>
            <span className="text-xs font-bold text-gray-600 min-w-4 text-center">
              {guestCount}
            </span>
            <button
              onClick={() => setGuestCount((g) => g + 1)}
              className="flex h-5 w-5 items-center justify-center rounded-md bg-white border border-slate-200 text-gray-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              <Plus size={11} />
            </button>
          </div>

          {/* Waiter / Staff Button (Modal trigger instead of dropdown) */}
          <button
            onClick={() => {
              setTableModalStep(3);
              setShowSelectTableModal(true);
            }}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-orange-50 hover:border-orange-300 transition cursor-pointer"
            title="Assign or change staff/waiter"
          >
            <ChefHat size={15} className="text-orange-600" />
            <span className="text-xs font-medium text-gray-500">Staff:</span>
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              {waiterName || "Assign Staff"}
              <span className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded font-semibold">
                Change
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <Users size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Name:</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Optional"
              className="bg-transparent text-xs font-bold text-gray-600 focus:outline-none w-24 placeholder:text-gray-300"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <span className="text-xs font-medium text-gray-500">Phone:</span>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Optional"
              className="bg-transparent text-xs font-bold text-gray-600 focus:outline-none w-24 placeholder:text-gray-300"
            />
          </div>

          {/* ── MEAL SHIFT BADGE / DIALOG TRIGGER (ALWAYS DISPLAYED NEXT TO WAITER) ── */}
          <button
            type="button"
            onClick={() => setShowShiftDetailsModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-50/95 to-orange-50/85 hover:from-amber-100 hover:to-orange-100/90 border border-amber-300 hover:border-amber-400 rounded-md px-3 py-1.5 shadow-2xs transition-all duration-150 cursor-pointer text-left"
            title="Click to view & manage today's Meal Shifts / Demand Overlaps"
          >
            <Clock size={15} className="text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-900 shrink-0">Shift:</span>
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 min-w-0">
              {activeSlots.length === 0 ? (
                <span className="text-slate-600 font-bold flex items-center gap-1">
                  <span>General / All-Day Menu</span>
                </span>
              ) : activeSlots.length === 1 ? (
                <span className="flex items-center gap-1.5">
                  <span className="font-black text-gray-600">{activeSlots[0].name}</span>
                  <span className="text-[11px] font-extrabold text-amber-800 font-mono">
                    ({activeSlots[0].startTime} – {activeSlots[0].endTime})
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-orange-900 font-black">
                  <span>🔥 {activeSlots.map((s) => s.name).join(" + ")}</span>
                  <span className="text-[10px] bg-orange-100 border border-orange-300 px-1.5 py-0.2 rounded-full font-extrabold text-orange-800">
                    {activeSlots.length} Active
                  </span>
                </span>
              )}
            </span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-200/80 text-amber-900 text-[10px] ml-1 shrink-0 font-bold">
              <Info size={11} />
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleHoldOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-orange-200 bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 transition cursor-pointer"
          >
            <PauseCircle size={14} /> Hold
          </button>
          <button
            onClick={() => setShowHoldModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition cursor-pointer"
          >
            <RotateCcw size={14} /> Recall ({heldOrders.length})
          </button>
          <button
            onClick={() => toast.info("Split Bill feature active")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
          >
            <Split size={14} /> Split
          </button>
          <button
            onClick={() => toast.info("Transfer Table feature active")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
          >
            <ArrowRightLeft size={14} /> Transfer
          </button>
          <button
            onClick={() => {
              if (cart.length > 0) setShowClearConfirm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition cursor-pointer"
          >
            <Trash2 size={14} /> Clear Order
          </button>
        </div>
      </div>

      {/* ══════════════ 3. MAIN POS WORKSPACE ══════════════ */}
      <div className="flex-1 min-h-0 flex gap-3 p-3 overflow-hidden">
        {/* ── LEFT CATEGORY SIDEBAR ── */}
        <aside className="w-56 sm:w-64 flex-none flex flex-col justify-between rounded-xl bg-white border border-slate-200 p-2.5 shadow-2xs overflow-hidden">
          <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const hasSubcats = cat.subcategories && cat.subcategories.length > 0;
              const count = products.filter((p) => {
                if (cat.id === "All Items") return true;
                if (cat.id === "Popular") return p.isPopular;
                const pCat = getCategoryName(p.category);
                return pCat.toLowerCase() === cat.id.toLowerCase();
              }).length;

              return (
                <div key={cat.id} className="space-y-1">
                  {/* Main Category Button */}
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20 border border-orange-600"
                        : "bg-white text-gray-700 border border-slate-100 hover:bg-orange-50/80 hover:text-orange-600 hover:border-orange-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {Icon && (
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-orange-50 text-orange-600 border border-orange-100"
                          }`}
                        >
                          <Icon size={15} />
                        </div>
                      )}
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isSelected
                          ? "bg-white/25 text-white"
                          : "bg-slate-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowCustomItemModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-orange-400 bg-orange-50/70 text-orange-700 text-xs font-bold hover:bg-orange-100 transition cursor-pointer"
            >
              <ChefHat size={16} className="text-orange-600" /> Custom Item
            </button>
          </div>
        </aside>

        {/* ── CENTER MENU ITEMS GRID ── */}
        <main className="flex-1 flex flex-col rounded-xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
          {/* ── ACTIVE SHIFT BANNER (DISPLAYED WHEN SHIFT FILTER IS ON) ── */}
          {timeSlotFilterEnabled && (
            <div className="flex-none p-2.5 px-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-b border-amber-300/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs shrink-0">
                  <Clock size={15} />
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-[11px] font-black capitalize tracking-wider text-amber-900 shrink-0">
                    POS Shift:
                  </span>
                  {activeSlots.length === 0 ? (
                    <span className="text-xs text-gray-700 font-bold flex items-center gap-1.5">
                      <span>No shift active for current hour (Showing full menu)</span>
                    </span>
                  ) : activeSlots.length === 1 ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold text-gray-600">{activeSlots[0].name}</span>
                      <span className="text-[11px] font-bold text-amber-800 font-mono">
                        ({activeSlots[0].startTime} – {activeSlots[0].endTime})
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-orange-900 font-black">
                      <span>🔥 {activeSlots.map((s) => s.name).join(" + ")}</span>
                      <span className="text-[10px] bg-orange-100 border border-orange-300 px-1.5 py-0.2 rounded-full font-extrabold text-orange-800">
                        {activeSlots.length} Active Concurrently
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowShiftDetailsModal(true)}
                  className="px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Click to view & manage shifts or start early/extend demand"
                >
                  <Clock size={13} className="text-amber-600" />
                  <span>Shift Schedule &amp; Demand</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-none p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xs font-bold text-gray-600 tracking-tight flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50" />
              {selectedCategory} ({filteredProducts.length})
            </h2>
            <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-md text-xs font-bold transition ${
                  viewMode === "grid"
                    ? "bg-white text-orange-600 shadow-2xs"
                    : "text-gray-500 hover:text-gray-600"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-md text-xs font-bold transition ${
                  viewMode === "list"
                    ? "bg-white text-orange-600 shadow-2xs"
                    : "text-gray-500 hover:text-gray-600"
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {loading ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <RefreshCw size={24} className="mx-auto animate-spin text-orange-500" />
                <p className="text-xs font-medium">Loading food products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <ShoppingBag size={32} className="mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">No products found</p>
                <p className="text-[11px] text-gray-400">
                  Try selecting another category or add items from Products module.
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5"
                    : "space-y-2.5"
                }
              >
                {filteredProducts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleProductAction(item)}
                    className={`group relative flex rounded-2xl border border-gray-200 bg-white shadow-sm hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden ${
                      viewMode === "list"
                        ? "flex-row items-center p-2.5 gap-3"
                        : "flex-col justify-between"
                    }`}
                  >
                    {/* Dish Image / Placeholder Container (Flush on top, left, right in Grid View) */}
                    <div
                      className={`relative overflow-hidden bg-gradient-to-br from-amber-50/50 to-orange-50/30 flex items-center justify-center shrink-0 ${
                        viewMode === "list"
                          ? "h-16 w-16 rounded-lg"
                          : "h-28 sm:h-30 w-full border-b border-gray-100"
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-slate-400 bg-slate-100 h-full w-full">
                          <Utensils size={28} className="text-slate-400 opacity-60" />
                        </div>
                      )}

                      {/* Real Badges & Custom Addons Badge */}
                      <div className="absolute left-2 top-2 flex flex-wrap items-center gap-1 z-10">
                        {isItemCustomizable(item) && (
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black shadow-xs tracking-wider capitalize"
                            title="Custom Add-ons Available"
                          >
                            <SlidersHorizontal size={9} strokeWidth={3} /> Custom
                          </span>
                        )}
                        {item.isPopular && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-xs"
                            title="Popular Item"
                          >
                            <Star size={10} fill="white" /> Popular
                          </span>
                        )}
                        {item.isVeg && (
                          <span
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-xs"
                            title="Vegetarian"
                          >
                            <Leaf size={10} fill="white" /> Veg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Price (inline, one line) & Right Add Button Row */}
                    <div
                      className={`flex items-center justify-between gap-2 ${
                        viewMode === "list" ? "flex-1 min-w-0" : "p-3 w-full flex-1 min-w-0"
                      }`}
                    >
                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <h3 className="font-bold text-xs sm:text-sm text-gray-600 truncate group-hover:text-orange-600 transition min-w-0 flex-1">
                          {item.name}
                        </h3>
                        <span className="font-black text-xs sm:text-sm text-orange-600 tabular-nums shrink-0 whitespace-nowrap">
                          {fmt(item.sellingPrice)}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductAction(item);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-xs hover:from-orange-700 hover:to-amber-600 transition cursor-pointer shrink-0"
                        title={isItemCustomizable(item) ? "Customize Add-ons & Add" : "Add to Order"}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Toolbar Row under Menu */}
          <div className="flex-none p-2.5 border-t border-slate-200 bg-slate-50/70 grid grid-cols-6 gap-2">
            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Apply Coupon Code",
                  placeholder: "e.g. SAVE10",
                  inputType: "text",
                  onSubmit: (code) => {
                    if (code) toast.success(`Coupon "${code}" applied!`);
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Tag size={13} className="text-orange-600" /> Coupon
            </button>

            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Enter Discount Percentage (%)",
                  placeholder: "10",
                  defaultValue: String(discountPercent || 10),
                  inputType: "number",
                  onSubmit: (pct) => {
                    if (pct) setDiscountPercent(Number(pct));
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Percent size={13} className="text-orange-600" /> Discount
            </button>

            <button
              onClick={() => toast.info("Promo Campaign applied")}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Gift size={13} className="text-orange-600" /> Promo
            </button>

            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Add Order Note",
                  placeholder: "Enter special order notes...",
                  defaultValue: orderNote,
                  inputType: "textarea",
                  onSubmit: (n) => {
                    setOrderNote(n);
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <FileText size={13} className="text-orange-600" /> Note
            </button>

            <button
              onClick={() => {
                setPromptModalState({
                  isOpen: true,
                  title: "Kitchen Note for Chef",
                  placeholder: "Add instructions for kitchen...",
                  inputType: "textarea",
                  onSubmit: (kn) => {
                    if (kn) toast.success("Kitchen note attached!");
                  },
                });
              }}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <ChefHat size={13} className="text-orange-600" /> Kitchen Note
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-bold text-gray-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <Printer size={13} className="text-orange-600" /> Print
            </button>
          </div>
        </main>

        {/* ── RIGHT ORDER SUMMARY PANEL ── */}
        <aside className="w-80 sm:w-96 flex-none flex flex-col rounded-xl bg-white border border-slate-200 shadow-md overflow-hidden">
          {/* ── HEADER ── */}
          <div className="flex-none px-4 py-3.5 border-b border-orange-100 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-400">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm text-white shadow-inner">
                  <FileText size={15} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xs font-black uppercase tracking-widest text-white/90 leading-tight">Order Summary</h2>
                  <p className="text-[10px] font-semibold text-orange-100 truncate leading-tight mt-0.5">
                    {selectedTable ? `${selectedTable.tableNo} · ${guestCount} Guest${guestCount === 1 ? "" : "s"}` : "No table selected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-full bg-white text-orange-600 px-2.5 py-0.5 text-[10px] font-black shadow-sm">
                  {cart.length} {cart.length === 1 ? "Item" : "Items"}
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    title="Clear all items"
                    className="p-1.5 rounded-md text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Cart Items ── */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-gradient-to-b from-slate-50/80 to-white custom-scrollbar">
            {cart.length === 0 ? (
              <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/30 py-16 text-center text-gray-400 space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <ShoppingBag size={26} className="text-orange-300" />
                </div>
                <p className="text-sm font-bold text-gray-500">Cart is empty</p>
                <p className="text-[11px] text-gray-400 max-w-[230px] mx-auto leading-relaxed">
                  Pick a section table, then tap food items to build this order.
                </p>
              </div>
) : (
              cart.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden">
                  <div className="p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Product Image / Placeholder */}
                      <div className="relative shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="h-12 w-12 rounded-xl border border-orange-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-orange-200 bg-gradient-to-br from-orange-100 to-amber-100">
                            <ChefHat size={22} className="text-orange-500" />
                          </div>
                        )}
                        {item.isKitchenProduct === false && (
                          <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white" title="Ready-to-serve item">
                            <span className="text-[7px] font-black leading-none">✓</span>
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="text-sm font-bold text-gray-800 truncate min-w-0 flex-1">{item.name}</h4>
                          <span className="text-sm font-black text-gray-900 whitespace-nowrap tabular-nums shrink-0">
                            {fmt((item.qty * item.unitPrice) + (item.extras?.reduce((s, e) => s + e.price, 0) || 0))}
                          </span>
                        </div>

                        {/* Size / Spice / Options */}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.modifiers.map((mod, mIdx) => (
                              <span
                                key={mIdx}
                                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                                  mod.label === "Size"
                                    ? "bg-orange-100 border border-orange-300 text-orange-800"
                                    : mod.label === "Spice"
                                      ? "bg-rose-50 border border-rose-200 text-rose-600"
                                      : "bg-amber-50 border border-amber-200 text-amber-700"
                                }`}
                              >
                                <span className="font-black">{mod.label}:</span> {mod.value.replace(/ \(.*?\)$/, "")}
                              </span>
                            ))}
                          </div>
                        )}{/* Extras/Add-ons */}
                        {item.extras && item.extras.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.extras.map((ext, eIdx) => (
                              <span
                                key={eIdx}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 whitespace-nowrap"
                              >
                                +{ext.label} <span className="font-black">{fmt(ext.price)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* KOT status / notes */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {item.isKitchenProduct === false ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                              ⚡ Ready Item
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                                item.kotStatus === "SENT_TO_KITCHEN"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-gray-600"
                              }`}
                            >
                              🍳 {item.kotStatus === "SENT_TO_KITCHEN" ? "KOT Sent" : "KOT Pending"}
                            </span>
                          )}
                          <button
                            onClick={() => handleEditCartItemAddons(item)}
                            className="inline-flex items-center gap-0.5 text-[10px] font-bold text-orange-500 hover:text-orange-600 transition cursor-pointer whitespace-nowrap"
                          >
                            <Edit3 size={10} /> Edit
                          </button>
                        </div>

                        {item.notes && (
                          <p className="mt-1 text-[10px] text-orange-600 italic truncate">
                            &quot;{item.notes}&quot;
                          </p>
                        )}

                        {/* qty stepper + remove */}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-gray-600 font-bold hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-7 text-center text-sm font-black text-gray-800 tabular-nums">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold shadow-sm hover:from-orange-600 hover:to-amber-600 transition cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeCartItem(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Order Note ── */}
          <div className="px-3 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add Order Note..."
                className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition"
              />
              <FileText size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>{/* ── Summary + Actions ── */}
          <div className="flex-none p-4 bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200 space-y-3">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold text-gray-700">{fmt(subTotal)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span className="font-bold">−{fmt(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Tax</span>
                <span className="font-medium">{fmt(estimateTax)}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Service Charge</span>
                <span className="font-medium">{fmt(estimateService)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-dashed border-slate-300">
                <span className="text-xs uppercase font-black text-gray-500 tracking-wider">
                  Total Payable
                </span>
                <span className="text-2xl font-black text-orange-600 tabular-nums tracking-tight">
                  {fmt(estimateGrandTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={sendKotToKitchen}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 hover:border-amber-400 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flame size={14} className="text-amber-600" /> KOT to Kitchen
              </button>

              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white font-bold text-xs hover:from-orange-600 hover:via-amber-600 hover:to-orange-600 transition cursor-pointer shadow-md shadow-orange-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag size={15} /> Place Order
                </span>
                <div className="flex items-center gap-1.5 bg-white/20 rounded-md px-2 py-0.5">
                  <span className="tabular-nums font-black">{fmt(estimateGrandTotal)}</span>
                  <ChevronLeft size={14} className="rotate-180" />
                </div>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Custom Item Modal */}
      <CustomModal
        open={showCustomItemModal}
        onClose={() => setShowCustomItemModal(false)}
        title="Add Custom Item"
        size="sm"
      >
        <form onSubmit={handleAddCustomItem} className="space-y-4">
          <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-xl border border-orange-100 mb-2">
            <ChefHat className="text-orange-600" size={20} />
            <p className="text-xs font-bold text-orange-800 capitalize tracking-wider">Quick Menu Entry</p>
          </div>

          <CustomInput
            label="Item Name"
            required
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Special Chef Salad"
          />

          <CustomInput
            label="Price (৳)"
            type="number"
            required
            min="1"
            value={customPrice}
            onChange={(e) => setCustomPrice(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-2">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => setShowCustomItemModal(false)}
            >
              Cancel
            </CustomButton>
            <CustomButton
              type="submit"
              themeColor="orange"
            >
              Add Item
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      <CustomModal
        open={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        title="Recall Held Orders"
        size="md"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
          {heldOrders.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <RotateCcw size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold capitalize tracking-widest">No held orders found</p>
            </div>
          ) : (
            heldOrders.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:border-orange-200 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-gray-600 capitalize font-mono tracking-tighter">#{h.id}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100 capitalize tracking-widest">Table {h.table?.tableNo || "N/A"}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 capitalize tracking-tight">
                    {h.cart.length} items • Waiter: {h.waiterName} • {h.time}
                  </p>
                </div>
                <CustomButton
                  size="sm"
                  themeColor="orange"
                  onClick={() => handleRecallOrder(h)}
                >
                  Recall
                </CustomButton>
              </div>
            ))
          )}
        </div>
      </CustomModal>

      <CustomModal
        open={!!completedBill}
        onClose={() => setCompletedBill(null)}
        title=""
        size="md"
      >
        {/* ── Custom Orange Header ── */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 -mx-6 -mt-5 mb-5 px-6 py-4 flex items-center gap-2.5 rounded-t-md">
          <FileText size={20} className="text-white" />
          <h2 className="text-lg font-bold text-white tracking-wide">Bill Print</h2>
        </div>

        {/* ── Printable Receipt (wrapped for CSS print) ── */}
        <div id="restaurant-receipt" className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">

          {/* Store Name */}
          <div className="text-center space-y-1">
            <h3 className="text-xl font-bold text-slate-800">{storeName}</h3>
            <p className="text-sm text-slate-500">{branchName}{branchAddress ? `, ${branchAddress}` : ""}</p>
          </div>

          {/* Dashed Separator */}
          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Table / Waiter / Date */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Table</span>
              <span className="font-semibold text-slate-700">{completedBill?.table?.tableNo || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waiter</span>
              <span className="font-semibold text-slate-700">{completedBill?.waiterName || "N/A"}</span>
            </div>
            {completedBill?.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-700">{completedBill.customerName}</span>
              </div>
            )}
            {completedBill?.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500">Phone</span>
                <span className="font-semibold text-slate-700">{completedBill.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-700">
                {completedBill && new Date(completedBill.date).toLocaleString("en-BD", {
                  year: "numeric", month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", hour12: false,
                })}
              </span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Items Table Header */}
          <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
            <div className="col-span-6">Item</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-4 text-right">Price</div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            {(completedBill?.items || []).map((item: any, idx: number) => (
              <div key={idx} className="text-sm">
                <div className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-6 font-semibold text-slate-700 capitalize">{item.name}</div>
                  <div className="col-span-2 text-center text-slate-600">{item.qty}</div>
                  <div className="col-span-4 text-right font-semibold text-slate-700">{fmt(item.qty * item.unitPrice)}</div>
                </div>
                {/* Modifiers */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5 pl-0">
                    {item.modifiers.map((m: any) => m.value || m.label).join(", ")}
                  </p>
                )}
                {item.extras && item.extras.length > 0 && (
                  <p className="text-xs text-slate-400 mt-0.5 pl-0">
                    {item.extras.map((e: any) => e.label).join(", ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs italic text-orange-500 mt-0.5 pl-0">&quot;{item.notes}&quot;</p>
                )}
              </div>
            ))}
          </div>

          {/* Dashed Separator */}
          <div className="border-t-2 border-dashed border-slate-300" />

          {/* Financial Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{fmt(completedBill?.subTotal || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{fmt(completedBill?.taxAmount || 0)}</span>
            </div>
            {(completedBill?.serviceCharge ?? 0) > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Service Charge</span>
                <span>{fmt(completedBill?.serviceCharge || 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-orange-600 pt-2 border-t border-orange-200">
              <span>Total Payable</span>
              <span>{fmt(completedBill?.grandTotal || 0)}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-2">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <QRCodeSVG value={completedBill?.invoiceNo || "N/A"} size={80} level="M" />
            </div>
          </div>

          {/* Thank You */}
          <p className="text-center text-sm italic text-slate-400">Thank you for visiting!</p>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 mt-5 no-print">
          <CustomButton
            fullWidth
            variant="outline"
            onClick={() => setCompletedBill(null)}
          >
            Cancel
          </CustomButton>
          <CustomButton
            fullWidth
            themeColor="orange"
            onClick={() => window.print()}
            leftIcon={<Printer size={16} />}
          >
            Print Now
          </CustomButton>
        </div>
      </CustomModal>

      {/* Confirm Clear Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setCart([]);
          // ── Booking flow: clearing the order frees the table too ──
          if (selectedTable) {
            const clearedTableId = selectedTable.id;
            setTables((prev) =>
              prev.map((x) => (x.id === clearedTableId ? { ...x, status: "AVAILABLE" as const } : x))
            );
            api.patch(`/v1/restaurant/tables/${clearedTableId}/status`, { status: "AVAILABLE" }).catch(() => {});
          }
          setShowClearConfirm(false);
          toast.info("Cart cleared successfully");
        }}
        type="DANGER"
        title="Clear Current Order?"
        message="Are you sure you want to remove all items from this table's order?"
        confirmText="Clear Order"
        cancelText="Cancel"
      />

      {/* ══════════════ UNIFIED ORDER SETUP MODAL (Section → Table → Staff) ══════════════ */}
      <CustomModal
        open={showSelectTableModal}
        onClose={() => setShowSelectTableModal(false)}
        title="Order Setup: Section, Table & Staff"
        size="2xl"
      >
        <div className="space-y-4">
          {/* ── STEPPER NAVIGATION HEADER ── */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 px-1">
            <div className="flex items-center gap-1.5 sm:gap-3 w-full">
              {/* Step 1: Section */}
              <button
                type="button"
                onClick={() => setTableModalStep(1)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tableModalStep === 1
                    ? "bg-orange-600 text-white shadow-sm"
                    : tableModalFloorId
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    tableModalStep === 1
                      ? "bg-white text-orange-600"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  1
                </span>
                <span>1. Section</span>
                {tableModalFloorId && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
              </button>

              <div className="h-0.5 w-4 sm:w-8 bg-slate-200" />

              {/* Step 2: Table */}
              <button
                type="button"
                onClick={() => setTableModalStep(2)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tableModalStep === 2
                    ? "bg-orange-600 text-white shadow-sm"
                    : selectedTable
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    tableModalStep === 2
                      ? "bg-white text-orange-600"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  2
                </span>
                <span>2. Table</span>
                {selectedTable && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
              </button>

              <div className="h-0.5 w-4 sm:w-8 bg-slate-200" />

              {/* Step 3: Staff */}
              <button
                type="button"
                onClick={() => setTableModalStep(3)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tableModalStep === 3
                    ? "bg-orange-600 text-white shadow-sm"
                    : waiterName
                    ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                    tableModalStep === 3
                      ? "bg-white text-orange-600"
                      : "bg-orange-200 text-orange-800"
                  }`}
                >
                  3
                </span>
                <span>3. Staff / Waiter</span>
                {waiterName && <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />}
              </button>
            </div>
          </div>

          {/* ════════ STEP 1 CONTENT: CHOOSE SECTION ════════ */}
          {tableModalStep === 1 && (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Select Dining Section / Floor</h4>
                  <p className="text-xs text-gray-400">Choose the dining area or floor for this order</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTableModalFloorId("");
                    setTableModalStep(2);
                  }}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                >
                  Show All Tables →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {floors.map((f) => {
                  const floorTables = tables.filter((t) => t.floorId === f.id);
                  const availableCount = floorTables.filter((t) => t.status === "AVAILABLE").length;
                  const isFloorActive = tableModalFloorId === f.id;

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setTableModalFloorId(f.id);
                        setTableModalStep(2);
                      }}
                      className={`flex flex-col p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        isFloorActive
                          ? "border-orange-500 bg-orange-50/80 ring-2 ring-orange-200 shadow-xs"
                          : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                          <Building2 size={16} />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {availableCount} Free
                        </span>
                      </div>
                      <h5 className="font-black text-gray-800 text-sm mt-2">{f.name}</h5>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {floorTables.length} Tables Total
                      </p>
                    </button>
                  );
                })}

                {/* All Sections Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTableModalFloorId("");
                    setTableModalStep(2);
                  }}
                  className="flex flex-col p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-white hover:border-orange-300 text-left transition cursor-pointer"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                    <LayoutGrid size={16} />
                  </div>
                  <h5 className="font-black text-gray-800 text-sm mt-2">All Sections</h5>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    Show all {tables.length} tables
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* ════════ STEP 2 CONTENT: PICK TABLE ════════ */}
          {tableModalStep === 2 && (
            <div className="space-y-3 py-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {tableModalFloorId
                      ? `${floors.find((f) => f.id === tableModalFloorId)?.name || "Section"} Tables`
                      : "All Dining Tables"}
                  </h4>
                  <p className="text-xs text-gray-400">Click a free table to select and proceed to staff</p>
                </div>

                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Free</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Busy</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Reserved</span>
                </div>
              </div>

              <div className="custom-scrollbar max-h-[46vh] overflow-y-auto pr-1">
                {tableModalTables.length === 0 ? (
                  <div className="py-10 text-center">
                    <Armchair size={36} className="mx-auto text-slate-200" />
                    <p className="mt-2 text-xs font-bold text-slate-400">No tables found in this section</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                    {tableModalTables.map((t) => {
                      const isSelected = selectedTable?.id === t.id;
                      const isReserved = t.status === "RESERVED";
                      const isBusy = t.status === "OCCUPIED" || t.status === "BILLING";
                      const isAvailable = t.status === "AVAILABLE";

                      return (
                        <button
                          key={t.id}
                          disabled={!isAvailable && !isSelected}
                          onClick={() => {
                            if (!isAvailable && !isSelected) return;
                            const previous = selectedTable;
                            if (previous && previous.id !== t.id) {
                              setTables((prev) =>
                                prev.map((x) => (x.id === previous.id ? { ...x, status: "AVAILABLE" as const } : x))
                              );
                              api.patch(`/v1/restaurant/tables/${previous.id}/status`, { status: "AVAILABLE" }).catch(() => {});
                            }
                            setTables((prev) =>
                              prev.map((x) => (x.id === t.id ? { ...x, status: "RESERVED" as const } : x))
                            );
                            api.patch(`/v1/restaurant/tables/${t.id}/status`, { status: "RESERVED" }).catch(() => {});
                            setSelectedTable(t);
                            // Automatically step forward to Step 3: Staff!
                            setTableModalStep(3);
                            toast.info(`Table ${t.tableNo} selected! Now choose staff.`);
                          }}
                          className={`rounded-xl border p-3 text-left transition duration-150 cursor-pointer ${
                            isSelected
                              ? "border-orange-500 bg-orange-500 text-white ring-2 ring-orange-200 shadow-sm"
                              : !isAvailable
                              ? isReserved
                                ? "border-purple-200 bg-purple-50 opacity-80 cursor-not-allowed"
                                : "border-amber-200 bg-amber-50 opacity-80 cursor-not-allowed"
                              : "border-slate-200 bg-white hover:border-orange-400 hover:bg-orange-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`truncate text-sm font-black tracking-tight ${isSelected ? "text-white" : "text-gray-800"}`}>
                              {t.tableNo}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 size={15} className="shrink-0 text-white" />
                            ) : (
                              <span className={`h-2 w-2 shrink-0 rounded-full ${isReserved ? "bg-purple-500" : isBusy ? "bg-amber-500" : "bg-emerald-500"}`} />
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${isSelected ? "text-orange-100" : "text-slate-400"}`}>
                              <Users size={10} strokeWidth={2.5} /> {t.capacity} Seats
                            </span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : isReserved
                                ? "bg-purple-100 text-purple-600"
                                : isBusy
                                ? "bg-amber-100 text-amber-600"
                                : "bg-emerald-100 text-emerald-600"
                            }`}>
                              {isReserved ? "Reserved" : isBusy ? "Busy" : "Free"}
                            </span>
                          </div>

                          {isBusy && t.currentBill ? (
                            <div className={`mt-2 rounded-md px-2 py-1 text-[9px] font-bold ${isSelected ? "bg-white/15 text-white" : "bg-amber-100/70 text-amber-700"}`}>
                              Bill ৳{t.currentBill}{t.guestCount ? ` · ${t.guestCount} guests` : ""}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ STEP 3 CONTENT: ASSIGN STAFF / WAITER ════════ */}
          {tableModalStep === 3 && (
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Assign Staff / Server</h4>
                  <p className="text-xs text-gray-400">Select the waiter or captain taking care of this table</p>
                </div>
                {waiterName && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                    Current: {waiterName}
                  </span>
                )}
              </div>

              {/* Staff Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {staffList.map((staff) => {
                  const isStaffActive = waiterName.toLowerCase() === staff.name.toLowerCase();

                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setWaiterName(staff.name);
                        setShowSelectTableModal(false);
                        toast.success(`${staff.name} assigned to ${selectedTable?.tableNo || "Order"}!`);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                        isStaffActive
                          ? "border-orange-500 bg-orange-50/80 ring-2 ring-orange-200 shadow-xs"
                          : "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black text-sm shadow-2xs ${
                          isStaffActive
                            ? "bg-orange-600 text-white"
                            : staff.avatarColor || "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {staff.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-black text-gray-800 text-sm truncate">{staff.name}</h5>
                          {isStaffActive && <CheckCircle2 size={15} className="text-orange-600 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium truncate">
                          {staff.role || "Waiter"}
                        </p>
                        {staff.shift && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {staff.shift}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Staff Input */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 shrink-0">Or type custom name:</span>
                <input
                  type="text"
                  value={customStaffName}
                  onChange={(e) => setCustomStaffName(e.target.value)}
                  placeholder="Enter staff name..."
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customStaffName.trim()) {
                      setWaiterName(customStaffName.trim());
                      setCustomStaffName("");
                      setShowSelectTableModal(false);
                      toast.success(`${customStaffName.trim()} assigned to table!`);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!customStaffName.trim()}
                  onClick={() => {
                    if (customStaffName.trim()) {
                      setWaiterName(customStaffName.trim());
                      setCustomStaffName("");
                      setShowSelectTableModal(false);
                      toast.success(`${customStaffName.trim()} assigned to table!`);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Set Staff
                </button>
              </div>
            </div>
          )}

          {/* ── MODAL FOOTER ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Order Setup:</span>
              {tableModalFloorId && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                  Section: {floors.find((f) => f.id === tableModalFloorId)?.name || "Section"}
                </span>
              )}
              {selectedTable && (
                <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold">
                  Table: {selectedTable.tableNo} ({selectedTable.capacity} Seats)
                </span>
              )}
              {waiterName && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                  Staff: {waiterName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {tableModalStep > 1 && (
                <button
                  type="button"
                  onClick={() => setTableModalStep((s) => (s > 1 ? ((s - 1) as any) : s))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-gray-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  ← Back
                </button>
              )}

              {tableModalStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setTableModalStep((s) => (s < 3 ? ((s + 1) as any) : s))}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSelectTableModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Confirm & Close
                </button>
              )}
            </div>
          </div>
        </div>
      </CustomModal>

      {/* ══════════════ MEAL SHIFT DETAILS MODAL ══════════════ */}
      <CustomModal
        open={showShiftDetailsModal}
        onClose={() => setShowShiftDetailsModal(false)}
        title="Restaurant Meal Shifts Schedule"
        size="5xl"
      >
        <div className="space-y-5">
          {/* Active Shifts Overview Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-300/80 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/20">
                <Clock size={24} />
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-amber-900 capitalize tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Today's Real-time Active Shifts &amp; Demand Overlaps</span>
                </div>
                <div className="text-base sm:text-lg font-black text-gray-600 flex items-center gap-2.5 flex-wrap mt-0.5">
                  {activeSlots.length === 0 ? (
                    <span className="text-gray-600">No Shifts Active (Full Menu Catalog Available)</span>
                  ) : activeSlots.length === 1 ? (
                    <>
                      <span>{activeSlots[0].name}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        ACTIVE NOW ({activeSlots[0].startTime} – {activeSlots[0].endTime})
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-orange-800 font-black flex-wrap">
                      <span>🔥 {activeSlots.map((s) => s.name).join(" + ")}</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-900 border border-orange-300 shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                        {activeSlots.length} Shifts Running Simultaneously
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap self-end sm:self-center">
              {Object.keys(todayOverrides).length > 0 && (
                <button
                  type="button"
                  disabled={overrideLoading}
                  onClick={() => handleShiftOverride("all", "RESET_ALL")}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-amber-900 text-xs font-bold hover:bg-amber-100/70 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw size={13} className={overrideLoading ? "animate-spin text-amber-600" : "text-amber-600"} />
                  <span>Reset All to Schedule</span>
                </button>
              )}
              <div className="bg-white/90 border border-amber-200/90 rounded-xl px-3.5 py-1.5 text-center">
                <div className="text-gray-500 text-[10px] font-medium">POS Filtering</div>
                <div className="font-black text-emerald-700 text-xs">
                  {timeSlotFilterEnabled ? "● Auto-Filter ON" : "○ Filter OFF"}
                </div>
              </div>
            </div>
          </div>

          {/* Shifts 3-Column Grid Design */}
          <div className="max-h-[490px] overflow-y-auto pr-1 custom-scrollbar">
            {timeSlots.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-3">
                <Clock size={40} className="mx-auto text-gray-300" />
                <p className="text-sm font-bold text-gray-600">No meal shifts configured yet</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Configure your restaurant meal shifts in the Restaurant Dashboard settings tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {timeSlots.map((slot) => {
                  const isCurActive = Boolean(slot.isCurrentlyActive ?? activeSlotIds.includes(slot.id));
                  const override = todayOverrides[slot.id];
                  const slotColor = slot.color || "#f59e0b";

                  return (
                    <div
                      key={slot.id}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all duration-200 ${
                        isCurActive
                          ? "bg-gradient-to-b from-amber-50/95 via-orange-50/40 to-white border-amber-400 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/80"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      {/* Top Header: Shift Name + Live Status */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white"
                              style={{ backgroundColor: slotColor }}
                            />
                            <h3 className="text-sm font-black text-gray-600 truncate">
                              {slot.name}
                            </h3>
                          </div>

                          {override?.action === "FORCE_ACTIVE" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black capitalize tracking-wider bg-orange-100 text-orange-900 border border-orange-300 shrink-0 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
                              Started Early Today
                            </span>
                          ) : override?.action === "EXTEND_1H" || override?.action === "EXTEND_30M" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black capitalize tracking-wider bg-blue-100 text-blue-900 border border-blue-300 shrink-0 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                              Extended Today
                            </span>
                          ) : override?.action === "FORCE_INACTIVE" ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold capitalize bg-slate-100 text-slate-600 shrink-0">
                              Ended Early Today
                            </span>
                          ) : isCurActive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black capitalize tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active (Scheduled)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                              Scheduled
                            </span>
                          )}
                        </div>

                        {/* Scheduled Master Time */}
                        <div className="my-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-amber-600" />
                            <span className="text-xs font-black text-gray-600 font-mono tracking-tight">
                              {slot.startTime} – {slot.endTime}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            Master Schedule
                          </span>
                        </div>

                        {/* Days / Description / Override details */}
                        <div className="space-y-1 mt-1 text-[11px] text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <span>📅</span>
                            <span className="truncate font-medium">{formatDaysOfWeek(slot.daysOfWeek)}</span>
                          </div>
                          {override?.untilTime && (
                            <div className="text-blue-700 font-bold bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                              ⏳ Active Until {override.untilTime} ({override.extendedBy})
                            </div>
                          )}
                          {slot.description && !override && (
                            <p className="text-gray-500 line-clamp-1 italic text-[11px]">
                              {slot.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Demand Management Actions Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                        <div className="text-[10px] font-extrabold capitalize tracking-wider text-gray-400">
                          Today's Demand Controls
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCurActive ? (
                            <>
                              {/* Active actions: End Early, Extend +1h, Extend +30m */}
                              <button
                                type="button"
                                disabled={overrideLoading}
                                onClick={() => handleShiftOverride(slot.id, "END_EARLY")}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                                title="End this shift right now for today"
                              >
                                <Square size={10} className="fill-rose-700" /> End Early
                              </button>

                              <button
                                type="button"
                                disabled={overrideLoading}
                                onClick={() => handleShiftOverride(slot.id, "EXTEND_1H")}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 cursor-pointer"
                                title="Extend shift closing time by 1 hour"
                              >
                                ⏳ +1h Late
                              </button>

                              <button
                                type="button"
                                disabled={overrideLoading}
                                onClick={() => handleShiftOverride(slot.id, "EXTEND_30M")}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                                title="Extend shift closing time by 30 mins"
                              >
                                ⏳ +30m
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Inactive actions: Start / Collate Now */}
                              <button
                                type="button"
                                disabled={overrideLoading}
                                onClick={() => handleShiftOverride(slot.id, "START_NOW")}
                                className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                                title="Start this shift early or collate alongside other active shifts"
                              >
                                <Play size={11} className="fill-white" /> Start / Collate Shift Now
                              </button>
                            </>
                          )}

                          {override && (
                            <button
                              type="button"
                              disabled={overrideLoading}
                              onClick={() => handleShiftOverride(slot.id, "RESET")}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:text-gray-600 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer ml-auto"
                              title="Revert back to standard schedule"
                            >
                              <RotateCcw size={10} /> Revert
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/restaurant"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
              onClick={() => setShowShiftDetailsModal(false)}
            >
              <span>Configure Master Meal Shifts &amp; Rules in Restaurant Dashboard</span>
              <span>&rarr;</span>
            </Link>

            <CustomButton
              themeColor="orange"
        size="lg"
              onClick={() => setShowShiftDetailsModal(false)}
            >
              Done
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════════ ADD-ONS & MODIFIERS MODAL (WIDER 3XL WITH IMAGES) ══════════════ */}
      <CustomModal
        open={!!selectedProductForAddons}
        onClose={() => {
          setSelectedProductForAddons(null);
          setEditingCartItem(null);
        }}
        title={
          editingCartItem
            ? `Edit Customize & Add-ons: ${selectedProductForAddons?.name}`
            : `Customize & Add-ons: ${selectedProductForAddons?.name}`
        }
        size="3xl"
      >
        {selectedProductForAddons && (
          <div className="space-y-5 p-1">
            {/* Dish Header Banner Card */}
            <div className="flex items-center gap-4 bg-gradient-to-r from-orange-50 via-amber-50/60 to-orange-50 p-3.5 rounded-md border border-orange-100 shadow-sm">
              {selectedProductForAddons.image ? (
                <img
                  src={selectedProductForAddons.image}
                  alt={selectedProductForAddons.name}
                  className="h-20 w-20 rounded-md object-cover border border-orange-200 shadow-2xs shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Utensils size={28} className="opacity-60" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-gray-600 truncate">
                    {selectedProductForAddons.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-orange-600 text-white text-[10px] font-black capitalize tracking-wider">
                    {selectedProductForAddons.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                  {selectedProductForAddons.description || "Select your portion size, spice level & extra add-ons below."}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Base Price:</span>
                  <span className="font-black text-sm text-orange-600">
                    {fmt(selectedProductForAddons.sellingPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* 1. Portion Size Selection (Only shown if configured for this product) */}
            {selectedProductForAddons.portionSizes && selectedProductForAddons.portionSizes.length > 0 && (
              <div>
                <label className="block text-xs font-black text-gray-600 capitalize tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-orange-100 text-orange-700 text-[10px]">
                    1
                  </span>
                  Portion Size Options
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {selectedProductForAddons.portionSizes.map((s) => {
                    const isSelected = selectedSize.label === s.name;
                    return (
                      <button
                        type="button"
                        key={s.id || s.name}
                        onClick={() => setSelectedSize({ label: s.name, price: s.price })}
                        className={`flex items-center justify-between gap-2 p-3 rounded-md border-2 transition cursor-pointer select-none ${
                          isSelected
                            ? "bg-orange-50 border-orange-500 text-orange-950 font-bold shadow-sm"
                            : "bg-white border-slate-200 text-gray-700 hover:border-orange-300 hover:shadow-xs font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-left min-w-0 flex-1">
                          <span className="text-xs font-bold truncate">{s.name}</span>
                          <span className="text-[11px] text-orange-600 font-extrabold shrink-0 whitespace-nowrap">
                            {fmt(s.price)}
                          </span>
                        </div>
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Spice Level Selection */}
            <div>
              <label className="block text-xs font-black text-gray-600 capitalize tracking-wider mb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-700 text-[10px]">
                  2
                </span>
                Spice Level
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {SPICE_OPTIONS.map((spice) => {
                  const isSelected = selectedSpice === spice.label;
                  return (
                    <button
                      type="button"
                      key={spice.label}
                      onClick={() => setSelectedSpice(spice.label)}
                      className={`flex items-center justify-center gap-1.5 p-2.5 rounded-md border-2 text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-rose-50 border-rose-500 text-rose-800 shadow-sm"
                          : "bg-white border-slate-200 text-gray-700 hover:border-rose-300 hover:shadow-xs"
                      }`}
                    >
                      <span>{spice.icon}</span>
                      <span>{spice.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Extra Add-ons & Toppings (No Images - Title & Price Only) */}
            <div>
              <label className="block text-xs font-black text-gray-600 capitalize tracking-wider mb-2 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-800 text-[10px]">
                  3
                </span>
                Extra Add-ons & Toppings (Select Any)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {((selectedProductForAddons.addons && selectedProductForAddons.addons.length > 0)
                  ? selectedProductForAddons.addons.map((a) => ({ label: a.name, price: a.price }))
                  : EXTRA_TOPPINGS
                ).map((top) => {
                  const isChecked = selectedExtras.some((e) => e.label === top.label);
                  return (
                    <label
                      key={top.label}
                      onClick={() => toggleExtraTopping(top)}
                      className={`flex items-center gap-3 p-3 rounded-md border-2 transition cursor-pointer select-none ${
                        isChecked
                          ? "bg-amber-50/90 border-amber-500 text-amber-950 shadow-sm font-bold"
                          : "bg-white border-slate-200 text-gray-700 hover:border-amber-300 hover:shadow-xs font-medium"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 min-w-0 flex items-center gap-1.5">
                        <h5 className="text-xs font-bold text-gray-600 truncate">{top.label}</h5>
                        <span
                          className={`text-[11px] font-black shrink-0 whitespace-nowrap ${
                            isChecked ? "text-amber-700" : "text-gray-500"
                          }`}
                        >
                          + {fmt(top.price)}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Special Cooking Instructions */}
            <div>
              <label className="block text-xs font-black text-gray-600 capitalize tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-gray-600 text-[10px]">
                  4
                </span>
                Cooking Instructions / Note
              </label>
              <input
                type="text"
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="e.g. Less oil, extra sauce on side, no onions..."
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Modal Footer with Live Item Price Calculation */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-500 capitalize font-bold tracking-wider block">
                  Customized Item Total
                </span>
                <span className="font-black text-xl text-orange-600 tabular-nums">
                  {fmt(
                    (selectedProductForAddons.portionSizes && selectedProductForAddons.portionSizes.length > 0
                      ? selectedSize.price
                      : selectedProductForAddons.sellingPrice) +
                      selectedExtras.reduce((sum, e) => sum + e.price, 0)
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CustomButton
                  variant="outline"
                  onClick={() => {
                    setSelectedProductForAddons(null);
                    setEditingCartItem(null);
                  }}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  themeColor="orange"
                  onClick={handleConfirmAddons}
                >
                  {editingCartItem ? "Update Item Add-ons" : "Add to Order"}
                </CustomButton>
              </div>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Reusable Custom Prompt Modal */}
      <CustomPromptModal
        isOpen={promptModalState.isOpen}
        onClose={() => setPromptModalState((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={(val) => {
          if (promptModalState.onSubmit) promptModalState.onSubmit(val);
        }}
        title={promptModalState.title}
        description={promptModalState.description}
        placeholder={promptModalState.placeholder}
        defaultValue={promptModalState.defaultValue}
        inputType={promptModalState.inputType}
      />
    </div>
  );
}
