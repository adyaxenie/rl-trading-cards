import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import Stripe from 'stripe';
import { creditPackages, createTransaction } from '@/lib/database';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { packageId, successUrl, cancelUrl } = await request.json();

    if (!packageId || !creditPackages[packageId as keyof typeof creditPackages]) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const selectedPackage = creditPackages[packageId as keyof typeof creditPackages];
    const totalCredits = selectedPackage.credits + selectedPackage.bonus;

    // Create pending transaction in database
    if (typeof session.user.id !== 'number') {
      throw new Error('User ID is missing or invalid');
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.credits.toLocaleString()} credits${selectedPackage.bonus > 0 ? ` + ${selectedPackage.bonus.toLocaleString()} bonus credits` : ''}`,
            },
            unit_amount: selectedPackage.price * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id.toString(),
        packageId,
        credits: totalCredits.toString(),
        userEmail: session.user.email,
      },
    });

    await createTransaction(
      session.user.id,
      selectedPackage.price,
      totalCredits,
      packageId,
      checkoutSession.id,
      'pending'
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}