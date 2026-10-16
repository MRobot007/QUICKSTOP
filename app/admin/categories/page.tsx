'use client'

import { Tag } from 'lucide-react'
import { AdminResourceTemplate } from '@/components/AdminResourceTemplate'

export default function CategoriesPage() {
    return (
        <AdminResourceTemplate
            title="Product Divisions"
            description="Classify and organize your inventory assets."
            icon={Tag}
            resourceName="Categories"
            apiPath="/admin/categories"
            showBulkDelete={true}
            columns={[
                { label: 'Division Name', key: 'name' },
                { label: 'Product Associations', key: '_count.products', align: 'center' }
            ]}
            fields={[
                { label: 'Division Name', key: 'name', type: 'text', required: true }
            ]}
        />
    )
}
