import { NextResponse } from "next/server";
import { getStore } from "@/lib/mock-store";
import { getCurrentUser } from "@/lib/mock-session";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const VALID_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** POST /api/market/market/listing/create — multipart form data. */
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
  const file = formData.get("file") as File | null;

  if (!title || title.length < 3 || title.length > 120) {
    return NextResponse.json(
      { detail: "Title must be 3–120 characters." },
      { status: 422 },
    );
  }
  if (!description || description.length < 10 || description.length > 2048) {
    return NextResponse.json(
      { detail: "Description must be 10–2048 characters." },
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

  const store = getStore();
  const listingId = store.nextListingId++;
  const imageName = `mock-${uuidv4().slice(0, 8)}`;
  store.listings.set(listingId, {
    listing_id: listingId,
    vendor: user.username,
    title,
    description,
    image_name: imageName,
    price_xnv: price,
    quantity_available: 1,
    create_time: new Date().toISOString(),
  });

  return new NextResponse(null, { status: 200 });
}
