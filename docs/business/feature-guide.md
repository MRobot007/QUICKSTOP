# Feature and module guide

Every module below was opened in a running build and exercised against a demo
store before being written up. The status column says how far that went.

**Status key**

| Status | Meaning |
| --- | --- |
| Verified | Exercised end to end in a running build, result observed |
| Implemented | Present and loads, but not driven through a full workflow here |
| Partial | Works for the main path; a named part is missing |
| Not present | Does not exist — listed only to prevent assumptions |

---

## Till (point of sale)

**Route** `/` · **Users** Cashier, Manager, Owner · **Status** Verified

The selling screen. Products appear as a grid, filtered by a category rail or by
a search box that matches name, SKU or barcode. Selecting a product adds it to
the basket on the right.

- Basket shows per-line totals, subtotal, GST and grand total.
- Payment is cash, card, UPI, wallet, or a split across several.
- Cash payments show change due, with quick-add buttons for common notes.
- Age-restricted products (alcohol, tobacco, vapes) raise a verification prompt
  before the sale can complete; the till refuses the sale without it.
- A basket can be held and recalled, so one customer can step aside without
  losing the scan.
- A receipt opens on completion and can be printed to an 80mm or 58mm roll.

**Depends on** an open register and an open shift session.
**Business value** One screen handles the whole counter transaction, with the
tax and the age check enforced by the system rather than remembered by staff.

## Products

**Route** `/admin/products` · **Users** Manager, Owner · **Status** Verified

Catalogue management: name, SKU, barcode, brand, price, MRP, cost price, stock,
low-stock threshold, category and supplier. Supports CSV import and export for
bulk loading.

**Limitation** Stock is a single current figure. There is no movement history, so
"how did this product reach zero" cannot be answered.

## GST & Tax

**Route** `/admin/tax` · **Users** Owner only · **Status** Verified

Sets the GST percentage each product division is charged at, with one-tap
presets for the common slabs. A division with no rate set falls back to a store
default rather than to zero.

The rate is applied per line at the till, so a basket mixing a 5% snack with a
28% tobacco line bills each correctly and the receipt itemises both. The figure
on the bill is calculated by the server from its own reading of the rate — a
till that submits a different tax figure is ignored.

Changing a rate affects later sales only. A receipt reprinted from history keeps
the rate charged at the time.

## Sales history

**Route** `/admin/sales` (`/cashier/history` for cashiers) · **Status** Verified

Completed sales with their items, payments, customer and GST breakdown, and
receipt reprinting. A cashier sees only their own sales; managers and owners see
the store's.

## Customers and loyalty

**Route** `/admin/customers` · **Users** Manager, Owner · **Status** Implemented

Customer records with phone lookup and a loyalty point balance. Points accrue on
sale and can be redeemed against a later basket. Linking a customer at the till
is optional.

## Suppliers and purchase orders

**Routes** `/admin/suppliers`, `/admin/purchase-orders` · **Status** Implemented

Supplier directory with contact and terms, and a restocking workflow that moves
a purchase order from draft, to ordered, to received. Receiving an order
increases stock. Orders can be sent to a supplier as a prepared email.

## Promotions

**Route** `/admin/promotions` · **Users** Manager, Owner · **Status** Implemented

Percentage or fixed-amount discount rules, optionally scoped to a category and
to a date window, and switchable on and off.

## Register and shift control

**Routes** till banner, `/reports/x-report` · **Status** Verified

A shift opens with a counted cash float and closes with a counted total. The
X-report shows the position mid-shift; the Z-report closes it off. Cash, card
and digital takings are tracked separately, and refunds paid in cash reduce the
drawer.

## Refunds

**Route** `/admin/refunds` · **Users** Manager, Owner · **Status** Implemented

Refunds are taken against an original sale, line by line, and cannot exceed what
was sold or what has already been returned. Each line can optionally be put back
into stock. The approver recorded is the signed-in owner, or nobody.

## Team members

**Route** `/admin/users` · **Users** Manager, Owner · **Status** Verified

Staff accounts across three roles — Owner, Manager, Cashier — with activation
and password reset. A manager can create and manage cashiers only; owners and
other managers are out of reach.

## Audit trail

**Route** `/admin/audit-logs` · **Users** Owner only · **Status** Verified

A timestamped record of sign-ins, failed sign-ins, completed sales, refunds and
GST rate changes, attributed to a user where one is known.

## Reporting

**Routes** `/admin` dashboard, `/admin/sales`, export dialog · **Status** Implemented

Daily takings, a sales trend chart, low-stock warnings, and a date-range sales
export as CSV.

---

## Not present

Named to prevent assumptions in a sales conversation:

- No integrated card terminal. Card payment is recorded, not captured; the card
  reader indicator is a status display, not a payment integration.
- No accounting-package export beyond CSV.
- No multi-store or multi-branch model. One database is one store.
- No barcode label printing.
- No supplier-side ordering integration; purchase orders leave as email text.
- No stock movement history, only current stock.
- No offline mode. The till needs the API to be reachable.
