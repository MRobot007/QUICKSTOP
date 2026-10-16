'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

/**
 * In-app messages, replacing window.alert().
 *
 * A native alert freezes the whole tab until it is dismissed, which on a touch
 * till means a cashier hunting for a small OS button mid-queue — and it looks
 * nothing like the rest of the app. These stack in the corner, announce
 * themselves to a screen reader, and clear on their own.
 *
 * Deliberately not a context provider: toast() is called from event handlers
 * and catch blocks that are not always inside a component, so the subscriber
 * list lives at module scope and <Toaster /> just renders it.
 */

export type ToastKind = 'success' | 'error' | 'info'

interface Toast {
    id: number
    message: string
    kind: ToastKind
}

const DURATION_MS = 4000

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<(next: Toast[]) => void>()

function emit() {
    for (const listener of listeners) listener(toasts)
}

export function dismissToast(id: number) {
    toasts = toasts.filter(t => t.id !== id)
    emit()
}

export function toast(message: string, kind: ToastKind = 'info') {
    const id = nextId++
    toasts = [...toasts, { id, message, kind }]
    emit()
    setTimeout(() => dismissToast(id), DURATION_MS)
}

/** Shorthands, so call sites read as what happened rather than as a config object. */
toast.success = (message: string) => toast(message, 'success')
toast.error = (message: string) => toast(message, 'error')

const STYLES: Record<ToastKind, { icon: typeof Info; ring: string; iconColor: string }> = {
    success: { icon: CheckCircle2, ring: 'border-green-200', iconColor: 'text-green-600' },
    error: { icon: AlertTriangle, ring: 'border-red-200', iconColor: 'text-red-600' },
    info: { icon: Info, ring: 'border-brand-200', iconColor: 'text-primary' },
}

export function Toaster() {
    const [items, setItems] = useState<Toast[]>([])

    useEffect(() => {
        listeners.add(setItems)
        return () => { listeners.delete(setItems) }
    }, [])

    if (items.length === 0) return null

    return (
        <div
            // assertive: these replace alerts, so they carry the outcome of an
            // action the user just took and should interrupt.
            role="alert"
            aria-live="assertive"
            className="fixed bottom-6 right-6 z-[200] flex w-[min(24rem,calc(100vw-3rem))] flex-col gap-3"
        >
            {items.map(item => {
                const { icon: Icon, ring, iconColor } = STYLES[item.kind]
                return (
                    <div
                        key={item.id}
                        className={`flex items-start gap-3 rounded-2xl border ${ring} bg-white px-4 py-3 shadow-lg shadow-brand-900/10 motion-safe:animate-[toast-in_200ms_cubic-bezier(0.16,1,0.3,1)]`}
                    >
                        <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} aria-hidden="true" />
                        <p className="flex-1 text-sm font-semibold text-dark">{item.message}</p>
                        <button
                            type="button"
                            onClick={() => dismissToast(item.id)}
                            aria-label="Dismiss message"
                            className="shrink-0 rounded-lg p-1 text-brand-500 transition-colors hover:bg-brand-50 hover:text-dark"
                        >
                            <X size={15} aria-hidden="true" />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
