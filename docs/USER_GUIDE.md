# User Guide - Buyers

Welcome to NERVA Marketplace! This guide walks you through everything you
can do as a buyer: registering an account, browsing listings, placing an
order, and tracking payment status.

> **Prerequisites**: To actually pay for an order you need a NERVA (XNV)
> wallet with some XNV in it. Get one at [nerva.one](https://nerva.one)
> and acquire XNV on Cratex, TradeOgre, or BitMesh - or mine it yourself
> with your CPU.

---

## 1. Create an account

1. Click **Sign in** in the top-right corner, then **Register**.
2. Choose a username (3–32 chars, letters / digits / underscore), enter
   your email, and pick a strong password (≥ 8 chars - the UI shows a
   strength meter).
3. Submit the form. We send you an activation email.
4. Click the activation link in the email. Your account is now active.
5. Sign in with your username + password.

> **In dev/preview mode** (when running locally without the Python
> backend), accounts are auto-activated - no email is sent. Demo accounts:
> `admin / admin123` (vendor) and `alice / alice123` (customer).

---

## 2. Browse listings

- Click **Browse** in the header (or **Browse marketplace** on the home
  page) to see all listings.
- Use the **search** box to filter by title, description, or vendor.
- Use the **sort** dropdown to sort by newest, price, or name.
- Click any listing card to see its full detail page.

---

## 3. View a listing

The listing detail page shows:

- The item image (with a fallback placeholder if the vendor didn't upload one).
- Title, vendor name, and posting date.
- **Price in XNV** (with a Nerva coin badge).
- Stock count.
- Three tabs:
  - **Details** - the full description.
  - **Vendor** - info about the seller.
  - **Shipping** - how shipping works on this marketplace.

Click **Add to cart** to add the item. If you're not signed in, you'll be
redirected to the login page (and returned to the listing after sign-in).

---

## 4. Manage your cart

- Click the **cart icon** in the header to view your cart.
- Each item shows its image, title, vendor, and XNV price.
- Click the **trash icon** on an item to remove it.
- The order summary on the right shows the running total in XNV.
- Enter your **shipping details** (full name, address, city, postal code,
  country, and any special instructions). These are visible only to the
  vendor of the items in your order.

> **Note**: all items in a single order must come from the same vendor.
> If your cart contains items from multiple vendors, check out in
> separate transactions.

---

## 5. Check out

1. Make sure your shipping details are filled in.
2. Click **Checkout**.
3. The system creates a unique NERVA subaddress for this order and
   redirects you to the **invoice page**.

---

## 6. Pay the invoice

The invoice page shows:

- **Amount due** in XNV.
- **NERVA subaddress** - a long string starting with `NV…`. Click the
  copy icon to copy it.
- A status banner: **Awaiting payment** (yellow) or **Payment confirmed**
  (green).
- A **Transactions** list that updates in real time as the network
  detects your payment.

To pay:

1. Open your NERVA wallet (e.g. `nerva-wallet-gui`).
2. Send **exactly** the amount due to the subaddress shown.
3. Wait - within a minute or two you should see the transaction appear
   in the **Transactions** list (status: *Pending*).
4. Once the network confirms the transaction (typically within another
   minute), the status flips to **Confirmed** and the vendor is notified.

> ⚠️ **Don't send from an exchange** - exchanges often send from shared
> addresses and don't always include the exact amount. Use a wallet you
> control.

---

## 7. Track your orders

Click your username in the header → **Your Orders**. You'll see a list
of every order you've placed, with:

- Order ID + date
- Payment status (Paid / Payment pending)
- Shipping status (Shipped / Not shipped)

When the vendor marks the order as shipped, the status updates here
automatically.

---

## FAQ

**Q: Can I cancel an order?**
A: Before you send payment: yes - just close the invoice page and don't
send XNV. The invoice will expire after some time. After you've sent
payment: no - on-chain payments are irreversible.

**Q: What if I send the wrong amount?**
A: The system requires the exact amount. If you send less, the invoice
won't be marked as confirmed and the vendor won't ship. Contact the
vendor directly to arrange a top-up or refund.

**Q: Why do I need to provide shipping details?**
A: So the vendor knows where to ship your item. Shipping details are
stored on the order record and only visible to the vendor of that order.

**Q: Is my payment private?**
A: Yes - NERVA is a privacy coin (Cryptonote + RingCT). Sender, recipient,
and amount are hidden on-chain. The vendor sees only their own subaddress
and the fact that it received a payment.

---

## Need help?

Open an issue on [GitHub](https://github.com/XelisVault/nerva-marketplace/issues).
