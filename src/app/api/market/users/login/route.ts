import { NextResponse } from "next/server";
import { createSession } from "@/lib/mock-session";
import { MOCK_USERS } from "@/lib/mock-data";

/** POST /api/market/users/login  body: { username, password } */
export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return NextResponse.json(
      { detail: "Username and password are required." },
      { status: 400 },
    );
  }
  const user = MOCK_USERS[username];
  if (!user || user.password !== password) {
    return NextResponse.json(
      { detail: "Invalid username or password." },
      { status: 401 },
    );
  }
  if (user.status !== "active") {
    return NextResponse.json(
      { detail: "Account is not active. Please activate via email." },
      { status: 403 },
    );
  }
  await createSession(user.username);
  return new NextResponse(null, { status: 200 });
}
