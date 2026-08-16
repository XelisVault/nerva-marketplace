/**
 * Runtime configuration.
 *
 * In production, set the NEXT_PUBLIC_* env vars to point at the Python
 * backend (FastAPI on :8080 / :8880 / ws on :2052).
 *
 * In dev/preview, leave them empty - the app uses the built-in mock API
 * routes under /api/* so the entire marketplace flow works without any
 * external services (no Python, no MySQL, no NERVA wallet, no Redis).
 */

function getEnv(key: string, fallback = ""): string {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] ?? fallback;
  }
  return fallback;
}

export const config = {
  /** Market service base URL. Empty = use mock API. */
  marketApiBaseUrl: getEnv("NEXT_PUBLIC_MARKET_API_BASE_URL").replace(/\/$/, ""),
  /** Invoice service base URL. Empty = use mock API. */
  invoiceApiBaseUrl: getEnv("NEXT_PUBLIC_INVOICE_API_BASE_URL").replace(/\/$/, ""),
  /** Invoice WebSocket URL. Empty = simulate payment status. */
  invoiceWsUrl: getEnv("NEXT_PUBLIC_INVOICE_WS_URL").replace(/\/$/, ""),
} as const;

/** True when the app should use the real Python backend instead of mock API. */
export const USE_REAL_BACKEND = Boolean(config.marketApiBaseUrl);

/**
 * Resolve a market API URL.
 * - In production: `${MARKET_API_BASE_URL}/path`
 * - In dev/preview: `/api/market/path`  (handled by Next.js route handlers)
 */
export function marketUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (config.marketApiBaseUrl) {
    return `${config.marketApiBaseUrl}${clean}`;
  }
  return `/api/market${clean}`;
}

/** Resolve an invoice API URL (same logic as marketUrl). */
export function invoiceUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (config.invoiceApiBaseUrl) {
    return `${config.invoiceApiBaseUrl}${clean}`;
  }
  return `/api/invoice${clean}`;
}

/** Resolve the image URL for a listing. */
export function listingImageUrl(imageName: string | undefined): string {
  if (!imageName) return "/images/placeholder-listing.svg";
  // If it's already a URL (data: or http(s):), return as-is.
  if (/^(https?:|data:|blob:|\/)/.test(imageName)) return imageName;
  return marketUrl(`/market/listing/image/${encodeURIComponent(imageName)}`);
}

/** Resolve the WebSocket URL for an invoice. */
export function invoiceWsUrlFor(invoiceId: string | number): string | null {
  if (config.invoiceWsUrl) {
    return `${config.invoiceWsUrl}/${invoiceId}`;
  }
  return null; // null = simulate
}

export const NERVA_INFO = {
  ticker: "XNV",
  name: "NERVA",
  website: "https://nerva.one",
  description:
    "NERVA (XNV) is a CPU-minable privacy coin (Monero fork) using Cryptonight Adaptive. Fair launch, no ICO, no pools - solo CPU mining only.",
  exchanges: ["Cratex", "TradeOgre", "BitMesh"],
} as const;
