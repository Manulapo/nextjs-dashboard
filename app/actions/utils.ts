import { Db, Document, Filter } from "mongodb";
import { connectToDatabase } from "../lib/mongodb";
import bcrypt from 'bcrypt';

export const getDbCollectionData = async (collectionName: string, filter?: Filter<Document>) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        filter = filter || {};
        const data = await collection.find(filter).toArray();
        return data;
    } catch (error: unknown) {
        logError(error, collectionName);
    }
}

export const postDbCollectionData = async (collectionName: string, data: any) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const result = await collection.insertOne(data);
        return result;
    } catch (error: unknown) {
        logError(error, collectionName);
    }
}

export const putDbCollectionData = async (collectionName: string, data: any) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const result = await collection.updateOne({ id: data.id }, { data });
        return result;
    } catch (error: unknown) {
        logError(error, collectionName);
    }
}

export const deleteDbCollectionData = async (collectionName: string, id: string) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({ id });
        return result;
    } catch (error: unknown) {
        logError(error, collectionName);
    }
}

export function simulateDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const logError = (error: unknown, collectionName?: string) => {
    if (collectionName) {
        console.error('Error on Collections:', collectionName);
    }

    if (error instanceof Error) {
        throw new Error(`Errore durante la connessione o la query al database: ${error.message}`);
    } else {
        throw new Error('Errore durante la connessione o la query al database: errore sconosciuto');
    }
}

async function hashExistingPasswords() {
  try {
    const db = await connectToDatabase();
    const users = await db.collection('users').find({}).toArray();

    for (const user of users) {
      // Check if password is not already hashed (doesn't start with $2b$)
      if (!user.password.startsWith('$2b$')) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`Updated password for user: ${user.email}`);
      }
    }
    
    console.log('Password hashing completed');
  } catch (error) {
    console.error('Error updating passwords:', error);
  }
}
