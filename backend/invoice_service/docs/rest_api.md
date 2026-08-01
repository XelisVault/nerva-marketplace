# Invoices REST API

The full API docs can be found by visiting {host}/redoc

## Create an invoice

Make an HTTP POST request to /invoice/create with the amount specified in a JSON request body.

```
HTTP POST /invoice/create
HEADERS:
 application/json
BODY:
 { "amount": 15.5 }
```

## Retrieve an invoice

Make an HTTP GET request to /invoice/ with the ID of the invoice to retrieve.

```
HTTP GET /invoice/{invoice_id}
```