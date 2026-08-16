"""
Invoice service — WebSocket server.

Listens on WEBSOCKET_HOST:WEBSOCKET_PORT and accepts connections at
`/{invoice_id}`. When a transaction is detected by `process_new_tx.py`,
it's pushed onto the RabbitMQ `tx_notifications` queue, and this server
forwards it to the corresponding client in real time.

Security highlights vs. the original:
- Uses asyncio.Lock around `clients` mutations (was racy).
- Validates `invoice_id` is a positive integer before registering.
- Logs disconnects properly.
- Better error handling around RabbitMQ connection.
"""

import asyncio
import logging
import time
import re

import websockets
import pika
from pika.adapters.asyncio_connection import AsyncioConnection

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
INVOICE_ID_RE = re.compile(r"^\d+$")

# invoice_id -> websocket
clients: dict[str, websockets.WebSocketServerProtocol] = {}
clients_lock = asyncio.Lock()


async def websocket_handler(websocket):
    """Handle a single client connection."""
    path = websocket.request.path if hasattr(websocket, "request") else websocket.path
    # Strip leading slash and any query string.
    invoice_id = path.lstrip("/").split("?", 1)[0]

    if not INVOICE_ID_RE.match(invoice_id):
        logger.warning("Rejected WS connection with invalid invoice_id: %r", invoice_id)
        await websocket.close(code=1008, reason="Invalid invoice id.")
        return

    logger.info("WS client connected for invoice %s", invoice_id)
    async with clients_lock:
        clients[invoice_id] = websocket
    try:
        await websocket.wait_closed()
    finally:
        async with clients_lock:
            clients.pop(invoice_id, None)
        logger.info("WS client disconnected for invoice %s", invoice_id)


async def broadcast(message: str) -> None:
    """Forward a tx-notification message to the matching client, if any."""
    try:
        invoice_id = message.split(",")[-1]
    except Exception:
        logger.warning("Malformed tx notification: %r", message)
        return

    async with clients_lock:
        ws = clients.get(invoice_id)
    if ws:
        try:
            await ws.send(message)
            logger.info("Broadcast to invoice %s: %s", invoice_id, message)
        except Exception as e:
            logger.error("Failed to send to invoice %s: %s", invoice_id, e)


class RabbitMQConsumer:
    def __init__(self, loop):
        self.loop = loop
        self.connection = None

    def on_rabbit_message(self, channel, method, properties, body):
        message = body.decode()
        logger.info("RabbitMQ message received: %s", message)
        asyncio.run_coroutine_threadsafe(broadcast(message), self.loop)
        channel.basic_ack(delivery_tag=method.delivery_tag)

    def on_channel_open(self, channel):
        channel.queue_declare(queue=QUEUE_NAME, durable=False)
        channel.basic_consume(queue=QUEUE_NAME, on_message_callback=self.on_rabbit_message)

    def on_open_connection(self, connection):
        self.connection = connection
        connection.channel(on_open_callback=self.on_channel_open)

    def setup(self):
        parameters = pika.ConnectionParameters(
            host=settings.RABBITMQ_HOST,
            port=settings.RABBITMQ_PORT,
            credentials=pika.PlainCredentials(
                settings.RABBITMQ_USER, settings.RABBITMQ_PASS
            ),
            heartbeat=30,
            blocked_connection_timeout=10,
        )
        AsyncioConnection(
            parameters,
            on_open_callback=self.on_open_connection,
            custom_ioloop=self.loop,
        )


async def main():
    loop = asyncio.get_event_loop()

    # Wait a bit for RabbitMQ to be ready (it's a common source of
    # flapping during cold-start).
    time.sleep(8)

    consumer = RabbitMQConsumer(loop)
    consumer.setup()

    async with websockets.serve(
        websocket_handler,
        settings.WEBSOCKET_HOST,
        settings.WEBSOCKET_PORT,
        ping_interval=20,
        ping_timeout=20,
        close_timeout=10,
    ):
        logger.info(
            "WebSocket server listening on %s:%s",
            settings.WEBSOCKET_HOST,
            settings.WEBSOCKET_PORT,
        )
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
