"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Star,
  Wallet as WalletIcon,
  Gift,
  Plus,
  Crown,
  Users,
  Coins,
  Search,
  CheckCircle2,
  Pencil,
  Trash2,
  Settings,
  ArrowDownToLine,
  ArrowUpFromLine,
  Ban,
  Receipt,
  FileText,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  CustomBreadcrumb,
  CustomButton,
  CustomStatCard,
  CustomTabs,
  CustomTable,
  type CustomTableColumn,
  CustomModal,
  ConfirmModal,
  CustomDropdownSelect,
} from "@/components/custom";
import { toast } from "react-toastify";

type Tab = "loyalty" | "wallet" | "gift";

const currency = (v: any) =>
  `৳${(Number(v) || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

interface LoyaltyAccount {
  id: string;
  customerId: string;
  customerName?: string;
  phone?: string | null;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: string;
  status: string;
}

interface Tier {
  id: string;
  name: string;
  code: string;
  minPoints: number;
  multiplier: number;
  cashbackRate: number;
  benefits: string | null;
  color: string | null;
  isActive: number;
}

interface LedgerRow {
  id: string;
  type: string;
  amount?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  note?: string | null;
  createdAt: string;
}

interface WalletAccount {
  id: string;
  customerId: string;
  customerName?: string;
  phone?: string | null;
  balance: number;
  lifetimeCredited: number;
  lifetimeDebited: number;
  status: string;
}

interface GiftCard {
  id: string;
  cardNo: string;
  cardType: string;
  barcode: string | null;
  initialAmount: number;
  balance: number;
  expiryDate: string | null;
  status: string;
  issuedToName: string | null;
  issuedToCustomerId: string | null;
}

interface TierTheme {
  cardBg: string;
  borderColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  statsBg: string;
  statsBorder: string;
  accentText: string;
  memberPill: string;
}

const TIER_THEMES: Record<string, TierTheme> = {
  BRONZE: {
    cardBg: "bg-gradient-to-b from-amber-50/80 via-orange-50/30 to-amber-50/10",
    borderColor: "border-amber-200/90 hover:border-amber-400",
    badgeBg: "bg-amber-100/90",
    badgeBorder: "border-amber-300",
    badgeText: "text-amber-900",
    statsBg: "bg-amber-50/70",
    statsBorder: "border-amber-200/80",
    accentText: "text-amber-900",
    memberPill: "bg-amber-100/80 border-amber-200/90 text-amber-900",
  },
  SILVER: {
    cardBg: "bg-gradient-to-b from-slate-100/90 via-slate-50/40 to-slate-100/20",
    borderColor: "border-slate-300/90 hover:border-slate-400",
    badgeBg: "bg-slate-200/90",
    badgeBorder: "border-slate-300",
    badgeText: "text-slate-800",
    statsBg: "bg-slate-100/70",
    statsBorder: "border-slate-200/90",
    accentText: "text-slate-800",
    memberPill: "bg-slate-200/80 border-slate-300/90 text-slate-800",
  },
  GOLD: {
    cardBg: "bg-gradient-to-b from-yellow-50/90 via-amber-50/40 to-yellow-50/20",
    borderColor: "border-yellow-300/90 hover:border-yellow-400",
    badgeBg: "bg-yellow-100/90",
    badgeBorder: "border-yellow-300",
    badgeText: "text-yellow-900",
    statsBg: "bg-yellow-50/70",
    statsBorder: "border-yellow-200/90",
    accentText: "text-yellow-900",
    memberPill: "bg-yellow-100/80 border-yellow-200/90 text-yellow-900",
  },
  VIP: {
    cardBg: "bg-gradient-to-b from-sky-50/90 via-cyan-50/30 to-sky-50/10",
    borderColor: "border-sky-300/90 hover:border-sky-400",
    badgeBg: "bg-sky-100/90",
    badgeBorder: "border-sky-300",
    badgeText: "text-[#0369A1]",
    statsBg: "bg-sky-50/70",
    statsBorder: "border-sky-200/90",
    accentText: "text-[#0369A1]",
    memberPill: "bg-sky-100/80 border-sky-200/90 text-[#0369A1]",
  },
  PLATINUM: {
    cardBg: "bg-gradient-to-b from-indigo-50/80 via-blue-50/30 to-indigo-50/10",
    borderColor: "border-indigo-200/90 hover:border-indigo-400",
    badgeBg: "bg-indigo-100/90",
    badgeBorder: "border-indigo-300",
    badgeText: "text-indigo-900",
    statsBg: "bg-indigo-50/70",
    statsBorder: "border-indigo-200/80",
    accentText: "text-indigo-900",
    memberPill: "bg-indigo-100/80 border-indigo-200/90 text-indigo-900",
  },
};

const ORDERED_TIER_STYLES: TierTheme[] = [
  TIER_THEMES.BRONZE,
  TIER_THEMES.SILVER,
  TIER_THEMES.GOLD,
  TIER_THEMES.VIP,
];

const TIER_BADGES: Record<string, { bg: string; border: string; text: string }> = {
  BRONZE: {
    bg: TIER_THEMES.BRONZE.badgeBg,
    border: TIER_THEMES.BRONZE.badgeBorder,
    text: TIER_THEMES.BRONZE.badgeText,
  },
  SILVER: {
    bg: TIER_THEMES.SILVER.badgeBg,
    border: TIER_THEMES.SILVER.badgeBorder,
    text: TIER_THEMES.SILVER.badgeText,
  },
  GOLD: {
    bg: TIER_THEMES.GOLD.badgeBg,
    border: TIER_THEMES.GOLD.badgeBorder,
    text: TIER_THEMES.GOLD.badgeText,
  },
  VIP: {
    bg: TIER_THEMES.VIP.badgeBg,
    border: TIER_THEMES.VIP.badgeBorder,
    text: TIER_THEMES.VIP.badgeText,
  },
  PLATINUM: {
    bg: TIER_THEMES.PLATINUM.badgeBg,
    border: TIER_THEMES.PLATINUM.badgeBorder,
    text: TIER_THEMES.PLATINUM.badgeText,
  },
};

export default function LoyaltyPage() {
  const [tab, setTab] = useState<Tab>("loyalty");

  // ── Loyalty State ──
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [accSearch, setAccSearch] = useState("");
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);

  // Modals for Loyalty
  const [showTier, setShowTier] = useState(false);
  const [tierForm, setTierForm] = useState({
    name: "",
    code: "",
    minPoints: "",
    multiplier: "1.0",
    cashbackRate: "0",
    benefits: "",
    color: "amber",
  });
  const [submittingTier, setSubmittingTier] = useState(false);

  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [editTierForm, setEditTierForm] = useState<any>({});
  const [savingEditTier, setSavingEditTier] = useState(false);

  const [tierToDelete, setTierToDelete] = useState<Tier | null>(null);
  const [deletingTier, setDeletingTier] = useState(false);

  const [earnAcc, setEarnAcc] = useState<LoyaltyAccount | null>(null);
  const [earnAmount, setEarnAmount] = useState("");
  const [earningPoints, setEarningPoints] = useState(false);

  const [redeemAcc, setRedeemAcc] = useState<LoyaltyAccount | null>(null);
  const [redeemPts, setRedeemPts] = useState("");
  const [redeemingPoints, setRedeemingPoints] = useState(false);

  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerFor, setLedgerFor] = useState<LoyaltyAccount | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [settings, setSettings] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Wallet State ──
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [walSearch, setWalSearch] = useState("");
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [walletDetail, setWalletDetail] = useState<any>(null);
  const [walTxModal, setWalTxModal] = useState<{ mode: "credit" | "debit"; account: WalletAccount } | null>(null);
  const [walForm, setWalForm] = useState<{ type: string; amount: string; note: string }>({
    type: "ADD",
    amount: "",
    note: "",
  });
  const [submittingWalTx, setSubmittingWalTx] = useState(false);

  // ── Gift Cards State ──
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [gcSearch, setGcSearch] = useState("");
  const [loadingGiftCards, setLoadingGiftCards] = useState(false);
  const [showGc, setShowGc] = useState(false);
  const [gcForm, setGcForm] = useState({
    cardNo: "",
    cardType: "DIGITAL",
    initialAmount: "",
    expiryDate: "",
    issuedToCustomerId: "",
  });
  const [submittingGc, setSubmittingGc] = useState(false);

  const [gcDetail, setGcDetail] = useState<any>(null);
  const [gcTxModal, setGcTxModal] = useState<{ mode: "redeem" | "reload"; card: GiftCard } | null>(null);
  const [gcTxForm, setGcTxForm] = useState({ amount: "" });
  const [submittingGcTx, setSubmittingGcTx] = useState(false);
  const [cardToDisable, setCardToDisable] = useState<GiftCard | null>(null);
  const [disablingCard, setDisablingCard] = useState(false);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // ── Data Fetching ──
  const loadCustomers = useCallback(async () => {
    try {
      const res = await api.get<{ data: CustomerOption[] }>("/v1/customers?limit=200");
      setCustomers(res.data || []);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const loadLoyalty = useCallback(async () => {
    setLoadingLoyalty(true);
    try {
      const [t, a, s] = await Promise.all([
        api.get<{ data: Tier[] }>("/v1/loyalty/tiers"),
        api.get<{ data: LoyaltyAccount[] }>(
          `/v1/loyalty/accounts${accSearch ? `?search=${encodeURIComponent(accSearch)}` : ""}`
        ),
        api.get<{ data: any }>("/v1/loyalty/settings"),
      ]);
      setTiers(t.data || []);
      setAccounts(a.data || []);
      setSettings(s.data);
      setSettingsForm(s.data || {});
    } catch (err: any) {
      console.error("Failed to load loyalty data:", err);
      toast.error(err.message || "Failed to load loyalty information");
    } finally {
      setLoadingLoyalty(false);
    }
  }, [accSearch]);

  const loadWallets = useCallback(async () => {
    setLoadingWallets(true);
    try {
      const res = await api.get<{ data: WalletAccount[] }>(
        `/v1/wallet/accounts${walSearch ? `?search=${encodeURIComponent(walSearch)}` : ""}`
      );
      setWallets(res.data || []);
    } catch (err: any) {
      console.error("Failed to load wallet accounts:", err);
      toast.error(err.message || "Failed to load wallet data");
    } finally {
      setLoadingWallets(false);
    }
  }, [walSearch]);

  const loadGiftCards = useCallback(async () => {
    setLoadingGiftCards(true);
    try {
      const res = await api.get<{ data: GiftCard[] }>(
        `/v1/gift-cards${gcSearch ? `?search=${encodeURIComponent(gcSearch)}` : ""}`
      );
      setGiftCards(res.data || []);
    } catch (err: any) {
      console.error("Failed to load gift cards:", err);
      toast.error(err.message || "Failed to load gift cards");
    } finally {
      setLoadingGiftCards(false);
    }
  }, [gcSearch]);

  useEffect(() => {
    loadLoyalty();
  }, [loadLoyalty]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    loadGiftCards();
  }, [loadGiftCards]);

  // Derived Totals
  const tierTotals = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of accounts) c[a.tier] = (c[a.tier] || 0) + 1;
    return c;
  }, [accounts]);

  const totalPoints = accounts.reduce((s, a) => s + Number(a.pointsBalance || 0), 0);
  const walletTotal = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);
  const gcBalance = giftCards
    .filter((g) => g.status === "ACTIVE")
    .reduce((s, g) => s + Number(g.balance || 0), 0);

  // ── Actions ──
  async function createTier() {
    if (!tierForm.name.trim() || !tierForm.code.trim()) {
      toast.warning("Tier name and code are required.");
      return;
    }
    setSubmittingTier(true);
    try {
      await api.post("/v1/loyalty/tiers", {
        name: tierForm.name.trim(),
        code: tierForm.code.trim().toUpperCase(),
        minPoints: Number(tierForm.minPoints) || 0,
        multiplier: Number(tierForm.multiplier) || 1,
        cashbackRate: Number(tierForm.cashbackRate) || 0,
        benefits: tierForm.benefits.trim() || null,
        color: tierForm.color || "amber",
      });
      setShowTier(false);
      toast.success(`Tier "${tierForm.name.trim()}" created successfully!`);
      loadLoyalty();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to create tier");
    } finally {
      setSubmittingTier(false);
    }
  }

  async function toggleTier(t: Tier) {
    try {
      const nextStatus = t.isActive ? 0 : 1;
      await api.patch(`/v1/loyalty/tiers/${t.id}`, { isActive: nextStatus });
      toast.success(`Tier "${t.name}" ${nextStatus ? "activated" : "deactivated"}.`);
      loadLoyalty();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update tier status");
    }
  }

  function openEditTier(t: Tier) {
    setEditingTier(t);
    setEditTierForm({
      name: t.name,
      code: t.code,
      minPoints: String(t.minPoints),
      multiplier: String(t.multiplier),
      cashbackRate: String(t.cashbackRate),
      benefits: t.benefits || "",
      color: t.color || "amber",
    });
  }

  async function saveEditTier() {
    if (!editingTier) return;
    if (!editTierForm.name.trim() || !editTierForm.code.trim()) {
      toast.warning("Tier name and code are required.");
      return;
    }
    setSavingEditTier(true);
    try {
      await api.patch(`/v1/loyalty/tiers/${editingTier.id}`, {
        name: editTierForm.name.trim(),
        code: editTierForm.code.trim().toUpperCase(),
        minPoints: Number(editTierForm.minPoints) || 0,
        multiplier: Number(editTierForm.multiplier) || 1,
        cashbackRate: Number(editTierForm.cashbackRate) || 0,
        benefits: editTierForm.benefits?.trim() || null,
        color: editTierForm.color,
      });
      setEditingTier(null);
      toast.success(`Tier "${editTierForm.name.trim()}" updated successfully!`);
      loadLoyalty();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to update tier");
    } finally {
      setSavingEditTier(false);
    }
  }

  async function confirmDeleteTier() {
    if (!tierToDelete) return;
    setDeletingTier(true);
    try {
      await api.del(`/v1/loyalty/tiers/${tierToDelete.id}`);
      setTiers((prev) => prev.filter((t) => t.id !== tierToDelete.id));
      toast.success(`Tier "${tierToDelete.name}" deleted successfully.`);
      setTierToDelete(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to delete tier");
    } finally {
      setDeletingTier(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      await api.put("/v1/loyalty/settings", {
        pointsPerAmount: Number(settingsForm.pointsPerAmount) || 0,
        redeemValuePerPoint: Number(settingsForm.redeemValuePerPoint) || 0,
        expiryMonths: Number(settingsForm.expiryMonths) || 0,
        minRedeemPoints: Number(settingsForm.minRedeemPoints) || 0,
        earnEnabled: settingsForm.earnEnabled ? 1 : 0,
        redeemEnabled: settingsForm.redeemEnabled ? 1 : 0,
      });
      setShowSettings(false);
      toast.success("Loyalty earn rules & settings updated successfully!");
      loadLoyalty();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function earnPoints() {
    if (!earnAcc || !earnAmount) return;
    setEarningPoints(true);
    try {
      const res = await api.post<{ data: any }>("/v1/loyalty/earn", {
        customerId: earnAcc.customerId,
        amount: Number(earnAmount),
      });
      setEarnAcc(null);
      setEarnAmount("");
      toast.success(
        `Earned ${res.data?.pointsEarned || 0} pts for ${earnAcc.customerName} → Current Tier: ${res.data?.tier}`
      );
      loadLoyalty();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to process earned points");
    } finally {
      setEarningPoints(false);
    }
  }

  async function redeemPoints() {
    if (!redeemAcc || !redeemPts) return;
    setRedeemingPoints(true);
    try {
      const res = await api.post<{ data: any }>("/v1/loyalty/redeem", {
        customerId: redeemAcc.customerId,
        points: Number(redeemPts),
      });
      setRedeemAcc(null);
      setRedeemPts("");
      toast.success(
        `Redeemed ${res.data?.pointsRedeemed || 0} pts (${currency(res.data?.discountValue)}) for ${redeemAcc.customerName}`
      );
      loadLoyalty();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to redeem points");
    } finally {
      setRedeemingPoints(false);
    }
  }

  async function openLedger(acc: LoyaltyAccount) {
    setLedgerFor(acc);
    setLedger([]);
    setLedgerLoading(true);
    try {
      const res = await api.get<{ data: any }>(`/v1/loyalty/accounts/${acc.customerId}`);
      setLedger(res.data.transactions ?? []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load loyalty ledger history");
    } finally {
      setLedgerLoading(false);
    }
  }

  async function walletCredit() {
    if (!walTxModal || !walForm.amount) return;
    setSubmittingWalTx(true);
    try {
      await api.post("/v1/wallet/credit", {
        customerId: walTxModal.account.customerId,
        amount: Number(walForm.amount),
        type: walForm.type,
        note: walForm.note.trim() || null,
      });
      setWalTxModal(null);
      setWalForm({ type: "ADD", amount: "", note: "" });
      toast.success(`Wallet credited with ${currency(walForm.amount)}!`);
      loadWallets();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to credit wallet");
    } finally {
      setSubmittingWalTx(false);
    }
  }

  async function walletDebit() {
    if (!walTxModal || !walForm.amount) return;
    setSubmittingWalTx(true);
    try {
      await api.post("/v1/wallet/debit", {
        customerId: walTxModal.account.customerId,
        amount: Number(walForm.amount),
        note: walForm.note.trim() || null,
      });
      setWalTxModal(null);
      setWalForm({ type: "ADD", amount: "", note: "" });
      toast.success(`Wallet debited with ${currency(walForm.amount)}.`);
      loadWallets();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to debit wallet");
    } finally {
      setSubmittingWalTx(false);
    }
  }

  async function openWalletDetail(acc: WalletAccount) {
    try {
      const res = await api.get<{ data: any }>(`/v1/wallet/accounts/${acc.customerId}`);
      const d = res.data;
      setWalletDetail({
        ...(d.wallet ?? d),
        customerName: d.customerName ?? acc.customerName,
        phone: d.phone ?? acc.phone,
        transactions: d.transactions ?? [],
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load wallet ledger");
    }
  }

  async function createGiftCard() {
    if (!gcForm.initialAmount) {
      toast.warning("Initial amount is required.");
      return;
    }
    setSubmittingGc(true);
    try {
      await api.post("/v1/gift-cards", {
        ...gcForm,
        initialAmount: Number(gcForm.initialAmount),
        issuedToCustomerId: gcForm.issuedToCustomerId || undefined,
      });
      setShowGc(false);
      toast.success("Gift card issued successfully!");
      loadGiftCards();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to issue gift card");
    } finally {
      setSubmittingGc(false);
    }
  }

  async function openGcDetail(gc: GiftCard) {
    try {
      const res = await api.get<{ data: any }>(`/v1/gift-cards/${gc.id}`);
      setGcDetail(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load card details");
    }
  }

  async function gcTx() {
    if (!gcTxModal || !gcTxForm.amount) return;
    const ep = gcTxModal.mode === "redeem" ? "redeem" : "reload";
    setSubmittingGcTx(true);
    try {
      await api.post(`/v1/gift-cards/${gcTxModal.card.id}/${ep}`, {
        amount: Number(gcTxForm.amount),
      });
      setGcTxModal(null);
      setGcTxForm({ amount: "" });
      toast.success(`Card ${ep === "redeem" ? "redeemed" : "reloaded"} with ${currency(gcTxForm.amount)}!`);
      loadGiftCards();
      if (gcDetail) openGcDetail(gcDetail);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to process gift card transaction");
    } finally {
      setSubmittingGcTx(false);
    }
  }

  async function confirmDisableGc() {
    if (!cardToDisable) return;
    setDisablingCard(true);
    try {
      await api.post(`/v1/gift-cards/${cardToDisable.id}/disable`, {
        reason: "Disabled from administrative console",
      });
      toast.success(`Gift card ${cardToDisable.cardNo} has been disabled.`);
      setCardToDisable(null);
      loadGiftCards();
      if (gcDetail) openGcDetail(gcDetail);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || "Failed to disable card");
    } finally {
      setDisablingCard(false);
    }
  }

  // Common UI styling classes
  const inputClass =
    "w-full rounded-sm border border-sky-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs transition";
  const labelClass = "block text-xs font-semibold text-[#0369A1] mb-1.5";

  // ── CustomTable Columns ──
  const loyaltyColumns: CustomTableColumn<LoyaltyAccount>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (a) => (
        <div>
          <p className="text-xs font-bold text-gray-600">{a.customerName || "—"}</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">{a.phone || "No phone"}</p>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (a) => {
        const badge = TIER_BADGES[a.tier] || TIER_BADGES.VIP;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-sm border px-2.5 py-0.5 text-[10.5px] font-bold ${badge.bg} ${badge.border} ${badge.text}`}
          >
            <Crown size={11} /> {a.tier}
          </span>
        );
      },
    },
    {
      key: "pointsBalance",
      header: "Points Balance",
      sortable: true,
      getSortValue: (a) => Number(a.pointsBalance || 0),
      render: (a) => (
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200 shadow-2xs">
          <Coins size={12} className="text-amber-600" />
          {Number(a.pointsBalance || 0).toLocaleString()} pts
        </span>
      ),
    },
    {
      key: "lifetimeEarned",
      header: "Lifetime Earned",
      sortable: true,
      getSortValue: (a) => Number(a.lifetimeEarned || 0),
      render: (a) => (
        <span className="text-xs font-semibold text-gray-600">
          {Number(a.lifetimeEarned || 0).toLocaleString()} pts
        </span>
      ),
    },
    {
      key: "lifetimeRedeemed",
      header: "Lifetime Redeemed",
      sortable: true,
      getSortValue: (a) => Number(a.lifetimeRedeemed || 0),
      render: (a) => (
        <span className="text-xs font-semibold text-gray-500">
          {Number(a.lifetimeRedeemed || 0).toLocaleString()} pts
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <CustomButton
            variant="primary"
            themeColor="emerald"
            size="xs"
            onClick={() => {
              setEarnAcc(a);
              setEarnAmount("");
            }}
            leftIcon={<Plus size={12} />}
          >
            Earn
          </CustomButton>
          <CustomButton
            variant="primary"
            themeColor="amber"
            size="xs"
            onClick={() => {
              setRedeemAcc(a);
              setRedeemPts("");
            }}
            leftIcon={<Coins size={12} />}
          >
            Redeem
          </CustomButton>
          <CustomButton
            variant="primary"
            themeColor="primary"
            size="xs"
            onClick={() => openLedger(a)}
            leftIcon={<FileText size={12} />}
          >
            Ledger
          </CustomButton>
        </div>
      ),
    },
  ];

  const walletColumns: CustomTableColumn<WalletAccount>[] = [
    {
      key: "customer",
      header: "Customer",
      render: (w) => (
        <div>
          <p className="text-xs font-bold text-gray-600">{w.customerName || "—"}</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">{w.phone || "No phone"}</p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Current Balance",
      sortable: true,
      getSortValue: (w) => Number(w.balance || 0),
      render: (w) => (
        <span className="font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-sm shadow-2xs">
          {currency(w.balance)}
        </span>
      ),
    },
    {
      key: "lifetimeCredited",
      header: "Lifetime Credited",
      sortable: true,
      getSortValue: (w) => Number(w.lifetimeCredited || 0),
      render: (w) => (
        <span className="text-xs font-semibold text-gray-600">{currency(w.lifetimeCredited)}</span>
      ),
    },
    {
      key: "lifetimeDebited",
      header: "Lifetime Debited",
      sortable: true,
      getSortValue: (w) => Number(w.lifetimeDebited || 0),
      render: (w) => (
        <span className="text-xs font-semibold text-gray-500">{currency(w.lifetimeDebited)}</span>
      ),
    },
    {
      key: "status",
      header: "Account Status",
      render: (w) => (
        <span
          className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10.5px] font-semibold border ${
            w.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          {w.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (w) => (
        <div className="flex items-center justify-end gap-1.5">
          <CustomButton
            variant="primary"
            themeColor="emerald"
            size="xs"
            onClick={() => {
              setWalTxModal({ mode: "credit", account: w });
              setWalForm({ type: "ADD", amount: "", note: "" });
            }}
            leftIcon={<ArrowDownToLine size={12} />}
          >
            Credit
          </CustomButton>
          <CustomButton
            variant="primary"
            themeColor="rose"
            size="xs"
            onClick={() => {
              setWalTxModal({ mode: "debit", account: w });
              setWalForm({ type: "ADD", amount: "", note: "" });
            }}
            leftIcon={<ArrowUpFromLine size={12} />}
          >
            Debit
          </CustomButton>
          <CustomButton
            variant="primary"
            themeColor="primary"
            size="xs"
            onClick={() => openWalletDetail(w)}
            leftIcon={<FileText size={12} />}
          >
            Statement
          </CustomButton>
        </div>
      ),
    },
  ];

  const giftCardColumns: CustomTableColumn<GiftCard>[] = [
    {
      key: "cardNo",
      header: "Card Details",
      render: (g) => (
        <div>
          <p className="font-mono text-xs font-bold text-[#0369A1]">{g.cardNo}</p>
          <p className="text-[11px] font-medium text-gray-400 mt-0.5">
            {g.cardType}
            {g.barcode && g.barcode !== g.cardNo ? ` · ${g.barcode}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "holder",
      header: "Issued Holder",
      render: (g) => (
        <span className="text-xs font-semibold text-gray-600">{g.issuedToName || "— Anonymous —"}</span>
      ),
    },
    {
      key: "initialAmount",
      header: "Initial Value",
      render: (g) => (
        <span className="text-xs font-semibold text-gray-600">{currency(g.initialAmount)}</span>
      ),
    },
    {
      key: "balance",
      header: "Remaining Balance",
      sortable: true,
      getSortValue: (g) => Number(g.balance || 0),
      render: (g) => (
        <span className="font-bold text-xs text-[#0284C7] bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-sm shadow-2xs">
          {currency(g.balance)}
        </span>
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (g) => (
        <span className="text-xs text-gray-500 font-medium">
          {g.expiryDate ? new Date(g.expiryDate).toLocaleDateString("en-GB") : "Never"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (g) => (
        <span
          className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10.5px] font-semibold border ${
            g.status === "ACTIVE"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : g.status === "EXPIRED"
              ? "bg-slate-100 text-slate-600 border-slate-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {g.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (g) => (
        <div className="flex items-center justify-end gap-1.5">
          <CustomButton
            variant="primary"
            themeColor="primary"
            size="xs"
            disabled={g.status !== "ACTIVE"}
            onClick={() => {
              setGcTxModal({ mode: "redeem", card: g });
              setGcTxForm({ amount: "" });
            }}
            leftIcon={<Coins size={12} />}
          >
            Redeem
          </CustomButton>
          <CustomButton
            variant="primary"
            themeColor="emerald"
            size="xs"
            disabled={g.status !== "ACTIVE"}
            onClick={() => {
              setGcTxModal({ mode: "reload", card: g });
              setGcTxForm({ amount: "" });
            }}
            leftIcon={<Plus size={12} />}
          >
            Reload
          </CustomButton>
          <CustomButton
            variant="secondary"
            size="xs"
            onClick={() => openGcDetail(g)}
            leftIcon={<Receipt size={12} />}
          >
            History
          </CustomButton>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-5 pb-12 select-none">
      {/* ── Breadcrumb Header ── */}
      <CustomBreadcrumb
        title="Loyalty, Wallets & Gift Cards"
        subtitle="Manage customer loyalty points, membership tier rules, digital wallet credits, and gift voucher cards."
        icon={<Star size={18} />}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Customers", href: "/customers" },
          { label: "Loyalty & Rewards" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tab === "loyalty" && (
              <>
                <CustomButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  leftIcon={<Settings size={14} className="text-[#0284C7]" />}
                >
                  Earn Rules & Settings
                </CustomButton>
                <CustomButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setTierForm({
                      name: "",
                      code: "",
                      minPoints: "",
                      multiplier: "1.0",
                      cashbackRate: "0",
                      benefits: "",
                      color: "amber",
                    });
                    setShowTier(true);
                  }}
                  leftIcon={<Plus size={14} />}
                >
                  Create Tier
                </CustomButton>
              </>
            )}

            {tab === "gift" && (
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => {
                  loadCustomers();
                  setGcForm({
                    cardNo: "",
                    cardType: "DIGITAL",
                    initialAmount: "",
                    expiryDate: "",
                    issuedToCustomerId: "",
                  });
                  setShowGc(true);
                }}
                leftIcon={<Plus size={14} />}
              >
                Issue Gift Card
              </CustomButton>
            )}
          </div>
        }
      />

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <CustomStatCard
          label="Total Loyalty Members"
          value={String(accounts.length)}
          subtitle="Enrolled customer accounts"
          icon={Users}
          tone="primary"
        />
        <CustomStatCard
          label="Points in Circulation"
          value={totalPoints.toLocaleString()}
          subtitle="Active redeemable balance"
          icon={Coins}
          tone="amber"
        />
        <CustomStatCard
          label="Digital Wallet Balance"
          value={currency(walletTotal)}
          subtitle="Customer prepaid credits"
          icon={WalletIcon}
          tone="green"
        />
        <CustomStatCard
          label="Active Gift Cards Value"
          value={currency(gcBalance)}
          subtitle="Outstanding voucher funds"
          icon={Gift}
          tone="blue"
        />
      </div>

      {/* ── Tabs Navigation (Clearly visible inactive tabs) ── */}
      <div className="p-1 rounded-sm bg-sky-50/40 border border-sky-100/90 shadow-2xs">
        <CustomTabs
          tabs={[
            {
              id: "loyalty",
              label: "Points & Membership Tiers",
              icon: <Star size={14} />,
              badge: accounts.length,
            },
            {
              id: "wallet",
              label: "Digital Customer Wallets",
              icon: <WalletIcon size={14} />,
              badge: wallets.length,
            },
            {
              id: "gift",
              label: "Gift Cards & Vouchers",
              icon: <Gift size={14} />,
              badge: giftCards.length,
            },
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as Tab)}
          themeColor="primary"
          className="bg-transparent border-0 shadow-none p-0"
        />
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── TAB 1: LOYALTY & TIERS ── */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "loyalty" && (
        <div className="space-y-5">
          {/* Membership Tier Cards Section */}
          <div className="space-y-3.5">
            {/* Structured Section Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-sm border border-sky-100/90 bg-white p-3.5 px-4 sm:px-5 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-sky-50 text-[#0284C7] border border-sky-200/80 shadow-2xs">
                  <Crown size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0369A1]">Configured Membership Tiers</h2>
                  <p className="text-xs text-gray-500 font-medium">Automatic qualification rules, points multipliers & cashback tier benefits</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-sm bg-sky-50 border border-sky-200/80 px-2.5 py-1 text-xs font-bold text-[#0284C7] shadow-2xs">
                  {tiers.length} Active Tiers
                </span>
              </div>
            </div>

            {/* Tier Cards Grid (4 distinct backgrounds, theme-colored toggle switch) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t, idx) => {
                const theme = TIER_THEMES[t.code.toUpperCase()] || ORDERED_TIER_STYLES[idx % 4];
                return (
                  <div
                    key={t.id}
                    className={`relative flex flex-col justify-between rounded-sm border ${theme.borderColor} ${theme.cardBg} p-4 shadow-2xs hover:shadow-md transition-all space-y-3.5`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-xs font-bold ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}
                        >
                          <Crown size={12} /> {t.name}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleTier(t)}
                          title={t.isActive ? "Deactivate Tier" : "Activate Tier"}
                          className={`relative h-5 w-9 rounded-full transition-all cursor-pointer shrink-0 ${
                            t.isActive ? "bg-gradient-to-r from-[#0284C7] to-[#0EA5E9]" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-xs transition-all ${
                              t.isActive ? "left-4" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-xs font-medium text-gray-600 min-h-[32px] line-clamp-2 leading-relaxed">
                        {t.benefits || "Standard tier benefits applied upon points qualification threshold."}
                      </p>

                      <div className={`grid grid-cols-2 gap-2 text-center rounded-sm ${theme.statsBg} border ${theme.statsBorder} p-2.5`}>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500">Min Points</p>
                          <p className={`text-xs sm:text-sm font-bold ${theme.accentText} mt-0.5`}>
                            {t.minPoints.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500">Multiplier</p>
                          <p className={`text-xs sm:text-sm font-bold ${theme.accentText} mt-0.5`}>{t.multiplier}×</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-0.5 font-semibold">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${theme.memberPill} border px-2 py-0.5 rounded-sm`}>
                          {tierTotals[t.code] || 0} Members
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700">{t.cashbackRate}% Cashback</span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="border-t border-sky-100/80 pt-2.5 flex items-center justify-end gap-1.5">
                      <CustomButton
                        variant="outline"
                        size="xs"
                        onClick={() => openEditTier(t)}
                        leftIcon={<Pencil size={11} />}
                      >
                        Edit
                      </CustomButton>
                      <CustomButton
                        variant="danger"
                        size="xs"
                        onClick={() => setTierToDelete(t)}
                        leftIcon={<Trash2 size={11} />}
                      >
                        Delete
                      </CustomButton>
                    </div>
                  </div>
                );
              })}

              {tiers.length === 0 && !loadingLoyalty && (
                <div className="col-span-full py-8 text-center rounded-sm border border-dashed border-sky-200 bg-sky-50/20 text-xs text-gray-400">
                  No loyalty tiers configured yet. Click &ldquo;Create Tier&rdquo; above to set up membership ranks.
                </div>
              )}
            </div>
          </div>

          {/* Members Table (Integrated title & pagination into one solid card, NO refresh button) */}
          <CustomTable
            title="Loyalty Member Accounts"
            subtitle="Customer points balance, current tier status & redemption activity"
            icon={Users}
            badge={
              <span className="rounded-sm bg-sky-100/80 border border-sky-200/80 px-2 py-0.5 text-[10.5px] font-bold text-[#0284C7]">
                {accounts.length} Records
              </span>
            }
            toolbar={
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={accSearch}
                  onChange={(e) => setAccSearch(e.target.value)}
                  placeholder="Search member name or phone..."
                  className="w-full rounded-sm border border-sky-200/90 bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
                />
              </div>
            }
            columns={loyaltyColumns}
            data={accounts}
            rowKey="id"
            loading={loadingLoyalty}
            emptyMessage="No customer loyalty accounts found."
            pageSize={10}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── TAB 2: WALLETS ── */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "wallet" && (
        <div className="space-y-4">
          <CustomTable
            title="Customer Prepaid Digital Wallets"
            subtitle="Customer stored prepaid balances, credits, debits and activity logs"
            icon={WalletIcon}
            badge={
              <span className="rounded-sm bg-sky-100/80 border border-sky-200/80 px-2 py-0.5 text-[10.5px] font-bold text-[#0284C7]">
                {wallets.length} Records
              </span>
            }
            toolbar={
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={walSearch}
                  onChange={(e) => setWalSearch(e.target.value)}
                  placeholder="Search wallet customer..."
                  className="w-full rounded-sm border border-sky-200/90 bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
                />
              </div>
            }
            columns={walletColumns}
            data={wallets}
            rowKey="id"
            loading={loadingWallets}
            emptyMessage="No customer digital wallets registered yet."
            pageSize={10}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── TAB 3: GIFT CARDS ── */}
      {/* ══════════════════════════════════════════════════ */}
      {tab === "gift" && (
        <div className="space-y-4">
          <CustomTable
            title="Issued Gift Cards & Vouchers"
            subtitle="Digital e-vouchers and physical gift cards issued to customers"
            icon={Gift}
            badge={
              <span className="rounded-sm bg-sky-100/80 border border-sky-200/80 px-2 py-0.5 text-[10.5px] font-bold text-[#0284C7]">
                {giftCards.length} Records
              </span>
            }
            toolbar={
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={gcSearch}
                  onChange={(e) => setGcSearch(e.target.value)}
                  placeholder="Search card number or holder..."
                  className="w-full rounded-sm border border-sky-200/90 bg-white pl-8 pr-3 py-1.5 text-xs font-semibold text-gray-600 placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]/20 shadow-2xs"
                />
              </div>
            }
            columns={giftCardColumns}
            data={giftCards}
            rowKey="id"
            loading={loadingGiftCards}
            emptyMessage="No gift cards or vouchers have been issued yet."
            pageSize={10}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 1: Loyalty Earn Rules & Settings (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title="Loyalty Earn Rules & System Settings"
        size="2xl"
      >
        <div className="space-y-5">
          <div className="rounded-sm border border-sky-200/80 bg-gradient-to-r from-sky-50 via-sky-50/50 to-white p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-sky-100 text-[#0284C7] font-bold shrink-0">
                <Coins size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0369A1]">Points Calculation & Redemption Policy</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure the global points conversion rates and redemption eligibility threshold for checkout.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Points per ৳1 spent</label>
              <input
                type="number"
                step="any"
                min="0"
                value={settingsForm.pointsPerAmount ?? ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, pointsPerAmount: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 1 (1 pt per ৳1)"
              />
              <p className="mt-1 text-[11px] text-gray-400 font-medium">
                Example: 1 = customer receives 1 point for every ৳1 spent.
              </p>
            </div>

            <div>
              <label className={labelClass}>৳ value per point</label>
              <input
                type="number"
                step="any"
                min="0"
                value={settingsForm.redeemValuePerPoint ?? ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, redeemValuePerPoint: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 0.25 (৳0.25 per point)"
              />
              <p className="mt-1 text-[11px] text-gray-400 font-medium">
                Example: 0.25 = 100 points equals ৳25 discount at checkout.
              </p>
            </div>

            <div>
              <label className={labelClass}>Minimum points to redeem</label>
              <input
                type="number"
                min="0"
                value={settingsForm.minRedeemPoints ?? ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, minRedeemPoints: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 100"
              />
              <p className="mt-1 text-[11px] text-gray-400 font-medium">
                Customers must have at least this balance to redeem at POS.
              </p>
            </div>

            <div>
              <label className={labelClass}>Points expiry period (months)</label>
              <input
                type="number"
                min="0"
                value={settingsForm.expiryMonths ?? ""}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, expiryMonths: e.target.value })
                }
                className={inputClass}
                placeholder="e.g. 12 (0 = never expire)"
              />
              <p className="mt-1 text-[11px] text-gray-400 font-medium">
                Set 0 if points should never expire.
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-sky-100/90 bg-sky-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600">Points Earning Enabled</p>
                <p className="text-[11px] text-gray-500">Allow customers to automatically collect loyalty points on orders</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettingsForm({ ...settingsForm, earnEnabled: !settingsForm.earnEnabled })
                }
                className={`relative h-6 w-11 rounded-full transition-all cursor-pointer shrink-0 ${
                  settingsForm.earnEnabled ? "bg-gradient-to-r from-[#0284C7] to-[#0EA5E9]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-xs transition-all ${
                    settingsForm.earnEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-sky-100/90" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-600">Redemption Enabled</p>
                <p className="text-[11px] text-gray-500">Allow customers to redeem accumulated points for instant cash discount at POS</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettingsForm({ ...settingsForm, redeemEnabled: !settingsForm.redeemEnabled })
                }
                className={`relative h-6 w-11 rounded-full transition-all cursor-pointer shrink-0 ${
                  settingsForm.redeemEnabled ? "bg-gradient-to-r from-[#0284C7] to-[#0EA5E9]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-xs transition-all ${
                    settingsForm.redeemEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
            <CustomButton
              variant="danger"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </CustomButton>

            <CustomButton
              variant="primary"
              size="sm"
              loading={savingSettings}
              onClick={saveSettings}
              leftIcon={<CheckCircle2 size={14} />}
            >
              Save Settings
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 2: Create Loyalty Tier (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={showTier}
        onClose={() => setShowTier(false)}
        title="Create New Loyalty Membership Tier"
        size="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Tier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Platinum, VIP Club"
                value={tierForm.name}
                onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Tier Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PLATINUM, VIP"
                value={tierForm.code}
                onChange={(e) => setTierForm({ ...tierForm, code: e.target.value.toUpperCase() })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Min Points to Qualify</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 5000"
                value={tierForm.minPoints}
                onChange={(e) => setTierForm({ ...tierForm, minPoints: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Points Multiplier (Rate)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                placeholder="1.0"
                value={tierForm.multiplier}
                onChange={(e) => setTierForm({ ...tierForm, multiplier: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Cashback Rate (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tierForm.cashbackRate}
                onChange={(e) => setTierForm({ ...tierForm, cashbackRate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Tier Theme Style</label>
              <CustomDropdownSelect
                value={tierForm.color}
                onChange={(val) => setTierForm({ ...tierForm, color: val })}
                options={[
                  { label: "Amber / Gold Tier", value: "amber" },
                  { label: "VIP / Sky Blue", value: "VIP" },
                  { label: "Platinum / Cyan", value: "cyan" },
                  { label: "Silver / Slate", value: "slate" },
                  { label: "Bronze / Orange", value: "orange" },
                ]}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Benefits & Privileges Description</label>
              <textarea
                rows={2}
                placeholder="e.g. Priority customer support, free home delivery, dedicated discount rate..."
                value={tierForm.benefits}
                onChange={(e) => setTierForm({ ...tierForm, benefits: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
            <CustomButton
              variant="danger"
              size="sm"
              onClick={() => setShowTier(false)}
            >
              Cancel
            </CustomButton>

            <CustomButton
              variant="primary"
              size="sm"
              loading={submittingTier}
              onClick={createTier}
              leftIcon={<Plus size={14} />}
            >
              Create Tier
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 3: Edit Loyalty Tier (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(editingTier)}
        onClose={() => setEditingTier(null)}
        title={`Edit Loyalty Tier — ${editingTier?.name ?? ""}`}
        size="2xl"
      >
        {editingTier && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Tier Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTierForm.name || ""}
                  onChange={(e) => setEditTierForm({ ...editTierForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Tier Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTierForm.code || ""}
                  onChange={(e) => setEditTierForm({ ...editTierForm, code: e.target.value.toUpperCase() })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Min Points to Qualify</label>
                <input
                  type="number"
                  min="0"
                  value={editTierForm.minPoints || ""}
                  onChange={(e) => setEditTierForm({ ...editTierForm, minPoints: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Points Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={editTierForm.multiplier || ""}
                  onChange={(e) => setEditTierForm({ ...editTierForm, multiplier: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Cashback Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editTierForm.cashbackRate || ""}
                  onChange={(e) => setEditTierForm({ ...editTierForm, cashbackRate: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Tier Theme Style</label>
                <CustomDropdownSelect
                  value={editTierForm.color || "amber"}
                  onChange={(val) => setEditTierForm({ ...editTierForm, color: val })}
                  options={[
                    { label: "Amber / Gold Tier", value: "amber" },
                    { label: "VIP / Sky Blue", value: "VIP" },
                    { label: "Platinum / Cyan", value: "cyan" },
                    { label: "Silver / Slate", value: "slate" },
                    { label: "Bronze / Orange", value: "orange" },
                  ]}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Benefits & Privileges Description</label>
                <textarea
                  rows={2}
                  value={editTierForm.benefits || ""}
                  onChange={(e) => setEditTierForm({ ...editTierForm, benefits: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setEditingTier(null)}
              >
                Cancel
              </CustomButton>

              <CustomButton
                variant="primary"
                size="sm"
                loading={savingEditTier}
                onClick={saveEditTier}
                leftIcon={<CheckCircle2 size={14} />}
              >
                Save Changes
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 4: Earn Points (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(earnAcc)}
        onClose={() => setEarnAcc(null)}
        title="Add Earned Loyalty Points"
        size="lg"
      >
        {earnAcc && (
          <div className="space-y-4">
            <div className="rounded-sm border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-900">{earnAcc.customerName}</h3>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    {earnAcc.phone || "No phone registered"} · Current Rank: {earnAcc.tier}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-800">
                    {Number(earnAcc.pointsBalance || 0).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Current Points</p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Purchase / Transaction Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284C7] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={earnAmount}
                  onChange={(e) => setEarnAmount(e.target.value)}
                  className={`${inputClass} pl-7`}
                />
              </div>
              {Number(earnAmount) > 0 && (
                <p className="mt-1.5 text-xs text-[#0284C7] font-semibold">
                  Estimated Earn: ~{Math.round(Number(earnAmount) * (settings?.pointsPerAmount || 1))} points
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setEarnAcc(null)}
              >
                Cancel
              </CustomButton>

              <CustomButton
                variant="primary"
                size="sm"
                disabled={!earnAmount || Number(earnAmount) <= 0}
                loading={earningPoints}
                onClick={earnPoints}
                leftIcon={<Plus size={14} />}
              >
                Confirm Points
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 5: Redeem Points (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(redeemAcc)}
        onClose={() => setRedeemAcc(null)}
        title="Redeem Loyalty Points for Discount"
        size="lg"
      >
        {redeemAcc && (
          <div className="space-y-4">
            <div className="rounded-sm border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-amber-900">{redeemAcc.customerName}</h3>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    {redeemAcc.phone || "No phone registered"} · Current Rank: {redeemAcc.tier}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-800">
                    {Number(redeemAcc.pointsBalance || 0).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-amber-600 font-bold uppercase">Points Available</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>
                  Points to Redeem <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setRedeemPts(String(redeemAcc.pointsBalance || 0))}
                  className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  Use Max Available ({redeemAcc.pointsBalance || 0})
                </button>
              </div>

              <input
                type="number"
                min="1"
                max={redeemAcc.pointsBalance}
                placeholder="0"
                value={redeemPts}
                onChange={(e) => setRedeemPts(e.target.value)}
                className={inputClass}
              />

              {Number(redeemPts) > 0 && (
                <p className="mt-1.5 text-xs text-emerald-700 font-bold">
                  Discount Credit Equivalent: ~{currency(Number(redeemPts) * (settings?.redeemValuePerPoint || 0.25))}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setRedeemAcc(null)}
              >
                Cancel
              </CustomButton>

              <CustomButton
                variant="primary"
                size="sm"
                disabled={!redeemPts || Number(redeemPts) <= 0 || Number(redeemPts) > redeemAcc.pointsBalance}
                loading={redeemingPoints}
                onClick={redeemPoints}
                leftIcon={<Coins size={14} />}
              >
                Redeem Discount
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 6: Loyalty Ledger (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(ledgerFor)}
        onClose={() => setLedgerFor(null)}
        title={`Points Ledger History — ${ledgerFor?.customerName ?? ""}`}
        size="2xl"
      >
        {ledgerFor && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-sm bg-sky-50/60 border border-sky-200/80 p-3.5 shadow-2xs">
              <div>
                <h4 className="text-xs font-bold text-[#0369A1]">{ledgerFor.customerName}</h4>
                <p className="text-[11px] text-gray-500">{ledgerFor.phone || "No contact"} · Membership: {ledgerFor.tier}</p>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-amber-700">
                  {Number(ledgerFor.pointsBalance || 0).toLocaleString()} pts
                </span>
                <p className="text-[10px] text-gray-400 font-semibold">Current Balance</p>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="py-12 text-center">
                <Loader2 size={24} className="mx-auto animate-spin text-[#0284C7]" />
                <p className="text-xs text-gray-500 mt-2">Loading transactions...</p>
              </div>
            ) : ledger.length === 0 ? (
              <div className="py-12 text-center rounded-sm border border-dashed border-sky-200 bg-sky-50/20 text-xs text-gray-400">
                No point transaction logs recorded yet for this customer.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {ledger.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs hover:border-sky-300 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-600 capitalize">
                        {row.type.replace(/_/g, " ")}
                      </p>
                      {row.note && <p className="text-[11px] text-gray-500 mt-0.5">{row.note}</p>}
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        {new Date(row.createdAt).toLocaleString("en-BD")}
                      </p>
                    </div>

                    <div className="text-right">
                      {row.pointsEarned != null && (
                        <p className="text-xs font-black text-emerald-700">+{row.pointsEarned} pts</p>
                      )}
                      {row.pointsRedeemed != null && (
                        <p className="text-xs font-black text-rose-600">−{row.pointsRedeemed} pts</p>
                      )}
                      {row.balanceAfter != null && (
                        <p className="text-[10.5px] text-gray-400 font-medium">Balance: {row.balanceAfter} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setLedgerFor(null)}
              >
                Close
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 7: Wallet Credit / Debit (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(walTxModal)}
        onClose={() => setWalTxModal(null)}
        title={walTxModal?.mode === "credit" ? "Credit Customer Wallet" : "Debit Customer Wallet"}
        size="lg"
      >
        {walTxModal && (
          <div className="space-y-4">
            <div
              className={`rounded-sm border p-4 shadow-2xs ${
                walTxModal.mode === "credit"
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-rose-200 bg-rose-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className={`text-xs font-bold ${
                      walTxModal.mode === "credit" ? "text-emerald-900" : "text-rose-900"
                    }`}
                  >
                    {walTxModal.account.customerName}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    {walTxModal.account.phone || "No phone"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-base font-black ${
                      walTxModal.mode === "credit" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {currency(walTxModal.account.balance)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-semibold">Available Balance</p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Transaction Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284C7] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={walForm.amount}
                  onChange={(e) => setWalForm({ ...walForm, amount: e.target.value })}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            {walTxModal.mode === "credit" && (
              <div>
                <label className={labelClass}>Credit Type</label>
                <CustomDropdownSelect
                  value={walForm.type}
                  onChange={(val) => setWalForm({ ...walForm, type: val })}
                  options={[
                    { label: "Deposit / Add Funds", value: "ADD" },
                    { label: "Cashback Reward", value: "CASHBACK" },
                    { label: "Order Refund", value: "REFUND" },
                    { label: "Promotional Bonus", value: "BONUS" },
                  ]}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Reference / Note (Optional)</label>
              <input
                type="text"
                placeholder="Reason or transaction ID..."
                value={walForm.note}
                onChange={(e) => setWalForm({ ...walForm, note: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setWalTxModal(null)}
              >
                Cancel
              </CustomButton>

              <CustomButton
                variant="primary"
                size="sm"
                disabled={!walForm.amount || Number(walForm.amount) <= 0}
                loading={submittingWalTx}
                onClick={walTxModal.mode === "credit" ? walletCredit : walletDebit}
                leftIcon={walTxModal.mode === "credit" ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
              >
                {walTxModal.mode === "credit" ? "Confirm Credit" : "Confirm Debit"}
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 8: Wallet Detail Ledger (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(walletDetail)}
        onClose={() => setWalletDetail(null)}
        title={`Wallet Transactions — ${walletDetail?.customerName ?? ""}`}
        size="2xl"
      >
        {walletDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-sm bg-emerald-50/70 border border-emerald-200 p-3 text-center shadow-2xs">
                <p className="text-[10.5px] font-bold text-emerald-800 uppercase">Balance</p>
                <p className="text-lg font-black text-emerald-700 mt-0.5">
                  {currency(walletDetail.balance)}
                </p>
              </div>
              <div className="rounded-sm bg-sky-50/70 border border-sky-200 p-3 text-center shadow-2xs">
                <p className="text-[10.5px] font-bold text-[#0369A1] uppercase">Total Credited</p>
                <p className="text-lg font-black text-[#0369A1] mt-0.5">
                  {currency(walletDetail.lifetimeCredited)}
                </p>
              </div>
              <div className="rounded-sm bg-rose-50/70 border border-rose-200 p-3 text-center shadow-2xs">
                <p className="text-[10.5px] font-bold text-rose-800 uppercase">Total Debited</p>
                <p className="text-lg font-black text-rose-700 mt-0.5">
                  {currency(walletDetail.lifetimeDebited)}
                </p>
              </div>
            </div>

            {(walletDetail.transactions ?? []).length === 0 ? (
              <div className="py-12 text-center rounded-sm border border-dashed border-sky-200 bg-sky-50/20 text-xs text-gray-400">
                No wallet transactions found.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {(walletDetail.transactions ?? []).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs hover:border-sky-300 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-600 capitalize">
                        {tx.type?.replace(/_/g, " ")}
                      </p>
                      {tx.note && <p className="text-[11px] text-gray-500 mt-0.5">{tx.note}</p>}
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString("en-BD")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-black ${
                          Number(tx.amount) >= 0 ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {Number(tx.amount) >= 0 ? "+" : ""}
                        {currency(tx.amount)}
                      </p>
                      {tx.balanceAfter != null && (
                        <p className="text-[10.5px] text-gray-400 font-medium">
                          Balance: {currency(tx.balanceAfter)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setWalletDetail(null)}
              >
                Close
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 9: Issue Gift Card (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={showGc}
        onClose={() => setShowGc(false)}
        title="Issue New Gift Card Voucher"
        size="2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Card Number (Optional)</label>
              <input
                type="text"
                placeholder="Auto-generated if left blank"
                value={gcForm.cardNo}
                onChange={(e) => setGcForm({ ...gcForm, cardNo: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Card Format Type</label>
              <CustomDropdownSelect
                value={gcForm.cardType}
                onChange={(val) => setGcForm({ ...gcForm, cardType: val })}
                options={[
                  { label: "Digital E-Voucher", value: "DIGITAL" },
                  { label: "Physical Plastic Card", value: "PHYSICAL" },
                ]}
              />
            </div>

            <div>
              <label className={labelClass}>
                Initial Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284C7] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="0.00"
                  value={gcForm.initialAmount}
                  onChange={(e) => setGcForm({ ...gcForm, initialAmount: e.target.value })}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Expiry Date (Optional)</label>
              <input
                type="date"
                value={gcForm.expiryDate}
                onChange={(e) => setGcForm({ ...gcForm, expiryDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>Issue to Registered Customer (Optional)</label>
              <CustomDropdownSelect
                value={gcForm.issuedToCustomerId}
                onChange={(val) => setGcForm({ ...gcForm, issuedToCustomerId: val })}
                placeholder="— Anonymous Holder —"
                options={[
                  { label: "— Anonymous Holder —", value: "" },
                  ...customers.map((c) => ({
                    label: `${c.name}${c.phone ? ` (${c.phone})` : ""}`,
                    value: c.id,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
            <CustomButton
              variant="danger"
              size="sm"
              onClick={() => setShowGc(false)}
            >
              Cancel
            </CustomButton>

            <CustomButton
              variant="primary"
              size="sm"
              disabled={!gcForm.initialAmount || Number(gcForm.initialAmount) <= 0}
              loading={submittingGc}
              onClick={createGiftCard}
              leftIcon={<Gift size={14} />}
            >
              Issue Gift Card
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 10: Gift Card Redeem / Reload (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(gcTxModal)}
        onClose={() => setGcTxModal(null)}
        title={gcTxModal?.mode === "redeem" ? "Redeem Gift Card" : "Reload Gift Card"}
        size="lg"
      >
        {gcTxModal && (
          <div className="space-y-4">
            <div className="rounded-sm border border-sky-200 bg-sky-50/50 p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs font-bold text-[#0369A1]">{gcTxModal.card.cardNo}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Holder: {gcTxModal.card.issuedToName || "Anonymous"} · {gcTxModal.card.cardType}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-[#0284C7]">
                    {currency(gcTxModal.card.balance)}
                  </span>
                  <p className="text-[10px] text-gray-500 font-semibold">Available Balance</p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Transaction Amount (৳) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284C7] font-bold">
                  ৳
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={gcTxForm.amount}
                  onChange={(e) => setGcTxForm({ ...gcTxForm, amount: e.target.value })}
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setGcTxModal(null)}
              >
                Cancel
              </CustomButton>

              <CustomButton
                variant="primary"
                size="sm"
                disabled={!gcTxForm.amount || Number(gcTxForm.amount) <= 0}
                loading={submittingGcTx}
                onClick={gcTx}
                leftIcon={gcTxModal.mode === "redeem" ? <ArrowUpFromLine size={14} /> : <ArrowDownToLine size={14} />}
              >
                {gcTxModal.mode === "redeem" ? "Confirm Redemption" : "Confirm Reload"}
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── MODAL 11: Gift Card History (ENLARGED) ── */}
      {/* ══════════════════════════════════════════════════ */}
      <CustomModal
        open={Boolean(gcDetail)}
        onClose={() => setGcDetail(null)}
        title={`Gift Card History — ${gcDetail?.cardNo ?? ""}`}
        size="2xl"
      >
        {gcDetail && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-sm bg-sky-50/70 border border-sky-200 p-3 text-center shadow-2xs">
                <p className="text-[10.5px] font-bold text-[#0369A1] uppercase">Current Balance</p>
                <p className="text-lg font-black text-[#0369A1] mt-0.5">
                  {currency(gcDetail.balance)}
                </p>
              </div>
              <div className="rounded-sm bg-slate-50/70 border border-slate-200 p-3 text-center shadow-2xs">
                <p className="text-[10.5px] font-bold text-gray-600 uppercase">Initial Amount</p>
                <p className="text-lg font-black text-gray-600 mt-0.5">
                  {currency(gcDetail.initialAmount)}
                </p>
              </div>
              <div
                className={`rounded-sm p-3 text-center shadow-2xs border ${
                  gcDetail.status === "ACTIVE"
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-rose-50/70 border-rose-200"
                }`}
              >
                <p className="text-[10.5px] font-bold text-gray-600 uppercase">Card Status</p>
                <p
                  className={`text-lg font-black mt-0.5 ${
                    gcDetail.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {gcDetail.status}
                </p>
              </div>
            </div>

            {gcDetail.status === "ACTIVE" && (
              <div className="flex justify-end">
                <CustomButton
                  variant="danger"
                  size="xs"
                  onClick={() => setCardToDisable(gcDetail)}
                  leftIcon={<Ban size={12} />}
                >
                  Disable Card
                </CustomButton>
              </div>
            )}

            {(gcDetail.transactions ?? []).length === 0 ? (
              <div className="py-12 text-center rounded-sm border border-dashed border-sky-200 bg-sky-50/20 text-xs text-gray-400">
                No transactions recorded for this gift card yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {(gcDetail.transactions ?? []).map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-sm border border-sky-100/90 bg-white p-3 shadow-2xs hover:border-sky-300 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-600 capitalize">
                        {tx.type?.replace(/_/g, " ")}
                      </p>
                      {tx.note && <p className="text-[11px] text-gray-500 mt-0.5">{tx.note}</p>}
                      <p className="text-[10.5px] text-gray-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString("en-BD")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-black ${
                          tx.type === "RELOAD" ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {tx.type === "RELOAD" ? "+" : "−"}
                        {currency(Math.abs(tx.amount ?? 0))}
                      </p>
                      {tx.balanceAfter != null && (
                        <p className="text-[10.5px] text-gray-400 font-medium">
                          Balance: {currency(tx.balanceAfter)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-sky-100">
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => setGcDetail(null)}
              >
                Close
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── Confirmation Modal: Delete Tier ── */}
      <ConfirmModal
        isOpen={Boolean(tierToDelete)}
        onClose={() => setTierToDelete(null)}
        onConfirm={confirmDeleteTier}
        title="Delete Loyalty Tier"
        message={`Are you sure you want to completely delete the loyalty tier "${tierToDelete?.name}"? Customers assigned to this rank will revert to default settings.`}
        type="DANGER"
        confirmText="Delete Tier"
        loading={deletingTier}
      />

      {/* ── Confirmation Modal: Disable Gift Card ── */}
      <ConfirmModal
        isOpen={Boolean(cardToDisable)}
        onClose={() => setCardToDisable(null)}
        onConfirm={confirmDisableGc}
        title="Disable Gift Card"
        message={`Are you sure you want to deactivate gift card "${cardToDisable?.cardNo}"? It will no longer be redeemable or reloadable.`}
        type="DANGER"
        confirmText="Disable Card"
        loading={disablingCard}
      />
    </div>
  );
}
