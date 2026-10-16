'use client'

import { useCallback, useEffect, useState } from 'react'
import { Percent, Loader2, Check } from 'lucide-react'
import { API_URL } from '@/lib/api-config'

interface Category {
    id: number
    name: string
    /** What the owner set, or null when they have not set anything. */
    gst_rate: number | null
    /** What a sale in this category is actually charged right now. */
    effective_gst_rate: number
    _count?: { products: number }
}

/** Common Indian GST slabs, offered as one-tap presets. */
const SLABS = [0, 5, 12, 18, 28]

/** The rate box plus its slab shortcuts. Shared by both layouts. */
function RateControls({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
                <input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    step="0.01"
                    placeholder="Default"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="bg-white border border-brand-100 rounded-2xl pl-4 pr-9 py-2.5 w-32 text-sm font-bold text-brand-900 outline-none transition-[border-color,box-shadow] duration-base ease-out-soft focus:ring-2 focus:ring-primary/10 focus:border-primary/20"
                />
                <span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-500 font-bold text-sm">%</span>
            </div>
            {SLABS.map(slab => (
                <button
                    key={slab}
                    type="button"
                    onClick={() => onChange(String(slab))}
                    className="px-3 py-1.5 rounded-xl border border-brand-100 bg-white text-caption font-black text-brand-600 hover:border-primary/30 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/30 outline-none transition-[color,border-color] duration-fast ease-out-soft"
                >
                    {slab}%
                </button>
            ))}
        </div>
    )
}

function SaveButton({ disabled, saving, saved, onClick }: { disabled: boolean; saving: boolean; saved: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || saving}
            className="px-5 py-2.5 rounded-2xl bg-white border border-brand-100 text-brand-700 font-black uppercase text-label tracking-widest shadow-sm hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-primary/30 outline-none disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
            {saving ? <Loader2 className="animate-spin" size={14} aria-hidden="true" />
                : saved ? <Check size={14} className="text-green-600" aria-hidden="true" />
                    : null}
            {saved ? 'Saved' : 'Save'}
        </button>
    )
}

export default function TaxPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [drafts, setDrafts] = useState<Record<number, string>>({})
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<number | null>(null)
    const [savedId, setSavedId] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/categories`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                cache: 'no-store',
            })
            if (!res.ok) throw new Error('Could not load categories')
            const data: Category[] = await res.json()
            setCategories(data)
            setDrafts(Object.fromEntries(data.map(c => [c.id, c.gst_rate === null ? '' : String(c.gst_rate)])))
            setError(null)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load categories')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const save = useCallback(async (category: Category, rawRate: string) => {
        setSavingId(category.id)
        setError(null)
        try {
            const res = await fetch(`${API_URL}/admin/categories/${category.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                // An empty box means "no rate set": the sale falls back to the
                // store default rather than billing the category at 0%.
                body: JSON.stringify({ name: category.name, gst_rate: rawRate === '' ? null : Number(rawRate) }),
            })
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Could not save the rate')
            // The products list caches category data; drop it so the till picks
            // the new rate up on its next load instead of billing the old one.
            localStorage.removeItem('resourceCache:/admin/categories')
            await load()
            setSavedId(category.id)
            setTimeout(() => setSavedId(null), 2000)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save the rate')
        } finally {
            setSavingId(null)
        }
    }, [load])

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-black font-outfit uppercase tracking-tight flex items-center gap-3">
                        <Percent size={22} className="text-primary" aria-hidden="true" />
                        GST &amp; Tax
                    </h2>
                    <p className="text-brand-500 mt-1 text-sm font-semibold">
                        Set the GST rate each product division is billed at. Changes apply to the next sale.
                    </p>
                </div>
            </div>

            {error && (
                <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600">
                    {error}
                </p>
            )}

            <div className="hidden lg:block bg-white rounded-2xl overflow-hidden border border-brand-100 shadow-sm">
                <table className="w-full text-left">
                    <caption className="sr-only">GST rate for each product division</caption>
                    <thead>
                        <tr className="border-b border-brand-100 bg-brand-50/50">
                            <th scope="col" className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-[0.2em]">Division</th>
                            <th scope="col" className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-[0.2em] text-center">Products</th>
                            <th scope="col" className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-[0.2em]">GST Rate</th>
                            <th scope="col" className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-[0.2em] text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-50">
                        {loading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-4 h-20 bg-brand-50/30" /></tr>
                            ))
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-20 text-center text-brand-600 font-bold uppercase tracking-[0.4em] text-label opacity-60">
                                    No divisions yet
                                </td>
                            </tr>
                        ) : categories.map(category => {
                            const draft = drafts[category.id] ?? ''
                            const isDirty = draft !== (category.gst_rate === null ? '' : String(category.gst_rate))
                            const inputId = `gst-rate-${category.id}`
                            return (
                                <tr key={category.id} className="hover:bg-brand-50/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <label htmlFor={inputId} className="font-black text-black">{category.name}</label>
                                        {category.gst_rate === null && (
                                            <p className="text-[11px] font-semibold text-brand-500 mt-0.5">
                                                Using the store default of {category.effective_gst_rate}%
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-brand-700">{category._count?.products ?? 0}</td>
                                    <td className="px-6 py-4"><RateControls id={inputId} value={draft} onChange={v => setDrafts(d => ({ ...d, [category.id]: v }))} /></td>
                                    <td className="px-6 py-4 text-right">
                                        <SaveButton
                                            disabled={!isDirty}
                                            saving={savingId === category.id}
                                            saved={savedId === category.id}
                                            onClick={() => save(category, draft)}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Phone and tablet: one card per division, Save always reachable. */}
            <ul className="lg:hidden space-y-3">
                {loading ? (
                    [...Array(4)].map((_, i) => (
                        <li key={i} className="h-36 rounded-2xl bg-brand-50/40 animate-pulse" />
                    ))
                ) : categories.length === 0 ? (
                    <li className="rounded-2xl border border-brand-100 bg-white px-5 py-10 text-center text-brand-600 font-bold uppercase tracking-[0.3em] text-label opacity-60">
                        No divisions yet
                    </li>
                ) : categories.map(category => {
                    const draft = drafts[category.id] ?? ''
                    const isDirty = draft !== (category.gst_rate === null ? '' : String(category.gst_rate))
                    const inputId = `gst-rate-m-${category.id}`
                    return (
                        <li key={category.id} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <label htmlFor={inputId} className="font-black text-black">{category.name}</label>
                                    {category.gst_rate === null && (
                                        <p className="text-caption font-semibold text-brand-500 mt-0.5">
                                            Using the store default of {category.effective_gst_rate}%
                                        </p>
                                    )}
                                </div>
                                <span className="shrink-0 text-caption font-bold text-brand-600">
                                    {category._count?.products ?? 0} products
                                </span>
                            </div>
                            <RateControls id={inputId} value={draft} onChange={v => setDrafts(d => ({ ...d, [category.id]: v }))} />
                            <SaveButton
                                disabled={!isDirty}
                                saving={savingId === category.id}
                                saved={savedId === category.id}
                                onClick={() => save(category, draft)}
                            />
                        </li>
                    )
                })}
            </ul>

            <p className="text-xs font-semibold text-brand-500">
                Rates apply to sales made from now on. A receipt reprinted from Sales History keeps the rate that was
                charged at the time.
            </p>
        </div>
    )
}
