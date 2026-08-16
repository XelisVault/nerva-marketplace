"""
Market service — FastAPI app, CORS, healthcheck, router wiring.
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .user_routes import router as user_router
from .market_routes import market_router
from .cart_routes import cart_router
from .order_routes import orders_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NERVA Marketplace — Market Service",
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
    return {"service": "nerva-market", "version": "1.0.0"}


@app.get("/health")
def health():
    """Liveness probe — returns 200 if the process is up."""
    return {"status": "ok"}


app.include_router(user_router)
app.include_router(market_router)
app.include_router(cart_router)
app.include_router(orders_router)
