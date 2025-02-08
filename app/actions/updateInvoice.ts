'use server';
import { z } from 'zod';
import { connectToDatabase } from '../lib/mongodb';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';
import { State } from './createInvoice';

const FormSchema = z.object({
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
const UpdateInvoice = FormSchema.omit({ id: true, date: true })

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