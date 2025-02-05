import { connectToDatabase } from "../lib/mongodb";
import { formatCurrency } from "../lib/utils";

export async function fetchCardData() {
    try {
      // await simulateDelay(4000);
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