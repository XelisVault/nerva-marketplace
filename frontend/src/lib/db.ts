import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * Shared Prisma client.
 *
 * In dev/preview, this connects to the SQLite database at prisma/dev.db.
 * In production, the Next.js frontend talks to the Python backend over HTTP;
 * Prisma is NOT used in production.
 */

// Ensure the DB file's directory exists (avoids "unable to open database" on first run).
const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./prisma/dev.db";
const dbDir = path.dirname(dbPath);
if (!path.isAbsolute(dbDir)) {
  // Relative paths are resolved from CWD.
  try {
    fs.mkdirSync(path.resolve(process.cwd(), dbDir), { recursive: true });
  } catch {
    // Directory may already exist or CWD may not be writable — ignore.
  }
} else {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch {
    // ignore
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
