"""
Invoice service — dependencies (MySQL + wallet RPC).
"""

import copy
import logging

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
    config = copy.deepcopy(db_config)
    config["cursorclass"] = aiomysql.cursors.DictCursor
    conn = await aiomysql.connect(**config)
    try:
        yield conn
    finally:
        conn.close()
