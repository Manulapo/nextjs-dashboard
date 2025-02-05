'use server';

import { User } from '../lib/models';
import { getDbCollectionData } from './utils';

export async function getUsers(): Promise<User[]> {
    const data = await getDbCollectionData('users');
    const users: User[] = data.map((doc) => ({
        _id: doc._id.toString(),
        id: doc.id.toString(),
        name: doc.name,
        email: doc.email,
        password: doc.password,
    }));
    return users;
}
