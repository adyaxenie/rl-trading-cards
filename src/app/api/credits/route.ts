import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserCredits, updateUserCredits, getUserByEmail, executeQuerySimple } from '@/lib/database'

const DAILY_CREDITS = 240
const RESET_HOUR_UTC = 8 // 8 AM UTC = 12 AM PT

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { credits } = await getUserCredits(user.id)
    
    // Get last daily claim date - first ensure the column exists
    let lastClaimDate = null
    try {
      const [lastClaimRows] = await executeQuerySimple(
        'SELECT last_daily_claim FROM users WHERE id = ?',
        [user.id]
      )
      lastClaimDate = (lastClaimRows as any[])[0]?.last_daily_claim
    } catch (error) {
      console.log('last_daily_claim column does not exist, user can claim')
      // Column doesn't exist, so user can claim
    }
    
    // Check if user can claim today
    const canClaim = canClaimToday(lastClaimDate)
    const timeUntilNext = getTimeUntilNextReset()

    return NextResponse.json({
      credits,
      canClaim,
      dailyCredits: DAILY_CREDITS,
      timeUntilNext,
      lastClaim: lastClaimDate,
      nextResetTime: getNextResetTime().toISOString()
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
    const user = await getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { credits } = await getUserCredits(user.id)
    
    // Get last daily claim date
    let lastClaimDate = null
    try {
      const [lastClaimRows] = await executeQuerySimple(
        'SELECT last_daily_claim FROM users WHERE id = ?',
        [user.id]
      )
      lastClaimDate = (lastClaimRows as any[])[0]?.last_daily_claim
    } catch (error) {
      console.log('last_daily_claim column does not exist, will create it')
    }
    
    // Check if user can claim today
    if (!canClaimToday(lastClaimDate)) {
      const timeUntilNext = getTimeUntilNextReset()
      return NextResponse.json({
        credits,
        timeUntilNext,
        canClaim: false,
        error: 'Already claimed today',
        message: `Next claim available in ${Math.ceil(timeUntilNext / 3600)} hours`
      }, { status: 429 })
    }
    
    // Claim daily credits
    const newCredits = credits + DAILY_CREDITS
    const today = getCurrentDateString()
    
    // Update credits and last claim date - handle missing column gracefully
    try {
      await executeQuerySimple(
        'UPDATE users SET credits = ?, last_daily_claim = ? WHERE id = ?',
        [newCredits, today, user.id]
      )
    } catch (error) {
      // If column doesn't exist, add it first
      console.log('Adding last_daily_claim column...')
      try {
        await executeQuerySimple('ALTER TABLE users ADD COLUMN last_daily_claim DATE NULL')
        await executeQuerySimple(
          'UPDATE users SET credits = ?, last_daily_claim = ? WHERE id = ?',
          [newCredits, today, user.id]
        )
      } catch (alterError) {
        console.error('Could not add column:', alterError)
        // Fallback: just update credits without tracking date
        await executeQuerySimple('UPDATE users SET credits = ? WHERE id = ?', [newCredits, user.id])
      }
    }
    
    return NextResponse.json({
      credits: newCredits,
      claimedCredits: DAILY_CREDITS,
      message: `Claimed ${DAILY_CREDITS} daily credits!`,
      canClaim: false,
      timeUntilNext: getTimeUntilNextReset()
    })
  } catch (error) {
    console.error('Error claiming credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function canClaimToday(lastClaimDate: string | null): boolean {
  if (!lastClaimDate) return true // Never claimed before
  
  const today = getCurrentDateString()
  const lastClaim = new Date(lastClaimDate).toISOString().slice(0, 10)
  
  console.log('Claim check:', { today, lastClaim, canClaim: lastClaim !== today })
  return lastClaim !== today
}

function getCurrentDateString(): string {
  const now = new Date()
  
  // If it's before reset hour UTC, consider it yesterday for claiming purposes
  if (now.getUTCHours() < RESET_HOUR_UTC) {
    now.setUTCDate(now.getUTCDate() - 1)
  }
  
  return now.toISOString().slice(0, 10) // YYYY-MM-DD format
}

function getNextResetTime(): Date {
  const now = new Date()
  const nextReset = new Date()
  
  // Set to reset hour today
  nextReset.setUTCHours(RESET_HOUR_UTC, 0, 0, 0)
  
  // If reset time has passed today, move to tomorrow
  if (now >= nextReset) {
    nextReset.setUTCDate(nextReset.getUTCDate() + 1)
  }
  
  return nextReset
}

function getTimeUntilNextReset(): number {
  const now = new Date()
  const nextReset = getNextResetTime()
  return Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / 1000))
}