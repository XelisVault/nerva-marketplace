# Nerva Marketplace Software

## Setup

Run `backend/create_bridge_network.sh`

Start the market services backend: `cd backend/market_service/infrastructure && docker compose up --build`
Start the invoice services backend `cd backend/invoice_services/infrastructure && docker compose up --build`

Start frontend: `cd frontend && npm install && npm start`

## User Guide

[docs/USER_GUIDE.md](docs/USER_GUIDE.md)