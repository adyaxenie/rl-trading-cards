import { getUserCredits, updateUserCredits, getRandomCards, addCardsToUser, recordPackOpening } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const packCost = 50;
    const userData = await getUserCredits();
    
    if (userData.credits < packCost) {
      return NextResponse.json({ error: 'Not enough credits' }, { status: 400 });
    }
    
    // Deduct credits
    const newCredits = userData.credits - packCost;
    await updateUserCredits(1, newCredits);
    
    // Get random cards
    const cards = await getRandomCards(5);
    
    // Add cards to user collection
    await addCardsToUser(1, cards);
    
    // Record pack opening
    await recordPackOpening(1, packCost, cards);
    
    return NextResponse.json({
      cards,
      remainingCredits: newCredits,
      packCost
    });
  } catch (error) {
    console.error('Pack opening error:', error);
    return NextResponse.json({ error: 'Failed to open pack' }, { status: 500 });
  }
}