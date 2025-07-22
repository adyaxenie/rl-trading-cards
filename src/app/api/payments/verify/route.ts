import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { processPaymentAndAddCredits, getTransactionByStripeSession } from '@/lib/database';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // First check if we have a transaction record
    const existingTransaction = await getTransactionByStripeSession(session_id);
    
    if (existingTransaction && existingTransaction.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
    }

    // If transaction is already completed, return success without processing again
    if (existingTransaction && existingTransaction.status === 'completed') {
      return NextResponse.json({ 
        success: true, 
        credits: existingTransaction.credits,
        package: existingTransaction.package_id,
        alreadyProcessed: true
      });
    }

    // Retrieve the session from Stripe to verify payment
    const stripeSession = await stripe.checkout.sessions.retrieve(session_id);

    // Verify the session belongs to the current user and payment was successful
    if (!session.user.id || stripeSession.metadata?.userId !== session.user.id.toString()) {
      return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 });
    }

    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Process payment and add credits atomically
    const credits = parseInt(stripeSession.metadata.credits);
    const amount = stripeSession.amount_total! / 100; // Convert from cents
    const packageId = stripeSession.metadata.packageId;

    if (typeof session.user.id !== 'number') {
      return NextResponse.json({ error: 'User ID is missing or invalid' }, { status: 400 });
    }

    const result = await processPaymentAndAddCredits(
      session_id,
      session.user.id,
      credits,
      amount,
      packageId
    );

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        credits: credits,
        package: packageId,
        alreadyProcessed: result.alreadyProcessed
      });
    } else {
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}