import { NextRequest, NextResponse } from 'next/server';
import { getPublicUserShowcase } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const showcaseData = await getPublicUserShowcase(userId);

    if (!showcaseData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: showcaseData.user,
      showcase: showcaseData.showcase,
      stats: showcaseData.stats
    });
  } catch (error) {
    console.error('Error fetching public showcase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase' },
      { status: 500 }
    );
  }
}