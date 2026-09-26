import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1/storefront";
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach customer token if exists
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("customer_token");
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
  attributes?: any;
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

export interface StoreConfig {
  tenant: {
    id: string;
    name: string;
    slug: string;
    businessType: string;
    address?: string;
    phone?: string;
    email?: string;
    currency?: string;
  };
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
}

export const StorefrontAPI = {
  async getConfig(): Promise<StoreConfig> {
    try {
      const res = await api.get("/config");
      return res.data?.data || res.data;
    } catch (e) {
      // Return safe fallback if backend is booting
      return {
        tenant: {
          id: "default",
          name: "BlueOceans E-Commerce Store",
          slug: "blue-oceans",
          businessType: "RETAIL",
          phone: "+880 1700-000000",
          email: "support@blueoceans.store",
          currency: "BDT",
        },
        businessType: "RETAIL",
        totalCategories: 10,
        totalProducts: 50,
        supportedPaymentMethods: ["COD", "BKASH", "NAGAD", "CARD"],
        deliveryMethods: [
          { id: "STANDARD", name: "Standard Home Delivery", cost: 60, eta: "2-3 Days" },
          { id: "EXPRESS", name: "Express Same-Day Delivery", cost: 120, eta: "Inside Dhaka (24h)" },
          { id: "STORE_PICKUP", name: "Store Pickup", cost: 0, eta: "Ready in 2 Hours" }
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
    items: { productId: string; qty: number; unitPrice?: number }[];
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
