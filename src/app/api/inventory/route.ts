import { getUserInventory, getUserStats } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [inventory, stats] = await Promise.all([
      getUserInventory(1),
      getUserStats(1)
    ]);
    
    return NextResponse.json({
      inventory,
      stats
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}