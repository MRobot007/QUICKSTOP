'use client'

import { Activity } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'

export default function AuditLogsPage() {
    return (
        <AdminResourceTemplate
            title="System Audit Trail"
            description="Immutable record of sensitive administrative and operational activities."
            icon={Activity}
            resourceName="Audit Logs"
            apiPath="/admin/audit-logs"
            columns={[
                { label: 'Event ID', key: 'id' },
                { label: 'Agent', key: 'user_name' },
                { label: 'Action Manifest', key: 'action' },
                { label: 'Timestamp', key: 'created_at' }
            ]}
            fields={[]} // Read-only system logs
        />
    )
}
