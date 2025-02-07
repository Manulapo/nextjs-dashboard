'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { connectToDatabase } from '../lib/mongodb';

const FormSchema = z.object({
    id: z.string(),
    amount: z.number(),
    status: z.enum(['pending', 'paid']),
    customerId: z.string(),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
    // Parse the form data. zod will throw an error if the data is invalid.
    const { customerId, amount, status } = CreateInvoice.parse({
        amount: Number(formData.get('amount')),
        status: formData.get('status'),
        customerId: formData.get('customerId'),
    });
    const amountInCents = amount * 100; // avoid floating point errors
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const db = await connectToDatabase();
        await db.collection('invoices').insertOne({ customer_id: customerId, amount: amountInCents, status, date });
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to add new invoice.');
    }
    // Revalidate the invoices page meaning the data will be updated by a new server page render always outsied of the try catch block
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}