'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Search, Check, X, AlertCircle, Plus, Trash2, CheckCircle2, Loader2 } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'
import { API_URL } from '@/lib/api-config'
import { cn } from '@/lib/utils'
import { toast } from '@/components/Toast'

export default function PurchaseOrdersPage() {
    const [suppliers, setSuppliers] = useState<{ label: string, value: string }[]>([])
    const [products, setProducts] = useState<any[]>([])
    const [showNewOrder, setShowNewOrder] = useState(false)
    const [showDetail, setShowDetail] = useState<any>(null)
    const [newOrder, setNewOrder] = useState<any>({ supplierId: '', notes: '', items: [] })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [receivingItems, setReceivingItems] = useState<Record<number, number>>({})
    const [refreshKey, setRefreshKey] = useState(0)

    const apiUrl = API_URL

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token')
                const [sRes, pRes] = await Promise.all([
                    fetch(`${apiUrl}/admin/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/admin/products`, { headers: { 'Authorization': `Bearer ${token}` } })
                ])
                
                if (sRes.ok) {
                    const sData = await sRes.json()
                    setSuppliers(sData.map((s: any) => ({ label: s.name, value: s.id.toString() })))
                }
                if (pRes.ok) {
                    const pData = await pRes.json()
                    setProducts(pData)
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchData()
    }, [apiUrl])

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newOrder.supplierId || newOrder.items.length === 0) {
            toast.error('Pick a supplier and add at least one item.')
            return
        }
        setIsSubmitting(true)
        try {
            const res = await fetch(`${apiUrl}/admin/purchase-orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newOrder)
            })
            if (res.ok) {
                setShowNewOrder(false)
                setNewOrder({ supplierId: '', notes: '', items: [] })
                setRefreshKey(prev => prev + 1)
            } else {
                const err = await res.json()
                toast.error(err.error || 'Could not create the order.')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReceiveOrder = async () => {
        if (!showDetail) return
        const itemsToReceive = Object.entries(receivingItems)
            .filter(([_, qty]) => qty > 0)
            .map(([itemId, qty]) => ({
                itemId: parseInt(itemId),
                receivedQty: qty
            }))

        if (itemsToReceive.length === 0) {
            toast.error('Enter how many units arrived.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch(`${apiUrl}/admin/purchase-orders/${showDetail.id}/receive`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: itemsToReceive })
            })
            if (res.ok) {
                setShowDetail(null)
                setReceivingItems({})
                setRefreshKey(prev => prev + 1)
                toast.success('Stock updated.')
            } else {
                const err = await res.json()
                toast.error(err.error || 'Could not receive the items.')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const fetchOrderDetail = async (id: number) => {
        try {
            const res = await fetch(`${apiUrl}/admin/purchase-orders/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                const data = await res.json()
                setShowDetail(data)
                // Initialize receiving items with pending quantities
                const pending: any = {}
                data.items.forEach((it: any) => {
                    pending[it.id] = Math.max(0, it.ordered_qty - it.received_qty)
                })
                setReceivingItems(pending)
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="relative">
            <AdminResourceTemplate
                key={refreshKey}
                title="Procurement Orders"
                description="Track and manage stock replenishment requests."
                icon={ShoppingBag}
                resourceName="Purchase Orders"
                apiPath="/admin/purchase-orders"
                columns={[
                    { label: 'Order ID', key: 'id' },
                    { label: 'Supplier', key: 'supplier_name' },
                    { 
                        label: 'Workflow Status', 
                        key: 'status',
                        render: (val) => {
                            const colors: any = {
                                'DRAFT': 'bg-gray-100 text-gray-600 border-gray-200',
                                'ORDERED': 'bg-blue-50 text-blue-600 border-blue-100',
                                'RECEIVED': 'bg-green-50 text-green-600 border-green-100',
                                'CANCELLED': 'bg-red-50 text-red-600 border-red-100'
                            }
                            return (
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-label font-black uppercase tracking-widest border",
                                    colors[val] || 'bg-brand-50 text-brand-600 border-brand-100'
                                )}>
                                    {val}
                                </span>
                            )
                        }
                    },
                    { label: 'Issued By', key: 'created_by_name' }
                ]}
                renderActions={(item) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            fetchOrderDetail(item.id)
                        }}
                        className="w-9 h-9 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-center text-brand-800 hover:text-primary transition-all"
                        title="Manage Items" aria-label="Manage Items"
                    >
                        <ShoppingBag size={14} />
                    </button>
                )}
                headerActions={
                    <button
                        onClick={() => setShowNewOrder(true)}
                        className="premium-button flex items-center gap-2 uppercase text-label tracking-widest font-black shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                        New Procurement Request
                    </button>
                }
            />

            {/* New Order Modal */}
            {showNewOrder && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
                    <div className="glass-card rounded-[40px] p-10 w-full max-w-4xl relative overflow-hidden border-brand-100 bg-white shadow-2xl animate-entry">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-dark font-outfit tracking-tight uppercase">Initiate Procurement</h3>
                                <p className="text-brand-800 italic text-sm font-semibold mt-1">Select items for the upcoming stock replenishment cycle.</p>
                            </div>
                            <button
                                onClick={() => setShowNewOrder(false)}
                                className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:text-red-500 transition-colors shadow-sm relative z-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrder} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-label font-black text-brand-900 uppercase tracking-widest ml-1">Preferred Supplier</label>
                                    <select
                                        value={newOrder.supplierId}
                                        onChange={e => setNewOrder({ ...newOrder, supplierId: e.target.value })}
                                        className="input-field w-full font-semibold cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Partner</option>
                                        {suppliers.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-label font-black text-brand-900 uppercase tracking-widest ml-1">Workflow Notes</label>
                                    <input
                                        type="text"
                                        value={newOrder.notes}
                                        onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })}
                                        className="input-field w-full font-semibold"
                                        placeholder="Internal reference or delivery notes..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-primary uppercase tracking-widest">Inventory Selection</h4>
                                    <span className="text-label font-bold text-brand-400 italic">{newOrder.items.length} unique items specified</span>
                                </div>

                                <div className="border border-brand-50 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-left bg-white">
                                        <thead className="bg-brand-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest">Asset Name</th>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest w-32">Qty</th>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest w-40">Unit Cost</th>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest w-20"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-50">
                                            {newOrder.items.map((it: any, idx: number) => {
                                                const product = products.find(p => p.id === parseInt(it.productId))
                                                return (
                                                    <tr key={idx} className="group transition-colors">
                                                        <td className="px-6 py-4">
                                                            <select
                                                                value={it.productId}
                                                                onChange={e => {
                                                                    const selected = products.find(p => p.id === parseInt(e.target.value))
                                                                    const updated = [...newOrder.items]
                                                                    updated[idx] = { ...updated[idx], productId: e.target.value, costPrice: selected?.cost_price || 0 }
                                                                    setNewOrder({ ...newOrder, items: updated })
                                                                }}
                                                                className="w-full bg-transparent border-none font-bold text-sm text-brand-900 focus:ring-0 cursor-pointer"
                                                            >
                                                                <option value="">Choose Product...</option>
                                                                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                value={it.quantity}
                                                                onChange={e => {
                                                                    const updated = [...newOrder.items]
                                                                    updated[idx] = { ...updated[idx], quantity: e.target.value }
                                                                    setNewOrder({ ...newOrder, items: updated })
                                                                }}
                                                                className="w-full bg-brand-50 border-none rounded-xl px-3 py-2 font-black text-sm text-primary focus:ring-2 focus:ring-primary/20"
                                                                min="1"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-brand-400 font-bold">$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={it.costPrice}
                                                                    onChange={e => {
                                                                        const updated = [...newOrder.items]
                                                                        updated[idx] = { ...updated[idx], costPrice: e.target.value }
                                                                        setNewOrder({ ...newOrder, items: updated })
                                                                    }}
                                                                    className="w-full bg-brand-50 border-none rounded-xl px-3 py-2 font-black text-sm text-primary focus:ring-2 focus:ring-primary/20"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updated = newOrder.items.filter((_: any, i: number) => i !== idx)
                                                                    setNewOrder({ ...newOrder, items: updated })
                                                                }}
                                                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            <tr>
                                                <td colSpan={4} className="px-6 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewOrder({ ...newOrder, items: [...newOrder.items, { productId: '', quantity: 1, costPrice: 0 }] })}
                                                        className="w-full py-3 rounded-2xl border-2 border-dashed border-brand-100 text-brand-400 font-black uppercase text-label tracking-[0.2em] hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={14} />
                                                        Append Line Item
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm z-20 pb-4">
                                <button
                                    type="button"
                                    onClick={() => setShowNewOrder(false)}
                                    className="flex-1 py-4 rounded-2xl bg-brand-50 border border-brand-100 text-brand-800 font-bold hover:bg-brand-100 transition-colors uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 rounded-2xl bg-primary text-white font-black shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} className="group-hover:rotate-12 transition-transform" />}
                                    {isSubmitting ? 'Transmitting...' : 'Dispatch Order'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View/Receive Modal */}
            {showDetail && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
                    <div className="glass-card rounded-[40px] p-10 w-full max-w-4xl relative overflow-hidden border-brand-100 bg-white shadow-2xl animate-entry">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-dark font-outfit tracking-tight uppercase">Procurement Receipt: #{showDetail.id}</h3>
                                <p className="text-brand-800 italic text-sm font-semibold mt-1">Status: {showDetail.status} • Issued to {showDetail.supplier_name}</p>
                            </div>
                            <button
                                onClick={() => setShowDetail(null)}
                                className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:text-red-500 transition-colors shadow-sm relative z-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-5 rounded-3xl bg-brand-50/50 border border-brand-100">
                                    <p className="text-label font-black text-brand-400 uppercase tracking-widest mb-1">Creation Date</p>
                                    <p className="font-bold text-dark">{new Date(showDetail.ordered_at || Date.now()).toLocaleDateString()}</p>
                                </div>
                                <div className="p-5 rounded-3xl bg-brand-50/50 border border-brand-100">
                                    <p className="text-label font-black text-brand-400 uppercase tracking-widest mb-1">Creator</p>
                                    <p className="font-bold text-dark">{showDetail.created_by_name || 'System Auto'}</p>
                                </div>
                                <div className="p-5 rounded-3xl bg-brand-50/50 border border-brand-100">
                                    <p className="text-label font-black text-brand-400 uppercase tracking-widest mb-1">Notes</p>
                                    <p className="font-bold text-dark truncate">{showDetail.notes || 'No notes added'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-primary uppercase tracking-widest">Inventory Manifest</h4>
                                <div className="border border-brand-50 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-left bg-white">
                                        <thead className="bg-brand-50/50">
                                            <tr>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest">Asset</th>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest">Ordered</th>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest">Received</th>
                                                <th className="px-6 py-4 text-label font-black text-brand-700 uppercase tracking-widest w-40">Accepting Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-50">
                                            {showDetail.items.map((it: any) => (
                                                <tr key={it.id}>
                                                    <td className="px-6 py-4">
                                                        <p className="font-black text-sm text-primary uppercase tracking-tight">{it.product_name}</p>
                                                        <p className="text-label font-bold text-brand-400 uppercase italic">{it.sku}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-black text-dark">{it.ordered_qty}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "font-black",
                                                            it.received_qty >= it.ordered_qty ? "text-green-600" : "text-brand-400"
                                                        )}>
                                                            {it.received_qty} / {it.ordered_qty}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {it.received_qty < it.ordered_qty && showDetail.status !== 'CANCELLED' ? (
                                                            <input
                                                                type="number"
                                                                value={receivingItems[it.id] || 0}
                                                                onChange={e => setReceivingItems({ ...receivingItems, [it.id]: parseInt(e.target.value) })}
                                                                max={it.ordered_qty - it.received_qty}
                                                                className="w-full bg-brand-50 border-none rounded-xl px-3 py-2 font-black text-sm text-primary focus:ring-2 focus:ring-primary/20"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-green-600 font-black text-label uppercase tracking-widest">
                                                                <Check size={14} /> Fullfilled
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {showDetail.status !== 'RECEIVED' && showDetail.status !== 'CANCELLED' && (
                                <div className="flex gap-4 pt-4 pb-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowDetail(null)}
                                        className="flex-1 py-4 rounded-2xl bg-brand-50 border border-brand-100 text-brand-800 font-bold hover:bg-brand-100 transition-colors uppercase tracking-widest text-xs"
                                    >
                                        Later
                                    </button>
                                    <button
                                        onClick={handleReceiveOrder}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 rounded-2xl bg-green-600 text-white font-black shadow-lg shadow-green-200 hover:bg-green-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <CheckCircle2 className="animate-pulse" size={18} /> : <CheckCircle2 size={18} />}
                                        {isSubmitting ? 'Updating Inventory...' : 'Confirm Receipt & Update Stock'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
