/**
 * Mock data for the dev/preview mode.
 *
 * Only contains the two demo user accounts. The marketplace starts empty.
 * Users create their own listings via the create-listing form.
 *
 * In production this data lives in MySQL and is managed by the Python backend.
 */

import type { User } from "@/types";
import { db } from "./db";

export const MOCK_USERS: Record<string, User & { password: string }> = {
  admin: {
    username: "admin",
    email: "admin@nervamarket.example",
    password: "admin123",
    status: "active",
    is_vendor: 1,
  },
  alice: {
    username: "alice",
    email: "alice@example.com",
    password: "alice123",
    status: "active",
    is_vendor: 0,
  },
};

/** Ensure mock users exist in the DB. Called lazily on first API request. */
let seeded = false;
export async function ensureMockUsersSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;
  try {
    for (const u of Object.values(MOCK_USERS)) {
      const existing = await db.user.findUnique({
        where: { username: u.username },
        select: { username: true },
      });
      if (!existing) {
        await db.user.create({
          data: {
            username: u.username,
            email: u.email,
            password: `mock$${u.password}`,
            status: u.status,
            isVendor: u.is_vendor,
          },
        });
      }
    }
  } catch (err) {
    console.error("[mock-data] Failed to seed mock users:", err);
    // Reset the flag so it retries on the next request.
    seeded = false;
  }
}
