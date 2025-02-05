'use server';
import { z } from 'zod';
import { addNewInvoice } from './invoicesActions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    amount: z.number(),
    status: z.enum(['pending', 'paid']),
    customerId: z.string(),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ date: true });


export async function createInvoice(formData: FormData) {
    // Parse the form data. zod will throw an error if the data is invalid.
    const { id, customerId, amount, status } = CreateInvoice.parse({
        amount: Number(formData.get('amount')),
        status: formData.get('status'),
        customerId: formData.get('customerId'),
    });
    const amountInCents = amount * 100; // avoid floating point errors
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    await addNewInvoice({ id, customer_id: customerId, amount: amountInCents, status, date });
    revalidatePath('/dashboard/invoices'); // Revalidate the invoices page meaning the data will be updated by a new server page render
    redirect('/dashboard/invoices');
}