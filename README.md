# Retail POS

Point of sale for a convenience store — beer and spirits, soft drinks and
energy, snacks, vapes and tobacco. Runs entirely on your own machine: a Next.js
front end, a PHP API, and a single SQLite file. Nothing is deployed and nothing
talks to a remote database.

## What you need

- **Node.js 18+** — for the front end.
- **PHP 8.1+ with `pdo_sqlite`** — for the API. If you have XAMPP, this is
  already installed at `C:\xampp\php\php.exe`.

There is no database server to install or start.

## Running it

Two terminals, from the project root:

```bash
npm install

# terminal 1 — the API on http://127.0.0.1:8080
npm run api

# terminal 2 — the POS on http://localhost:3000
npm run dev
```

If `php` is not on your PATH, point at it directly instead of `npm run api`:

```bash
"C:\xampp\php\php.exe" -S 127.0.0.1:8080 -t . api/router.php
```

Then open <http://localhost:3000>. The till is at `/`, the back office at
`/admin`.

### Signing in

Two accounts are created on first run, `owner@example.com` and
`manager@example.com`. Their password is generated when the store is built
and written to `api/data/FIRST-RUN-PASSWORD.txt` — read it, sign in, then
change both passwords under **Admin → Users** and delete the file. To pick the
password yourself instead, set `SEED_PASSWORD` before the first request.

The login screen has one-click buttons that fill in each email.

## The store data

The database is one file: `api/data/quickstop.sqlite`. It does not exist until
the first API request, at which point the schema is created and a starter shelf
is loaded — 4 aisles and 12 products:

| Aisle                | Products                                         |
| -------------------- | ------------------------------------------------ |
| Beer & Alcohol       | Modelo 12-pack, White Claw 6-pack, Jack Daniel's |
| Soft Drinks & Energy | Coca-Cola, Red Bull, Dasani water                |
| Snacks               | Lay's, Snickers, Jack Link's jerky               |
| Vapes & Tobacco      | Elf Bar, JUUL pods, Marlboro Gold                |

That is a starting point, not an inventory — add real stock through
**Admin → Products**, or bulk-load it with the CSV import on the same page.

To wipe everything and start over from the demo catalog:

```bash
npm run db:reset
```

The file is git-ignored, so your sales, staff and stock stay on your machine.

## GST

Each product division carries its own GST rate, set under **Admin → GST & Tax**
(owner only). A division with no rate of its own is billed at the store default,
`DEFAULT_GST_RATE`, which is 8.25% unless you change it.

The rate applies per line, so a basket of 5% snacks and 28% tobacco bills each
at its own rate and the receipt itemises both. The till shows a running estimate
while items are scanned, but the figures on the bill come from the server's own
read of the rates — a modified till cannot talk the store into charging less.

Changing a rate affects sales made from then on. A receipt reprinted from Sales
History keeps the rate that was charged at the time.

## Hardware

Both the receipt printer and the barcode scanner are model-independent — there
is nothing to change in the code when you buy one.

### Barcode scanner

Any USB scanner gun works. They present themselves as keyboards: the gun types
the barcode and presses Enter, so there is no driver to install and no model to
configure.

The till listens for that at the window, not in a particular text box, so a scan
registers even when the cashier has just tapped a button. Scans are told apart
from typing by speed — a gun bursts characters milliseconds apart, and anything
slower is treated as someone using the search box. A scanned code is matched
against what is on screen first, then against the whole catalogue by barcode, so
it works regardless of the current search or category filter. An unknown or
out-of-stock code says so instead of failing silently.

If your gun is configured to send Tab instead of Enter, that works too.

    npm run test:scanner   # checks the scan-vs-typing rule

### Receipt printer

Receipts print through the browser, so the printer needs a normal Windows
driver: for Epson that is the **Advanced Printer Driver (APD)**, installed for
your exact model. The generic "Text Only" driver will not do — the browser
sends a rendered page, not ESC/POS text.

Set the paper width if it is not 80mm:

    NEXT_PUBLIC_RECEIPT_WIDTH_MM=58

At 58mm the page width, margins and body text follow automatically, but print
one and check the headings before relying on it.

In the browser's print dialog set margins to **None** and scale to **100%**, and
save that as the default for the printer.

A cash drawer on the printer's RJ11 port is opened by the driver, not by this
app — turn on "open drawer before printing" in the APD settings.

The X-report prints on the same roll, as a plain monospace summary — session id,
transaction count, gross revenue, cash/card/refund split, opening cash, expected
drawer, and the department breakdown. The dashboard you see on screen is not what
comes out of the printer.

## Age-restricted stock

Products carry an age-restriction flag (`products.is_alcohol` in the schema —
the column name is historical). It is set automatically from the product or
category name for alcohol *and* nicotine, and it can be toggled by hand in
Admin → Products.

When a basket contains anything flagged, the till blocks checkout until the
cashier confirms the age check. The API enforces this too, so it cannot be
skipped by calling the endpoint directly.

## Theming

The palette is **Deep Teal & Brass**, and it lives in one place:
[tailwind.config.js](tailwind.config.js). Components reference colours by name
(`brand-600`, `bg-primary`, `text-dark`) and never hardcode a hex, so
re-theming the whole POS means editing that one block.

| Token          | Value                 | Used for                          |
| -------------- | --------------------- | --------------------------------- |
| `brand-50/100` | `#F2F7F6` / `#DCEAE8` | Card surfaces and borders         |
| `brand-400`    | `#6A9A97`             | Muted icons, sidebar labels       |
| `brand-600`    | `#2F6764`             | Secondary body text               |
| `primary`      | `#14534F`             | Buttons, headings, links          |
| `rail`         | `#0A2422`             | Sidebar rails                     |
| `accent`       | `#8E631F`             | Brass accent - badges, highlights |
| `canvas`       | `#F7FAFA`             | Page background behind cards      |
| `dark`         | `#0C1A19`             | Body copy                         |

Every pairing that carries text clears WCAG AA (4.5:1). If you change the ramp,
keep that true: `brand-600` and darker are the only steps safe for body text on
a light surface, and `accent` (brass-600) is the only brass step safe to put
white text on.

Status colours - the green / amber / red / blue on stock and order badges - sit
deliberately *outside* the brand ramp, because they carry meaning rather than
branding. Don't fold them into the palette.

## Layout

```
app/            Next.js pages — POS terminal, admin, reports
components/     Shared React components
lib/            API client and config
api/            PHP API
  index.php       every route
  schema.php      SQLite schema + the demo catalog
  db.php          connection, pragmas, first-run install
  config.php      file paths, token secret, CORS
  data/           the SQLite file (git-ignored)
```
