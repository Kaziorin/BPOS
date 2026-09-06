import axios, { AxiosError } from "axios";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/api\/?$/, "");

/** localStorage key for the workspace (tenant) selected at login — DB-backed via /auth/tenants. */
export const TENANT_STORAGE_KEY = "blueoceans_tenant";

export interface StoredTenant {
  id: string;
  slug: string;
  name: string;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const axiosClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});


/**
 * Normalize a frontend path to the Python backend's real route space.
 * The frontend was originally written against the TS-era server which accepted
 * bare paths (`/products`, `/customers`, …). The Python API mounts every
 * resource at `/api/v1/*` (auth is the lone exception at `/api/auth/login`).
 *
 *  "/products"            → "/api/v1/products"
 *  "/auth/login"          → "/api/auth/login"   (no v1 on auth)
 *  "/v1/products?limit=1" → "/api/v1/products?limit=1"
 *  "/api/v1/..."          → unchanged
 */
export function normalizeApiPath(path: string): string {
  if (path.startsWith("/api/")) return path;
  if (path.startsWith("/v1/")) return `/api${path}`;
  if (path.startsWith("/auth/")) return `/api${path}`;
  return `/api/v1${path}`;
}

axiosClient.interceptors.request.use((config) => {
  if (config.url) config.url = normalizeApiPath(config.url);
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("modernpos_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Tenant identity for /api/v1/* endpoints — comes from DB-backed login selection.
    const raw = localStorage.getItem(TENANT_STORAGE_KEY);
    if (raw) {
      try {
        const tenant: StoredTenant = JSON.parse(raw);
        config.headers["x-tenant-id"] = tenant.slug || tenant.id;
      } catch {
        /* ignore malformed stored tenant */
      }
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string }>) => {
    const message = error.response?.data?.error ?? error.message ?? "Something went wrong";
    return Promise.reject(new ApiError(message, error.response?.status ?? 0));
  }
);

export const api = {
  get: <T>(path: string) => axiosClient.get<T>(path).then((res) => res.data),
  post: <T>(path: string, body?: unknown) => axiosClient.post<T>(path, body).then((res) => res.data),
  put: <T>(path: string, body?: unknown) => axiosClient.put<T>(path, body).then((res) => res.data),
  patch: <T>(path: string, body?: unknown) => axiosClient.patch<T>(path, body).then((res) => res.data),
  del: <T>(path: string) => axiosClient.delete<T>(path).then((res) => res.data),
  delete: <T>(path: string) => axiosClient.delete<T>(path).then((res) => res.data),
};
