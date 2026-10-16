# Point of sale for convenience retail

A till and back office for a single shop selling drinks, snacks, tobacco and
alcohol — in one web application, on ordinary hardware.

## Who it is for

Independent convenience stores, off-licences and forecourt shops: one site, a
handful of staff, a mixed basket on nearly every sale.

## What it does

- **Serves the counter.** Scan or search, build a basket, take cash, card, UPI,
  wallet or a split, print a receipt.
- **Gets the tax right per line.** Each product division carries its own GST
  rate. A basket mixing a 5% snack with a 28% tobacco line bills each correctly,
  and the receipt itemises both.
- **Prompts for ID.** Age-restricted products stop the sale until the check is
  confirmed.
- **Tracks the drawer.** Shifts open with a counted float and close against an
  expected figure, with cash, card and digital kept apart.
- **Holds the catalogue.** Prices, stock, low-stock thresholds, suppliers, and
  bulk CSV import.
- **Reorders.** Purchase orders from draft to received, raising stock on arrival.
- **Remembers customers.** Optional customer records with a loyalty balance.
- **Records who did what.** An owner-only trail of sign-ins, sales, refunds and
  tax-rate changes.

## The problems it addresses

| Problem | What changes |
| --- | --- |
| One blended tax rate on a mixed basket | Tax applied per line, from the product's division |
| ID checks relying on memory | The product raises the prompt, every time |
| Cash discrepancies found a day late | Expected drawer figure available mid-shift |
| Reordering by walking the aisles | Reorder list produced from stock levels |
| No record of who changed a price | Timestamped, attributed audit trail |

## How it is built

The till is not trusted with money. Prices, tax and totals are recalculated by
the server from the store's own records on every sale, so a modified terminal
cannot change what is charged. Tax rates are stored with each sale line, so a
receipt reprinted months later shows what was actually charged.

The whole store is a single file. There is no database server to run or patch,
and a backup is a file copy.

## What it is not

A single-store system. It does not integrate with a card terminal, an accounting
package or a supplier's ordering system, and it does not run offline.

## Results

No customer outcome figures are published. The product has not yet run in a
trading store for a measured period, and publishing numbers from a demonstration
dataset would be misleading.
