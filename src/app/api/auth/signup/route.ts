import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

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

    // Check if tenant subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { subdomain: tenant }
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Tenant subdomain already exists. Please choose a different one.' },
        { status: 409 }
      );
    }

    // Check if user email already exists globally
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create new tenant
    const newTenant = await prisma.tenant.create({
      data: {
        name: name.split(' ')[0] + "'s Organization", // Use first name for organization
        subdomain: tenant,
        plan: 'FREE', // Start with free plan
        status: 'ACTIVE'
      }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user as tenant admin
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        tenantId: newTenant.id,
        role: 'TENANT_ADMIN', // Make first user the admin
        status: 'ACTIVE'
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
    await prisma.subscription.create({
      data: {
        tenantId: newTenant.id,
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account and organization created successfully',
      user,
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        subdomain: newTenant.subdomain,
        plan: newTenant.plan
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 