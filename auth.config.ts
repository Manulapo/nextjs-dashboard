import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login',//URL to redirect to for signing in
  },
  callbacks: {
    // This is called when a user signs in
    authorized({ auth, request: { nextUrl } }) { //request: { nextUrl } is a destructured object that contains the request object and the nextUrl property
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard'); //checks if the nextUrl pathname starts with /dashboard meaning the user is on the dashboard

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl)); // Redirect authenticated users to dashboard
      }
      return false;
    },
  },
  providers: [], //providers are what you use to authenticate users
} satisfies NextAuthConfig;

// the whole logic is:
// §1. If the user is on the dashboard and is authenticated, allow access.
// §2. If the user is on the dashboard and is not authenticated, redirect to the login page.
// §3. If the user is not on the dashboard and is authenticated, redirect to the dashboard.
// §4. If the user is not on the dashboard and is not authenticated, redirect to the login page.