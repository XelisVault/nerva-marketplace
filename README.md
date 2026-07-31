# Nerva Marketplace Software

## Quick Setup

Run `backend/create_bridge_network.sh`

Start the market services backend: `cd backend/market_service/infrastructure && docker compose up --build`
Start the invoice services backend `cd backend/invoice_services/infrastructure && docker compose up --build`

Start frontend: `cd frontend && npm install && npm start`

## User Guide

[USER_GUIDE.md](docs/USER_GUIDE.md)

## Backend Docs

[backend README.md](backend/README.md)

[market service architecture](backend/market_service/docs/architecture.md)

[market service testing](backend/market_service/docs/testing.md)

[invoice service architecture](backend/invoice_service/docs/architecture.md)

[invoice service REST API](backend/invoice_service/docs/rest_api.md)