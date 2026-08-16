"""
Invoice service — REST API.

Routes:
  GET  /                  → service banner
  GET  /health            → liveness probe
  POST /invoice/create    → create an invoice (returns invoice_id + payment address)
  GET  /invoice/{id}      → fetch an invoice by id

Security highlights vs. the original:
- Proper 1-tuple parameterisation (`(arg,)`).
- Pydantic validation of the amount.
- Healthcheck endpoint.
- Structured logging.
- No wildcard CORS — uses the configured origins only.
"""

import logging
from pydantic import BaseModel, Field

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .dependencies import get_db

logger = logging.getLogger(__name__)

# Optional: only import the wallet RPC if available — the service can
# still boot in "stub" mode (e.g. for tests) without it.
try:
    from nerva.wallet_rpc import WalletRPC
    HAVE_WALLET = True
except ImportError:
    HAVE_WALLET = False
    logger.warning("nerva-py not installed — invoice service will run in stub mode.")


app = FastAPI(
    title="NERVA Marketplace — Invoice Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie"],
)


@app.get("/")
def root():
    return {"service": "nerva-invoices", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "wallet": "connected" if HAVE_WALLET else "stub"}


class InvoiceCreateRequest(BaseModel):
    amount: float = Field(..., gt=0, le=1_000_000)
    # The vendor's NERVA payment address. If provided, payments go directly
    # to the vendor (non-custodial). If not provided, the service generates
    # a subaddress from the marketplace wallet (custodial, legacy mode).
    payment_address: str = Field(None, min_length=60, max_length=200)


@app.post("/invoice/create")
async def create_invoice(req: InvoiceCreateRequest, sql_client=Depends(get_db)):
    if req.payment_address:
        # Non-custodial mode: use the vendor's own payment address.
        address = req.payment_address
    elif HAVE_WALLET:
        # Custodial mode: generate a subaddress from the marketplace wallet.
        wallet = WalletRPC(host=settings.WALLET_RPC_HOST, port=settings.WALLET_RPC_PORT)
        try:
            address = (await wallet.create_address(account_index=0))["result"]["address"]
        except Exception as e:
            logger.error("Wallet RPC error: %s", e)
            raise HTTPException(status_code=502, detail="Wallet service unavailable.")
    else:
        # Stub mode — no wallet available and no vendor address provided.
        import uuid
        address = f"NV-STUB-{uuid.uuid4().hex[:48]}"

    async with sql_client.cursor() as cur:
        await cur.execute(
            "INSERT INTO invoices (amount, address) VALUES (%s, %s)",
            (req.amount, address),
        )
        invoice_id = cur.lastrowid

    logger.info("Invoice %s created for %s XNV -> %s", invoice_id, req.amount, address)
    return {"address": address, "invoice_id": invoice_id}


@app.get("/invoice/{invoice_id}")
async def get_invoice(invoice_id: int, sql_client=Depends(get_db)):
    async with sql_client.cursor() as cur:
        await cur.execute(
            "SELECT * FROM invoices WHERE invoice_id = %s",
            (invoice_id,),
        )
        invoice = await cur.fetchone()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
    return invoice
