import { fetchInvoicesPages } from '@/app/actions/fetchInvoices';
import Heading from '@/app/ui/misc/heading';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import Pagination from '@/app/ui/invoices/pagination';
import Table from '@/app/ui/invoices/table';
import Search from '@/app/ui/misc/search';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';

export default async function Page(props: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
    }>;
}) {
    const searchParams = await props.searchParams; // wait for the searchParams to resolve
    const query = searchParams?.query || '';
    const currentPage = Number(searchParams?.page) || 1;
    const rowsPerPage = 9;
    const totalPages = await fetchInvoicesPages(query, rowsPerPage);

    return (
        <div className="w-full">
            <Heading title='Invoices' />
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <Search placeholder="Search invoices..." />
                <CreateInvoice />
            </div>
            <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton rows={rowsPerPage} />}>
                <Table query={query} currentPage={currentPage} rowsPerPage={rowsPerPage} />
            </Suspense>
            <div className="mt-5 flex w-full justify-center">
                <Pagination totalPages={totalPages} />
            </div>
        </div>
    );
}