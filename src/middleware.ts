
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/admin/:path*'], // Protect all routes under /admin
};

export function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('admin-auth-token');
  const { pathname } = request.nextUrl;

  const expectedTokenValue = process.env.ADMIN_SESSION_TOKEN_VALUE;

  if (!expectedTokenValue) {
    console.error("CRITICAL: ADMIN_SESSION_TOKEN_VALUE is not set in environment variables. Admin section will be inaccessible.");
    // Optionally, redirect to an error page or deny access more explicitly
    const response = NextResponse.rewrite(new URL('/500', request.url)); // Assuming a 500 error page exists
    return response;
  }
  
  // If trying to access /admin/login, and has a valid token, redirect to /admin
  if (pathname === '/admin/login') {
    if (adminToken && adminToken.value === expectedTokenValue) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next(); // Allow access to /admin/login if no token or invalid token
  }

  // For all other /admin routes, check token
  if (!adminToken || adminToken.value !== expectedTokenValue) {
    const loginUrl = new URL('/admin/login', request.url);
    // To prevent redirect loops if /admin/login itself is somehow misconfigured to require auth by mistake
    if (pathname !== '/admin/login') {
        const response = NextResponse.redirect(loginUrl);
        // Clear potentially invalid cookie
        if(adminToken && adminToken.value !== expectedTokenValue) {
            response.cookies.delete('admin-auth-token');
        }
        return response;
    }
  }

  return NextResponse.next();
}
