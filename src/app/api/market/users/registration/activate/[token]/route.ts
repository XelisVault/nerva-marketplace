import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";

/** POST /api/market/users/registration/activate/[token] */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json(
      { detail: "Missing activation token." },
      { status: 400 },
    );
  }
  // In the mock, any token activates any unverified user (dev only).
  const store = getStore();
  for (const u of store.users.values()) {
    if (u.status === "unverified") {
      u.status = "active";
    }
  }
  return new NextResponse(null, { status: 200 });
}
