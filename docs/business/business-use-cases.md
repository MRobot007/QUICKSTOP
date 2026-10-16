# Business use cases

Scenarios for the retail setting this product actually supports: a single
store selling drinks, snacks, tobacco and alcohol over a counter. All names and
figures are illustrative.

## A neighbourhood convenience store

**Challenge** — one owner, three part-time cashiers, a mixed basket on nearly
every sale, and a licence to protect on alcohol and tobacco.

**Current process** — a basic till that totals items, tax worked out roughly, a
paper book for the drawer, and reordering done by eye.

**With the system** — divisions carry their own GST rate, so the basket is taxed
per line. Restricted stock raises an ID prompt that no cashier can skip. Each
shift opens with a counted float and closes against an expected figure. The
owner sees who did what.

**Expected benefit** — correct tax per line, a consistent ID check, and a cash
variance attributable to a shift.

**Measured by** — GST collected per rate; verification rate on restricted lines;
cash variance per shift.

## A store with staff turnover

**Challenge** — new cashiers start often; each one is a fresh chance to mis-key
a price or forget an ID check.

**Current process** — training, and supervision at the counter.

**With the system** — prices come from the catalogue, not from the keypad; tax
comes from the division; the ID prompt is raised by the product. A cashier
account can be created by a manager and deactivated the day someone leaves,
without touching anything else.

**Expected benefit** — less that a new starter can get wrong, and a faster
off-boarding.

**Measured by** — price-override frequency; restricted-line verification rate;
time from leaving to account deactivation.

## An owner who is not in the shop

**Challenge** — the owner wants to know the day's position without standing at
the counter.

**Current process** — a phone call, or waiting for the evening cash-up.

**With the system** — the dashboard shows takings, payment mix and low stock.
The X-report gives a mid-shift position. The audit trail shows sign-ins, sales,
refunds and rate changes.

**Expected benefit** — same-day visibility and traceable actions.

**Measured by** — proportion of queried transactions resolved from the trail.

## Preparing a tax return

**Challenge** — the return needs tax split by rate, and the figures must still
be defensible months later.

**Current process** — reconstructing bands from totals.

**With the system** — each sale line stores the rate it was charged at and the
tax taken. A reprint shows what was charged at the time, not today's rate. The
sum by rate is a single query.

**Expected benefit** — a per-rate figure that reconciles to the receipts the
customers were given.

**Measured by** — sum of line tax by rate for the period, reconciled against
recorded sales.

---

Use cases deliberately not written: multi-branch operations, franchise
reporting, e-commerce, pharmacy or age-verification scanning hardware,
and accounting-package integration. The system does not support them — see
[feature-guide.md](feature-guide.md#not-present).
