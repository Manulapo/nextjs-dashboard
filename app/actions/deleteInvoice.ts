'use server';
import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '../lib/mongodb';

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
