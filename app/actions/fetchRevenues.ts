import { Revenue } from "../lib/models";
import { connectToDatabase } from "../lib/mongodb";

export async function fetchRevenue() {
  try {
    // Simulate a delay of 1 seconds
    // await simulateDelay(1000);
    const db = await connectToDatabase();

    // Fetch data from MongoDB
    const data = await db.collection<Revenue>('revenue').find({}).toArray();

    // Convert ObjectId to string
    return data.map((item) => ({ ...item, _id: item._id.toString() }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}