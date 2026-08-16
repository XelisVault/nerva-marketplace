# Vendor Guide — Sellers

This guide is for **vendors** — users who want to list goods for sale on
NERVA Marketplace and receive XNV payments directly to their own wallet.

> **How do I become a vendor?**
> Currently, vendor status is granted manually by the marketplace
> operator. Open an issue on
> [GitHub](https://github.com/XelisVault/nerva-marketplace/issues) with
> your username and what you'd like to sell. In a future release, vendors
> will be able to self-register with an on-chain proof-of-stake.

---

## 1. Sign in as a vendor

Once your account has vendor privileges:

1. Sign in normally.
2. The header will show a **Create Listing** link in the account dropdown.
3. The **Vendor Orders** link appears in the same dropdown.

If you don't see these links, your account doesn't have vendor status.

---

## 2. Create a listing

1. Click **Create Listing** (in the header dropdown or the listings page).
2. Fill in the form:
   - **Title** (3–120 characters)
   - **Description** (10–2048 characters) — describe the item, its
     condition, what's included, shipping terms, etc.
   - **Price (XNV)** — the price in NERVA. Must be between 0.0001 and
     1,000,000 XNV.
   - **Image** — PNG or JPEG, max 10 MB. This is the image buyers will
     see on the listing card and detail page.
3. Click **Publish listing**.

Your listing is immediately visible on the marketplace.

> **Image tips**: square images work best (4:3 aspect ratio is also fine).
> The marketplace generates a thumbnail automatically. Avoid images with
> watermarks from other marketplaces.

---

## 3. Receiving orders

When a buyer checks out an order containing your listing:

1. A unique NERVA subaddress is generated **for the marketplace wallet**
   (not your personal wallet — see [How payments work](#how-payments-work)
   below).
2. The buyer sends XNV to that subaddress.
3. The `nerva-wallet-rpc` daemon detects the transaction and notifies
   the marketplace.
4. The order appears in your **Vendor Orders** page with status
   *Awaiting payment* (yellow badge).
5. Once the transaction is confirmed on-chain (1 confirmation, ~1 minute),
   the status flips to *Paid* (green badge).

---

## 4. Fulfil an order

1. Go to **Vendor Orders**.
2. Find the order with status *Paid*.
3. The shipping details the buyer provided at checkout are visible on
   the order detail. (Currently the order list page doesn't surface
   shipping details — this is a known TODO. For now, query the database
   directly or wait for the next release.)
4. Ship the item.
5. Mark the order as shipped. (Currently this is a manual DB update —
   the UI button is a planned feature. See
   [issue tracker](https://github.com/XelisVault/nerva-marketplace/issues).)

---

## 5. How payments work

> ⚠️ **Important**: payments do **not** go directly to your personal wallet.
> They go to a **marketplace wallet** controlled by the operator. The
> marketplace operator must manually forward the XNV to your wallet
> (minus any fees).

This is a known architectural limitation inherited from the original
codebase. A future release will generate subaddresses from each vendor's
own wallet view key, eliminating the need for the operator to forward
payments.

For now, if you're a vendor, agree on a payout cadence with the
marketplace operator before listing.

---

## 6. Listing best practices

- **Be honest about condition.** If an item is used, say so. The
  marketplace has no review system yet (planned) but dishonest listings
  will be removed.
- **Set a fair XNV price.** XNV is volatile — consider repricing
  periodically. The marketplace does not auto-adjust prices.
- **Respond to issues promptly.** Buyers can't message you directly
  through the marketplace yet (planned). For now, they'll open a issue
  on GitHub.
- **Ship quickly.** Once an order is *Paid*, the buyer is watching the
  shipping status. Mark as shipped as soon as you've dispatched the
  item.

---

## 7. Removing a listing

Currently there's no UI for deleting or pausing a listing. To remove
one, contact the marketplace operator. A delete-listing UI is planned.

---

## FAQ

**Q: How much does it cost to list?**
A: Listing is free. The marketplace may charge a fee on completed orders
in the future — currently there is none.

**Q: Can I sell digital goods?**
A: The marketplace was designed for physical goods (the shipping-details
flow is mandatory). Digital goods are not explicitly forbidden, but
you'd need to put the download link in the shipping details. A
proper digital-goods flow is planned.

**Q: Can I edit a listing after publishing?**
A: Not yet — editing is a planned feature. For now, delete (via the
operator) and re-create.

**Q: What happens if a buyer doesn't pay?**
A: The invoice just stays *pending* indefinitely. The item's stock is
decremented at checkout time, so it may appear sold out to other buyers
even if the original buyer never pays. The operator can manually
restore stock in this case — auto-restock is planned.
