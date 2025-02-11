'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '../lib/mongodb';
import { ObjectId } from 'mongodb';
import { Invoice, LatestInvoice } from '../lib/models';
import { formatCurrency } from '../lib/utils';
import { getDbCollectionData } from './utils';

export async function fetchInvoices(): Promise<Invoice[]> {
    const data = await getDbCollectionData('invoices');
    console.log({ invoices: data })
    if (!data) return [];

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
            console.log('Invoice not found');
            return null;
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
        const db = await connectToDatabase();
        // in mongodb i want to have the latest invoices linked to the customers related with also name, image_url and email
        const data = await db.collection('invoices').aggregate([
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
        ]).toArray();

        console.log({ latestInvoices: data });

        return data.map((invoice) => {
            if (!invoice.customer_data) {
                throw new Error(`Customer data missing for invoice ${invoice._id}`);
            }

            return {
                id: invoice._id.toString(), // Convert ObjectId to string
                amount: formatCurrency(invoice.amount),
                image_url: invoice.customer_data.image_url,
                name: invoice.customer_data.name,
                email: invoice.customer_data.email,
            };
        }) as LatestInvoice[];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch the latest invoices.');
    }
}

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const createInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

const CreateInvoice = createInvoiceSchema.omit({ id: true, date: true });

// using useActionState in the UI component, it takes the createInvoice function and the initial state as arguments
export async function createInvoice(prevState: State, formData: FormData): Promise<State> {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        const db = await connectToDatabase();
        await db.collection('invoices').insertOne({ customer_id: customerId, amount: amountInCents, status, date });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to add new invoice.');
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const updateInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
});

//omit id and date
const UpdateInvoice = updateInvoiceSchema.omit({ id: true, date: true })

export async function updateInvoice(
    id: string,
    prevState: State,
    formData: FormData,
) {
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: Number(formData.get('amount')),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    try {
        const db = await connectToDatabase();
        await db.collection('invoices').updateOne(
            { _id: new ObjectId(id) },
            { $set: { customer_id: customerId, amount: amountInCents, status } }
        );
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to update invoice.');
    }

    // Revalidate cache and redirect
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    const db = await connectToDatabase();

    try {
        await db.collection('invoices').deleteOne(
            { _id: new ObjectId(id) }, // NECESSARY IN MONGODB TO USE OBJECTID becaue is the primary key the db uses
        );
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to delete invoice.');
    }
    // Revalidate cache 
    revalidatePath('/dashboard/invoices');
}
