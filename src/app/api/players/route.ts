import { getAllPlayers } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const players = await getAllPlayers();
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
  }
}