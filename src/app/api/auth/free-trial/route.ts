import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendTrialStartNotification } from '@/lib/trial-notifications';
import { randomUUID } from 'crypto';
import { LemonSqueezy } from '@lemonsqueezy/js';

const freeTrialSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Initialize INSIDE handler only (env vars available)
    // Lazy initialization - only created when handler is called
    const _lemonSqueezy = new LemonSqueezy(process.env.LEMON_SQUEEZY_API_KEY!);
    
    const body = await request.json();
    const { email, password, company } = freeTrialSchema.parse(body);

    const emailLower = email.toLowerCase();

    // Check if user email already exists globally
    const existingUser = await (prisma as PrismaClient).users.findFirst({
      where: { email: emailLower }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Generate tenant subdomain from email or company
    let tenantSubdomain = '';
    if (company && company.trim()) {
      // Use company name, sanitized
      tenantSubdomain = company
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);
    } else {
      // Use email domain or username
      const emailParts = emailLower.split('@');
      tenantSubdomain = emailParts[0]
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30);
    }

    // Ensure subdomain is valid and unique
    let finalSubdomain = tenantSubdomain;
    let counter = 1;
    while (await (prisma as PrismaClient).tenants.findUnique({ where: { subdomain: finalSubdomain } })) {
      finalSubdomain = `${tenantSubdomain}${counter}`;
      counter++;
    }

    // Generate user name from email
    const name = emailLower.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'User';

    // Create new tenant
    const tenantId = randomUUID().replace(/-/g, '');
    const now = new Date();
    const newTenant = await (prisma as PrismaClient).tenants.create({
      data: {
        id: tenantId,
        name: company?.trim() || `${name}'s Organization`,
        subdomain: finalSubdomain,
        plan: 'FREE',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
      }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user as tenant admin
    const userId = randomUUID().replace(/-/g, '');
    const user = await (prisma as PrismaClient).users.create({
      data: {
        id: userId,
        email: emailLower,
        name,
        password: hashedPassword,
        tenantId: newTenant.id,
        role: 'TENANT_ADMIN',
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

    // Create initial subscription record for the tenant (14-day trial)
    const subscriptionId = randomUUID().replace(/-/g, '');
    const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    await (prisma as PrismaClient).subscriptions.create({
      data: {
        id: subscriptionId,
        tenantId: newTenant.id,
        plan: 'FREE',
        status: 'TRIALING',
        trialEndsAt: trialEndDate,
        isTrialExpired: false,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndDate,
        cancelAtPeriodEnd: false,
        createdAt: now,
        updatedAt: now,
      }
    });

    // Send trial start notification
    try {
      await sendTrialStartNotification(newTenant.id, user.id);
    } catch (notifError) {
      console.error('Failed to send trial start notification:', notifError);
      // Don't fail the signup if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Free trial account created successfully',
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
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    console.error('Free trial signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

