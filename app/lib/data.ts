'use server';

import { ObjectId } from 'mongodb';
import { LatestInvoice, LatestInvoiceRaw, Revenue } from './models';
import { connectToDatabase } from './mongodb';
import { formatCurrency } from './utils';

function simulateDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchRevenue() {
  try {
    const db = await connectToDatabase();

    // Simulate a delay of 3 seconds
    await simulateDelay(1000);

    // Fetch data from MongoDB
    const data = await db.collection<Revenue>('revenue').find({}).toArray();

    // Convert ObjectId to string
    return data.map((item) => ({ ...item, _id: item._id.toString() }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}


export async function fetchLatestInvoices() {
  try {
    await simulateDelay(2000);
    const db = await connectToDatabase();
    const data = await db.collection<LatestInvoiceRaw>('invoices').aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: 'id',
          as: 'customer_data',
        },
      },
      { $unwind: '$customer_data' },
      { $sort: { date: -1 } },
      { $limit: 5 },
      {
        $project: {
          id: 1,
          amount: 1,
          'customer_data.name': 1,
          'customer_data.image_url': 1,
          'customer_data.email': 1,
        },
      },
    ]).toArray();

    return data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
      image_url: invoice.customer_data.image_url,
      name: invoice.customer_data.name,
      email: invoice.customer_data.email,
    })) as LatestInvoice[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    await simulateDelay(4000);
    const db = await connectToDatabase();

    const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
      db.collection('invoices').countDocuments(),
      db.collection('customers').countDocuments(),
      db.collection('invoices').aggregate([
        {
          $group: {
            _id: '',
            paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          },
        },
      ]).toArray(),
    ]);

    return {
      numberOfInvoices: invoiceCount,
      numberOfCustomers: customerCount,
      totalPaidInvoices: formatCurrency(invoiceStatus[0]?.paid ?? 0),
      totalPendingInvoices: formatCurrency(invoiceStatus[0]?.pending ?? 0),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const ITEMS_PER_PAGE = 6;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const db = await connectToDatabase();
    const invoices = await db.collection('invoices').aggregate([
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: 'id',
          as: 'customer_data',
        },
      },
      { $unwind: '$customer_data' },
      {
        $match: {
          $or: [
            { 'customer_data.name': { $regex: query, $options: 'i' } },
            { 'customer_data.email': { $regex: query, $options: 'i' } },
            { amount: { $regex: query, $options: 'i' } },
            { date: { $regex: query, $options: 'i' } },
            { status: { $regex: query, $options: 'i' } },
          ],
        },
      },
      { $sort: { date: -1 } },
      { $skip: offset },
      { $limit: ITEMS_PER_PAGE },
    ]).toArray();

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const db = await connectToDatabase();
    const invoice = await db.collection('invoices').findOne({ _id: new ObjectId(id) });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    return {
      ...invoice,
      amount: invoice.amount / 100,  // Convert from cents to dollars
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const db = await connectToDatabase();
    const customers = await db.collection('customers').find({}, { projection: { id: 1, name: 1 } }).sort({ name: 1 }).toArray();
    return customers;
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
