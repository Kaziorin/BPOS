"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Star, Wallet as WalletIcon, Gift, Plus, RefreshCw, Loader2, Crown,
  Users, Coins, ArrowDownToLine, ArrowUpFromLine, Search, BadgePercent,
  CircleDollarSign, CreditCard, RotateCcw, Ban, Receipt, ChevronRight,
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
      setWalletDetail(res.data);
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
    <div className="space-y-6">
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Star size={22} className="text-primary-600" /> Loyalty / Wallet / Gift Cards
          </h1>
          <p className="mt-1 text-sm text-gray-500">Points, tiers, digital wallets and gift cards — every movement on a full ledger</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "loyalty" && (<>
            <CustomButton variant="outline" onClick={() => setShowSettings(true)}><Coins size={15} /> Earn Rules</CustomButton>
            <CustomButton onClick={() => { setTierForm({ name: "", code: "", minPoints: "", multiplier: "1.0", cashbackRate: "0", benefits: "", color: "amber" }); setShowTier(true); }}><Plus size={15} /> New Tier</CustomButton>
          </>)}
          {tab === "gift" && <CustomButton onClick={() => { loadCustomers(); setGcForm({ cardNo: "", cardType: "DIGITAL", initialAmount: "", expiryDate: "", issuedToCustomerId: "" }); setShowGc(true); }}><Plus size={15} /> Issue Gift Card</CustomButton>}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Users size={13} /> Members</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{accounts.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Coins size={13} /> Points in circulation</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{totalPoints.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><WalletIcon size={13} /> Wallet balance</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{currency(walletTotal)}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-medium text-gray-400"><Gift size={13} /> Gift cards (active)</p>
          <p className="mt-1 text-2xl font-bold text-violet-600">{currency(gcBalance)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 pb-2">
        {([["loyalty", "Points & Tiers", Star], ["wallet", "Wallet", WalletIcon], ["gift", "Gift Cards", Gift]] as [Tab, string, any][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${tab === id ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════ LOYALTY TAB ══════════ */}
      {tab === "loyalty" && (
        <div className="space-y-4">
          {/* Tier cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((t) => {
              const color = TIER_COLORS[t.code] || "bg-gray-50 text-gray-700 border-gray-200";
              return (
                <div key={t.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${color}`}><Crown size={11} /> {t.name}</span>
                    <span className="flex items-center gap-2">
                      <button onClick={() => toggleTier(t)} title={t.isActive ? "Deactivate" : "Activate"} className={`h-2 w-2 rounded-full ${t.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{t.benefits || "—"}</p>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>From <b className="text-gray-800">{t.minPoints.toLocaleString()} pts</b></span>
                    <span><b className="text-gray-800">{t.multiplier}x</b> earn</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">{tierTotals[t.code] || 0} member(s) · {t.cashbackRate}% cashback</p>
                </div>
              );
            })}
          </div>

          {/* Accounts table */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={accSearch} onChange={(e) => setAccSearch(e.target.value)} placeholder="Search customer…"
                className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <button onClick={() => loadLoyalty()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"><RefreshCw size={13} /> Refresh</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Lifetime earned</th>
                  <th className="px-4 py-3">Redeemed</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const color = TIER_COLORS[a.tier] || "bg-gray-50 text-gray-700 border-gray-200";
                  return (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{a.customerName || "—"}</p>
                        <p className="text-[11px] text-gray-400">{a.phone || ""}</p>
                      </td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold ${color}`}><Crown size={10} /> {a.tier}</span></td>
                      <td className="px-4 py-3 text-base font-bold text-amber-600">{a.pointsBalance?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{a.lifetimeEarned?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{a.lifetimeRedeemed?.toLocaleString() ?? 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => { setEarnAcc(a); setEarnAmount(""); }} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">+ Earn</button>
                          <button onClick={() => { setRedeemAcc(a); setRedeemPts(""); }} className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-100">Redeem</button>
                          <button onClick={() => openLedger(a)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">Ledger</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {accounts.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No loyalty members yet — points are auto-earned when customers buy, or use “+ Earn”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ WALLET TAB ══════════ */}
      {tab === "wallet" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={walSearch} onChange={(e) => setWalSearch(e.target.value)} placeholder="Search customer…"
              className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Lifetime credited</th>
                  <th className="px-4 py-3">Debited</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{w.customerName || "—"}</p>
                      <p className="text-[11px] text-gray-400">{w.phone || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-base font-bold text-emerald-600">{currency(w.balance)}</td>
                    <td className="px-4 py-3 text-gray-700">{currency(w.lifetimeCredited)}</td>
                    <td className="px-4 py-3 text-gray-700">{currency(w.lifetimeDebited)}</td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${w.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>{w.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setWalTxModal({ mode: "credit", account: w }); setWalForm({ type: "ADD", amount: "", note: "" }); }} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">Credit</button>
                        <button onClick={() => { setWalTxModal({ mode: "debit", account: w }); setWalForm({ type: "ADD", amount: "", note: "" }); }} className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100">Debit</button>
                        <button onClick={() => openWalletDetail(w)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">Ledger</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {wallets.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">No wallet accounts yet — credit a customer to open one.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ GIFT CARDS TAB ══════════ */}
      {tab === "gift" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={gcSearch} onChange={(e) => setGcSearch(e.target.value)} placeholder="Search card no / holder…"
              className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Holder</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {giftCards.map((g) => (
                  <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-gray-900">{g.cardNo}</p>
                      <p className="text-[11px] text-gray-400">{g.cardType}{g.barcode && g.barcode !== g.cardNo ? ` · ${g.barcode}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{g.issuedToName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{currency(g.initialAmount)}</td>
                    <td className="px-4 py-3 text-base font-bold text-violet-600">{currency(g.balance)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{g.expiryDate ? new Date(g.expiryDate).toLocaleDateString("en-GB") : "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${g.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : g.status === "EXPIRED" ? "bg-gray-500/10 text-gray-500" : "bg-rose-500/10 text-rose-600"}`}>{g.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setGcTxModal({ mode: "redeem", card: g }); setGcTxForm({ amount: "" }); }} className="rounded-md bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100">Redeem</button>
                        <button onClick={() => { setGcTxModal({ mode: "reload", card: g }); setGcTxForm({ amount: "" }); }} className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100">Reload</button>
                        <button onClick={() => openGcDetail(g)} className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">History</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {giftCards.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No gift cards yet — issue one to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── New tier modal ── */}
      <CustomModal open={showTier} onClose={() => setShowTier(false)} title="New loyalty tier">
        <div className="space-y-3">
          <CustomInput label="Name *" value={tierForm.name} onChange={(e: any) => setTierForm({ ...tierForm, name: e.target.value })} placeholder="e.g. Platinum" />
          <CustomInput label="Code *" value={tierForm.code} onChange={(e: any) => setTierForm({ ...tierForm, code: e.target.value.toUpperCase() })} placeholder="PLATINUM" />
          <div className="grid grid-cols-3 gap-3">
            <CustomInput label="Min points" type="number" value={tierForm.minPoints} onChange={(e: any) => setTierForm({ ...tierForm, minPoints: e.target.value })} />
            <CustomInput label="Multiplier" type="number" step="0.1" value={tierForm.multiplier} onChange={(e: any) => setTierForm({ ...tierForm, multiplier: e.target.value })} />
            <CustomInput label="Cashback %" type="number" step="0.1" value={tierForm.cashbackRate} onChange={(e: any) => setTierForm({ ...tierForm, cashbackRate: e.target.value })} />
          </div>
          <CustomInput label="Benefits" value={tierForm.benefits} onChange={(e: any) => setTierForm({ ...tierForm, benefits: e.target.value })} placeholder="e.g. 2x points + priority service" />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowTier(false)}>Cancel</CustomButton>
            <CustomButton onClick={createTier}><Plus size={15} /> Create</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Settings modal ── */}
      <CustomModal open={showSettings} onClose={() => setShowSettings(false)} title="Points earning rules">
        {settings && (
          <div className="space-y-3">
            <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              Members earn <b>1 point per {currency(settings.pointsPerAmount)}</b> spent (tier multiplier applied), and redeem at <b>{currency(settings.redeemValuePerPoint)} per point</b>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <CustomInput label="৳ per point" type="number" value={settingsForm.pointsPerAmount} onChange={(e: any) => setSettingsForm({ ...settingsForm, pointsPerAmount: e.target.value })} />
              <CustomInput label="Value per point (৳)" type="number" step="0.5" value={settingsForm.redeemValuePerPoint} onChange={(e: any) => setSettingsForm({ ...settingsForm, redeemValuePerPoint: e.target.value })} />
              <CustomInput label="Expiry (months)" type="number" value={settingsForm.expiryMonths} onChange={(e: any) => setSettingsForm({ ...settingsForm, expiryMonths: e.target.value })} />
              <CustomInput label="Min redeem points" type="number" value={settingsForm.minRedeemPoints} onChange={(e: any) => setSettingsForm({ ...settingsForm, minRedeemPoints: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={!!settingsForm.earnEnabled} onChange={(e) => setSettingsForm({ ...settingsForm, earnEnabled: e.target.checked })} /> Earning enabled
            </label>
            <div className="flex justify-end gap-2">
              <CustomButton variant="outline" onClick={() => setShowSettings(false)}>Cancel</CustomButton>
              <CustomButton onClick={saveSettings}>Save</CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── Earn modal ── */}
      <CustomModal open={!!earnAcc} onClose={() => setEarnAcc(null)} title={`Earn points — ${earnAcc?.customerName || ""}`}>
        <div className="space-y-3">
          <CustomInput label="Spend amount (৳) *" type="number" value={earnAmount} onChange={(e: any) => setEarnAmount(e.target.value)} placeholder="e.g. 5000" />
          <p className="text-xs text-gray-400">Points computed from the earn rule × tier multiplier.</p>
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setEarnAcc(null)}>Cancel</CustomButton>
            <CustomButton onClick={earnPoints}><ArrowDownToLine size={14} /> Earn</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Redeem modal ── */}
      <CustomModal open={!!redeemAcc} onClose={() => setRedeemAcc(null)} title={`Redeem points — ${redeemAcc?.customerName || ""}`}>
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Balance: <b className="text-amber-600">{redeemAcc?.pointsBalance?.toLocaleString() ?? 0} pts</b></p>
          <CustomInput label="Points to redeem *" type="number" value={redeemPts} onChange={(e: any) => setRedeemPts(e.target.value)} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setRedeemAcc(null)}>Cancel</CustomButton>
            <CustomButton onClick={redeemPoints}><ArrowUpFromLine size={14} /> Redeem</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Ledger modal ── */}
      <CustomModal open={!!ledgerFor} onClose={() => setLedgerFor(null)} title={`Points ledger — ${ledgerFor?.customerName || ""}`}>
        <div className="space-y-2">
          {ledger.length === 0 && <p className="py-6 text-center text-sm text-gray-400">No transactions yet</p>}
          {ledger.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <div>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.type === "EARN" ? "bg-emerald-500/10 text-emerald-600" : t.type === "REDEEM" ? "bg-amber-500/10 text-amber-600" : "bg-gray-500/10 text-gray-500"}`}>{t.type}</span>
                <p className="mt-1 text-xs text-gray-500">{t.note || ""}</p>
              </div>
              <div className="text-right">
                {t.type === "EARN" || t.type === "REFERRAL_BONUS" ? <p className="font-bold text-emerald-600">+{(t.pointsEarned || 0).toLocaleString()}</p> : <p className="font-bold text-amber-600">−{(t.pointsRedeemed || 0).toLocaleString()}</p>}
                <p className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleString("en-GB")}</p>
              </div>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* ── Wallet tx modal ── */}
      <CustomModal open={!!walTxModal} onClose={() => setWalTxModal(null)}
        title={`${walTxModal?.mode === "credit" ? "Credit" : "Debit"} wallet — ${walTxModal?.account.customerName || ""}`}>
        <div className="space-y-3">
          {walTxModal?.mode === "credit" && (
            <CustomSelect label="Credit type" value={walForm.type} onChange={(e: any) => setWalForm({ ...walForm, type: e.target.value })}
              options={[["ADD", "Add money"], ["CASHBACK", "Cashback"], ["REFUND", "Refund"], ["STORE_CREDIT", "Store credit"], ["PROMOTIONAL", "Promotional credit"]].map(([v, l]) => ({ value: v, label: l }))} />
          )}
          <CustomInput label="Amount (৳) *" type="number" value={walForm.amount} onChange={(e: any) => setWalForm({ ...walForm, amount: e.target.value })} />
          <CustomInput label="Note" value={walForm.note} onChange={(e: any) => setWalForm({ ...walForm, note: e.target.value })} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setWalTxModal(null)}>Cancel</CustomButton>
            <CustomButton variant={walTxModal?.mode === "debit" ? "danger" : "primary"} onClick={walTxModal?.mode === "credit" ? walletCredit : walletDebit}>
              {walTxModal?.mode === "credit" ? <><ArrowDownToLine size={14} /> Credit</> : <><ArrowUpFromLine size={14} /> Debit</>}
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Wallet detail modal ── */}
      <CustomModal open={!!walletDetail} onClose={() => setWalletDetail(null)} title={`Wallet ledger — ${walletDetail?.customerName || ""}`}>
        <div className="space-y-2">
          <div className="rounded-lg bg-emerald-50 p-3 text-center">
            <p className="text-xs text-emerald-600">Balance</p>
            <p className="text-2xl font-bold text-emerald-700">{currency(walletDetail?.wallet?.balance)}</p>
          </div>
          {(walletDetail?.transactions || []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <div>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${["ADD", "CASHBACK", "REFUND", "STORE_CREDIT", "PROMOTIONAL"].includes(t.type) ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{t.type}</span>
                <p className="mt-1 text-xs text-gray-500">{t.note || ""} <span className="text-gray-300">· {currency(t.balanceBefore)} → {currency(t.balanceAfter)}</span></p>
              </div>
              <p className={`font-bold ${["ADD", "CASHBACK", "REFUND", "STORE_CREDIT", "PROMOTIONAL"].includes(t.type) ? "text-emerald-600" : "text-rose-600"}`}>{["ADD", "CASHBACK", "REFUND", "STORE_CREDIT", "PROMOTIONAL"].includes(t.type) ? "+" : "−"}{currency(t.amount)}</p>
            </div>
          ))}
          {(walletDetail?.transactions || []).length === 0 && <p className="py-6 text-center text-sm text-gray-400">No transactions yet</p>}
        </div>
      </CustomModal>

      {/* ── Gift card create modal ── */}
      <CustomModal open={showGc} onClose={() => setShowGc(false)} title="Issue gift card">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <CustomSelect label="Type" value={gcForm.cardType} onChange={(e: any) => setGcForm({ ...gcForm, cardType: e.target.value })}
              options={[{ value: "DIGITAL", label: "Digital" }, { value: "PHYSICAL", label: "Physical" }]} />
            <CustomInput label="Card no (blank = auto)" value={gcForm.cardNo} onChange={(e: any) => setGcForm({ ...gcForm, cardNo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Initial amount (৳) *" type="number" value={gcForm.initialAmount} onChange={(e: any) => setGcForm({ ...gcForm, initialAmount: e.target.value })} />
            <CustomInput label="Expiry date" type="date" value={gcForm.expiryDate} onChange={(e: any) => setGcForm({ ...gcForm, expiryDate: e.target.value })} />
          </div>
          <CustomSelect label="Issue to customer (optional)" value={gcForm.issuedToCustomerId} onChange={(e: any) => setGcForm({ ...gcForm, issuedToCustomerId: e.target.value })}
            options={[{ value: "", label: "No customer (anonymous card)" }, ...customers.map((c) => ({ value: c.id, label: `${c.name}${c.phone ? ` · ${c.phone}` : ""}` }))]} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setShowGc(false)}>Cancel</CustomButton>
            <CustomButton onClick={createGiftCard}><Gift size={15} /> Issue card</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Gift card tx modal ── */}
      <CustomModal open={!!gcTxModal} onClose={() => setGcTxModal(null)}
        title={`${gcTxModal?.mode === "redeem" ? "Redeem" : "Reload"} ${gcTxModal?.card.cardNo || ""}`}>
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Current balance: <b className="text-violet-600">{currency(gcTxModal?.card.balance)}</b></p>
          <CustomInput label="Amount (৳) *" type="number" value={gcTxForm.amount} onChange={(e: any) => setGcTxForm({ ...gcTxForm, amount: e.target.value })} />
          <div className="flex justify-end gap-2">
            <CustomButton variant="outline" onClick={() => setGcTxModal(null)}>Cancel</CustomButton>
            <CustomButton onClick={gcTx}>{gcTxModal?.mode === "redeem" ? "Redeem" : "Reload"}</CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── Gift card detail modal ── */}
      <CustomModal open={!!gcDetail} onClose={() => setGcDetail(null)} title={`Card ${gcDetail?.cardNo || ""} — history`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-violet-50 p-3">
            <div>
              <p className="text-xs text-violet-600">Balance</p>
              <p className="text-2xl font-bold text-violet-700">{currency(gcDetail?.balance)}</p>
            </div>
            <div className="text-right text-xs text-violet-600">
              <p>Status: <b>{gcDetail?.status}</b></p>
              <p>Expiry: {gcDetail?.expiryDate ? new Date(gcDetail.expiryDate).toLocaleDateString("en-GB") : "—"}</p>
            </div>
          </div>
          {(gcDetail?.transactions || []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <div>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.type === "ISSUE" || t.type === "RELOAD" || t.type === "REFUND" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>{t.type}</span>
                <p className="mt-1 text-xs text-gray-500">{t.note || ""} <span className="text-gray-300">· {currency(t.balanceBefore)} → {currency(t.balanceAfter)}</span></p>
              </div>
              <p className={`font-bold ${t.type === "ISSUE" || t.type === "RELOAD" || t.type === "REFUND" ? "text-emerald-600" : "text-rose-600"}`}>{t.type === "REDEEM" ? "−" : "+"}{currency(t.amount)}</p>
            </div>
          ))}
          {(gcDetail?.transactions || []).length === 0 && <p className="py-6 text-center text-sm text-gray-400">No transactions yet</p>}
          {gcDetail?.status === "ACTIVE" && (
            <div className="flex justify-end pt-1">
              <CustomButton variant="danger" size="sm" onClick={() => disableGc(gcDetail)}><Ban size={13} /> Disable card</CustomButton>
            </div>
          )}
        </div>
      </CustomModal>
    </div>
  );
}
