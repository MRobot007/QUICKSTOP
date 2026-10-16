# Demo recording scripts

Shot lists and narration for four recordings, each 30–90 seconds.

All four have been recorded **with spoken narration** — see
[video-index.md](video-index.md) for the files. The lines below are the script
those recordings follow; each is both spoken aloud and shown as a caption, and
none claims anything the software does not do.

The authoritative shot lists live in `scripts/record-demo.mjs`, which is what
actually drives the recordings. Edit there, then re-run.

## Before recording

1. Bring up a disposable store and seed it (commands in
   [README.md](README.md#reproducing-the-screenshots)).
2. Sign in beforehand so no password is ever on screen.
3. A clean browser profile is used automatically, at 1280x800.
4. Confirm the receipt header reads a placeholder shop name, not a real one.

---

## 01-product-overview.mp4 — 60–75s

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00 | Till, full grid | "This is the counter screen of a point-of-sale system for a convenience store." |
| 0:10 | Select a category in the rail | "Products are grouped by aisle, and searchable by name, SKU or barcode." |
| 0:20 | Open the admin dashboard | "Behind it sits the back office — takings for the day, payment mix, and stock running low." |
| 0:35 | Sidebar, pausing on each | "Products and pricing. Tax rates. Sales history. Suppliers and reordering. Customers. Staff accounts. And an audit trail the owner alone can see." |
| 0:55 | Back to the till | "One application covers the counter and everything behind it." |

## 02-primary-workflow.mp4 — 60–90s

A complete sale.

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00 | Empty basket | "A customer comes to the counter." |
| 0:05 | Add a snack and a drink | "Items are added by scan or by search." |
| 0:18 | Add a tobacco line; prompt appears | "Anything age-restricted stops the sale until the ID check is confirmed. The cashier cannot skip it." |
| 0:30 | Confirm the check | "Once confirmed, the sale continues." |
| 0:38 | Point at the totals | "The basket shows subtotal, GST and the total, with the tax worked out per line." |
| 0:48 | Choose cash, enter amount | "Payment can be cash, card, a digital method, or split across several. Change due is calculated." |
| 1:00 | Complete; receipt opens | "The receipt itemises the tax bands in the basket." |
| 1:10 | Close receipt | "Stock is reduced and the drawer updated." |

## 03-tax-automation.mp4 — 45–60s

The feature that distinguishes the product.

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00 | GST & Tax screen | "Each product division carries its own tax rate." |
| 0:10 | Change Snacks from 5 to 12, save | "Changing a rate takes one edit." |
| 0:22 | Go to the till, add a snack | "The next sale in that division bills at the new rate." |
| 0:35 | Show the receipt breakdown | "A basket spanning two bands shows both, separately, on the bill." |
| 0:45 | Open an older sale in history | "And a receipt reprinted later shows the rate that was charged at the time — not today's." |

> Accuracy note: the rate shown on the bill is calculated by the server from its
> own record. Do not narrate anything about the till computing it.

## 04-business-value.mp4 — 60–75s

| Time | On screen | Narration |
| --- | --- | --- |
| 0:00 | Till at shift start, float prompt | "A shift opens with a counted cash float." |
| 0:12 | Ring up a short sale | "Sales are recorded against that shift and that cashier." |
| 0:25 | Open the X-report | "At any point the expected drawer position is available — cash, card and digital kept apart." |
| 0:40 | Open the audit trail | "Sign-ins, sales, refunds and tax-rate changes are recorded against the person who made them." |
| 0:55 | Dashboard | "So a discrepancy is attributable to a shift the same day, rather than found the next morning." |

> Do not state a figure for time saved, shrinkage reduced or efficiency gained.
> None has been measured. See
> [../business/business-results-and-evidence.md](../business/business-results-and-evidence.md).

---

## Checks before publishing a recording

- No password, token or credential visible at any point.
- No real customer, staff or supplier data.
- No client or product brand name in the interface, the browser tab, or the
  receipt header.
- Text readable at the final resolution.
- Duration within 30–90 seconds.
- Narration matches what the screen actually does.
