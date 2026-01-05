import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protected paths that require authentication
const PROTECTED_PATHS = ['/dashboard'];

// Public paths that should always be accessible
const PUBLIC_PATHS = ['/', '/pricing', '/auth'];

export async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;
  
  // Skip middleware for favicon first (before any other processing)
  if (pathname === '/favicon.ico' || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // Skip middleware for static files, API routes (except auth), and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/') ||  // Skip all API routes from middleware processing
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    // For API routes, skip tenant extraction to avoid errors
    if (pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    // Continue with tenant extraction for other routes
    return await handleTenantExtraction(request, host);
  }

  // Check if path is public (always accessible)
  const isPublic = PUBLIC_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isProtected) {
    // Get NextAuth session token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      // No session found, redirect to sign-in with redirect parameter
      const signInPath = '/auth/signin';
      const signInUrl = new URL(signInPath, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
    }

  // For public paths on localhost, skip tenant extraction to avoid errors
  if (isPublic && (host.includes('localhost') || host.includes('127.0.0.1'))) {
    return NextResponse.next();
  }

  // Continue with tenant extraction for authenticated or non-public routes
  return await handleTenantExtraction(request, host);
}

async function handleTenantExtraction(request: NextRequest, host: string) {

  // Extract tenant from subdomain or custom domain
  let tenant;
  try {
    tenant = await extractTenantFromHost(host);
  } catch (error) {
    console.error('Error in middleware extractTenantFromHost:', error);
    // If tenant extraction fails, allow the request to proceed
    return NextResponse.next();
  }
  
  if (!tenant) {
    // For localhost development, allow requests to proceed without tenant
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return NextResponse.next();
    }
    
    // Redirect to main platform if no tenant found (production only)
    try {
      const nextAuthUrl = process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '');
      if (nextAuthUrl && host !== nextAuthUrl) {
        const redirectUrl = new URL('/', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (redirectError) {
      console.error('Error creating redirect URL:', redirectError);
      // If redirect fails, just allow the request to proceed
    }
    return NextResponse.next();
  }

  // Add tenant context to headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenant.id);
  requestHeaders.set('x-tenant-subdomain', tenant.subdomain);

  // Clone the request with new headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add tenant info to response headers for client-side access
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-subdomain', tenant.subdomain);

  return response;
}

async function extractTenantFromHost(host: string): Promise<{ id: string; subdomain: string } | null> {
  try {
    // Handle localhost development - don't set tenant from host
    // Let the session-based tenant context handle it instead
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return null; // Let getTenantContext use session instead
    }

    // Extract subdomain from production host
    const hostParts = host.split('.');
    if (hostParts.length < 2) return null;
    
    const subdomain = hostParts[0];
    const domain = hostParts.slice(1).join('.');
    
    // Check if this is a custom domain or subdomain
    if (domain === process.env.ROOT_DOMAIN || domain === 'vercel.app') {
      // This is a subdomain
      if (subdomain === 'www' || subdomain === 'app') return null;
      
      // Here you would typically query your database to find the tenant
      // For now, we'll return a mock tenant
      return {
        id: `tenant-${subdomain}`,
        subdomain: subdomain
      };
    } else {
      // This might be a custom domain
      // You would query your database to find the tenant by custom domain
      return {
        id: `custom-${domain}`,
        subdomain: domain
      };
    }
  } catch (error) {
    console.error('Error extracting tenant from host:', error);
    return null;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (all API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (static assets)
     */
    '/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
}; 