"""
Market service — dependencies (DB + sessions + rate limiting).
"""

import copy
import json
import time
import uuid
import logging
from typing import Optional

import redis
import aiomysql

from .config import settings

logger = logging.getLogger(__name__)

db_config = {
    "host": settings.DB_HOST,
    "port": settings.DB_PORT,
    "user": settings.DB_USER,
    "password": settings.DB_PASS,
    "db": settings.DB_NAME,
    "autocommit": True,
    "charset": "utf8mb4",
}


async def get_db():
    """Yield a MySQL connection with a DictCursor."""
    config = copy.deepcopy(db_config)
    config["cursorclass"] = aiomysql.cursors.DictCursor
    conn = await aiomysql.connect(**config)
    try:
        yield conn
    finally:
        conn.close()


class Sessions:
    """Redis-backed session store with TTL and cart management."""

    def __init__(self):
        self.client = redis.StrictRedis(
            host=settings.CACHE_HOST,
            port=settings.CACHE_PORT,
            db=0,
            password=settings.CACHE_PASS,
            decode_responses=True,
            socket_timeout=5,
            socket_connect_timeout=5,
        )

    # ---- Sessions ----

    def make_new_user_session(self, username: str, is_vendor: bool = False) -> str:
        session_id = str(uuid.uuid4())
        payload = json.dumps({"username": username, "is_vendor": bool(is_vendor)})
        # CRITICAL: set TTL so sessions don't live forever.
        self.client.set(session_id, payload, ex=settings.SESSION_TTL_SECONDS)
        return session_id

    def get_session_data(self, session_id: Optional[str]) -> Optional[dict]:
        if not session_id:
            return None
        raw = self.client.get(session_id)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            logger.warning("Corrupt session payload for id=%s", session_id)
            return None

    def get_user_from_session(self, session_id: Optional[str]) -> Optional[str]:
        data = self.get_session_data(session_id)
        return data.get("username") if data else None

    def get_is_vendor_from_session(self, session_id: Optional[str]) -> bool:
        data = self.get_session_data(session_id)
        return bool(data and data.get("is_vendor"))

    def destroy_session(self, session_id: Optional[str]) -> None:
        if session_id:
            self.client.delete(session_id)

    # ---- Cart (stored inside the session payload) ----

    def _read_session(self, session_id: str) -> dict:
        return self.get_session_data(session_id) or {}

    def _write_session(self, session_id: str, data: dict) -> None:
        # Refresh TTL on every write so active users stay signed in.
        self.client.set(
            session_id,
            json.dumps(data),
            ex=settings.SESSION_TTL_SECONDS,
        )

    def make_new_cart_for_session(self, session_id: str) -> str:
        data = self._read_session(session_id)
        cart_id = str(uuid.uuid4())
        data["cart"] = {"cart_id": cart_id, "items": []}
        self._write_session(session_id, data)
        return cart_id

    def get_cart_id_from_session(self, session_id: str) -> Optional[str]:
        data = self._read_session(session_id)
        cart = data.get("cart")
        return cart.get("cart_id") if cart else None

    def get_cart_from_session(self, session_id: str) -> Optional[dict]:
        data = self._read_session(session_id)
        return data.get("cart")

    def add_item_to_session_cart(self, session_id: str, listing_id: int) -> None:
        data = self._read_session(session_id)
        if "cart" not in data:
            data["cart"] = {"cart_id": str(uuid.uuid4()), "items": []}
        if listing_id not in data["cart"]["items"]:
            data["cart"]["items"].append(listing_id)
        self._write_session(session_id, data)

    def remove_item_from_session_cart(self, session_id: str, listing_id: int) -> None:
        data = self._read_session(session_id)
        cart = data.get("cart")
        if not cart:
            return
        cart["items"] = [i for i in cart["items"] if i != listing_id]
        self._write_session(session_id, data)

    def update_cart_shipping_data(self, session_id: str, shipping_data: str) -> None:
        data = self._read_session(session_id)
        if "cart" not in data:
            data["cart"] = {"cart_id": str(uuid.uuid4()), "items": []}
        data["cart"]["shipping_data"] = shipping_data
        self._write_session(session_id, data)

    def clear_cart(self, session_id: str) -> None:
        data = self._read_session(session_id)
        data.pop("cart", None)
        self._write_session(session_id, data)


def get_sessions():
    """Yield a Sessions instance (one per request)."""
    yield Sessions()


# ---- Rate limiting (sliding window in Redis) ----

def rate_limit_key(action: str, ip: str) -> str:
    return f"ratelimit:{action}:{ip}"


def check_rate_limit(
    sessions: Sessions,
    action: str,
    ip: str,
    max_per_minute: int,
) -> bool:
    """Return True if allowed, False if rate-limited."""
    key = rate_limit_key(action, ip)
    pipe = sessions.client.pipeline()
    now = int(time.time())
    window_start = now - 60
    pipe.zremrangebyscore(key, 0, window_start)  # drop old entries
    pipe.zadd(key, {str(now): now})
    pipe.zcard(key)
    pipe.expire(key, 70)  # TTL so the key cleans itself up
    _, _, count, _ = pipe.execute()
    return count <= max_per_minute
