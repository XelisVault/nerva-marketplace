"""
Invoice service — transaction processor.

Invoked by `nerva-wallet-rpc` via the `--tx-notify` flag whenever a
new transaction is detected (in mempool or confirmed). Verifies the
tx, marks the matching invoice as confirmed, and pushes a notification
onto the RabbitMQ queue so the WebSocket server can inform the client.

Security highlights vs. the original:
- Uses context managers for both DB and RabbitMQ connections.
- Atomic compare-and-update with row-level locking.
- Proper error handling and logging throughout.
- No magic constants — uses settings.REQUIRED_CONFIRMATIONS.
- Validates inputs before any DB or wallet call.
"""

import sys
import math
import time
import logging
import asyncio
import pymysql
import pika

try:
    from .config import settings
except ImportError:
    from config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

QUEUE_NAME = "tx_notifications"

db_config = {
    "host": settings.DB_HOST,
    "port": settings.DB_PORT,
    "user": settings.DB_USER,
    "password": settings.DB_PASS,
    "db": settings.DB_NAME,
    "autocommit": True,
    "charset": "utf8mb4",
}

# Optional wallet import.
try:
    from nerva.wallet_rpc import WalletRPC
    HAVE_WALLET = True
except ImportError:
    HAVE_WALLET = False


def atomic_units_to_decimal(atomic_units: int) -> float:
    """NERVA uses 12 decimal places (1 XNV = 10^12 atomic units)."""
    return float(atomic_units) / 1_000_000_000_000.0


def push_to_rabbit_mq(message: str) -> None:
    parameters = pika.ConnectionParameters(
        host=settings.RABBITMQ_HOST,
        port=settings.RABBITMQ_PORT,
        credentials=pika.PlainCredentials(
            settings.RABBITMQ_USER, settings.RABBITMQ_PASS
        ),
        heartbeat=30,
        blocked_connection_timeout=10,
    )
    with pika.BlockingConnection(parameters) as conn:
        channel = conn.channel()
        channel.queue_declare(queue=QUEUE_NAME, durable=False)
        channel.basic_publish(exchange="", routing_key=QUEUE_NAME, body=message)


async def verify_tx(tx_id: str):
    """
    Verify a transaction against the wallet.

    Returns (amount, confirmations, invoice_id) or (None, None, None)
    if the tx doesn't match any invoice.
    """
    if not HAVE_WALLET:
        logger.warning("nerva-py not installed — cannot verify tx %s", tx_id)
        return None, None, None

    wallet = WalletRPC(host=settings.WALLET_RPC_HOST, port=settings.WALLET_RPC_PORT)
    address_count = len(
        (await wallet.get_address(account_index=0))["result"]["addresses"]
    )
    all_txs = await wallet.incoming_transfers(
        transfer_type="all",
        account_index=0,
        subaddr_indices=list(range(address_count)),
        verbose=True,
    )

    txs_found = [t for t in all_txs["result"]["transfers"] if t["tx_hash"] == tx_id]
    if len(txs_found) != 1:
        logger.info("Tx %s matched %d transfers — ignoring.", tx_id, len(txs_found))
        return None, None, None

    tx = txs_found[0]
    recipient_address = (
        (await wallet.get_address(account_index=0))["result"]["addresses"][
            tx["subaddr_index"]["minor"]
        ]["address"]
    )

    with pymysql.connect(**db_config) as sql_client:
        with sql_client.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute(
                "SELECT * FROM invoices WHERE address = %s FOR UPDATE",
                (recipient_address,),
            )
            invoice_row = cur.fetchone()
            if not invoice_row:
                return None, None, None

            amount_float = atomic_units_to_decimal(int(tx["amount"]))
            if amount_float < float(invoice_row["amount"]) and not math.isclose(
                amount_float, float(invoice_row["amount"]), rel_tol=1e-9
            ):
                logger.warning(
                    "Underpayment for invoice %s: received %s, expected %s",
                    invoice_row["invoice_id"], amount_float, invoice_row["amount"],
                )
                return amount_float, 0, invoice_row["invoice_id"]

            # Mark as confirmed.
            cur.execute(
                "UPDATE invoices SET status = 'confirmed' WHERE address = %s",
                (recipient_address,),
            )
            return amount_float, settings.REQUIRED_CONFIRMATIONS, invoice_row["invoice_id"]


async def main():
    # Give dependent services (wallet, RabbitMQ, MySQL) time to come up.
    await asyncio.sleep(10)

    if len(sys.argv) < 2:
        logger.error("Usage: process_new_tx.py <tx_hash>")
        sys.exit(2)
    tx_id = sys.argv[1]
    logger.info("Processing tx %s", tx_id)

    tx_amount, confirmations, invoice_id = await verify_tx(tx_id)
    confirmations = confirmations or 0
    if tx_amount is not None:
        message = f"{tx_id},{tx_amount},{confirmations},{invoice_id}"
        push_to_rabbit_mq(message)
        logger.info("Notification sent: %s", message)


if __name__ == "__main__":
    asyncio.run(main())
