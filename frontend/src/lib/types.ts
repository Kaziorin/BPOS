export type UserRole = "ADMIN" | "MANAGER" | "CASHIER";

export interface AuthUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  role: string;
  branchId: string | null;
  businessType?: string;
}

export interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  categoryId: string | null;
  brandId: string | null;
  unit: string;
  purchasePrice: string;
  sellingPrice: string;
  stockQty: string;
  alertQty: string;
  isActive: boolean;
  category?: Category | null;
  brand?: Brand | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimit: string;
  totalDue: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalDue: string;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: string;
  price: string;
  total: string;
  product?: Product;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string | null;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid: string;
  due: string;
  paymentMethod: string;
  status: "COMPLETED" | "DUE" | "RETURNED" | "CANCELLED";
  createdAt: string;
  customer?: Customer | null;
  items?: SaleItem[];
}

export interface Purchase {
  id: string;
  referenceNo: string;
  supplierId: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid: string;
  due: string;
  status: "RECEIVED" | "DUE" | "RETURNED";
  createdAt: string;
  supplier?: Supplier;
  items?: { id: string; productId: string; quantity: string; price: string; total: string; product?: Product }[];
}

export interface TrendPoint {
  date: string;
  total: number;
}

/* ---------- DB-backed business identity (from GET /api/v1/tenant) ---------- */

export interface TenantInfo {
  tenant: {
    id: string;
    slug: string;
    name: string;
    businessType: string;
    status: string;
    currency: string;
    timezone: string;
  };
  company: {
    id: string;
    name: string;
    legalName: string | null;
    address: string | null;
    vatRegNo: string | null;
  } | null;
  branch: { id: string; code: string; name: string; address: string | null } | null;
  warehouse: { id: string; code: string; name: string } | null;
}

export interface WorkspaceOption {
  id: string;
  slug: string;
  name: string;
  businessType: string;
}

export interface PaymentMethodOptions {
  legacy: string[];
  core: string[];
}

export interface DashboardSummary {
  todaySalesTotal: string;
  todaySalesCount: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  totalDue: string;
  recentSales: {
    id: string;
    invoiceNo: string;
    customer: string;
    total: string;
    status: string;
    createdAt: string;
  }[];
}
