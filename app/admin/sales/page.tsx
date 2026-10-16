'use client'

import { useState } from 'react'
import { History, ArrowUpRight, X, Loader2, Users, RotateCcw, AlertTriangle } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'
import { cn } from '@/lib/utils'
import { API_URL } from '@/lib/api-config'
import { toast } from '@/components/Toast'

interface SaleItem {
    id: number
    quantity: number
    price: number
    subtotal: number
    product: {
        id: number
        name: string
        sku: string
    }
}

interface Sale {
    id: number
    receipt_number: string
    total: number
    payment_method: string
    created_at: string
    items: SaleItem[]
}

export default function SalesPage() {
    const [selectedSale, setSelectedSale] = useState<any>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [isRefunding, setIsRefunding] = useState(false)

    const apiUrl = API_URL

    const handleViewDetail = async (saleId: number) => {
        if (!apiUrl) throw new Error('API URL not defined')
        const token = localStorage.getItem('token')
        if (!token) return

        setLoadingDetail(true)
        setShowDetailModal(true)
        try {
            const res = await fetch(`${apiUrl}/sales/${saleId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                cache: 'no-store'
            })
            if (res.ok) {
                const data = await res.json()
                setSelectedSale(data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingDetail(false)
        }
    }

    const handleRefund = async () => {
        const reason = prompt("Enter justification for financial reversal:")
        if (!reason) return

        if (!apiUrl) throw new Error('API URL not defined')
        const token = localStorage.getItem('token')
        if (!token) return

        setIsRefunding(true)
        try {
            const res = await fetch(`${apiUrl}/admin/refunds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    saleId: selectedSale.id,
                    reason,
                    items: selectedSale.items.map((i: any) => ({
                        saleItemId: i.id,
                        quantity: i.quantity,
                        amount: i.subtotal,
                        restock: true
                    }))
                }),
                credentials: 'include',
                cache: 'no-store'
            })

            if (res.ok) {
                toast.success('Refund recorded.')
                setShowDetailModal(false)
                window.location.reload()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Could not record the refund.')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsRefunding(false)
        }
    }

    const formatCurrency = (val: any) => `$${Number(val || 0).toFixed(2)}`

    return (
        <div className="relative">
            <AdminResourceTemplate
                title="Transaction Journal"
                description="Complete history of all sales and financial operations."
                icon={History}
                resourceName="Sales"
                apiPath="/admin/sales?limit=all"
                columns={[
                    { label: 'Receipt No.', key: 'receipt_number' },
                    { label: 'Gross Total', key: 'total', align: 'right' },
                    { label: 'Method', key: 'payment_method', align: 'center' },
                    { label: 'Date Time', key: 'created_at' }
                ]}
                renderActions={(item) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetail(item.id)
                        }}
                        title="View Details" aria-label="View Details"
                        className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary hover:bg-primary/10 transition-all font-black"
                    >
                        <ArrowUpRight size={14} />
                    </button>
                )}
            />

            {/* Transaction Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
                    <div className="glass-card rounded-[40px] p-8 w-full max-w-2xl relative overflow-hidden border-brand-100 bg-white shadow-2xl animate-entry">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-dark mb-1 font-outfit tracking-tight uppercase">
                                    Transaction Ledger
                                </h3>
                                <p className="text-brand-800 italic text-sm font-semibold">
                                    Session Entry: <span className="text-primary">#{selectedSale?.id || '...'}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDetailModal(false)}
                                className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:text-red-500 transition-colors shadow-sm relative z-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="text-label font-black uppercase tracking-[0.2em] text-brand-400">Consulting Archives...</p>
                            </div>
                        ) : selectedSale && (
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                                {/* Summary Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl bg-brand-50/50 border border-brand-100">
                                        <p className="text-label font-black text-brand-600 uppercase tracking-widest mb-1">Time Stamp</p>
                                        <p className="text-sm font-bold text-dark">{new Date(selectedSale.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-brand-50/50 border border-brand-100 text-right">
                                        <p className="text-label font-black text-brand-600 uppercase tracking-widest mb-1">Payment Channel</p>
                                        <p className="text-sm font-bold text-primary uppercase tracking-tight">{selectedSale.payment_method}</p>
                                    </div>
                                </div>

                                {/* Customer Info */}
                                {selectedSale.customer && (
                                    <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-primary/20 flex items-center justify-center text-primary">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <p className="text-label font-black text-primary uppercase tracking-widest">Patron Identity</p>
                                                <p className="font-bold text-dark">{selectedSale.customer.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-label font-black text-brand-400 uppercase tracking-widest">Loyalty Wallet</p>
                                            <p className="text-sm font-black text-primary font-outfit">{selectedSale.customer.loyalty_points || 0} PTS</p>
                                        </div>
                                    </div>
                                )}

                                {/* Line Items */}
                                <div className="space-y-3">
                                    <h4 className="text-label font-black text-brand-900 uppercase tracking-widest ml-1">Inventory Breakdown</h4>
                                    <div className="border border-brand-50 rounded-3xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-brand-50/50 text-label font-black text-brand-700 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-5 py-4">Item Identity</th>
                                                    <th className="px-5 py-4 text-center">Unit</th>
                                                    <th className="px-5 py-4 text-right">Extension</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-brand-50">
                                                {selectedSale.items.map((item: any) => (
                                                    <tr key={item.id}>
                                                        <td className="px-5 py-4">
                                                            <p className="font-black text-dark tracking-tight leading-none mb-1">{item.name || item.product?.name}</p>
                                                            <p className="text-label text-brand-400 font-bold uppercase">{item.sku || item.product?.sku}</p>
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-bold text-brand-900">
                                                            {item.quantity} × {formatCurrency(item.price)}
                                                        </td>
                                                        <td className="px-5 py-4 text-right font-black text-primary font-outfit">
                                                            {formatCurrency(item.subtotal)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Financial Total */}
                                <div className="p-6 rounded-[32px] bg-dark text-white space-y-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                                    <div className="flex justify-between items-center text-label font-black uppercase tracking-[0.2em] text-white/50">
                                        <span>Operational Subtotal</span>
                                        <span>{formatCurrency(selectedSale.subtotal)}</span>
                                    </div>
                                    {/* One line per rate the basket actually carried. The
                                        API returns the breakup with the sale; older sales
                                        recorded before per-line rates were kept fall back
                                        to the single total. */}
                                    {selectedSale.gstBreakup && selectedSale.gstBreakup.length > 0 ? (
                                        selectedSale.gstBreakup.map((g: any) => (
                                            <div key={g.rate} className="flex justify-between items-center text-label font-black uppercase tracking-[0.2em] text-white/50">
                                                <span>GST {g.rate}% on {formatCurrency(g.taxable)}</span>
                                                <span>{formatCurrency(g.tax)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center text-label font-black uppercase tracking-[0.2em] text-white/50">
                                            <span>GST</span>
                                            <span>{formatCurrency(selectedSale.tax)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-2">
                                        <span className="text-sm font-black uppercase tracking-widest">Gross Settlement</span>
                                        <span className="text-2xl font-black font-outfit text-primary">{formatCurrency(selectedSale.total)}</span>
                                    </div>
                                </div>

                                {/* Refund Action */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={handleRefund}
                                        disabled={isRefunding}
                                        className="flex-1 py-5 rounded-[24px] bg-red-50 text-red-600 font-black border border-red-100 hover:bg-red-100 transition-all uppercase tracking-widest text-label flex items-center justify-center gap-2"
                                    >
                                        {isRefunding ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
                                        Authorize Full Reversal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

