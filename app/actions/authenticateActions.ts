'use server';
 
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcrypt';
import { redirect } from 'next/navigation';
import { getDbCollectionData, postDbCollectionData } from './utils';
import { z } from 'zod';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export type State = {
    message: string | null;
    errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
    };
    pending?: boolean;
    success?: boolean;
};

const Formschema = z.object({
    name: z.string().nonempty({
        message: 'Please enter your name.',
    }),
    email: z.string({
        invalid_type_error: 'Please enter a valid email address.',
    }).email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(6, {
        message: 'Password must be at least 6 characters long.',
    }),
});


export async function registerUser(prevState: State, formData: FormData): Promise<State> {

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    console.log({ name, email, password });

    const validatedFields = Formschema.safeParse({
        name,
        email,
        password,
    });

    console.log({ validatedFields });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Failed to register user.',
        };
    }


    try {
        console.log('Connecting to database...');
        // Check if the user already exists
        const existingUser = await getDbCollectionData('users', { email });

        console.log({ existingUser });

        if (existingUser && existingUser.length > 0) {
            return {
                errors: {
                    email: ['User already exists.'],
                },
                message: 'Failed to register user.',
            };
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.group({ hashedPassword });

        await postDbCollectionData('users', {
            name,
            email,
            password: hashedPassword,
            createdAt: new Date(),
        });

        console.log('User registered successfully.');

    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to register user.');
    }

    // redirect the user.
    redirect('/login');
}
