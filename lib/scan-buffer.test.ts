/**
 * Run with: npm run test:scanner
 *
 * No framework on purpose — this is one rule, and the whole point of pulling it
 * out of the hook was that it can be checked without a browser.
 */
import assert from 'node:assert/strict'
import { createScanBuffer, MAX_KEYSTROKE_GAP_MS } from './scan-buffer.js'

/** Type a string at a fixed pace, returning whatever codes came out. */
function type(text: string, gapMs: number, terminator: string | null = 'Enter'): (string | null)[] {
    const buffer = createScanBuffer()
    const out: (string | null)[] = []
    let t = 10_000 // well past the initial zero, so the first key starts fresh
    for (const ch of text) {
        t += gapMs
        out.push(buffer.push(ch, t))
    }
    if (terminator) {
        t += gapMs
        out.push(buffer.push(terminator, t))
    }
    return out
}

const FAST = 5   // a gun
const HUMAN = 120 // a person

// A gun bursting a barcode gives the whole code back on Enter.
assert.equal(type('049000000443', FAST).at(-1), '049000000443')

// Tab-terminated guns work the same way.
assert.equal(type('049000000443', FAST, 'Tab').at(-1), '049000000443')

// Nothing is emitted before the terminator arrives.
assert.deepEqual(type('04900', FAST).slice(0, -1), [null, null, null, null, null])

// A person typing a search and pressing Enter must not look like a scan,
// or every manual search would drop a random product into the cart.
assert.equal(type('coca cola', HUMAN).at(-1), null)

// Right at the boundary: still treated as human.
assert.equal(type('12345678', MAX_KEYSTROKE_GAP_MS + 1).at(-1), null)

// A short burst is noise, not a product code.
assert.equal(type('abc', FAST).at(-1), null)

// Enter on an empty buffer does nothing.
assert.equal(createScanBuffer().push('Enter', 10_000), null)

// Modifier and navigation keys never enter the code.
{
    const buffer = createScanBuffer()
    let t = 10_000
    for (const key of ['4', 'Shift', '9', 'ArrowLeft', '0', '0']) buffer.push(key, (t += FAST))
    assert.equal(buffer.push('Enter', t + FAST), '4900')
}

// Two scans in a row stay separate rather than concatenating.
{
    const buffer = createScanBuffer()
    let t = 10_000
    for (const ch of '1111') buffer.push(ch, (t += FAST))
    assert.equal(buffer.push('Enter', (t += FAST)), '1111')
    t += 5_000 // the cashier scans the next item a moment later
    for (const ch of '2222') buffer.push(ch, (t += FAST))
    assert.equal(buffer.push('Enter', t + FAST), '2222')
}

console.log('scan-buffer: all checks passed')
