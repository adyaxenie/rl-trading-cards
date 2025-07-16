// app/api/check-username/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database';
import profanityWords from '@/lib/words.json';

const containsProfanity = (username: string): boolean => {
  const lowerUsername = username.toLowerCase();
  
  // Check if username contains any profane words (case insensitive)
  return profanityWords.some((word: string) => lowerUsername.includes(word.toLowerCase()));
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username is required' }, { status: 400 });
  }

  // Validate username format
  if (username.length < 3 || username.length > 20) {
    return NextResponse.json({ available: false, reason: 'Invalid length' }, { status: 200 });
  }

  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json({ available: false, reason: 'Invalid characters' }, { status: 200 });
  }

  // Check for profanity
  if (containsProfanity(username)) {
    return NextResponse.json({ available: false, reason: 'Contains inappropriate content' }, { status: 200 });
  }

  try {
    const db = await getDb();
    const [rows] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    const users = rows as any[];
    const available = users.length === 0;

    return NextResponse.json({ 
      available, 
      reason: available ? null : 'Username already taken' 
    }, { status: 200 });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}