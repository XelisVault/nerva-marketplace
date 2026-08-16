import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";
import { MOCK_USERS, ensureMockUsersSeeded } from "@/lib/mock-data";
import { createSession } from "@/lib/mock-session";

/** POST /api/market/users/login  body: { username, password } */
export async function POST(req: Request) {
  await ensureMockUsersSeeded();
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json(
      { detail: "Username and password are required." },
      { status: 400 },
    );
  }

  // Check DB (mock users are seeded into the DB on first call).
  const dbUser = await db.user.findUnique({ where: { username } });
  if (!dbUser) {
    return NextResponse.json(
      { detail: "Invalid username or password." },
      { status: 401 },
    );
  }

  // Password check: mock users have password stored as "mock$<plaintext>".
  // Users registered via the API have scrypt hashes.
  if (dbUser.password.startsWith("mock$")) {
    if (dbUser.password !== `mock$${password}`) {
      return NextResponse.json(
        { detail: "Invalid username or password." },
        { status: 401 },
      );
    }
  } else {
    // scrypt hash verification
    const [scheme, salt, hash] = dbUser.password.split("$");
    if (scheme !== "scrypt") {
      return NextResponse.json(
        { detail: "Invalid username or password." },
        { status: 401 },
      );
    }
    const argon2 = await import("crypto");
    const isValid = await new Promise<boolean>((resolve) => {
      argon2.scrypt(password, salt, 64, (err, derived) => {
        if (err) {
          resolve(false);
          return;
        }
        resolve(derived.toString("hex") === hash);
      });
    });
    if (!isValid) {
      return NextResponse.json(
        { detail: "Invalid username or password." },
        { status: 401 },
      );
    }
  }

  if (dbUser.status !== "active") {
    return NextResponse.json(
      { detail: "Account is not active." },
      { status: 403 },
    );
  }

  await createSession(dbUser.username);
  return new NextResponse(null, { status: 200 });
}

// Suppress unused import warning.
void MOCK_USERS;
