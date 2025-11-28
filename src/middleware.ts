import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract tenant from subdomain or custom domain
  const tenant = await extractTenantFromHost(host);
  
  if (!tenant) {
    // Redirect to main platform if no tenant found
    if (host !== process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '')) {
      return NextResponse.redirect(new URL('/', request.url));
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
    // Handle localhost development
    if (host.includes('localhost')) {
      const subdomain = host.split('.')[0];
      if (subdomain === 'localhost' || subdomain === '127') {
        return null; // Main platform
      }
      
      // For development, you might want to hardcode a tenant
      return {
        id: 'dev-tenant-id',
        subdomain: subdomain
      };
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 