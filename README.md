# NERVA Marketplace

A marketplace to buy and sell goods with NERVA (XNV), the CPU-minable privacy coin.

## What it is

A marketplace where prices are in XNV. Vendors create listings with their own NERVA payment address. Buyers pay the vendor directly. The marketplace never holds funds.

NERVA is a privacy coin, a fork of Monero, mineable only on CPU. No pools, no ASICs. Official site: https://nerva.one

## Quick start (frontend only)

The frontend runs standalone in dev mode with a built-in mock API. No Python, MySQL, or NERVA wallet needed.

```bash
git clone https://github.com/XelisVault/nerva-marketplace.git
cd nerva-marketplace
bun install
DATABASE_URL="file:./dev.db" bun run db:push
DATABASE_URL="file:./dev.db" bun run dev
```

Open http://localhost:3000

Demo accounts:
- `admin` / `admin123` (vendor)
- `alice` / `alice123` (customer)

## Tech stack

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite in dev)

**Backend** (optional, for real payments): Python, FastAPI, MySQL, Redis, RabbitMQ, nerva-wallet-rpc

## Architecture

```
Browser (Next.js)
  |
  | HTTP + WebSocket
  v
market_service (:8080)    invoice_service (:8880 REST, :2052 WS)
  - users                  - invoices
  - listings               - payment detection
  - cart                   - WebSocket notifications
  - orders
  |                           |
  v                           v
  MySQL + Redis               MySQL + RabbitMQ + nerva-wallet-rpc
```

In dev mode, everything goes through mock routes under `/api/market/*` and `/api/invoice/*`. In production, set the env vars `NEXT_PUBLIC_MARKET_API_BASE_URL` and `NEXT_PUBLIC_INVOICE_API_BASE_URL` to point at the Python backend.

## Payments

When a buyer checks out:

1. The marketplace creates an invoice with the vendor's payment address
2. The buyer sends the exact XNV amount to that address
3. The nerva-wallet-rpc daemon detects the transaction
4. `process_new_tx.py` verifies the amount and marks the invoice as confirmed
5. The WebSocket server notifies the browser in real time
6. The vendor sees the order as paid

Payments go directly to the vendor. The marketplace is non-custodial.

## Full stack with Docker

```bash
cp .env.example .env
# edit .env with strong passwords

./backend/create_bridge_network.sh
docker compose up --build
```

Then run the frontend pointing at the backend:

```bash
NEXT_PUBLIC_MARKET_API_BASE_URL=http://localhost:8080 \
NEXT_PUBLIC_INVOICE_API_BASE_URL=http://localhost:8880 \
NEXT_PUBLIC_INVOICE_WS_URL=ws://localhost:2052 \
bun run dev
```

## Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) - Buyer guide
- [docs/VENDOR_GUIDE.md](docs/VENDOR_GUIDE.md) - Vendor guide
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Technical architecture
- [docs/SECURITY.md](docs/SECURITY.md) - Security and fixes
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Production deployment

## Security

This fork fixes several security issues from the original `benevanoff/nerva-marketplace` repo:

- SQL injection: all queries use parameterized tuples
- Sessions: 2h TTL in Redis (was: no TTL)
- Vendor authorization: checked on every endpoint (was: TODO)
- Rate limiting: login, register, listing creation
- Image validation: extension + MIME + magic bytes
- Path traversal protection on images
- No hardcoded passwords in code
- Healthchecks on all services

See [docs/SECURITY.md](docs/SECURITY.md) for the full list.

## License

MIT. See [LICENSE](LICENSE).

## Credits

- Original concept: [@benevanoff](https://github.com/benevanoff)
- NERVA: [github.com/nerva-project/nerva](https://github.com/nerva-project/nerva) - [nerva.one](https://nerva.one)
- UI: [shadcn/ui](https://ui.shadcn.com), [Tailwind CSS](https://tailwindcss.com), [Lucide icons](https://lucide.dev)
