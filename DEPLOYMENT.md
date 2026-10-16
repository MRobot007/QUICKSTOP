# Deployment

The frontend and the backend go to different places, because they need
different things: the Next.js app wants a CDN, and the PHP API wants a disk.

```
Browser ──► Vercel ──────────► backend host
            Next.js frontend   PHP 8.2 + Apache
                               store file on disk
```

## Choosing a backend host

The whole store is one SQLite file. Everything below follows from that.

| Host | Free forever | Card to sign up | Store survives a restart |
| --- | --- | --- | --- |
| Render free | Yes, 750 instance-hours/month | No | **No** |
| Oracle Cloud Always Free | Yes, does not expire | Yes, for identity only | Yes, 200 GB |
| Railway | No — trial credit, then it stops | Yes | Yes |
| Fly.io | No — free tier retired in 2024 | Yes | Paid volume |
| Your own machine | Yes | No | Yes |

**For a demonstration, use Render free.** The store resetting is an advantage
there: the demo reopens clean every time and no real takings can ever sit on it.
Free services sleep after 15 minutes idle and take about a minute to wake, so
open the link once before showing it to anyone.

**For a real shop, do not use Render free.** A restart would erase the day's
sales. Use Oracle Cloud Always Free, or keep the backend in the shop. A till
with no offline mode is *more* fragile in the cloud than on the counter, so
self-hosting is a legitimate answer rather than a fallback.

## 1. Backend

`render.yaml` in the repository root describes the service. In Render, choose
**New → Blueprint** and point it at the repository.

Set these environment variables:

| Variable | Value |
| --- | --- |
| `ALLOWED_ORIGINS` | The exact Vercel origin, e.g. `https://your-app.vercel.app` |
| `TOKEN_SECRET` | Any long random string. Render can generate it |
| `SEED_PASSWORD` | The password for the two seeded logins |
| `APP_TIMEZONE` | e.g. `America/Chicago` |

Then check it is up:

```bash
curl https://<your-service>.onrender.com/api/health      # {"status":"ok"}
```

To run it anywhere else that takes a container:

```bash
docker build -f api/Dockerfile -t pos-api .
docker run --rm -p 8080:8080 -e PORT=8080 -e ALLOWED_ORIGINS='*' pos-api
```

> This image has **not** been built and run locally — Docker is not installed on
> the machine it was written on. The PHP it serves is the same code the local
> XAMPP setup runs and the 20 automated checks pass against, but the container
> itself is unverified. Build it once before relying on it.

## 2. Frontend

In Vercel, import the repository. The defaults are right for Next.js; no
`vercel.json` is needed.

Set one environment variable:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<your-service>.onrender.com/api` |
| `NEXT_PUBLIC_SHOP_NAME` | The trading name printed on receipts |

`NEXT_PUBLIC_*` values are inlined at build time, so changing one needs a
redeploy, not just a restart.

## 3. Join them up

The two must agree or the browser blocks every call:

- `NEXT_PUBLIC_API_URL` on Vercel points at the backend.
- `ALLOWED_ORIGINS` on the backend names the Vercel origin **exactly** —
  scheme, host, no trailing slash.

Vercel gives every preview branch its own origin. Those are not in
`ALLOWED_ORIGINS`, so previews will not reach the API unless you add them.

## 4. Before anyone else uses it

1. Read the first-run password from `api/data/FIRST-RUN-PASSWORD.txt`, or set
   `SEED_PASSWORD` yourself.
2. Change both seeded passwords under **Admin → Team Members**.
3. Confirm the store is not downloadable:
   `curl -i https://<backend>/api/data/quickstop.sqlite` must not return a file.
4. Confirm HTTPS. Tokens travel in an `Authorization` header.

## Verifying a deployment

```bash
php api/selfcheck.php https://<your-service>.onrender.com/api <password>
```

Twenty checks across authentication, token revocation, tax calculation and a
complete sale. **Point it at a disposable store** — it writes test records and
refuses to run against one that already holds sales.

## What is deliberately not deployed

`docs/`, `scripts/` and the demo assets are excluded from the API image by
`.dockerignore`, along with `api/data` — so no real store, signing key or
first-run password can be baked into an image.
