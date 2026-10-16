/**
 * Load a throwaway store with synthetic data for demos and screenshots.
 *
 * Everything here is invented. The names are fictional, the phone numbers come
 * from the +1-202-555-0100..0199 block that is reserved for fiction and routes
 * nowhere, and the sales are rung up through the ordinary API so the register,
 * session and GST maths are the real ones rather than rows poked into SQLite.
 *
 * Point it at a disposable store, never at a real one:
 *
 *   DB_FILE=/tmp/demo.sqlite SEED_PASSWORD=<pw> \
 *     php -S 127.0.0.1:8080 -t . api/router.php &
 *   DEMO_PASSWORD=<pw> node scripts/seed-demo-data.mjs
 *
 * It refuses to run against a store that already holds sales.
 */

const API = process.env.DEMO_API_URL || 'http://127.0.0.1:8080/api'
const EMAIL = process.env.DEMO_EMAIL || 'owner@example.com'
const PASSWORD = process.env.DEMO_PASSWORD
const FORCE = process.argv.includes('--force')

if (!PASSWORD) {
    console.error('DEMO_PASSWORD is not set. Keep demo credentials in the environment, not in this file.')
    process.exit(1)
}

/** Fictional customers. US names, reserved-for-fiction phone numbers. */
const CUSTOMERS = [
    { name: 'Michael Carter', phone: '+1-202-555-0113' },
    { name: 'Emily Johnson', phone: '+1-202-555-0128' },
    { name: 'James Anderson', phone: '+1-202-555-0141' },
    { name: 'Sarah Mitchell', phone: '+1-202-555-0156' },
    { name: 'Daniel Brooks', phone: '+1-202-555-0162' },
    { name: 'Olivia Parker', phone: '+1-202-555-0174' },
]

/** GST per aisle, so the tax screen and the receipt breakup both have something to show. */
const GST_BY_CATEGORY = {
    'Beer & Alcohol': 28,
    'Vapes & Tobacco': 28,
    'Soft Drinks & Energy': 12,
    'Snacks': 5,
}

let token = ''

async function call(method, path, body) {
    const res = await fetch(API + path, {
        method,
        headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const text = await res.text()
    let parsed = null
    try { parsed = JSON.parse(text) } catch { /* non-JSON error page */ }
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text.slice(0, 200)}`)
    return parsed
}

function pick(list, n, offset) {
    // Deterministic rotation rather than Math.random, so repeated runs and the
    // screenshots taken from them stay comparable.
    return Array.from({ length: n }, (_, i) => list[(offset + i * 3) % list.length])
}

async function main() {
    const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD })
    token = login.token
    console.log(`signed in as ${login.user.name}`)

    const existing = await call('GET', '/admin/sales?limit=1')
    const alreadyThere = existing?.pagination?.total ?? (Array.isArray(existing?.data) ? existing.data.length : 0)
    if (alreadyThere > 0 && !FORCE) {
        console.error(`\nREFUSING: that store already holds ${alreadyThere} sale(s).`)
        console.error('This script writes demo records. Point it at a disposable store, or pass --force.')
        process.exit(2)
    }

    const categories = await call('GET', '/admin/categories')
    for (const category of categories) {
        const rate = GST_BY_CATEGORY[category.name]
        if (rate === undefined) continue
        await call('PUT', `/admin/categories/${category.id}`, { name: category.name, gst_rate: rate })
        console.log(`  GST ${String(rate).padStart(2)}%  ${category.name}`)
    }

    const customerIds = []
    for (const customer of CUSTOMERS) {
        const created = await call('POST', '/admin/customers', customer)
        customerIds.push(created?.id ?? null)
        console.log(`  customer   ${customer.name}  ${customer.phone}`)
    }

    const register = await call('POST', '/register/open', { openingCash: 200 })
    const registerId = register.registerId ?? register.id
    console.log(`register open (#${registerId})`)

    const products = await call('GET', '/pos/products/search?limit=200')
    const sellable = products.filter(p => p.stock > 2 && !p.isAlcohol)
    const methods = ['cash', 'card', 'upi', 'cash', 'card']

    let rung = 0
    for (let i = 0; i < 5; i++) {
        const basket = pick(sellable, 3, i).map((p, j) => ({ productId: p.id, quantity: 1 + ((i + j) % 3) }))
        const sale = await call('POST', '/pos/sales', {
            registerId,
            items: basket,
            paymentMethod: methods[i],
            customer: customerIds[i] ? { id: customerIds[i] } : null,
        })
        rung++
        const rates = (sale.gstBreakup || []).map(g => `${g.rate}%`).join(' + ') || 'n/a'
        console.log(`  sale ${sale.receiptNumber ?? sale.id}  $${sale.total.toFixed(2)}  GST ${rates}`)
    }

    console.log(`\ndone — ${CUSTOMERS.length} customers, ${rung} sales, GST set on ${Object.keys(GST_BY_CATEGORY).length} aisles`)
}

main().catch(err => {
    console.error('\nfailed: ' + err.message)
    process.exit(1)
})
