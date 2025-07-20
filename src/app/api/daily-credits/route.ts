// app/api/daily-credits/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { canClaimDailyCredits, claimDailyCredits, getUserByEmail } from '@/lib/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can claim daily credits
    const canClaim = await canClaimDailyCredits(user.id);
    
    // Calculate time until next claim (6 PM PT = 2 AM UTC next day)
    const now = new Date();
    const nextClaim = new Date();
    nextClaim.setUTCHours(2, 0, 0, 0); // 6 PM PT = 2 AM UTC
    
    if (now.getUTCHours() >= 2) {
      // If it's after 2 AM UTC today, next claim is tomorrow at 2 AM UTC
      nextClaim.setUTCDate(nextClaim.getUTCDate() + 1);
    }

    const timeUntilNext = Math.max(0, Math.floor((nextClaim.getTime() - now.getTime()) / 1000));

    return NextResponse.json({
      canClaim,
      timeUntilNext,
      nextClaimTime: nextClaim.toISOString()
    });
  } catch (error) {
    console.error('Daily credits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Claim daily credits
    const result = await claimDailyCredits(user.id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        credits: result.credits,
        newBalance: result.newBalance,
        message: `Claimed ${result.credits} daily credits!`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Daily credits API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}