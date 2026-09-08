"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingCart, Scale, Search, Plus, Trash2,
  PauseCircle, Play, CheckCircle2, Printer, ChevronLeft,
  CreditCard, ArrowRight, ShoppingBag, Clock, Users, History,
  Settings, Tag, RotateCcw, ScanLine, Gift, Package, Star,
  Apple, Coffee, Home, Wallet, FileText, X,
  Layers, Grid, AlignLeft, Camera,
  Utensils, Snowflake, Fish, Sparkles, Heart, ShieldCheck, ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api";

interface CartItem {
  id: string; productId: string; name: string; sku: string;
  barcode?: string; unitPrice: number; qty: number;
  isWeighed?: boolean; weightKg?: number; lineTotal: number;
  discountPct?: number; uom?: string;
}
interface Product {
  id: string; name: string; sku: string; barcode?: string;
  sellingPrice: number; uom: string;
  category?: { name: string }; stock?: number;
}

const EMOJI_MAP: [string, string][] = [
  ["banana","🍌"],["apple","🍎"],["potato","🥔"],["onion","🧅"],
  ["tomato","🍅"],["cucumber","🥒"],["carrot","🥕"],["rice","🌾"],
  ["oil","🫙"],["milk","🥛"],["egg","🥚"],["sugar","🍬"],
  ["atta","🌾"],["flour","🌾"],["lays","🍟"],["chips","🍟"],
  ["cola","🥤"],["coca","🥤"],["pepsi","🥤"],["nescafe","☕"],
  ["coffee","☕"],["tea","🍵"],["soap","🧼"],["detergent","🧴"],
  ["tissue","🧻"],["water","💧"],["bread","🍞"],["butter","🧈"],
  ["cheese","🧀"],["yogurt","🫙"],["fish","🐟"],["meat","🥩"],
  ["chicken","🍗"],["mango","🥭"],["orange","🍊"],["lemon","🍋"],
  ["salt","🧂"],["pepper","🌶"],["biscuit","🍪"],["chocolate","🍫"],
  ["croissant","🥐"],["cake","🍰"],["pizza","🍕"],["ice cream","🍨"],
  ["nuggets","🍗"],["salmon","🐟"],["steak","🥩"],["wash","🧴"],
  ["shampoo","🧴"],["baby","🍼"],["cat","🐱"],["dog","🐶"],
];
function getEmoji(name: string) {
  const n = name.toLowerCase();
  for (const [k,e] of EMOJI_MAP) if (n.includes(k)) return e;
  return "🛒";
}
function getEmojiColor(emoji: string) {
  const m: Record<string,string> = {
    "🍌":"#FEF9C3","🍎":"#FEE2E2","🥔":"#FEF3C7","🧅":"#FDF4FF",
    "🍅":"#FEE2E2","🥒":"#DCFCE7","🥕":"#FFEDD5","🌾":"#FEF9C3",
    "🫙":"#F0FDF4","🥛":"#F0F9FF","🥚":"#FEF9C3","🍬":"#FDF4FF",
    "🍟":"#FEF9C3","🥤":"#ECFDF5","☕":"#FEF3C7","🧴":"#EFF6FF",
    "🧻":"#F0FDF4","💧":"#EFF6FF","🍞":"#FEF3C7","🧈":"#FEF9C3",
    "🥐":"#FEF3C7","🍰":"#FDF4FF","🍕":"#FEE2E2","🍨":"#EFF6FF",
    "🐟":"#ECFDF5","🥩":"#FEE2E2","🍼":"#FFF7ED","🐱":"#FEF3C7",
  };
  return m[emoji] || "#F0FDF4";
}

const DEMO_PRODUCTS: Product[] = [
  {id:"d1", name:"Banana",        sku:"BAN-1KG", sellingPrice:60,  uom:"kg",    category:{name:"Fruits & Veg"}},
  {id:"d2", name:"Red Apple",     sku:"APL-1KG", sellingPrice:180, uom:"kg",    category:{name:"Fruits & Veg"}},
  {id:"d3", name:"Potato",        sku:"POT-1KG", sellingPrice:30,  uom:"kg",    category:{name:"Fruits & Veg"}},
  {id:"d4", name:"Onion",         sku:"ONI-1KG", sellingPrice:28,  uom:"kg",    category:{name:"Fruits & Veg"}},
  {id:"d5", name:"Tomato",        sku:"TOM-1KG", sellingPrice:40,  uom:"kg",    category:{name:"Fruits & Veg"}},
  {id:"d6", name:"Cucumber",      sku:"CUC-1KG", sellingPrice:25,  uom:"kg",    category:{name:"Fruits & Veg"}},
  {id:"d7", name:"Basmati Rice",  sku:"RIC-1KG", sellingPrice:120, uom:"kg",    category:{name:"Grocery"}},
  {id:"d8", name:"Sunflower Oil", sku:"OIL-1L",  sellingPrice:160, uom:"pcs",   category:{name:"Grocery"}},
  {id:"d9", name:"Milk",          sku:"MLK-1L",  sellingPrice:70,  uom:"pcs",   category:{name:"Dairy"}},
  {id:"d10",name:"Eggs (Dozen)",  sku:"EGG-DOZ", sellingPrice:130, uom:"dozen", category:{name:"Dairy"}},
  {id:"d11",name:"Sugar",         sku:"SUG-1KG", sellingPrice:70,  uom:"kg",    category:{name:"Grocery"}},
  {id:"d12",name:"Atta",          sku:"ATT-1KG", sellingPrice:50,  uom:"kg",    category:{name:"Grocery"}},
  {id:"d13",name:"Lays Classic",  sku:"LAY-52G", sellingPrice:35,  uom:"pcs",   category:{name:"Snacks"}},
  {id:"d14",name:"Coca-Cola",     sku:"COC-1L5", sellingPrice:110, uom:"pcs",   category:{name:"Beverages"}},
  {id:"d15",name:"Nescafe",       sku:"NES-50G", sellingPrice:115, uom:"pcs",   category:{name:"Beverages"}},
  {id:"d16",name:"Surf Excel",    sku:"SUR-1KG", sellingPrice:190, uom:"kg",    category:{name:"Household"}},
  {id:"d17",name:"Toilet Tissue", sku:"TIS-4P",  sellingPrice:60,  uom:"pcs",   category:{name:"Household"}},
  {id:"d18",name:"Detergent",     sku:"DET-1KG", sellingPrice:120, uom:"kg",    category:{name:"Household"}},
  {id:"d19",name:"White Bread",   sku:"BRD-400G",sellingPrice:45,  uom:"pcs",   category:{name:"Bakery"}},
  {id:"d20",name:"Butter Croissant",sku:"CRO-2P",sellingPrice:85,  uom:"pcs",   category:{name:"Bakery"}},
  {id:"d21",name:"Chocolate Cake",sku:"CAK-500G",sellingPrice:350, uom:"pcs",   category:{name:"Bakery"}},
  {id:"d22",name:"Frozen Pizza",  sku:"PIZ-350G",sellingPrice:290, uom:"pcs",   category:{name:"Frozen Foods"}},
  {id:"d23",name:"Ice Cream",     sku:"ICE-1L",  sellingPrice:220, uom:"pcs",   category:{name:"Frozen Foods"}},
  {id:"d24",name:"Chicken Nuggets",sku:"NUG-500G",sellingPrice:260,uom:"pcs",   category:{name:"Frozen Foods"}},
  {id:"d25",name:"Fresh Salmon",  sku:"SAL-1KG", sellingPrice:850, uom:"kg",    category:{name:"Meat & Fish"}},
  {id:"d26",name:"Beef Steak",    sku:"STE-1KG", sellingPrice:750, uom:"kg",    category:{name:"Meat & Fish"}},
  {id:"d27",name:"Body Wash",     sku:"WAS-500M",sellingPrice:240, uom:"pcs",   category:{name:"Personal Care"}},
  {id:"d28",name:"Shampoo",       sku:"SHA-350M",sellingPrice:280, uom:"pcs",   category:{name:"Personal Care"}},
  {id:"d29",name:"Baby Powder",   sku:"BAB-200G",sellingPrice:310, uom:"pcs",   category:{name:"Baby Care"}},
  {id:"d30",name:"Cat Food",      sku:"CAT-1KG", sellingPrice:420, uom:"pcs",   category:{name:"Pet Supplies"}},
];

const DEMO_CART: CartItem[] = [
  {id:"c1",productId:"d7", name:"Basmati Rice (1kg)", sku:"RIC-1KG",unitPrice:120,qty:1,lineTotal:120,discountPct:0, uom:"kg"},
  {id:"c2",productId:"d8", name:"Sunflower Oil (1L)", sku:"OIL-1L", unitPrice:160,qty:1,lineTotal:160,discountPct:5, uom:"pcs"},
  {id:"c3",productId:"d11",name:"Sugar (1kg)",        sku:"SUG-1KG",unitPrice:70, qty:1,lineTotal:70, discountPct:2, uom:"kg"},
  {id:"c4",productId:"d1", name:"Banana (1kg)",       sku:"BAN-1KG",unitPrice:60, qty:2,lineTotal:120,discountPct:0, uom:"kg"},
  {id:"c5",productId:"d10",name:"Eggs (Dozen)",       sku:"EGG-DOZ",unitPrice:130,qty:1,lineTotal:130,discountPct:0, uom:"dozen"},
  {id:"c6",productId:"d14",name:"Coca-Cola (1.5L)",   sku:"COC-1L5",unitPrice:110,qty:1,lineTotal:110,discountPct:0, uom:"pcs"},
  {id:"c7",productId:"d13",name:"Lays Classic (52g)", sku:"LAY-52G",unitPrice:35, qty:1,lineTotal:35, discountPct:10,uom:"pcs"},
];

const PAY_CFG = [
  {id:"Cash",         label:"Cash",          Icon:Camera,     bg:"bg-[#f0fdf4]", border:"border-[#dcfce7]", text:"text-[#15803d]", activeBorder:"border-[#16a34a]", activeRing:"ring-2 ring-[#16a34a]/30"},
  {id:"Card",         label:"Card",          Icon:CreditCard, bg:"bg-[#eff6ff]", border:"border-[#dbeafe]", text:"text-[#1d4ed8]", activeBorder:"border-[#2563eb]", activeRing:"ring-2 ring-[#2563eb]/30"},
  {id:"UPI / QR",     label:"UPI / QR",      Icon:Grid,       bg:"bg-[#faf5ff]", border:"border-[#ede9fe]", text:"text-[#7c3aed]", activeBorder:"border-[#9333ea]", activeRing:"ring-2 ring-[#9333ea]/30"},
  {id:"Wallet",       label:"Wallet",        Icon:Wallet,     bg:"bg-[#fff7ed]", border:"border-[#ffedd5]", text:"text-[#c2410c]", activeBorder:"border-[#ea580c]", activeRing:"ring-2 ring-[#ea580c]/30"},
  {id:"Split Payment",label:"Split Payment", Icon:Layers,     bg:"bg-[#e6f4f1]", border:"border-[#ccfbf1]", text:"text-[#0d9488]", activeBorder:"border-[#0d9488]", activeRing:"ring-2 ring-[#0d9488]/30"},
] as const;

const FN_KEYS = [
  {label:"Price Check",   key:"F3",Icon:Search},
  {label:"Barcode Lookup",key:"F4",Icon:ScanLine},
  {label:"Recent Sales",  key:"F5",Icon:History},
  {label:"Return/Refund", key:"F6",Icon:RotateCcw},
] as const;

const NUM_KEYS = ["7","8","9","⌫","4","5","6","+","1","2","3","−","0","00",".","="] as const;

export default function GroceryPOSPage() {
  const [products,setProducts]   = useState<Product[]>(DEMO_PRODUCTS);
  const [cart,setCart]           = useState<CartItem[]>(DEMO_CART);
  const [scanInput,setScanInput] = useState("");
  const [searchFilter,setSearchFilter] = useState("");
  const [selectedCat,setSelectedCat]   = useState("All Items");
  const [moreOpen,setMoreOpen]         = useState(false);
  const [heldCarts,setHeldCarts] = useState<{id:string;time:string;items:CartItem[]}[]>([]);
  const [payMethod,setPayMethod] = useState<"Cash"|"Card"|"UPI / QR"|"Wallet"|"Split Payment">("Cash");
  const [submitting,setSubmitting] = useState(false);
  const [completedInv,setCompletedInv] = useState<any|null>(null);
  const [discountPct,setDiscountPct] = useState("0.00");
  const [couponCode,setCouponCode] = useState("");
  const [salesNote,setSalesNote] = useState("");
  const [numBuf,setNumBuf] = useState("");
  const [numTarget,setNumTarget] = useState<string|null>(null);
  const [now,setNow] = useState(new Date());
  const [scaleOpen,setScaleOpen] = useState(false);
  const [scaleProd,setScaleProd] = useState<Product|null>(null);
  const [grossKg,setGrossKg] = useState("1.000");
  const scanRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(t);},[]);

  const loadProducts = useCallback(async()=>{
    try{
      const res:any = await api.get("/products",{params:{limit:300}});
      const d = res?.data?.data??res?.data??res??[];
      const arr:Product[] = Array.isArray(d)?d:[];
      if(arr.length>0) setProducts(arr);
    }catch{}
  },[]);
  useEffect(()=>{loadProducts();scanRef.current?.focus();},[loadProducts]);

  const fmt=(n:number)=>`৳${Number(n||0).toLocaleString("en-BD",{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  const playBeep=()=>{try{const ctx=new((window as any).AudioContext||(window as any).webkitAudioContext)();const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(1400,ctx.currentTime);g.gain.setValueAtTime(0.06,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.00001,ctx.currentTime+0.07);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.07);}catch{}};

  const addToCart=(prod:Product,qty=1,isWeighed=false,weightKg?:number)=>{
    playBeep();
    setCart(prev=>{
      const idx=prev.findIndex(i=>i.productId===prod.id&&!i.isWeighed&&!isWeighed);
      if(idx>=0&&!isWeighed){const copy=[...prev];const nq=copy[idx].qty+qty;copy[idx]={...copy[idx],qty:nq,lineTotal:nq*copy[idx].unitPrice};return copy;}
      const aq=isWeighed?(weightKg||1):qty;const up=Number(prod.sellingPrice||0);
      return [{id:`${prod.id}-${Date.now()}`,productId:prod.id,name:prod.name,sku:prod.sku,barcode:prod.barcode,unitPrice:up,qty:aq,isWeighed,weightKg:isWeighed?weightKg:undefined,lineTotal:aq*up,discountPct:0,uom:prod.uom},...prev];
    });
    setScanInput("");scanRef.current?.focus();
  };

  const updateQty=(id:string,delta:number)=>setCart(prev=>prev.map(i=>{if(i.id!==id)return i;const nq=Math.max(i.isWeighed?0.05:1,Number((i.qty+delta).toFixed(3)));return{...i,qty:nq,lineTotal:nq*i.unitPrice};}).filter(i=>i.qty>0));
  const removeItem=(id:string)=>setCart(prev=>prev.filter(i=>i.id!==id));
  const clearCart=()=>{setCart([]);setDiscountPct("0.00");setCouponCode("");setSalesNote("");};

  const holdCart=()=>{if(!cart.length)return;setHeldCarts(prev=>[...prev,{id:`HOLD-${Date.now().toString().slice(-4)}`,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),items:cart}]);clearCart();};
  const recallCart=(h:{id:string;items:CartItem[]})=>{setCart(h.items);setHeldCarts(prev=>prev.filter(x=>x.id!==h.id));};
  const openScale=(prod:Product)=>{setScaleProd(prod);setGrossKg("1.000");setScaleOpen(true);};
  const confirmScale=()=>{if(!scaleProd)return;const net=Math.max(0.001,parseFloat(grossKg)||0);addToCart(scaleProd,net,true,net);setScaleOpen(false);setScaleProd(null);};

  const handleScanKey=(e:React.KeyboardEvent<HTMLInputElement>)=>{if(e.key!=="Enter")return;e.preventDefault();const code=scanInput.trim().toLowerCase();if(!code)return;const found=products.find(p=>(p.barcode?.toLowerCase()===code)||(p.sku?.toLowerCase()===code)||p.name.toLowerCase()===code);if(found){const isKg=found.uom?.toLowerCase().includes("kg")||found.uom?.toLowerCase().includes("gm");if(isKg)openScale(found);else addToCart(found);}else alert(`Barcode "${scanInput}" not found.`);setScanInput("");};

  const numPress=(key:string)=>{
    if(key==="⌫"){setNumBuf(p=>p.slice(0,-1));return;}
    if(key==="="){if(numTarget){const v=parseFloat(numBuf);if(!isNaN(v)&&v>0)setCart(prev=>prev.map(i=>i.id===numTarget?{...i,qty:v,lineTotal:v*i.unitPrice}:i));}setNumTarget(null);setNumBuf("");return;}
    if(key==="C"){setNumBuf("");setNumTarget(null);return;}
    setNumBuf(p=>p+key);
  };

  const subTotal=cart.reduce((a,i)=>a+i.lineTotal,0);
  const discAmt=subTotal*(parseFloat(discountPct)/100||0);
  const totalItems=cart.length;
  const totalQty=cart.reduce((a,i)=>a+i.qty,0);
  const grandTotal=Math.max(0,subTotal-discAmt);

  const handleCheckout=async()=>{if(!cart.length)return;setSubmitting(true);try{const res:any=await api.post("/pos/sales",{paymentMethod:payMethod,items:cart.map(i=>({productId:i.productId,qty:i.qty,unitPrice:i.unitPrice,lineTotal:i.lineTotal})),subTotal,grandTotal,notes:salesNote||`Grocery POS · ${payMethod}`});const inv=res?.data?.data??res?.data??res??{};setCompletedInv({invoiceNo:inv.invoiceNo||`GRO-${Date.now().toString().slice(-6)}`,items:cart,grandTotal,subTotal,discAmt,date:new Date().toISOString()});clearCart();}catch{setCompletedInv({invoiceNo:`GRO-${Date.now().toString().slice(-6)}`,items:cart,grandTotal,subTotal,discAmt,date:new Date().toISOString()});clearCart();}finally{setSubmitting(false);}};

  const MAIN_CATS = ["All Items","Fruits & Veg","Grocery","Beverages","Snacks","Dairy","Household"];
  const MORE_CATS = ["Bakery","Frozen Foods","Meat & Fish","Personal Care","Baby Care","Pet Supplies"];
  const CATS = [...MAIN_CATS, ...MORE_CATS];
  const CAT_ICON_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
    "All Items":    { icon: <Grid size={15}/>,         color: "text-emerald-600" },
    "Fruits & Veg": { icon: <Apple size={15}/>,        color: "text-emerald-500" },
    "Grocery":      { icon: <ShoppingBag size={15}/>,  color: "text-orange-500" },
    "Beverages":    { icon: <Coffee size={15}/>,       color: "text-blue-500" },
    "Snacks":       { icon: <Package size={15}/>,      color: "text-amber-500" },
    "Dairy":        { icon: <Star size={15}/>,         color: "text-sky-500" },
    "Household":    { icon: <Home size={15}/>,         color: "text-indigo-500" },
    "Bakery":       { icon: <Utensils size={15}/>,     color: "text-amber-600" },
    "Frozen Foods": { icon: <Snowflake size={15}/>,    color: "text-cyan-500" },
    "Meat & Fish":  { icon: <Fish size={15}/>,         color: "text-rose-500" },
    "Personal Care":{ icon: <Sparkles size={15}/>,     color: "text-pink-500" },
    "Baby Care":    { icon: <Heart size={15}/>,        color: "text-red-400" },
    "Pet Supplies": { icon: <ShieldCheck size={15}/>, color: "text-emerald-700" },
  };
  const filteredProducts=products.filter(p=>{const matchCat=selectedCat==="All Items"||(p.category?.name||"Grocery")===selectedCat;const q=searchFilter.toLowerCase().trim();return matchCat&&(!q||p.name.toLowerCase().includes(q)||p.sku?.toLowerCase().includes(q)||p.barcode?.includes(q));});

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#f7fdf4] select-none overflow-hidden" style={{fontFamily:"'Inter','Segoe UI',sans-serif"}}>

      {/* ══ VIVID ORGANIC CURVED WAVE BACKDROP (Matching User Image Footer) ══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Upper Soft Mint Wave — Rises under Status Bar */}
        <svg className="absolute bottom-0 left-0 w-[70%] h-[280px] opacity-95" viewBox="0 0 1000 280" fill="none" preserveAspectRatio="none">
          <path d="M 0 110 C 180 200, 380 20, 680 160 C 830 220, 940 70, 1000 110 L 1000 280 L 0 280 Z" fill="url(#mint-wave-top)" />
          <defs>
            <linearGradient id="mint-wave-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eefce3" stopOpacity="0.95"/>
              <stop offset="45%" stopColor="#dcfce7" stopOpacity="0.7"/>
              <stop offset="85%" stopColor="#f7fdf4" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Main Vivid Lime-Green Front Wave — Matches Image 2 bottom-left wave! */}
        <svg className="absolute bottom-0 left-0 w-[62%] h-[210px] opacity-100" viewBox="0 0 1000 210" fill="none" preserveAspectRatio="none">
          <path d="M 0 45 C 160 165, 360 15, 630 140 C 790 195, 910 85, 1000 125 L 1000 210 L 0 210 Z" fill="url(#lime-wave-vivid)" />
          <defs>
            <linearGradient id="lime-wave-vivid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d9f99d" stopOpacity="1"/>
              <stop offset="30%" stopColor="#bef264" stopOpacity="0.9"/>
              <stop offset="65%" stopColor="#dcfce7" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#f7fdf4" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Left Deep Yellow-Green Glow Wave */}
        <svg className="absolute -bottom-2 -left-4 w-[48%] h-[150px] opacity-95" viewBox="0 0 800 150" fill="none" preserveAspectRatio="none">
          <path d="M 0 25 C 130 125, 290 5, 520 105 C 670 155, 760 65, 800 95 L 800 150 L 0 150 Z" fill="url(#lime-wave-glow)" />
          <defs>
            <linearGradient id="lime-wave-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.95"/>
              <stop offset="40%" stopColor="#d9f99d" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#f7fdf4" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ══ HEADER — Exact Gradient from Image 1 ══ */}
      <header className="relative z-10 flex-none flex items-center justify-between gap-4 px-6 py-3 border-b border-green-200/50 shadow-sm"
        style={{background:"linear-gradient(90deg,#d9f99d 0%,#e2f9cc 25%,#eefce3 65%,#f7fdf4 100%)",minHeight:64}}>
        <div className="flex items-center gap-3">
          <Link href="/grocery" className="flex items-center text-green-800 hover:text-green-950 transition mr-1"><ChevronLeft size={18}/></Link>
          <div className="flex items-center gap-2.5">
            <div className="relative text-green-600"><ShoppingCart size={30} strokeWidth={2.2}/><div className="absolute -top-1 -right-1 text-green-700 font-bold text-xs">🌿</div></div>
            <div className="leading-tight">
              <h1 className="text-xl font-extrabold text-[#0f291e] tracking-tight">FreshMart</h1>
              <p className="text-[10px] font-bold tracking-wider text-[#475569] uppercase">POS SYSTEM</p>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-xl">
          <div className="flex items-center bg-white rounded-full border border-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] px-4 py-2">
            <Search size={18} className="text-[#84cc16] shrink-0 mr-3"/>
            <input ref={scanRef} type="text" value={scanInput} onChange={e=>{setScanInput(e.target.value);setSearchFilter(e.target.value);}} onKeyDown={handleScanKey}
              placeholder="Search product by name, barcode or scan..."
              className="w-full bg-transparent text-sm font-semibold text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"/>
            <ScanLine size={18} className="text-[#16a34a] shrink-0 ml-2"/>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {[
            {icon:<Users size={15} strokeWidth={2.5}/>,bg:"bg-green-50 text-green-600",label:"Walk-in Customer",sub:"Default Customer"},
            {icon:<span className="text-xs font-bold">★</span>,bg:"bg-green-600 text-white shadow-xs animate-pulse",label:"Loyalty Points",sub:"120 Pts"},
            {icon:<FileText size={15} strokeWidth={2.2}/>,bg:"bg-green-50 text-green-600",label:"Invoice",sub:"INV-250520-0012"},
            {icon:<Clock size={15} strokeWidth={2.2}/>,bg:"bg-green-50 text-green-600 relative",label:now.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),sub:now.toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})},
          ].map((c,i)=>(
            <div key={i} className="flex items-center gap-2.5 bg-white rounded-2xl px-3.5 py-2 border border-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${c.bg}`}>{c.icon}</div>
              <div className="leading-tight">
                <p className="text-xs font-extrabold text-[#1e293b] whitespace-nowrap">{c.label}</p>
                <p className="text-[10px] font-semibold text-[#64748b]">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="relative z-10 flex-1 min-h-0 flex overflow-hidden">

        {/* ════ LEFT — Product Grid ════ */}
        <div className="flex flex-col w-[65%] min-w-0 overflow-hidden border-r border-gray-200 shrink-0">

          {/* Category tabs */}
          <div className="flex-none bg-white/90 backdrop-blur-md border-b border-emerald-100/60 px-3 py-2.5">
            <div className="grid grid-cols-8 gap-1.5 w-full">
              {MAIN_CATS.map(cat => {
                const on = selectedCat === cat;
                const item = CAT_ICON_MAP[cat] || { icon: <Package size={15}/>, color: "text-emerald-600" };
                return (
                  <button key={cat} onClick={() => { setSelectedCat(cat); setMoreOpen(false); }}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-2xl text-xs font-black transition-all duration-200 transform truncate ${
                      on 
                        ? "bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#65a30d] text-white shadow-md shadow-emerald-600/30 scale-[1.03] active:scale-95" 
                        : "bg-white border border-gray-200/80 text-gray-800 hover:bg-emerald-50/60 hover:border-emerald-300 hover:-translate-y-0.5 shadow-2xs active:scale-95"
                    }`}>
                    <span className={on ? "text-white shrink-0" : `${item.color} shrink-0`}>{item.icon}</span>
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}

              {/* More Categories Button */}
              <button onClick={() => setMoreOpen(p => !p)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-2xl text-xs font-black transition-all duration-200 transform truncate ${
                  MORE_CATS.includes(selectedCat) || moreOpen
                    ? "bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#65a30d] text-white shadow-md shadow-emerald-600/30 scale-[1.03]"
                    : "bg-white border border-gray-200/80 text-gray-800 hover:bg-emerald-50/60 hover:border-emerald-300 hover:-translate-y-0.5 shadow-2xs active:scale-95"
                }`}>
                <span className="truncate">••• More {MORE_CATS.includes(selectedCat) ? `(${selectedCat})` : ""}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}/>
              </button>
            </div>
          </div>

          {/* Inline Expanded Category Drawer */}
          {moreOpen && (
            <div className="flex-none bg-emerald-50/80 backdrop-blur-sm border-b border-emerald-200/60 px-4 py-2.5 flex items-center gap-2 flex-wrap shadow-inner animate-in fade-in slide-in-from-top-1">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mr-1">
                More Categories:
              </span>
              {MORE_CATS.map(cat => {
                const on = selectedCat === cat;
                const count = products.filter(p => p.category?.name === cat).length;
                const item = CAT_ICON_MAP[cat] || { icon: <Package size={14}/>, color: "text-emerald-600" };
                return (
                  <button key={cat} onClick={() => { setSelectedCat(cat); setMoreOpen(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all transform hover:scale-105 active:scale-95 ${
                      on 
                        ? "bg-emerald-600 text-white shadow-sm" 
                        : "bg-white border border-emerald-200/70 text-emerald-900 hover:bg-emerald-100/70"
                    }`}>
                    <span className={on ? "text-white" : item.color}>{item.icon}</span>
                    <span>{cat}</span>
                    <span className={`text-[10px] font-mono rounded px-1 py-0.5 ${on ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex-none bg-white border-b border-gray-100 px-4 py-3">
            <p className="text-xs font-black text-gray-800 mb-2">Quick Actions</p>
            <div className="flex items-center gap-2.5">
              {[
                { label: "Price Check", key: "F3", icon: <Search size={15}/>, bg: "bg-emerald-50 text-emerald-600" },
                { label: "Recent Items", key: "F4", icon: <Clock size={15}/>, bg: "bg-amber-50 text-amber-600" },
                { label: "Stock Check", key: "F5", icon: <Package size={15}/>, bg: "bg-emerald-50 text-emerald-600" },
                { label: "Offers", key: "F6", icon: <Tag size={15}/>, bg: "bg-rose-50 text-rose-500" },
                { label: "Hold Bill", key: "F7", icon: <PauseCircle size={15}/>, bg: "bg-emerald-50 text-emerald-600", onClick: holdCart },
              ].map(a => (
                <button key={a.label} onClick={a.onClick}
                  className="flex-1 bg-white rounded-2xl border border-gray-200/80 p-2 flex items-center gap-2.5 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-left">
                  <div className={`w-8 h-8 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}>
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 leading-tight">{a.label}</p>
                    <p className="text-[10px] font-semibold text-gray-400 font-mono leading-none mt-0.5">{a.key}</p>
                  </div>
                </button>
              ))}
              <button className="p-2.5 rounded-2xl border border-gray-200/80 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 hover:scale-105 active:scale-95 shadow-2xs shrink-0 transition-all">
                <Settings size={16}/>
              </button>
            </div>
          </div>

          {/* Sub-header */}
          <div className="flex-none px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900">All Products</h2>
            <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>

          {/* Product grid - 6 Columns (3D Tilt & Pop Micro-Animations) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-transparent">
            <div className="grid grid-cols-6 gap-3">
              {filteredProducts.map(p => {
                const isKg = p.uom?.toLowerCase().includes("kg") || p.uom?.toLowerCase().includes("gm");
                const emoji = getEmoji(p.name); const bg = getEmojiColor(emoji);
                return (
                  <button key={p.id} onClick={() => isKg ? openScale(p) : addToCart(p)}
                    className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(22,163,74,0.18)] hover:border-emerald-400 hover:-translate-y-1.5 active:scale-95 transition-all duration-300 overflow-hidden p-2.5 text-left group transform">
                    <div className="w-full flex items-center justify-center py-3 rounded-xl bg-gray-50/70 text-[48px] leading-none mb-2 select-none group-hover:scale-120 group-hover:rotate-6 transition-transform duration-300 shadow-2xs" style={{ background: bg }}>
                      {emoji}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-black text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{p.name}</p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{p.uom || "1kg"}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-1">
                        <span className="text-xs font-black text-emerald-700">৳ {Number(p.sellingPrice).toFixed(2)}</span>
                        <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center group-hover:scale-115 group-hover:rotate-90 group-hover:bg-emerald-500 transition-all duration-300 shadow-md">
                          <Plus size={14} strokeWidth={2.5}/>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-6 py-12 text-center">
                  <Package size={36} className="mx-auto mb-2 opacity-40 text-gray-300"/>
                  <p className="text-sm font-semibold text-gray-400">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Status & Action Bars Container — Transparent so SVG wave pops through */}
          <div className="flex-none bg-transparent p-3 flex flex-col gap-2.5 relative z-10">
            
            {/* Status Summary Bar */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 py-2.5 flex items-center justify-between divide-x divide-emerald-50">
              {[
                { icon: <ShoppingBag size={17}/>, label: "Total Items", val: totalItems, bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
                { icon: <Package size={17}/>, label: "Total Qty", val: Math.round(totalQty*100)/100, bg: "bg-[#eff6ff] text-[#3b82f6] border border-[#bfdbfe]/60" },
                { icon: <FileText size={17}/>, label: "Subtotal", val: fmt(subTotal), bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
                { icon: <Tag size={17}/>, label: "Discount", val: fmt(discAmt), bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
                { icon: <Gift size={17}/>, label: "Total Savings", val: fmt(discAmt), bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
              ].map((s, idx) => (
                <div key={s.label} className={`flex items-center gap-3 ${idx === 0 ? "" : "pl-4"} ${idx === 4 ? "" : "pr-4"} flex-1`}>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0 shadow-2xs`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider leading-tight">{s.label}</p>
                    <p className="text-sm font-black text-gray-900 leading-snug mt-0.5">{s.val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Action Bar */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 py-2.5 flex items-center justify-between divide-x divide-emerald-50">
              {[
                { label: "Sales History", key: "F8", icon: <History size={17}/>, bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
                { label: "Open Drawer", key: "F9", icon: <Printer size={17}/>, bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
                { label: "Add Customer", key: "F10", icon: <Users size={17}/>, bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60" },
                { label: "Clear Cart", key: "F11", icon: <Trash2 size={17}/>, bg: "bg-[#fef2f2] text-[#ef4444] border border-[#fecaca]/60", onClick: clearCart },
                { label: "Save & Print", key: "F12", icon: <Printer size={17}/>, bg: "bg-[#ecfdf5] text-[#10b981] border border-[#a7f3d0]/60", onClick: () => window.print() },
              ].map((a, idx) => (
                <button key={a.label} onClick={a.onClick}
                  className={`flex items-center gap-3 ${idx === 0 ? "" : "pl-4"} ${idx === 4 ? "" : "pr-4"} flex-1 text-left hover:opacity-80 transition`}>
                  <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center shrink-0 shadow-2xs`}>
                    {a.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">{a.label}</p>
                    <p className="text-[11px] font-semibold text-gray-400 font-mono leading-none mt-0.5">{a.key}</p>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ════ RIGHT — Cart / Summary / Payment ════ */}
        <div className="flex flex-col gap-2 p-2 bg-transparent border-l border-emerald-100/50 overflow-hidden shrink-0 w-[35%] relative z-10" style={{width:"35%"}}>

          {/* ── 1. CART CARD — flex-1 so it fills remaining space ── */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col flex-1 min-h-0">

            {/* Cart header */}
            <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Cart</h2>
                <span className="text-[#16a34a] font-extrabold text-sm">({totalItems} Items)</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={holdCart} disabled={!cart.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-300 bg-[#f0fdf4] text-xs font-bold text-[#15803d] hover:bg-green-100 transition disabled:opacity-40">
                  <span className="font-mono font-bold">|--|</span> Hold (F7)
                </button>
                <button onClick={clearCart} disabled={!cart.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-[#fef2f2] text-xs font-bold text-[#ef4444] hover:bg-red-100 transition disabled:opacity-40">
                  <Trash2 size={12}/> Clear Cart
                </button>
              </div>
            </div>

            {/* Table header */}
            <div className="shrink-0 grid px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#94a3b8] border-b border-gray-100"
              style={{gridTemplateColumns:"1.8fr 1fr 0.9fr 0.9fr 0.9fr 26px"}}>
              <span>ITEM</span><span className="text-center">QTY</span><span className="text-right">PRICE</span>
              <span className="text-center">DISCOUNT</span><span className="text-right">TOTAL</span><span/>
            </div>

            {/* Cart rows — flex-1 min-h-0 overflow-y-auto: scrolls internally */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-gray-50">
              {cart.length===0?(
                <div className="py-8 text-center">
                  <ShoppingCart size={32} className="mx-auto text-gray-200 mb-2"/>
                  <p className="text-xs text-gray-400 font-bold">Cart is empty</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">Scan or click products to add</p>
                </div>
              ):cart.map(item=>{
                const emoji=getEmoji(item.name);const bg=getEmojiColor(emoji);
                const lineFinal=item.discountPct?item.lineTotal*(1-item.discountPct/100):item.lineTotal;
                return (
                  <div key={item.id} onClick={()=>setNumTarget(item.id)}
                    className={`grid items-center px-3 py-2.5 hover:bg-green-50/30 cursor-pointer transition ${numTarget===item.id?"bg-green-50/60":""}`}
                    style={{gridTemplateColumns:"1.8fr 1fr 0.9fr 0.9fr 0.9fr 26px"}}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base leading-none" style={{background:bg}}>{emoji}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#0f172a] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#64748b]">৳ {item.unitPrice.toFixed(2)} / {item.uom||"pcs"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl px-1.5 py-0.5">
                        <button onClick={e=>{e.stopPropagation();updateQty(item.id,item.isWeighed?-0.1:-1);}} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-900 font-bold text-xs">−</button>
                        <span className="w-6 text-center font-extrabold text-xs text-[#0f172a]">{item.isWeighed?item.qty.toFixed(1):item.qty}</span>
                        <button onClick={e=>{e.stopPropagation();updateQty(item.id,item.isWeighed?0.1:1);}} className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-900 font-bold text-xs">+</button>
                      </div>
                    </div>
                    <div className="text-right text-xs font-extrabold text-[#0f172a]">৳ {item.unitPrice.toFixed(2)}</div>
                    <div className="text-center">
                      {item.discountPct
                        ?<span className="bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block">{item.discountPct}%</span>
                        :<span className="text-[#94a3b8]">-</span>}
                    </div>
                    <div className="text-right text-xs font-black text-[#0f172a]">৳ {lineFinal.toFixed(2)}</div>
                    <div className="text-right">
                      <button onClick={e=>{e.stopPropagation();removeItem(item.id);}}
                        className="w-6 h-6 rounded-full bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition border border-gray-100">
                        <X size={12}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cart footer */}
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5">
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-[#0f172a] hover:bg-gray-50 transition">
                  <Plus size={12} className="text-[#16a34a]"/> Add Note
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-[#15803d] hover:bg-gray-50 transition">
                  <Tag size={12} className="text-[#16a34a]"/> Add Discount
                </button>
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-extrabold text-[#ef4444] hover:bg-gray-50 transition">
                  <Gift size={12} className="text-[#ef4444]"/> Add Coupon
                </button>
              </div>
              <div className="text-xs font-extrabold text-[#0f172a]">
                Items: <b>{totalItems}</b> <span className="ml-3">Qty: <b>{Math.round(totalQty*100)/100}</b></span>
              </div>
            </div>
          </div>

          {/* ── 2. MIDDLE — Discount+Note | Financial Summary ── shrink-0 */}
          <div className="shrink-0 grid grid-cols-2 gap-2">

            {/* Discount / Coupon / Note */}
            <div className="bg-[#f2faf4] rounded-2xl p-3 border border-[#e2f5e7] flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#1e293b] w-20 shrink-0">Discount</span>
                <div className="flex-1 bg-white rounded-xl border border-gray-200/60 px-2.5 py-1.5 flex items-center shadow-sm">
                  <input type="number" value={discountPct} onChange={e=>setDiscountPct(e.target.value)}
                    className="w-full bg-transparent text-sm font-extrabold text-[#1e293b] text-right focus:outline-none pr-1"/>
                  <span className="text-xs font-bold text-[#94a3b8]">%</span>
                </div>
                <button className="rounded-xl text-xs font-black text-white px-3 py-2 shadow-sm transition hover:brightness-105"
                  style={{background:"linear-gradient(180deg,#34d399 0%,#16a34a 100%)"}}>Apply</button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#1e293b] w-20 shrink-0">Coupon</span>
                <div className="flex-1 bg-white rounded-xl border border-gray-200/60 px-2.5 py-1.5 flex items-center shadow-sm">
                  <input type="text" value={couponCode} onChange={e=>setCouponCode(e.target.value)} placeholder="Enter coupon code"
                    className="w-full bg-transparent text-xs font-semibold text-[#1e293b] placeholder:text-[#a1a1aa] focus:outline-none"/>
                </div>
                <button className="rounded-xl text-xs font-black text-white px-3 py-2 shadow-sm transition hover:brightness-105"
                  style={{background:"linear-gradient(180deg,#34d399 0%,#16a34a 100%)"}}>Apply</button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#1e293b] w-20 shrink-0">Note</span>
                <div className="flex-1 bg-white rounded-xl border border-gray-200/60 pl-2.5 pr-1 py-1 flex items-center shadow-sm">
                  <input type="text" value={salesNote} onChange={e=>setSalesNote(e.target.value)} placeholder="Add a note (optional)..."
                    className="w-full bg-transparent text-xs font-semibold text-[#1e293b] placeholder:text-[#a1a1aa] focus:outline-none"/>
                  <div className="w-6 h-6 rounded-lg bg-white border border-gray-200/70 flex items-center justify-center text-[#16a34a] shrink-0 ml-1">
                    <AlignLeft size={12}/>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-[#64748b] font-bold">
                  <span>Subtotal</span><span className="text-[#0f172a] font-extrabold">৳ {subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[#64748b] font-bold">
                  <span>Discount</span><span className="text-[#16a34a] font-extrabold">- ৳ {discAmt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[#64748b] font-bold">
                  <span>VAT (0%)</span><span className="text-[#0f172a] font-extrabold">৳ 0.00</span>
                </div>
                <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-baseline">
                  <span className="text-lg font-black text-[#0f172a]">Total</span>
                  <span className="text-2xl font-black text-[#16a34a]">৳ {grandTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-2 bg-[#f0fdf4] border border-[#bbf7d0]/70 text-[#16a34a] text-center py-1.5 px-3 rounded-xl font-black text-xs">
                You Save ৳ {discAmt.toFixed(2)}
              </div>
            </div>
          </div>

          {/* ── 3. BOTTOM — Numpad | Payment + Pay CTA ── shrink-0 */}
          <div className="shrink-0 bg-white rounded-2xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden" style={{height:210}}>
            <div className="grid grid-cols-12 divide-x divide-gray-100 h-full">

              {/* LEFT: Function Keys + Numpad (5 columns) */}
              <div className="col-span-5 flex gap-1.5 p-2 overflow-hidden">
                <div className="flex flex-col gap-1 shrink-0 w-[100px]">
                  {FN_KEYS.map(({label,key,Icon})=>(
                    <button key={key} className="flex items-center gap-1.5 px-2 rounded-xl bg-[#f0fdf4] border border-[#dcfce7] hover:bg-emerald-100/80 hover:-translate-y-0.5 active:scale-95 transition-all duration-150 flex-1 overflow-hidden text-left shadow-2xs">
                      <Icon size={13} className="text-[#10b981] shrink-0"/>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-[#15803d] truncate leading-tight">{label}</p>
                        <p className="text-[8px] font-bold text-gray-400 font-mono leading-none">{key}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-1 min-w-0">
                  {NUM_KEYS.map(k=>(
                    <button key={k} onClick={()=>numPress(k)}
                      className={`rounded-xl font-black text-sm flex items-center justify-center transition-all duration-150 transform hover:-translate-y-0.5 active:scale-90 ${
                        k==="="?"bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white shadow-md shadow-green-600/30 hover:brightness-110 active:bg-green-700"
                        :k==="⌫"?"bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 hover:text-red-500"
                        :"bg-white border border-gray-200/80 text-gray-800 hover:bg-gray-50 hover:border-emerald-300 shadow-2xs"}`}>
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT: Payment Pills (Vertical Column) + Pay CTA & Save & Print (7 columns) */}
              <div className="col-span-7 flex gap-2.5 p-2.5 overflow-hidden h-full">
                
                {/* 1. Left: 5 Vertical Payment Method Pills */}
                <div className="flex flex-col gap-1.5 shrink-0 w-[115px] h-full">
                  {PAY_CFG.map(pm => {
                    const on = payMethod === pm.id;
                    return (
                      <button key={pm.id} onClick={() => setPayMethod(pm.id as any)}
                        className={`flex-1 flex items-center gap-2 px-2.5 rounded-xl border text-xs font-bold transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 text-left min-w-0 ${pm.bg} ${pm.text} ${
                          on 
                            ? `${pm.activeBorder} ${pm.activeRing} font-black shadow-xs scale-[1.02]` 
                            : `${pm.border} opacity-85 hover:opacity-100`
                        }`}>
                        <pm.Icon size={15} className="shrink-0"/>
                        <span className="truncate leading-none">{pm.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Right: Hero Pay CTA Box (Top) + Save & Print Bill (Bottom) */}
                <div className="flex-1 flex flex-col gap-2 min-w-0 h-full">
                  
                  {/* Top: Hero Pay CTA Card */}
                  <button onClick={handleCheckout} disabled={!cart.length || submitting}
                    className="flex-1 w-full rounded-2xl text-white flex items-center justify-between px-3.5 sm:px-4 py-2.5 shadow-[0_8px_20px_rgba(22,163,74,0.35)] hover:shadow-[0_12px_28px_rgba(22,163,74,0.5)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-40 bg-gradient-to-r from-[#16a34a] via-[#22c55e] to-[#84cc16] border border-emerald-400/40 relative overflow-hidden group min-w-0">
                    <div className="text-left flex flex-col justify-center relative z-10 min-w-0 flex-1 mr-1.5">
                      <p className="text-xs sm:text-sm font-extrabold text-white/95 leading-none tracking-wide">Pay</p>
                      {(() => {
                        const str = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const len = str.length;
                        const sizeClass = len > 13 ? 'text-base sm:text-lg' : len > 10 ? 'text-lg sm:text-xl' : len > 7 ? 'text-xl sm:text-[24px]' : 'text-[24px] sm:text-[27px]';
                        return (
                          <p className={`${sizeClass} font-black text-white leading-tight tracking-tight mt-0.5 whitespace-nowrap`}>
                            ৳ {str}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/25 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 group-hover:bg-white/35 transition-all duration-300">
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                      ) : (
                        <ArrowRight size={21} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform"/>
                      )}
                    </div>
                  </button>

                  {/* Bottom: Save & Print Bill */}
                  <button onClick={() => window.print()} disabled={!cart.length}
                    className="w-full py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all duration-150 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 bg-[#f0fdf4] hover:bg-emerald-100/80 border-[#dcfce7] text-[#15803d] shadow-2xs shrink-0">
                    <Printer size={15} className="shrink-0"/>
                    <span className="truncate">Save &amp; Print Bill</span>
                  </button>

                </div>

              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ══ SCALE MODAL ══ */}
      {scaleOpen&&scaleProd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-5 py-4 text-white" style={{background:"linear-gradient(135deg,#16a34a,#15803d)"}}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-3xl">{getEmoji(scaleProd.name)}</div>
                <div><h3 className="font-black text-base">{scaleProd.name}</h3><p className="text-xs opacity-80">Rate: {fmt(scaleProd.sellingPrice)} / kg</p></div>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Gross Weight (KG)</label>
                <input type="number" step="0.005" min="0.005" value={grossKg} onChange={e=>setGrossKg(e.target.value)} autoFocus
                  className="w-full rounded-xl border-2 py-3 px-4 text-2xl font-black font-mono text-center focus:outline-none"
                  style={{borderColor:"#16a34a",color:"#15803d",background:"#f0fdf4"}}/>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {["0.250","0.500","1.000","2.000"].map(w=>(
                  <button key={w} onClick={()=>setGrossKg(w)} className="py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition">{w}</button>
                ))}
              </div>
              <div className="rounded-xl p-3 flex justify-between items-center border" style={{background:"#f0fdf4",borderColor:"#bbf7d0"}}>
                <span className="text-sm text-gray-600">Calculated Price:</span>
                <span className="text-xl font-black" style={{color:"#15803d"}}>{fmt((parseFloat(grossKg)||0)*scaleProd.sellingPrice)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={confirmScale} className="flex-1 py-2.5 rounded-xl text-white text-sm font-black transition" style={{background:"#16a34a"}}>+ Add to Cart</button>
                <button onClick={()=>setScaleOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ RECEIPT MODAL ══ */}
      {completedInv&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-5 py-5 text-white text-center" style={{background:"linear-gradient(135deg,#16a34a,#15803d)"}}>
              <CheckCircle2 size={40} className="mx-auto mb-2"/>
              <h3 className="text-base font-black">Payment Successful!</h3>
              <p className="text-xs opacity-80 font-mono mt-1">{completedInv.invoiceNo}</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {(completedInv.items||[]).map((item:any,i:number)=>(
                  <div key={i} className="flex justify-between text-xs border-b border-gray-50 pb-1">
                    <div><p className="font-bold text-gray-800">{item.name}</p><p className="text-gray-400">{item.qty} × ৳{item.unitPrice?.toFixed(2)}</p></div>
                    <p className="font-black text-gray-800">৳{item.lineTotal?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(completedInv.subTotal)}</span></div>
                {completedInv.discAmt>0&&<div className="flex justify-between text-green-600"><span>Discount</span><span>− {fmt(completedInv.discAmt)}</span></div>}
                <div className="flex justify-between font-black text-base pt-1 border-t border-gray-200" style={{color:"#15803d"}}>
                  <span>Total Paid</span><span>{fmt(completedInv.grandTotal)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>window.print()} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  <Printer size={13}/> Print
                </button>
                <button onClick={()=>setCompletedInv(null)} className="flex-1 py-2.5 rounded-xl text-white text-xs font-black" style={{background:"#16a34a"}}>
                  New Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
