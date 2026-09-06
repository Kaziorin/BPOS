// ============================================================
// OmniPOS — Module Registry (spec §9, §32)
// Central configuration for all modules, permissions, and icons.
// Used by both backend (permission checks) and frontend (UI rendering).
// ============================================================

export interface ModuleConfig {
  code: string;
  name: string;
  description: string;
  category: "PLATFORM" | "CORE" | "INDUSTRY" | "ENGINE" | "FEATURE";
  icon: string;
  route?: string;
  sortOrder: number;
  isCore: boolean;
  permissions: PermissionConfig[];
  features?: string[];
}

export interface PermissionConfig {
  code: string;
  module: string;
  action: string;
  description: string;
}

// ==================== PERMISSION DEFINITIONS ====================
// Action-level granularity per spec §5

export const permissions: PermissionConfig[] = [
  // Platform modules
  { code: "platform.tenants.view", module: "platform", action: "view", description: "View tenants" },
  { code: "platform.tenants.create", module: "platform", action: "create", description: "Create tenants" },
  { code: "platform.tenants.edit", module: "platform", action: "edit", description: "Edit tenants" },
  { code: "platform.tenants.delete", module: "platform", action: "delete", description: "Delete tenants" },
  { code: "platform.subscriptions.view", module: "platform", action: "view", description: "View subscriptions" },
  { code: "platform.features.view", module: "platform", action: "view", description: "View feature flags" },
  { code: "platform.health.view", module: "platform", action: "view", description: "View system health" },
  { code: "system.admin", module: "system", action: "admin", description: "System performance / queue / cache dashboard" },

  // Tenant management
  { code: "tenant.profile.view", module: "tenant", action: "view", description: "View company profile" },
  { code: "tenant.profile.edit", module: "tenant", action: "edit", description: "Edit company profile" },
  { code: "tenant.branches.view", module: "tenant", action: "view", description: "View branches" },
  { code: "tenant.branches.create", module: "tenant", action: "create", description: "Create branches" },
  { code: "tenant.warehouses.view", module: "tenant", action: "view", description: "View warehouses" },
  { code: "tenant.warehouses.create", module: "tenant", action: "create", description: "Create warehouses" },
  { code: "tenant.devices.view", module: "tenant", action: "view", description: "View devices" },

  // Auth & Security
  { code: "auth.history.view", module: "auth", action: "view", description: "View login history" },
  { code: "auth.sessions.view", module: "auth", action: "view", description: "View sessions" },
  { code: "auth.settings.view", module: "auth", action: "view", description: "View security settings" },

  // RBAC
  { code: "rbac.users.view", module: "rbac", action: "view", description: "View users" },
  { code: "rbac.users.create", module: "rbac", action: "create", description: "Create users" },
  { code: "rbac.users.edit", module: "rbac", action: "edit", description: "Edit users" },
  { code: "rbac.users.delete", module: "rbac", action: "delete", description: "Delete users" },
  { code: "rbac.roles.view", module: "rbac", action: "view", description: "View roles" },
  { code: "rbac.roles.create", module: "rbac", action: "create", description: "Create roles" },
  { code: "rbac.roles.edit", module: "rbac", action: "edit", description: "Edit roles" },
  { code: "rbac.permissions.view", module: "rbac", action: "view", description: "View permissions" },

  // Settings
  { code: "settings.general.view", module: "settings", action: "view", description: "View general settings" },
  { code: "settings.general.edit", module: "settings", action: "edit", description: "Edit general settings" },
  { code: "settings.invoice.view", module: "settings", action: "view", description: "View invoice settings" },
  { code: "settings.invoice.edit", module: "settings", action: "edit", description: "Edit invoice settings" },
  { code: "settings.tax.view", module: "settings", action: "view", description: "View tax config" },
  { code: "settings.tax.edit", module: "settings", action: "edit", description: "Edit tax config" },
  { code: "settings.payments.view", module: "settings", action: "view", description: "View payment methods" },
  { code: "settings.payments.edit", module: "settings", action: "edit", description: "Edit payment methods" },
  { code: "settings.notifications.view", module: "settings", action: "view", description: "View notification settings" },
  { code: "settings.notifications.edit", module: "settings", action: "edit", description: "Edit notification settings" },

  // Dashboard
  { code: "dashboard.view", module: "dashboard", action: "view", description: "View dashboard" },

  // Products
  { code: "products.view", module: "products", action: "view", description: "View products" },
  { code: "products.create", module: "products", action: "create", description: "Create products" },
  { code: "products.edit", module: "products", action: "edit", description: "Edit products" },
  { code: "products.delete", module: "products", action: "delete", description: "Delete products" },
  { code: "products.categories.view", module: "products", action: "view", description: "View categories" },
  { code: "products.categories.create", module: "products", action: "create", description: "Create categories" },
  { code: "products.brands.view", module: "products", action: "view", description: "View brands" },
  { code: "products.brands.create", module: "products", action: "create", description: "Create brands" },
  { code: "products.units.view", module: "products", action: "view", description: "View units" },
  { code: "products.units.create", module: "products", action: "create", description: "Create units" },
  { code: "products.pricelists.view", module: "products", action: "view", description: "View price lists" },
  { code: "products.pricelists.create", module: "products", action: "create", description: "Create price lists" },
  { code: "products.variants.view", module: "products", action: "view", description: "View variants" },
  { code: "products.variants.create", module: "products", action: "create", description: "Create variants" },

  // Customers
  { code: "customers.view", module: "customers", action: "view", description: "View customers" },
  { code: "customers.create", module: "customers", action: "create", description: "Create customers" },
  { code: "customers.edit", module: "customers", action: "edit", description: "Edit customers" },
  { code: "customers.delete", module: "customers", action: "delete", description: "Delete customers" },
  { code: "customers.groups.view", module: "customers", action: "view", description: "View customer groups" },
  { code: "customers.groups.create", module: "customers", action: "create", description: "Create customer groups" },
  { code: "customers.loyalty.view", module: "customers", action: "view", description: "View loyalty" },
  { code: "customers.wallet.view", module: "customers", action: "view", description: "View wallet" },
  { code: "customers.giftcards.view", module: "customers", action: "view", description: "View gift cards" },

  // Suppliers
  { code: "suppliers.view", module: "suppliers", action: "view", description: "View suppliers" },
  { code: "suppliers.create", module: "suppliers", action: "create", description: "Create suppliers" },
  { code: "suppliers.edit", module: "suppliers", action: "edit", description: "Edit suppliers" },
  { code: "suppliers.delete", module: "suppliers", action: "delete", description: "Delete suppliers" },
  { code: "suppliers.ledger.view", module: "suppliers", action: "view", description: "View supplier ledger" },

  // POS
  { code: "pos.sale", module: "pos", action: "create", description: "Create sales" },
  { code: "pos.register.view", module: "pos", action: "view", description: "View cash register" },
  { code: "pos.hold.view", module: "pos", action: "view", description: "View held sales" },

  // Sales
  { code: "sales.view", module: "sales", action: "view", description: "View sales" },
  { code: "sales.create", module: "sales", action: "create", description: "Create sales" },
  { code: "sales.edit", module: "sales", action: "edit", description: "Edit sales" },
  { code: "sales.delete", module: "sales", action: "delete", description: "Delete sales" },
  { code: "sales.refund", module: "sales", action: "refund", description: "Refund sales" },
  { code: "sales.quotations.view", module: "sales", action: "view", description: "View quotations" },
  { code: "sales.quotations.create", module: "sales", action: "create", description: "Create quotations" },
  { code: "sales.orders.view", module: "sales", action: "view", description: "View sales orders" },
  { code: "sales.orders.create", module: "sales", action: "create", description: "Create sales orders" },

  // Invoices
  { code: "invoices.view", module: "invoices", action: "view", description: "View invoices" },
  { code: "invoices.create", module: "invoices", action: "create", description: "Create invoices" },
  { code: "invoices.creditnotes.view", module: "invoices", action: "view", description: "View credit notes" },

  // Payments
  { code: "payments.view", module: "payments", action: "view", description: "View payments" },
  { code: "payments.create", module: "payments", action: "create", description: "Create payments" },
  { code: "payments.collections.view", module: "payments", action: "view", description: "View collections" },

  // Credit
  { code: "credit.view", module: "credit", action: "view", description: "View credit overview" },
  { code: "credit.aging.view", module: "credit", action: "view", description: "View aging report" },

  // Installments
  { code: "installments.view", module: "installments", action: "view", description: "View installment plans" },
  { code: "installments.create", module: "installments", action: "create", description: "Create installment plans" },
  { code: "installments.due.view", module: "installments", action: "view", description: "View due installments" },

  // Commission
  { code: "commission.view", module: "commission", action: "view", description: "View commissions" },
  { code: "commission.approve", module: "commission", action: "approve", description: "Approve commissions" },
  { code: "commission.agents.view", module: "commission", action: "view", description: "View agents" },

  // Inventory
  { code: "inventory.view", module: "inventory", action: "view", description: "View inventory" },
  { code: "inventory.adjustments.view", module: "inventory", action: "view", description: "View adjustments" },
  { code: "inventory.adjustments.create", module: "inventory", action: "create", description: "Create adjustments" },
  { code: "inventory.movements.view", module: "inventory", action: "view", description: "View stock movements" },
  { code: "inventory.transfers.view", module: "inventory", action: "view", description: "View transfers" },
  { code: "inventory.transfers.create", module: "inventory", action: "create", description: "Create transfers" },
  { code: "inventory.batches.view", module: "inventory", action: "view", description: "View batches" },
  { code: "inventory.serials.view", module: "inventory", action: "view", description: "View serial numbers" },

  // Purchases
  { code: "purchases.view", module: "purchases", action: "view", description: "View purchases" },
  { code: "purchases.create", module: "purchases", action: "create", description: "Create purchases" },
  { code: "purchases.grn.view", module: "purchases", action: "view", description: "View GRN" },
  { code: "purchases.invoices.view", module: "purchases", action: "view", description: "View purchase invoices" },

  // Accounting
  { code: "accounting.accounts.view", module: "accounting", action: "view", description: "View chart of accounts" },
  { code: "accounting.accounts.create", module: "accounting", action: "create", description: "Create accounts" },
  { code: "accounting.journals.view", module: "accounting", action: "view", description: "View journals" },
  { code: "accounting.journals.create", module: "accounting", action: "create", description: "Create journals" },
  { code: "accounting.ledger.view", module: "accounting", action: "view", description: "View general ledger" },
  { code: "accounting.trialbalance.view", module: "accounting", action: "view", description: "View trial balance" },
  { code: "accounting.pnl.view", module: "accounting", action: "view", description: "View profit & loss" },
  { code: "accounting.balancesheet.view", module: "accounting", action: "view", description: "View balance sheet" },

  // VAT
  { code: "vat.rules.view", module: "vat", action: "view", description: "View tax rules" },
  { code: "vat.rules.edit", module: "vat", action: "edit", description: "Edit tax rules" },
  { code: "vat.reports.view", module: "vat", action: "view", description: "View VAT reports" },

  // Returns
  { code: "returns.view", module: "returns", action: "view", description: "View returns" },
  { code: "returns.create", module: "returns", action: "create", description: "Create returns" },
  { code: "returns.rma.view", module: "returns", action: "view", description: "View RMA" },
  { code: "returns.warranty.view", module: "returns", action: "view", description: "View warranty claims" },

  // Loyalty
  { code: "loyalty.programs.view", module: "loyalty", action: "view", description: "View loyalty programs" },
  { code: "loyalty.programs.create", module: "loyalty", action: "create", description: "Create loyalty programs" },
  { code: "loyalty.points.view", module: "loyalty", action: "view", description: "View points ledger" },
  { code: "loyalty.tiers.view", module: "loyalty", action: "view", description: "View tiers" },

  // Promotions
  { code: "promotions.view", module: "promotions", action: "view", description: "View promotions" },
  { code: "promotions.create", module: "promotions", action: "create", description: "Create promotions" },
  { code: "promotions.coupons.view", module: "promotions", action: "view", description: "View coupons" },
  { code: "promotions.coupons.create", module: "promotions", action: "create", description: "Create coupons" },

  // Delivery
  { code: "delivery.view", module: "delivery", action: "view", description: "View deliveries" },
  { code: "delivery.assign", module: "delivery", action: "assign", description: "Assign deliveries" },
  { code: "delivery.riders.view", module: "delivery", action: "view", description: "View riders" },

  // HRM
  { code: "hrm.employees.view", module: "hrm", action: "view", description: "View employees" },
  { code: "hrm.employees.create", module: "hrm", action: "create", description: "Create employees" },
  { code: "hrm.departments.view", module: "hrm", action: "view", description: "View departments" },
  { code: "hrm.attendance.view", module: "hrm", action: "view", description: "View attendance" },
  { code: "hrm.shifts.view", module: "hrm", action: "view", description: "View shifts" },
  { code: "hrm.leave.view", module: "hrm", action: "view", description: "View leave" },
  { code: "hrm.payroll.view", module: "hrm", action: "view", description: "View payroll" },

  // Expenses
  { code: "expenses.view", module: "expenses", action: "view", description: "View expenses" },
  { code: "expenses.create", module: "expenses", action: "create", description: "Create expenses" },
  { code: "expenses.categories.view", module: "expenses", action: "view", description: "View expense categories" },
  { code: "expenses.pettycash.view", module: "expenses", action: "view", description: "View petty cash" },

  // Cash Register
  { code: "cashregister.current.view", module: "cashregister", action: "view", description: "View current shift" },
  { code: "cashregister.history.view", module: "cashregister", action: "view", description: "View shift history" },

  // Workflow
  { code: "workflow.pending.view", module: "workflow", action: "view", description: "View pending approvals" },
  { code: "workflow.approve", module: "workflow", action: "approve", description: "Approve items" },
  { code: "workflow.rules.view", module: "workflow", action: "view", description: "View workflow rules" },

  // Notifications
  { code: "notifications.view", module: "notifications", action: "view", description: "View notifications" },
  { code: "notifications.templates.view", module: "notifications", action: "view", description: "View templates" },

  // Audit
  { code: "audit.view", module: "audit", action: "view", description: "View audit logs" },

  // Reports
  { code: "reports.sales.view", module: "reports", action: "view", description: "View sales reports" },
  { code: "reports.inventory.view", module: "reports", action: "view", description: "View inventory reports" },
  { code: "reports.finance.view", module: "reports", action: "view", description: "View financial reports" },
  { code: "reports.customers.view", module: "reports", action: "view", description: "View customer reports" },
  { code: "reports.ai.view", module: "reports", action: "view", description: "View AI insights" },

  // Sync
  { code: "sync.status.view", module: "sync", action: "view", description: "View sync status" },
  { code: "sync.conflicts.view", module: "sync", action: "view", description: "View conflict queue" },

  // Documents
  { code: "documents.view", module: "documents", action: "view", description: "View documents" },
  { code: "documents.upload", module: "documents", action: "create", description: "Upload documents" },

  // Tasks
  { code: "tasks.view", module: "tasks", action: "view", description: "View tasks" },
  { code: "tasks.create", module: "tasks", action: "create", description: "Create tasks" },
  { code: "tasks.all.view", module: "tasks", action: "view", description: "View all tasks" },

  // Marketing
  { code: "marketing.campaigns.view", module: "marketing", action: "view", description: "View campaigns" },
  { code: "marketing.campaigns.create", module: "marketing", action: "create", description: "Create campaigns" },
  { code: "marketing.triggers.view", module: "marketing", action: "view", description: "View triggers" },

  // Targets
  { code: "targets.sales.view", module: "targets", action: "view", description: "View sales targets" },
  { code: "targets.sales.create", module: "targets", action: "create", description: "Create sales targets" },
  { code: "targets.budgets.view", module: "targets", action: "view", description: "View budgets" },

  // Appointments
  { code: "appointments.view", module: "appointments", action: "view", description: "View appointments" },
  { code: "appointments.create", module: "appointments", action: "create", description: "Create appointments" },
  { code: "appointments.queue.view", module: "appointments", action: "view", description: "View queue" },

  // Business Rules
  { code: "baserules.view", module: "baserules", action: "view", description: "View business rules" },
  { code: "baserules.create", module: "baserules", action: "create", description: "Create business rules" },

  // Integrations
  { code: "integrations.apikeys.view", module: "integrations", action: "view", description: "View API keys" },
  { code: "integrations.apikeys.create", module: "integrations", action: "create", description: "Create API keys" },
  { code: "integrations.webhooks.view", module: "integrations", action: "view", description: "View webhooks" },
  { code: "integrations.webhooks.create", module: "integrations", action: "create", description: "Create webhooks" },
  { code: "integrations.marketplace.view", module: "integrations", action: "view", description: "View marketplace" },

  // Restaurant (Industry)
  { code: "restaurant.floorplan.view", module: "restaurant", action: "view", description: "View floor plan" },
  { code: "restaurant.tables.view", module: "restaurant", action: "view", description: "View tables" },
  { code: "restaurant.kot.view", module: "restaurant", action: "view", description: "View KOT" },
  { code: "restaurant.kds.view", module: "restaurant", action: "view", description: "View KDS" },
  { code: "restaurant.menu.view", module: "restaurant", action: "view", description: "View menu" },
  { code: "restaurant.recipe.view", module: "restaurant", action: "view", description: "View recipes" },

  // Pharmacy (Industry)
  { code: "pharmacy.medicines.view", module: "pharmacy", action: "view", description: "View medicines" },
  { code: "pharmacy.prescriptions.view", module: "pharmacy", action: "view", description: "View prescriptions" },
  { code: "pharmacy.batches.view", module: "pharmacy", action: "view", description: "View batches" },

  // Retail (Industry)
  { code: "retail.barcodes.view", module: "retail", action: "view", description: "View barcode labels" },
  { code: "retail.variants.view", module: "retail", action: "view", description: "View variants" },

  // Grocery (Industry)
  { code: "grocery.plu.view", module: "grocery", action: "view", description: "View PLU codes" },
  { code: "grocery.weight.view", module: "grocery", action: "view", description: "View weight products" },

  // Wholesale (Industry)
  { code: "wholesale.pricing.view", module: "wholesale", action: "view", description: "View dealer pricing" },
  { code: "wholesale.territory.view", module: "wholesale", action: "view", description: "View territory" },
  { code: "wholesale.routes.view", module: "wholesale", action: "view", description: "View route sales" },

  // Manufacturing (Industry)
  { code: "manufacturing.orders.view", module: "manufacturing", action: "view", description: "View production orders" },
  { code: "manufacturing.bom.view", module: "manufacturing", action: "view", description: "View BOM" },
  { code: "manufacturing.materials.view", module: "manufacturing", action: "view", description: "View raw materials" },

  // Salon (Industry)
  { code: "salon.services.view", module: "salon", action: "view", description: "View services" },
  { code: "salon.schedule.view", module: "salon", action: "view", description: "View staff schedule" },
  { code: "salon.packages.view", module: "salon", action: "view", description: "View packages" },

  // Repair (Industry)
  { code: "repair.tickets.view", module: "repair", action: "view", description: "View tickets" },
  { code: "repair.technicians.view", module: "repair", action: "view", description: "View technicians" },
  { code: "repair.parts.view", module: "repair", action: "view", description: "View spare parts" },

  // Franchise (Industry)
  { code: "franchise.franchisees.view", module: "franchise", action: "view", description: "View franchisees" },
  { code: "franchise.royalty.view", module: "franchise", action: "view", description: "View royalty" },
  { code: "franchise.settlement.view", module: "franchise", action: "view", description: "View settlement" },
];

// ==================== ROLE DEFINITIONS ====================
// Predefined roles per spec §5

export interface RoleConfig {
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // permission codes
}

export const roles: RoleConfig[] = [
  {
    name: "Owner",
    description: "Full access to all modules and features",
    isSystem: true,
    permissions: permissions.map((p) => p.code), // All permissions
  },
  {
    name: "CEO",
    description: "Business oversight and management",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "sales.view", "sales.create", "sales.edit",
      "customers.view", "customers.create",
      "products.view", "products.create",
      "inventory.view",
      "reports.sales.view", "reports.inventory.view", "reports.finance.view",
      "hrm.employees.view",
      "expenses.view",
      "commission.view",
      "targets.sales.view", "targets.budgets.view",
    ],
  },
  {
    name: "Branch Manager",
    description: "Branch-level management",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "sales.view", "sales.create", "sales.edit",
      "customers.view", "customers.create",
      "products.view",
      "inventory.view", "inventory.adjustments.view", "inventory.adjustments.create",
      "purchases.view", "purchases.create",
      "expenses.view", "expenses.create",
      "cashregister.current.view", "cashregister.history.view",
      "hrm.employees.view",
      "reports.sales.view",
    ],
  },
  {
    name: "Accountant",
    description: "Financial management and reporting",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "accounting.accounts.view", "accounting.journals.view", "accounting.journals.create",
      "accounting.ledger.view", "accounting.trialbalance.view",
      "accounting.pnl.view", "accounting.balancesheet.view",
      "vat.rules.view", "vat.reports.view",
      "payments.view", "payments.create",
      "credit.view", "credit.aging.view",
      "expenses.view", "expenses.create",
      "reports.finance.view",
    ],
  },
  {
    name: "Sales Manager",
    description: "Sales team management",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "sales.view", "sales.create", "sales.edit",
      "customers.view", "customers.create", "customers.edit",
      "quotations.view", "quotations.create",
      "sales.orders.view", "sales.orders.create",
      "commission.view", "commission.agents.view",
      "reports.sales.view",
    ],
  },
  {
    name: "Salesperson",
    description: "Individual sales operations",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "pos.sale",
      "sales.view",
      "customers.view", "customers.create",
      "products.view",
    ],
  },
  {
    name: "Cashier",
    description: "POS and payment operations",
    isSystem: true,
    permissions: [
      "pos.sale",
      "pos.register.view",
      "customers.view",
      "products.view",
      "payments.view", "payments.create",
      "cashregister.current.view",
    ],
  },
  {
    name: "Inventory Manager",
    description: "Stock and inventory management",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "inventory.view", "inventory.adjustments.view", "inventory.adjustments.create",
      "inventory.movements.view", "inventory.transfers.view", "inventory.transfers.create",
      "inventory.batches.view", "inventory.serials.view",
      "products.view", "products.create", "products.edit",
      "purchases.view", "purchases.create", "purchases.grn.view",
      "reports.inventory.view",
    ],
  },
  {
    name: "Purchase Manager",
    description: "Purchasing and supplier management",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "purchases.view", "purchases.create", "purchases.grn.view", "purchases.invoices.view",
      "suppliers.view", "suppliers.create", "suppliers.edit",
      "inventory.view",
      "reports.inventory.view",
    ],
  },
  {
    name: "HR Manager",
    description: "Human resources management",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "hrm.employees.view", "hrm.employees.create",
      "hrm.departments.view",
      "hrm.attendance.view",
      "hrm.shifts.view",
      "hrm.leave.view",
      "hrm.payroll.view",
    ],
  },
  {
    name: "Waiter",
    description: "Restaurant service operations",
    isSystem: true,
    permissions: [
      "pos.sale",
      "restaurant.floorplan.view",
      "restaurant.tables.view",
      "restaurant.kot.view",
      "restaurant.menu.view",
    ],
  },
  {
    name: "Kitchen Staff",
    description: "Kitchen operations",
    isSystem: true,
    permissions: [
      "restaurant.kds.view",
      "restaurant.kot.view",
      "restaurant.menu.view",
      "restaurant.recipe.view",
    ],
  },
  {
    name: "Pharmacist",
    description: "Pharmacy operations",
    isSystem: true,
    permissions: [
      "pos.sale",
      "pharmacy.medicines.view",
      "pharmacy.prescriptions.view",
      "pharmacy.batches.view",
      "customers.view",
      "inventory.view",
    ],
  },
  {
    name: "Delivery Rider",
    description: "Delivery operations",
    isSystem: true,
    permissions: [
      "delivery.view",
    ],
  },
];

// ==================== HELPER FUNCTIONS ====================

/**
 * Get all permissions for a given module
 */
export function getModulePermissions(moduleCode: string): PermissionConfig[] {
  return permissions.filter((p) => p.module === moduleCode);
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(roleName: string, permissionCode: string): boolean {
  const role = roles.find((r) => r.name === roleName);
  return role?.permissions.includes(permissionCode) ?? false;
}

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(permissionCode: string): string[] {
  return roles.filter((r) => r.permissions.includes(permissionCode)).map((r) => r.name);
}
