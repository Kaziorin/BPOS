import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-gray-100 bg-white px-6 py-3">
      <p className="text-center text-xs text-gray-400">
        {siteConfig.name} &copy; {new Date().getFullYear()} &mdash; All rights reserved
      </p>
    </footer>
  );
}
