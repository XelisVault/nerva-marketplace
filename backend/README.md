# Nera Marketplace Backend

The backend is split into two separate services:

* The main marketplace backend, which handles:
    * storage and presentation of marketplace listings
    * user identification and authentication
    * management of ephemeral shopping carts
    * order tracking

* The Nerva invoice internal service, which handles:
    * generation of unique invoice addresses to associate with an order
    * continuous scanning of the Nerva blockchain for new incoming transactions
    * websocket notifications to the frontend clients for invoice status change events

