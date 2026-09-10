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
} from "lucide-react";
import { api, TENANT_STORAGE_KEY } from "@/lib/api";
import { toast } from "react-toastify";
import { ConfirmModal, CustomModal, CustomPromptModal, CustomInput, CustomButton } from "@/components/custom";
import { getCategoryIcon } from "@/lib/categoryIcons";

interface TableOption {
  id: string;
  tableNo: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";
  currentBill?: number;
  guestCount?: number;
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
  modifiers?: CartModifier[];
  notes?: string;
  isKitchenProduct?: boolean;
  kotStatus: "PENDING" | "SENT_TO_KITCHEN" | "PREPARING" | "SERVED" | "READY_TO_SERVE";
}

const DEMO_RESTAURANT_PRODUCTS: MenuItem[] = [
  {
    id: "demo-prod-1",
    name: "Grilled BBQ Chicken Platter",
    category: "Main Course",
    sellingPrice: 580,
    image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&q=80",
    isPopular: true,
    isVeg: false,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Flame-grilled tender chicken breast with peri-peri marinade & seasoned wedges",
  },
  {
    id: "demo-prod-2",
    name: "Special Mutton Dum Biryani",
    category: "Main Course",
    sellingPrice: 650,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
    isPopular: true,
    isVeg: false,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Aromatic basmati rice cooked with succulent bone-in mutton & saffron spices",
  },
  {
    id: "demo-prod-3",
    name: "Classic Italian Margherita Pizza",
    category: "Pizza & Pasta",
    sellingPrice: 750,
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&q=80",
    isPopular: true,
    isVeg: true,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Wood-fired crust with San Marzano tomato sauce, fresh mozzarella & sweet basil",
  },
  {
    id: "demo-prod-4",
    name: "Creamy Alfredo Fettuccine Pasta",
    category: "Pizza & Pasta",
    sellingPrice: 520,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&q=80",
    isPopular: false,
    isVeg: false,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Al dente pasta tossed in rich parmesan garlic cream sauce with grilled mushroom",
  },
  {
    id: "demo-prod-5",
    name: "Smoky Double Beef Cheese Burger",
    category: "Burgers & Fast Food",
    sellingPrice: 420,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    isPopular: true,
    isVeg: false,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Two 100% prime beef patties, melted cheddar, caramelized onions & secret sauce",
  },
  {
    id: "demo-prod-6",
    name: "Crispy Golden French Fries",
    category: "Appetizers",
    sellingPrice: 180,
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&q=80",
    isPopular: false,
    isVeg: true,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Hand-cut crispy Idaho potatoes dusted with smoked paprika sea salt",
  },
  {
    id: "demo-prod-7",
    name: "Paneer Butter Masala & Naan",
    category: "Main Course",
    sellingPrice: 460,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80",
    isPopular: false,
    isVeg: true,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Cottage cheese simmered in silky tomato butter gravy with warm garlic butter naan",
  },
  {
    id: "demo-prod-8",
    name: "Artisan Caramel Macchiato",
    category: "Beverages",
    sellingPrice: 280,
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&q=80",
    isPopular: false,
    isVeg: true,
    isKitchenProduct: false,
    allTimeSlots: true,
    description: "Freshly pulled espresso with steamed velvet milk and vanilla caramel drizzle",
  },
  {
    id: "demo-prod-9",
    name: "Fresh Mint Lemonade Cooler",
    category: "Beverages",
    sellingPrice: 160,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80",
    isPopular: true,
    isVeg: true,
    isKitchenProduct: false,
    allTimeSlots: true,
    description: "Crushed wild mint, freshly squeezed Meyer lemons, soda and crushed ice",
  },
  {
    id: "demo-prod-10",
    name: "Warm Molten Lava Chocolate Cake",
    category: "Desserts",
    sellingPrice: 320,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&q=80",
    isPopular: true,
    isVeg: true,
    isKitchenProduct: true,
    allTimeSlots: true,
    description: "Gooey molten Belgian chocolate center served with vanilla bean ice cream scoop",
  },
];

const DEMO_TABLES: TableOption[] = [
  { id: "tbl-01", tableNo: "Table 01", capacity: 4, status: "AVAILABLE" },
  { id: "tbl-02", tableNo: "Table 02", capacity: 2, status: "AVAILABLE" },
  { id: "tbl-03", tableNo: "Table 03", capacity: 4, status: "OCCUPIED", currentBill: 1250, guestCount: 3 },
  { id: "tbl-04", tableNo: "Table 04", capacity: 6, status: "AVAILABLE" },
  { id: "tbl-05", tableNo: "VIP Booth 01", capacity: 8, status: "RESERVED" },
  { id: "tbl-06", tableNo: "Terrace T-1", capacity: 4, status: "AVAILABLE" },
];

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
  const [tables, setTables] = useState<TableOption[]>(DEMO_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableOption | null>(DEMO_TABLES[0]);
  const [guestCount, setGuestCount] = useState(2);
  const [waiterName, setWaiterName] = useState("Staff 1");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");

  const [products, setProducts] = useState<MenuItem[]>(DEMO_RESTAURANT_PRODUCTS);
  const [categories, setCategories] = useState<CategorySidebarItem[]>(DEFAULT_CATEGORIES);
  const [cart, setCart] = useState<RestaurantCartItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [searchFilter, setSearchFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [orderNote, setOrderNote] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modals & Dialogs
  const [showSelectTableModal, setShowSelectTableModal] = useState(false);
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
          loadedProducts = pData.map((p: any) => {
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
          });
          setProducts(loadedProducts);
        } else {
          setProducts(DEMO_RESTAURANT_PRODUCTS);
          loadedProducts = DEMO_RESTAURANT_PRODUCTS;
        }
      } catch (errProd) {
        setProducts(DEMO_RESTAURANT_PRODUCTS);
        loadedProducts = DEMO_RESTAURANT_PRODUCTS;
      }

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

      // 4. Load Tables
      try {
        const resTables: any = await api.get("/v1/restaurant/tables").catch(() => null);
        const tData = (resTables?.data as any)?.data ?? resTables?.data ?? resTables ?? [];
        if (Array.isArray(tData) && tData.length > 0) {
          const mappedTables: TableOption[] = tData.map((t: any) => ({
            id: String(t.id),
            tableNo: t.tableNo || t.name || `Table ${String(t.id).slice(0, 4)}`,
            capacity: Number(t.capacity || 4),
            status: t.status || "AVAILABLE",
            currentBill: t.currentBill ? Number(t.currentBill) : undefined,
            guestCount: t.guestCount ? Number(t.guestCount) : undefined,
          }));
          setTables(mappedTables);
          setSelectedTable((prev) => prev || mappedTables[0]);
        } else {
          setTables(DEMO_TABLES);
          setSelectedTable((prev) => prev || DEMO_TABLES[0]);
        }
      } catch (errTables) {
        setTables(DEMO_TABLES);
        setSelectedTable((prev) => prev || DEMO_TABLES[0]);
      }
    } catch (err) {
      console.error("Failed to load restaurant POS data:", err);
      setCategories(DEFAULT_CATEGORIES);
      setTables(DEMO_TABLES);
      setProducts(DEMO_RESTAURANT_PRODUCTS);
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
      image: "",
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
          qty: 1,
          unitPrice: finalUnitPrice,
          modifiers: modifiersList,
          notes: itemNote,
          isKitchenProduct: isKitchen,
          kotStatus: isKitchen ? "PENDING" : "READY_TO_SERVE",
        },
      ]);
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
          qty: 1,
          unitPrice: item.sellingPrice,
          isKitchenProduct: isKitchen,
          kotStatus: isKitchen ? "PENDING" : "READY_TO_SERVE",
        },
      ];
    });
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
  const taxAmount = subTotal * 0.08;
  const serviceCharge = subTotal * 0.04;
  const grandTotal = subTotal + taxAmount + serviceCharge;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    try {
      // Build payload for the backend POS confirm endpoint
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
        payments: [{ method: "CASH", amount: grandTotal }],
        subTotal: subTotal,
        grandTotal: grandTotal,
        discountTotal: discountAmount,
        taxTotal: taxAmount,
        serviceCharge: serviceCharge,
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
        items: cart,
        rawSubtotal,
        discountAmount,
        subTotal,
        taxAmount,
        serviceCharge,
        grandTotal,
        date: new Date().toISOString(),
      };

      setCompletedBill(billData);
      setCart([]);
      setDiscountPercent(0);
      toast.success(`Order #${invNo} placed & synced to system!`);

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

  const filteredProducts = products.filter((p) => {
    // 1. Shift filtering if enabled (supports single or multi-shift concurrent active shifts!)
    if (timeSlotFilterEnabled && activeSlotIds.length > 0) {
      const inAnyActiveShift =
        p.allTimeSlots ||
        (Array.isArray(p.timeSlotIds) &&
          p.timeSlotIds.some((id) => activeSlotIds.includes(id)));
      if (!inAnyActiveShift) return false;
    }

    const pCat = getCategoryName(p.category);
    const matchesCategory =
      selectedCategory === "All Items"
        ? true
        : selectedCategory === "Popular"
        ? p.isPopular
        : pCat.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchFilter.toLowerCase().trim();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || pCat.toLowerCase().includes(q);
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
              placeholder="Search items..."
              className="w-full rounded-md bg-white/15 border border-white/20 py-1.5 pl-8 pr-3 text-xs font-medium text-white placeholder-orange-100/70 focus:bg-white focus:text-gray-600 focus:placeholder-gray-400 focus:outline-none transition"
            />
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
            onClick={() => setShowSelectTableModal(true)}
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-100 transition cursor-pointer"
          >
            <LayoutGrid size={15} className="text-orange-600" />
            <span className="text-xs font-medium text-gray-500">Table:</span>
            <span className="text-xs font-bold text-gray-600">
              {selectedTable ? `${selectedTable.tableNo} (${selectedTable.capacity} Seats)` : "Select Table"}
            </span>
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <Users size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Guests:</span>
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

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <ChefHat size={15} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Waiter:</span>
            <select
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-600 focus:outline-none cursor-pointer"
            >
              <option value="Staff 1">Staff 1</option>
              <option value="Staff 2">Staff 2</option>
              <option value="Manager">Manager</option>
            </select>
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
        <aside className="w-80 sm:w-96 flex-none flex flex-col rounded-md bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex-none p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-600">Order Summary</h2>
              <span className="rounded-md bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 text-[10px] font-bold">
                {cart.length} Items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-20 text-center text-gray-400 space-y-2">
                <ShoppingBag size={40} className="mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">Cart is empty</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Click on food items to add them to this table order.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item.id} className="pt-2.5 first:pt-0">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[10px] font-bold text-orange-700">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-xs text-gray-600 truncate">{item.name}</h4>
                          <button
                            onClick={() => handleEditCartItemAddons(item)}
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded transition cursor-pointer"
                            title="Edit Add-ons"
                          >
                            <Edit3 size={11} />
                          </button>
                        </div>
                        <span className="font-bold text-xs text-gray-600 tabular-nums">
                          {fmt(item.qty * item.unitPrice)}
                        </span>
                      </div>

                      {/* Render Selected Modifiers */}
                      {item.modifiers && item.modifiers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.modifiers.map((mod, mIdx) => (
                            <span
                              key={mIdx}
                              className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                            >
                              {mod.label}: {mod.value}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {item.isKitchenProduct === false ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            ⚡ Ready Item
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              item.kotStatus === "SENT_TO_KITCHEN"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-gray-600"
                            }`}
                          >
                            🍳 {item.kotStatus === "SENT_TO_KITCHEN" ? "KOT Sent" : "KOT Pending"}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="mt-0.5 text-[10px] text-orange-600 italic">
                          &quot;{item.notes}&quot;
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="flex h-4.5 w-4.5 items-center justify-center rounded bg-white text-gray-700 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            <Minus size={9} />
                          </button>
                          <span className="w-4 text-center font-bold text-xs text-gray-600">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="flex h-4.5 w-4.5 items-center justify-center rounded bg-white text-gray-700 font-bold hover:bg-slate-200 cursor-pointer"
                          >
                            <Plus size={9} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="p-1 text-gray-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50">
            <div className="relative">
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Add Order Note..."
                className="w-full rounded-md border border-slate-200 bg-white py-1 pl-2.5 pr-7 text-xs font-medium text-gray-700 focus:border-orange-500 focus:outline-none"
              />
              <FileText size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="flex-none p-3.5 bg-slate-50 border-t border-slate-200 space-y-2.5">
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-600">{fmt(subTotal)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>−{fmt(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-500">
                <span>Tax (8%)</span>
                <span>{fmt(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-gray-500">
                <span>Service Charge (4%)</span>
                <span>{fmt(serviceCharge)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200">
                <span className="text-xs capitalize font-bold text-orange-600 tracking-wider">
                  Total Payable
                </span>
                <span className="text-xl font-black text-orange-600 tabular-nums">
                  {fmt(grandTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <button
                onClick={sendKotToKitchen}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition cursor-pointer disabled:opacity-40"
              >
                <Flame size={14} className="text-amber-600" /> KOT to Kitchen
              </button>

              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-md bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition cursor-pointer shadow-xs disabled:opacity-40"
              >
                <span>Place Order</span>
                <div className="flex items-center gap-1.5">
                  <span className="tabular-nums">{fmt(grandTotal)}</span>
                  <ChevronLeft size={16} className="rotate-180" />
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
        title="Dine-In Guest Receipt"
        size="sm"
      >
        <div className="space-y-5">
          <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
            <span className="text-[10px] font-black capitalize tracking-widest text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
              {storeName}
            </span>
            <p className="text-xs font-mono text-slate-500 mt-2 capitalize tracking-tighter font-bold">
              Table: {completedBill?.table?.tableNo || "N/A"} • INV: {completedBill?.invoiceNo}
            </p>
            <p className="text-[10px] text-slate-400 capitalize font-bold tracking-widest">
              {completedBill && new Date(completedBill.date).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {(completedBill?.items || []).map((item: any, idx: number) => (
              <div key={idx} className="border-b border-slate-50 pb-1.5 last:border-0">
                <div className="flex justify-between font-bold text-gray-600">
                  <span className="capitalize tracking-tight">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="font-black">৳{fmt(item.qty * item.unitPrice).replace('৳','')}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold capitalize tracking-tight pl-4 mt-0.5">
                  {item.qty} × {fmt(item.unitPrice)}
                  {item.notes && (
                    <span className="block italic text-orange-600 font-medium mt-0.5">&quot;{item.notes}&quot;</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 text-xs space-y-1.5 bg-slate-50/50 p-4 rounded-2xl">
            <div className="flex justify-between text-slate-500 font-bold capitalize tracking-tighter">
              <span>Subtotal:</span>
              <span>{fmt(completedBill?.subTotal || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold capitalize tracking-tighter">
              <span>Tax (8%):</span>
              <span>{fmt(completedBill?.taxAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-bold capitalize tracking-tighter">
              <span>Service Charge (4%):</span>
              <span>{fmt(completedBill?.serviceCharge || 0)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-orange-600 pt-2 border-t border-orange-100">
              <span className="capitalize tracking-tight">Total Payable:</span>
              <span>{fmt(completedBill?.grandTotal || 0)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <CustomButton
              fullWidth
              variant="outline"
              onClick={() => window.print()}
              leftIcon={<Printer size={16} />}
            >
              Print
            </CustomButton>
            <CustomButton
              fullWidth
              themeColor="orange"
              onClick={() => setCompletedBill(null)}
            >
              Next Table
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Confirm Clear Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setCart([]);
          setShowClearConfirm(false);
          toast.info("Cart cleared successfully");
        }}
        type="DANGER"
        title="Clear Current Order?"
        message="Are you sure you want to remove all items from this table's order?"
        confirmText="Clear Order"
        cancelText="Cancel"
      />

      {/* ══════════════ SELECT TABLE MODAL ══════════════ */}
      <CustomModal
        open={showSelectTableModal}
        onClose={() => setShowSelectTableModal(false)}
        title="Select Dining Table"
        size="lg"
      >
        <div className="space-y-5">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-[10px] font-black capitalize tracking-widest text-slate-400 bg-slate-50 py-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              <span>Selected</span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {tables.length === 0 ? (
              <div className="py-20 text-center text-slate-300 space-y-3">
                <LayoutGrid size={48} className="mx-auto opacity-20" />
                <p className="text-xs font-bold capitalize tracking-widest">No tables found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {tables.map((t) => {
                  const isSelected = selectedTable?.id === t.id;
                  const isOccupied = t.status === "OCCUPIED" || t.status === "BILLING";

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTable(t);
                        setShowSelectTableModal(false);
                        toast.info(`Selected Table ${t.tableNo}`);
                      }}
                      className={`flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer select-none group ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                          : isOccupied
                          ? "bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400"
                          : "bg-emerald-50 text-emerald-950 border-emerald-100 hover:border-emerald-300"
                      }`}
                    >
                      <span className={`text-lg font-black tracking-tighter ${isSelected ? "text-white" : "text-gray-600"}`}>
                        {t.tableNo}
                      </span>
                      <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black capitalize tracking-wider ${
                        isSelected ? "bg-white/20 text-white" : "bg-white/60 text-slate-400"
                      }`}>
                        <Users size={10} strokeWidth={3} /> {t.capacity}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <CustomButton
              variant="outline"
              onClick={() => setShowSelectTableModal(false)}
            >
              Cancel
            </CustomButton>
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
              size="md"
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
