import { NextRequest, NextResponse } from 'next/server';
import { getTopPackOpeners } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit') || '10';
    const limit = Math.min(parseInt(limitParam), 50);

    // Ensure we have a valid number
    if (isNaN(limit)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    const users = await getTopPackOpeners(limit);

    return NextResponse.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching packs leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}