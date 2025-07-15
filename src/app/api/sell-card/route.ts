import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserByEmail, sellCard } from '@/lib/database'

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

    // Call the database function to handle the sale
    const result = await sellCard(user.id, playerId, quantity)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      creditsEarned: result.creditsEarned,
      newBalance: result.newBalance,
      remainingQuantity: result.remainingQuantity
    })

  } catch (error) {
    console.error('Error in sell card API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}