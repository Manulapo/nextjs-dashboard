import { Db } from "mongodb";
import { connectToDatabase } from "../lib/mongodb";

export const getDbCollectionData = async (collectionName: string) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const data = await collection.find({}).toArray();
        return data;
    } catch (error: any) {
        console.error('Error on Collections:', collectionName);
        // Log completo dell'errore
        throw new Error(`Errore durante la connessione o la query al database: ${error.message}`);
    }
}

export const postDbCollectionData = async (collectionName: string, data: any) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const result = await collection.insertOne(data);
        return result;
    } catch (error: any) {
        console.error('Error on Collections:', collectionName);
        // Log completo dell'errore
        throw new Error(`Errore durante la connessione o la query al database: ${error.message}`);
    }
}

export const putDbCollectionData = async (collectionName: string, data: any) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const result = await collection.updateOne({ id: data.id }, { data });
        return result;
    } catch (error: any) {
        console.error('Error on Collections:', collectionName);
        // Log completo dell'errore
        throw new Error(`Errore durante la connessione o la query al database: ${error.message}`);
    }
}

export const deleteDbCollectionData = async (collectionName: string, id: string) => {
    try {
        const db: Db = await connectToDatabase();
        const collection = db.collection(collectionName);
        const result = await collection.deleteOne({ id });
        return result;
    } catch (error: any) {
        console.error('Error on Collections:', collectionName);
        // Log completo dell'errore
        throw new Error(`Errore durante la connessione o la query al database: ${error.message}`);
    }
}

export function simulateDelay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}