import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const url = req.nextUrl;

  // 1. Check if store is passed via query param (e.g. localhost:3000?store=aarong or ?store=lazzpharma)
  const storeParam = url.searchParams.get("store");
  let tenantSlug = storeParam || "";

  // 2. Extract tenant slug from Subdomain or Custom Domain
  if (!tenantSlug) {
    const cleanHost = host.split(":")[0]; // Strip port

    // Check if it's a subdomain (e.g., aarong.bpos.com or pharmacy.store.com)
    if (cleanHost.includes(".") && !cleanHost.startsWith("localhost") && !cleanHost.startsWith("127.0.0.1")) {
      const parts = cleanHost.split(".");
      if (parts.length >= 3) {
        // e.g., ["aarong", "bpos", "com"] -> "aarong"
        tenantSlug = parts[0] === "www" ? parts[1] : parts[0];
      } else {
        // Custom domain (e.g. "www.aarongfashion.com" -> custom domain lookup)
        tenantSlug = cleanHost.replace(/^www\./, "");
      }
    } else {
      // Local development fallback
      tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "default-store";
    }
  }

  // 3. Inject resolved tenant slug into request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-slug", tenantSlug);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Store in cookie for client-side hydration
  response.cookies.set("current_tenant_slug", tenantSlug, {
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
