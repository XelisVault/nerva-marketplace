/**
 * Cart store.
 *
 * The original app re-fetched the whole cart on every page load. We keep
 * that pattern (the cart lives in Redis on the backend) but also maintain
 * a small client-side cache for instant UI feedback.
 */

"use client";

import { create } from "zustand";
import { cartApi } from "./api-client";
import type { Cart } from "@/types";

interface CartStore {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  addItem: (listingId: number | string) => Promise<void>;
  removeItem: (listingId: number | string) => Promise<void>;
  clear: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.details();
      set({ cart, loading: false });
    } catch (err) {
      // 422 = no cart yet - not an error, just empty.
      const msg = err instanceof Error ? err.message : "Failed to load cart";
      set({ cart: null, loading: false, error: msg });
    }
  },

  addItem: async (listingId) => {
    await cartApi.addItem(listingId);
    await get().fetch();
  },

  removeItem: async (listingId) => {
    await cartApi.removeItem(listingId);
    await get().fetch();
  },

  clear: () => set({ cart: null, error: null, loading: false }),
}));

/** Number of items currently in the cart (for badge display). */
export function useCartCount(): number {
  return useCartStore((s) => s.cart?.items?.length ?? 0);
}
