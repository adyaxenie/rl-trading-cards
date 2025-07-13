import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { 
  getUserByEmail, 
  getUserCredits, 
  updateUserCredits, 
  getRandomCards, 
  addCardsToUser, 
  recordPackOpening 
} from '@/lib/database'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { packType } = await request.json()
    
    if (!packType || !['standard', 'premium', 'ultimate'].includes(packType)) {
      return NextResponse.json({ error: 'Invalid pack type' }, { status: 400 })
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Define pack costs
    const packCosts = {
      standard: 50,
      premium: 200,
      ultimate: 500
    }

    const cost = packCosts[packType as keyof typeof packCosts]

    // Check if user has enough credits
    const { credits } = await getUserCredits(user.id)
    if (credits < cost) {
      return NextResponse.json({ 
        error: `Not enough credits! You need ${cost} credits but only have ${credits}.` 
      }, { status: 400 })
    }

    // Generate cards based on pack type
    let cards
    if (packType === 'ultimate') {
      // Ultimate pack: Guaranteed Super cards
      cards = await getRandomCards(5, 'ultimate')
    } else {
      cards = await getRandomCards(5, packType)
    }

    // Deduct credits
    const newCredits = credits - cost
    await updateUserCredits(user.id, newCredits)

    // Add cards to user's collection
    await addCardsToUser(user.id, cards)

    // Record pack opening
    await recordPackOpening(user.id, cost, cards, packType)

    return NextResponse.json({
      success: true,
      cards,
      remainingCredits: newCredits,
      packType
    })

  } catch (error) {
    console.error('Error opening pack:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}