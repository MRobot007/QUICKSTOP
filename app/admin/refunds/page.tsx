'use client'

import { RotateCcw, Eye, Package, Receipt, User, Calendar, MessageSquare, DollarSign } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'
import { useState } from 'react'
import { X } from 'lucide-react'

export default function RefundsPage() {
    const [selectedRefund, setSelectedRefund] = useState<any>(null)

    return (
        <>
            <AdminResourceTemplate
                title="Reversal Logs"
                description="Audit trail of all processed refunds and stock restorations."
                icon={RotateCcw}
                resourceName="Refunds"
                apiPath="/admin/refunds"
                columns={[
                    { label: 'Refund ID', key: 'id' },
                    { label: 'Receipt No.', key: 'receipt_number' },
                    { label: 'Agent', key: 'processed_by_name' },
                    { label: 'Justification', key: 'reason' },
                    { label: 'Timestamp', key: 'created_at' }
                ]}
                renderActions={(item) => (
                    <button
                        onClick={() => setSelectedRefund(item)}
                        className="w-9 h-9 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-center text-primary hover:text-primary/80 transition-all font-black"
                        title="View Reversal Details" aria-label="View Reversal Details"
                    >
                        <Eye size={14} />
                    </button>
                )}
                fields={[]} // Read-only view
            />

            {/* Refund Detail Modal */}
            {selectedRefund && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
                    <div className="glass-card rounded-[40px] p-10 w-full max-w-2xl relative overflow-hidden border-brand-100 bg-white shadow-2xl animate-entry">
                        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-dark font-outfit tracking-tight uppercase">Reversal Detail</h3>
                                <p className="text-brand-800 italic text-sm font-semibold mt-1">
                                    Financial adjustment for Receipt: <span className="text-primary">#{selectedRefund.receipt_number}</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRefund(null)}
                                className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:text-red-500 transition-colors shadow-sm relative z-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                        <Receipt size={16} />
                                    </div>
                                    <div>
                                        <p className="text-label font-black text-brand-400 uppercase tracking-widest">Receipt Number</p>
                                        <p className="text-xs font-bold text-dark">{selectedRefund.receipt_number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-label font-black text-brand-400 uppercase tracking-widest">Processed By</p>
                                        <p className="text-xs font-bold text-dark">{selectedRefund.processed_by_name}</p>
                                    </div>
                                </div>
                                {selectedRefund.approved_by_name && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <p className="text-label font-black text-green-400 uppercase tracking-widest">Authorized By</p>
                                            <p className="text-xs font-bold text-dark">{selectedRefund.approved_by_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <p className="text-label font-black text-brand-400 uppercase tracking-widest">Timestamp</p>
                                        <p className="text-xs font-bold text-dark">{new Date(selectedRefund.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div>
                                        <p className="text-label font-black text-brand-400 uppercase tracking-widest">Reason / Justification</p>
                                        <p className="text-xs font-bold text-dark">{selectedRefund.reason || 'No justification provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-label font-black text-brand-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Package size={14} />
                                Reverted Inventory
                            </h4>
                            <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-2">
                                    {selectedRefund.items?.map((item: any) => (
                                        <div key={item.id} className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 flex items-center justify-between group hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-brand-100 flex items-center justify-center text-primary font-black text-xs shadow-sm">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-dark uppercase">{item.product_name}</p>
                                                    <p className="text-label font-bold text-brand-400 uppercase tracking-widest">
                                                        {item.restocked ? 'Stock Restored' : 'No Restock'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-primary font-outfit">-${parseFloat(item.amount).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-brand-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="text-label font-black text-brand-400 uppercase tracking-widest">Total Refund Value</p>
                                    <p className="text-2xl font-black text-primary font-outfit">
                                        ${selectedRefund.items?.reduce((acc: number, item: any) => acc + parseFloat(item.amount), 0).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedRefund(null)}
                                className="px-8 py-3 rounded-2xl bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition-all uppercase tracking-widest text-xs"
                            >
                                Close Ledger
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
