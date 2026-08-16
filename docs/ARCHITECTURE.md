# Architecture

## Overview

NERVA Marketplace is a three-tier system:

1. **Frontend** - a Next.js 16 single-page app served to the browser.
   Talks to the backend over HTTP + WebSocket.
2. **Market service** - a Python FastAPI app that manages users,
   listings, carts, and orders. Backed by MySQL and Redis.
3. **Invoice service** - a Python FastAPI app + WebSocket server that
   manages invoices and pushes real-time payment notifications to the
   browser. Backed by MySQL, RabbitMQ, and a NERVA wallet daemon.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Browser (Next.js SPA)                                                       │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Listings    │  │ Cart        │  │ Invoice     │  │ Auth (React Context) │ │
│  │ TanStack Q. │  │ Zustand     │  │ WebSocket   │  │                      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │ HTTP            │ HTTP            │ HTTP + WS          │ HTTP
          ▼                 ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  market_service  :8080                      invoice_service  :8880 (REST)     │
│  ─────────────────────────                  ──────────────────────────       │
│  • /users/*        ──┐                      • /invoice/create                │
│  • /market/*         │                      • /invoice/{id}                  │
│  • /cart/*         ──┤                      • /health                        │
│  • /vendor/orders    │                                                       │
│  • /customer/orders  │                      invoice_service  :2052 (WS)      │
│                      │                      ──────────────────────────       │
│  MySQL (market DB)   │                      • /{invoice_id} (WS)             │
│  Redis (sessions,    │                                                       │
│   rate limit, carts) │                      nerva-wallet-rpc :28082          │
│                      │                      ──────────────────────────       │
│                      │                      • JSON-RPC                       │
│                      │                      • --tx-notify → process_new_tx   │
│                      │                                                       │
│                      │     RabbitMQ          │                               │
│                      └──── "tx_notifications" queue ────────────────────────│
│                                                                            │
│  MySQL (invoices_db) ◄──── invoices table (pending / confirmed)             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data flow - checkout

```
Browser            market_service         invoice_service        nerva-wallet-rpc
   │                     │                       │                       │
   │  POST /cart/checkout                       │                       │
   │ ──────────────────► │                       │                       │
   │                     │  POST /invoice/create │                       │
   │                     │ ───────────────────► │                       │
   │                     │                       │  wallet.create_address│
   │                     │                       │ ────────────────────►│
   │                     │                       │ ◄── address ─────────│
   │                     │                       │                       │
   │                     │                       │  INSERT INTO invoices│
   │                     │ ◄── {invoice_id, address} ──                │
   │                     │                       │                       │
   │                     │  INSERT INTO orders   │                       │
   │                     │  INSERT INTO order_items                      │
   │                     │  INSERT INTO order_shipping                   │
   │                     │  UPDATE listings SET qty = qty - 1           │
   │                     │                       │                       │
   │ ◄── {invoice_id} ── │                       │                       │
   │                     │                       │                       │
   │  navigate to /invoice/{invoice_id}         │                       │
   │                     │                       │                       │
   │  WS connect to :2052/{invoice_id}          │                       │
   │ ──────────────────────────────────────────►│                       │
   │                     │                       │                       │
   │ (buyer sends XNV from their wallet) ───────────────────────────────►│
   │                     │                       │                       │
   │                     │                       │      tx detected ────►│
   │                     │                       │      process_new_tx()│
   │                     │                       │      UPDATE invoices │
   │                     │                       │        SET confirmed │
   │                     │                       │      push to RabbitMQ│
   │                     │                       │ ◄──                   │
   │ ◄── WS message: txId,amount,confirmations ──│                       │
   │                     │                       │                       │
   │  UI shows "Payment confirmed"              │                       │
```

## Data model

### Market service (`market` database)

```sql
users(username PK, email UNIQUE, password, status, is_vendor, created_at)
user_validation_tokens(token PK, username FK, created_at)
listings(listing_id PK AI, vendor FK, title, description, image_name,
         price_xnv DECIMAL(20,8), quantity_available, created_at)
orders(order_id PK AI, vendor FK, buyer FK, invoice_id, created_at)
order_items(order_item_id PK AI, order_id FK, item_listing_id FK)
order_shipping(id PK AI, order_id FK UNIQUE, shipping_note TEXT, shipping_status)
```

### Invoice service (`invoices_db` database)

```sql
invoices(invoice_id PK AI, amount DECIMAL(20,8), address UNIQUE,
         status ENUM('pending','confirmed'), created_at)
```

### Session storage (Redis)

```
session:{uuid} = {"username":"…","is_vendor":0|1,"cart":{...}}  TTL 7200s
ratelimit:{action}:{ip} = ZSET of timestamps within last 60s
```

## Why two databases?

The market and invoice services are deliberately decoupled:

- The **market service** doesn't need to know about wallets, transactions,
  or confirmations. It just records "this order has invoice_id N".
- The **invoice service** doesn't need to know about users, listings, or
  shipping. It just records "invoice N is for amount X to address A".
- The two services communicate via a tiny REST API (`POST /invoice/create`
  and `GET /invoice/{id}`) - they could be split into separate repos or
  deployed by separate teams without changing either codebase.

## Why RabbitMQ + WebSocket?

The `nerva-wallet-rpc` daemon supports a `--tx-notify` flag that runs a
shell command whenever a transaction is detected. We point it at
`process_new_tx.py`, which:

1. Verifies the transaction against the wallet.
2. Marks the matching invoice as `confirmed` in MySQL.
3. Pushes a notification onto the RabbitMQ `tx_notifications` queue.

A separate WebSocket server consumes that queue and forwards each
notification to the browser that's currently viewing the invoice page.
This decouples the **detection** (synchronous, must be fast) from the
**notification** (async, can retry).

Without RabbitMQ, `process_new_tx.py` would need to know which browser
is currently viewing which invoice - that's state that belongs in the
WebSocket server, not in a one-shot script.

## Frontend architecture

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout: AuthProvider, ThemeProvider, Header, Footer
│   ├── page.tsx              # Home page (hero + featured listings)
│   ├── listings/page.tsx     # Browse + search + sort
│   ├── listing/[id]/page.tsx # Listing detail
│   ├── cart/page.tsx         # Cart + checkout
│   ├── invoice/[id]/page.tsx # Invoice + WS payment watcher
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── activate/[token]/page.tsx
│   ├── create-listing/page.tsx   # vendor-only
│   ├── customer/orders/page.tsx
│   ├── vendor/orders/page.tsx    # vendor-only
│   ├── about/page.tsx
│   ├── privacy/page.tsx
│   ├── not-found.tsx
│   └── api/                  # Mock API (dev/preview only)
│       ├── market/...        # mirrors Python market_service URLs
│       └── invoice/...       # mirrors Python invoice_service URLs
├── components/
│   ├── ui/                   # shadcn/ui (button, card, input, ...)
│   ├── layout/               # Header, Footer, ThemeToggle
│   ├── marketplace/          # ListingCard, NervaBadge, ImageWithFallback
│   ├── auth/                 # ProtectedRoute
│   └── common/               # LoadingState, ErrorState, EmptyState
├── lib/
│   ├── api-client.ts         # Typed HTTP client
│   ├── auth.tsx              # AuthProvider + useAuth hook
│   ├── cart-store.ts         # Zustand store
│   ├── config.ts             # Env-based config + URL resolvers
│   ├── db.ts                 # Prisma client (dev only)
│   ├── mock-data.ts          # Demo listings + users
│   ├── mock-session.ts       # Cookie-based mock sessions (dev only)
│   ├── mock-store.ts         # In-memory store shared by mock API routes
│   └── seed.ts               # bun run db:seed
├── hooks/                    # use-mobile, use-toast
└── types/                    # Shared TypeScript types
```

## Dev/preview vs. production

The frontend supports two modes:

| Mode | Trigger | Behaviour |
|------|---------|-----------|
| **Dev / preview** | `NEXT_PUBLIC_MARKET_API_BASE_URL` empty | Mock API routes under `/api/market/*` and `/api/invoice/*` serve in-memory data. WebSocket is simulated (payment auto-confirms after ~13s). Prisma + SQLite for any persistent state. |
| **Production** | `NEXT_PUBLIC_MARKET_API_BASE_URL` set | All API calls go to the Python FastAPI backend. WebSocket connects to the real `:2052` server. No Prisma - backend uses MySQL. |

The switch is purely environment-variable based - the same code runs in
both modes. This makes local development frictionless while keeping
production architecture clean.

## Performance considerations

- **Frontend**: TanStack Query caches listings for 30s. Listing images
  are served with `Cache-Control: public, max-age=86400` (24h) - they're
  immutable (UUIDs).
- **Backend**: market service runs Uvicorn with 2 workers (configurable
  via Docker). Redis is used for sessions (TTL 2h) and rate limiting
  (sliding-window ZSET).
- **Database**: indexes on `listings.vendor`, `listings.created_at`,
  `orders.vendor`, `orders.buyer`, `order_items.order_id`,
  `invoices.status`. Schema uses InnoDB with foreign-key constraints.
- **WebSocket**: ping/pong every 20s to keep connections alive through
  proxies.

## Scalability

- The market service is **stateless** (sessions + carts are in Redis) -
  scale it horizontally by adding more Uvicorn workers / containers.
- The invoice service REST API is **stateless** - same.
- The WebSocket server is **stateful** (in-memory `clients` dict). To
  scale beyond one instance, use a sticky-session load balancer or move
  to a distributed pub/sub (e.g. Redis Pub/Sub).
- MySQL can be replaced with any aiomysql-compatible database (e.g.
  PlanetScale, AWS Aurora).
- RabbitMQ can be replaced with any AMQP 0.9.1 broker.

## Failure modes

| Failure | Effect | Mitigation |
|---------|--------|-----------|
| Redis down | Sessions lost → all users logged out. Carts lost. | Run Redis in sentinel/cluster mode. |
| MySQL (market) down | No logins, no listings, no checkout. | Run MySQL in primary/replica setup. |
| MySQL (invoice) down | No new invoices, no status lookup. | Same. |
| RabbitMQ down | Tx notifications don't reach the browser, but invoices still get marked as confirmed (just not visible in real time). Refreshing the invoice page polls the REST endpoint. | Use RabbitMQ quorum queues. |
| nerva-wallet-rpc down | No new subaddresses generated → checkout fails with 502. | Run multiple wallet RPC instances behind a load balancer. |
| Invoice WebSocket down | Browser can't get real-time updates. Polling fallback via REST is a planned feature. | Use a managed WebSocket service. |
