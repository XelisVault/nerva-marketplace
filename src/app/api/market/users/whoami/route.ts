import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/mock-session";

/** GET /api/market/users/whoami */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(user ?? null);
}
