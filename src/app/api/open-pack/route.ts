import { getUserCredits, updateUserCredits, getRandomCards, addCardsToUser, recordPackOpening } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const packType = body.packType || 'standard';
    
    const packCosts = {
      standard: 50,
      premium: 200
    };
    
    const packCost = packCosts[packType as keyof typeof packCosts] || 50;
    const userData = await getUserCredits();
    
    if (userData.credits < packCost) {
      return NextResponse.json({ error: 'Not enough credits' }, { status: 400 });
    }
    
    // Deduct credits
    const newCredits = userData.credits - packCost;
    await updateUserCredits(1, newCredits);
    
    // Get random cards based on pack type
    const cards = await getRandomCards(5, packType);
    
    // Add cards to user collection
    await addCardsToUser(1, cards);
    
    // Record pack opening
    const packTypeName = packType === 'premium' ? 'Premium' : 'Standard';
    await recordPackOpening(1, packCost, cards, packTypeName);
    
    return NextResponse.json({
      cards,
      remainingCredits: newCredits,
      packCost,
      packType
    });
  } catch (error) {
    console.error('Pack opening error:', error);
    return NextResponse.json({ error: 'Failed to open pack' }, { status: 500 });
  }
}