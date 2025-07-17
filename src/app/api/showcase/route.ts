import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getUserShowcase, updateUserShowcase } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const showcase = await getUserShowcase(session.user.id);

    return NextResponse.json({ 
      success: true, 
      showcase 
    });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { showcase } = await request.json();

    // Validate showcase data
    if (!Array.isArray(showcase) || showcase.length > 3) {
      return NextResponse.json(
        { error: 'Invalid showcase data' },
        { status: 400 }
      );
    }

    // Validate positions
    const positions = showcase.map(item => item.position);
    const invalidPositions = positions.filter(pos => ![1, 2, 3].includes(pos));
    if (invalidPositions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid position values' },
        { status: 400 }
      );
    }

    // Check for duplicate positions
    const uniquePositions = new Set(positions);
    if (uniquePositions.size !== positions.length) {
      return NextResponse.json(
        { error: 'Duplicate positions not allowed' },
        { status: 400 }
      );
    }

    // Update showcase
    const showcaseData = showcase.map(item => ({
      playerId: item.player.id,
      position: item.position
    }));

    const result = await updateUserShowcase(session.user.id, showcaseData);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to update showcase' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating showcase:', error);
    return NextResponse.json(
      { error: 'Failed to update showcase' },
      { status: 500 }
    );
  }
}