# NERVA Marketplace

Marketplace pour acheter et vendre des biens avec NERVA (XNV), la crypto CPU-minable.

## C'est quoi

Un marketplace ou les prix sont en XNV. Les vendeurs creent des annonces avec leur propre adresse de paiement NERVA. Les acheteurs paient directement au vendeur. Le marketplace ne garde jamais les fonds.

NERVA c'est une crypto privee, fork de Monero, minable uniquement au CPU. Pas de pools, pas d'ASIC. Site officiel: https://nerva.one

## Demarrage rapide (frontend seul)

Le frontend tourne tout seul en mode dev avec une API mock integree. Pas besoin de Python, MySQL, ou wallet NERVA.

```bash
git clone https://github.com/XelisVault/nerva-marketplace.git
cd nerva-marketplace
bun install
DATABASE_URL="file:./dev.db" bun run db:push
DATABASE_URL="file:./dev.db" bun run dev
```

Ouvrez http://localhost:3000

Comptes de demo:
- `admin` / `admin123` (vendeur)
- `alice` / `alice123` (client)

## Stack technique

**Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite en dev)

**Backend** (optionnel, pour les paiements reels): Python, FastAPI, MySQL, Redis, RabbitMQ, nerva-wallet-rpc

## Architecture

```
Navigateur (Next.js)
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

En mode dev, tout passe par les routes mock sous `/api/market/*` et `/api/invoice/*`. Cote production, on configure les variables d'env `NEXT_PUBLIC_MARKET_API_BASE_URL` et `NEXT_PUBLIC_INVOICE_API_BASE_URL` pour pointer vers le backend Python.

## Paiements

Quand un acheteur fait un checkout:

1. Le marketplace cree une invoice avec l'adresse de paiement du vendeur
2. L'acheteur envoie le montant exact en XNV a cette adresse
3. Le daemon nerva-wallet-rpc detecte la transaction
4. `process_new_tx.py` verifie le montant et marque l'invoice comme confirmee
5. Le serveur WebSocket notifie le navigateur en temps reel
6. Le vendeur voit la commande comme payee

Les paiements vont directement au vendeur. Le marketplace ne custodie rien.

## Demarrage full-stack avec Docker

```bash
cp .env.example .env
# editez .env avec des mots de passe solides

./backend/create_bridge_network.sh
docker compose up --build
```

Puis lancez le frontend en pointant vers le backend:

```bash
NEXT_PUBLIC_MARKET_API_BASE_URL=http://localhost:8080 \
NEXT_PUBLIC_INVOICE_API_BASE_URL=http://localhost:8880 \
NEXT_PUBLIC_INVOICE_WS_URL=ws://localhost:2052 \
bun run dev
```

## Documentation

- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) - Guide acheteur
- [docs/VENDOR_GUIDE.md](docs/VENDOR_GUIDE.md) - Guide vendeur
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture technique
- [docs/SECURITY.md](docs/SECURITY.md) - Securite et correctifs
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - Deploiement production

## Securite

Ce fork corrige plusieurs problemes de securite par rapport au depot original `benevanoff/nerva-marketplace`:

- Injection SQL: toutes les requetes utilisent des tuples parametres
- Sessions: TTL de 2h dans Redis (avant: pas de TTL)
- Autorisation vendor: verifiee sur chaque endpoint (avant: TODO)
- Rate limiting: login, register, creation d'annonce
- Validation des images: extension + MIME + magic bytes
- Protection path traversal sur les images
- Pas de mots de passe en dur dans le code
- Healthchecks sur tous les services

Voir [docs/SECURITY.md](docs/SECURITY.md) pour la liste complete.

## License

MIT. Voir [LICENSE](LICENSE).

## Credits

- Concept original: [@benevanoff](https://github.com/benevanoff)
- NERVA: [github.com/nerva-project/nerva](https://github.com/nerva-project/nerva) - [nerva.one](https://nerva.one)
- UI: [shadcn/ui](https://ui.shadcn.com), [Tailwind CSS](https://tailwindcss.com), [Lucide icons](https://lucide.dev)
