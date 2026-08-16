"""
Market service — listing routes (browse, detail, create, image).

Security highlights vs. the original:
- Proper 1-tuple parameterisation (`(arg,)`).
- Image upload: strict content-type + extension + magic-byte validation,
  enforced via `HTTPException` (not `assert`).
- `get_image`: rejects any `image_name` containing `/`, `\\` or `..`
  (path-traversal hardening).
- `create_listing`: actual vendor authorisation check.
- Rate limiting on create.
"""

import os
import re
import uuid
import imghdr
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Cookie, File, UploadFile, Form, Request
from fastapi.responses import FileResponse

from .config import settings
from .dependencies import get_db, get_sessions, Sessions, check_rate_limit

logger = logging.getLogger(__name__)
market_router = APIRouter()


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class ListingStorage:
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    VALID_FILE_EXTENSIONS = {"jpg", "jpeg", "png"}
    VALID_MIME_TYPES = {"image/jpeg", "image/png"}

    def __init__(self):
        self.storage_root = os.path.abspath(
            os.path.join(os.getcwd(), "listing_image_storage")
        )
        os.makedirs(self.storage_root, exist_ok=True)

    async def add_file(self, file: UploadFile, filetype: str) -> str:
        img_id = str(uuid.uuid4())
        path = os.path.join(self.storage_root, f"{img_id}.{filetype}")
        with open(path, "wb") as f:
            f.write(await file.read())
        return f"{img_id}.{filetype}"


# Validate image_name to prevent path traversal.
_IMAGE_NAME_RE = re.compile(r"^[a-zA-Z0-9_-]+\.(jpg|jpeg|png)$", re.IGNORECASE)


def _validate_image_name(image_name: str) -> None:
    if not image_name or len(image_name) > 255:
        raise HTTPException(status_code=400, detail="Invalid image name.")
    if "/" in image_name or "\\" in image_name or ".." in image_name:
        raise HTTPException(status_code=400, detail="Invalid image name.")
    if not _IMAGE_NAME_RE.match(image_name):
        raise HTTPException(status_code=400, detail="Invalid image name.")


# ============================================================
# Browse / detail
# ============================================================

@market_router.get("/market/listings")
async def get_listings(rds_client=Depends(get_db)):
    async with rds_client.cursor() as cur:
        await cur.execute("SELECT * FROM listings ORDER BY create_time DESC LIMIT 20")
        return await cur.fetchall()


@market_router.get("/market/listing/{listing_id}")
async def get_listing_details(listing_id: int, rds_client=Depends(get_db)):
    async with rds_client.cursor() as cur:
        await cur.execute(
            "SELECT * FROM listings WHERE listing_id = %s",
            (listing_id,),  # NOTE the comma — 1-tuple
        )
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Listing not found.")
    return row


# ============================================================
# Create listing
# ============================================================

@market_router.post("/market/listing/create")
async def create_listing(
    request: Request,
    session_id: Optional[str] = Cookie(None, alias=settings.SESSION_COOKIE_NAME),
    session_storage: Sessions = Depends(get_sessions),
    rds_client=Depends(get_db),
    title: str = Form(..., min_length=3, max_length=120),
    description: str = Form(..., min_length=10, max_length=2048),
    price_xnv: float = Form(..., gt=0, le=1_000_000),
    payment_address: str = Form(..., min_length=60, max_length=200),
    file: UploadFile = File(...),
):
    # ---- Auth ----
    if not session_id:
        raise HTTPException(status_code=401, detail="Must be logged in to create a listing.")
    username = session_storage.get_user_from_session(session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    if not session_storage.get_is_vendor_from_session(session_id):
        raise HTTPException(status_code=403, detail="Only vendor accounts can create listings.")

    # ---- Rate limit ----
    ip = _client_ip(request)
    if not check_rate_limit(
        session_storage, "create_listing", ip, settings.RATE_LIMIT_CREATE_LISTING_PER_MIN
    ):
        raise HTTPException(
            status_code=429,
            detail="Too many listing creations. Please try again later.",
        )

    # ---- File validation ----
    if file.size and file.size > ListingStorage.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=422,
            detail=f"File too large (max {ListingStorage.MAX_FILE_SIZE // (1024*1024)}MB).",
        )

    ext = (file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "").lower()
    if ext not in ListingStorage.VALID_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail="Invalid file extension. PNG, JPEG only.",
        )

    if file.content_type not in ListingStorage.VALID_MIME_TYPES:
        raise HTTPException(
            status_code=422,
            detail="Invalid content-type. PNG or JPEG only.",
        )

    contents = await file.read()
    magic = imghdr.what(None, h=contents)
    if magic not in ListingStorage.VALID_FILE_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail="File content does not match a valid image format.",
        )

    # ---- Validate payment address ----
    addr = payment_address.strip()
    if not re.match(r'^(NV|NS|Niz)', addr):
        raise HTTPException(
            status_code=422,
            detail="Payment address must start with NV, NS, or Niz.",
        )

    # Re-rewind not needed — we have contents. Store from memory.
    storage = ListingStorage()
    img_path = os.path.join(storage.storage_root, f"{uuid.uuid4()}.{magic}")
    with open(img_path, "wb") as f:
        f.write(contents)
    image_name = os.path.basename(img_path)

    # ---- DB insert ----
    async with rds_client.cursor() as cur:
        await cur.execute(
            """
            INSERT INTO listings (title, description, image_name, price_xnv, vendor, payment_address)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (title, description, image_name, price_xnv, username, addr),
        )
        listing_id = cur.lastrowid

    logger.info("Listing %s created by vendor %s", listing_id, username)
    return {"listing_id": listing_id, "status": "created"}


# ============================================================
# Listing image
# ============================================================

@market_router.get("/market/listing/image/{image_name}")
async def get_image(image_name: str, rds_client=Depends(get_db)):
    _validate_image_name(image_name)
    async with rds_client.cursor() as cur:
        await cur.execute(
            "SELECT image_name FROM listings WHERE image_name = %s",
            (image_name,),
        )
        row = await cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Image not found.")

    storage = ListingStorage()
    file_path = os.path.join(storage.storage_root, image_name)
    # Final safety check: ensure the resolved path is still inside storage_root.
    if not os.path.abspath(file_path).startswith(storage.storage_root + os.sep):
        raise HTTPException(status_code=400, detail="Invalid path.")
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Image file missing.")

    ext = image_name.rsplit(".", 1)[-1].lower()
    return FileResponse(file_path, media_type=f"image/{ext}")
