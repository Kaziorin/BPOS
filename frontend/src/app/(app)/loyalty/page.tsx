"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Star, Wallet as WalletIcon, Gift, Plus, RefreshCw, Loader2, Crown,
  Users, Coins, ArrowDownToLine, ArrowUpFromLine, Search, BadgePercent,
  CircleDollarSign, CreditCard, RotateCcw, Ban, Receipt, ChevronRight,
  Pencil, Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomInput } from "@/components/custom/CustomInput";
import { CustomSelect } from "@/components/custom/CustomSelect";
import { CustomButton } from "@/components/custom/CustomButton";
import { CustomModal } from "@/components/custom/CustomModal";

type Tab = "loyalty" | "wallet" | "gift";

const currency = (v: any) => `৳${(Number(v) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2 })}`;

interface CustomerOption { id: string; name: string; phone: string | null; }
interface LoyaltyAccount {
  id: string; customerId: string; customerName?: string; phone?: string | null;
  pointsBalance: number; lifetimeEarned: number; lifetimeRedeemed: number;
  tier: string; status: string;
}
interface Tier { id: string; name: string; code: string; minPoints: number; multiplier: number; cashbackRate: number; benefits: string | null; color: string | null; isActive: number; }
interface LedgerRow { id: string; type: string; amount?: number; pointsEarned?: number; pointsRedeemed?: number; balanceBefore?: number; balanceAfter?: number; note?: string | null; createdAt: string; }
interface WalletAccount { id: string; customerId: string; customerName?: string; phone?: string | null; balance: number; lifetimeCredited: number; lifetimeDebited: number; status: string; }
interface GiftCard { id: string; cardNo: string; cardType: string; barcode: string | null; initialAmount: number; balance: number; expiryDate: string | null; status: string; issuedToName: string | null; issuedToCustomerId: string | null; }

const TIER_COLORS: Record<string, string> = {
  BRONZE: "bg-orange-50 text-orange-700 border-orange-200",
  SILVER: "bg-slate-100 text-slate-600 border-slate-300",
  GOLD: "bg-yellow-50 text-yellow-700 border-yellow-300",
  VIP: "bg-violet-50 text-violet-700 border-violet-300",
};

export default function LoyaltyPage() {
  const [tab, setTab] = useState<Tab>("loyalty");
  const [message, setMessage] = useState<string | null>(null);
  const showMessage = (m: string) => { setMessage(m); setTimeout(() => setMessage(null), 3500); };

  // ── Loyalty ──
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [accSearch, setAccSearch] = useState("");
  const [showTier, setShowTier] = useState(false);
  const [tierForm, setTierForm] = useState<any>({ name: "", code: "", minPoints: "", multiplier: "1.0", cashbackRate: "0", benefits: "", color: "amber" });
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [editTierForm, setEditTierForm] = useState<any>({});
  const [earnAcc, setEarnAcc] = useState<LoyaltyAccount | null>(null);
  const [earnAmount, setEarnAmount] = useState("");
  const [redeemAcc, setRedeemAcc] = useState<LoyaltyAccount | null>(null);
  const [redeemPts, setRedeemPts] = useState("");
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerFor, setLedgerFor] = useState<LoyaltyAccount | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState<any>({});

  // ── Wallet ──
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [walSearch, setWalSearch] = useState("");
  const [walletDetail, setWalletDetail] = useState<any>(null);
  const [walTxModal, setWalTxModal] = useState<{ mode: "credit" | "debit"; account: WalletAccount } | null>(null);
  const [walForm, setWalForm] = useState<any>({ type: "ADD", amount: "", note: "" });

  // ── Gift cards ──
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [gcSearch, setGcSearch] = useState("");
  const [showGc, setShowGc] = useState(false);
  const [gcForm, setGcForm] = useState<any>({ cardNo: "", cardType: "DIGITAL", initialAmount: "", expiryDate: "", issuedToCustomerId: "" });
  const [gcDetail, setGcDetail] = useState<any>(null);
  const [gcTxModal, setGcTxModal] = useState<{ mode: "redeem" | "reload"; card: GiftCard } | null>(null);
  const [gcTxForm, setGcTxForm] = useState<any>({ amount: "" });
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  async function loadCustomers() {
    try {
      const res = await api.get<{ data: CustomerOption[] }>("/v1/customers?limit=200");
      setCustomers(res.data);
    } catch (err: any) { console.error(err); }
  }

  const loadLoyalty = useCallback(async () => {
    try {
      const [t, a, s] = await Promise.all([
        api.get<{ data: Tier[] }>("/v1/loyalty/tiers"),
        api.get<{ data: LoyaltyAccount[] }>(`/v1/loyalty/accounts${accSearch ? `?search=${encodeURIComponent(accSearch)}` : ""}`),
        api.get<{ data: any }>("/v1/loyalty/settings"),
      ]);
      setTiers(t.data); setAccounts(a.data); setSettings(s.data);
      setSettingsForm(s.data);
    } catch (err: any) { console.error(err); }
  }, [accSearch]);

  const loadWallets = useCallback(async () => {
    try {
      const res = await api.get<{ data: WalletAccount[] }>(`/v1/wallet/accounts${walSearch ? `?search=${encodeURIComponent(walSearch)}` : ""}`);
      setWallets(res.data);
    } catch (err: any) { console.error(err); }
  }, [walSearch]);

  const loadGiftCards = useCallback(async () => {
    try {
      const res = await api.get<{ data: GiftCard[] }>(`/v1/gift-cards${gcSearch ? `?search=${encodeURIComponent(gcSearch)}` : ""}`);
      setGiftCards(res.data);
    } catch (err: any) { console.error(err); }
  }, [gcSearch]);

  useEffect(() => { loadLoyalty(); }, [loadLoyalty]);
  useEffect(() => { loadWallets(); }, [loadWallets]);
  useEffect(() => { loadGiftCards(); }, [loadGiftCards]);

  const tierTotals = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of accounts) c[a.tier] = (c[a.tier] || 0) + 1;
    return c;
  }, [accounts]);

  const totalPoints = accounts.reduce((s, a) => s + Number(a.pointsBalance || 0), 0);
  const walletTotal = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);
  const gcBalance = giftCards.filter((g) => g.status === "ACTIVE").reduce((s, g) => s + Number(g.balance || 0), 0);

  // ── actions ──
  async function createTier() {
    if (!tierForm.name || !tierForm.code) { alert("Name and code required"); return; }
    try {
      await api.post("/v1/loyalty/tiers", { ...tierForm, minPoints: Number(tierForm.minPoints) || 0, multiplier: Number(tierForm.multiplier) || 1, cashbackRate: Number(tierForm.cashbackRate) || 0 });
      setShowTier(false); showMessage("Tier created"); loadLoyalty();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function toggleTier(t: Tier) {
    try {
      await api.patch(`/v1/loyalty/tiers/${t.id}`, { isActive: t.isActive ? 0 : 1 });
      loadLoyalty();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  function openEditTier(t: Tier) {
    setEditingTier(t);
    setEditTierForm({
      name: t.name, code: t.code, minPoints: String(t.minPoints),
      multiplier: String(t.multiplier), cashbackRate: String(t.cashbackRate),
      benefits: t.benefits || "", color: t.color || "amber",
    });
  }
  async function saveEditTier() {
    if (!editingTier) return;
    if (!editTierForm.name || !editTierForm.code) { alert("Name and code required"); return; }
    try {
      await api.patch(`/v1/loyalty/tiers/${editingTier.id}`, {
        name: editTierForm.name, code: editTierForm.code.toUpperCase(),
        minPoints: Number(editTierForm.minPoints) || 0,
        multiplier: Number(editTierForm.multiplier) || 1,
        cashbackRate: Number(editTierForm.cashbackRate) || 0,
        benefits: editTierForm.benefits, color: editTierForm.color,
      });
      setEditingTier(null); showMessage("Tier updated"); loadLoyalty();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function deleteTier(t: Tier) {
    if (!confirm(`"${t.name}" tier সম্পূর্ণ delete করবেন?\n\nএই action undo করা যাবে না।`)) return;
    try {
      await api.del(`/v1/loyalty/tiers/${t.id}`);
      setTiers(prev => prev.filter(tier => tier.id !== t.id));
      showMessage(`"${t.name}" tier deleted`);
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function saveSettings() {
    try {
      await api.put("/v1/loyalty/settings", {
        pointsPerAmount: Number(settingsForm.pointsPerAmount), redeemValuePerPoint: Number(settingsForm.redeemValuePerPoint),
        expiryMonths: Number(settingsForm.expiryMonths), minRedeemPoints: Number(settingsForm.minRedeemPoints),
        earnEnabled: settingsForm.earnEnabled ? 1 : 0, redeemEnabled: settingsForm.redeemEnabled ? 1 : 0,
      });
      setShowSettings(false); showMessage("Settings saved"); loadLoyalty();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function earnPoints() {
    if (!earnAcc || !earnAmount) return;
    try {
      const res = await api.post<{ data: any }>("/v1/loyalty/earn", { customerId: earnAcc.customerId, amount: Number(earnAmount) });
      setEarnAcc(null); setEarnAmount("");
      showMessage(`Earned ${res.data?.pointsEarned} pts → tier ${res.data?.tier}`);
      loadLoyalty();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function redeemPoints() {
    if (!redeemAcc || !redeemPts) return;
    try {
      const res = await api.post<{ data: any }>("/v1/loyalty/redeem", { customerId: redeemAcc.customerId, points: Number(redeemPts) });
      setRedeemAcc(null); setRedeemPts("");
      showMessage(`Redeemed ${res.data?.pointsRedeemed} pts = ${currency(res.data?.discountValue)} credit`);
      loadLoyalty();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function openLedger(acc: LoyaltyAccount) {
    setLedgerFor(acc);
    setLedger([]);
    try {
      const res = await api.get<{ data: any }>(`/v1/loyalty/accounts/${acc.customerId}`);
      setLedger(res.data.transactions ?? []);
    } catch (err: any) { console.error(err); }
  }
  async function walletCredit() {
    if (!walTxModal || !walForm.amount) return;
    try {
      await api.post("/v1/wallet/credit", { customerId: walTxModal.account.customerId, amount: Number(walForm.amount), type: walForm.type, note: walForm.note });
      setWalTxModal(null); setWalForm({ type: "ADD", amount: "", note: "" }); showMessage("Wallet credited"); loadWallets();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function walletDebit() {
    if (!walTxModal || !walForm.amount) return;
    try {
      await api.post("/v1/wallet/debit", { customerId: walTxModal.account.customerId, amount: Number(walForm.amount), note: walForm.note });
      setWalTxModal(null); setWalForm({ type: "ADD", amount: "", note: "" }); showMessage("Wallet debited"); loadWallets();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function openWalletDetail(acc: WalletAccount) {
    try {
      const res = await api.get<{ data: any }>(`/v1/wallet/accounts/${acc.customerId}`);
      const d = res.data;
      // Backend returns: { wallet: {...}, customerName, phone, transactions }
      // Flatten so the modal can access balance, lifetimeCredited, etc. directly
      setWalletDetail({
        ...(d.wallet ?? d),
        customerName: d.customerName ?? acc.customerName,
        phone: d.phone ?? acc.phone,
        transactions: d.transactions ?? [],
      });
    } catch (err: any) { console.error(err); }
  }
  async function createGiftCard() {
    if (!gcForm.initialAmount) { alert("Initial amount required"); return; }
    try {
      await api.post("/v1/gift-cards", { ...gcForm, initialAmount: Number(gcForm.initialAmount), issuedToCustomerId: gcForm.issuedToCustomerId || undefined });
      setShowGc(false); showMessage("Gift card created"); loadGiftCards(); loadCustomers();
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function openGcDetail(gc: GiftCard) {
    try {
      const res = await api.get<{ data: any }>(`/v1/gift-cards/${gc.id}`);
      setGcDetail(res.data);
    } catch (err: any) { console.error(err); }
  }
  async function gcTx() {
    if (!gcTxModal || !gcTxForm.amount) return;
    const ep = gcTxModal.mode === "redeem" ? "redeem" : "reload";
    try {
      await api.post(`/v1/gift-cards/${gcTxModal.card.id}/${ep}`, { amount: Number(gcTxForm.amount) });
      setGcTxModal(null); setGcTxForm({ amount: "" }); showMessage(`Card ${ep === "redeem" ? "redeemed" : "reloaded"}`); loadGiftCards(); if (gcDetail) openGcDetail(gcDetail);
    } catch (err: any) { alert(err?.message || "Failed"); }
  }
  async function disableGc(gc: GiftCard) {
    if (!confirm(`Disable card ${gc.cardNo}?`)) return;
    try {
      await api.post(`/v1/gift-cards/${gc.id}/disable`, { reason: "Disabled from console" });
      showMessage("Card disabled"); loadGiftCards(); if (gcDetail) openGcDetail(gcDetail);
    } catch (err: any) { alert(err?.message || "Failed"); }
  }

  return (
    <div className="space-y-8 p-1">
      {message && <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-base font-semibold text-emerald-700 shadow">{message}</div>}

      {/* ── Premium Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-950 p-8 shadow-2xl border border-violet-500/20">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-inner backdrop-blur-md">
              <Star className="h-9 w-9 text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.8)]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">Loyalty / Wallet / Gift Cards</h1>
              <p className="mt-1.5 text-base text-violet-300/80">Points, tiers, digital wallets and gift cards — every movement on a full ledger</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {tab === "loyalty" && (<>
              <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/20 transition-all shadow">
                <Coins size={16} /> Earn Rules
              </button>
              <button onClick={() => { setTierForm({ name: "", code: "", minPoints: "", multiplier: "1.0", cashbackRate: "0", benefits: "", color: "amber" }); setShowTier(true); }} className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/40 hover:bg-violet-400 transition-all border border-violet-400/30">
                <Plus size={16} /> New Tier
              </button>
            </>)}
            {tab === "gift" && <button onClick={() => { loadCustomers(); setGcForm({ cardNo: "", cardType: "DIGITAL", initialAmount: "", expiryDate: "", issuedToCustomerId: "" }); setShowGc(true); }} className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/40 hover:bg-violet-400 transition-all border border-violet-400/30">
              <Plus size={16} /> Issue Gift Card
            </button>}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Members", value: accounts.length, icon: Users, gradient: "from-blue-50 to-slate-50", border: "border-blue-100", iconColor: "text-blue-400", textColor: "text-slate-800" },
          { label: "Points in Circulation", value: totalPoints.toLocaleString(), icon: Coins, gradient: "from-amber-50 to-orange-50", border: "border-amber-100", iconColor: "text-amber-400", textColor: "text-amber-700" },
          { label: "Wallet Balance", value: currency(walletTotal), icon: WalletIcon, gradient: "from-emerald-50 to-teal-50", border: "border-emerald-100", iconColor: "text-emerald-400", textColor: "text-emerald-700" },
          { label: "Gift Cards Active", value: currency(gcBalance), icon: Gift, gradient: "from-violet-50 to-purple-50", border: "border-violet-100", iconColor: "text-violet-400", textColor: "text-violet-700" },
        ].map(({ label, value, icon: Icon, gradient, border, iconColor, textColor }) => (
          <div key={label} className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 border ${border} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
            <div className="absolute right-3 top-3 opacity-15 group-hover:opacity-25 group-hover:scale-110 transition-all duration-500">
              <Icon size={72} className={iconColor} />
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest ${iconColor} opacity-80`}>{label}</p>
            <p className={`mt-3 text-4xl font-black ${textColor} leading-none drop-shadow-sm`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 rounded-2xl bg-slate-100/80 p-1.5">
        {([["loyalty", "Points & Tiers", Star], ["wallet", "Wallet", WalletIcon], ["gift", "Gift Cards", Gift]] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${tab === id
              ? "bg-white text-violet-700 shadow-md shadow-violet-100 border border-violet-100"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/60"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════ LOYALTY TAB ══════════ */}
      {tab === "loyalty" && (
        <div className="space-y-6">
          {/* Tier cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => {
              const cfg = t.code === "BRONZE"
                ? { g: "from-orange-400 to-amber-500", badge: "bg-orange-100 text-orange-800 border-orange-200", glow: "shadow-orange-200" }
                : t.code === "SILVER"
                ? { g: "from-slate-400 to-gray-500", badge: "bg-slate-100 text-slate-700 border-slate-300", glow: "shadow-slate-200" }
                : t.code === "GOLD"
                ? { g: "from-yellow-400 to-amber-400", badge: "bg-yellow-100 text-yellow-800 border-yellow-300", glow: "shadow-yellow-200" }
                : t.code === "VIP"
                ? { g: "from-violet-500 to-purple-600", badge: "bg-violet-100 text-violet-800 border-violet-300", glow: "shadow-violet-200" }
                : { g: "from-slate-500 to-gray-600", badge: "bg-gray-100 text-gray-700 border-gray-300", glow: "shadow-gray-200" };
              return (
                <div key={t.id} className={`relative overflow-hidden rounded-2xl border border-white/30 shadow-xl ${cfg.glow} hover:-translate-y-1.5 transition-all duration-300 group`}>
                  {/* Colored top strip */}
                  <div className={`h-2 w-full bg-gradient-to-r ${cfg.g}`} />
                  <div className="bg-white p-5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-black uppercase tracking-widest ${cfg.badge}`}>
                        <Crown size={11} /> {t.name}
                      </span>
                      <button onClick={() => toggleTier(t)} title={t.isActive ? "Deactivate" : "Activate"}
                        className={`relative h-5 w-9 rounded-full transition-all ${t.isActive ? "bg-emerald-500 shadow-emerald-300 shadow-inner" : "bg-slate-200"}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${t.isActive ? "left-4" : "left-0.5"}`} />
                      </button>
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-600 leading-snug min-h-[32px]">{t.benefits || "—"}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Min Points</p>
                        <p className="text-base font-black text-slate-700 mt-0.5">{t.minPoints.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5 text-center border border-slate-100">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Multiplier</p>
                        <p className="text-base font-black text-slate-700 mt-0.5">{t.multiplier}×</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-400">{tierTotals[t.code] || 0} member(s) · {t.cashbackRate}% cashback</p>
                    {/* Edit / Delete buttons — appear on hover */}
                    <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => openEditTier(t)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-bold text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 transition-all">
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => deleteTier(t)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={accSearch} onChange={(e) => setAccSearch(e.target.value)} placeholder="Search customer…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
            </div>
            <button onClick={() => loadLoyalty()} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-700 shadow-sm transition-all">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>

          {/* Loyalty table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Tier</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Points</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Lifetime Earned</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Redeemed</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const color = TIER_COLORS[a.tier] || "bg-gray-50 text-gray-700 border-gray-200";
                  return (
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-base font-bold text-slate-800">{a.customerName || "—"}</p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">{a.phone || ""}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-black uppercase tracking-wide ${color}`}><Crown size={10} /> {a.tier}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-black text-amber-600">{a.pointsBalance?.toLocaleString() ?? 0}</span>
                        <span className="ml-1 text-xs text-slate-400 font-semibold">pts</span>
                      </td>
                      <td className="px-6 py-4 text-base font-semibold text-slate-600">{a.lifetimeEarned?.toLocaleString() ?? 0}</td>
                      <td className="px-6 py-4 text-base font-semibold text-slate-600">{a.lifetimeRedeemed?.toLocaleString() ?? 0}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEarnAcc(a); setEarnAmount(""); }} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition-all">+ Earn</button>
                          <button onClick={() => { setRedeemAcc(a); setRedeemPts(""); }} className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 shadow-sm transition-all">Redeem</button>
                          <button onClick={() => openLedger(a)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 shadow-sm transition-all">Ledger</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accounts.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-slate-400">No loyalty members yet — points are auto-earned when customers buy, or use &ldquo;+ Earn&rdquo;.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ WALLET TAB ══════════ */}
      {tab === "wallet" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={walSearch} onChange={(e) => setWalSearch(e.target.value)} placeholder="Search customer…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
            </div>
            <button onClick={() => loadWallets()} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-700 shadow-sm transition-all">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Balance</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Lifetime Credited</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Debited</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-base font-bold text-slate-800">{w.customerName || "—"}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{w.phone || ""}</p>
                    </td>
                    <td className="px-6 py-4"><span className="text-xl font-black text-emerald-600">{currency(w.balance)}</span></td>
                    <td className="px-6 py-4 text-base font-semibold text-slate-600">{currency(w.lifetimeCredited)}</td>
                    <td className="px-6 py-4 text-base font-semibold text-slate-600">{currency(w.lifetimeDebited)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-lg px-3 py-1 text-xs font-bold ${w.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{w.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setWalTxModal({ mode: "credit", account: w }); setWalForm({ type: "ADD", amount: "", note: "" }); }} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition-all">Credit</button>
                        <button onClick={() => { setWalTxModal({ mode: "debit", account: w }); setWalForm({ type: "ADD", amount: "", note: "" }); }} className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 shadow-sm transition-all">Debit</button>
                        <button onClick={() => openWalletDetail(w)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 shadow-sm transition-all">Ledger</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {wallets.length === 0 && <tr><td colSpan={6} className="px-6 py-16 text-center text-sm font-medium text-slate-400">No wallet accounts yet — credit a customer to open one.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ GIFT CARDS TAB ══════════ */}
      {tab === "gift" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={gcSearch} onChange={(e) => setGcSearch(e.target.value)} placeholder="Search card no / holder…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100 transition-all shadow-sm" />
            </div>
            <button onClick={() => loadGiftCards()} className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-violet-700 shadow-sm transition-all">
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-100">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50/70">
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Card No</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Holder</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Initial</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Balance</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Expiry</th>
                  <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.map((g) => (
                  <tr key={g.id} className="border-b border-slate-50 hover:bg-violet-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-base font-bold text-slate-800">{g.cardNo}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{g.cardType}{g.barcode && g.barcode !== g.cardNo ? ` · ${g.barcode}` : ""}</p>
                    </td>
                    <td className="px-6 py-4 text-base font-semibold text-slate-700">{g.issuedToName || "—"}</td>
                    <td className="px-6 py-4 text-base font-semibold text-slate-600">{currency(g.initialAmount)}</td>
                    <td className="px-6 py-4"><span className="text-xl font-black text-violet-600">{currency(g.balance)}</span></td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">{g.expiryDate ? new Date(g.expiryDate).toLocaleDateString("en-GB") : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-lg px-3 py-1 text-xs font-bold ${g.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : g.status === "EXPIRED" ? "bg-slate-100 text-slate-500" : "bg-rose-100 text-rose-600"}`}>{g.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setGcTxModal({ mode: "redeem", card: g }); setGcTxForm({ amount: "" }); }} className="rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white hover:bg-violet-600 shadow-sm transition-all">Redeem</button>
                        <button onClick={() => { setGcTxModal({ mode: "reload", card: g }); setGcTxForm({ amount: "" }); }} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 shadow-sm transition-all">Reload</button>
                        <button onClick={() => openGcDetail(g)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 shadow-sm transition-all">History</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {giftCards.length === 0 && <tr><td colSpan={7} className="px-6 py-16 text-center text-sm font-medium text-slate-400">No gift cards yet — issue one to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: New Tier ══════════ */}
      <CustomModal open={showTier} onClose={() => setShowTier(false)} title="Create New Loyalty Tier" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CustomInput label="Tier Name" placeholder="e.g. Platinum" value={tierForm.name}
              onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })} />
            <CustomInput label="Code (UPPERCASE)" placeholder="e.g. PLATINUM" value={tierForm.code}
              onChange={(e) => setTierForm({ ...tierForm, code: e.target.value.toUpperCase() })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CustomInput label="Min Points" type="number" placeholder="0" value={tierForm.minPoints}
              onChange={(e) => setTierForm({ ...tierForm, minPoints: e.target.value })} />
            <CustomInput label="Points Multiplier" type="number" step="0.1" placeholder="1.0" value={tierForm.multiplier}
              onChange={(e) => setTierForm({ ...tierForm, multiplier: e.target.value })} />
          </div>
          <CustomInput label="Cashback Rate (%)" type="number" step="0.01" placeholder="0" value={tierForm.cashbackRate}
            onChange={(e) => setTierForm({ ...tierForm, cashbackRate: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-[15px] font-semibold text-gray-600">Benefits / Description</label>
            <textarea rows={3} value={tierForm.benefits} placeholder="e.g. Free delivery, priority support…"
              onChange={(e) => setTierForm({ ...tierForm, benefits: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowTier(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={createTier}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-all">
              Create Tier
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ MODAL: Edit Tier ══════════ */}
      <CustomModal open={!!editingTier} onClose={() => setEditingTier(null)} title={`Edit Tier — ${editingTier?.name ?? ""}`} size="md">
        {editingTier && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <CustomInput label="Tier Name" placeholder="e.g. Platinum" value={editTierForm.name}
                onChange={(e) => setEditTierForm({ ...editTierForm, name: e.target.value })} />
              <CustomInput label="Code (UPPERCASE)" placeholder="e.g. PLATINUM" value={editTierForm.code}
                onChange={(e) => setEditTierForm({ ...editTierForm, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomInput label="Min Points" type="number" placeholder="0" value={editTierForm.minPoints}
                onChange={(e) => setEditTierForm({ ...editTierForm, minPoints: e.target.value })} />
              <CustomInput label="Points Multiplier" type="number" step="0.1" placeholder="1.0" value={editTierForm.multiplier}
                onChange={(e) => setEditTierForm({ ...editTierForm, multiplier: e.target.value })} />
            </div>
            <CustomInput label="Cashback Rate (%)" type="number" step="0.01" placeholder="0" value={editTierForm.cashbackRate}
              onChange={(e) => setEditTierForm({ ...editTierForm, cashbackRate: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-[15px] font-semibold text-gray-600">Benefits / Description</label>
              <textarea rows={3} value={editTierForm.benefits} placeholder="e.g. Free delivery, priority support…"
                onChange={(e) => setEditTierForm({ ...editTierForm, benefits: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditingTier(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={saveEditTier}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-all">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Earn Rules (Settings) ══════════ */}
      <CustomModal open={showSettings} onClose={() => setShowSettings(false)} title="Loyalty Earn Rules & Settings" size="md">
        <div className="space-y-4">
          <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-500 mb-1">Points Earning</p>
            <p className="text-xs text-slate-500">How many points a customer earns per ৳1 spent</p>
          </div>

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">Points per ৳1 spent</label>
              <input type="number" step="0.01" value={settingsForm.pointsPerAmount ?? ""}
                onChange={(e) => setSettingsForm({ ...settingsForm, pointsPerAmount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              <p className="mt-1 text-xs text-gray-400">e.g. 1 = 1 pt per ৳1</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">৳ value per point</label>
              <input type="number" step="0.01" value={settingsForm.redeemValuePerPoint ?? ""}
                onChange={(e) => setSettingsForm({ ...settingsForm, redeemValuePerPoint: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              <p className="mt-1 text-xs text-gray-400">e.g. 0.25 = ৳0.25/pt</p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4 items-start">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">Min points to redeem</label>
              <input type="number" value={settingsForm.minRedeemPoints ?? ""}
                onChange={(e) => setSettingsForm({ ...settingsForm, minRedeemPoints: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              <p className="mt-1 text-xs text-gray-400">Minimum to redeem</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">Points expiry (months)</label>
              <input type="number" value={settingsForm.expiryMonths ?? ""}
                onChange={(e) => setSettingsForm({ ...settingsForm, expiryMonths: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
              <p className="mt-1 text-xs text-gray-400">0 = never expire</p>
            </div>
          </div>

          {/* Toggles */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-col gap-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-700">Points Earning Enabled</span>
              <button type="button" onClick={() => setSettingsForm({ ...settingsForm, earnEnabled: !settingsForm.earnEnabled })}
                className={`relative h-6 w-11 rounded-full transition-all flex-shrink-0 ${settingsForm.earnEnabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${settingsForm.earnEnabled ? "left-6" : "left-1"}`} />
              </button>
            </label>
            <div className="border-t border-slate-200" />
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-slate-700">Redemption Enabled</span>
              <button type="button" onClick={() => setSettingsForm({ ...settingsForm, redeemEnabled: !settingsForm.redeemEnabled })}
                className={`relative h-6 w-11 rounded-full transition-all flex-shrink-0 ${settingsForm.redeemEnabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${settingsForm.redeemEnabled ? "left-6" : "left-1"}`} />
              </button>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setShowSettings(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={saveSettings}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 transition-all">
              Save Settings
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ MODAL: Earn Points ══════════ */}
      <CustomModal open={!!earnAcc} onClose={() => setEarnAcc(null)} title="Earn Points" size="sm">
        {earnAcc && (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-sm font-bold text-slate-700">{earnAcc.customerName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{earnAcc.phone} · {earnAcc.pointsBalance?.toLocaleString()} pts current</p>
            </div>
            <CustomInput label="Purchase Amount (৳)" type="number" step="0.01" placeholder="0.00" value={earnAmount}
              onChange={(e) => setEarnAmount(e.target.value)} hint="Points will be auto-calculated based on earn rules" />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEarnAcc(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={earnPoints} disabled={!earnAmount}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 disabled:opacity-50 transition-all">
                Earn Points
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Redeem Points ══════════ */}
      <CustomModal open={!!redeemAcc} onClose={() => setRedeemAcc(null)} title="Redeem Points" size="sm">
        {redeemAcc && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-sm font-bold text-slate-700">{redeemAcc.customerName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{redeemAcc.phone} · <span className="font-semibold text-amber-600">{redeemAcc.pointsBalance?.toLocaleString()} pts available</span></p>
            </div>
            <CustomInput label="Points to Redeem" type="number" placeholder="0" value={redeemPts}
              onChange={(e) => setRedeemPts(e.target.value)} hint="Discount value will be calculated from earn rules" />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRedeemAcc(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={redeemPoints} disabled={!redeemPts}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-amber-500/30 hover:bg-amber-400 disabled:opacity-50 transition-all">
                Redeem
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Loyalty Ledger ══════════ */}
      <CustomModal open={!!ledgerFor} onClose={() => setLedgerFor(null)} title={`Ledger — ${ledgerFor?.customerName ?? ""}`} size="2xl">
        {ledgerFor && (
          <div className="space-y-3">
            {ledger.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No transactions found.</p>}
            {ledger.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-700 capitalize">{row.type.replace(/_/g, " ")}</p>
                  {row.note && <p className="text-xs text-slate-400 mt-0.5">{row.note}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(row.createdAt).toLocaleString("en-BD")}</p>
                </div>
                <div className="text-right">
                  {row.pointsEarned != null && <p className="text-sm font-black text-emerald-600">+{row.pointsEarned} pts</p>}
                  {row.pointsRedeemed != null && <p className="text-sm font-black text-rose-500">−{row.pointsRedeemed} pts</p>}
                  {row.balanceAfter != null && <p className="text-xs text-slate-400">Balance: {row.balanceAfter} pts</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Wallet Credit / Debit ══════════ */}
      <CustomModal open={!!walTxModal} onClose={() => setWalTxModal(null)}
        title={walTxModal?.mode === "credit" ? "Credit Wallet" : "Debit Wallet"} size="sm">
        {walTxModal && (
          <div className="space-y-4">
            <div className={`rounded-xl p-4 border ${walTxModal.mode === "credit" ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
              <p className="text-sm font-bold text-slate-700">{walTxModal.account.customerName}</p>
              <p className="text-xs text-slate-400 mt-0.5">Current balance: <span className="font-bold text-slate-600">{currency(walTxModal.account.balance)}</span></p>
            </div>
            <CustomInput label="Amount (৳)" type="number" step="0.01" placeholder="0.00" value={walForm.amount}
              onChange={(e) => setWalForm({ ...walForm, amount: e.target.value })} />
            {walTxModal.mode === "credit" && (
              <div>
                <label className="mb-1.5 block text-[15px] font-semibold text-gray-600">Transaction Type</label>
                <select value={walForm.type} onChange={(e) => setWalForm({ ...walForm, type: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                  <option value="ADD">Add Funds</option>
                  <option value="CASHBACK">Cashback</option>
                  <option value="REFUND">Refund</option>
                  <option value="BONUS">Bonus</option>
                </select>
              </div>
            )}
            <CustomInput label="Note (optional)" placeholder="Reason…" value={walForm.note}
              onChange={(e) => setWalForm({ ...walForm, note: e.target.value })} />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setWalTxModal(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={walTxModal.mode === "credit" ? walletCredit : walletDebit} disabled={!walForm.amount}
                className={`rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-lg disabled:opacity-50 transition-all ${walTxModal.mode === "credit" ? "bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-500" : "bg-rose-500 shadow-rose-500/30 hover:bg-rose-400"}`}>
                {walTxModal.mode === "credit" ? "Credit" : "Debit"}
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Wallet Ledger Detail ══════════ */}
      <CustomModal open={!!walletDetail} onClose={() => setWalletDetail(null)}
        title={`Wallet — ${walletDetail?.customerName ?? ""}`} size="2xl">
        {walletDetail && (
          <div className="space-y-3">
            <div className="flex gap-4 mb-4">
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-3 text-center flex-1">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Balance</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{currency(walletDetail.balance)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-5 py-3 text-center flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Credited</p>
                <p className="text-2xl font-black text-slate-700 mt-1">{currency(walletDetail.lifetimeCredited)}</p>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-100 px-5 py-3 text-center flex-1">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Total Debited</p>
                <p className="text-2xl font-black text-rose-700 mt-1">{currency(walletDetail.lifetimeDebited)}</p>
              </div>
            </div>
            {(walletDetail.transactions ?? []).length === 0 && <p className="text-center text-sm text-slate-400 py-8">No transactions found.</p>}
            {(walletDetail.transactions ?? []).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-700 capitalize">{tx.type?.replace(/_/g, " ")}</p>
                  {tx.note && <p className="text-xs text-slate-400 mt-0.5">{tx.note}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleString("en-BD")}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${Number(tx.amount) >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {Number(tx.amount) >= 0 ? "+" : ""}{currency(tx.amount)}
                  </p>
                  {tx.balanceAfter != null && <p className="text-xs text-slate-400">Balance: {currency(tx.balanceAfter)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Issue Gift Card ══════════ */}
      <CustomModal open={showGc} onClose={() => setShowGc(false)} title="Issue New Gift Card" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <CustomInput label="Card No (optional)" placeholder="Auto-generated if blank" value={gcForm.cardNo}
              onChange={(e) => setGcForm({ ...gcForm, cardNo: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-[15px] font-semibold text-gray-600">Card Type</label>
              <select value={gcForm.cardType} onChange={(e) => setGcForm({ ...gcForm, cardType: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                <option value="DIGITAL">Digital</option>
                <option value="PHYSICAL">Physical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CustomInput label="Initial Amount (৳)" type="number" step="0.01" placeholder="0.00" value={gcForm.initialAmount}
              onChange={(e) => setGcForm({ ...gcForm, initialAmount: e.target.value })} />
            <CustomInput label="Expiry Date (optional)" type="date" value={gcForm.expiryDate}
              onChange={(e) => setGcForm({ ...gcForm, expiryDate: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-[15px] font-semibold text-gray-600">Issue to Customer (optional)</label>
            <select value={gcForm.issuedToCustomerId} onChange={(e) => setGcForm({ ...gcForm, issuedToCustomerId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
              <option value="">— Anonymous —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ""}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowGc(false)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={createGiftCard} disabled={!gcForm.initialAmount}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/30 hover:bg-violet-500 disabled:opacity-50 transition-all">
              Issue Card
            </button>
          </div>
        </div>
      </CustomModal>

      {/* ══════════ MODAL: Gift Card Redeem / Reload ══════════ */}
      <CustomModal open={!!gcTxModal} onClose={() => setGcTxModal(null)}
        title={gcTxModal?.mode === "redeem" ? "Redeem Gift Card" : "Reload Gift Card"} size="sm">
        {gcTxModal && (
          <div className="space-y-4">
            <div className={`rounded-xl p-4 border ${gcTxModal.mode === "redeem" ? "bg-violet-50 border-violet-100" : "bg-emerald-50 border-emerald-100"}`}>
              <p className="font-mono text-sm font-bold text-slate-700">{gcTxModal.card.cardNo}</p>
              <p className="text-xs text-slate-400 mt-0.5">Balance: <span className="font-bold text-slate-600">{currency(gcTxModal.card.balance)}</span></p>
            </div>
            <CustomInput label="Amount (৳)" type="number" step="0.01" placeholder="0.00" value={gcTxForm.amount}
              onChange={(e) => setGcTxForm({ ...gcTxForm, amount: e.target.value })} />
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setGcTxModal(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={gcTx} disabled={!gcTxForm.amount}
                className={`rounded-xl px-5 py-2.5 text-sm font-black text-white shadow-lg disabled:opacity-50 transition-all ${gcTxModal.mode === "redeem" ? "bg-violet-600 shadow-violet-500/30 hover:bg-violet-500" : "bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-500"}`}>
                {gcTxModal.mode === "redeem" ? "Redeem" : "Reload"}
              </button>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ══════════ MODAL: Gift Card History ══════════ */}
      <CustomModal open={!!gcDetail} onClose={() => setGcDetail(null)}
        title={`Gift Card — ${gcDetail?.cardNo ?? ""}`} size="2xl">
        {gcDetail && (
          <div className="space-y-3">
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="rounded-xl bg-violet-50 border border-violet-100 px-5 py-3 text-center flex-1 min-w-[120px]">
                <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">Balance</p>
                <p className="text-2xl font-black text-violet-700 mt-1">{currency(gcDetail.balance)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-5 py-3 text-center flex-1 min-w-[120px]">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Initial</p>
                <p className="text-2xl font-black text-slate-700 mt-1">{currency(gcDetail.initialAmount)}</p>
              </div>
              <div className={`rounded-xl px-5 py-3 text-center flex-1 min-w-[120px] border ${gcDetail.status === "ACTIVE" ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <p className={`text-lg font-black mt-1 ${gcDetail.status === "ACTIVE" ? "text-emerald-700" : "text-rose-600"}`}>{gcDetail.status}</p>
              </div>
            </div>
            {gcDetail.status === "ACTIVE" && (
              <div className="flex justify-end pb-2">
                <button onClick={() => disableGc(gcDetail)}
                  className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold text-white hover:bg-rose-600 shadow-sm transition-all">
                  <Ban size={13} /> Disable Card
                </button>
              </div>
            )}
            {(gcDetail.transactions ?? []).length === 0 && <p className="text-center text-sm text-slate-400 py-8">No transactions found.</p>}
            {(gcDetail.transactions ?? []).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-700 capitalize">{tx.type?.replace(/_/g, " ")}</p>
                  {tx.note && <p className="text-xs text-slate-400 mt-0.5">{tx.note}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(tx.createdAt).toLocaleString("en-BD")}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === "RELOAD" ? "text-emerald-600" : "text-rose-500"}`}>
                    {tx.type === "RELOAD" ? "+" : "−"}{currency(Math.abs(tx.amount ?? 0))}
                  </p>
                  {tx.balanceAfter != null && <p className="text-xs text-slate-400">Balance: {currency(tx.balanceAfter)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomModal>
    </div>
  );
}
