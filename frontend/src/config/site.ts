import { Store, type LucideIcon } from "lucide-react";

export interface SiteConfig {
  /** Full product name — shown in the expanded sidebar, login page, browser tab. */
  name: string;
  /** Short form — shown in the collapsed sidebar and as the avatar fallback. */
  shortName: string;
  description: string;
  logoIcon: LucideIcon;
}

/**
 * Single source of truth for branding. Change the name/logo here and it
 * updates everywhere (sidebar, login page, browser tab, footer).
 */
export const siteConfig: SiteConfig = {
  name: "Blue Oceans POS",
  shortName: "BOP",
  description: "Offline-first multi-tenant POS, ERP & CRM platform",
  logoIcon: Store,
};
