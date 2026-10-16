'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { animate } from 'animejs'
import { Lock, Mail, Loader2, ArrowRight, ServerCrash, Store } from 'lucide-react'
import { ApiError, apiFetch, pingApi } from '@/lib/api-client'
import BrandPanel from '@/components/BrandPanel'
import { FormStock } from '@/components/FloatingStock'
import { PRODUCT_NAME } from '@/lib/branding'

type LoginResponse = {
    token: string
    user: { role?: string }
}

/** True when the OS is set to minimise animation. */
function prefersReducedMotion(): boolean {
    return typeof window !== 'undefined'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [apiDownReason, setApiDownReason] = useState('')
    const router = useRouter()

    // Probe the API on mount so an outage is named up front, instead of being
    // mistaken for a bad password after the first failed sign-in.
    useEffect(() => {
        let cancelled = false

        pingApi().then((health) => {
            if (cancelled) return
            setApiDownReason(health.ok ? '' : health.message)
        })

        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        // anime.js has no notion of prefers-reduced-motion, so gate it here.
        // The CSS-driven backdrop is handled by a media query in globals.css.
        if (prefersReducedMotion()) return

        if (document.querySelectorAll('.animate-in').length > 0) {
            animate('.animate-in', {
                opacity: [0, 1],
                translateY: [24, 0],
                delay: (el: any, i: number) => i * 110,
                ease: 'outExpo',
                duration: 900
            })
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const data = await apiFetch<LoginResponse>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            })

            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))

            const go = () => {
                const role = data.user.role?.toUpperCase()
                router.push(role === 'OWNER' || role === 'MANAGER' ? '/admin' : '/')
            }

            if (prefersReducedMotion()) {
                go()
                return
            }

            animate('.login-card', {
                opacity: [1, 0],
                translateY: [0, -16],
                ease: 'inExpo',
                duration: 420,
                onComplete: go
            })
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message)
                // A failed sign-in that never reached the server means the banner
                // is stale — surface the outage there too.
                setApiDownReason(err.kind === 'http' ? '' : err.message)
            } else {
                setError('Something went wrong signing you in. Please try again.')
            }
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-white">
            <BrandPanel />

            <div className="relative flex flex-1 items-center justify-center bg-canvas p-6 lg:p-12">
                {/* Soft colour in the corners so the form side isn't a flat slab. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-100 opacity-70 blur-[90px]" />
                    <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brass-100 opacity-60 blur-[90px]" />
                    <FormStock />
                </div>

                <div className="login-card relative z-10 w-full max-w-sm">
                    {/* The brand panel is desktop-only, so mobile gets the mark here. */}
                    <div className="animate-in mb-8 flex flex-col items-center lg:hidden">
                        <div className="floating-badge flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-xl shadow-primary/30">
                            <Store size={30} strokeWidth={2.1} aria-hidden="true" />
                        </div>
                        <h2 className="mt-4 font-outfit text-xl font-black uppercase tracking-[0.22em] text-primary">{PRODUCT_NAME}</h2>
                    </div>

                    <div className="animate-in">
                        <p className="text-label font-bold uppercase tracking-[0.35em] text-brass-600">Welcome back</p>
                        <h1 className="mt-2.5 font-outfit text-[32px] font-black leading-tight tracking-tight text-dark">Sign in</h1>
                        <p className="mt-2 text-sm text-brand-600">Use your staff account to open the till.</p>
                    </div>

                    {apiDownReason && (
                        <div className="animate-in mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <ServerCrash size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                            <div>
                                <p className="font-bold">Service unavailable</p>
                                <p className="mt-0.5 text-amber-800/90">{apiDownReason}</p>
                                <p className="mt-1 text-xs text-amber-800/70">Sign-in won&apos;t work until it&apos;s back. This is not your password.</p>
                            </div>
                        </div>
                    )}

                    {error && error !== apiDownReason && (
                        <div role="alert" className="animate-in mt-6 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <span className="h-1 w-1 rounded-full bg-red-500" aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div className="animate-in space-y-2">
                            <label htmlFor="login-email" className="ml-1 text-label font-bold uppercase tracking-[0.2em] text-brand-700">
                                ID / Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600" size={18} aria-hidden="true" />
                                <input
                                    id="login-email"
                                    type="email"
                                    required
                                    autoComplete="username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="owner@example.com"
                                    className="w-full rounded-2xl border border-brand-200 bg-white py-3.5 pl-12 pr-4 font-semibold text-dark shadow-sm outline-none transition
                                               placeholder:font-medium placeholder:text-brand-500
                                               focus:border-primary focus:ring-4 focus:ring-primary/12"
                                />
                            </div>
                        </div>

                        <div className="animate-in space-y-2">
                            <label htmlFor="login-password" className="ml-1 text-label font-bold uppercase tracking-[0.2em] text-brand-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600" size={18} aria-hidden="true" />
                                <input
                                    id="login-password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full rounded-2xl border border-brand-200 bg-white py-3.5 pl-12 pr-4 font-semibold text-dark shadow-sm outline-none transition
                                               placeholder:text-brand-500
                                               focus:border-primary focus:ring-4 focus:ring-primary/12"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="animate-in group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-white
                                       shadow-[0_16px_40px_-14px_rgba(20,83,79,0.8)] transition
                                       hover:bg-brand-800 disabled:opacity-70"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                            ) : (
                                <>
                                    <span className="text-sm font-black uppercase tracking-[0.18em]">Enter Dashboard</span>
                                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
