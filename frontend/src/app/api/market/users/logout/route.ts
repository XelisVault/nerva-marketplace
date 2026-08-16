import { NextResponse } from "next/server";
import { destroySession } from "@/lib/mock-session";

/** POST /api/market/users/logout */
export async function POST() {
  await destroySession();
  return new NextResponse(null, { status: 200 });
}
