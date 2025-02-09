import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { getUserByEmail } from './app/actions/userActions';
import { authConfig } from './auth.config';
import bcrypt from 'bcrypt';


export const { auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    console.log({ email, password });
                    const user = await getUserByEmail(email);

                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    console.log({ passwordsMatch });
                    if (passwordsMatch) {
                        return user;
                    } else {
                        console.error('Password does not ');
                    }
                }

                return null;
            },
        }),
    ],
});