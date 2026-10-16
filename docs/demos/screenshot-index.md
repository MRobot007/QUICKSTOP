# Screenshot index

Captured from the running application against a disposable demo store holding
only synthetic data. Regenerate with the command in [README.md](README.md).

All desktop captures are 1680px wide (the requirement is 1600 or more). Mobile
captures are a genuine 390x844 phone viewport at 2x, rendered by the browser at
phone width — not a resized desktop image.

## Desktop — 14 images, `screenshots/desktop/`

| Screen | Route | Pixels | Shows |
| --- | --- | --- | --- |
| Sign in | `/admin/login` | 1680x1050 | Authentication entry point; no credentials shown on screen |
| Till | `/` | 1680x1050 | Product grid, basket, GST totals and payment selection |
| Dashboard | `/admin` | 1680x1050 | Takings, stock warnings and sales trend at a glance |
| Products | `/admin/products` | 1680x1050 | Catalogue with stock levels, search and CSV import/export |
| GST & Tax | `/admin/tax` | 1680x1050 | Per-category GST rate the bill is calculated from |
| Categories | `/admin/categories` | 1680x1050 | Product divisions and their product counts |
| Sales history | `/admin/sales` | 1680x1050 | Completed sales with per-sale GST breakdown |
| Customers | `/admin/customers` | 1680x1050 | Customer records and loyalty balances |
| Suppliers | `/admin/suppliers` | 1680x1050 | Supplier directory and ordering terms |
| Purchase orders | `/admin/purchase-orders` | 1680x1050 | Restocking workflow from draft to received |
| Promotions | `/admin/promotions` | 1680x1050 | Percentage and fixed-amount discount rules |
| Team members | `/admin/users` | 1680x1050 | Staff accounts and role assignment |
| Audit trail | `/admin/audit-logs` | 1680x1050 | Owner-only record of sign-ins, sales and rate changes |
| Shift history | `/cashier/history` | 1680x1050 | A cashier reviewing and reprinting their own sales |

## Mobile — 14 images, `screenshots/mobile/`

| Screen | Route | Pixels | Shows |
| --- | --- | --- | --- |
| Sign in | `/admin/login` | 780x1688 | Authentication entry point; no credentials shown on screen |
| Till | `/` | 780x1688 | Product grid, basket, GST totals and payment selection |
| Dashboard | `/admin` | 780x1688 | Takings, stock warnings and sales trend at a glance |
| Products | `/admin/products` | 780x1688 | Catalogue with stock levels, search and CSV import/export |
| GST & Tax | `/admin/tax` | 780x1688 | Per-category GST rate the bill is calculated from |
| Categories | `/admin/categories` | 780x1688 | Product divisions and their product counts |
| Sales history | `/admin/sales` | 780x1688 | Completed sales with per-sale GST breakdown |
| Customers | `/admin/customers` | 780x1688 | Customer records and loyalty balances |
| Suppliers | `/admin/suppliers` | 780x1688 | Supplier directory and ordering terms |
| Purchase orders | `/admin/purchase-orders` | 780x1688 | Restocking workflow from draft to received |
| Promotions | `/admin/promotions` | 780x1688 | Percentage and fixed-amount discount rules |
| Team members | `/admin/users` | 780x1688 | Staff accounts and role assignment |
| Audit trail | `/admin/audit-logs` | 780x1688 | Owner-only record of sign-ins, sales and rate changes |
| Shift history | `/cashier/history` | 780x1688 | A cashier reviewing and reprinting their own sales |

## Verification

Each file is checked at capture time by reading its PNG header, so the
dimensions above are read back off the saved image rather than assumed. The run
exits non-zero if any image misses its size target.

Checked by hand on the captured set:

- No client or product brand name appears in any image.
- No password, token or credential appears in any image.
- Every person, phone number and sale is fictional (see
  `scripts/seed-demo-data.mjs`).
- Phone numbers come from +1-202-555-0100..0199, reserved for fiction.
