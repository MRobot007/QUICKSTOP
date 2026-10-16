/**
 * Telling a barcode gun apart from a person typing.
 *
 * Kept separate from the React hook so the rule can be exercised directly:
 * getting it wrong either drops scans or turns a cashier's typing into
 * phantom line items on a bill.
 */

/** Above this gap between keystrokes it is a person, not a gun. 50ms = 240 WPM. */
export const MAX_KEYSTROKE_GAP_MS = 50

/** Shorter than this is a stray burst, not a product code. */
export const MIN_CODE_LENGTH = 4

export interface ScanBuffer {
    /**
     * Feed one keystroke. Returns the completed code when this keystroke ends a
     * scan, and null otherwise.
     */
    push(key: string, atMs: number): string | null
}

export function createScanBuffer(): ScanBuffer {
    let chars = ''
    let lastKeyAt = 0

    return {
        push(key: string, atMs: number): string | null {
            // A slow keystroke starts a new buffer, so ordinary typing never
            // accumulates into something that looks like a scan.
            if (atMs - lastKeyAt > MAX_KEYSTROKE_GAP_MS) chars = ''
            lastKeyAt = atMs

            // Most guns send Enter; some are configured to send Tab.
            if (key === 'Enter' || key === 'Tab') {
                const code = chars
                chars = ''
                return code.length >= MIN_CODE_LENGTH ? code : null
            }

            // Printable characters only — ignore Shift, arrows, F-keys.
            if (key.length === 1) chars += key
            return null
        },
    }
}
