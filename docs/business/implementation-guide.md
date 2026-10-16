# Implementation and deployment guide

No credentials or secrets appear in this document. Configuration names are
listed; values belong in the environment.

## What it runs on

| Component | Requirement |
| --- | --- |
| Application | Node.js 18+ (built and verified on Node 22) |
| API | PHP 8.1+ with PDO SQLite |
| Database | SQLite — a single file, created on first request |
| Browser | Any current Chrome, Edge, Firefox or Safari |
| Receipt printer | Any printer the browser can print to; 80mm or 58mm roll |

There is no database server to install, and no message broker, cache or
background worker.

## Installing

1. Install dependencies: `npm install`
2. Start the API (serves `/api` and creates the store on first request).
3. Build and start the application: `npm run build`, then `npm start`.
4. On first request the schema is created, a demo catalogue is loaded, and a
   random password for the two seeded accounts is written to a file beside the
   database.
5. Read that file, sign in, change both passwords under **Team Members**, then
   delete the file.

## Configuration

Names only — see `.env.example` for the full annotated list.

| Setting | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Where the browser reaches the API |
| `NEXT_PUBLIC_SHOP_NAME` | Trading name printed on receipts, exports and supplier emails |
| `NEXT_PUBLIC_RECEIPT_WIDTH_MM` | 80 or 58, matching the roll |
| `DB_FILE` | Location of the store file |
| `APP_TIMEZONE` | Pins the store to a zone; unset follows the machine |
| `DEFAULT_GST_RATE` | Rate for a division with none of its own |
| `TOKEN_SECRET` | Signing key; generated and stored if unset |
| `TOKEN_TTL_HOURS` | How long a sign-in lasts |
| `SEED_PASSWORD` | First-run password, if you would rather choose it |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_WINDOW_MINUTES` | Sign-in throttling |
| `PASSWORD_MIN_LENGTH` | Minimum password length |
| `ALLOWED_ORIGINS` | Exact origins allowed to call the API |

## Before going live

1. **Serve over HTTPS.** Tokens travel in a request header.
2. **Set `ALLOWED_ORIGINS`** to the real origin, or the browser blocks every call
   from anywhere but localhost.
3. **Set `TOKEN_SECRET`**, or make the data directory writable so the generated
   key persists. A key that changes on restart signs everyone out.
4. **Confirm the store is not downloadable.** Request
   `https://<host>/api/data/<store file>` — it must not return the file. The
   shipped Apache rule covers this; nginx needs `location ~ /data/ { deny all; }`.
5. **Change both seeded passwords** and delete the first-run password file.
6. **Set `NEXT_PUBLIC_SHOP_NAME`** so receipts carry the shop's name.

## Backups

The entire store — products, sales, staff, customers, audit trail — is the one
SQLite file named by `DB_FILE`, plus its `-wal` and `-shm` companions. Copying
it while the API is stopped is a complete backup. Nothing in the product
schedules this; it is an operational task.

Restoring is copying the file back.

## Monitoring

- `GET /api/health` returns `{"status":"ok"}` — suitable for an uptime check.
- Server errors are written to the PHP error log, prefixed for filtering.
  Messages are never returned to the browser.
- The audit trail records failed sign-ins with their source address.

## Verifying a deployment

```
php api/selfcheck.php <api-url> <password>
```

Runs 20 checks across authentication, token revocation, GST calculation and a
complete sale. **Point it at a disposable store** — it writes test records and
refuses to run against a store that already holds sales unless forced.

## Upgrading

Schema changes are applied automatically on the first request after an upgrade,
gated on a version stamp so an unchanged store costs one integer read. Back up
the store file first.
