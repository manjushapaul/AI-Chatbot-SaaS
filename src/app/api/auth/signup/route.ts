import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// Force dynamic rendering to prevent build-time issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  tenant: z.string().min(2, 'Tenant subdomain must be at least 2 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, tenant } = signupSchema.parse(body);

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const tenantSubdomain = tenant.trim().toLowerCase();
    console.log('[Signup API] Processing signup for:', normalizedEmail, 'tenant:', tenantSubdomain);
    
    // Use transaction to ensure all-or-nothing creation
    const result = await prisma.$transaction(async (tx) => {
      // Check if tenant subdomain already exists
      const existingTenant = await tx.tenants.findUnique({
        where: { subdomain: tenantSubdomain }
      });

      if (existingTenant) {
        throw new Error('TENANT_EXISTS');
      }

      // Check if user email already exists in any tenant
      const existingUser = await tx.users.findFirst({
        where: { 
          email: normalizedEmail,
          status: 'ACTIVE'
        }
      });

      if (existingUser) {
        throw new Error('EMAIL_EXISTS');
      }

      // Create new tenant
      const tenantId = randomUUID().replace(/-/g, '');
      const now = new Date();
      const newTenant = await tx.tenants.create({
        data: {
          id: tenantId,
          name: name.split(' ')[0] + "'s Organization", // Use first name for organization
          subdomain: tenantSubdomain,
          plan: 'FREE', // Start with free plan
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        }
      });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user as tenant admin
      const userId = randomUUID().replace(/-/g, '');
      const user = await tx.users.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name,
          password: hashedPassword,
          tenantId: newTenant.id,
          role: 'TENANT_ADMIN', // Make first user the admin
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          createdAt: true
        }
      });

      // Create initial subscription record for the tenant
      const subscriptionId = randomUUID().replace(/-/g, '');
      await tx.subscriptions.create({
        data: {
          id: subscriptionId,
          tenantId: newTenant.id,
          plan: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          createdAt: now,
          updatedAt: now,
        }
      });

      return { user, tenant: newTenant };
    }, {
      timeout: 10000, // 10 second timeout
    });

    return NextResponse.json({
      success: true,
      message: 'Account and organization created successfully',
      user: result.user,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        plan: result.tenant.plan
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Signup API] === SIGNUP ERROR START ===');
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('[Signup API] Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;
    
    console.error('[Signup API] Error type:', typeof error);
    console.error('[Signup API] Error:', error);
    console.error('[Signup API] Error message:', errorMessage);
    console.error('[Signup API] Error code:', errorCode);
    
    if (error instanceof Error && error.stack) {
      console.error('[Signup API] Error stack:', error.stack);
    }

    // Handle business logic errors from transaction
    if (errorMessage === 'TENANT_EXISTS') {
      return NextResponse.json(
        { error: 'Tenant subdomain already exists. Please choose a different one.' },
        { status: 409 }
      );
    }

    if (errorMessage === 'EMAIL_EXISTS') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Check for prepared statement errors (Supabase pooler issue)
    if (errorMessage.includes('prepared statement') || 
        errorMessage.includes('42P05') ||
        errorCode === '42P05') {
      console.error('[Signup API] ⚠️ Prepared statement error - need pgbouncer=true in DATABASE_URL');
      return NextResponse.json(
        { 
          error: 'Database configuration error', 
          details: 'Please add pgbouncer=true to your DATABASE_URL connection string for Supabase.',
          technical: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
    
    // Check for database connection errors
    if (errorMessage.includes('Can\'t reach database') || 
        errorMessage.includes('Tenant or user not found') ||
        errorMessage.includes('authentication failed') ||
        errorMessage.includes('P1001') ||
        errorMessage.includes('P1000') ||
        errorCode === 'P1001' ||
        errorCode === 'P1000') {
      console.error('[Signup API] Database connection error detected');
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: 'Unable to connect to the database. Please check your database configuration.',
          technical: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Check for Prisma unique constraint violations
    if (errorCode === 'P2002') {
      const meta = (error as any)?.meta;
      const target = meta?.target;
      if (target?.includes('subdomain')) {
        return NextResponse.json(
          { error: 'Tenant subdomain already exists. Please choose a different one.' },
          { status: 409 }
        );
      }
      if (target?.includes('email')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    console.error('[Signup API] === SIGNUP ERROR END ===');
    
    // Return more detailed error in development
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred. Please try again.',
        technical: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
        code: errorCode
      },
      { status: 500 }
    );
  }
} 