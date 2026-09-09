import {
  Utensils,
  Coffee,
  Pizza,
  Soup,
  Wine,
  Cookie,
  Sandwich,
  ChefHat,
  Flame,
  Cake,
  ShoppingBag,
  Sparkles,
  Tags,
  Package,
  Pill,
  ShoppingCart,
  Truck,
  Factory,
  Wrench,
  Building2,
  Apple,
  Milk,
  Fish,
  GlassWater,
  Beer,
  IceCream,
  Croissant,
  CupSoda,
  LucideIcon,
} from "lucide-react";

export interface CategoryIconItem {
  name: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_ICONS_LIST: CategoryIconItem[] = [
  { name: "Utensils", label: "Utensils", icon: Utensils },
  { name: "ChefHat", label: "Chef Hat", icon: ChefHat },
  { name: "Pizza", label: "Pizza", icon: Pizza },
  { name: "Coffee", label: "Coffee", icon: Coffee },
  { name: "Soup", label: "Soup / Bowl", icon: Soup },
  { name: "Sandwich", label: "Sandwich / Fast Food", icon: Sandwich },
  { name: "Flame", label: "Flame / Grill", icon: Flame },
  { name: "Wine", label: "Wine / Beverage", icon: Wine },
  { name: "GlassWater", label: "Water / Soft Drink", icon: GlassWater },
  { name: "CupSoda", label: "Soda", icon: CupSoda },
  { name: "Beer", label: "Beer / Drinks", icon: Beer },
  { name: "Milk", label: "Dairy / Milk", icon: Milk },
  { name: "Apple", label: "Fruits", icon: Apple },
  { name: "Fish", label: "Seafood / Fish", icon: Fish },
  { name: "Cookie", label: "Cookie / Snacks", icon: Cookie },
  { name: "Cake", label: "Dessert / Cake", icon: Cake },
  { name: "IceCream", label: "Ice Cream", icon: IceCream },
  { name: "Croissant", label: "Bakery / Bread", icon: Croissant },
  { name: "ShoppingBag", label: "Retail Bag", icon: ShoppingBag },
  { name: "ShoppingCart", label: "Grocery Cart", icon: ShoppingCart },
  { name: "Tags", label: "Tags", icon: Tags },
  { name: "Package", label: "Package", icon: Package },
  { name: "Sparkles", label: "Sparkles", icon: Sparkles },
  { name: "Pill", label: "Pharmacy", icon: Pill },
  { name: "Truck", label: "Wholesale", icon: Truck },
  { name: "Factory", label: "Manufacturing", icon: Factory },
  { name: "Wrench", label: "Repair", icon: Wrench },
  { name: "Building2", label: "Franchise", icon: Building2 },
];

const ICON_MAP: Record<string, LucideIcon> = CATEGORY_ICONS_LIST.reduce((acc, item) => {
  acc[item.name.toLowerCase()] = item.icon;
  return acc;
}, {} as Record<string, LucideIcon>);

export function getCategoryIcon(iconName?: string | null, catName?: string): LucideIcon {
  if (iconName && ICON_MAP[iconName.toLowerCase()]) {
    return ICON_MAP[iconName.toLowerCase()];
  }
  // Smart fallback by category name if icon not specified
  if (catName) {
    const lower = catName.toLowerCase();
    if (lower.includes("drink") || lower.includes("beverage") || lower.includes("juic")) return GlassWater;
    if (lower.includes("coffee") || lower.includes("tea")) return Coffee;
    if (lower.includes("pizza")) return Pizza;
    if (lower.includes("soup") || lower.includes("noodle") || lower.includes("ramen")) return Soup;
    if (lower.includes("burger") || lower.includes("sandwich")) return Sandwich;
    if (lower.includes("grill") || lower.includes("bbq") || lower.includes("steak")) return Flame;
    if (lower.includes("dessert") || lower.includes("cake") || lower.includes("sweet")) return Cake;
    if (lower.includes("ice cream")) return IceCream;
    if (lower.includes("bakery") || lower.includes("bread")) return Croissant;
    if (lower.includes("snack")) return Cookie;
  }
  return Utensils;
}
