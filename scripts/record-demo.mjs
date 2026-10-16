/**
 * Record narrated demonstration videos of the running application.
 *
 * Drives Chrome over the DevTools protocol, captures its screencast frames and
 * pipes them to ffmpeg, then lays a spoken narration over the result.
 *
 * Two details worth knowing:
 *
 *  - Screencast frames only arrive when the page changes, so a still moment
 *    would record nothing at all. The last frame is re-emitted on a fixed
 *    cadence to give ffmpeg the constant frame rate its pipe input needs.
 *
 *  - The narration is synthesised *before* recording and each clip is measured,
 *    so a caption is held on screen for at least as long as its voice-over
 *    takes to say. Timing it the other way round lets the voice run past the
 *    picture it belongs to.
 *
 *   DB_FILE=/tmp/demo.sqlite SEED_PASSWORD=<pw> php -S 127.0.0.1:8080 -t . api/router.php &
 *   DEMO_PASSWORD=<pw> node scripts/seed-demo-data.mjs
 *   npm run dev -- -p 3001
 *   DEMO_PASSWORD=<pw> node scripts/record-demo.mjs [slug]
 */

import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'

const APP = process.env.DEMO_APP_URL || 'http://localhost:3001'
const API = process.env.DEMO_API_URL || 'http://127.0.0.1:8080/api'
const EMAIL = process.env.DEMO_EMAIL || 'owner@example.com'
const PASSWORD = process.env.DEMO_PASSWORD
const PORT = 9333
const OUT = 'docs/demos/videos'
const FPS = 12
const VIEW = { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }
const VOICE = process.env.DEMO_VOICE || 'en-US-AriaNeural'
const RATE = process.env.DEMO_VOICE_RATE || '-4%'   // a shade under default; reads less hurried
const GAP_MS = 700                                   // breath after each line

const found = list => list.find(p => existsSync(p))

const FFMPEG = process.env.FFMPEG || found([
    'C:/Users/Lenovo/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.2-full_build/bin/ffmpeg.exe',
]) || 'ffmpeg'
const FFPROBE = process.env.FFPROBE || FFMPEG.replace(/ffmpeg(\.exe)?$/i, (m, ext) => 'ffprobe' + (ext || ''))
const PYTHON = process.env.PYTHON || found([
    'C:/Users/Lenovo/AppData/Local/Programs/Python/Python311/python.exe',
]) || 'python'
const CHROME = found([
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
])

if (!PASSWORD) { console.error('DEMO_PASSWORD is not set.'); process.exit(1) }
if (!CHROME) { console.error('No Chrome or Edge found.'); process.exit(1) }

const sleep = ms => new Promise(r => setTimeout(r, ms))

/* ── Shot lists ────────────────────────────────────────────────────────────
   Each caption is both the on-screen text and the spoken line. Narration
   describes only what the software actually does: no figure is claimed for
   time saved, shrinkage or efficiency, because none has been measured. */

const VIDEOS = {
    '01-product-overview': [
        { goto: '/', caption: 'This is the counter screen of a point of sale system for a convenience store.' },
        { caption: 'Products are grouped by aisle, and searchable by name, SKU or barcode.' },
        { type: ['input[placeholder*="Search products"]', 'cola'], caption: 'Search narrows the shelf as you type.', hold: 2600 },
        { type: ['input[placeholder*="Search products"]', ''], hold: 900 },
        { goto: '/admin', caption: 'Behind the till sits the back office.' },
        { caption: 'Takings for the day, the payment mix, and stock running low.' },
        { goto: '/admin/products', caption: 'The catalogue holds prices, stock levels and reorder thresholds.' },
        { goto: '/admin/tax', caption: 'Tax rates are set for each product division.' },
        { goto: '/admin/sales', caption: 'Sales history keeps the tax breakdown of every sale.' },
        { goto: '/admin/audit-logs', caption: 'And an audit trail that only the owner can see.' },
    ],

    '02-primary-workflow': [
        { goto: '/', caption: 'A customer comes to the counter.' },
        { clickText: ['button', 'Lays Classic'], caption: 'Items are added by scan, or by searching for them.' },
        { clickText: ['button', 'Coca-Cola'], caption: 'The basket totals as it goes: subtotal, tax, and the grand total.' },
        { clickText: ['button', 'Marlboro'], caption: 'Anything age restricted stops the sale.' },
        { clickText: ['button', 'Verified'], caption: 'It cannot continue until the identity check is confirmed.' },
        { caption: 'Tax is worked out line by line, at each division&rsquo;s own rate.' },
        { clickText: ['button', 'CASH'], caption: 'Payment can be cash, card, a digital method, or a split across several.' },
        { clickText: ['button', 'Complete Payment'], caption: 'The server prices and taxes the sale from its own records.' },
        { caption: 'The receipt itemises every tax band in the basket.' },
        { caption: 'A till that submits different figures is ignored.' },
    ],

    '03-tax-automation': [
        { goto: '/admin/tax', caption: 'Each product division carries its own tax rate.' },
        { caption: 'Snacks are billed at five per cent.' },
        { clickInRow: ['Snacks', '12%'], caption: 'Changing that rate takes a single edit.' },
        { clickInRow: ['Snacks', 'Save'], caption: 'Saved, and it applies from the next sale onward.' },
        { goto: '/', caption: 'At the till, the new rate is already in force.' },
        { clickText: ['button', 'Lays Classic'], caption: 'This snack now bills at twelve per cent.' },
        { clickText: ['button', 'Marlboro'], caption: 'A basket spanning two bands shows each of them separately.' },
        { clickText: ['button', 'Verified'], hold: 1200 },
        { goto: '/admin/sales', caption: 'An earlier receipt keeps the rate it was charged at.' },
        { caption: 'Changing a rate never rewrites what a customer was already billed.' },
    ],

    '04-business-value': [
        { goto: '/', caption: 'A shift opens with a counted cash float.' },
        { clickText: ['button', 'Red Bull'], caption: 'Every sale is recorded against that shift, and that cashier.' },
        { goto: '/reports/x-report', caption: 'At any point, the expected drawer position is available.' },
        { caption: 'Cash, card and digital takings are kept apart.' },
        { goto: '/admin/audit-logs', caption: 'Sign ins, sales, refunds and rate changes are all recorded.' },
        { caption: 'Each one attributed to the person who made it.' },
        { goto: '/admin', caption: 'So a discrepancy is traceable to a shift the same day.' },
    ],
}

/* ── Narration ─────────────────────────────────────────────────────────── */

const TTS_DIR = join(tmpdir(), 'pos-demo-narration')
mkdirSync(TTS_DIR, { recursive: true })

/** Caption markup is for the screen; the voice needs plain words. */
function spokenText(html) {
    return html
        .replace(/&rsquo;/g, "'")
        .replace(/&mdash;/g, ', ')
        .replace(/&amp;/g, 'and')
        .replace(/<[^>]+>/g, '')
        .trim()
}

function probeSeconds(file) {
    const r = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { encoding: 'utf8' })
    const v = parseFloat((r.stdout || '').trim())
    return Number.isFinite(v) ? v : 0
}

/** Synthesise one line, cached on its text so re-runs do not re-fetch it. */
function narrate(text) {
    const key = createHash('sha1').update(VOICE + RATE + text).digest('hex').slice(0, 16)
    const file = join(TTS_DIR, `${key}.mp3`)
    if (!existsSync(file)) {
        const r = spawnSync(PYTHON, ['-m', 'edge_tts', '--voice', VOICE, `--rate=${RATE}`, '--text', text, '--write-media', file], { encoding: 'utf8' })
        if (r.status !== 0 || !existsSync(file)) {
            throw new Error(`speech synthesis failed for "${text.slice(0, 40)}..."\n${(r.stderr || '').slice(-300)}`)
        }
    }
    return { file, seconds: probeSeconds(file) }
}

/* ── CDP ───────────────────────────────────────────────────────────────── */

class Cdp {
    constructor(ws) {
        this.ws = ws; this.id = 0; this.pending = new Map(); this.session = null; this.handlers = new Map()
        ws.onmessage = e => {
            const msg = JSON.parse(e.data)
            if (msg.id !== undefined) {
                const w = this.pending.get(msg.id)
                if (w) { this.pending.delete(msg.id); msg.error ? w.reject(new Error(msg.error.message)) : w.resolve(msg.result) }
            } else if (msg.method) {
                const h = this.handlers.get(msg.method)
                if (h) h(msg.params)
            }
        }
    }
    on(method, fn) { this.handlers.set(method, fn) }
    send(method, params = {}, useSession = true) {
        const id = ++this.id
        const payload = { id, method, params }
        if (useSession && this.session) payload.sessionId = this.session
        this.ws.send(JSON.stringify(payload))
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject })
            setTimeout(() => this.pending.has(id) && (this.pending.delete(id), reject(new Error(method + ' timed out'))), 40000)
        })
    }
    async eval(expression) {
        const { result } = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
        return result.value
    }
}

const PAGE_HELPERS = `
window.__cap = function (text) {
  var el = document.getElementById('__demo_caption');
  if (!el) {
    el = document.createElement('div');
    el.id = '__demo_caption';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
      'padding:20px 32px 22px;background:linear-gradient(to top,rgba(10,36,34,.95),rgba(10,36,34,0));' +
      'color:#fff;font:600 19px/1.45 Inter,system-ui,sans-serif;letter-spacing:.01em;' +
      'text-align:center;pointer-events:none;transition:opacity .25s ease;';
    document.body.appendChild(el);
  }
  el.innerHTML = text || '';
  el.style.opacity = text ? '1' : '0';
};
window.__clickText = function (tag, text) {
  var els = Array.prototype.slice.call(document.querySelectorAll(tag));
  var t = text.toLowerCase();
  var el = els.filter(function (e) {
    return !e.disabled && (e.textContent || '').toLowerCase().indexOf(t) !== -1;
  })[0];
  if (el) { el.scrollIntoView({ block: 'center' }); el.click(); return true; }
  return false;
};
window.__clickInRow = function (rowText, btnText) {
  var rows = Array.prototype.slice.call(document.querySelectorAll('tr, li'));
  var rt = rowText.toLowerCase(), bt = btnText.toLowerCase();
  for (var i = 0; i < rows.length; i++) {
    if ((rows[i].textContent || '').toLowerCase().indexOf(rt) === -1) continue;
    var btns = Array.prototype.slice.call(rows[i].querySelectorAll('button'));
    for (var j = 0; j < btns.length; j++) {
      if (btns[j].disabled) continue;
      if ((btns[j].textContent || '').toLowerCase().trim().indexOf(bt) === 0) {
        btns[j].scrollIntoView({ block: 'center' }); btns[j].click(); return true;
      }
    }
  }
  return false;
};
window.__setInput = function (sel, value) {
  var el = document.querySelector(sel);
  if (!el) return false;
  var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
};
true;`

async function record(slug, steps, cdp) {
    mkdirSync(OUT, { recursive: true })
    const silent = join(tmpdir(), `${slug}-silent.mp4`)
    const final = join(OUT, `${slug}.mp4`)

    // Voice first: a caption is then held for at least as long as its line takes.
    const voice = steps.map(s => (s.caption ? narrate(spokenText(s.caption)) : null))

    const ff = spawn(FFMPEG, [
        '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', '-an', silent,
    ], { stdio: ['pipe', 'ignore', 'pipe'] })
    let ffErr = ''
    ff.stderr.on('data', d => { ffErr += d.toString() })
    ff.stdin.on('error', () => { })
    let ffExit = null
    const ffDone = new Promise(resolve => ff.on('close', code => { ffExit = code; resolve(code) }))

    let last = null, frames = 0
    cdp.on('Page.screencastFrame', async p => {
        last = Buffer.from(p.data, 'base64')
        try { await cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId }) } catch { }
    })
    const pump = setInterval(() => {
        if (last && ff.stdin.writable) { ff.stdin.write(last); frames++ }
    }, Math.round(1000 / FPS))

    const dieIfEncoderGone = () => {
        if (ffExit !== null) {
            clearInterval(pump)
            throw new Error(`ffmpeg exited ${ffExit}\n${ffErr.split('\n').filter(l => l.trim()).slice(-8).join('\n')}`)
        }
    }

    await cdp.send('Page.navigate', { url: APP + (steps[0].goto || '/') })
    await sleep(4000)
    await cdp.eval(PAGE_HELPERS)
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, everyNthFrame: 1 })

    // Cues are taken from the frame counter, so they are exact against the
    // encoded timeline rather than against wall clock.
    const cues = []
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        dieIfEncoderGone()

        if (step.goto) {
            await cdp.send('Page.navigate', { url: APP + step.goto })
            await sleep(2400)
            await cdp.eval(PAGE_HELPERS)
        }
        if (step.caption !== undefined) {
            await cdp.eval(`window.__cap(${JSON.stringify(step.caption)})`)
            if (voice[i]) cues.push({ ...voice[i], atMs: Math.round((frames / FPS) * 1000) })
        }
        if (step.clickInRow) {
            const [row, btn] = step.clickInRow
            const hit = await cdp.eval(`window.__clickInRow(${JSON.stringify(row)}, ${JSON.stringify(btn)})`)
            if (!hit) console.warn(`\n    (no "${btn}" in a row matching "${row}")`)
            await sleep(450)
        }
        if (step.clickText) {
            const [tag, text] = step.clickText
            const hit = await cdp.eval(`window.__clickText(${JSON.stringify(tag)}, ${JSON.stringify(text)})`)
            if (!hit) console.warn(`\n    (no element matched "${text}")`)
            await sleep(450)
        }
        if (step.type) {
            const [sel, value] = step.type
            await cdp.eval(`window.__setInput(${JSON.stringify(sel)}, ${JSON.stringify(value)})`)
            await sleep(800)
        }

        const lineMs = voice[i] ? Math.ceil(voice[i].seconds * 1000) + GAP_MS : 0
        await sleep(Math.max(step.hold ?? 1400, lineMs))
    }

    await cdp.eval(`window.__cap('')`)
    await sleep(600)
    await cdp.send('Page.stopScreencast')
    clearInterval(pump)
    await sleep(200)
    ff.stdin.end()

    const code = await ffDone
    if (code !== 0) throw new Error(`ffmpeg exited ${code}\n${ffErr.split('\n').filter(l => l.trim()).slice(-8).join('\n')}`)

    // Lay each line at its cue. The clips never overlap, so amix simply places
    // them; normalize=0 stops it quietening everything as inputs are added.
    const inputs = []
    const filters = []
    cues.forEach((c, i) => {
        inputs.push('-i', c.file)
        filters.push(`[${i + 1}:a]adelay=${c.atMs}:all=1[s${i}]`)
    })
    const mix = `${cues.map((_, i) => `[s${i}]`).join('')}amix=inputs=${cues.length}:normalize=0:dropout_transition=0[aout]`
    const mux = spawnSync(FFMPEG, [
        '-y', '-i', silent, ...inputs,
        '-filter_complex', `${filters.join(';')};${mix}`,
        '-map', '0:v', '-map', '[aout]',
        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', final,
    ], { encoding: 'utf8' })
    if (mux.status !== 0) {
        throw new Error(`audio mux failed\n${(mux.stderr || '').split('\n').filter(l => l.trim()).slice(-10).join('\n')}`)
    }
    rmSync(silent, { force: true })

    return {
        slug,
        file: final.split('\\').join('/'),
        seconds: probeSeconds(final),
        kb: Math.round(statSync(final).size / 1024),
        lines: cues.length,
    }
}

async function main() {
    const res = await fetch(API + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
    if (!res.ok) throw new Error(`login failed (${res.status}) — is the demo API up on ${API}?`)
    const { token, user } = await res.json()

    const profile = join(tmpdir(), `pos-record-${Date.now()}`)
    const chrome = spawn(CHROME, [
        `--remote-debugging-port=${PORT}`, '--headless=new', `--user-data-dir=${profile}`,
        '--no-first-run', '--no-default-browser-check', '--disable-extensions',
        '--hide-scrollbars', `--window-size=${VIEW.width},${VIEW.height}`, 'about:blank',
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
    await cdp.send('Emulation.setDeviceMetricsOverride', VIEW)
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try{localStorage.setItem('token',${JSON.stringify(token)});localStorage.setItem('user',${JSON.stringify(JSON.stringify(user))});}catch(e){}`,
    })

    const only = process.argv[2]
    if (only && !VIDEOS[only]) throw new Error(`unknown video "${only}". One of: ${Object.keys(VIDEOS).join(', ')}`)
    const picked = only ? { [only]: VIDEOS[only] } : VIDEOS

    const made = []
    for (const [slug, steps] of Object.entries(picked)) {
        process.stdout.write(`  ${slug} ... `)
        const r = await record(slug, steps, cdp)
        const ok = r.seconds >= 30 && r.seconds <= 90
        console.log(`${r.seconds.toFixed(1)}s  ${r.kb}KB  ${r.lines} spoken lines  ${ok ? 'ok' : 'OUT OF 30-90s RANGE'}`)
        made.push({ ...r, inRange: ok })
    }

    ws.close(); chrome.kill()
    if (!only) writeFileSync(join(OUT, '..', 'video-manifest.json'), JSON.stringify(made, null, 2))
    console.log(`\n${made.length} narrated recording(s) in ${OUT}/  (voice: ${VOICE})`)
    process.exit(made.every(m => m.inRange) ? 0 : 1)
}

main().catch(e => { console.error('\nfailed: ' + e.message); process.exit(1) })
