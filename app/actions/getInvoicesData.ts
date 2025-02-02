'use server';

import { Invoice } from '../lib/models';
import { getDbCollectionData } from './utils';

export async function getInvoicesData(): Promise<Invoice[]> {
    const data = await getDbCollectionData('invoices');
    console.log('Invoices:', data);
    const invoices: Invoice[] = data.map((doc) => ({
        id: doc.id.toString(),
        customer_id: doc.customer_id.toString(),
        date: doc.date,
        amount: doc.amount,
        status: doc.status,
    }));
    return invoices;
}
