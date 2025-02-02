'use server';

import { Customer } from '../lib/models';
import { getDbCollectionData } from './utils';

export async function getCustomerData(): Promise<Customer[]> {
    const data = await getDbCollectionData('customers');
    const customers: Customer[] = data.map((doc) => ({
        id: doc.id.toString(),
        name: doc.name,
        email: doc.email,
        image_url: doc.image_url,
    }));
    return customers;
}
