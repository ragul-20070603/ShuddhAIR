import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/firebase-admin';

const protectedRoutes = ['/']; // Add any other routes you want to protect

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const isProtectedRoute = protectedRoutes.includes(request.nextUrl.pathname);

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session) {
    try {
      await auth.verifySessionCookie(session, true);
      if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // Session cookie is invalid. Clear it and redirect to login.
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
