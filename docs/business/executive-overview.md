# Executive overview

## What this is

A point-of-sale and back-office system for a single convenience retail store:
the till the customer is served at, and the administration behind it — stock,
tax, staff, suppliers, customers and takings.

It runs as a web application. The till is a browser on the counter; the back
office is the same application seen with a manager's or owner's sign-in.

## The problems it addresses

| Problem | How it shows up in the shop |
| --- | --- |
| Tax applied by hand | Mixed baskets are taxed at one blended rate, or at whatever the cashier remembers |
| Age-restricted sales depend on memory | Alcohol and tobacco sold without a prompt to check ID |
| Takings reconciled on paper | The drawer is counted against a guess, and a shortfall is found a day later |
| Stock known only by looking at the shelf | Re-ordering is reactive; fast movers run out |
| No record of who did what | A disputed refund or a price change cannot be traced to a person |

## Who it is for

- **Owner** — sets prices and tax rates, sees the whole store, holds the audit trail.
- **Manager** — runs stock, suppliers, promotions and cashier accounts.
- **Cashier** — serves customers, opens and closes a shift, sees only their own sales.

## What it does

- Serves a customer end to end: scan or search, basket, tax, payment, receipt.
- Calculates GST per product division, applied per line and itemised on the bill.
- Enforces an ID prompt on age-restricted stock before a sale can complete.
- Tracks the cash drawer across a shift, with mid-shift and end-of-shift reports.
- Holds the catalogue, including bulk CSV import.
- Manages suppliers and a restocking workflow.
- Keeps customer records and a loyalty balance.
- Records an owner-only audit trail of sign-ins, sales, refunds and rate changes.

See [feature-guide.md](feature-guide.md) for what is verified, what is merely
present, and what is explicitly absent.

## What makes it defensible

**The till is not trusted with money.** Prices, tax and totals are recalculated
by the server from its own records on every sale. A modified browser cannot talk
the store into charging less. This is verified by an automated check.

**Tax is historical.** A receipt reprinted months later shows the rate that was
charged then, not the rate set today — which is what makes the record usable for
a tax return.

**It is one file to back up.** The entire store lives in a single SQLite
database. There is no database server to run, patch or hand credentials to.

## What it is not

It is a single-store system. It does not integrate with a card terminal, an
accounting package, or a supplier's ordering system, and it does not work
offline. Those boundaries are listed in full in
[feature-guide.md](feature-guide.md#not-present).

## Business results

No verified business outcomes are claimed. See
[business-results-and-evidence.md](business-results-and-evidence.md) for why,
and for the measurements that would establish them.
