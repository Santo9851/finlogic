import { NextResponse } from 'next/server';

/**
 * middleware.js
 * Protects portal routes based on user roles stored in the access_token cookie.
 *
 * Token payload: { user_id, email, roles: "admin,entrepreneur", ... }
 * We parse the roles string without a full JWT verify (lightweight; the backend
 * is the authoritative gate). A forged token gives UI access only – the API
 * will still reject unauthorised requests with 401/403.
 */

/** Safely parse the JWT payload without verification (Edge runtime safe). */
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1];
    // atob is available in the Edge runtime
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Normalise comma-separated roles string → array. */
function getRoles(payload) {
  if (!payload?.roles) return [];
  if (Array.isArray(payload.roles)) return payload.roles.map((r) => r.trim());
  return payload.roles.split(',').map((r) => r.trim()).filter(Boolean);
}

// Route → required roles (any match grants access)
const PROTECTED_ROUTES = [
  { pattern: /^\/superadmin($|\/)/, roles: ['super_admin'] },
  { pattern: /^\/gp($|\/)/, roles: ['admin', 'super_admin'] },
  { pattern: /^\/lp($|\/)/, roles: ['investor'] },
  { pattern: /^\/gp-investor($|\/)/, roles: ['gp_investor'] },
  { pattern: /^\/entrepreneur($|\/)/, roles: ['entrepreneur'] },
];

// Role → default redirect after login
const ROLE_HOME = {
  admin: '/gp/dashboard',
  super_admin: '/superadmin/dashboard',
  investor: '/lp/dashboard',
  gp_investor: '/gp-investor/dashboard',
  entrepreneur: '/entrepreneur/dashboard',
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if this path is protected
  const matched = PROTECTED_ROUTES.find(({ pattern }) => pattern.test(pathname));
  if (!matched) return NextResponse.next();

  const token = request.cookies.get('access_token')?.value;

  // No token → redirect to login, preserving returnUrl
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = parseJwtPayload(token);
  const roles = getRoles(payload);

  // Token malformed or expired check (exp)
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('access_token');
    return res;
  }

  // Role check
  const hasAccess = matched.roles.some((r) => roles.includes(r));
  if (!hasAccess) {
    // Redirect to user's own home or root
    const home = roles.map((r) => ROLE_HOME[r]).find(Boolean) ?? '/';
    return NextResponse.redirect(new URL(home, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/gp/:path*',
    '/lp/:path*',
    '/gp-investor/:path*',
    '/entrepreneur/:path*',
  ],
};
