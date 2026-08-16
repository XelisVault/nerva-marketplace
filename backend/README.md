# NERVA Marketplace - Backend

This directory contains the two Python services that power the NERVA Marketplace:

| Service | Path | Port | Purpose |
|---------|------|------|---------|
| `market_service` | [`./market_service/`](./market_service/) | `8080` | Users, listings, cart, orders (FastAPI + MySQL + Redis) |
| `invoice_service` | [`./invoice_service/`](./invoice_service/) | `8880` (REST) / `2052` (WebSocket) | Invoice creation, payment detection, real-time notifications (FastAPI + MySQL + NERVA WalletRPC + RabbitMQ) |

## Quick start

```bash
# 1. From the repo root, copy the env template and fill in real secrets:
cp .env.example ../.env
# edit ../.env

# 2. Create the shared Docker network (only once):
cd ../docker && docker network create mystery_network

# 3. Start both backends:
docker compose -f docker-compose.yml up --build
```

The frontend (Next.js) talks to these services over HTTP. Configure
`NEXT_PUBLIC_MARKET_API_BASE_URL` and `NEXT_PUBLIC_INVOICE_API_BASE_URL`
in the frontend `.env` to point at them.

## Security

This backend has been hardened over the original `benevanoff/nerva-marketplace`
implementation. See [`../docs/SECURITY.md`](../docs/SECURITY.md) for the full
list of fixes. Highlights:

- **SQL injection**: every parameterised query uses a proper 1-tuple (`(arg,)`).
- **Session expiration**: Redis `SET` calls include `ex=7200` (2-hour TTL).
- **Vendor authorisation**: every vendor-only endpoint actually checks
  `is_vendor` from the session, not just a TODO.
- **Rate limiting**: login / register / create-listing are rate-limited
  per-IP via a sliding-window Redis counter.
- **Image upload**: strict content-type + extension + magic-byte validation,
  enforced via `HTTPException` (not `assert`).
- **Path traversal**: `get_image` rejects any `image_name` containing `/` or `..`.
- **Proper HTTP status codes**: no more `return 300` / `return 505` /
  `return 600` - all error paths raise `HTTPException`.
- **Env-based config**: no hardcoded DB / Redis / RabbitMQ passwords.
- **Healthchecks**: every service exposes `GET /health`.

## License

MIT - see [`../LICENSE`](../LICENSE).
