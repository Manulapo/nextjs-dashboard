'use server';

import { Customer, CustomerField } from '../lib/models';
import { connectToDatabase } from '../lib/mongodb';
import { formatCurrency } from '../lib/utils';
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

export async function fetchCustomers(): Promise<CustomerField[]> {
    try {
      const db = await connectToDatabase();
      const customers = await db.collection('customers').find({}, { projection: { id: 1, name: 1 } }).sort({ name: 1 }).toArray();
      return customers.map((customer) => ({ id: customer.id.toString(), name: customer.name }));
    } catch (err) {
      console.error('Database Error:', err);
      throw new Error('Failed to fetch all customers.');
    }
  }
  
  export async function fetchFilteredCustomers(query: string) {
    try {
      const db = await connectToDatabase();
      const customers = await db.collection('customers').aggregate([
        {
          $lookup: {
            from: 'invoices',
            localField: 'id',
            foreignField: 'customer_id',
            as: 'invoices',
          },
        },
        {
          $match: {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
            ],
          },
        },
        {
          $project: {
            id: 1,
            name: 1,
            email: 1,
            image_url: 1,
            total_invoices: { $size: '$invoices' },
            total_pending: {
              $sum: {
                $map: {
                  input: '$invoices',
                  as: 'invoice',
                  in: { $cond: [{ $eq: ['$$invoice.status', 'pending'] }, '$$invoice.amount', 0] },
                },
              },
            },
            total_paid: {
              $sum: {
                $map: {
                  input: '$invoices',
                  as: 'invoice',
                  in: { $cond: [{ $eq: ['$$invoice.status', 'paid'] }, '$$invoice.amount', 0] },
                },
              },
            },
          },
        },
        { $sort: { name: 1 } },
      ]).toArray();
  
      return customers.map((customer) => ({
        ...customer,
        total_pending: formatCurrency(customer.total_pending),
        total_paid: formatCurrency(customer.total_paid),
      }));
    } catch (err) {
      console.error('Database Error:', err);
      throw new Error('Failed to fetch customer table.');
    }
  }
  