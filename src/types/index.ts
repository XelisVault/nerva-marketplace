/**
 * NERVA Marketplace — Shared TypeScript types.
 * These types mirror the Python backend's Pydantic models and DB schema
 * (see backend/market_service/infrastructure/schema.sql and
 *  backend/invoice_service/infrastructure/schema.sql).
 */

export type UserStatus = "unverified" | "active" | "deactivated";

export interface User {
  username: string;
  email: string;
  status: UserStatus;
  is_vendor: number | boolean;
}

export interface Listing {
  listing_id: number;
  vendor: string;
  title: string;
  description: string;
  image_name: string;
  price_xnv: number;
  quantity_available: number;
  create_time?: string;
}

export interface CartItem {
  listing_id: number;
  title: string;
  image_name: string;
  price_xnv: number;
  quantity_available: number;
  vendor: string;
}

export interface Cart {
  cart_id: string;
  items: number[];
  shipping_data?: string;
}

export interface Invoice {
  invoice_id: number;
  amount: number;
  address: string;
  status: "pending" | "confirmed";
  create_time?: string;
}

export interface Order {
  order_id: number;
  create_time: string;
  amount?: number;
  status?: "pending" | "confirmed";
  invoice_status?: "pending" | "confirmed";
  shipping_status?: "pending" | "shipped";
}

export interface InvoiceTransaction {
  txId: string;
  amount: string;
  confirmations: number;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

export interface AuthSession {
  user: User | null;
  authChecked: boolean;
}
