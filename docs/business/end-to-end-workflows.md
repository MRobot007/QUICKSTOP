# End-to-end workflows

Each workflow was followed in a running build against a demo store.

## 1. Serving a customer

```
Open shift ─► Scan / search ─► Basket ─► [ID check if restricted]
   ─► Payment ─► Server prices & taxes the sale ─► Receipt ─► Stock reduced
```

| Step | What happens | Where it is recorded |
| --- | --- | --- |
| Open shift | Cashier enters a counted cash float | `sessions`, `registers` |
| Add items | Product looked up by barcode, name or SKU | basket is browser-side only |
| Restricted line | Age prompt raised; sale blocked until confirmed | `sales.age_verified`, audit trail |
| Payment | Cash, card, UPI, wallet, or a split | `payment_records` |
| Submit | **Server** re-reads prices and category GST rates, recalculates line tax, subtotal and total, and ignores any figures the till sent | `sales`, `sale_items` |
| Receipt | Printed from the server's figures, with GST itemised per rate | `receipts` |
| After | Stock reduced; cash drawer increased by the cash portion; loyalty points moved | `products`, `registers`, `customer_profiles` |

**KPIs** — sales completed, average basket value, GST collected per rate,
restricted-line verification rate.

## 2. Setting a tax rate

```
Owner ─► GST & Tax ─► Set rate on a division ─► Save
   ─► Next sale in that division bills at the new rate
   ─► Earlier receipts keep the old rate
```

The split matters: changing a rate must not rewrite history. Line-level rates
are stored with each sale, so a reprint shows what was charged at the time. The
change itself is recorded in the audit trail.

**KPIs** — GST collected by rate; rate changes per period and by whom.

## 3. Restocking

```
Low-stock view ─► Purchase order (draft) ─► Mark ordered ─► Send to supplier
   ─► Goods arrive ─► Receive ─► Stock raised
```

Receiving records the quantity actually received against the quantity ordered,
so a short delivery is visible. Stock rises only on receipt, not on order.

**KPIs** — time from order to receipt; short-delivery rate per supplier.

## 4. Refunding

```
Find sale ─► Choose lines and quantities ─► Reason ─► Restock? ─► Confirm
```

The refund cannot exceed the quantity originally sold, less anything already
refunded against that line. Cash refunds reduce the drawer. The approver
recorded is the signed-in owner, or nobody — it is never a name supplied by the
browser.

**KPIs** — refunds as a share of sales; refund value by reason; restock rate.

## 5. Closing a shift

```
X-report (position so far) ─► Count drawer ─► Close ─► Z-report (final)
```

Cash, card and digital are separated so the counted cash is compared only
against the cash expected. Variance is visible at close rather than the next day.

**KPIs** — cash variance per shift; takings by payment method.
