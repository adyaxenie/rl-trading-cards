import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserCredits, updateUserCredits, getUserByEmail, executeQuerySimple } from '@/lib/database'

const CREDITS_PER_HOUR = 10
const MAX_DAILY_CREDITS = 240 // 24 hours * 10 credits = 240 max per day
const HOURS_PER_DAY = 24

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user ID from email
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { credits } = await getUserCredits(user.id)
    
    // Get the LAST CREDITS CLAIM time, not last_credit_earn (which updates on other actions)
    const [lastClaimRows] = await executeQuerySimple(
      'SELECT last_daily_claim FROM users WHERE id = ?',
      [user.id]
    )
    
    const lastClaimDate = (lastClaimRows as any[])[0]?.last_daily_claim
    const lastClaim = lastClaimDate ? new Date(lastClaimDate) : new Date(0) // If never claimed, use epoch
    
    // Calculate available credits to claim
    const now = new Date()
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
    const isNewDay = hoursSinceLastClaim >= 24
    
    let availableCredits = 0
    if (isNewDay) {
      // Full 240 credits
      availableCredits = MAX_DAILY_CREDITS
    } else {
      // Only allow claiming if it's been at least 1 hour since last claim
      if (hoursSinceLastClaim >= 1) {
        availableCredits = Math.floor(hoursSinceLastClaim) * CREDITS_PER_HOUR
        availableCredits = Math.min(availableCredits, MAX_DAILY_CREDITS)
      }
    }
    
    // Timer calculation
    let timeUntilNext
    if (isNewDay || availableCredits > 0) {
      timeUntilNext = 0
    } else {
      // Time until next hour
      const minutesSinceLastHour = (hoursSinceLastClaim * 60) % 60
      timeUntilNext = Math.ceil((60 - minutesSinceLastHour) * 60)
    }

    return NextResponse.json({
      credits,
      lastClaim: lastClaim.toISOString(),
      availableCredits,
      maxDailyCredits: MAX_DAILY_CREDITS,
      timeUntilNext,
      isNewDay,
      hoursSinceLastClaim: Math.floor(hoursSinceLastClaim)
    })
  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user ID from email
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { credits } = await getUserCredits(user.id)
    
    // Get the LAST CREDITS CLAIM time
    const [lastClaimRows] = await executeQuerySimple(
      'SELECT last_daily_claim FROM users WHERE id = ?',
      [user.id]
    )
    
    const lastClaimDate = (lastClaimRows as any[])[0]?.last_daily_claim
    const lastClaim = lastClaimDate ? new Date(lastClaimDate) : new Date(0)
    
    // Calculate available credits to claim
    const now = new Date()
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60)
    const isNewDay = hoursSinceLastClaim >= 24
    
    let availableCredits = 0
    if (isNewDay) {
      // Full 240 credits
      availableCredits = MAX_DAILY_CREDITS
    } else {
      // Only allow claiming if it's been at least 1 hour since last claim
      if (hoursSinceLastClaim >= 1) {
        availableCredits = Math.floor(hoursSinceLastClaim) * CREDITS_PER_HOUR
        availableCredits = Math.min(availableCredits, MAX_DAILY_CREDITS)
      }
    }
    
    if (availableCredits > 0) {
      const newCredits = credits + availableCredits
      
      // Update both credits AND last_daily_claim (the credits claim timestamp)
      await executeQuerySimple(
        'UPDATE users SET credits = ?, last_daily_claim = ? WHERE id = ?',
        [newCredits, now.toISOString().slice(0, 19).replace('T', ' '), user.id]
      )
      
      return NextResponse.json({
        credits: newCredits,
        lastClaim: now.toISOString(),
        claimedCredits: availableCredits,
        message: `Claimed ${availableCredits} credits!`,
        timeUntilNext: 0
      })
    } else {
      // Calculate time until next credits are available
      let timeUntilNext
      if (hoursSinceLastClaim < 1) {
        // Time until next hour
        const minutesSinceLastHour = (hoursSinceLastClaim * 60) % 60
        timeUntilNext = Math.ceil((60 - minutesSinceLastHour) * 60)
      } else {
        // This shouldn't happen if logic is correct
        timeUntilNext = 3600 // 1 hour fallback
      }
      
      return NextResponse.json({
        credits,
        lastClaim: lastClaim.toISOString(),
        timeUntilNext,
        availableCredits: 0,
        error: 'No credits available to claim yet',
        message: `Next credits available in ${Math.ceil(timeUntilNext / 60)} minutes`
      }, { status: 429 })
    }
  } catch (error) {
    console.error('Error claiming credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}