/**
 * Mock data store - now backed by Prisma + SQLite.
 *
 * Previously this was an in-memory store on globalThis, which meant sessions
 * and carts were lost every time the dev server restarted. Now everything
 * persists to the local SQLite database (prisma/dev.db).
 *
 * In production, the Python backend uses MySQL + Redis.
 */

import { db } from "./db";

export { db };
