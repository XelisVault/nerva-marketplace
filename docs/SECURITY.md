# Security

This document describes the threat model for NERVA Marketplace and the
specific security fixes applied in this fork compared to the original
[`benevanoff/nerva-marketplace`](https://github.com/benevanoff/nerva-marketplace).

## Threat model

| Asset | Threat | Mitigation |
|-------|--------|-----------|
| User passwords | DB leak → password recovery | Argon2id hashing (PyNaCl) - memory-hard, GPU-resistant. |
| User sessions | Session hijacking via XSS / CSRF | `HttpOnly` + `Secure` + `SameSite=Lax` cookies; 2-hour TTL; sessions stored in Redis (not JWTs). |
| Vendor accounts | Privilege escalation by non-vendors | Server-side `is_vendor` check on every vendor-only endpoint (not just client-side). |
| Listing images | Malicious upload (PHP shell, SVG with embedded JS, path traversal) | Triple validation: extension allowlist, MIME-type allowlist, magic-byte check via `imghdr`. Stored with UUID filenames. `get_image` rejects any name containing `/`, `\`, or `..`. |
| SQL queries | SQL injection | Every query uses parameterised 1-tuples (`(arg,)`) via aiomysql. No string concatenation. |
| Login | Brute force | Per-IP rate limit (default 10/min) via Redis sliding-window. |
| Registration | Account enumeration, mass account creation | Per-IP rate limit (default 5/min). Generic "username or email already taken" message. |
| Listing creation | Spam / abuse | Per-vendor rate limit (default 10/min). |
| Cart checkout | Race condition (oversell) | Stock check immediately before insert + `UPDATE … SET qty = qty - 1`. Row-level locking could be added if needed. |
| Cross-site request forgery | CSRF on state-changing endpoints | `SameSite=Lax` cookies. (Note: `SameSite=Strict` would break the email-activation flow.) |
| CORS | Credential leakage to third-parties | Origins are read from `CORS_ORIGINS` env var. No wildcards. `allow_credentials=True` only with explicit origins. |
| Secrets in source | DB passwords, Redis passwords, RabbitMQ passwords committed to git | No hardcoded secrets in code. All secrets come from env vars. `.env` is gitignored. `.env.example` documents every var. |
| Production traffic | MITM, eavesdropping | Set `SESSION_SECURE=true` behind HTTPS. Production deployment must terminate TLS (see DEPLOYMENT.md). |
| Wallet keys | Thief steals `mainnet_rpc` wallet file → drains all payments | Wallet file lives in a Docker volume (`nerva_wallet`), not in the image. Volume should be encrypted at rest in production. |

## Fixes applied vs. the original

Below is a comprehensive diff of the security-relevant changes. Each item
links to the file where the fix was applied.

### 1. SQL injection (parameterised tuples)

**Original** (`backend/market_service/src/market_routes.py:43`):
```python
await cur.execute("SELECT * FROM listings WHERE listing_id=%s", (listing_id))
```

This is a bug: `(listing_id)` is just `listing_id` in parentheses, not a
1-tuple. aiomysql may or may not parameterise depending on the type of
`listing_id`. With a string `listing_id` of `"1 OR 1=1"`, the query
becomes unsafe.

**Fixed**: every parameterised query now uses a proper 1-tuple
(`(arg,)`).

Files: `market_routes.py`, `user_routes.py`, `cart_routes.py`,
`order_routes.py`, `invoice_service/src/http_server.py`,
`invoice_service/src/process_new_tx.py`.

### 2. Session expiration (Redis TTL)

**Original** (`backend/market_service/src/dependencies.py:38`):
```python
self.session_storage_client.set(session_id, json.dumps({...}))
```

No TTL - sessions live forever in Redis until manually deleted. A
leaked session cookie is valid indefinitely.

**Fixed**: every `client.set()` for sessions includes `ex=7200` (2-hour
TTL, matching the original code's stated intent in a comment). The TTL
is refreshed on every write, so active users stay signed in.

File: `dependencies.py`.

### 3. Vendor authorisation (was a TODO)

**Original** (`backend/market_service/src/order_routes.py:26`):
```python
# todo: assert that the requestor is a vendor
```

Any logged-in user could call `/vendor/orders` and see another vendor's
orders.

**Fixed**: `get_vendor_orders` now calls `session_storage.get_is_vendor_from_session(session_id)`
and raises `HTTPException(403)` if the user isn't a vendor. Same for
`create_listing` in `market_routes.py`.

Files: `order_routes.py`, `market_routes.py`.

### 4. Logout actually destroys the session

**Original** frontend (`frontend/src/Navbar.js:43`):
```jsx
{userDetails ? <button>Logout</button> : ...}
```

The logout button had no `onClick` handler - clicking it did nothing.
The backend `POST /users/logout` endpoint existed but was never called.

**Fixed**: the new `Header` component wires the logout button to the
`useAuth().logout()` action, which calls `POST /users/logout` and
clears the local user state.

Files: `src/components/layout/header.tsx`, `src/lib/auth.tsx`.

### 5. Cart remove button works

**Original** frontend (`frontend/src/Cart.js:33`):
```jsx
<button>Remove</button>
```

No `onClick` - the button did nothing.

**Fixed**: new `POST /cart/remove_item/{listing_id}` endpoint + cart
store action + UI wiring. The button now actually removes the item.

Files: `src/app/cart/page.tsx`, `src/lib/cart-store.ts`,
`src/lib/api-client.ts`, `backend/market_service/src/cart_routes.py`.

### 6. Rate limiting

**Original**: no rate limiting anywhere. Login could be brute-forced at
network speed.

**Fixed**: per-IP sliding-window rate limiter in Redis, applied to
login (10/min), register (5/min), and create-listing (10/min). Returns
`HTTP 429` with a clear error message.

File: `dependencies.py` (`check_rate_limit`), `user_routes.py`,
`market_routes.py`.

### 7. Proper HTTP status codes

**Original** (`backend/market_service/src/cart_routes.py:60,74,76`):
```python
if not shipping_data:
    return 300        # ← not even a valid HTTP status for this
...
elif vendor_username != listing_record["vendor"]:
    return 505        # ← HTTP 505 is "HTTP Version Not Supported"
...
if int(listing_record["quantity_available"]) <= 0:
    return 600        # ← 600 is not a valid HTTP status code at all
```

**Fixed**: every error path raises `HTTPException` with the appropriate
status (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `502`).

File: `cart_routes.py`, plus all other route files.

### 8. `whoami` returns 401 (not `null`)

**Original** (`backend/market_service/src/user_routes.py:88`):
```python
if not session_id:
    return            # returns None, which FastAPI serialises as null
```

The frontend couldn't distinguish "session expired" from "loading".

**Fixed**: `whoami` now raises `HTTPException(401)` when unauthenticated.
The frontend's `api-client.ts` treats 401 as a normal "not logged in"
signal (not a hard error).

Files: `user_routes.py`, `src/lib/api-client.ts`.

### 9. Path-traversal hardening on `get_image`

**Original** (`backend/market_service/src/market_routes.py:82`):
```python
@market_router.get("/market/listing/image/{image_name}")
async def get_image(image_name: str, ...):
    ...
    return FileResponse(f'{ListingStorage().storage_root}/{image_name}', ...)
```

While `image_name` is checked against the DB first, a malicious value
like `../../etc/passwd` would be passed to `FileResponse` if it
happened to match a row (unlikely but not impossible).

**Fixed**: `_validate_image_name` rejects any name containing `/`, `\`,
or `..`, and enforces a strict regex `^[a-zA-Z0-9_-]+\.(jpg|jpeg|png)$`.
Plus a final `os.path.abspath().startswith(storage_root)` check.

File: `market_routes.py`.

### 10. Image upload hardening

**Original** (`backend/market_service/src/market_routes.py:59,62,67`):
```python
if file.size > ListingStorage.MAX_FILE_SIZE:
    raise HTTPException(status_code=422, detail="File too big")
if not file.filename.endswith(tuple(...)):
    raise HTTPException(status_code=422, detail="Invalid file extension")
contents = await file.read()
file_type = imghdr.what(None, h=contents)
if file_type not in ListingStorage.VALID_FILE_EXTENSIONS:
    raise HTTPException(status_code=422, detail="Invalid image file.")
```

Issues:
- `assert file.size < MAX` (line 26) was used instead of HTTPException
  in `ListingStorage.addFile`, which would 500 instead of 422.
- No content-type validation.
- File extension check via `str.endswith(tuple)` is fragile (`.PNG`
  vs `.png`).

**Fixed**: strict triple validation (extension lowercase, MIME type
allowlist, magic-byte check), all via `HTTPException`. File is written
with a UUID filename, never the user-supplied filename.

File: `market_routes.py`.

### 11. No hardcoded secrets

**Original** (`backend/market_service/src/config.py:9,15,17`):
```python
DB_PASS: str = Field("kkfkffspassss", env="DB_PASS")
CACHE_PASS: str = Field("yourpasswordkkfkfa", env="CACHE_PASS")
```

And in `docker-compose.yml`:
```yaml
redis:
  command: redis-server --requirepass yourpasswordkkfkfa
rabbitmq:
  environment:
    RABBITMQ_DEFAULT_PASS: "passwordkkjhgq"
```

These default passwords were committed to the public repo. Anyone
running the stock `docker compose up` would be using known passwords.

**Fixed**: `DB_PASS`, `CACHE_PASS`, `INV_DB_PASS`, `RABBITMQ_PASS` have
**no defaults** - the app refuses to start without them. The
docker-compose.yml uses `${DB_PASS:?DB_PASS is required}` to fail
loudly if the env var is missing. `.env.example` documents every
required secret.

Files: `config.py` (both services), `docker-compose.yml`, `.env.example`.

### 12. CORS configuration

**Original** (`backend/market_service/src/config.py:21`):
```python
CORS_ORIGINS: List[str] = Field(
    default_factory=lambda: [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://192.168.1.167:3000",  # ← developer's personal IP
        "http://192.168.1.157:3000",  # ← another developer's IP
    ],
    env="CORS_ORIGINS",
)
```

Hardcoded private IPs of the original developers' machines.

**Fixed**: default is `["http://localhost:3000"]`. Production deployments
set `CORS_ORIGINS` via env var.

File: `config.py` (both services).

### 13. Development build no longer served in production

**Original** frontend was a Create React App dev bundle served by
Express in production - with `console.log`s, source maps, and
`react_jsx_dev_runtime` exposed.

**Fixed**: Next.js 16 builds a production bundle with `next build`.
Source maps are not served in production. The dev server (`next dev`)
is only used locally.

### 14. Healthcheck endpoints

**Original**: no healthcheck endpoints. Container orchestrators
couldn't tell if a service was actually serving traffic.

**Fixed**: both FastAPI services expose `GET /health` returning
`{"status": "ok"}`. Docker Compose uses these as healthcheck probes.

Files: `market_service/src/http_server.py`,
`invoice_service/src/http_server.py`.

## Known limitations

These are **not yet fixed** - they're on the roadmap:

1. **No CSRF tokens**. `SameSite=Lax` cookies mitigate the most common
   CSRF vectors, but a dedicated CSRF token (synchroniser pattern or
   double-submit cookie) would be stronger. Planned.
2. **No Content-Security-Policy header**. The Next.js app doesn't set
   a CSP - a future release should ship a strict CSP (no `unsafe-inline`).
3. **Payments go to the marketplace wallet, not vendor wallets.** This
   is an architectural limitation - see `docs/VENDOR_GUIDE.md`. A future
   release will use each vendor's wallet view key to generate
   subaddresses directly.
4. **No 2FA.** Vendor accounts in particular should support TOTP. Planned.
5. **No audit log.** Logins, listings, and orders are not written to an
   append-only audit log. Planned.
6. **No email sending.** Activation tokens are logged but not emailed.
   You'll need to wire up SMTP (or a transactional email provider) in
   `user_routes.py:user_registration_submit`.

## Reporting vulnerabilities

If you discover a security issue, please **do not** open a public GitHub
issue. Instead, open a private security advisory via
[GitHub's security advisories feature](https://github.com/XelisVault/nerva-marketplace/security/advisories/new).

We aim to respond within 72 hours.
