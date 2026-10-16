'use client'

import { useEffect } from 'react'

/**
 * Close something with Escape.
 *
 * Every overlay in the app was mouse-only: the receipt, the register prompts
 * and the admin forms could be opened from the keyboard but not closed from it,
 * which on a till with a scanner and no mouse handy means being stuck.
 */
export function useEscapeKey(active: boolean, onEscape: () => void) {
    useEffect(() => {
        if (!active) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onEscape()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [active, onEscape])
}
