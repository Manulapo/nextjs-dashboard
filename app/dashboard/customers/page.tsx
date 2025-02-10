import { getCustomerData, getCustomerInvoiceStatus } from '@/app/actions/customerActions';
import { Customer, CustomerInvoiceStatus } from '@/app/lib/models';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

// Metadata needs to be in a server component (no 'use client' directive)
export const metadata: Metadata = {
    title: 'Customers',
};

// Main component
export default async function CustomersPage() {
    const customers: Customer[] = await getCustomerData();
    const invoiceStatus: CustomerInvoiceStatus[] = await getCustomerInvoiceStatus();

    const customersWithInvoiceStatus = customers.map((customer) => {
        const customerInvoice = invoiceStatus.filter((invoice: CustomerInvoiceStatus) => invoice._id === customer._id);

        return {
            ...customer,
            total_invoices: customerInvoice[0].total_invoices,
            total_pending: customerInvoice[0].total_pending,
            total_paid: customerInvoice[0].total_paid,
        }
    })

    // ! sbagliato: ritorna sempre lo stesso id

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Customers</h1>
            <div className='flex justify-end items-center gap-4'>
                <Link className=" flex size-max h-10 shrink-0 items-center mt-2 mb-4 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 active:bg-blue-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 "
                    href="/dashboard/customers/new"
                >
                    Add new
                    <PlusIcon className="h-5 md:ml-4" />
                </Link>
            </div>
            <div className="grid gap-4">
                {customersWithInvoiceStatus.map((customer: CustomerInvoiceStatus) => (
                    <div key={customer.id}>
                        <div className="p-4 rounded-lg border border-gray-200 flex items-center justify-between gap-4 px-10 hover:border-gray-300">
                            <div className='flex gap-4 flex items-center justify-between'>
                                <Image
                                    src={customer.image_url}
                                    className="rounded-full"
                                    alt={`${customer.name}'s profile picture`}
                                    width={40}
                                    height={40}></Image>
                                <div>
                                    <h2 className="font-medium">{customer.name}</h2>
                                    <p className="text-gray-400">{customer.email}</p>
                                </div>
                            </div>
                            <div className='flex gap-4'>
                                <div className='flex gap-4'>
                                    <h3 className="font-medium">Total invoices</h3>
                                    <p className='text-gray-400'>{customer.total_invoices}</p>
                                </div>
                                <div className='flex gap-4'>
                                    <h3 className="font-medium">Pending</h3>
                                    <p className='text-gray-400'>{customer.total_pending}</p>
                                </div>
                                <div className='flex gap-4'>
                                    <h3 className="font-medium">Paid</h3>
                                    <p className='text-gray-400'>{customer.total_paid}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}