export type SectionType =
  | "hero_slider"
  | "feature_badges"
  | "category_showcase"
  | "flash_sale"
  | "featured_collections"
  | "product_grid"
  | "promo_split_banner"
  | "promotions_section"
  | "brands_carousel"
  | "curated_recommendations"
  | "blog_stories"
  | "testimonials"
  | "faq_section"
  | "special_notice"
  | "app_download"
  | "pharmacy_upload"
  | "restaurant_menu"
  | "rich_text"
  | "newsletter";

export interface SectionItem {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  badge?: string;
  enabled: boolean;
  settings: Record<string, any>;
}

export type BusinessPresetId =
  | "shopease-vibrant"
  | "shopease-sidebar-grocery"
  | "shopease-dark-luxury"
  | "shopease-electronics"
  | "shopease-fashion"
  | "shopease-pharmacy"
  | "shopease-restaurant"
  | "shopease-beauty";

export interface ThemeConfig {
  themePreset: BusinessPresetId;
  headerStyle: "standard" | "sidebar_integrated" | "dark_luxury" | "minimal" | "centered_logo";
  headerLogoType?: "text" | "image";
  headerLogo?: string;
  headerLogoText?: string;
  headerLogoTagline?: string;
  headerBannerImage?: string;
  primaryColor: string;
  accentColor: string;
  isDarkMode: boolean;
  fontFamily: string;
  announcementText?: string;
  showAnnouncement?: boolean;
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementLink?: string;
  sections: SectionItem[];
}

// ── 1. VIBRANT MEGA STORE (GENERAL E-COMMERCE) ──
export const DEFAULT_VIBRANT_THEME: ThemeConfig = {
  themePreset: "shopease-vibrant",
  headerStyle: "standard",
  primaryColor: "#2563eb",
  accentColor: "#f59e0b",
  isDarkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "🎉 Super Spring Sale! Free Shipping on orders over $50 / ৳500 with code FREESHIP",
  sections: [
    {
      id: "sec-notice-1",
      type: "special_notice",
      title: "⚡ Weekend Mega Flash Sale: Up to 60% OFF Across All Trending Collections!",
      subtitle: "Use voucher code SHOP2026 for instant checkout discounts.",
      badge: "HOT OFFER",
      enabled: true,
      settings: { ctaText: "Shop Deals", ctaLink: "/products", themeStyle: "gradient" },
    },
    {
      id: "sec-hero-1",
      type: "hero_slider",
      title: "Upgrade Your Everyday Style",
      subtitle: "Discover premium fashion, latest tech trends and exclusive deals — all in one place.",
      badge: "NEW ARRIVAL",
      enabled: true,
      settings: {
        ctaText: "Shop Now",
        ctaLink: "/products",
        sideDealTitle: "Flash Deal",
        sideDealBadge: "Up to 70% OFF",
        sideDealSubtitle: "Limited Time Only",
        sideDealHours: 12,
        sideDealImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-blue-50 via-indigo-50/50 to-white",
      },
    },
    {
      id: "sec-badges-1",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "Truck", title: "Free Shipping", desc: "On orders over $50 / ৳500" },
          { icon: "ShieldCheck", title: "Secure Payment", desc: "100% secure checkout" },
          { icon: "RotateCcw", title: "Easy Returns", desc: "Within 7 days return policy" },
          { icon: "Headphones", title: "24/7 Support", desc: "Dedicated support team" },
        ],
      },
    },
    {
      id: "sec-cats-1",
      type: "category_showcase",
      title: "Shop by Category",
      subtitle: "Explore our wide range of popular collections",
      badge: "COLLECTIONS",
      enabled: true,
      settings: { style: "circles", limit: 8 },
    },
    {
      id: "sec-flash-1",
      type: "flash_sale",
      title: "Flash Sale",
      subtitle: "Top deals. Limited time, don't miss out!",
      badge: "FLASH DEAL",
      enabled: true,
      settings: { hoursLeft: 8, discountText: "UP TO 70% OFF", limit: 6 },
    },
    {
      id: "sec-bento-1",
      type: "featured_collections",
      title: "Featured Collections",
      subtitle: "Handpicked for your modern lifestyle",
      badge: "TRENDING",
      enabled: true,
      settings: {
        layout: "bento_3",
        cards: [
          {
            title: "Men's Fashion",
            subtitle: "Modern Looks for Modern Men",
            cta: "Shop Now",
            link: "/products?category=Fashion",
            image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600&auto=format&fit=crop&q=80",
            bg: "from-slate-900 to-slate-800 text-white",
          },
          {
            title: "Electronics",
            subtitle: "Latest Tech for a Smarter Life",
            cta: "Shop Now",
            link: "/products?category=Electronics",
            image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&auto=format&fit=crop&q=80",
            bg: "from-blue-900 to-indigo-900 text-white",
          },
          {
            title: "Home & Living",
            subtitle: "Stylish Homes, Happier You",
            cta: "Shop Now",
            link: "/products?category=Home",
            image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
            bg: "from-amber-900/90 to-stone-900 text-white",
          },
        ],
      },
    },
    {
      id: "sec-products-1",
      type: "product_grid",
      title: "Best Selling Products",
      subtitle: "Loved by thousands. Shop what's trending now!",
      badge: "POPULAR",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-brands-1",
      type: "brands_carousel",
      title: "Shop by Top Brands",
      subtitle: "Your favorite brands, all in one place",
      enabled: true,
      settings: {
        brands: [
          { name: "Apple", logo: "" },
          { name: "Samsung", logo: "SAMSUNG" },
          { name: "Nike", logo: "NIKE" },
          { name: "Adidas", logo: "adidas" },
          { name: "L'Oreal", logo: "L'ORÉAL" },
          { name: "P&G", logo: "P&G" },
          { name: "Coca-Cola", logo: "Coca-Cola" },
          { name: "Sony", logo: "SONY" },
        ],
      },
    },
    {
      id: "sec-test-1",
      type: "testimonials",
      title: "Loved by Over 50,000+ Happy Customers",
      subtitle: "Real reviews from real shoppers who love our fast service and authentic items",
      badge: "VERIFIED REVIEWS",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-app-1",
      type: "app_download",
      title: "Shop On the Go with ShopEase Mobile App",
      subtitle: "Get exclusive mobile discounts, track live deliveries and enjoy instant reorders.",
      badge: "DOWNLOAD APP",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-faq-1",
      type: "faq_section",
      title: "Frequently Asked Questions",
      subtitle: "Quick answers about delivery, payment methods, warranty and refunds",
      badge: "HELP & SUPPORT",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-1",
      type: "newsletter",
      title: "Subscribe to Our Newsletter",
      subtitle: "Get the latest updates, promotions and exclusive vouchers delivered right to your inbox.",
      enabled: true,
      settings: { buttonText: "Subscribe" },
    },
  ],
};

// ── 2. SIDEBAR GROCERY & SUPERMARKET THEME ──
export const DEFAULT_SIDEBAR_THEME: ThemeConfig = {
  themePreset: "shopease-sidebar-grocery",
  headerStyle: "sidebar_integrated",
  primaryColor: "#059669",
  accentColor: "#f59e0b",
  isDarkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "🥬 100% Farm Fresh Groceries Delivered in 2 Hours! Free Delivery over ৳500",
  sections: [
    {
      id: "sec-hero-sidebar",
      type: "hero_slider",
      title: "Daily Fresh Essentials Delivered in 2 Hours",
      subtitle: "Shop farm fresh vegetables, fruits, dairy, rice, spices and household staples directly from verified distributors.",
      badge: "FARM FRESH",
      enabled: true,
      settings: {
        ctaText: "Shop Groceries",
        ctaLink: "/products",
        sideDealTitle: "Fresh Groceries",
        sideDealBadge: "Farm Fresh Best Quality",
        sideDealSubtitle: "Fast Delivery",
        sideDealImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-emerald-50 via-teal-50/50 to-white",
      },
    },
    {
      id: "sec-badges-sidebar",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "Truck", title: "2-Hour Express Delivery", desc: "Straight to your doorstep" },
          { icon: "ShieldCheck", title: "100% Organic & Fresh", desc: "Daily quality checked" },
          { icon: "RotateCcw", title: "Instant Doorstep Return", desc: "Check before you pay" },
          { icon: "Headphones", title: "Direct Helpline", desc: "Friendly customer support" },
        ],
      },
    },
    {
      id: "sec-cats-sidebar",
      type: "category_showcase",
      title: "Browse Fresh Departments",
      subtitle: "From fresh produce to household pantry staples",
      badge: "CATEGORIES",
      enabled: true,
      settings: { style: "cards", limit: 8 },
    },
    {
      id: "sec-products-sidebar",
      type: "product_grid",
      title: "Top Daily Essentials & Staples",
      subtitle: "High demand grocery items in stock and ready to ship",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-split-sidebar",
      type: "promo_split_banner",
      title: "Save Big on Monthly Family Grocery Bundles",
      subtitle: "Get guaranteed wholesale prices on rice, cooking oil, flour, and daily hygiene packs.",
      badge: "MONTHLY SAVINGS",
      enabled: true,
      settings: {
        ctaText: "Shop Bundles",
        ctaLink: "/products",
        sideCardTitle: "Up to 35% OFF",
        sideCardSubtitle: "Exclusive Bulk Savings",
        bgGradient: "from-emerald-900 via-teal-900 to-slate-900",
        image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "sec-test-grocery",
      type: "testimonials",
      title: "Why Families Love Our Grocery Delivery",
      subtitle: "Read feedback from thousands of home chefs and busy households",
      badge: "HAPPY FAMILIES",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-sidebar",
      type: "newsletter",
      title: "Get Weekly Grocery Deals & Discount Coupons",
      subtitle: "Subscribe to receive weekly fresh catch and fruit deals in your inbox.",
      enabled: true,
      settings: { buttonText: "Get Discounts" },
    },
  ],
};

// ── 3. DARK LUXURY & PREMIUM FASHION THEME ──
export const DEFAULT_DARK_LUXURY_THEME: ThemeConfig = {
  themePreset: "shopease-dark-luxury",
  headerStyle: "dark_luxury",
  primaryColor: "#d97706",
  accentColor: "#fbbf24",
  isDarkMode: true,
  fontFamily: "Outfit, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "✨ Private VIP Drop Now Live — Complimentary White Glove Courier on All Luxury Orders",
  sections: [
    {
      id: "sec-hero-dark",
      type: "hero_slider",
      title: "Style Meets Lifestyle",
      subtitle: "Upgrade your everyday with premium fashion, cutting-edge electronics, and luxury lifestyle essentials.",
      badge: "THE ALL NEW SEASON",
      enabled: true,
      settings: {
        ctaText: "Explore Collection",
        ctaLink: "/products",
        sideDealTitle: "Premium Fashion",
        sideDealBadge: "Lookbook 2026",
        sideDealSubtitle: "Timeless pieces for modern you",
        sideDealImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-slate-950 via-zinc-900 to-neutral-950 text-white",
      },
    },
    {
      id: "sec-cats-dark",
      type: "category_showcase",
      title: "Discover Your World",
      subtitle: "Curated collections crafted for distinction",
      badge: "PREMIUM CATEGORIES",
      enabled: true,
      settings: { style: "pills", limit: 8 },
    },
    {
      id: "sec-bento-dark",
      type: "featured_collections",
      title: "Iconic Highlights",
      subtitle: "Signature designs and state-of-the-art innovation",
      enabled: true,
      settings: {
        layout: "bento_3",
        cards: [
          {
            title: "iPhone 15 Pro Max",
            subtitle: "Titanium. Stronger. Lighter. Smarter.",
            cta: "Shop Now",
            link: "/products?category=Electronics",
            image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80",
            bg: "from-zinc-900 to-black text-white border border-zinc-800",
          },
          {
            title: "Premium Fashion Collection",
            subtitle: "Timeless pieces. Modern elegance.",
            cta: "Explore Now",
            link: "/products?category=Fashion",
            image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
            bg: "from-stone-900 to-zinc-950 text-white border border-zinc-800",
          },
        ],
      },
    },
    {
      id: "sec-flash-dark",
      type: "flash_sale",
      title: "Flash Deals",
      subtitle: "Limited time exclusive private drops",
      badge: "PRIVATE SALE",
      enabled: true,
      settings: { hoursLeft: 14, discountText: "UP TO 50% OFF", limit: 6 },
    },
    {
      id: "sec-products-dark",
      type: "product_grid",
      title: "Curated Just For You",
      subtitle: "Handpicked collections, tailored for your exquisite taste",
      badge: "COLLECTIONS",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-story-dark",
      type: "rich_text",
      title: "Timeless Luxury & Uncompromising Craftsmanship",
      subtitle: "Every item in our luxury vault is authenticated by master curators and delivered in signature bespoke packaging.",
      badge: "OUR PROMISE",
      enabled: true,
      settings: {
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
        ctaText: "Read Story",
        ctaLink: "/products",
      },
    },
    {
      id: "sec-newsletter-dark",
      type: "newsletter",
      title: "Subscribe to Exclusive Insider Drops",
      subtitle: "Be first to receive private collection access and VIP privileges.",
      enabled: true,
      settings: { buttonText: "Join VIP" },
    },
  ],
};

// ── 4. ELECTRONICS & GADGETS THEME ──
export const DEFAULT_ELECTRONICS_THEME: ThemeConfig = {
  themePreset: "shopease-electronics",
  headerStyle: "standard",
  primaryColor: "#0284c7",
  accentColor: "#38bdf8",
  isDarkMode: true,
  fontFamily: "Inter, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "🚀 Next-Gen Tech Drops! Official Brand Warranty on All Smartphones, Laptops & Audio Devices",
  sections: [
    {
      id: "sec-hero-tech",
      type: "hero_slider",
      title: "Next-Gen Electronics & Smart Gadgets",
      subtitle: "Experience cutting-edge smartphones, high-performance laptops, noise-canceling audio and smart home gear.",
      badge: "SMART TECH 2026",
      enabled: true,
      settings: {
        ctaText: "Explore Tech",
        ctaLink: "/products",
        sideDealTitle: "Wireless Audio Deal",
        sideDealBadge: "50% OFF",
        sideDealSubtitle: "Pro ANC Earbuds",
        sideDealImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-slate-950 via-slate-900 to-indigo-950 text-white",
      },
    },
    {
      id: "sec-badges-tech",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "ShieldCheck", title: "100% Genuine Warranty", desc: "Official brand replacement" },
          { icon: "Truck", title: "Express 24H Courier", desc: "Insured safe shipping" },
          { icon: "RotateCcw", title: "7-Day Replacement", desc: "Zero risk guarantee" },
          { icon: "Headphones", title: "Tech Support Team", desc: "Instant setup assistance" },
        ],
      },
    },
    {
      id: "sec-cats-tech",
      type: "category_showcase",
      title: "Popular Tech Categories",
      subtitle: "Browse laptops, smartphones, wearables, gaming & accessories",
      badge: "DEVICES",
      enabled: true,
      settings: { style: "cards", limit: 8 },
    },
    {
      id: "sec-flash-tech",
      type: "flash_sale",
      title: "Limited Tech Deals & Flash Price Drops",
      subtitle: "Special clearance & promotional pricing with countdown timer",
      badge: "HOT GADGETS",
      enabled: true,
      settings: { hoursLeft: 6, discountText: "UP TO 45% OFF", limit: 6 },
    },
    {
      id: "sec-products-tech",
      type: "product_grid",
      title: "Top Rated Gadgets & Peripherals",
      subtitle: "Best performance picks tested and recommended by tech enthusiasts",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-brands-tech",
      type: "brands_carousel",
      title: "Authorized Global Brand Partners",
      subtitle: "Official certified reseller for top global technology leaders",
      enabled: true,
      settings: {
        brands: [
          { name: "Apple", logo: "" },
          { name: "Sony", logo: "SONY" },
          { name: "Samsung", logo: "SAMSUNG" },
          { name: "Asus", logo: "ASUS" },
          { name: "Dell", logo: "DELL" },
          { name: "Logitech", logo: "logi" },
          { name: "Bose", logo: "BOSE" },
        ],
      },
    },
    {
      id: "sec-faq-tech",
      type: "faq_section",
      title: "Warranty & Shipping FAQ",
      subtitle: "Everything you need to know about claiming warranty, IMEI checks and tracking",
      badge: "SUPPORT",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-tech",
      type: "newsletter",
      title: "Join Tech Insiders Club",
      subtitle: "Get early access to pre-orders, gadget giveaways and hardware discounts.",
      enabled: true,
      settings: { buttonText: "Join Insiders" },
    },
  ],
};

// ── 5. FASHION & APPAREL BOUTIQUE THEME ──
export const DEFAULT_FASHION_THEME: ThemeConfig = {
  themePreset: "shopease-fashion",
  headerStyle: "standard",
  primaryColor: "#e11d48",
  accentColor: "#f43f5e",
  isDarkMode: false,
  fontFamily: "Outfit, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "👗 Summer Lookbook 2026 is LIVE! Enjoy Flat 20% OFF on all dresses with code SUMMER20",
  sections: [
    {
      id: "sec-hero-fashion",
      type: "hero_slider",
      title: "Define Your Signature Look",
      subtitle: "Explore high-street trends, designer outfits, elegant footwear & bespoke styling.",
      badge: "NEW SUMMER COLLECTION",
      enabled: true,
      settings: {
        ctaText: "Shop Lookbook",
        ctaLink: "/products",
        sideDealTitle: "Trending Dresses",
        sideDealBadge: "Flat 30% OFF",
        sideDealSubtitle: "Limited Edition Run",
        sideDealImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-rose-50 via-pink-50/50 to-white",
      },
    },
    {
      id: "sec-badges-fashion",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "Truck", title: "Fast Express Delivery", desc: "Doorstep delivery in 24-48h" },
          { icon: "RotateCcw", title: "Easy Size Exchange", desc: "No questions asked size swaps" },
          { icon: "ShieldCheck", title: "Premium Fabrics", desc: "100% authentic quality" },
          { icon: "Headphones", title: "Style Advisory", desc: "Chat with personal stylists" },
        ],
      },
    },
    {
      id: "sec-cats-fashion",
      type: "category_showcase",
      title: "Shop By Department",
      subtitle: "Women's, Men's, Kids, Footwear, Bags & Accessories",
      badge: "LOOKS",
      enabled: true,
      settings: { style: "circles", limit: 8 },
    },
    {
      id: "sec-products-fashion",
      type: "product_grid",
      title: "Trending In High Fashion",
      subtitle: "Most coveted pieces of the season curated for distinction",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-bento-fashion",
      type: "featured_collections",
      title: "Curated Style Edits",
      subtitle: "Handpicked thematic outfits ready for any occasion",
      enabled: true,
      settings: {
        layout: "bento_3",
        cards: [
          {
            title: "Summer Resort Wear",
            subtitle: "Breezy linens & casual fits",
            cta: "Shop Now",
            link: "/products?category=Fashion",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
            bg: "from-pink-900 to-rose-900 text-white",
          },
          {
            title: "Minimalist Essentials",
            subtitle: "Monochrome tones & clean silhouettes",
            cta: "Shop Now",
            link: "/products?category=Fashion",
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
            bg: "from-slate-900 to-zinc-900 text-white",
          },
        ],
      },
    },
    {
      id: "sec-test-fashion",
      type: "testimonials",
      title: "Fashionistas Love ShopEase",
      subtitle: "See how our community styles their favorite outfits",
      badge: "COMMUNITY",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-fashion",
      type: "newsletter",
      title: "Get 15% Off Your Next Outfit",
      subtitle: "Join our fashion insider list for private sale invitations and lookbook previews.",
      enabled: true,
      settings: { buttonText: "Claim 15% OFF" },
    },
  ],
};

// ── 6. PHARMACY & HEALTHCARE THEME ──
export const DEFAULT_PHARMACY_THEME: ThemeConfig = {
  themePreset: "shopease-pharmacy",
  headerStyle: "standard",
  primaryColor: "#0d9488",
  accentColor: "#14b8a6",
  isDarkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "💊 24/7 Registered Pharmacist On-Call & Urgent Prescription Delivery in 2 Hours",
  sections: [
    {
      id: "sec-hero-pharmacy",
      type: "hero_slider",
      title: "Your Trusted Online Pharmacy & Healthcare Partner",
      subtitle: "Order authentic prescription medicines, wellness supplements, surgical gear & personal healthcare essentials safely online.",
      badge: "GOVT. LICENSED PHARMACY",
      enabled: true,
      settings: {
        ctaText: "Order Medicine",
        ctaLink: "/products",
        sideDealTitle: "First Aid Kit",
        sideDealBadge: "Essential Pack",
        sideDealSubtitle: "Home Emergency Care",
        sideDealImage: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-teal-50 via-emerald-50/50 to-white",
      },
    },
    {
      id: "sec-rx-upload",
      type: "pharmacy_upload",
      title: "Quick Prescription Upload & Fast Medicine Delivery",
      subtitle: "Simply upload a picture of your doctor's prescription. Our registered pharmacists will review, verify dosages, and arrange fast doorstep delivery.",
      badge: "ONLINE RX DISPATCH",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-badges-pharmacy",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "ShieldCheck", title: "100% Genuine Medicines", desc: "Sourced directly from pharma lab" },
          { icon: "Truck", title: "2-Hour Emergency Delivery", desc: "Cold-chain temperature control" },
          { icon: "Headphones", title: "Doctor & Pharmacist On-Call", desc: "Free dosage consultation" },
          { icon: "RotateCcw", title: "Safe Tamper-Proof Pack", desc: "Sealed hygienic delivery" },
        ],
      },
    },
    {
      id: "sec-cats-pharmacy",
      type: "category_showcase",
      title: "Browse Healthcare & OTC Categories",
      subtitle: "Prescription drugs, vitamins, baby care, diabetic care, medical devices & hygiene",
      badge: "DEPARTMENTS",
      enabled: true,
      settings: { style: "cards", limit: 8 },
    },
    {
      id: "sec-products-pharmacy",
      type: "product_grid",
      title: "Popular Wellness & OTC Medicines",
      subtitle: "Trusted daily healthcare essentials, vitamins, and medical care supplies",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-faq-pharmacy",
      type: "faq_section",
      title: "Prescription & Healthcare Guidelines FAQ",
      subtitle: "Important questions regarding valid prescriptions, refrigerated items and dosage guidance",
      badge: "PATIENT HELP",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-pharmacy",
      type: "newsletter",
      title: "Subscribe to Monthly Health & Wellness Tips",
      subtitle: "Receive regular medical advice, seasonal disease precautions, and refill reminders.",
      enabled: true,
      settings: { buttonText: "Subscribe" },
    },
  ],
};

// ── 7. RESTAURANT, CAFE & FOOD DELIVERY THEME ──
export const DEFAULT_RESTAURANT_THEME: ThemeConfig = {
  themePreset: "shopease-restaurant",
  headerStyle: "standard",
  primaryColor: "#ea580c",
  accentColor: "#f97316",
  isDarkMode: false,
  fontFamily: "Outfit, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "🍕 Hot & Fresh Food Delivered in 30 Minutes! Free Drink with every Platter",
  sections: [
    {
      id: "sec-hero-food",
      type: "hero_slider",
      title: "Delicious Gourmet Meals Delivered Hot & Fresh",
      subtitle: "Handcrafted gourmet burgers, woodfired pizzas, fragrant biryanis and authentic delicacies prepared upon order.",
      badge: "CHEF'S FRESH KITCHEN",
      enabled: true,
      settings: {
        ctaText: "Order Food Now",
        ctaLink: "/products",
        sideDealTitle: "Chef's Combo",
        sideDealBadge: "Save 30%",
        sideDealSubtitle: "Burger + Fries + Drink",
        sideDealImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-orange-50 via-amber-50/50 to-white",
      },
    },
    {
      id: "sec-menu-food",
      type: "restaurant_menu",
      title: "Chef's Signature Dishes & Daily Specials",
      subtitle: "Choose from our handpicked gourmet menu prepared with fresh farm ingredients and authentic secret spices.",
      badge: "SIGNATURE MENU",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-badges-food",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "Truck", title: "30-Minute Hot Delivery", desc: "Thermal insulated delivery bags" },
          { icon: "ShieldCheck", title: "100% Fresh Ingredients", desc: "Cooked to order hygiene" },
          { icon: "RotateCcw", title: "Live Order Tracking", desc: "Follow rider GPS in real time" },
          { icon: "Headphones", title: "Customer Care", desc: "Instant meal replacement if late" },
        ],
      },
    },
    {
      id: "sec-products-food",
      type: "product_grid",
      title: "Popular Fast Food, Desserts & Beverages",
      subtitle: "Add sides, thirst-quenching shakes, and sweet desserts to complete your feast",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-test-food",
      type: "testimonials",
      title: "What Foodies Say About Us",
      subtitle: "Loved by over 20,000 food lovers across the city",
      badge: "FOOD LOVERS",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-app-food",
      type: "app_download",
      title: "Order Food Faster With Our Mobile App",
      subtitle: "Get free delivery on your first 3 food orders, track rider live on map and earn reward coins.",
      badge: "FOOD DELIVERY APP",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-food",
      type: "newsletter",
      title: "Subscribe for Weekend Food Deals & Vouchers",
      subtitle: "Never miss out on buy-1-get-1 pizza days and holiday feast discounts.",
      enabled: true,
      settings: { buttonText: "Get Food Deals" },
    },
  ],
};

// ── 8. BEAUTY & COSMETICS BOUTIQUE THEME ──
export const DEFAULT_BEAUTY_THEME: ThemeConfig = {
  themePreset: "shopease-beauty",
  headerStyle: "standard",
  primaryColor: "#db2777",
  accentColor: "#f472b6",
  isDarkMode: false,
  fontFamily: "Outfit, system-ui, sans-serif",
  showAnnouncement: true,
  announcementText: "💄 100% Authentic Korean & Global Skincare Brands! Free Beauty Samples with every order",
  sections: [
    {
      id: "sec-hero-beauty",
      type: "hero_slider",
      title: "Glow Everyday with Premium Skincare & Makeup",
      subtitle: "Discover authentic Korean skincare, luxury cosmetics, dermatologically tested serums, and fragrance collections.",
      badge: "100% AUTHENTIC BEAUTY",
      enabled: true,
      settings: {
        ctaText: "Shop Skincare",
        ctaLink: "/products",
        sideDealTitle: "Glow Serum Box",
        sideDealBadge: "Save 40%",
        sideDealSubtitle: "Hydrating Essentials",
        sideDealImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
        heroImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&auto=format&fit=crop&q=80",
        bgColor: "from-pink-50 via-rose-50/50 to-white",
      },
    },
    {
      id: "sec-badges-beauty",
      type: "feature_badges",
      enabled: true,
      settings: {
        items: [
          { icon: "ShieldCheck", title: "100% Original Brands", desc: "Direct from Korea & USA" },
          { icon: "Truck", title: "Free Samples Included", desc: "Every order gets trial minis" },
          { icon: "RotateCcw", title: "Derm-Approved", desc: "Safe for sensitive skin" },
          { icon: "Headphones", title: "Beauty Consultation", desc: "Personalized skin advice" },
        ],
      },
    },
    {
      id: "sec-cats-beauty",
      type: "category_showcase",
      title: "Shop By Beauty Routine",
      subtitle: "Cleansers, Toners, Serums, Sunscreens, Lipsticks, Fragrances & Haircare",
      badge: "SKINCARE STEPS",
      enabled: true,
      settings: { style: "circles", limit: 8 },
    },
    {
      id: "sec-products-beauty",
      type: "product_grid",
      title: "Best Selling Skincare & Cosmetics",
      subtitle: "Top rated serums, lip tints and moisture creams loved by beauty experts",
      enabled: true,
      settings: { filter: "all", limit: 8, columns: 4 },
    },
    {
      id: "sec-story-beauty",
      type: "rich_text",
      title: "Clean Ingredients, Pure Beauty, Real Results",
      subtitle: "We believe beauty should be safe, transparent and cruelty-free. Every product in our catalog undergoes rigorous safety and authenticity verification.",
      badge: "OUR BEAUTY PHILOSOPHY",
      enabled: true,
      settings: {
        image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        ctaText: "Learn More",
        ctaLink: "/products",
      },
    },
    {
      id: "sec-test-beauty",
      type: "testimonials",
      title: "Real Glowing Skin Results",
      subtitle: "See how thousands of customers transformed their skin routine",
      badge: "REVIEWS",
      enabled: true,
      settings: {},
    },
    {
      id: "sec-newsletter-beauty",
      type: "newsletter",
      title: "Get Beauty Tips & Exclusive Member Vouchers",
      subtitle: "Subscribe to receive skin routines, dermat advice and VIP product launches.",
      enabled: true,
      settings: { buttonText: "Join Beauty Club" },
    },
  ],
};
