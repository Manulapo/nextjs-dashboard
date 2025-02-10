import { Revenue } from "../lib/models";
import { connectToDatabase } from "../lib/mongodb";

export async function fetchRevenue(observedYear?: number): Promise<Revenue[]> {
  try {
    // Simulate a delay of 1 seconds
    // await simulateDelay(1000);
    const db = await connectToDatabase();

    // Fetch data from MongoDB
    const data = await db.collection<Revenue>('revenues').find({}).toArray();

    // Convert ObjectId to string
    if (!observedYear) return data.map((item) => ({ ...item, _id: item._id.toString() })).slice(0, 12);
    return data.filter((item) => item.month.split('-')[1] === String(observedYear));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}