/**
 * Mock session helpers for the dev/preview API routes.
 *
 * Uses Prisma + SQLite so sessions and carts survive server restarts.
 * In production, the Python backend (FastAPI + Redis) handles sessions.
 *
 * NOTE: Next.js 16 made `cookies()` and `headers()` async.
 */

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import type { Cart, User } from "@/types";
import { db } from "./db";
import { MOCK_USERS, ensureMockUsersSeeded } from "./mock-data";

const SESSION_COOKIE = "nerva_mock_session";
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

/** Detect if the request came through HTTPS (behind the preview proxy). */
async function isHttps(): Promise<boolean> {
  const h = await headers();
  const forwardedProto = h.get("x-forwarded-proto");
  if (forwardedProto === "https") return true;
  return false;
}

/** Read the session cookie and return the associated username (or null). */
export async function getSessionUsername(): Promise<string | null> {
  await ensureMockUsersSeeded();
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return null;

  // Look up in DB.
  const session = await db.session.findUnique({
    where: { id },
    select: { username: true, expiresAt: true },
  });
  if (!session) return null;

  // Check expiry.
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id } }).catch(() => {});
    await db.cart.delete({ where: { sessionId: id } }).catch(() => {});
    return null;
  }
  return session.username;
}

/** Create a new session for the given username and set the cookie. */
export async function createSession(username: string): Promise<void> {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({
    data: { id, username, expiresAt },
  });

  const https = await isHttps();
  const c = await cookies();
  c.set(SESSION_COOKIE, id, {
    httpOnly: true,
    // SameSite=None + Secure=true when behind HTTPS proxy (preview).
    // SameSite=Lax + Secure=false for local HTTP dev.
    sameSite: https ? "none" : "lax",
    secure: https,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

/** Destroy the current session. */
export async function destroySession(): Promise<void> {
  const c = await cookies();
  const id = c.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.session.delete({ where: { id } }).catch(() => {});
    await db.cart.delete({ where: { sessionId: id } }).catch(() => {});
  }
  c.delete(SESSION_COOKIE);
}

/** Get or create a cart for the current session. */
export async function getOrCreateCart(): Promise<Cart | null> {
  const c = await cookies();
  const id = c.get(SESSION_COOKIE)?.value;
  if (!id) return null;

  let row = await db.cart.findUnique({ where: { sessionId: id } });
  if (!row) {
    row = await db.cart.create({
      data: { sessionId: id, items: "[]" },
    });
  }
  return {
    cart_id: id,
    items: JSON.parse(row.items),
    shipping_data: row.shippingData ?? undefined,
  };
}

/** Update the current session's cart. */
export async function saveCart(cart: Cart): Promise<void> {
  const c = await cookies();
  const id = c.get(SESSION_COOKIE)?.value;
  if (!id) return;
  await db.cart.upsert({
    where: { sessionId: id },
    update: {
      items: JSON.stringify(cart.items),
      shippingData: cart.shipping_data ?? null,
    },
    create: {
      sessionId: id,
      items: JSON.stringify(cart.items),
      shippingData: cart.shipping_data ?? null,
    },
  });
}

/** Clear the current session's cart. */
export async function clearCart(): Promise<void> {
  const c = await cookies();
  const id = c.get(SESSION_COOKIE)?.value;
  if (!id) return;
  await db.cart.delete({ where: { sessionId: id } }).catch(() => {});
}

/** Get the current session's user object from the mock user DB. */
export async function getCurrentUser(): Promise<User | null> {
  const username = await getSessionUsername();
  if (!username) return null;

  // Look up in DB (mock users are seeded into the DB on first call).
  const dbUser = await db.user.findUnique({
    where: { username },
    select: { username: true, email: true, status: true, isVendor: true },
  });
  if (!dbUser) return null;
  return {
    username: dbUser.username,
    email: dbUser.email,
    status: dbUser.status as "unverified" | "active" | "deactivated",
    is_vendor: dbUser.isVendor,
  };
}
