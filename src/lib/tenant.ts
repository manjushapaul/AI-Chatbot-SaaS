import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './db';

export interface TenantContext {
  id: string;
  subdomain: string;
  name?: string;
  plan?: string;
  status?: string;
}

export async function getTenantContext(): Promise<TenantContext | null> {
  try {
    // First try to get from headers (for multi-tenant setups)
    const headersList = await headers();
    const tenantId = headersList.get('x-tenant-id');
    const tenantSubdomain = headersList.get('x-tenant-subdomain');

    if (tenantId && tenantSubdomain) {
      return {
        id: tenantId,
        subdomain: tenantSubdomain,
      };
    }

    // If no headers, try to get from current user session
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.tenantId) {
        // Get tenant details from database
        const tenant = await prisma.tenant.findUnique({
          where: { id: session.user.tenantId }
        });

        if (tenant) {
          return {
            id: tenant.id,
            subdomain: tenant.subdomain,
            name: tenant.name,
            plan: tenant.plan,
            status: tenant.status,
          };
        }
      }
    } catch (sessionError) {
      console.log('Session-based tenant context failed, trying request-based...');
    }

    // Fallback to request-based tenant extraction
    return null;
  } catch (error) {
    console.error('Error getting tenant context:', error);
    return null;
  }
}

export function getTenantFromRequest(request: Request): TenantContext | null {
  try {
    const url = new URL(request.url);
    const host = url.host;
    
    // Extract subdomain for development
    if (host.includes('localhost')) {
      const subdomain = host.split('.')[0];
      if (subdomain === 'localhost' || subdomain === '127') {
        return null;
      }
      return {
        id: `dev-${subdomain}`,
        subdomain: subdomain,
      };
    }

    // Extract subdomain from production host
    const hostParts = host.split('.');
    if (hostParts.length < 2) return null;
    
    const subdomain = hostParts[0];
    const domain = hostParts.slice(1).join('.');
    
    if (subdomain === 'www' || subdomain === 'app') return null;
    
    return {
      id: `tenant-${subdomain}`,
      subdomain: subdomain,
    };
  } catch (error) {
    console.error('Error extracting tenant from request:', error);
    return null;
  }
}

export function validateTenantAccess(tenantId: string, userTenantId: string): boolean {
  return tenantId === userTenantId;
}

export function getTenantUrl(subdomain: string, path: string = ''): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const domain = process.env.NODE_ENV === 'production' 
    ? process.env.ROOT_DOMAIN || 'yourdomain.com'
    : 'localhost:3000';
  
  return `${protocol}://${subdomain}.${domain}${path}`;
}

export function getCustomDomainUrl(customDomain: string, path: string = ''): string {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  return `${protocol}://${customDomain}${path}`;
}

export function isSubdomain(host: string): boolean {
  if (host.includes('localhost')) {
    const parts = host.split('.');
    return parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127';
  }
  
  const hostParts = host.split('.');
  return hostParts.length > 2;
}

export function isCustomDomain(host: string): boolean {
  if (host.includes('localhost')) return false;
  
  const hostParts = host.split('.');
  if (hostParts.length < 2) return false;
  
  const domain = hostParts.slice(1).join('.');
  return domain !== process.env.ROOT_DOMAIN && !domain.includes('vercel.app');
} 