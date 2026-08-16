# NERVA Marketplace

A community-driven marketplace where physical goods are priced in **NERVA (XNV)** — the CPU-minable, ASIC-resistant privacy coin (Monero fork, Cryptonight Adaptive).

Buyers browse listings, add items to a cart, and check out. Each checkout generates a unique NERVA subaddress; the buyer sends XNV directly to that address (no payment processor, no custody), and a WebSocket pushes payment-confirmation status to the browser in real time.

> ⚠️ **Status**: This is a community project. It is not affiliated with the official NERVA core development team. Use at your own risk.

---

## ✨ Features

- **Browse & search** listings, sort by price / name / date.
- **Vendor accounts** can create listings with image uploads (PNG/JPEG, max 10 MB).
- **Cart & checkout** with shipping details.
- **Crypto-native payments**: every order generates a unique NERVA subaddress.
- **Real-time invoice tracking** over WebSocket — see payment detected → confirmed live.
- **Order history** for buyers and vendors.
- **Dark / light theme**, mobile-first responsive UI, accessible (semantic HTML, ARIA labels, keyboard-navigable).
- **End-to-end TypeScript**, strong typing on both client and server.

---

## 🏗 Architecture

```
┌──────────────────────┐         ┌────────────────────────────────────────┐
│  Next.js 16 frontend │  HTTP   │  Python FastAPI backends                │
│  (this repo, src/)   │ ──────► │  ┌────────────────────────────────────┐ │
│                      │         │  │ market_service  :8080               │ │
│  - React 19          │         │  │   users, listings, cart, orders     │ │
│  - Tailwind CSS 4    │         │  │   (MySQL + Redis)                   │ │
│  - shadcn/ui         │         │  └────────────────────────────────────┘ │
│  - TanStack Query    │         │  ┌────────────────────────────────────┐ │
│  - Zustand           │         │  │ invoice_service  :8880 (REST)       │ │
│  - NextAuth-ready    │         │  │   invoice creation, status lookup   │ │
│                      │   WS    │  │   (MySQL + NERVA WalletRPC)         │ │
│  Dev mode: built-in  │ ◄─────► │  └────────────────────────────────────┘ │
│  mock API + Prisma   │         │  ┌────────────────────────────────────┐ │
│  (no backend needed) │         │  │ websocket_server :2052              │ │
└──────────────────────┘         │  │   real-time payment notifications   │ │
                                 │  │   (RabbitMQ consumer)               │ │
                                 │  └────────────────────────────────────┘ │
                                 └────────────────────────────────────────┘
```

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui.
  In dev/preview mode, the app runs entirely standalone using built-in mock
  API routes (no Python, MySQL, Redis, or NERVA wallet required).
- **Backend**: two Python FastAPI services (market + invoice) backed by MySQL,
  Redis, RabbitMQ, and a `nerva-wallet-rpc` instance. See
  [`backend/README.md`](backend/README.md) and
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## 🚀 Quick start (frontend only, dev mode)

The fastest way to explore the marketplace UI is to run the Next.js app
standalone — the built-in mock API simulates the full backend.

```bash
git clone https://github.com/XelisVault/nerva-marketplace.git
cd nerva-marketplace
bun install           # or: npm install
bun run db:push       # creates the local SQLite DB (prisma/dev.db)
bun run db:seed       # seeds demo listings + users
bun run dev           # http://localhost:3000
```

Demo accounts (after seeding):

| Username | Password   | Role    |
|----------|------------|---------|
| `admin`  | `admin123` | vendor  |
| `alice`  | `alice123` | customer |

---

## 🐳 Full stack (frontend + Python backend + NERVA wallet)

For real XNV payments you need the full stack. Make sure Docker + Docker
Compose are installed, then:

```bash
# 1. Configure environment
cp .env.example .env
# edit .env — set DB_PASS, CACHE_PASS, INV_DB_PASS, RABBITMQ_PASS to strong secrets

# 2. Create the shared Docker network
./backend/create_bridge_network.sh

# 3. Start the entire backend
docker compose up --build

# 4. In a separate shell, start the frontend pointing at the real backend:
NEXT_PUBLIC_MARKET_API_BASE_URL=http://localhost:8080 \
NEXT_PUBLIC_INVOICE_API_BASE_URL=http://localhost:8880 \
NEXT_PUBLIC_INVOICE_WS_URL=ws://localhost:2052 \
bun run dev
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for production hardening
(HTTPS termination, secrets management, backups, etc.).

---

## 📚 Documentation

| Document | Audience | Purpose |
|----------|----------|---------|
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Buyers | How to register, browse, buy, and track orders |
| [`docs/VENDOR_GUIDE.md`](docs/VENDOR_GUIDE.md) | Sellers | How to become a vendor, create listings, fulfil orders |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Developers | System design, data flow, service boundaries |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Operators / auditors | Threat model and the security fixes applied vs. the original repo |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Operators | Production deployment guide |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Contributors | How to submit PRs, run tests, coding conventions |

---

## 🔧 Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui (New York), TanStack Query, Zustand, React Hook Form, Zod |
| Frontend dev DB | Prisma + SQLite |
| Backend | Python 3.11, FastAPI, Uvicorn, Pydantic v2, PyNaCl (argon2id) |
| Backend DB | MySQL 8 (aiomysql) |
| Backend cache | Redis 7 (sessions, rate limiting, cart store) |
| Real-time | Python `websockets` + RabbitMQ |
| Wallet | `nerva-wallet-rpc` v0.3.0.0 |
| Containerisation | Docker, Docker Compose |

---

## 🛡 Security

This is a **hardened fork** of [`benevanoff/nerva-marketplace`](https://github.com/benevanoff/nerva-marketplace).
The original had several security issues — SQL injection vectors, missing
session TTL, no vendor authorisation, hardcoded DB passwords, missing rate
limiting, no CSRF protection, etc. See [`docs/SECURITY.md`](docs/SECURITY.md)
for the full list of fixes.

If you discover a vulnerability, please open a private security advisory
on GitHub rather than a public issue.

---

## 📄 License

MIT — see [`LICENSE`](LICENSE).

---

## 🙏 Acknowledgements

- Original concept and codebase by [@benevanoff](https://github.com/benevanoff).
- NERVA core project: [github.com/angrywasp/nerva](https://github.com/angrywasp/nerva) · [getnerva.org](https://getnerva.org)
- UI components: [shadcn/ui](https://ui.shadcn.com/) · [Radix UI](https://www.radix-ui.com/) · [Tailwind CSS](https://tailwindcss.com) · [Lucide icons](https://lucide.dev)
