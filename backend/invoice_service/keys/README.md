# NERVA wallet keys

This directory holds the NERVA wallet files used by `nerva-wallet-rpc`.

In production you must provide:
- `mainnet_rpc` — the wallet file (created with `nerva-wallet-cli`)
- `mainnet_rpc.keys` — the corresponding keys file (optional, only if
  the wallet is password-protected and the keys are stored separately)

These files are **highly sensitive** — they control the wallet that
receives all marketplace payments. **Never commit them to git.** The
`.gitignore` at the repo root already excludes `*.keys`, but make sure
the wallet file itself (`mainnet_rpc`) is also excluded.

For local development, you can create a test wallet by running:

```bash
docker run --rm -it \
  -v $(pwd)/keys:/app/keys \
  --entrypoint nerva-linux-x86_64-v0.3.0.0/nerva-wallet-cli \
  nerva-marketplace-invoice-nerva \
  --generate-new-wallet /app/keys/mainnet_rpc
```
