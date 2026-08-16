/**
 * Typed API client for the NERVA Marketplace backend.
 *
 * - All requests include `credentials: "include"` so the session cookie
 *   set by the Python backend is sent on every call.
 * - Errors are normalized into `ApiError` so callers can `try/catch` once.
 * - Network errors are retried once with a 500ms backoff (idempotent GETs only).
 * - Returns strongly-typed responses.
 *
 * In dev/preview (no NEXT_PUBLIC_MARKET_API_BASE_URL set), requests are
 * served by the Next.js route handlers under /api/* - see
 * src/app/api/market/* and src/app/api/invoice/*.
 */

import type {
  ApiError,
  Cart,
  Invoice,
  Listing,
  Order,
  User,
} from "@/types";
import { invoiceUrl, marketUrl } from "./config";

export class HttpError extends Error implements ApiError {
  status: number;
  detail?: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.detail = detail;
  }
}

async function parseError(res: Response): Promise<HttpError> {
  let message = res.statusText || "Request failed";
  let detail: unknown;
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") message = data.detail;
    else if (typeof data?.message === "string") message = data.message;
    detail = data;
  } catch {
    try {
      const text = await res.text();
      if (text) message = text.slice(0, 200);
    } catch {
      /* ignore */
    }
  }
  return new HttpError(res.status, message, detail);
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const isGet = (options.method ?? "GET").toUpperCase() === "GET";
  const headers = new Headers(options.headers);
  // Don't set Content-Type for FormData - browser sets boundary automatically.
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });

    if (res.status === 204) return undefined as T;

    if (!res.ok) {
      throw await parseError(res);
    }

    // Some backend endpoints return plain text or numbers; handle gracefully.
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return (await res.text()) as unknown as T;
    }
    return (await res.json()) as T;
  } catch (err) {
    // Retry GETs once on network errors (offline, DNS hiccup, etc.).
    if (isGet && retry && err instanceof TypeError) {
      await new Promise((r) => setTimeout(r, 500));
      return request<T>(url, options, false);
    }
    if (err instanceof HttpError) throw err;
    throw new HttpError(0, err instanceof Error ? err.message : "Network error");
  }
}

/* ============================================================
 * Users / Auth
 * ============================================================ */

export const authApi = {
  whoami: () => request<User | null>(marketUrl("/users/whoami")),

  login: (username: string, password: string) =>
    request<void>(marketUrl("/users/login"), {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, email: string, password: string) =>
    request<void>(marketUrl("/users/registration/submit"), {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  activate: (token: string) =>
    request<void>(marketUrl(`/users/registration/activate/${encodeURIComponent(token)}`), {
      method: "POST",
    }),

  logout: () =>
    request<void>(marketUrl("/users/logout"), {
      method: "POST",
    }),
};

/* ============================================================
 * Marketplace - Listings
 * ============================================================ */

export const listingApi = {
  list: () => request<Listing[]>(marketUrl("/market/listings")),

  get: (id: number | string) =>
    request<Listing>(marketUrl(`/market/listing/${id}`)),

  create: (data: {
    title: string;
    description: string;
    price_xnv: number;
    payment_address: string;
    file?: File | null;
  }) => {
    const form = new FormData();
    form.append("title", data.title);
    form.append("description", data.description);
    form.append("price_xnv", String(data.price_xnv));
    form.append("payment_address", data.payment_address);
    if (data.file) form.append("file", data.file);
    return request<void>(marketUrl("/market/listing/create"), {
      method: "POST",
      body: form,
    });
  },
};

/* ============================================================
 * Cart
 * ============================================================ */

export const cartApi = {
  details: () => request<Cart>(marketUrl("/cart/details")),

  addItem: (listingId: number | string) =>
    request<void>(marketUrl(`/cart/add_item/${listingId}`), {
      method: "POST",
    }),

  removeItem: (listingId: number | string) =>
    request<void>(marketUrl(`/cart/remove_item/${listingId}`), {
      method: "POST",
    }),

  addShipping: (details: string) =>
    request<void>(marketUrl("/cart/shipping_details/add"), {
      method: "POST",
      body: JSON.stringify({ details }),
    }),

  checkout: () =>
    request<{ invoice_id: number; address: string }>(
      marketUrl("/cart/checkout"),
      { method: "POST" },
    ),
};

/* ============================================================
 * Orders
 * ============================================================ */

export const orderApi = {
  vendorOrders: () => request<Order[]>(marketUrl("/vendor/orders")),
  customerOrders: () => request<Order[]>(marketUrl("/customer/orders")),
};

/* ============================================================
 * Invoices
 * ============================================================ */

export const invoiceApi = {
  get: (id: number | string) =>
    request<Invoice>(invoiceUrl(`/invoice/${id}`)),

  /** Confirm an invoice (dev/preview mode only - in production this is done by the backend). */
  confirm: (id: number | string) =>
    request<{ status: string; invoice: Invoice }>(
      invoiceUrl(`/invoice/${id}/confirm`),
      { method: "POST" },
    ),
};
