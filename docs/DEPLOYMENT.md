# Deployment Guide

This guide covers deploying NERVA Marketplace to production. It assumes
you're familiar with Docker, HTTPS termination, and basic Linux
administration.

## Prerequisites

- A server (VPS or dedicated) with:
  - At least 2 GB RAM (4 GB recommended)
  - 20 GB disk
  - Docker 24+ and Docker Compose v2+
  - A public IP
- A domain name pointing at your server.
- An SMTP server (or transactional email provider like Postmark, Resend,
  or AWS SES) for sending activation emails.
- A NERVA wallet file (`mainnet_rpc`) with sufficient XNV for transaction
  fees (a few XNV is plenty). Create one with `nerva-wallet-cli`.

## Step 1 - Clone and configure

```bash
git clone https://github.com/XelisVault/nerva-marketplace.git
cd nerva-marketplace

cp .env.example .env
nano .env   # or your favourite editor
```

Edit `.env`:

| Variable | Notes |
|----------|-------|
| `DB_PASS`, `CACHE_PASS`, `INV_DB_PASS`, `RABBITMQ_PASS` | Use strong, unique secrets. Generate with `openssl rand -hex 32`. |
| `CORS_ORIGINS` | The full URL of your frontend, e.g. `https://nervamarket.com`. |
| `SESSION_SECURE` | Set to `true` (you'll be behind HTTPS). |
| `SESSION_SAMESITE` | `lax` is correct for most setups. |
| `RATE_LIMIT_*` | Adjust if you expect higher traffic. |
| `REQUIRED_CONFIRMATIONS` | `1` for fast confirmations, `6+` for higher security. |

## Step 2 - Place your NERVA wallet file

```bash
# Copy your wallet file into the volume mount point:
docker volume create nerva-marketplace_nerva_wallet
docker run --rm -v nerva-marketplace_nerva_wallet:/keys \
  -v /path/to/your/mainnet_rpc:/wallet \
  alpine cp /wallet/mainnet_rpc /wallet/mainnet_rpc.keys /keys/
```

(Or just copy them into `/var/lib/docker/volumes/nerva-marketplace_nerva_wallet/_data/`
directly.)

## Step 3 - Start the backend

```bash
./backend/create_bridge_network.sh
docker compose up -d --build
```

Verify everything is up:

```bash
docker compose ps
# All services should show "healthy"

curl http://localhost:8080/health   # → {"status":"ok"}
curl http://localhost:8880/health   # → {"status":"ok","wallet":"connected"}
```

If `wallet` shows `stub`, the `nerva-py` package isn't installed in the
payments container. Check the build logs.

## Step 4 - Configure SMTP for activation emails

Open `backend/market_service/src/user_routes.py` and find the
`TODO: send activation email` comment in `user_registration_submit`.
Wire it up to your SMTP provider. A minimal example using `aiosmtplib`:

```python
import aiosmtplib
from email.mime.text import MIMEText

async def send_activation_email(to_email: str, token: str):
    msg = MIMEText(
        f"Welcome to NERVA Marketplace!\n\n"
        f"Click here to activate your account:\n"
        f"https://nervamarket.com/activate/{token}\n\n"
        f"This link expires when used."
    )
    msg["Subject"] = "Activate your NERVA Marketplace account"
    msg["From"] = "no-reply@nervamarket.com"
    msg["To"] = to_email
    await aiosmtplib.send(
        msg,
        hostname=os.environ["SMTP_HOST"],
        port=int(os.environ["SMTP_PORT"]),
        username=os.environ["SMTP_USER"],
        password=os.environ["SMTP_PASS"],
        use_tls=True,
    )
```

Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` to your `.env`
and the docker-compose.yml `environment` block for
`marketplace_rest_microservices`.

## Step 5 - Build and deploy the frontend

On your build machine (or the same server):

```bash
cd nerva-marketplace

# Set the production env vars (in a .env.production file or shell env):
cat > .env.production <<EOF
NEXT_PUBLIC_MARKET_API_BASE_URL=https://api.nervamarket.com
NEXT_PUBLIC_INVOICE_API_BASE_URL=https://invoice.nervamarket.com
NEXT_PUBLIC_INVOICE_WS_URL=wss://invoice.nervamarket.com
EOF

# Build
bun install
bun run build
```

This produces a self-contained Next.js standalone server at
`.next/standalone/`. Copy it to your server along with `.next/static`
and `public/`:

```bash
rsync -avz --delete \
  .next/standalone/ \
  .next/static/ \
  public/ \
  user@your-server:/opt/nerva-marketplace/
```

On the server:

```bash
cd /opt/nerva-marketplace
NODE_ENV=production node server.js
```

(Or wrap it in a systemd service / Docker container - your choice.)

## Step 6 - HTTPS termination

Use Caddy (recommended - automatic Let's Encrypt) or nginx + certbot.

### Caddy example

```caddyfile
nervamarket.com {
    reverse_proxy localhost:3000
}

api.nervamarket.com {
    reverse_proxy localhost:8080
}

invoice.nervamarket.com {
    reverse_proxy localhost:8880

    # WebSocket support for /:invoice_id
    @ws {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @ws localhost:2052
}
```

### nginx + certbot example

```nginx
server {
    listen 443 ssl http2;
    server_name nervamarket.com;
    ssl_certificate /etc/letsencrypt/live/nervamarket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nervamarket.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.nervamarket.com;
    ssl_certificate /etc/letsencrypt/live/api.nervamarket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.nervamarket.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name invoice.nervamarket.com;
    ssl_certificate /etc/letsencrypt/live/invoice.nervamarket.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/invoice.nervamarket.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8880;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket upgrade
    location ~ ^/[0-9]+$ {
        proxy_pass http://localhost:2052;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }
}
```

## Step 7 - Backups

Set up daily backups of:

1. **MySQL databases** (`market` and `invoices_db`):
   ```bash
   docker exec nerva-marketplace-db-1 mysqldump -u root -p"$DB_PASS" market | gzip > /backups/market-$(date +%F).sql.gz
   docker exec nerva-marketplace-db_invoice-1 mysqldump -u root -p"$INV_DB_PASS" invoices_db | gzip > /backups/invoices-$(date +%F).sql.gz
   ```
2. **Listing images** (the `listing_images` volume):
   ```bash
   tar czf /backups/listing-images-$(date +%F).tar.gz /var/lib/docker/volumes/nerva-marketplace_listing_images/_data/
   ```
3. **NERVA wallet file** (the `nerva_wallet` volume):
   ```bash
   tar czf /backups/nerva-wallet-$(date +%F).tar.gz /var/lib/docker/volumes/nerva-marketplace_nerva_wallet/_data/
   ```
   ⚠️ **Encrypt this backup** - it contains the keys that control all
   marketplace payments. Use `gpg --symmetric` or age.

## Step 8 - Monitoring

At minimum, monitor:

- Container health (`docker compose ps`).
- Disk space (`df -h`) - MySQL and image storage grow over time.
- NERVA wallet balance - if it drops unexpectedly, you've been compromised.
- HTTP 5xx rate on the frontend and backends.
- WebSocket connection count on `:2052`.

For a more serious deployment, add:

- Prometheus + Grafana for metrics.
- Loki for logs.
- Uptime Robot / Better Stack for external probes.

## Step 9 - Updates

```bash
cd /opt/nerva-marketplace
git pull
docker compose build
docker compose up -d
```

Database migrations: currently schema changes require manual `mysql`
application. Run the new `schema.sql` against each DB (it uses
`CREATE TABLE IF NOT EXISTS` so it's safe to re-run, but doesn't do
in-place schema migrations - a proper migration tool like Alembic is
planned).

## Rollback

If an update breaks something:

```bash
git checkout <previous-commit>
docker compose build
docker compose up -d
```

Database rollbacks require restoring from backup - make sure you have
one before each update.

## Hardening checklist

- [ ] All secrets in `.env` are strong, unique, generated with `openssl rand`.
- [ ] `.env` file has `chmod 600` and is owned by root.
- [ ] `SESSION_SECURE=true`.
- [ ] HTTPS termination in place (Caddy/nginx with valid certs).
- [ ] Firewall: only 80, 443, and 22 (SSH) are publicly accessible.
  - 8080, 8880, 2052, 3306, 6379, 5672, 15672, 28082 should **not** be public.
- [ ] MySQL root passwords are not the default.
- [ ] Redis requires authentication (it does - via `--requirepass`).
- [ ] RabbitMQ management UI (port 15672) is either not exposed or
  behind basic auth + a strong password.
- [ ] NERVA wallet volume is encrypted at rest (or the host disk is).
- [ ] Daily backups are running and tested (do a restore drill!).
- [ ] SMTP credentials are configured and activation emails are sending.
- [ ] You've reviewed `docs/SECURITY.md` and understand the known
  limitations.
