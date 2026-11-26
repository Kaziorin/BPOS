import {
  ShoppingCart,
  Package,
  Pill,
  UtensilsCrossed,
  ShoppingBag,
  Croissant,
  Wrench,
  Scissors,
  Building2,
  Factory,
  type LucideIcon,
} from "lucide-react";

export type PlanTierCode = "STARTER" | "BUSINESS" | "ENTERPRISE";

export const PLAN_TIER_RANK: Record<string, number> = {
  STARTER: 1,
  ADVANCE: 2,
  BUSINESS: 2,
  PRO: 2,
  ENTERPRISE: 3,
};

export interface PosTerminalOption {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  accent: string;
  businessTypes: string[];
  requiredAddon?: string;
  requiredPlan?: PlanTierCode;
}

export const ALL_POS_TERMINALS: PosTerminalOption[] = [
  {
    id: "retail",
    name: "Retail POS Terminal",
    href: "/retail-pos",
    icon: ShoppingCart,
    accent: "from-sky-500 to-blue-600",
    businessTypes: ["RETAIL"],
  },
  {
    id: "grocery",
    name: "Grocery & Supermarket POS",
    href: "/grocery/pos",
    icon: ShoppingBag,
    accent: "from-green-500 to-emerald-600",
    businessTypes: ["GROCERY"],
    requiredAddon: "grocery",
  },
  {
    id: "wholesale",
    name: "Wholesale POS Counter",
    href: "/wholesale/pos",
    icon: Package,
    accent: "from-blue-600 to-indigo-600",
    businessTypes: ["WHOLESALE"],
    requiredAddon: "wholesale",
  },
  {
    id: "pharmacy",
    name: "Pharmacy Rx POS",
    href: "/pharmacy/pos",
    icon: Pill,
    accent: "from-emerald-500 to-teal-600",
    businessTypes: ["PHARMACY"],
    requiredAddon: "pharmacy",
  },
  {
    id: "restaurant",
    name: "Restaurant & Cafe POS",
    href: "/restaurant/pos",
    icon: UtensilsCrossed,
    accent: "from-rose-500 to-orange-600",
    businessTypes: ["RESTAURANT"],
    requiredAddon: "restaurant",
  },
  {
    id: "bakery",
    name: "Bakery & Confectionery POS",
    href: "/bakery/pos",
    icon: Croissant,
    accent: "from-amber-500 to-yellow-600",
    businessTypes: ["MANUFACTURING", "BAKERY"],
    requiredAddon: "bakery",
  },
  {
    id: "manufacturing",
    name: "Batch & Factory POS",
    href: "/manufacturing/pos",
    icon: Factory,
    accent: "from-slate-600 to-slate-800",
    businessTypes: ["MANUFACTURING"],
    requiredAddon: "manufacturing",
  },
  {
    id: "repair",
    name: "Repair & Service POS",
    href: "/repair/pos",
    icon: Wrench,
    accent: "from-cyan-500 to-blue-600",
    businessTypes: ["REPAIR"],
    requiredAddon: "repair",
  },
  {
    id: "salon",
    name: "Salon & Spa POS",
    href: "/salon/pos",
    icon: Scissors,
    accent: "from-fuchsia-500 to-pink-600",
    businessTypes: ["SALON"],
    requiredAddon: "salon",
  },
  {
    id: "franchise",
    name: "Franchise & Outlet POS",
    href: "/franchise/pos",
    icon: Building2,
    accent: "from-slate-600 to-slate-800",
    businessTypes: ["FRANCHISE"],
    requiredAddon: "franchise",
  },
];

export interface TenantEntitlementContext {
  isSuperAdmin: boolean;
  businessType: string;
  planCode: string;
  planName: string;
  userTier: number;
  enabledModules: Set<string>;
}

export function getTenantEntitlementContext(
  user: any,
  subscription: any
): TenantEntitlementContext {
  const email = (user?.email || "").toLowerCase();
  const roleName = (user?.roleName || user?.role || "").toLowerCase();
  const isSuperAdmin =
    email === "admin@gmail.com" || roleName === "super administrator" || roleName === "superadmin";

  const businessType = (
    user?.businessType ||
    subscription?.businessType ||
    "RETAIL"
  )
    .toString()
    .trim()
    .toUpperCase();

  const planCode = (subscription?.planCode || "STARTER").toString().trim().toUpperCase();
  const planName =
    subscription?.planName ||
    (planCode === "BUSINESS" ? "Advance" : planCode === "ENTERPRISE" ? "Enterprise" : "Starter");
  const userTier = isSuperAdmin ? 3 : PLAN_TIER_RANK[planCode] || 1;
  const enabledModules = new Set<string>(
    (subscription?.enabledModules || []).map((m: string) => String(m).toLowerCase())
  );

  // Ensure the tenant's own primary business vertical is always recognized as enabled
  if (businessType) {
    enabledModules.add(businessType.toLowerCase());
    if (businessType === "MANUFACTURING") {
      enabledModules.add("bakery");
    }
  }

  return {
    isSuperAdmin,
    businessType,
    planCode,
    planName,
    userTier,
    enabledModules,
  };
}

export interface AccessiblePosTerminal extends PosTerminalOption {
  isLocked: boolean;
  lockReason?: string;
}

export function getAccessiblePosTerminals(
  user: any,
  subscription: any
): AccessiblePosTerminal[] {
  const ctx = getTenantEntitlementContext(user, subscription);

  if (ctx.isSuperAdmin) {
    return ALL_POS_TERMINALS.map((t) => ({ ...t, isLocked: false }));
  }

  const filtered = ALL_POS_TERMINALS.filter((term) => {
    const matchesPrimaryVertical = term.businessTypes.includes(ctx.businessType);
    const hasAddon = term.requiredAddon
      ? ctx.enabledModules.has(term.requiredAddon.toLowerCase())
      : false;
    return matchesPrimaryVertical || hasAddon;
  });

  const list = filtered.length > 0 ? filtered : [ALL_POS_TERMINALS[0]];

  return list.map((term) => {
    const reqTier = term.requiredPlan ? PLAN_TIER_RANK[term.requiredPlan] || 1 : 1;
    const planLocked = ctx.userTier < reqTier;
    return {
      ...term,
      isLocked: planLocked,
      lockReason: planLocked
        ? term.requiredPlan === "ENTERPRISE"
          ? "Enterprise Plan"
          : "Advance Plan"
        : undefined,
    };
  });
}

export interface RouteAccessCheck {
  allowed: boolean;
  reason?: string;
  requiredPlan?: PlanTierCode;
  requiredAddon?: string;
}

const BUSINESS_ROUTE_PREFIXES: {
  prefix: string;
  vertical: string;
  verticals?: string[];
  addon?: string;
  addons?: string[];
  plan?: PlanTierCode;
}[] = [
  { prefix: "/pos/self-checkout", vertical: "ALL", plan: "BUSINESS" },
  { prefix: "/pos/holds", vertical: "ALL" },
  { prefix: "/pos/price-checker", vertical: "ALL" },
  { prefix: "/retail-pos/self-checkout", vertical: "ALL", plan: "BUSINESS" },
  { prefix: "/retail-pos/holds", vertical: "ALL" },
  { prefix: "/retail-pos/price-checker", vertical: "ALL" },
  {
    prefix: "/retail-pos/customer-display",
    vertical: "ALL",
    verticals: ["RETAIL", "GROCERY", "WHOLESALE", "PHARMACY", "MANUFACTURING", "REPAIR", "SALON", "FRANCHISE"],
    addons: ["retail", "grocery", "wholesale"],
  },
  { prefix: "/retail-pos", vertical: "RETAIL" },
  { prefix: "/retail", vertical: "RETAIL" },
  { prefix: "/grocery", vertical: "GROCERY", addon: "grocery" },
  { prefix: "/wholesale", vertical: "WHOLESALE", addon: "wholesale" },
  { prefix: "/pharmacy", vertical: "PHARMACY", addon: "pharmacy" },
  { prefix: "/restaurant/kitchen", vertical: "RESTAURANT", addon: "kitchen" },
  { prefix: "/restaurant", vertical: "RESTAURANT", addon: "restaurant" },
  { prefix: "/bakery", vertical: "MANUFACTURING", addon: "bakery" },
  { prefix: "/manufacturing", vertical: "MANUFACTURING", addon: "manufacturing" },
  { prefix: "/repair", vertical: "REPAIR", addon: "repair" },
  { prefix: "/salon", vertical: "SALON", addon: "salon" },
  {
    prefix: "/appointments",
    vertical: "ALL",
    verticals: ["SALON", "REPAIR", "RESTAURANT"],
    addons: ["salon", "repair"],
  },
  { prefix: "/franchise", vertical: "FRANCHISE", addon: "franchise" },
];

const PLAN_ROUTE_PREFIXES: { prefix: string; plan: PlanTierCode; addon?: string; label: string }[] = [
  { prefix: "/dashboard/builder", plan: "BUSINESS", label: "Dashboard Builder" },
  { prefix: "/reports", plan: "BUSINESS", label: "Business Intelligence & Reports" },
  { prefix: "/loyalty", plan: "BUSINESS", addon: "loyalty", label: "Loyalty Programme" },
  { prefix: "/credit", plan: "BUSINESS", label: "Customer Credit & Dues" },
  { prefix: "/installments", plan: "BUSINESS", label: "Installments & EMI" },
  { prefix: "/returns", plan: "BUSINESS", label: "Returns Management" },
  { prefix: "/rma", plan: "BUSINESS", label: "RMA Management" },
  { prefix: "/warranty", plan: "BUSINESS", label: "Warranty Management" },
  { prefix: "/promotions", plan: "BUSINESS", label: "Promotions & Coupons" },
  { prefix: "/marketing", plan: "BUSINESS", label: "Marketing Campaigns" },
  { prefix: "/delivery", plan: "BUSINESS", label: "Delivery & Logistics" },
  { prefix: "/price-lists", plan: "BUSINESS", label: "Price Lists & Tiers" },
  { prefix: "/warehouses", plan: "BUSINESS", label: "Warehouses & Storage" },
  { prefix: "/inventory/transfers", plan: "BUSINESS", label: "Inter-Branch Transfers" },
  { prefix: "/inventory/batches", plan: "BUSINESS", label: "Batches & Expiry" },
  { prefix: "/inventory/serials", plan: "BUSINESS", label: "Serial Numbers" },
  { prefix: "/inventory/consignments", plan: "BUSINESS", label: "Consignments" },
  { prefix: "/inventory/counts", plan: "BUSINESS", label: "Physical Stock Counts" },
  { prefix: "/inventory/landed-costs", plan: "BUSINESS", label: "Landed Costs" },
  { prefix: "/purchasing", plan: "BUSINESS", label: "Purchasing & Receiving" },
  { prefix: "/suppliers", plan: "BUSINESS", label: "Supplier Directory" },
  { prefix: "/accounting", plan: "BUSINESS", label: "Financial Accounting" },
  { prefix: "/tax", plan: "BUSINESS", label: "Tax & NBR VAT" },
  { prefix: "/expenses", plan: "BUSINESS", label: "Expenses & Petty Cash" },
  { prefix: "/commission", plan: "BUSINESS", label: "Sales Commission" },
  { prefix: "/targets", plan: "BUSINESS", label: "Sales Targets & KPIs" },
  { prefix: "/branches", plan: "BUSINESS", label: "Multi-Branch Outlets" },
  { prefix: "/rbac", plan: "ENTERPRISE", label: "Roles & Permissions (RBAC)" },
  { prefix: "/workflow", plan: "ENTERPRISE", label: "Workflow & Approvals" },
  { prefix: "/business-rules", plan: "ENTERPRISE", label: "Business Rules Engine" },
  { prefix: "/audit-security", plan: "ENTERPRISE", label: "Audit & Security Logs" },
  { prefix: "/integrations", plan: "ENTERPRISE", label: "API & Integrations" },
  { prefix: "/system/performance", plan: "ENTERPRISE", label: "System Performance" },
];

export function checkRouteEntitlement(
  pathname: string,
  user: any,
  subscription: any
): RouteAccessCheck {
  if (!pathname) return { allowed: true };
  const ctx = getTenantEntitlementContext(user, subscription);
  if (ctx.isSuperAdmin) return { allowed: true };

  // Check industry vertical access first
  for (const rule of BUSINESS_ROUTE_PREFIXES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      if (rule.plan && ctx.userTier < (PLAN_TIER_RANK[rule.plan] || 1)) {
        return {
          allowed: false,
          requiredPlan: rule.plan,
          reason: `Requires ${rule.plan === "ENTERPRISE" ? "Enterprise" : "Advance"} Plan`,
        };
      }
      if (rule.vertical !== "ALL" || rule.verticals?.length) {
        const matchesVertical =
          (rule.vertical !== "ALL" && ctx.businessType === rule.vertical) ||
          Boolean(rule.verticals?.includes(ctx.businessType)) ||
          (ctx.businessType === "MANUFACTURING" && rule.prefix.startsWith("/bakery"));
        const hasAddon =
          (rule.addon ? ctx.enabledModules.has(rule.addon) : false) ||
          Boolean(rule.addons?.some((a) => ctx.enabledModules.has(a)));
        const hasVerticalMod =
          rule.vertical !== "ALL" && ctx.enabledModules.has(rule.vertical.toLowerCase());
        if (!matchesVertical && !hasAddon && !hasVerticalMod) {
          return {
            allowed: false,
            requiredAddon: rule.addon || rule.addons?.[0] || rule.vertical.toLowerCase(),
            reason: `Your workspace is configured for ${ctx.businessType}. Enable ${rule.verticals ? rule.verticals.join("/") : rule.vertical} access to open this screen.`,
          };
        }
      }
      break;
    }
  }

  // Check subscription tier access
  for (const rule of PLAN_ROUTE_PREFIXES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")) {
      const reqRank = PLAN_TIER_RANK[rule.plan] || 1;
      const hasAddon =
        rule.addon &&
        (ctx.enabledModules.has(rule.addon) ||
          (rule.addon === "loyalty" && ctx.enabledModules.has("customer_loyalty")));
      if (ctx.userTier < reqRank && !hasAddon) {
        return {
          allowed: false,
          requiredPlan: rule.plan,
          reason: `${rule.label} requires the ${rule.plan === "ENTERPRISE" ? "Enterprise" : "Advance"} Plan.`,
        };
      }
    }
  }

  return { allowed: true };
}
