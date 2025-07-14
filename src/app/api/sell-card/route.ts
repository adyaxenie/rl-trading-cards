import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { 
  getUserByEmail, 
  getUserCredits,
  updateUserCredits,
  getDb
} from '@/lib/database'

// Simple sell values based on OVR
const baseSellValues = {
  'Super': 250,
  'Epic': 75,
  'Rare': 30,
  'Common': 12
};

function calculateSellValue(rarity: keyof typeof baseSellValues, overallRating: number): number {
  const baseValue = baseSellValues[rarity];
  let multiplier = 1.0;
  
  if (overallRating >= 95) multiplier = 2.0;
  else if (overallRating >= 90) multiplier = 1.75;
  else if (overallRating >= 85) multiplier = 1.5;
  else if (overallRating >= 80) multiplier = 1.25;
  else if (overallRating >= 75) multiplier = 1.1;
  
  return Math.floor(baseValue * multiplier);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { playerId, quantity } = await request.json()
    
    if (!playerId || !quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const db = await getDb();

    // Check user's card
    const [userCardRows] = await db.execute(`
      SELECT uc.quantity, p.rarity, p.name, p.overall_rating
      FROM user_cards uc
      JOIN players p ON uc.player_id = p.id
      WHERE uc.user_id = ? AND uc.player_id = ?
    `, [user.id, playerId]);

    const userCard = (userCardRows as any[])[0];
    
    if (!userCard) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    if (userCard.quantity <= quantity) {
      return NextResponse.json({ 
        error: 'Cannot sell all copies. Keep at least 1!' 
      }, { status: 400 })
    }

    // Calculate credits
    const sellValue = calculateSellValue(userCard.rarity, userCard.overall_rating);
    const totalCredits = sellValue * quantity;

    // Update card quantity
    await db.execute(`
      UPDATE user_cards 
      SET quantity = quantity - ? 
      WHERE user_id = ? AND player_id = ?
    `, [quantity, user.id, playerId]);

    // Add credits to user
    const { credits: currentCredits } = await getUserCredits(user.id);
    const newCredits = currentCredits + totalCredits;
    await updateUserCredits(user.id, newCredits);

    return NextResponse.json({
      success: true,
      creditsEarned: totalCredits,
      newBalance: newCredits
    });

  } catch (error) {
    console.error('Error selling card:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}