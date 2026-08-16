import { NextResponse } from "next/server";

/**
 * GET /api/market/market/listing/image/[imageName]
 *
 * In the mock, we return a generated SVG placeholder so listings have
 * a visual even without an actual image upload.
 *
 * In production, the Python backend streams the real uploaded file.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ imageName: string }> },
) {
  const { imageName } = await params;
  // Generate a deterministic color from the image name.
  const hue = Array.from(imageName).reduce(
    (acc, c) => (acc * 31 + c.charCodeAt(0)) % 360,
    7,
  );
  const initial = imageName.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "N";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue}, 70%, 55%)" />
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 70%, 45%)" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#g)" />
  <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="120" font-weight="700" fill="white" fill-opacity="0.85" text-anchor="middle" dominant-baseline="central">${initial}</text>
  <text x="50%" y="86%" font-family="system-ui, sans-serif" font-size="14" fill="white" fill-opacity="0.7" text-anchor="middle">NERVA Market</text>
</svg>`;
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
