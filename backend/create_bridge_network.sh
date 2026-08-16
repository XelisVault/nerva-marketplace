#!/usr/bin/env bash
# Create the shared Docker network used by both the market_service and
# invoice_service compose stacks. Run this once before `docker compose up`.

set -euo pipefail

NETWORK_NAME="${1:-mystery_network}"

if docker network inspect "${NETWORK_NAME}" >/dev/null 2>&1; then
  echo "Network '${NETWORK_NAME}' already exists."
else
  docker network create "${NETWORK_NAME}"
  echo "Created network '${NETWORK_NAME}'."
fi
