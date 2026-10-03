import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/storefront";
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:4000";

/**
 * Resolves active tenant slug from URL parameters, Subdomain, Cookies, or default fallback
 */
export function getTenantSlug(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "demo-shop";
  }

  // 1. Check URL query parameters (e.g. ?store=aarong)
  const params = new URLSearchParams(window.location.search);
  const storeParam = params.get("store");
  if (storeParam) {
    return storeParam;
  }

  // 2. Check document cookie set by middleware
  const match = document.cookie.match(new RegExp("(^| )current_tenant_slug=([^;]+)"));
  if (match && match[2]) {
    return decodeURIComponent(match[2]);
  }

  // 3. Check hostname subdomain (e.g. aarong.bpos.com)
  const host = window.location.hostname;
  if (host && !host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    const parts = host.split(".");
    if (parts.length >= 3) {
      return parts[0] === "www" ? parts[1] : parts[0];
    }
    return host.replace(/^www\./, "");
  }

  // 4. Default fallback
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "demo-shop";
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically attach Tenant ID/Slug and Customer JWT Token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // 1. Attach Tenant Identifier
    const tenantSlug = getTenantSlug();
    if (tenantSlug) {
      config.headers["x-tenant-id"] = tenantSlug;
      config.headers["x-tenant-slug"] = tenantSlug;
    }

    // 2. Attach Customer Auth Token if logged in
    const token = localStorage.getItem(`customer_token_${tenantSlug}`) || localStorage.getItem("customer_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface ProductItem {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  productType?: string;
  sellingPrice: number;
  wholesalePrice?: number;
  imageUrl?: string;
  manufacturer?: string;
  description?: string;
  attributes?: Record<string, any>;
  warrantyDays?: number;
  createdAt?: string;
  categoryName?: string;
  categoryId?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  brandId?: string;
  brandName?: string;
  unitName?: string;
  totalStock?: number;
  inStock?: boolean;
  stockQuantity?: number;
  // Pharmacy specific
  dosage?: string;
  genericName?: string;
  strength?: string;
  requiresPrescription?: boolean;
  // Fashion specific
  sizes?: string[];
  colors?: string[];
  // Restaurant specific
  spiceLevel?: number;
  isVegetarian?: boolean;
  calories?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  productCount?: number;
  subCategories?: CategoryItem[];
}

export interface StoreTenantMeta {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  logoUrl?: string;
  bannerUrl?: string;
  tagline?: string;
  themeColor?: string;
  accentColor?: string;
}

export interface StoreConfig {
  tenant: StoreTenantMeta;
  businessType: string;
  settings?: Record<string, any>;
  totalCategories: number;
  totalProducts: number;
  supportedPaymentMethods: string[];
  deliveryMethods: { id: string; name: string; cost: number; eta: string }[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
  sku?: string;
  variant?: string;
  unitName?: string;
  maxStock?: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedDosage?: string;
  notes?: string;
}

export const StorefrontAPI = {
  async getConfig(): Promise<StoreConfig> {
    try {
      const res = await api.get("/config");
      const data = res.data?.data || res.data;
      if (data && data.tenant) {
        return data;
      }
      throw new Error("Invalid config format");
    } catch (e) {
      const currentSlug = getTenantSlug();
      // Graceful fallback for local development or disconnected state
      return {
        tenant: {
          id: currentSlug,
          name: currentSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "BlueOceans Store",
          slug: currentSlug,
          businessType: "RETAIL",
          phone: "+880 1700-000000",
          email: `contact@${currentSlug}.com`,
          currency: "BDT",
          tagline: "Quality Products with Direct Store Pickup & Superfast Home Delivery",
        },
        businessType: "RETAIL",
        totalCategories: 8,
        totalProducts: 24,
        supportedPaymentMethods: ["COD", "BKASH", "NAGAD", "CARD"],
        deliveryMethods: [
          { id: "STANDARD", name: "Standard Home Delivery", cost: 60, eta: "2-3 Days" },
          { id: "EXPRESS", name: "Express Same-Day Dispatch", cost: 120, eta: "Inside City (24h)" },
          { id: "STORE_PICKUP", name: "Store Pickup (Click & Collect)", cost: 0, eta: "Ready in 2 Hours" },
        ],
      };
    }
  },

  async getCategories(): Promise<CategoryItem[]> {
    try {
      const res = await api.get("/categories");
      return res.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getBrands(): Promise<any[]> {
    try {
      const res = await api.get("/brands");
      return res.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getFeatured(): Promise<{ newArrivals: ProductItem[]; topCategories: any[]; promotions: any[] }> {
    try {
      const res = await api.get("/featured");
      return res.data?.data || { newArrivals: [], topCategories: [], promotions: [] };
    } catch (e) {
      return { newArrivals: [], topCategories: [], promotions: [] };
    }
  },

  async getProducts(params?: {
    search?: string;
    categoryId?: string;
    subCategoryId?: string;
    brandId?: string;
    businessType?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: ProductItem[]; total: number; page: number; limit: number; totalPages: number }> {
    try {
      const res = await api.get("/products", { params });
      return res.data?.data || { items: [], total: 0, page: 1, limit: 24, totalPages: 1 };
    } catch (e) {
      return { items: [], total: 0, page: 1, limit: 24, totalPages: 1 };
    }
  },

  async getProductById(id: string): Promise<ProductItem & { relatedProducts?: ProductItem[] }> {
    const res = await api.get(`/products/${id}`);
    return res.data?.data || res.data;
  },

  async checkout(orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    paymentMethod: string;
    shippingCost?: number;
    discountTotal?: number;
    taxTotal?: number;
    notes?: string;
    items: { productId: string; qty: number; unitPrice?: number; variant?: string }[];
  }) {
    const res = await api.post("/checkout", orderData);
    return res.data?.data || res.data;
  },

  async trackOrder(orderNo: string, phone?: string) {
    const res = await api.get(`/orders/track/${encodeURIComponent(orderNo)}`, {
      params: { phone },
    });
    return res.data?.data || res.data;
  },

  async login(identifier: string, password: string) {
    const res = await api.post("/auth/login", { identifier, password });
    return res.data?.data || res.data;
  },

  async register(data: { name: string; phone: string; email?: string; password: string }) {
    const res = await api.post("/auth/register", data);
    return res.data?.data || res.data;
  },
};

export default api;
