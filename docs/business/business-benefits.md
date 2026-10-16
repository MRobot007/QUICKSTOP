# Business benefits and value proposition

Each benefit below names the KPI that would confirm it and the evidence
available today. **No benefit here has been measured in a trading store** — see
[business-results-and-evidence.md](business-results-and-evidence.md).

Status: *Expected* means reasoned from how the software behaves. *Verified
behaviour* means the mechanism was tested; the business effect still was not.

---

## Correct tax on a mixed basket

| | |
| --- | --- |
| **Business problem** | A convenience basket mixes tax bands — snacks, drinks, tobacco. Applying one rate to the whole basket is wrong in both directions. |
| **Existing workflow** | A single blended rate, or the cashier applying rates by memory. |
| **Product capability** | Each product division carries its own GST rate. The server applies it per line and itemises each rate on the bill. |
| **Improved workflow** | The cashier scans. Nobody decides a tax rate at the counter. |
| **Business benefit** | Correct tax per line; a bill that itemises its bands. |
| **Measurement** | GST collected by rate, against expected rate × taxable value per band. |
| **Evidence** | Verified behaviour — automated check confirms the rate comes from the category, not the till. Business effect not measured. |

## A till that cannot be talked into charging less

| | |
| --- | --- |
| **Business problem** | A browser-based till is a client. If it is trusted with the arithmetic, a modified one can set its own prices. |
| **Existing workflow** | Trust the terminal. |
| **Product capability** | Prices, tax and totals are recalculated server-side from the store's own records on every sale; a submitted total is ignored. |
| **Improved workflow** | Unchanged for staff — the control is invisible at the counter. |
| **Business benefit** | Takings match the price list regardless of the terminal. |
| **Measurement** | Expected revenue (price × quantity sold) against recorded revenue; a gap indicates a problem. |
| **Evidence** | Verified behaviour — a sale submitting zero tax and a $0.01 total is rejected and billed correctly. |

## ID checks that cannot be forgotten

| | |
| --- | --- |
| **Business problem** | Selling alcohol or tobacco without checking age carries a licence risk, and depends on staff memory at a busy counter. |
| **Existing workflow** | Staff training and a sign by the till. |
| **Product capability** | Products flagged age-restricted force a verification prompt; the sale cannot complete without it. The flag is also inferred from the product name and aisle. |
| **Improved workflow** | The prompt appears on the basket that needs it, every time, for every cashier. |
| **Business benefit** | A consistent check, and a record that it happened. |
| **Measurement** | Restricted-line sales with a recorded verification ÷ all restricted-line sales. Should be 1.0. |
| **Evidence** | Verified behaviour — the sale is refused without the flag. Effect on licence outcomes not measured. |

## Knowing the drawer before the day ends

| | |
| --- | --- |
| **Business problem** | A cash discrepancy found the next day cannot be traced to a shift or a person. |
| **Existing workflow** | Count at close; reconcile against a till roll. |
| **Product capability** | A shift opens with a counted float and closes with a counted total. Cash, card and digital are tracked separately; cash refunds reduce the drawer. An X-report shows the position mid-shift. |
| **Improved workflow** | The expected figure is available at any point, per shift, per cashier. |
| **Business benefit** | A variance is attributable to a shift while the day is still fresh. |
| **Measurement** | Counted cash minus expected cash at close, by shift. |
| **Evidence** | Expected. Mechanism present and exercised; no variance data collected. |

## Reordering before the shelf is empty

| | |
| --- | --- |
| **Business problem** | Fast movers run out because nobody notices until the gap appears. |
| **Existing workflow** | Walking the aisles. |
| **Product capability** | Per-product low-stock threshold, a low-stock view, and a purchase-order workflow that raises stock on receipt. |
| **Improved workflow** | The reorder list is produced from stock levels rather than from a walk round. |
| **Business benefit** | Fewer stock-outs on known fast movers. |
| **Measurement** | Count of products at zero stock during trading hours, per week. |
| **Evidence** | Expected. **Blocked for measurement** — the system keeps current stock only, with no movement history, so stock-outs cannot be counted retrospectively. |

## Tracing a disputed transaction

| | |
| --- | --- |
| **Business problem** | A refund or a price change is questioned weeks later and nobody can say who did it. |
| **Existing workflow** | Memory and paper. |
| **Product capability** | An owner-only audit trail records sign-ins, failed sign-ins, sales, refunds and GST rate changes with timestamps and the user. Refunds are bounded by what was actually sold. Receipt numbers are unique per sale. |
| **Improved workflow** | The question is answered from the trail. |
| **Business benefit** | Attributable actions; refunds that cannot exceed the original sale. |
| **Measurement** | Proportion of queried transactions resolved from the trail without escalation. |
| **Evidence** | Verified behaviour for the trail and the refund bounds. Resolution rate not measured. |

---

## Benefits deliberately not claimed

- **Faster service.** Plausible, but no baseline exists for the current counter,
  so a speed claim would be invented.
- **Reduced shrinkage.** The controls support it; nothing has measured it.
- **Labour savings.** Needs a timed baseline. See the method and its
  preconditions in
  [business-results-and-evidence.md](business-results-and-evidence.md).
