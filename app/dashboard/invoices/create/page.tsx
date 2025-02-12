import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/actions/customerActions';
import { CustomerField } from '@/app/lib/models';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Invoice',
};

export default async function Page() {
    const customers: CustomerField[] = await fetchCustomers();

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    {
                        label: 'Invoices',
                        href: '/dashboard/invoices'
                    },
                    {
                        label: 'Create Invoice',
                        href: '/dashboard/invoices/create',
                        active: true,
                    },
                ]}
            />
            <Form customers={customers} />
        </main>
    );
}