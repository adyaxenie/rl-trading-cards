// app/api/showcases/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeQuerySimple } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit') || '10';
    const limit = Math.min(parseInt(limitParam), 50);
    const sortBy = (url.searchParams.get('sortBy') as 'recent' | 'rating') || 'recent';

    // Ensure we have a valid number
    if (isNaN(limit)) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    // Check if table exists
    const [tableCheck] = await executeQuerySimple("SHOW TABLES LIKE 'user_showcase'");
    const tableExists = (tableCheck as any[]).length > 0;
    
    if (!tableExists) {
      return NextResponse.json({
        success: true,
        showcases: []
      });
    }

    // Determine sort order
    let orderByClause = 'us.updated_at DESC';
    if (sortBy === 'rating') {
      orderByClause = 'p.overall_rating DESC';
    }

    // Get showcase data
    const [showcaseData] = await executeQuerySimple(`
      SELECT 
        us.user_id,
        us.player_id,
        us.position,
        u.username as user_name,
        p.id as player_table_id,
        p.name,
        p.team,
        p.region,
        p.defense,
        p.offense,
        p.mechanics,
        p.challenges,
        p.game_iq,
        p.team_sync,
        p.overall_rating,
        p.rarity,
        p.image_url,
        p.created_at as player_created_at
      FROM user_showcase us
      JOIN users u ON us.user_id = u.id
      JOIN players p ON us.player_id = p.id
      ORDER BY ${orderByClause}
      LIMIT ${limit * 3}
    `);

    const showcaseRows = showcaseData as any[];
    
    if (showcaseRows.length === 0) {
      return NextResponse.json({
        success: true,
        showcases: []
      });
    }

    // Group by user
    const userShowcases: { [userId: number]: any } = {};
    
    for (const row of showcaseRows) {
      if (!userShowcases[row.user_id]) {
        userShowcases[row.user_id] = {
          user: {
            id: row.user_id,
            name: row.user_name
          },
          showcase: []
        };
      }
      
      userShowcases[row.user_id].showcase.push({
        id: row.player_id,
        player: {
          id: row.player_table_id,
          name: row.name,
          team: row.team,
          region: row.region,
          defense: row.defense,
          offense: row.offense,
          mechanics: row.mechanics,
          challenges: row.challenges,
          game_iq: row.game_iq,
          team_sync: row.team_sync,
          overall_rating: row.overall_rating,
          rarity: row.rarity,
          image_url: row.image_url,
          created_at: row.player_created_at
        },
        position: row.position
      });
    }

    // Sort showcase positions and limit users
    const result = Object.values(userShowcases)
      .slice(0, limit)
      .map(userShowcase => ({
        ...userShowcase,
        showcase: userShowcase.showcase.sort((a: { position: number; }, b: { position: number; }) => a.position - b.position)
      }));

    return NextResponse.json({
      success: true,
      showcases: result
    });

  } catch (error) {
    console.error('Error fetching showcase leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcases' },
      { status: 500 }
    );
  }
}