export interface WsCartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
  imageUrl?: string | null;
  warehouseName?: string;
  stockQty?: number;
}

export type WsCategory =
  | "All Products"
  | "Electronics"
  | "Mobiles"
  | "Computers"
  | "Accessories"
  | "Home Appliances"
  | "Fashion"
  | "Sports";

export type WsSortBy = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock";

export type DiscountMode = "flat" | "percent";

export interface WsStats {
  todaysSales: number;
  orders: number;
  delivery: number;
  customers: number;
  pendingOrders: number;
  lowStockAlerts: number;
}

export interface WsCustomerProfile {
  id: string;
  name: string;
  phone: string;
  tier: "Platinum" | "Gold" | "Silver" | "Standard";
  creditLimit: number;
  availableCredit: number;
  outstanding: number;
}
