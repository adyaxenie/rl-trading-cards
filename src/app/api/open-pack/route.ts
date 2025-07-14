import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { 
  getUserByEmail, 
  getUserCredits, 
  updateUserCredits, 
  getRandomCards, 
  addCardsToUser, 
  recordPackOpening,
  getUserStats
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
      standard: 500,
      premium: 1000,
      ultimate: 2000
    }

    const cost = packCosts[packType as keyof typeof packCosts]

    // Check if user has enough credits
    const { credits } = await getUserCredits(user.id)
    if (credits < cost) {
      return NextResponse.json({ 
        error: `Not enough credits! You need ${cost} credits but only have ${credits}.` 
      }, { status: 400 })
    }

    // Get user stats for pack recommendation logic
    const userStats = await getUserStats(user.id)
    
    // Generate cards based on new balanced rates
    const cards = await getRandomCards(5, packType)

    // Deduct credits
    const newCredits = credits - cost
    await updateUserCredits(user.id, newCredits)

    // Add cards to user's collection
    await addCardsToUser(user.id, cards)

    // Record pack opening with proper capitalization
    const capitalizedPackType = packType.charAt(0).toUpperCase() + packType.slice(1)
    await recordPackOpening(user.id, cost, cards, capitalizedPackType)

    // Calculate pack opening stats
    const rarityCount = cards.reduce((acc, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for achievements/milestones
    const achievements = [];
    
    // First Super achievement
    if (rarityCount.Super > 0 && userStats.rarityBreakdown.Super === 0) {
      achievements.push({
        type: 'first_super',
        message: 'First Super Card!',
        bonus: 500
      });
    }
    
    // Super collection milestones
    const newSuperCount = (userStats.rarityBreakdown.Super || 0) + (rarityCount.Super || 0);
    if (newSuperCount === 5 && userStats.rarityBreakdown.Super < 5) {
      achievements.push({
        type: 'super_milestone',
        message: '5 Super Cards Collected!',
        bonus: 300
      });
    } else if (newSuperCount === 10 && userStats.rarityBreakdown.Super < 10) {
      achievements.push({
        type: 'super_milestone',
        message: '10 Super Cards Collected!',
        bonus: 500
      });
    } else if (newSuperCount === 15 && userStats.rarityBreakdown.Super < 15) {
      achievements.push({
        type: 'super_milestone',
        message: '15 Super Cards Collected!',
        bonus: 750
      });
    }

    // Pack opening milestones
    const newPackCount = userStats.totalPacks + 1;
    if (newPackCount === 5) {
      achievements.push({
        type: 'pack_milestone',
        message: '5 Packs Opened!',
        bonus: 200
      });
    } else if (newPackCount === 25) {
      achievements.push({
        type: 'pack_milestone',
        message: '25 Packs Opened!',
        bonus: 500
      });
    } else if (newPackCount === 100) {
      achievements.push({
        type: 'pack_milestone',
        message: '100 Packs Opened!',
        bonus: 1000
      });
    }

    // Apply achievement bonuses
    let bonusCredits = 0;
    for (const achievement of achievements) {
      bonusCredits += achievement.bonus;
    }

    let finalCredits = newCredits;
    if (bonusCredits > 0) {
      finalCredits = newCredits + bonusCredits;
      await updateUserCredits(user.id, finalCredits);
    }

    // Pack recommendation based on collection progress
    let recommendedPack = 'standard';
    if (userStats.superProgress.collected >= 15) {
      recommendedPack = 'ultimate';
    } else if (userStats.superProgress.collected >= 6) {
      recommendedPack = 'premium';
    }

    return NextResponse.json({
      success: true,
      cards,
      remainingCredits: finalCredits,
      packType,
      achievements,
      bonusCredits,
      stats: {
        rarityCount,
        superProgress: {
          ...userStats.superProgress,
          collected: userStats.superProgress.collected + (rarityCount.Super || 0)
        }
      },
      recommendation: {
        nextPack: recommendedPack,
        reason: userStats.superProgress.collected >= 15 
          ? "Try Ultimate packs to avoid duplicates"
          : userStats.superProgress.collected >= 6
          ? "Premium packs offer best Super hunting efficiency"
          : "Standard packs good for building collection"
      }
    })

  } catch (error) {
    console.error('Error opening pack:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}