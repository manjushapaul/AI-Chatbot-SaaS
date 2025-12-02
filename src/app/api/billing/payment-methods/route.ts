import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { paymentService } from '@/lib/payment-service';
import { getTenantContext } from '../../../../lib/tenant';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get subscription to find Stripe customer ID
    const subscription = await (prisma as any).subscriptions.findUnique({
      where: { tenantId: tenantContext.id }
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Get payment methods
    const paymentMethods = await paymentService.getPaymentMethods(subscription.stripeCustomerId);

    return NextResponse.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to get payment methods' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get subscription to find Stripe customer ID
    const subscription = await (prisma as any).subscriptions.findUnique({
      where: { tenantId: tenantContext.id }
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    const { paymentMethodId } = await request.json();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Add payment method
    await paymentService.addPaymentMethod(paymentMethodId, subscription.stripeCustomerId);

    return NextResponse.json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Failed to add payment method' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get subscription to find Stripe customer ID
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      );
    }

    // Remove payment method
    await paymentService.removePaymentMethod(paymentMethodId);

    return NextResponse.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant context
    const tenantContext = await getTenantContext();
    if (!tenantContext) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get subscription to find Stripe customer ID
    const subscription = await (prisma as any).subscriptions.findUnique({
      where: { tenantId: tenantContext.id }
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    const { paymentMethodId, action } = await request.json();

    if (!paymentMethodId || !action) {
      return NextResponse.json(
        { error: 'Payment method ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'set_default') {
      await paymentService.setDefaultPaymentMethod(subscription.stripeCustomerId, paymentMethodId);
      return NextResponse.json({
        success: true,
        message: 'Default payment method updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    );
  }
} 