# Business results and evidence

**Status: no verified business outcomes can be claimed for this product today.**

This document exists to say that plainly, and to set out exactly what would be
needed to make a defensible claim later.

## Why there is nothing to report yet

A business result needs three things: a baseline, a measurement after the
change, and a population of real work to measure across. This product currently
has none of them available for inspection.

| What a result needs | What exists | Gap |
| --- | --- | --- |
| A baseline of the manual process | Nothing recorded | No one has timed the current till, paperwork or stock count |
| Live operational data | One store with a handful of records | Not a population; no period of continuous trading |
| A defined measurement window | None | No start and end date over which anything was tracked |
| An approved source to quote | None | No customer has approved publishing their figures |

Every number that could be produced from the current database would describe a
demonstration dataset that was generated for screenshots. Publishing those as
business results would be fabrication, so none are published here.

## What *is* evidenced

These are facts about the software, verified by running it. They are not
business outcomes and must not be presented as such.

| Statement | Evidence | How to reproduce |
| --- | --- | --- |
| Tax is calculated server-side from the category rate, and a till that sends a different figure is ignored | Automated check "GST is charged at the category rate, not the rate the client sent" | `php api/selfcheck.php <url> <password>` |
| A reprinted receipt shows the rate charged at the time of sale, not the current rate | Automated check "a reprint keeps the rate that was charged" | same |
| A signed-out token stops working immediately | Automated check "logout revokes the token server-side" | same |
| 20 of 20 automated checks pass | Self-check run, 2026-10-12, exit code 0 | same |
| Receipt numbers are unique per sale | `receipt_number` is derived from the sale's row id | Ring up two sales in the same second |

## The instrumentation already in place

The application writes an audit trail (`audit_logs`) which records, with
timestamps: sign-ins, failed sign-ins, completed sales, refunds, and GST rate
changes. Sales carry their own timestamps, as do sessions and purchase orders.

That means the data needed for several metrics is *already being collected* —
what is missing is a trading period to collect it over, and a baseline to
compare against.

## What to measure, and how

Each row below is a candidate metric with the query that would produce it. None
has been run against real trading data.

| Metric | Definition | Source once trading | Classification it would earn |
| --- | --- | --- | --- |
| Sales completed | Count of rows in `sales` for the period | `SELECT COUNT(*) FROM sales WHERE created_at BETWEEN ? AND ?` | Measured |
| Average basket value | Sum of `sales.total` ÷ count of sales | `SELECT AVG(total) FROM sales WHERE …` | Measured |
| Average time per sale | Median gap between consecutive `sales.created_at` on one session | Derived from `sales` + `sessions` | Measured |
| GST collected by rate | Sum of `sale_items.tax` grouped by `sale_items.gst_rate` | `SELECT gst_rate, SUM(tax) FROM sale_items GROUP BY gst_rate` | Measured |
| Till variance at close | Counted cash minus expected cash at shift close | `registers.current_cash` vs counted figure | Measured |
| Stock-out incidence | Products reaching zero stock during the period | `products.stock` history — **not currently retained** | Blocked: needs a stock-movement log |
| Staff hours saved | (Baseline minutes per task − observed minutes per task) × tasks completed | Needs a timed baseline that does not exist | Estimated at best, and only after a baseline study |

### If a time-saved figure is ever published

Use this and show the workings:

```
hours saved = (baseline minutes per task - observed minutes per task)
              x tasks completed
              / 60
```

and state, alongside the number: who was timed for the baseline, how many
people, over what period, which tasks were excluded, and whether the observed
figure came from the same staff. Without those, the number is not defensible and
should not appear on a website.

## Rules applied to this document

- No invented savings, percentages, conversion rates or ROI.
- No customer names, testimonials, case studies or logos.
- No compliance claim (HIPAA, SOC 2, ISO, PCI) — see
  [security-and-privacy.md](security-and-privacy.md) for what is actually true.
- Anything later added here carries its source, its query, its period and its
  classification: measured, benchmarked, estimated, or illustrative.
