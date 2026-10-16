/**
 * Capture desktop and mobile screenshots of the running app.
 *
 * Drives an installed Chrome over the DevTools protocol using Node's built-in
 * WebSocket, so it adds no dependency to the project. Mobile shots come from
 * CDP's own device-metrics override, which makes the page lay itself out at
 * phone width — a real responsive render, not a resized desktop capture.
 *
 * Point it at a disposable store, never a real one:
 *
 *   DB_FILE=/tmp/demo.sqlite SEED_PASSWORD=<pw> php -S 127.0.0.1:8080 -t . api/router.php &
 *   npm run dev -- -p 3001
 *   DEMO_PASSWORD=<pw> node scripts/capture-screenshots.mjs
 *
 * Credentials come from the environment. Nothing is written into the images or
 * into this file.
 */

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const APP = process.env.DEMO_APP_URL || 'http://localhost:3001'
const API = process.env.DEMO_API_URL || 'http://127.0.0.1:8080/api'
const EMAIL = process.env.DEMO_EMAIL || 'owner@example.com'
const PASSWORD = process.env.DEMO_PASSWORD
const PORT = 9222
const OUT = 'docs/demos/screenshots'

// Desktop must land at >=1600px wide. Mobile is a genuine phone viewport.
const DESKTOP = { width: 1680, height: 1050, deviceScaleFactor: 1, mobile: false }
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }

/** Routes worth showing, with what each one demonstrates. */
const ROUTES = [
    { slug: '01-sign-in', path: '/admin/login', name: 'Sign in', purpose: 'Authentication entry point; no credentials shown on screen', anon: true },
    { slug: '02-till', path: '/', name: 'Till', purpose: 'Product grid, basket, GST totals and payment selection' },
    { slug: '03-dashboard', path: '/admin', name: 'Dashboard', purpose: 'Takings, stock warnings and sales trend at a glance' },
    { slug: '04-products', path: '/admin/products', name: 'Products', purpose: 'Catalogue with stock levels, search and CSV import/export' },
    { slug: '05-gst-tax', path: '/admin/tax', name: 'GST & Tax', purpose: 'Per-category GST rate the bill is calculated from' },
    { slug: '06-categories', path: '/admin/categories', name: 'Categories', purpose: 'Product divisions and their product counts' },
    { slug: '07-sales-history', path: '/admin/sales', name: 'Sales history', purpose: 'Completed sales with per-sale GST breakdown' },
    { slug: '08-customers', path: '/admin/customers', name: 'Customers', purpose: 'Customer records and loyalty balances' },
    { slug: '09-suppliers', path: '/admin/suppliers', name: 'Suppliers', purpose: 'Supplier directory and ordering terms' },
    { slug: '10-purchase-orders', path: '/admin/purchase-orders', name: 'Purchase orders', purpose: 'Restocking workflow from draft to received' },
    { slug: '11-promotions', path: '/admin/promotions', name: 'Promotions', purpose: 'Percentage and fixed-amount discount rules' },
    { slug: '12-team', path: '/admin/users', name: 'Team members', purpose: 'Staff accounts and role assignment' },
    { slug: '13-audit-trail', path: '/admin/audit-logs', name: 'Audit trail', purpose: 'Owner-only record of sign-ins, sales and rate changes' },
    { slug: '14-shift-history', path: '/cashier/history', name: 'Shift history', purpose: 'A cashier reviewing and reprinting their own sales' },
]

if (!PASSWORD) {
    console.error('DEMO_PASSWORD is not set. Keep demo credentials in the environment, not in this file.')
    process.exit(1)
}

const CHROME = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync)

if (!CHROME) {
    console.error('No Chrome or Edge found. Install one, or set a path in this script.')
    process.exit(1)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/** Width and height straight out of the PNG header, to verify what we saved. */
function pngSize(file) {
    const buf = readFileSync(file)
    if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

class Cdp {
    constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.session = null
        ws.onmessage = e => {
            const msg = JSON.parse(e.data)
            const waiter = this.pending.get(msg.id)
            if (waiter) { this.pending.delete(msg.id); msg.error ? waiter.reject(new Error(msg.error.message)) : waiter.resolve(msg.result) }
        }
    }
    send(method, params = {}, useSession = true) {
        const id = ++this.id
        const payload = { id, method, params }
        if (useSession && this.session) payload.sessionId = this.session
        this.ws.send(JSON.stringify(payload))
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject })
            setTimeout(() => this.pending.has(id) && (this.pending.delete(id), reject(new Error(method + ' timed out'))), 45000)
        })
    }
}

async function main() {
    // A real token, so the authenticated screens render as a signed-in user
    // sees them. Obtained through the ordinary login route.
    const res = await fetch(API + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    if (!res.ok) throw new Error(`login failed (${res.status}) — is the demo API up on ${API}?`)
    const { token, user } = await res.json()
    console.log(`signed in as ${user.name} (${user.role})`)

    const profile = join(process.env.TEMP || '.', `pos-capture-${Date.now()}`)
    const chrome = spawn(CHROME, [
        `--remote-debugging-port=${PORT}`, '--headless=new',
        `--user-data-dir=${profile}`,            // clean profile: no extensions, no history
        '--no-first-run', '--no-default-browser-check', '--disable-extensions',
        '--hide-scrollbars', '--force-device-scale-factor=1', 'about:blank',
    ], { stdio: 'ignore' })

    let version = null
    for (let i = 0; i < 40 && !version; i++) {
        try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json() } catch { await sleep(300) }
    }
    if (!version) { chrome.kill(); throw new Error('Chrome did not expose a debugging port') }

    const ws = new WebSocket(version.webSocketDebuggerUrl)
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = () => no(new Error('CDP socket failed')) })
    const cdp = new Cdp(ws)

    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' }, false)
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true }, false)
    cdp.session = sessionId
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    // Seed the session before any page script runs, so authenticated routes do
    // not bounce to the sign-in screen on first paint.
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try {
            localStorage.setItem('token', ${JSON.stringify(token)});
            localStorage.setItem('user', ${JSON.stringify(JSON.stringify(user))});
        } catch (e) {}`,
    })

    const index = []
    for (const [label, metrics] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
        const dir = join(OUT, label)
        mkdirSync(dir, { recursive: true })
        await cdp.send('Emulation.setDeviceMetricsOverride', metrics)
        if (metrics.mobile) {
            await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
        }

        for (const route of ROUTES) {
            await cdp.send('Page.navigate', { url: APP + route.path })
            // Let the route compile (dev server), fetch and settle.
            await sleep(route.anon ? 2200 : 3800)
            const { result } = await cdp.send('Runtime.evaluate', {
                expression: `JSON.stringify({ ready: document.readyState, skeletons: document.querySelectorAll('.animate-pulse').length })`,
                returnByValue: true,
            })
            const state = JSON.parse(result.value)
            if (state.skeletons > 0) await sleep(2000)

            const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
            const file = join(dir, `${route.slug}.png`)
            writeFileSync(file, Buffer.from(shot.data, 'base64'))
            const size = pngSize(file)
            const okWidth = label === 'desktop' ? size.width >= 1600 : size.width === MOBILE.width * MOBILE.deviceScaleFactor
            console.log(`  ${okWidth ? 'ok  ' : 'WARN'} ${label}/${route.slug}.png  ${size.width}x${size.height}`)
            index.push({ ...route, viewport: label, file: file.split('\\').join('/'), px: `${size.width}x${size.height}`, ok: okWidth })
        }
    }

    ws.close()
    chrome.kill()
    writeFileSync(join(OUT, '..', 'screenshot-manifest.json'), JSON.stringify(index, null, 2))
    const bad = index.filter(i => !i.ok)
    console.log(`\n${index.length} screenshots, ${bad.length} failed the size check`)
    process.exit(bad.length ? 1 : 0)
}

main().catch(err => { console.error('\nfailed: ' + err.message); process.exit(1) })
