import { Db, MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;

if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable in the .env file'); 
}

console.log('Connecting to MongoDB with URI:', uri);  // Log the connection URI for debugging

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // Use a global variable to preserve the connection in development
    if (!(global as any)._mongoClientPromise) {
        client = new MongoClient(uri, options);
        (global as any)._mongoClientPromise = client.connect();
    }
    clientPromise = (global as any)._mongoClientPromise;
} else {
    // In production, create a new connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export async function getDb(dbName = process.env.MONGODB_DB): Promise<Db> {
    const client = await clientPromise;
    return client.db(dbName);
}
