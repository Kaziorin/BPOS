export interface IndustryPreset {
  label: string;
  accent: string;
  pill: string;
  title: string;
  desc: string;
  cta: string;
  catalogHeading: string;
  highlights: [string, string][];
}

export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  RESTAURANT: {
    label: "Restaurant & Cafe",
    accent: "#ea580c",
    pill: "Freshly Prepared • Dine-In & Reservations",
    title: "Taste Crafted Fresh Every Day",
    desc: "Explore our signature dishes, cozy dining ambiance, and reserve your table or reach out for private events.",
    cta: "Explore Our Menu",
    catalogHeading: "Signature Menu",
    highlights: [
      ["Chef's Signature Dishes", "Freshly prepared daily with authentic local & imported ingredients."],
      ["Dine-In & Family Booths", "Warm hospitality for family dinners, corporate lunches & events."],
      ["Hygienic Open Kitchen", "Strict quality & hygiene standards on every plate."],
    ],
  },
  RETAIL: {
    label: "Retail & Fashion",
    accent: "#6366f1",
    pill: "New Arrivals • Flagship Collection",
    title: "Upgrade Your Everyday Lifestyle",
    desc: "Explore our curated seasonal collections, flagship store lookbook, and exclusive in-store offers.",
    cta: "View Collection",
    catalogHeading: "Featured Showcase",
    highlights: [
      ["Curated Collections", "Handpicked fashion, lifestyle & everyday essentials."],
      ["Authentic Quality", "100% genuine products across all outlets."],
      ["Flagship Experience", "Visit our showroom for personalized styling & offers."],
    ],
  },
  GROCERY: {
    label: "Grocery & Supermarket",
    accent: "#10b981",
    pill: "Farm Fresh • Daily Essentials",
    title: "Freshness You Can Trust Every Day",
    desc: "From farm-fresh produce to pantry staples, discover quality groceries at honest everyday prices.",
    cta: "View Aisles",
    catalogHeading: "Fresh Aisles Showcase",
    highlights: [
      ["Farm-Fresh Produce", "Direct sourcing from trusted farms every morning."],
      ["Quality & Hygiene", "Temperature-controlled storage & sealed packaging."],
      ["Member Rewards", "Visit our store for weekly family bundle savings."],
    ],
  },
  PHARMACY: {
    label: "Pharmacy & Healthcare",
    accent: "#0d9488",
    pill: "DGDA Licensed • Genuine Medicines",
    title: "Trusted Healthcare & Pharmacy Care",
    desc: "Verified authentic pharmaceuticals, wellness care, and licensed pharmacist consultation.",
    cta: "View Wellness Catalog",
    catalogHeading: "Healthcare & Wellness",
    highlights: [
      ["100% Authentic Stock", "FEFO batch-tracked genuine medicines."],
      ["Licensed Pharmacists", "Professional guidance on dosage & prescriptions."],
      ["Cold-Chain Care", "Properly stored insulin, vaccines & sensitive meds."],
    ],
  },
  WHOLESALE: {
    label: "Wholesale & B2B",
    accent: "#1d4ed8",
    pill: "B2B Distribution • Corporate Supply",
    title: "Reliable Wholesale & Distribution Partner",
    desc: "Bulk supply, institutional procurement, and nationwide commercial distribution.",
    cta: "View Product Lines",
    catalogHeading: "Wholesale Product Lines",
    highlights: [
      ["Bulk Volume Pricing", "Competitive B2B tier rates for retailers & institutions."],
      ["Dedicated Warehousing", "High-capacity stock ready for scheduled dispatch."],
      ["Corporate Accounts", "Credit terms & VAT-compliant commercial invoicing."],
    ],
  },
  SALON: {
    label: "Salon & Spa",
    accent: "#db2777",
    pill: "Beauty & Wellness Studio",
    title: "Luxury Salon, Spa & Grooming",
    desc: "Relax, refresh, and elevate your look with our certified stylists and beauty specialists.",
    cta: "Explore Services",
    catalogHeading: "Signature Treatments",
    highlights: [
      ["Expert Stylists", "Curated hair, skin & bridal makeup specialists."],
      ["Premium Products", "International salon-grade care brands."],
      ["Private Appointments", "Book your preferred time slot easily."],
    ],
  },
  REPAIR: {
    label: "Tech Repair & Service",
    accent: "#d97706",
    pill: "Certified Technicians • Genuine Parts",
    title: "Fast & Reliable Device Repair",
    desc: "Expert diagnostics, screen & battery replacements, and hardware servicing with warranty.",
    cta: "View Services & Parts",
    catalogHeading: "Repair Services & Parts",
    highlights: [
      ["Genuine Parts", "Quality-tested components with service warranty."],
      ["Transparent Quotes", "Clear diagnostics before any repair begins."],
      ["Express Service", "Same-day turnaround for common repairs."],
    ],
  },
  BAKERY: {
    label: "Bakery & Foods",
    accent: "#d97706",
    pill: "Baked Fresh Daily • Artisan Quality",
    title: "Warm, Artisan Bakes & Custom Cakes",
    desc: "Handcrafted breads, pastries, and celebration cakes baked fresh every morning.",
    cta: "View Bakery Menu",
    catalogHeading: "Fresh From The Oven",
    highlights: [
      ["Fresh Morning Batches", "Zero preservatives, baked fresh daily."],
      ["Custom Event Cakes", "Bespoke cakes for weddings, birthdays & corporate events."],
      ["Artisan Ingredients", "Finest butter, cocoa & imported flour."],
    ],
  },
  FRANCHISE: {
    label: "Enterprise Franchise",
    accent: "#4f46e5",
    pill: "Multi-Branch Network",
    title: "Unified Multi-Outlet Brand Experience",
    desc: "Consistent quality, signature offerings, and trusted service across all our franchise locations.",
    cta: "Explore Offerings",
    catalogHeading: "Brand Showcase",
    highlights: [
      ["Nationwide Outlets", "Consistent experience across every branch."],
      ["Standardized Quality", "Centralized quality assurance & training."],
      ["Franchise Partnerships", "Contact us for regional franchise inquiries."],
    ],
  },
};
