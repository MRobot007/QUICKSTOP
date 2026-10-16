'use client'

import { useState } from 'react'
import { Users2, History, X, Receipt, Calendar, CreditCard, DollarSign } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'
import { API_URL } from '@/lib/api-config'
import { cn } from '@/lib/utils'

export default function CustomersPage() {
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    const fetchHistory = async (customer: any) => {
        if (!API_URL) throw new Error('API URL not defined')
        const token = localStorage.getItem('token')
        if (!token) return

        setLoadingHistory(true)
        setSelectedCustomer(customer)
        try {
            const res = await fetch(`${API_URL}/customers/${customer.id}/purchases`, {
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
                setHistory(data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingHistory(false)
        }
    }

    return (
        <>
            <AdminResourceTemplate
                title="Patron Profiles"
                description="Comprehensive management of customer loyalty and fiscal history."
                icon={Users2}
                resourceName="Customers"
                apiPath="/admin/customers"
                csvPath="/csv/customers"
                showBulkDelete={true}
                columns={[
                    { label: 'Full Name', key: 'name' },
                    { label: 'Mobile No.', key: 'phone' },
                    { label: 'Loyalty Points', key: 'loyalty_points', align: 'center' },
                    {
                        label: 'Member Since',
                        key: 'created_at',
                        render: (val) => (
                            <span className="text-xs font-bold text-brand-700 uppercase">
                                {val ? new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                            </span>
                        )
                    }
                ]}
                renderActions={(item) => (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            fetchHistory(item)
                        }}
                        className="w-9 h-9 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-center text-brand-800 hover:text-primary transition-all"
                        title="Engagement History" aria-label="Engagement History"
                    >
                        <History size={14} />
                    </button>
                )}
                fields={[
                    { label: 'Full Name', key: 'name', type: 'text', required: true },
                    { label: 'Mobile Number', key: 'phone', type: 'text', required: true },
                    { label: 'Loyalty Points', key: 'loyalty_points', type: 'number' }
                ]}
            />

            {selectedCustomer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
                    <div className="glass-card rounded-[40px] p-10 w-full max-w-4xl relative overflow-hidden border-brand-100 bg-white shadow-2xl animate-entry">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-dark font-outfit tracking-tight uppercase">Engagement Audit: {selectedCustomer.name}</h3>
                                <p className="text-brand-800 italic text-sm font-semibold mt-1">Historical ledger of all terminal settlements for this profile.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCustomer(null)}
                                className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:text-red-500 transition-colors shadow-sm relative z-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <p className="text-label font-black uppercase tracking-widest text-brand-400">Consulting Archives...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="py-20 text-center">
                                <p className="text-brand-400 font-bold uppercase tracking-[0.3em] text-label">No historical data found for this patron.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-[32px] border border-brand-50 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className="bg-brand-50/50 sticky top-0 z-10">
                                            <tr className="border-b border-brand-50">
                                                <th className="px-8 py-5 text-label font-black text-brand-700 uppercase tracking-widest">Receipt ID</th>
                                                <th className="px-8 py-5 text-label font-black text-brand-700 uppercase tracking-widest">Timestamp</th>
                                                <th className="px-8 py-5 text-label font-black text-brand-700 uppercase tracking-widest">Financial Channel</th>
                                                <th className="px-8 py-5 text-label font-black text-brand-700 uppercase tracking-widest text-right">Settlement</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-50">
                                            {history.map((sale) => (
                                                <tr key={sale.id} className="hover:bg-brand-50/30 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-brand-100 flex items-center justify-center text-primary">
                                                                <Receipt size={14} />
                                                            </div>
                                                            <span className="text-sm font-black text-primary tracking-tight">#{sale.receipt_number || sale.id}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2 text-brand-800 font-bold text-xs uppercase tracking-tight">
                                                            <Calendar size={12} className="text-primary/60" />
                                                            {new Date(sale.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2 text-brand-800 font-bold text-xs uppercase tracking-tight">
                                                            <CreditCard size={12} className="text-primary/60" />
                                                            {sale.payment_method.toUpperCase()}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-primary text-sm font-outfit uppercase tracking-tighter flex items-center justify-end gap-1">
                                                        <DollarSign size={14} className="opacity-40" />
                                                        {Number(sale.total).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between px-8 py-6 bg-primary/5 rounded-[32px] border border-primary/10">
                                    <div className="space-y-0.5">
                                        <p className="text-label font-black text-primary uppercase tracking-widest">Lifetime Engagements</p>
                                        <p className="text-xs font-bold text-brand-700">Accumulated terminal settlements across all sessions.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-primary font-outfit uppercase tracking-tighter">
                                            {history.length} Transactions
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
