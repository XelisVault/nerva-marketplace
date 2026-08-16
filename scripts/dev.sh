#!/usr/bin/env bash
# Start the NERVA Marketplace frontend dev server.
set -euo pipefail
cd "$(dirname "$0")/../frontend"
bun install
bun run db:push
exec bun run dev
