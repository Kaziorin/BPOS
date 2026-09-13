export interface CartItem {
  productId: string;
  variantId?: string | null;
  name: string;
  qty: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
}

export interface PaymentLine {
  method: string;
  amount: number;
  reference?: string;
}

export interface HeldSale {
  id: string;
  holdNo: string;
  note: string | null;
  customerId: string | null;
  cartSnapshot: CartItem[];
  createdAt: string;
}

export interface SaleResult {
  saleId: string;
  invoiceNo: string;
  invoiceId: string;
  total: number;
  paidTotal: number;
  dueTotal: number;
  paymentIds: string[];
}

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK", label: "Bank Transfer" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "GATEWAY", label: "Gateway" },
  { value: "CREDIT", label: "Customer Credit" },
  { value: "GIFT_CARD", label: "Gift Card" },
  { value: "WALLET", label: "Wallet" },
  { value: "STORE_CREDIT", label: "Store Credit" },
];
