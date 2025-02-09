'use server';

import { User } from '../lib/models';
import { getDbCollectionData } from './utils';

export async function getUsers(): Promise<User[]> {
    const data = await getDbCollectionData('users');
    if (!data) return [];
    const users: User[] = data.map((doc) => ({
        _id: doc._id.toString(),
        id: doc.id.toString(),
        name: doc.name,
        email: doc.email,
        password: doc.password,
    }));
    return users;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    console.log({ email });
    const data = await getDbCollectionData('users', { email });
    if (!data) return null;

    return {
        _id: data[0]._id.toString(),
        id: data[0]._id.toString(),
        name: data[0].name,
        email: data[0].email,
        password: data[0].password,
    }
}
