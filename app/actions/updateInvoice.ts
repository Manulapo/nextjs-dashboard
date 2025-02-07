'use server';
import { z } from 'zod';
import { connectToDatabase } from '../lib/mongodb';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';

const FormSchema = z.object({
    id: z.string(),
    amount: z.number(),
    status: z.enum(['pending', 'paid']),
    customerId: z.string(),
    date: z.string(),
});

//omit id and date
const UpdateInvoice = FormSchema.omit({ id:true, date: true })

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: Number(formData.get('amount')),
        status: formData.get('status'),
    });

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