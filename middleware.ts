import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';

export default async function middleware(request: Request) {
  const auth = await NextAuth(authConfig).auth();
  
  // Allow access to public routes even when logged out
  const publicRoutes = ['/', '/login'];

  const isPublicRoute = publicRoutes.some(route => 
    request.url.includes(route)
  );

  if (!auth && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next(); // Allow the request to continue
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

// The middleware function is a function that takes a request object and returns a response object.
// the matcher property is an array of regular expressions that match the URL paths that the middleware should run on. in this case the middleware will run on all paths except those that contain api, _next/static, _next/image, and .png. because the middleware is only concerned with the authentication of the user, it doesn't need to run on these paths.

//publicRoutes is an array of routes that are accessible to users who are not logged in. if the user is not logged in and the request URL is not in the publicRoutes array, the middleware will redirect the user to the login page. if the user is logged in or the request URL is in the publicRoutes array, the middleware will allow the request to continue to the next middleware or handler.