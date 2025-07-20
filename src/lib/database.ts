import mysql from 'mysql2/promise';

// Updated database configuration with better connection management
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1212',
  database: process.env.DB_NAME || 'rltcg',
  waitForConnections: true,
  connectionLimit: 10,        // Increased back to 10
  queueLimit: 0,
  // Connection timeout settings
  acquireTimeout: 60000,      // 60 seconds to get connection
  timeout: 60000,             // 60 seconds query timeout
  idleTimeout: 300000,        // 5 minutes idle timeout
  maxIdle: 5,                 // Maximum idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Additional MySQL settings
  reconnect: true,
  multipleStatements: false,
};

let pool: mysql.Pool | null = null;

export async function getDb(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    
    // Add connection event listeners for debugging
    // pool.on('connection', (connection) => {
    //   console.log(`New connection established as id ${connection.threadId}`);
    // });
    
    // pool.on('acquire', (connection) => {
    //   console.log(`Connection ${connection.threadId} acquired`);
    // });
    
    // pool.on('release', (connection) => {
    //   console.log(`Connection ${connection.threadId} released`);
    // });
  }
  return pool;
}

// FIXED: Properly release connections in executeQuery
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<[T[], mysql.FieldPacket[]]> {
  const pool = await getDb();
  let connection: mysql.PoolConnection | null = null;
  
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(query, params);
    return result as [T[], mysql.FieldPacket[]];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  } finally {
    // CRITICAL: Always release the connection
    if (connection) {
      connection.release();
    }
  }
}

// Alternative: Use pool.execute directly (automatically handles connection release)
export async function executeQuerySimple<T = any>(
  query: string, 
  params: any[] = []
): Promise<[T[], mysql.FieldPacket[]]> {
  const pool = await getDb();
  try {
    const result = await pool.execute(query, params);
    return result as [T[], mysql.FieldPacket[]];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Add connection monitoring function
export async function getConnectionStats(): Promise<{
  activeConnections: number;
  freeConnections: number;
  totalConnections: number;
}> {
  const pool = await getDb();
  const poolStats = (pool as any).pool;
  
  return {
    activeConnections: poolStats._allConnections.length - poolStats._freeConnections.length,
    freeConnections: poolStats._freeConnections.length,
    totalConnections: poolStats._allConnections.length
  };
}

// Add a health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const [result] = await executeQuerySimple('SELECT 1 as health');
    return result.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Export interfaces (unchanged)
export interface Player {
  id: number;
  name: string;
  team: string;
  region: string;
  defense: number;
  offense: number;
  mechanics: number;
  challenges: number;
  game_iq: number;
  team_sync: number;
  overall_rating: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Super';
  image_url: string;
  created_at: Date;
}

export interface User {
  id: number;
  username: string;
  email: string;
  credits: number;
  last_credit_earn: Date;
  total_packs_opened: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserCard {
  id: number;
  user_id: number;
  player_id: number;
  quantity: number;
  first_obtained: Date;
  player: Player;
}

export async function getUserCredits(userId: number): Promise<{ credits: number; last_credit_earn: Date }> {
  try {
    const [rows] = await executeQuerySimple('SELECT credits, last_credit_earn FROM users WHERE id = ?', [userId]);
    const result = rows as any[];
    return result[0] || { credits: 100, last_credit_earn: new Date() };
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    throw error;
  }
}

export async function updateUserCredits(userId: number, newCredits: number): Promise<void> {
  try {
    await executeQuerySimple('UPDATE users SET credits = ?, last_credit_earn = NOW() WHERE id = ?', [newCredits, userId]);
  } catch (error) {
    console.error('Error in updateUserCredits:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [rows] = await executeQuerySimple('SELECT * FROM users WHERE email = ?', [email]);
    const result = rows as any[];
    return result[0] || null;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw error;
  }
}

export async function getAllPlayers(): Promise<Player[]> {
  try {
    const [rows] = await executeQuerySimple('SELECT * FROM players ORDER BY overall_rating DESC');
    return rows as Player[];
  } catch (error) {
    console.error('Error in getAllPlayers:', error);
    throw error;
  }
}

export async function getRandomCards(count: number = 5, packType: string = 'standard'): Promise<Player[]> {
  try {
    const [players] = await executeQuerySimple('SELECT * FROM players');
    const playersArray = players as Player[];
    
    // Separate players by rarity for better control
    const superPlayers = playersArray.filter(player => player.rarity === 'Super');
    const epicPlayers = playersArray.filter(player => player.rarity === 'Epic');
    const rarePlayers = playersArray.filter(player => player.rarity === 'Rare');
    const commonPlayers = playersArray.filter(player => player.rarity === 'Common');
    
    const selectedCards: Player[] = [];
    
    // Pack-specific rate implementation
    const packRates = {
      standard: { super: 1.5, epic: 8, rare: 28, common: 62.5 },
      premium: { super: 6, epic: 22, rare: 35, common: 37 },
      ultimate: { super: 15, epic: 40, rare: 35, common: 10 }
    };
    
    const rates = packRates[packType as keyof typeof packRates] || packRates.standard;
    
    for (let i = 0; i < count; i++) {
      const randomValue = Math.random() * 100;
      let selectedPlayer: Player;
      
      if (randomValue < rates.super) {
        // Super card
        if (superPlayers.length > 0) {
          selectedPlayer = superPlayers[Math.floor(Math.random() * superPlayers.length)];
        } else {
          // Fallback to Epic if no Supers available
          selectedPlayer = epicPlayers[Math.floor(Math.random() * epicPlayers.length)];
        }
      } else if (randomValue < rates.super + rates.epic) {
        // Epic card
        if (epicPlayers.length > 0) {
          selectedPlayer = epicPlayers[Math.floor(Math.random() * epicPlayers.length)];
        } else {
          // Fallback to Rare if no Epics available
          selectedPlayer = rarePlayers[Math.floor(Math.random() * rarePlayers.length)];
        }
      } else if (randomValue < rates.super + rates.epic + rates.rare) {
        // Rare card
        if (rarePlayers.length > 0) {
          selectedPlayer = rarePlayers[Math.floor(Math.random() * rarePlayers.length)];
        } else {
          // Fallback to Common if no Rares available
          selectedPlayer = commonPlayers[Math.floor(Math.random() * commonPlayers.length)];
        }
      } else {
        // Common card
        selectedPlayer = commonPlayers[Math.floor(Math.random() * commonPlayers.length)];
      }
      
      selectedCards.push(selectedPlayer);
    }
    
    return selectedCards;
  } catch (error) {
    console.error('Error in getRandomCards:', error);
    throw error;
  }
}

export async function getUserInventory(userId: number): Promise<UserCard[]> {
  try {
    const [rows] = await executeQuerySimple(`
      SELECT 
        uc.*,
        p.id as player_id,
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
      FROM user_cards uc
      JOIN players p ON uc.player_id = p.id
      WHERE uc.user_id = ?
      ORDER BY p.overall_rating DESC, uc.quantity DESC
    `, [userId]);
    
    const userCards = rows as any[];
    return userCards.map(row => ({
      id: row.id,
      user_id: row.user_id,
      player_id: row.player_id,
      quantity: row.quantity,
      first_obtained: row.first_obtained,
      player: {
        id: row.player_id,
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
        created_at: row.player_created_at,
      }
    }));
  } catch (error) {
    console.error('Error in getUserInventory:', error);
    throw error;
  }
}

export async function getUserStats(userId: number): Promise<{
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  rarityBreakdown: { [key: string]: number };
  superProgress: { collected: number; total: number; percentage: number };
}> {
  try {
    // Get total cards and unique cards
    const [cardStats] = await executeQuerySimple(`
      SELECT 
        SUM(quantity) as total_cards,
        COUNT(*) as unique_cards
      FROM user_cards 
      WHERE user_id = ?
    `, [userId]);
    
    // Get total packs opened
    const [userStats] = await executeQuerySimple(`
      SELECT total_packs_opened FROM users WHERE id = ?
    `, [userId]);
    
    // Get rarity breakdown
    const [rarityStats] = await executeQuerySimple(`
      SELECT 
        p.rarity,
        SUM(uc.quantity) as count
      FROM user_cards uc
      JOIN players p ON uc.player_id = p.id
      WHERE uc.user_id = ?
      GROUP BY p.rarity
    `, [userId]);
    
    // Get Super collection progress
    const [totalSupers] = await executeQuerySimple(`
      SELECT COUNT(*) as total FROM players WHERE rarity = 'Super'
    `);
    
    const [collectedSupers] = await executeQuerySimple(`
      SELECT COUNT(DISTINCT uc.player_id) as collected
      FROM user_cards uc
      JOIN players p ON uc.player_id = p.id
      WHERE uc.user_id = ? AND p.rarity = 'Super'
    `, [userId]);
    
    const cardStatsResult = cardStats as any[];
    const userStatsResult = userStats as any[];
    const rarityStatsResult = rarityStats as any[];
    const totalSupersResult = totalSupers as any[];
    const collectedSupersResult = collectedSupers as any[];
    
    const rarityBreakdown: { [key: string]: number } = {};
    rarityStatsResult.forEach((row: any) => {
      rarityBreakdown[row.rarity] = row.count;
    });
    
    const totalSuperCards = totalSupersResult[0]?.total || 24;
    const collectedSuperCards = collectedSupersResult[0]?.collected || 0;
    
    return {
      totalCards: cardStatsResult[0]?.total_cards || 0,
      uniqueCards: cardStatsResult[0]?.unique_cards || 0,
      totalPacks: userStatsResult[0]?.total_packs_opened || 0,
      rarityBreakdown,
      superProgress: {
        collected: collectedSuperCards,
        total: totalSuperCards,
        percentage: Math.round((collectedSuperCards / totalSuperCards) * 100)
      }
    };
  } catch (error) {
    console.error('Error in getUserStats:', error);
    throw error;
  }
}

export async function getUserSaleHistory(userId: number): Promise<{
  totalSold: number;
  totalCreditsEarned: number;
  recentSales: Array<{
    playerName: string;
    quantity: number;
    creditsEarned: number;
    saleDate: Date;
    rarity: string;
  }>;
}> {
  try {
    // Get total stats
    const [totalStats] = await executeQuerySimple(`
      SELECT 
        COALESCE(SUM(quantity_sold), 0) as total_sold,
        COALESCE(SUM(credits_earned), 0) as total_credits_earned
      FROM card_sales 
      WHERE user_id = ?
    `, [userId]);

    // Get recent sales (last 20)
    const [recentSales] = await executeQuerySimple(`
      SELECT 
        p.name as player_name,
        p.rarity,
        cs.quantity_sold,
        cs.credits_earned,
        cs.sale_date
      FROM card_sales cs
      JOIN players p ON cs.player_id = p.id
      WHERE cs.user_id = ?
      ORDER BY cs.sale_date DESC
      LIMIT 20
    `, [userId]);

    const totalStatsResult = totalStats as any[];
    const recentSalesResult = recentSales as any[];

    return {
      totalSold: totalStatsResult[0]?.total_sold || 0,
      totalCreditsEarned: totalStatsResult[0]?.total_credits_earned || 0,
      recentSales: recentSalesResult.map((sale: any) => ({
        playerName: sale.player_name,
        quantity: sale.quantity_sold,
        creditsEarned: sale.credits_earned,
        saleDate: sale.sale_date,
        rarity: sale.rarity
      }))
    };

  } catch (error) {
    console.error('Error getting sale history:', error);
    return {
      totalSold: 0,
      totalCreditsEarned: 0,
      recentSales: []
    };
  }
}

// Showcase interfaces
export interface ShowcasePlayer {
  id: number;
  player: Player;
  position: number;
}

export interface UserShowcaseData {
  user: {
    id: number;
    name: string;
  };
  showcase: ShowcasePlayer[];
  stats?: {
    uniqueCards: number;
    totalCards: number;
  };
}

// Update user's showcase
export async function updateUserShowcase(
  userId: number, 
  showcase: { playerId: number; position: number }[]
): Promise<{ success: boolean; error?: string }> {
  const pool = await getDb();
  let connection: mysql.PoolConnection | null = null;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Validate that user owns all the players they're trying to showcase
    if (showcase.length > 0) {
      const playerIds = showcase.map(item => item.playerId);
      const placeholders = playerIds.map(() => '?').join(',');
      
      const [userCards] = await connection.execute(`
        SELECT DISTINCT player_id 
        FROM user_cards 
        WHERE user_id = ? AND player_id IN (${placeholders})
      `, [userId, ...playerIds]);

      const ownedPlayerIds = (userCards as any[]).map(row => row.player_id);
      const unownedPlayers = playerIds.filter(id => !ownedPlayerIds.includes(id));
      
      if (unownedPlayers.length > 0) {
        await connection.rollback();
        return {
          success: false,
          error: 'You can only showcase players you own'
        };
      }
    }

    // Delete existing showcase items for this user
    await connection.execute(
      'DELETE FROM user_showcase WHERE user_id = ?',
      [userId]
    );

    // Insert new showcase items
    if (showcase.length > 0) {
      const insertPromises = showcase.map(item => 
        connection!.execute(
          'INSERT INTO user_showcase (user_id, player_id, position) VALUES (?, ?, ?)',
          [userId, item.playerId, item.position]
        )
      );
      
      await Promise.all(insertPromises);
    }

    await connection.commit();
    return { success: true };

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error in updateUserShowcase:', error);
    return {
      success: false,
      error: 'Failed to update showcase'
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
// Add these to the END of your existing lib/database.ts file

// Showcase interfaces
export interface ShowcasePlayer {
  id: number;
  player: Player;
  position: number;
}

export interface UserShowcaseData {
  user: {
    id: number;
    name: string;
  };
  showcase: ShowcasePlayer[];
  stats?: {
    uniqueCards: number;
    totalCards: number;
  };
}

// Get user's showcase
export async function getUserShowcase(userId: number): Promise<ShowcasePlayer[]> {
  try {
    // Ensure userId is a safe integer
    const userIdInt = parseInt(userId.toString());
    if (isNaN(userIdInt)) {
      throw new Error('Invalid user ID');
    }
    
    const [rows] = await executeQuerySimple(`
      SELECT 
        us.position,
        us.player_id,
        p.id,
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
        p.created_at
      FROM user_showcase us
      JOIN players p ON us.player_id = p.id
      WHERE us.user_id = ${userIdInt}
      ORDER BY us.position ASC
    `);

    const showcaseRows = rows as any[];
    return showcaseRows.map(row => ({
      id: row.player_id,
      player: {
        id: row.id,
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
        created_at: row.created_at,
      },
      position: row.position
    }));
  } catch (error) {
    console.error('Error in getUserShowcase:', error);
    throw error;
  }
}

// Get public showcase data for a user
export async function getPublicUserShowcase(userId: number): Promise<UserShowcaseData | null> {
  try {
    // Ensure userId is a safe integer
    const userIdInt = parseInt(userId.toString());
    if (isNaN(userIdInt)) {
      return null;
    }
    
    // Get user info
    const [userRows] = await executeQuerySimple(
      `SELECT id, username as name FROM users WHERE id = ${userIdInt}`
    );

    const user = (userRows as any[])[0];
    if (!user) {
      return null;
    }

    // Get showcase
    const showcase = await getUserShowcase(userIdInt);

    // Get basic stats
    const [statsRows] = await executeQuerySimple(`
      SELECT 
        COUNT(DISTINCT player_id) as unique_cards,
        COALESCE(SUM(quantity), 0) as total_cards
      FROM user_cards 
      WHERE user_id = ${userIdInt}
    `);

    const stats = (statsRows as any[])[0];

    return {
      user: {
        id: user.id,
        name: user.name
      },
      showcase,
      stats: {
        uniqueCards: stats?.unique_cards || 0,
        totalCards: stats?.total_cards || 0
      }
    };
  } catch (error) {
    console.error('Error in getPublicUserShowcase:', error);
    throw error;
  }
}

// Get showcase leaderboard
export async function getShowcaseLeaderboard(
  limit: number = 10,
  sortBy: 'recent' | 'rating' = 'recent'
): Promise<UserShowcaseData[]> {
  try {
    let orderByClause = 'us.updated_at DESC';
    if (sortBy === 'rating') {
      orderByClause = 'p.overall_rating DESC';
    }

    const [rows] = await executeQuerySimple(`
      SELECT DISTINCT
        u.id as user_id,
        u.username as user_name,
        us.position,
        us.player_id,
        p.id,
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
        p.created_at,
        us.updated_at
      FROM user_showcase us
      JOIN users u ON us.user_id = u.id
      JOIN players p ON us.player_id = p.id
      ORDER BY ${orderByClause}
      LIMIT ?
    `, [limit * 3]); // Get more rows since we'll group by user

    const showcaseRows = rows as any[];
    
    // Group by user
    const userShowcases: { [userId: number]: UserShowcaseData } = {};
    
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
          id: row.id,
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
          created_at: row.created_at,
        },
        position: row.position
      });
    }

    // Sort showcase positions and limit users
    const result = Object.values(userShowcases)
      .slice(0, limit)
      .map(userShowcase => ({
        ...userShowcase,
        showcase: userShowcase.showcase.sort((a, b) => a.position - b.position)
      }));

    return result;
  } catch (error) {
    console.error('Error in getShowcaseLeaderboard:', error);
    throw error;
  }
}
// Leaderboard interfaces
export interface LeaderboardUser {
  user: {
    id: number;
    name: string;
  };
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  averageRating: number;
  superCards: number;
}

// Get top collectors leaderboard
export async function getTopCollectors(limit: number = 10): Promise<LeaderboardUser[]> {
  try {
    // Ensure limit is a safe integer between 1 and 50
    const limitInt = Math.max(1, Math.min(parseInt(limit.toString()) || 10, 50));
    
    // Use string interpolation for LIMIT since it's validated
    const [rows] = await executeQuerySimple(`
      SELECT 
        u.id,
        u.username as name,
        COALESCE(SUM(uc.quantity), 0) as total_cards,
        COUNT(DISTINCT uc.player_id) as unique_cards,
        u.total_packs_opened,
        COALESCE(AVG(p.overall_rating), 0) as average_rating,
        COALESCE(SUM(CASE WHEN p.rarity = 'Super' THEN uc.quantity ELSE 0 END), 0) as super_cards
      FROM users u
      LEFT JOIN user_cards uc ON u.id = uc.user_id
      LEFT JOIN players p ON uc.player_id = p.id
      GROUP BY u.id, u.username, u.total_packs_opened
      HAVING total_cards > 0
      ORDER BY total_cards DESC, unique_cards DESC
      LIMIT ${limitInt}
    `);

    return (rows as any[]).map(row => ({
      user: {
        id: row.id,
        name: row.name
      },
      totalCards: row.total_cards,
      uniqueCards: row.unique_cards,
      totalPacks: row.total_packs_opened || 0,
      averageRating: parseFloat(row.average_rating) || 0,
      superCards: row.super_cards
    }));
  } catch (error) {
    console.error('Error in getTopCollectors:', error);
    throw error;
  }
}

// Get top pack openers leaderboard
export async function getTopPackOpeners(limit: number = 10): Promise<LeaderboardUser[]> {
  try {
    // Ensure limit is a safe integer between 1 and 50
    const limitInt = Math.max(1, Math.min(parseInt(limit.toString()) || 10, 50));
    
    // Use string interpolation for LIMIT since it's validated
    const [rows] = await executeQuerySimple(`
      SELECT 
        u.id,
        u.username as name,
        u.total_packs_opened,
        COALESCE(SUM(uc.quantity), 0) as total_cards,
        COUNT(DISTINCT uc.player_id) as unique_cards,
        COALESCE(SUM(CASE WHEN p.rarity = 'Super' THEN uc.quantity ELSE 0 END), 0) as super_cards
      FROM users u
      LEFT JOIN user_cards uc ON u.id = uc.user_id
      LEFT JOIN players p ON uc.player_id = p.id
      WHERE u.total_packs_opened > 0
      GROUP BY u.id, u.username, u.total_packs_opened
      ORDER BY u.total_packs_opened DESC, total_cards DESC
      LIMIT ${limitInt}
    `);

    return (rows as any[]).map(row => ({
      user: {
        id: row.id,
        name: row.name
      },
      totalPacks: row.total_packs_opened,
      totalCards: row.total_cards,
      uniqueCards: row.unique_cards,
      superCards: row.super_cards,
      averageRating: 0 // Not needed for this leaderboard
    }));
  } catch (error) {
    console.error('Error in getTopPackOpeners:', error);
    throw error;
  }
}

// Get super card collectors leaderboard
export async function getSuperCollectors(limit: number = 10): Promise<LeaderboardUser[]> {
  try {
    // Ensure limit is a safe integer between 1 and 50
    const limitInt = Math.max(1, Math.min(parseInt(limit.toString()) || 10, 50));
    
    // Use string interpolation for LIMIT since it's validated
    const [rows] = await executeQuerySimple(`
      SELECT 
        u.id,
        u.username as name,
        COALESCE(SUM(CASE WHEN p.rarity = 'Super' THEN uc.quantity ELSE 0 END), 0) as super_cards,
        COALESCE(SUM(uc.quantity), 0) as total_cards,
        COUNT(DISTINCT uc.player_id) as unique_cards,
        u.total_packs_opened
      FROM users u
      LEFT JOIN user_cards uc ON u.id = uc.user_id
      LEFT JOIN players p ON uc.player_id = p.id
      GROUP BY u.id, u.username, u.total_packs_opened
      HAVING super_cards > 0
      ORDER BY super_cards DESC, total_cards DESC
      LIMIT ${limitInt}
    `);

    return (rows as any[]).map(row => ({
      user: {
        id: row.id,
        name: row.name
      },
      superCards: row.super_cards,
      totalCards: row.total_cards,
      uniqueCards: row.unique_cards,
      totalPacks: row.total_packs_opened || 0,
      averageRating: 0 // Not needed for this leaderboard
    }));
  } catch (error) {
    console.error('Error in getSuperCollectors:', error);
    throw error;
  }
}

// Get user's rank in a specific leaderboard
export async function getUserRank(userId: number, leaderboardType: 'collectors' | 'packs' | 'supers'): Promise<number | null> {
  try {
    let query = '';
    
    switch (leaderboardType) {
      case 'collectors':
        query = `
          SELECT user_rank FROM (
            SELECT 
              u.id,
              ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(uc.quantity), 0) DESC, COUNT(DISTINCT uc.player_id) DESC) as user_rank
            FROM users u
            LEFT JOIN user_cards uc ON u.id = uc.user_id
            GROUP BY u.id
            HAVING COALESCE(SUM(uc.quantity), 0) > 0
          ) ranked_users
          WHERE id = ?
        `;
        break;
        
      case 'packs':
        query = `
          SELECT user_rank FROM (
            SELECT 
              id,
              ROW_NUMBER() OVER (ORDER BY total_packs_opened DESC) as user_rank
            FROM users
            WHERE total_packs_opened > 0
          ) ranked_users
          WHERE id = ?
        `;
        break;
        
      case 'supers':
        query = `
          SELECT user_rank FROM (
            SELECT 
              u.id,
              ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(CASE WHEN p.rarity = 'Super' THEN uc.quantity ELSE 0 END), 0) DESC) as user_rank
            FROM users u
            LEFT JOIN user_cards uc ON u.id = uc.user_id
            LEFT JOIN players p ON uc.player_id = p.id
            GROUP BY u.id
            HAVING COALESCE(SUM(CASE WHEN p.rarity = 'Super' THEN uc.quantity ELSE 0 END), 0) > 0
          ) ranked_users
          WHERE id = ?
        `;
        break;
        
      default:
        return null;
    }

    const [rows] = await executeQuerySimple(query, [userId]);
    const result = rows as any[];
    return result[0]?.user_rank || null;
  } catch (error) {
    console.error('Error in getUserRank:', error);
    return null;
  }
}

// Get comprehensive leaderboard data for a user (their stats across all categories)
export async function getUserLeaderboardStats(userId: number): Promise<{
  collectorRank: number | null;
  packRank: number | null;
  superRank: number | null;
  stats: {
    totalCards: number;
    uniqueCards: number;
    totalPacks: number;
    superCards: number;
    averageRating: number;
  };
} | null> {
  try {
    // Get user's stats
    const [statsRows] = await executeQuerySimple(`
      SELECT 
        u.total_packs_opened,
        COALESCE(SUM(uc.quantity), 0) as total_cards,
        COUNT(DISTINCT uc.player_id) as unique_cards,
        COALESCE(AVG(p.overall_rating), 0) as average_rating,
        COALESCE(SUM(CASE WHEN p.rarity = 'Super' THEN uc.quantity ELSE 0 END), 0) as super_cards
      FROM users u
      LEFT JOIN user_cards uc ON u.id = uc.user_id
      LEFT JOIN players p ON uc.player_id = p.id
      WHERE u.id = ?
      GROUP BY u.id, u.total_packs_opened
    `, [userId]);

    const stats = (statsRows as any[])[0];
    if (!stats) return null;

    // Get ranks in parallel
    const [collectorRank, packRank, superRank] = await Promise.all([
      getUserRank(userId, 'collectors'),
      getUserRank(userId, 'packs'),
      getUserRank(userId, 'supers')
    ]);

    return {
      collectorRank,
      packRank,
      superRank,
      stats: {
        totalCards: stats.total_cards,
        uniqueCards: stats.unique_cards,
        totalPacks: stats.total_packs_opened || 0,
        superCards: stats.super_cards,
        averageRating: parseFloat(stats.average_rating) || 0
      }
    };
  } catch (error) {
    console.error('Error in getUserLeaderboardStats:', error);
    return null;
  }
}

// Add these interfaces and functions to your database.ts file

export interface Task {
  id: number;
  title: string;
  description: string;
  task_type: 'collection' | 'packs' | 'cards' | 'selling' | 'rating' | 'showcase';
  target_value: number;
  reward_credits: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  is_repeatable: boolean;
  category: string;
  created_at: Date;
}

export interface UserTask {
  id: number;
  user_id: number;
  task_id: number;
  progress: number;
  completed: boolean;
  completed_at: Date | null;
  claimed: boolean;
  claimed_at: Date | null;
  task: Task;
}

export interface DailyClaim {
  id: number;
  user_id: number;
  claim_date: Date;
  credits_claimed: number;
  claimed_at: Date;
}

// Daily claims functions
export async function canClaimDailyCredits(userId: number): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const [rows] = await executeQuerySimple(
      'SELECT id FROM daily_claims WHERE user_id = ? AND claim_date = ?',
      [userId, today]
    );
    
    return (rows as any[]).length === 0;
  } catch (error) {
    console.error('Error checking daily claim eligibility:', error);
    return false;
  }
}

export async function claimDailyCredits(userId: number): Promise<{
  success: boolean;
  credits: number;
  newBalance: number;
  error?: string;
}> {
  const pool = await getDb();
  let connection: mysql.PoolConnection | null = null;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const today = new Date().toISOString().split('T')[0];
    
    // Check if already claimed today
    const [existingClaim] = await connection.execute(
      'SELECT id FROM daily_claims WHERE user_id = ? AND claim_date = ?',
      [userId, today]
    );

    if ((existingClaim as any[]).length > 0) {
      await connection.rollback();
      return {
        success: false,
        credits: 0,
        newBalance: 0,
        error: 'Already claimed today'
      };
    }

    const dailyCredits = 250;

    // Get current credits
    const [userCredits] = await connection.execute(
      'SELECT credits FROM users WHERE id = ?',
      [userId]
    );
    
    const currentCredits = (userCredits as any[])[0]?.credits || 0;
    const newCredits = currentCredits + dailyCredits;

    // Update user credits
    await connection.execute(
      'UPDATE users SET credits = ?, last_daily_claim = ? WHERE id = ?',
      [newCredits, today, userId]
    );

    // Record the daily claim
    await connection.execute(
      'INSERT INTO daily_claims (user_id, claim_date, credits_claimed) VALUES (?, ?, ?)',
      [userId, today, dailyCredits]
    );

    await connection.commit();

    return {
      success: true,
      credits: dailyCredits,
      newBalance: newCredits
    };

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error claiming daily credits:', error);
    return {
      success: false,
      credits: 0,
      newBalance: 0,
      error: 'Failed to claim daily credits'
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Task functions
export async function getUserTasks(userId: number): Promise<UserTask[]> {
  try {
    // First check if user has any tasks
    const [existingTasks] = await executeQuerySimple(
      'SELECT COUNT(*) as count FROM user_tasks WHERE user_id = ?',
      [userId]
    );

    const taskCount = (existingTasks as any[])[0]?.count || 0;

    // If no tasks exist, initialize them
    if (taskCount === 0) {
      console.log(`Initializing tasks for user ${userId}`);
      await initializeUserTasks(userId);
    }

    // Now get the tasks
    const [rows] = await executeQuerySimple(`
      SELECT 
        ut.*,
        t.title,
        t.description,
        t.task_type,
        t.target_value,
        t.reward_credits,
        t.difficulty,
        t.is_repeatable,
        t.category,
        t.created_at as task_created_at
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.user_id = ?
      ORDER BY 
        ut.completed ASC,
        ut.claimed ASC,
        t.difficulty ASC,
        t.created_at ASC
    `, [userId]);

    return (rows as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      task_id: row.task_id,
      progress: row.progress,
      completed: row.completed,
      completed_at: row.completed_at,
      claimed: row.claimed,
      claimed_at: row.claimed_at,
      task: {
        id: row.task_id,
        title: row.title,
        description: row.description,
        task_type: row.task_type,
        target_value: row.target_value,
        reward_credits: row.reward_credits,
        difficulty: row.difficulty,
        is_repeatable: row.is_repeatable,
        category: row.category,
        created_at: row.task_created_at
      }
    }));
  } catch (error) {
    console.error('Error getting user tasks:', error);
    return [];
  }
}

export async function initializeUserTasks(userId: number): Promise<void> {
  try {
    // Get all non-repeatable tasks
    const [allTasks] = await executeQuerySimple(
      'SELECT id FROM tasks WHERE is_repeatable = FALSE'
    );

    const tasks = allTasks as any[];
    
    // Insert user_tasks entries for all tasks
    for (const task of tasks) {
      await executeQuerySimple(`
        INSERT IGNORE INTO user_tasks (user_id, task_id, progress) 
        VALUES (?, ?, 0)
      `, [userId, task.id]);
    }
  } catch (error) {
    console.error('Error initializing user tasks:', error);
  }
}

export async function updateTaskProgress(
  userId: number, 
  taskType: string, 
  increment: number = 1
): Promise<void> {
  try {
    // Update all non-completed tasks of this type
    await executeQuerySimple(`
      UPDATE user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      SET ut.progress = LEAST(ut.progress + ?, t.target_value),
          ut.completed = CASE 
            WHEN ut.progress + ? >= t.target_value THEN TRUE 
            ELSE ut.completed 
          END,
          ut.completed_at = CASE 
            WHEN ut.progress + ? >= t.target_value AND ut.completed = FALSE THEN NOW() 
            ELSE ut.completed_at 
          END,
          ut.updated_at = NOW()
      WHERE ut.user_id = ? 
        AND t.task_type = ? 
        AND ut.completed = FALSE
    `, [increment, increment, increment, userId, taskType]);

    // Handle repeatable daily tasks
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user has today's daily tasks
    const [dailyTasks] = await executeQuerySimple(`
      SELECT t.id FROM tasks t
      WHERE t.task_type = ? AND t.is_repeatable = TRUE AND t.category = 'daily'
    `, [taskType]);

    for (const task of dailyTasks as any[]) {
      // Check if user has this daily task for today
      const [existingDaily] = await executeQuerySimple(`
        SELECT id FROM user_tasks 
        WHERE user_id = ? AND task_id = ? AND DATE(created_at) = ?
      `, [userId, task.id, today]);

      if ((existingDaily as any[]).length === 0) {
        // Create today's daily task
        await executeQuerySimple(`
          INSERT INTO user_tasks (user_id, task_id, progress) 
          VALUES (?, ?, 0)
        `, [userId, task.id]);
      }

      // Update progress
      await executeQuerySimple(`
        UPDATE user_tasks ut
        JOIN tasks t ON ut.task_id = t.id
        SET ut.progress = LEAST(ut.progress + ?, t.target_value),
            ut.completed = CASE 
              WHEN ut.progress + ? >= t.target_value THEN TRUE 
              ELSE ut.completed 
            END,
            ut.completed_at = CASE 
              WHEN ut.progress + ? >= t.target_value AND ut.completed = FALSE THEN NOW() 
              ELSE ut.completed_at 
            END,
            ut.updated_at = NOW()
        WHERE ut.user_id = ? 
          AND ut.task_id = ?
          AND DATE(ut.created_at) = ?
          AND ut.completed = FALSE
      `, [increment, increment, increment, userId, task.id, today]);
    }
  } catch (error) {
    console.error('Error updating task progress:', error);
  }
}

export async function claimTaskReward(userId: number, userTaskId: number): Promise<{
  success: boolean;
  credits: number;
  newBalance: number;
  error?: string;
}> {
  const pool = await getDb();
  let connection: mysql.PoolConnection | null = null;
  
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get the user task and verify it's completed and not claimed
    const [taskRows] = await connection.execute(`
      SELECT ut.*, t.reward_credits, t.title
      FROM user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      WHERE ut.id = ? AND ut.user_id = ? AND ut.completed = TRUE AND ut.claimed = FALSE
    `, [userTaskId, userId]);

    const userTask = (taskRows as any[])[0];
    if (!userTask) {
      await connection.rollback();
      return {
        success: false,
        credits: 0,
        newBalance: 0,
        error: 'Task not found or already claimed'
      };
    }

    // Get current credits
    const [userCredits] = await connection.execute(
      'SELECT credits FROM users WHERE id = ?',
      [userId]
    );
    
    const currentCredits = (userCredits as any[])[0]?.credits || 0;
    const newCredits = currentCredits + userTask.reward_credits;

    // Update user credits
    await connection.execute(
      'UPDATE users SET credits = ? WHERE id = ?',
      [newCredits, userId]
    );

    // Mark task as claimed
    await connection.execute(
      'UPDATE user_tasks SET claimed = TRUE, claimed_at = NOW() WHERE id = ?',
      [userTaskId]
    );

    // Record task completion
    await connection.execute(
      'INSERT INTO task_completions (user_id, task_id, credits_earned) VALUES (?, ?, ?)',
      [userId, userTask.task_id, userTask.reward_credits]
    );

    await connection.commit();

    return {
      success: true,
      credits: userTask.reward_credits,
      newBalance: newCredits
    };

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error claiming task reward:', error);
    return {
      success: false,
      credits: 0,
      newBalance: 0,
      error: 'Failed to claim task reward'
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function getUnclaimedTasksCount(userId: number): Promise<number> {
  try {
    const [rows] = await executeQuerySimple(
      'SELECT COUNT(*) as count FROM user_tasks WHERE user_id = ? AND completed = TRUE AND claimed = FALSE',
      [userId]
    );
    
    return (rows as any[])[0]?.count || 0;
  } catch (error) {
    console.error('Error getting unclaimed tasks count:', error);
    return 0;
  }
}


// Update existing functions to trigger task progress

// Override the existing recordPackOpening function
export async function recordPackOpening(userId: number, creditsSpent: number, cards: Player[], packType: string = 'Standard'): Promise<void> {
  try {
    await executeQuerySimple(`
      INSERT INTO pack_openings (user_id, pack_type, credits_spent, cards_obtained) 
      VALUES (?, ?, ?, ?)
    `, [userId, packType, creditsSpent, JSON.stringify(cards.map(c => c.id))]);
    
    // Update total packs opened
    await executeQuerySimple(`
      UPDATE users SET total_packs_opened = total_packs_opened + 1 WHERE id = ?
    `, [userId]);

    // Update task progress
    await updateTaskProgress(userId, 'packs', 1);
  } catch (error) {
    console.error('Error in recordPackOpening:', error);
    throw error;
  }
}

// Override the existing addCardsToUser function
export async function addCardsToUser(userId: number, cards: Player[]): Promise<void> {
  try {
    const cardCounts: { [rarity: string]: number } = {};
    
    for (const card of cards) {
      await executeQuerySimple(`
        INSERT INTO user_cards (user_id, player_id, quantity) 
        VALUES (?, ?, 1) 
        ON DUPLICATE KEY UPDATE quantity = quantity + 1
      `, [userId, card.id]);

      // Count cards by rarity for task progress
      cardCounts[card.rarity] = (cardCounts[card.rarity] || 0) + 1;
    }

    // Update collection task progress
    const [uniqueCards] = await executeQuerySimple(
      'SELECT COUNT(DISTINCT player_id) as count FROM user_cards WHERE user_id = ?',
      [userId]
    );
    
    const uniqueCardCount = (uniqueCards as any[])[0]?.count || 0;
    
    // Update collection progress to current total
    await executeQuerySimple(`
      UPDATE user_tasks ut
      JOIN tasks t ON ut.task_id = t.id
      SET ut.progress = LEAST(?, t.target_value),
          ut.completed = CASE 
            WHEN ? >= t.target_value THEN TRUE 
            ELSE ut.completed 
          END,
          ut.completed_at = CASE 
            WHEN ? >= t.target_value AND ut.completed = FALSE THEN NOW() 
            ELSE ut.completed_at 
          END,
          ut.updated_at = NOW()
      WHERE ut.user_id = ? 
        AND t.task_type = 'collection'
        AND ut.completed = FALSE
    `, [uniqueCardCount, uniqueCardCount, uniqueCardCount, userId]);

    // Update card-specific tasks
    for (const [rarity, count] of Object.entries(cardCounts)) {
      if (rarity === 'Rare' || rarity === 'Epic' || rarity === 'Super') {
        await updateTaskProgress(userId, 'cards', count);
      }
    }
  } catch (error) {
    console.error('Error in addCardsToUser:', error);
    throw error;
  }
}

// Update the existing createUser function to initialize tasks
export async function createUser(name: string, email: string): Promise<User> {
  try {
    const [result] = await executeQuerySimple(`
      INSERT INTO users (username, email, credits, last_credit_earn, total_packs_opened)
      VALUES (?, ?, 3500, NOW(), 0)
    `, [name, email]);
    
    const insertResult = result as any;
    const userId = insertResult.insertId;
    
    // Initialize user tasks
    await initializeUserTasks(userId);
    
    const [newUser] = await executeQuerySimple('SELECT * FROM users WHERE id = ?', [userId]);
    return (newUser as any[])[0];
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

// Update the sellCard function to include task progress
export async function sellCard(userId: number, playerId: number, quantity: number): Promise<{
  success: boolean;
  creditsEarned: number;
  newBalance: number;
  remainingQuantity: number;
  error?: string;
}> {
  const pool = await getDb();
  let connection: mysql.PoolConnection | null = null;
  
  const baseSellValues = {
    'Super': 500,    // Increased from 250
    'Epic': 150,     // Increased from 75
    'Rare': 60,      // Increased from 30
    'Common': 25     // Increased from 12
  };

  function calculateSellValue(rarity: keyof typeof baseSellValues, overallRating: number): number {
    const baseValue = baseSellValues[rarity];
    let multiplier = 1.0;
    
    if (overallRating >= 95) multiplier = 2.0;
    else if (overallRating >= 90) multiplier = 1.75;
    else if (overallRating >= 85) multiplier = 1.5;
    else if (overallRating >= 80) multiplier = 1.25;
    else if (overallRating >= 75) multiplier = 1.1;
    
    return Math.floor(baseValue * multiplier);
  }

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user owns this card and has enough quantity
    const [userCardRows] = await connection.execute(`
      SELECT uc.quantity, p.rarity, p.name, p.overall_rating
      FROM user_cards uc
      JOIN players p ON uc.player_id = p.id
      WHERE uc.user_id = ? AND uc.player_id = ?
    `, [userId, playerId]);

    const userCard = (userCardRows as any[])[0];
    
    if (!userCard) {
      await connection.rollback();
      return { 
        success: false, 
        creditsEarned: 0, 
        newBalance: 0, 
        remainingQuantity: 0,
        error: 'Card not found in collection' 
      };
    }

    if (userCard.quantity < quantity) {
      await connection.rollback();
      return { 
        success: false, 
        creditsEarned: 0, 
        newBalance: 0, 
        remainingQuantity: userCard.quantity,
        error: `You only have ${userCard.quantity} copies of this card` 
      };
    }

    // Calculate credits to award
    const sellValue = calculateSellValue(userCard.rarity, userCard.overall_rating);
    const totalCredits = sellValue * quantity;
    const remainingQuantity = userCard.quantity - quantity;

    // Update or remove cards from user's collection
    if (remainingQuantity <= 0) {
      await connection.execute(`
        DELETE FROM user_cards 
        WHERE user_id = ? AND player_id = ?
      `, [userId, playerId]);
    } else {
      await connection.execute(`
        UPDATE user_cards 
        SET quantity = ? 
        WHERE user_id = ? AND player_id = ?
      `, [remainingQuantity, userId, playerId]);
    }

    // Get current credits
    const [creditRows] = await connection.execute('SELECT credits FROM users WHERE id = ?', [userId]);
    const currentCredits = (creditRows as any[])[0]?.credits || 0;
    const newCredits = currentCredits + totalCredits;
    
    // Update user credits
    await connection.execute('UPDATE users SET credits = ?, last_credit_earn = NOW() WHERE id = ?', [newCredits, userId]);

    // Record the transaction
    await connection.execute(`
      INSERT INTO card_sales (user_id, player_id, quantity_sold, credits_earned, sale_date)
      VALUES (?, ?, ?, ?, NOW())
    `, [userId, playerId, quantity, totalCredits]);

    // Commit transaction
    await connection.commit();

    // Update task progress (outside transaction to avoid deadlock)
    await updateTaskProgress(userId, 'selling', quantity);

    return {
      success: true,
      creditsEarned: totalCredits,
      newBalance: newCredits,
      remainingQuantity: Math.max(0, remainingQuantity)
    };

  } catch (error) {
    // Rollback on error
    if (connection) {
      await connection.rollback();
    }
    console.error('Error in sellCard:', error);
    return { 
      success: false, 
      creditsEarned: 0, 
      newBalance: 0, 
      remainingQuantity: 0,
      error: 'Failed to sell card' 
    };
  } finally {
    // CRITICAL: Always release the connection
    if (connection) {
      connection.release();
    }
  }
}
