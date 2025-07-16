// app/api/set-username/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions'; // Adjust path as needed
import { getDb } from '@/lib/database';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmedUsername = username.trim();

    // Validate username
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
    }

    const db = await getDb();

    // Check if username is already taken
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [trimmedUsername]
    );

    const existing = existingUsers as any[];
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // Update the user's username
    await db.execute(
      'UPDATE users SET username = ? WHERE email = ?',
      [trimmedUsername, session.user.email]
    );

    return NextResponse.json({ success: true, username: trimmedUsername }, { status: 200 });
  } catch (error) {
    console.error('Error setting username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}