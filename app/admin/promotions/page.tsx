'use client'

import { TicketPercent, RefreshCw } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'
import { API_URL } from '@/lib/api-config'

export default function PromotionsPage() {
    return (
        <AdminResourceTemplate
            title="Marketing Strategy"
            description="Optimize sales through automated discount protocols."
            icon={TicketPercent}
            resourceName="Promotions"
            apiPath="/admin/promotions"
            columns={[
                { label: 'Campaign Title', key: 'name' },
                { label: 'Discount Type', key: 'discountType' },
                { label: 'Value', key: 'discountValue', align: 'center' },
                { label: 'Status', key: 'active', align: 'center' }
            ]}
            renderActions={(item) => (
                <button
                    onClick={async (e) => {
                        e.stopPropagation()
                        try {
                            if (!API_URL) throw new Error('API URL not defined')
                            const token = localStorage.getItem('token')
                            if (!token) return

                            const res = await fetch(`${API_URL}/admin/promotions/${item.id}/toggle`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                credentials: 'include',
                                cache: 'no-store'
                            })
                            if (res.ok) window.location.reload()
                        } catch (err) {
                            console.error(err)
                        }
                    }}
                    className="w-9 h-9 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-center text-brand-800 hover:text-primary transition-all"
                    title="Turn promotion on or off"
                    aria-label="Turn promotion on or off"
                >
                    <RefreshCw size={14} aria-hidden="true" />
                </button>
            )}
            fields={[
                { label: 'Campaign Title', key: 'name', type: 'text', required: true },
                {
                    label: 'Discount Structure',
                    key: 'discountType',
                    type: 'select',
                    options: [
                        { label: 'Percentage (%)', value: 'PERCENT' },
                        { label: 'Fixed Amount ($)', value: 'AMOUNT' }
                    ],
                    required: true
                },
                { label: 'Benefit Value', key: 'discountValue', type: 'number', required: true },
                { label: 'Activation Target (Start)', key: 'startAt', type: 'datetime-local' },
                { label: 'Termination Target (End)', key: 'endAt', type: 'datetime-local' },
                { label: 'Active Deployment', key: 'active', type: 'checkbox' }
            ]}
        />
    )
}
