export type SectionType =
  | "hero_slider"
  | "feature_badges"
  | "category_showcase"
  | "flash_sale"
  | "featured_collections"
  | "product_grid"
  | "promo_split_banner"
  | "brands_carousel"
  | "curated_recommendations"
  | "blog_stories"
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

export interface ThemeConfig {
  themePreset: "shopease-vibrant" | "shopease-sidebar-grocery" | "shopease-dark-luxury";
  headerStyle: "standard" | "sidebar_integrated" | "dark_luxury";
  primaryColor: string;
  accentColor: string;
  isDarkMode: boolean;
  fontFamily: string;
  sections: SectionItem[];
}

export const DEFAULT_VIBRANT_THEME: ThemeConfig = {
  themePreset: "shopease-vibrant",
  headerStyle: "standard",
  primaryColor: "#2563eb",
  accentColor: "#f59e0b",
  isDarkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
  sections: [
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
      settings: {
        style: "circles", // 'circles' | 'cards' | 'pills'
        limit: 8,
      },
    },
    {
      id: "sec-flash-1",
      type: "flash_sale",
      title: "Flash Sale",
      subtitle: "Top deals. Limited time, don't miss out!",
      badge: "FLASH DEAL",
      enabled: true,
      settings: {
        hoursLeft: 8,
        discountText: "UP TO 70% OFF",
        limit: 6,
      },
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
      settings: {
        filter: "all",
        limit: 8,
        columns: 4,
      },
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
      id: "sec-split-1",
      type: "promo_split_banner",
      title: "Live Better With Premium Picks",
      subtitle: "Top quality. Trusted brands. Unbeatable value guaranteed.",
      badge: "SPECIAL OFFER",
      enabled: true,
      settings: {
        ctaText: "Shop Now",
        ctaLink: "/products",
        sideCardTitle: "Smart Choices",
        sideCardSubtitle: "For a Brighter Tomorrow",
        bgGradient: "from-cyan-900 via-blue-900 to-slate-900",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "sec-justforyou-1",
      type: "curated_recommendations",
      title: "Just For You",
      subtitle: "Personalized recommendations based on your interests",
      badge: "RECOMMENDED",
      enabled: true,
      settings: {
        limit: 6,
      },
    },
    {
      id: "sec-newsletter-1",
      type: "newsletter",
      title: "Subscribe to Our Newsletter",
      subtitle: "Get the latest updates, promotions and exclusive vouchers delivered right to your inbox.",
      enabled: true,
      settings: {
        buttonText: "Subscribe",
      },
    },
  ],
};

export const DEFAULT_SIDEBAR_THEME: ThemeConfig = {
  themePreset: "shopease-sidebar-grocery",
  headerStyle: "sidebar_integrated",
  primaryColor: "#059669",
  accentColor: "#f59e0b",
  isDarkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
  sections: [
    {
      id: "sec-hero-sidebar",
      type: "hero_slider",
      title: "Everything You Need in One Place",
      subtitle: "Shop groceries, pharmacy, electronics & fashion with express home delivery.",
      badge: "MEGA STORE",
      enabled: true,
      settings: {
        ctaText: "Shop Now",
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
          { icon: "Truck", title: "Free Shipping", desc: "On orders over ৳500" },
          { icon: "ShieldCheck", title: "Secure Payment", desc: "100% secure checkout" },
          { icon: "RotateCcw", title: "Easy Returns", desc: "Within 7 days return policy" },
          { icon: "Headphones", title: "24/7 Support", desc: "Instant customer helpline" },
        ],
      },
    },
    {
      id: "sec-cats-sidebar",
      type: "category_showcase",
      title: "Shop by Category",
      subtitle: "Browse departments and special categories",
      badge: "DEPARTMENTS",
      enabled: true,
      settings: {
        style: "cards",
        limit: 8,
      },
    },
    {
      id: "sec-bento-sidebar",
      type: "featured_collections",
      title: "Featured Categories",
      subtitle: "Explore our popular fresh and tech categories",
      enabled: true,
      settings: {
        layout: "grid_4",
        cards: [
          {
            title: "Latest Smartphones",
            subtitle: "Up to 40% Off",
            cta: "Shop Now",
            link: "/products?category=Electronics",
            image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
            bg: "from-blue-50 to-sky-100 text-slate-900",
          },
          {
            title: "Home Essentials",
            subtitle: "Make Your Home Beautiful",
            cta: "Shop Now",
            link: "/products?category=Home",
            image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
            bg: "from-emerald-50 to-teal-100 text-slate-900",
          },
          {
            title: "Fashion Forward",
            subtitle: "Trendy Styles For Everyone",
            cta: "Shop Now",
            link: "/products?category=Fashion",
            image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
            bg: "from-pink-50 to-rose-100 text-slate-900",
          },
          {
            title: "Fresh Groceries",
            subtitle: "Farm Fresh Best Quality",
            cta: "Shop Now",
            link: "/products?category=Groceries",
            image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&auto=format&fit=crop&q=80",
            bg: "from-amber-50 to-orange-100 text-slate-900",
          },
        ],
      },
    },
    {
      id: "sec-products-sidebar",
      type: "product_grid",
      title: "Top Selling Products",
      subtitle: "Fastest moving products with guaranteed stock",
      enabled: true,
      settings: {
        filter: "all",
        limit: 8,
        columns: 4,
      },
    },
    {
      id: "sec-split-sidebar",
      type: "promo_split_banner",
      title: "Save More, Live Better",
      subtitle: "Get exclusive deals, discounts and direct factory savings on your favorite products.",
      badge: "SPECIAL OFFER",
      enabled: true,
      settings: {
        ctaText: "Shop Now",
        ctaLink: "/products",
        sideCardTitle: "Up to 70% OFF",
        sideCardSubtitle: "Exclusive App & Web Discounts",
        bgGradient: "from-indigo-900 via-purple-900 to-slate-900",
        image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80",
      },
    },
    {
      id: "sec-brands-sidebar",
      type: "brands_carousel",
      title: "Top Brands",
      enabled: true,
      settings: {
        brands: [
          { name: "Samsung", logo: "SAMSUNG" },
          { name: "Nike", logo: "NIKE" },
          { name: "Adidas", logo: "adidas" },
          { name: "Apple", logo: "" },
          { name: "L'Oreal", logo: "L'ORÉAL" },
          { name: "Unilever", logo: "Unilever" },
          { name: "Coca-Cola", logo: "Coca-Cola" },
        ],
      },
    },
    {
      id: "sec-blog-sidebar",
      type: "blog_stories",
      title: "Latest From Our Blog",
      subtitle: "Tips, trends and guides for a better you",
      enabled: true,
      settings: {
        limit: 4,
      },
    },
    {
      id: "sec-newsletter-sidebar",
      type: "newsletter",
      title: "Subscribe to Our Newsletter",
      subtitle: "Get the latest updates and exclusive offers delivered to your inbox.",
      enabled: true,
      settings: {
        buttonText: "Subscribe",
      },
    },
  ],
};

export const DEFAULT_DARK_LUXURY_THEME: ThemeConfig = {
  themePreset: "shopease-dark-luxury",
  headerStyle: "dark_luxury",
  primaryColor: "#d97706",
  accentColor: "#fbbf24",
  isDarkMode: true,
  fontFamily: "Outfit, system-ui, sans-serif",
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
      settings: {
        style: "pills",
        limit: 8,
      },
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
      settings: {
        hoursLeft: 14,
        discountText: "UP TO 50% OFF",
        limit: 6,
      },
    },
    {
      id: "sec-products-dark",
      type: "product_grid",
      title: "Curated Just For You",
      subtitle: "Handpicked collections, tailored for your exquisite taste",
      badge: "COLLECTIONS",
      enabled: true,
      settings: {
        filter: "all",
        limit: 8,
        columns: 4,
      },
    },
    {
      id: "sec-brands-dark",
      type: "brands_carousel",
      title: "Trusted by Millions Worldwide",
      subtitle: "Top brands. Genuine products. Better together.",
      enabled: true,
      settings: {
        brands: [
          { name: "Apple", logo: "" },
          { name: "Samsung", logo: "SAMSUNG" },
          { name: "Nike", logo: "NIKE" },
          { name: "Adidas", logo: "adidas" },
          { name: "L'Oreal", logo: "L'ORÉAL" },
          { name: "P&G", logo: "P&G" },
        ],
      },
    },
    {
      id: "sec-newsletter-dark",
      type: "newsletter",
      title: "Subscribe to Exclusive Insider Drops",
      subtitle: "Be first to receive private collection access and VIP privileges.",
      enabled: true,
      settings: {
        buttonText: "Join VIP",
      },
    },
  ],
};
