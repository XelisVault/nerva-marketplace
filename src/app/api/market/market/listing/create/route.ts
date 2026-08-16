import { NextResponse } from "next/server";
import { db } from "@/lib/mock-store";
import { getCurrentUser } from "@/lib/mock-session";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** POST /api/market/market/listing/create - multipart form data. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { detail: "Must be logged in to create a listing." },
      { status: 401 },
    );
  }
  if (!(user.is_vendor === 1 || user.is_vendor === true)) {
    return NextResponse.json(
      { detail: "Only vendor accounts can create listings." },
      { status: 403 },
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { detail: "Expected multipart/form-data." },
      { status: 400 },
    );
  }
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price_xnv") ?? "");
  const paymentAddress = String(formData.get("payment_address") ?? "").trim();
  const file = formData.get("file") as File | null;

  if (!title || title.length < 3 || title.length > 120) {
    return NextResponse.json(
      { detail: "Title must be 3-120 characters." },
      { status: 422 },
    );
  }
  if (!description || description.length < 10 || description.length > 2048) {
    return NextResponse.json(
      { detail: "Description must be 10-2048 characters." },
      { status: 422 },
    );
  }
  const price = parseFloat(priceRaw);
  if (Number.isNaN(price) || price <= 0 || price > 1_000_000) {
    return NextResponse.json(
      { detail: "Price must be between 0.0001 and 1,000,000 XNV." },
      { status: 422 },
    );
  }
  // Validate NERVA payment address.
  // Normal addresses start with NV, subaddresses with NS, integrated with Niz.
  if (!paymentAddress || paymentAddress.length < 60 || paymentAddress.length > 200) {
    return NextResponse.json(
      { detail: "A valid NERVA payment address is required (60-200 chars, starts with NV/NS/Niz)." },
      { status: 422 },
    );
  }
  if (!/^(NV|NS|Niz)/.test(paymentAddress)) {
    return NextResponse.json(
      { detail: "NERVA payment address must start with NV, NS, or Niz." },
      { status: 422 },
    );
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { detail: "Image file is required." },
      { status: 422 },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { detail: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB).` },
      { status: 422 },
    );
  }
  if (!VALID_FILE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { detail: "Invalid file type. PNG, JPEG, or WebP only." },
      { status: 422 },
    );
  }

  // For the mock, we don't persist the actual file bytes - we store a
  // reference name so the image endpoint can generate a placeholder.
  // In production, the Python backend stores the real file on disk.
  const imageName = `mock-${uuidv4().slice(0, 8)}`;

  const listing = await db.listing.create({
    data: {
      vendor: user.username,
      title,
      description,
      imageName,
      priceXnv: price,
      quantityAvailable: 1,
      paymentAddress,
    },
  });

  return NextResponse.json({
    listing_id: listing.listingId,
    status: "created",
  });
}
