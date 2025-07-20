// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getUserTasks, claimTaskReward, getUserByEmail, getUnclaimedTasksCount } from '@/lib/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's tasks
    const tasks = await getUserTasks(user.id);
    const unclaimedCount = await getUnclaimedTasksCount(user.id);
    
    return NextResponse.json({
      tasks,
      unclaimedCount
    });
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { userTaskId } = body;
    
    if (!userTaskId) {
      return NextResponse.json({ error: 'User task ID is required' }, { status: 400 });
    }

    const result = await claimTaskReward(user.id, userTaskId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        credits: result.credits,
        newBalance: result.newBalance,
        message: `Claimed ${result.credits} credits!`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Tasks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}