'use client'

import { useEffect, useRef } from 'react'
import { createScanBuffer } from '@/lib/scan-buffer'

/**
 * Capture a USB barcode scanner anywhere on the page.
 *
 * Practically every scanner gun — Epson, Zebra, Honeywell, or an unbranded one
 * off a marketplace — is an HID keyboard: it types the barcode and presses
 * Enter. No driver, no model-specific code. What it does need is somewhere for
 * those keystrokes to land, and relying on an input keeping focus fails the
 * moment a cashier taps a button or a dialog opens.
 *
 * So we listen on the window instead, and tell a scan from a person typing by
 * speed: a gun emits characters a few milliseconds apart, a human cannot hold
 * 20 characters a second. Anything slower is left alone and reaches the search
 * box as normal typing.
 */

export function useBarcodeScanner(onScan: (code: string) => void, enabled = true) {
    const handler = useRef(onScan)

    // Keep the callback current without re-binding the listener on every render.
    useEffect(() => { handler.current = onScan }, [onScan])

    useEffect(() => {
        if (!enabled) return

        const buffer = createScanBuffer()
        const onKeyDown = (e: KeyboardEvent) => {
            // Ctrl+/ and Ctrl+Enter are app shortcuts, not barcode characters.
            if (e.ctrlKey || e.metaKey || e.altKey) return

            const code = buffer.push(e.key, Date.now())
            if (code === null) return

            // Consume it: the search box must not also act on this Enter.
            e.preventDefault()
            e.stopPropagation()
            handler.current(code)
        }

        // Capture phase, so an open dialog cannot swallow the scan first.
        window.addEventListener('keydown', onKeyDown, true)
        return () => window.removeEventListener('keydown', onKeyDown, true)
    }, [enabled])
}
