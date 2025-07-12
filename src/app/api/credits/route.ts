import { getUserCredits, updateUserCredits } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const userData = await getUserCredits();
    return NextResponse.json({
      credits: userData.credits,
      lastEarned: userData.last_credit_earn
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const userData = await getUserCredits();
    const now = new Date();
    const lastEarned = new Date(userData.last_credit_earn);
    const hoursSinceLastEarn = (now.getTime() - lastEarned.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastEarn >= 1) {
      const newCredits = userData.credits + 10;
      await updateUserCredits(1, newCredits);
      
      return NextResponse.json({
        credits: newCredits,
        earned: 10
      });
    } else {
      return NextResponse.json({
        credits: userData.credits,
        earned: 0,
        timeUntilNext: 3600 - (hoursSinceLastEarn * 3600)
      });
    }
  } catch (error) {
    console.error('Error earning credits:', error);
    return NextResponse.json({ error: 'Failed to earn credits' }, { status: 500 });
  }
}