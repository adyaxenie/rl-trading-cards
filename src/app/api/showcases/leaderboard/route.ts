import { NextRequest, NextResponse } from 'next/server';
import { getShowcaseLeaderboard } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const sortBy = (url.searchParams.get('sortBy') as 'recent' | 'rating') || 'recent';

    const showcases = await getShowcaseLeaderboard(limit, sortBy);

    return NextResponse.json({
      success: true,
      showcases
    });
  } catch (error) {
    console.error('Error fetching showcase leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcases' },
      { status: 500 }
    );
  }
}