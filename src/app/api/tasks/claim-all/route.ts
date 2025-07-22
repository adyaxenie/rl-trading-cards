import { NextRequest, NextResponse } from 'next/server';
import { claimAllTaskRewards } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id; // Already a number from your session callback
    const result = await claimAllTaskRewards(userId);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('API Error claiming all tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}