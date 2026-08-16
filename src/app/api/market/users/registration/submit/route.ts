import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";
import { MOCK_USERS } from "@/lib/mock-data";
import argon2 from "crypto";

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = argon2.randomBytes(16).toString("hex");
    argon2.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`scrypt$${salt}$${derived.toString("hex")}`);
    });
  });
}

/** POST /api/market/users/registration/submit  body: { username, email, password } */
export async function POST(req: Request) {
  const { username, email, password } = await req.json().catch(() => ({}));
  if (!username || !email || !password) {
    return NextResponse.json(
      { detail: "username, email and password are required." },
      { status: 400 },
    );
  }
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
    return NextResponse.json(
      { detail: "Username must be 3-32 chars (letters, digits, underscore)." },
      { status: 422 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { detail: "Invalid email address." },
      { status: 422 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { detail: "Password must be at least 8 characters." },
      { status: 422 },
    );
  }

  // Check static mock users first.
  if (MOCK_USERS[username]) {
    return NextResponse.json(
      { detail: "Username is already taken." },
      { status: 409 },
    );
  }

  // Check DB.
  const existing = await db.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
  if (existing) {
    return NextResponse.json(
      { detail: "Username or email already taken." },
      { status: 409 },
    );
  }

  const hashed = await hashPassword(password);
  await db.user.create({
    data: {
      username,
      email,
      password: hashed,
      status: "active", // Auto-activate in dev mode.
      isVendor: 0,
    },
  });

  return new NextResponse(null, { status: 200 });
}
