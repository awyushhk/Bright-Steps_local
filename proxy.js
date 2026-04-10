import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const publicPaths = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth/login',
  '/api/auth/register',
];

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/children/:path*',
    '/api/screenings/:path*',
    '/api/therapy/:path*',
    '/api/auth/me',
  ],
};