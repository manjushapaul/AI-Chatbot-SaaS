import { NextRequest, NextResponse } from 'next/server';
import { apiUsageService } from '@/lib/api-usage-service';
import { getTenantContext } from '@/lib/tenant';

export interface APIUsageMiddlewareOptions {
  trackResponseTime?: boolean;
  trackTokens?: boolean;
  excludePaths?: string[];
  includePaths?: string[];
}

export async function withAPIUsageTracking(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: APIUsageMiddlewareOptions = {}
): Promise<NextResponse> {
  const {
    trackResponseTime = true,
    trackTokens = false,
    excludePaths = ['/_next', '/static', '/favicon.ico'],
    includePaths = []
  } = options;

  const startTime = Date.now();
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Check if we should track this path
  if (excludePaths.some(path => pathname.startsWith(path))) {
    return handler(request);
  }

  if (includePaths.length > 0 && !includePaths.some(path => pathname.startsWith(path))) {
    return handler(request);
  }

  try {
    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      // No tenant context, skip tracking
      return handler(request);
    }

    // Check if tenant can make API call
    const rateLimitInfo = await apiUsageService.canMakeAPICall(tenantContext.id);
    if (!rateLimitInfo.isAllowed) {
      return NextResponse.json(
        { 
          error: 'API call limit exceeded',
          currentUsage: rateLimitInfo.currentUsage,
          limit: rateLimitInfo.limit,
          resetTime: rateLimitInfo.nextResetTime
        },
        { status: 429 }
      );
    }

    // Execute the handler
    const response = await handler(request);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Record usage asynchronously (don't block response)
    apiUsageService.recordUsage({
      tenantId: tenantContext.id,
      endpoint: pathname,
      method: request.method,
      statusCode: response.status,
      responseTime,
              metadata: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          referer: request.headers.get('referer')
        }
    }).catch(error => {
      console.error('Error recording API usage:', error);
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.nextResetTime.toISOString());

    return response;
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Record failed request
    const tenantContext = await getTenantContext();
    if (tenantContext) {
      apiUsageService.recordUsage({
        tenantId: tenantContext.id,
        endpoint: pathname,
        method: request.method,
        statusCode: 500,
        responseTime,
                  metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            userAgent: request.headers.get('user-agent'),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
          }
      }).catch(console.error);
    }

    throw error;
  }
}

/**
 * Higher-order function to wrap API route handlers with usage tracking
 */
export function trackAPIUsage(options: APIUsageMiddlewareOptions = {}) {
  return function<T extends (request: NextRequest) => Promise<NextResponse>>(handler: T) {
    return async function(request: NextRequest): Promise<NextResponse> {
      return withAPIUsageTracking(request, handler, options);
    };
  };
} 