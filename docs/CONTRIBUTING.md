# Contributing

Thanks for your interest in improving NERVA Marketplace! This document
explains how to set up a development environment and submit changes.

## Project layout

```
nerva-marketplace/
├── src/                    # Next.js frontend
│   ├── app/                # App Router pages + API routes
│   ├── components/         # React components (UI, layout, marketplace, auth)
│   ├── lib/                # API client, auth, config, stores, mock data
│   ├── hooks/              # Custom React hooks
│   └── types/              # Shared TypeScript types
├── backend/
│   ├── market_service/     # FastAPI: users, listings, cart, orders
│   └── invoice_service/    # FastAPI: invoices + WebSocket + NERVA wallet
├── docs/                   # User / vendor / architecture / security / deployment docs
├── prisma/                 # Prisma schema (dev-only SQLite)
├── public/                 # Static assets
├── docker-compose.yml      # Full-stack backend
├── .env.example            # All env vars documented
└── README.md
```

## Development environment

### Frontend (Next.js)

```bash
git clone https://github.com/<your-username>/nerva-marketplace.git
cd nerva-marketplace
bun install         # or npm install
bun run db:push     # creates prisma/dev.db
bun run db:seed     # seeds demo data
bun run dev         # http://localhost:3000
```

In dev mode (no `NEXT_PUBLIC_MARKET_API_BASE_URL` set), the frontend
uses built-in mock API routes under `/api/market/*` and `/api/invoice/*`.
No backend required.

### Backend (Python FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r market_service/requirements.txt
pip install -r invoice_service/requirements.txt

# Start MySQL + Redis locally (or via docker):
docker run -d --name nerva-mysql -e MYSQL_ROOT_PASSWORD=devpass -p 3306:3306 mysql:8
docker run -d --name nerva-redis -p 6379:6379 redis:7-alpine

# Apply schemas:
mysql -h 127.0.0.1 -u root -pdevpass < market_service/infrastructure/schema.sql
mysql -h 127.0.0.1 -u root -pdevpass < invoice_service/infrastructure/schema.sql

# Start market_service:
DB_PASS=devpass CACHE_PASS= uvicorn market_service.src.http_server:app --port 8080 --reload

# Start invoice_service (in another terminal):
INV_DB_PASS=devpass RABBITMQ_PASS= uvicorn invoice_service.src.http_server:app --port 8880 --reload
```

For full-stack development with the NERVA wallet, use Docker Compose
(see README.md).

## Code style

### TypeScript / React

- **TypeScript strict mode** — no `any` without a comment explaining why.
- **Functional components** only — no class components.
- **Hooks** for state and side effects.
- **shadcn/ui** components — don't reinvent UI primitives.
- **Tailwind CSS** classes — no inline styles except for dynamic values.
- **`'use client'` directive** at the top of any file that uses hooks,
  `useState`, browser APIs, or React context.
- **Imports**: group as (1) external libs, (2) `@/components/...`,
  (3) `@/lib/...`, (4) relative. Use the `@/` alias for everything
  inside `src/`.
- **Naming**: `PascalCase` for components and types, `camelCase` for
  functions and variables, `SCREAMING_SNAKE_CASE` for constants.
- **File names**: `kebab-case.ts` for non-component files,
  `PascalCase.tsx` for component files.

### Python

- **Type hints** on every function signature.
- **Pydantic v2** for request/response models — no raw `dict` parameters.
- **Async** everywhere — no blocking I/O in route handlers.
- **`HTTPException`** for every error path — no returning bare integers
  or strings.
- **Parameterised SQL** — every query uses `%s` placeholders with
  1-tuples. Never string-concatenate.
- **Logging** via the `logging` module — no `print()` in production code.
- **PEP 8** — use `black` and `ruff` if you want auto-formatting.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add listing search by vendor
fix: prevent self-checkout when buyer is the vendor
docs: document the SMTP configuration step
chore: bump Next.js to 16.1.3
security: enforce rate limit on create-listing
```

## Pull request workflow

1. **Fork** the repo and create a feature branch:
   ```bash
   git checkout -b feat/my-feature
   ```
2. **Make your changes**. Keep the diff focused — one logical change per PR.
3. **Test locally**:
   - Frontend: `bun run lint`, `bun run typecheck`, then manually exercise
     the affected flows in the browser.
   - Backend: `pytest` in each service directory.
4. **Update docs** if you changed user-visible behaviour.
5. **Open a PR** against `main`. Describe:
   - What changed and why.
   - How you tested it.
   - Any breaking changes.
   - Screenshots for UI changes.
6. **Address review feedback** with new commits (don't force-push unless
   asked).

## Running tests

### Frontend

```bash
bun run lint       # ESLint
bun run typecheck  # tsc --noEmit
```

(Unit tests with Vitest are planned — not yet set up.)

### Backend

```bash
cd backend/market_service
pytest tests/ -v

cd ../invoice_service
pytest tests/ -v
```

(Integration tests require Docker — see `backend/integration_tests/`.)

## Reporting bugs

Open a [GitHub issue](https://github.com/XelisVault/nerva-marketplace/issues/new)
with:

1. **What you did** (exact steps).
2. **What you expected**.
3. **What actually happened** (including error messages and stack traces).
4. **Your environment** (browser, OS, dev vs. production, relevant env vars).
5. **Screenshots** if applicable.

## Reporting security issues

**Do not** open a public issue for security vulnerabilities. Instead,
open a private security advisory via
[GitHub's security advisories feature](https://github.com/XelisVault/nerva-marketplace/security/advisories/new).
See [`docs/SECURITY.md`](SECURITY.md) for the full policy.

## Code of conduct

Be kind. Be patient. Assume good faith. Disagreements happen — address
them constructively, focused on the code, not the person.

## License

By contributing, you agree that your contributions are licensed under
the MIT license (see [`LICENSE`](../LICENSE)).
