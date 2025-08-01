import { NextResponse, type NextRequest } from 'next/server';

const protectedRoutes = ['/'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.includes(pathname);

  // If the user has no session cookie and is trying to access a protected route, redirect to login.
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user has a session cookie and is trying to access a public route (like login/signup), redirect to the home page.
  if (session && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
