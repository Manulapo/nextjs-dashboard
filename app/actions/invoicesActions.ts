'use server';

import { ObjectId } from 'mongodb';
import { Invoice, LatestInvoice, LatestInvoiceRaw } from '../lib/models';
import { connectToDatabase } from '../lib/mongodb';
import { getDbCollectionData } from './utils';
import { formatCurrency } from '../lib/utils';

export async function fetchInvoices(): Promise<Invoice[]> {
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

export async function fetchFilteredInvoices(query: string, currentPage: number, itemsPerPage = 6): Promise<Invoice[]> {
    const offset = (currentPage - 1) * itemsPerPage;

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
            { $limit: itemsPerPage },
        ]).toArray();

        return invoices.map((invoice) => ({
            id: invoice._id.toString(),
            customer_id: invoice.customer_id.toString(),
            date: invoice.date,
            amount: Number(invoice.amount),
            status: invoice.status,
            customerData: {
                id: invoice.customer_data.id.toString(),
                name: invoice.customer_data.name,
                email: invoice.customer_data.email,
                image_url: invoice.customer_data.image_url,
            },
        }))
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoices.');
    }
}

export async function fetchInvoiceById(id: string) {
    try {
        const db = await connectToDatabase();
        
        // Fetch invoice by ID
        const invoice = await db.collection('invoices').findOne({ _id: new ObjectId(id) });

        if (!invoice) {
            throw new Error('Invoice not found.');
        }

        // Transform `_id` and other fields before returning
        return {
            id: invoice._id.toString(),       // Convert `_id` to a string
            customer_id: invoice.customer_id.toString(),
            date: invoice.date,
            amount: invoice.amount / 100,     // Convert amount from cents to dollars
            status: invoice.status,
        } as Invoice;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch invoice.');
    }
}


export async function fetchInvoicesPages(query: string, itemsPerPage = 6) {
    try {
        const db = await connectToDatabase();

        // Aggregazione per filtrare e contare i risultati
        const countResult = await db.collection('invoices').aggregate([
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customer_id',
                    foreignField: 'id',
                    as: 'customer_data',
                },
            },
            { $unwind: '$customer_data' },  // Unisci i dati dei clienti
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
            {
                $count: 'totalCount',
            },
        ]).toArray();

        // Estrai il numero totale di pagine
        const totalCount = countResult[0]?.totalCount || 0;
        const totalPages = Math.ceil(totalCount / itemsPerPage);

        return totalPages;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch total number of invoices.');
    }
}

export async function fetchLatestInvoices() {
    try {
        // await simulateDelay(2000);
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

export const addNewInvoice = async (invoice: Invoice) => {
    try {
        const db = await connectToDatabase();
        const result = await db.collection('invoices').insertOne(invoice);
        return result.insertedId;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to add new invoice.');
    }
}
