import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserCredits, updateUserCredits, getUserByEmail } from '@/lib/database'

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
    
    return NextResponse.json({
      credits,
      lastEarned: last_credit_earn
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
    
    // Check if user can earn credits (1 hour cooldown)
    const now = new Date()
    const lastEarned = new Date(last_credit_earn)
    const hoursSinceLastEarn = (now.getTime() - lastEarned.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceLastEarn >= 1) {
      const newCredits = credits + 10
      await updateUserCredits(user.id, newCredits)
      
      return NextResponse.json({
        credits: newCredits,
        lastEarned: now
      })
    } else {
      return NextResponse.json({
        credits,
        lastEarned: last_credit_earn,
        error: 'Credits not ready yet'
      }, { status: 429 })
    }
  } catch (error) {
    console.error('Error earning credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}