# Nerva Invoice Service

## Docker Setup

Paste the `.cache` and `.keys` files for your Nerva wallet in the `keys` folder.

It is recommended that you use a view-only wallet for this since your keys will only used for scanning incoming transactions.

Configure the `nerva-wallet-rpc` command line arguments in the `Dockerfile.nerva` CMD.
You will likely need to set the `--wallet-file` and `--daemon-address` flag values.

Startup the docker cluster from the `infrastructure` folder: `cd infrastructure && docker compose up --build`

## Documentation

[architecture.md](docs/architecture.md)

[rest_api.md](docs/rest_api.md)