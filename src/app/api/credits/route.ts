import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserCredits, updateUserCredits, getUserByEmail } from '@/lib/database'

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

    const { credits, last_credit_earn } = await getUserCredits(user.id)
    
    // Calculate available credits to claim
    const now = new Date()
    const lastEarned = new Date(last_credit_earn)
    
    // Reset daily limit if it's a new day (24 hours since last claim)
    const hoursSinceLastClaim = (now.getTime() - lastEarned.getTime()) / (1000 * 60 * 60)
    const isNewDay = hoursSinceLastClaim >= HOURS_PER_DAY
    
    let availableCredits = 0
    if (isNewDay) {
      // New day = full daily amount available
      availableCredits = MAX_DAILY_CREDITS
    } else {
      // Calculate how many credits should be available based on time passed
      const maxCreditsForTimePassed = Math.floor(hoursSinceLastClaim) * CREDITS_PER_HOUR
      availableCredits = Math.min(maxCreditsForTimePassed, MAX_DAILY_CREDITS)
    }
    
    // Time until next credit becomes available
    const minutesSinceLastHour = Math.floor(hoursSinceLastClaim * 60) % 60
    const timeUntilNextCredit = (60 - minutesSinceLastHour) * 60 // in seconds
    
    return NextResponse.json({
      credits,
      lastEarned: last_credit_earn,
      availableCredits,
      maxDailyCredits: MAX_DAILY_CREDITS,
      timeUntilNextCredit: availableCredits > 0 ? 0 : timeUntilNextCredit,
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

    const { credits, last_credit_earn } = await getUserCredits(user.id)
    
    // Calculate available credits to claim
    const now = new Date()
    const lastEarned = new Date(last_credit_earn)
    const hoursSinceLastClaim = (now.getTime() - lastEarned.getTime()) / (1000 * 60 * 60)
    
    let availableCredits = 0
    if (hoursSinceLastClaim >= HOURS_PER_DAY) {
      // New day = full daily amount available
      availableCredits = MAX_DAILY_CREDITS
    } else {
      // Calculate based on time passed
      const maxCreditsForTimePassed = Math.floor(hoursSinceLastClaim) * CREDITS_PER_HOUR
      availableCredits = Math.min(maxCreditsForTimePassed, MAX_DAILY_CREDITS)
    }
    
    if (availableCredits > 0) {
      const newCredits = credits + availableCredits
      await updateUserCredits(user.id, newCredits)
      
      return NextResponse.json({
        credits: newCredits,
        lastEarned: now,
        claimedCredits: availableCredits,
        message: `Claimed ${availableCredits} credits!`
      })
    } else {
      const minutesSinceLastHour = Math.floor(hoursSinceLastClaim * 60) % 60
      const timeUntilNext = (60 - minutesSinceLastHour) * 60
      
      return NextResponse.json({
        credits,
        lastEarned: last_credit_earn,
        timeUntilNext,
        availableCredits: 0,
        error: 'No credits available to claim'
      }, { status: 429 })
    }
  } catch (error) {
    console.error('Error claiming credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}