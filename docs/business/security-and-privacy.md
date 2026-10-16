# Security, privacy and governance

Only verified controls are listed. Nothing here is a compliance claim.

## No compliance certification is claimed

This product holds **no** PCI DSS, SOC 2, ISO 27001, GDPR or HIPAA
certification, and no audit has been carried out against any of them. Any
statement to the contrary would be false.

Relevant to PCI specifically: the system records *that* a card payment was taken
and for how much. It does not capture, transmit or store card numbers, and there
is no card terminal integration. Card data never enters this system.

## Verified controls

| Control | What it does | How it was verified |
| --- | --- | --- |
| Authenticated API | 67 of 69 routes require a valid bearer token; the two that do not are the health probe and sign-in | Route-by-route audit |
| Role separation | Owner, Manager and Cashier are enforced on the server. A manager cannot create or alter an owner; a cashier cannot reach admin routes | Route audit + automated check |
| Per-cashier sale scoping | A cashier can read only their own sales, by list and by direct id | Automated check |
| Password hashing | `password_hash` with the platform default (bcrypt). Plaintext passwords are never stored | Code audit |
| Minimum password length | Enforced identically on account creation and password reset | Automated check |
| Server-side revocation | Signing out invalidates the token immediately rather than only clearing the browser | Automated check |
| Token expiry | Tokens carry an HMAC signature and a TTL, default 7 days | Code audit |
| Brute-force throttling | Repeated failed sign-ins for one account from one address are refused for a window | Manual test: 8 failures, then HTTP 429 |
| Parameterised queries | Every database query binds its parameters; integer paths are cast | Full audit of the API |
| Generated signing key | Not a constant in source. Generated on first run and stored outside the webroot | Code audit |
| Generated first-run password | Seeded accounts get a random password written to a file outside the webroot, not a published default | Verified on a fresh install |
| Store not web-reachable | The database directory is denied by the web server, with a second guard written next to the file itself | Rule review; needs confirming per deployment |
| Error messages | Exception text is logged server-side, never returned to the caller | Code audit |
| Security headers | `nosniff`, `X-Frame-Options: DENY`, referrer and permissions policy on both app and API | Response inspection |
| CORS allowlist | Only named origins, or loopback in development. Arbitrary origins are not reflected | Manual test with a foreign origin |
| Audit trail | Sign-ins, failed sign-ins, sales, refunds and GST rate changes are recorded with timestamps | Observed in the running app |
| CSV export escaping | Values that would be read as a spreadsheet formula are neutralised | Code audit |

## Controls that need verifying per deployment

These depend on how the store is hosted and cannot be asserted from the code:

1. **HTTPS.** Tokens travel in an Authorization header. Serve over TLS.
2. **`ALLOWED_ORIGINS` set** to the real origin. Otherwise the browser blocks
   every call from anywhere but localhost.
3. **The data directory is genuinely not served.** Confirm that requesting
   `/api/data/<store file>` returns 403 or 404, not the file. The shipped rule
   covers Apache; nginx needs its own `location` block.
4. **Backups.** The whole store is one file. Nothing in the product schedules a
   backup; copying that file is the backup.
5. **First-run password changed** and the file holding it deleted.

## Known limitations

- **Manual discounts are not capped.** A discount is limited to the basket
  total, so it cannot create a negative sale, but a cashier can discount a
  basket to zero. The action is recorded in the audit trail. If a store needs
  approval above a threshold, that control does not exist yet.
- **No stock movement history.** Current stock is known; how it got there is not.
- **No rate limiting beyond sign-in.** Other endpoints are authenticated but not
  throttled.
- **No content security policy.** Adding one needs nonce handling through the
  framework's inline scripts.
- **Audit trail is append-only by convention, not by constraint.** Anyone with
  direct access to the database file can alter it.

## Personal data held

| Data | Why | Where |
| --- | --- | --- |
| Staff name, email, phone, role | Sign-in and accountability | `users` |
| Customer name, phone, loyalty balance | Loyalty scheme; optional per sale | `customer_profiles` |
| Sale lines and payment method | Trading record, refunds, tax | `sales`, `sale_items`, `payment_records` |
| Sign-in events and source address | Detecting unauthorised access | `audit_logs` |

A customer can be served without any record being created; linking a customer is
optional at the till. There is no automatic deletion or retention schedule —
removing a customer is a manual action.

## Demonstration material

Every screenshot and dataset in this package was produced against a disposable
store containing only invented records. Fictional phone numbers come from the
+1-202-555-0100 to 0199 block, reserved so they cannot reach a real line. No
real customer, staff or trading data appears anywhere in this package.
