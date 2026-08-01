import uuid
from pydantic import BaseModel

from fastapi import FastAPI, Request, Depends, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .dependencies import get_db

from nerva.wallet_rpc import WalletRPC

app = FastAPI()

# CORS
origins = settings.CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Set-Cookie"]
)

# route handlers
@app.get("/")
def root():
    return "Nerva Invoices"

class InvoiceCreateRequest(BaseModel):
    amount: float
@app.post("/invoice/create")
async def create_invoice(request:InvoiceCreateRequest, sql_client=Depends(get_db)):
    wallet = WalletRPC(host=settings.WALLET_RPC_HOST, port=settings.WALLET_RPC_PORT)
    address = (await wallet.create_address(account_index=0))['result']['address']
    async with sql_client.cursor() as cur:
        # make the record the invoice in the database
        await cur.execute("INSERT INTO invoices (amount, address) VALUES (%s, %s)", (request.amount, address))
        invoice_id = cur.lastrowid
    return {"address": address, "invoice_id": invoice_id}

@app.get("/invoice/{invoice_id}")
async def get_invoice(invoice_id:str, sql_client=Depends(get_db)):
    async with sql_client.cursor() as cur:
        await cur.execute("SELECT * FROM invoices WHERE invoice_id=%s", (invoice_id))
        invoice = await cur.fetchone()
    return invoice