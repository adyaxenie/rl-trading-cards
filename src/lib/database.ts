import mysql from 'mysql2/promise';

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

// Updated database configuration with valid MySQL2 options
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1212',
  database: process.env.DB_NAME || 'rltcg',
  waitForConnections: true,
  connectionLimit: 5,        // Reduced from 10 to 5 for development
  queueLimit: 0,
  // Valid MySQL2 pool options only
  idleTimeout: 300000,       // 5 minutes idle timeout (valid)
  maxIdle: 5,                // Maximum idle connections (valid)
  enableKeepAlive: true,     // Keep connections alive
  keepAliveInitialDelay: 0,  // Initial delay for keep alive
};

let pool: mysql.Pool | null = null;

export async function getDb(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    
    // Add connection event listeners for debugging
    pool.on('connection', (connection) => {
      console.log(`New connection established as id ${connection.threadId}`);
    });
    
    // Removed unsupported 'error' event listener for promise pool
  }
  return pool;
}

// Add a function to close connections gracefully
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Wrapper function to ensure connections are properly handled
export async function executeQuery<T = any>(
  query: string, 
  params: any[] = []
): Promise<[T[], mysql.FieldPacket[]]> {
  const db = await getDb();
  try {
    const result = await db.execute(query, params);
    return result as [T[], mysql.FieldPacket[]];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Create new user with first-time bonus (2500 credits for opening loop)
export async function createUser(name: string, email: string): Promise<User> {
  try {
    const [result] = await executeQuery(`
      INSERT INTO users (username, email, credits, last_credit_earn, total_packs_opened)
      VALUES (?, ?, 2500, NOW(), 0)
    `, [name, email]);
    
    const insertResult = result as any;
    const userId = insertResult.insertId;
    
    const [newUser] = await executeQuery('SELECT * FROM users WHERE id = ?', [userId]);
    return (newUser as any[])[0];
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

// Updated to work with authenticated users
export async function getUserCredits(userId: number): Promise<{ credits: number; last_credit_earn: Date }> {
  try {
    const [rows] = await executeQuery('SELECT credits, last_credit_earn FROM users WHERE id = ?', [userId]);
    const result = rows as any[];
    return result[0] || { credits: 100, last_credit_earn: new Date() };
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    throw error;
  }
}

export async function updateUserCredits(userId: number, newCredits: number): Promise<void> {
  try {
    await executeQuery('UPDATE users SET credits = ?, last_credit_earn = NOW() WHERE id = ?', [newCredits, userId]);
  } catch (error) {
    console.error('Error in updateUserCredits:', error);
    throw error;
  }
}

export async function getAllPlayers(): Promise<Player[]> {
  try {
    const [rows] = await executeQuery('SELECT * FROM players ORDER BY overall_rating DESC');
    return rows as Player[];
  } catch (error) {
    console.error('Error in getAllPlayers:', error);
    throw error;
  }
}

// Updated pack rates based on collection size (24 Supers out of 200 total cards)
export async function getRandomCards(count: number = 5, packType: string = 'standard'): Promise<Player[]> {
  try {
    const [players] = await executeQuery('SELECT * FROM players');
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

export async function addCardsToUser(userId: number, cards: Player[]): Promise<void> {
  try {
    for (const card of cards) {
      await executeQuery(`
        INSERT INTO user_cards (user_id, player_id, quantity) 
        VALUES (?, ?, 1) 
        ON DUPLICATE KEY UPDATE quantity = quantity + 1
      `, [userId, card.id]);
    }
  } catch (error) {
    console.error('Error in addCardsToUser:', error);
    throw error;
  }
}

export async function recordPackOpening(userId: number, creditsSpent: number, cards: Player[], packType: string = 'Standard'): Promise<void> {
  try {
    await executeQuery(`
      INSERT INTO pack_openings (user_id, pack_type, credits_spent, cards_obtained) 
      VALUES (?, ?, ?, ?)
    `, [userId, packType, creditsSpent, JSON.stringify(cards.map(c => c.id))]);
    
    // Update total packs opened
    await executeQuery(`
      UPDATE users SET total_packs_opened = total_packs_opened + 1 WHERE id = ?
    `, [userId]);
  } catch (error) {
    console.error('Error in recordPackOpening:', error);
    throw error;
  }
}

export async function getUserInventory(userId: number): Promise<UserCard[]> {
  try {
    const [rows] = await executeQuery(`
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
    const [cardStats] = await executeQuery(`
      SELECT 
        SUM(quantity) as total_cards,
        COUNT(*) as unique_cards
      FROM user_cards 
      WHERE user_id = ?
    `, [userId]);
    
    // Get total packs opened
    const [userStats] = await executeQuery(`
      SELECT total_packs_opened FROM users WHERE id = ?
    `, [userId]);
    
    // Get rarity breakdown
    const [rarityStats] = await executeQuery(`
      SELECT 
        p.rarity,
        SUM(uc.quantity) as count
      FROM user_cards uc
      JOIN players p ON uc.player_id = p.id
      WHERE uc.user_id = ?
      GROUP BY p.rarity
    `, [userId]);
    
    // Get Super collection progress
    const [totalSupers] = await executeQuery(`
      SELECT COUNT(*) as total FROM players WHERE rarity = 'Super'
    `);
    
    const [collectedSupers] = await executeQuery(`
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

// Get user by email (for NextAuth)
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [rows] = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    const result = rows as any[];
    return result[0] || null;
  } catch (error) {
    console.error('Error in getUserByEmail:', error);
    throw error;
  }
}

// Enhanced sell card function with proper transaction and connection handling
export async function sellCard(userId: number, playerId: number, quantity: number): Promise<{
  success: boolean;
  creditsEarned: number;
  newBalance: number;
  remainingQuantity: number;
  error?: string;
}> {
  const db = await getDb();
  
  // Base sell values with OVR multipliers
  const baseSellValues = {
    'Super': 250,
    'Epic': 75,
    'Rare': 30,
    'Common': 12
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

  const connection = await db.getConnection();
  
  try {
    // Start transaction using the connection directly
    await connection.query('START TRANSACTION');

    try {
      // Check if user owns this card and has enough quantity
      const [userCardRows] = await connection.execute(`
        SELECT uc.quantity, p.rarity, p.name, p.overall_rating
        FROM user_cards uc
        JOIN players p ON uc.player_id = p.id
        WHERE uc.user_id = ? AND uc.player_id = ?
      `, [userId, playerId]);

      const userCard = (userCardRows as any[])[0];
      
      if (!userCard) {
        await connection.query('ROLLBACK');
        return { 
          success: false, 
          creditsEarned: 0, 
          newBalance: 0, 
          remainingQuantity: 0,
          error: 'Card not found in collection' 
        };
      }

      if (userCard.quantity < quantity) {
        await connection.query('ROLLBACK');
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

      // Record the transaction (create table if it doesn't exist)
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS card_sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          player_id INT NOT NULL,
          quantity_sold INT NOT NULL,
          credits_earned INT NOT NULL,
          sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_player_id (player_id)
        )
      `);

      await connection.execute(`
        INSERT INTO card_sales (user_id, player_id, quantity_sold, credits_earned, sale_date)
        VALUES (?, ?, ?, ?, NOW())
      `, [userId, playerId, quantity, totalCredits]);

      // Commit transaction
      await connection.query('COMMIT');

      return {
        success: true,
        creditsEarned: totalCredits,
        newBalance: newCredits,
        remainingQuantity: Math.max(0, remainingQuantity)
      };

    } catch (error) {
      // Rollback on error
      await connection.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error in sellCard:', error);
    return { 
      success: false, 
      creditsEarned: 0, 
      newBalance: 0, 
      remainingQuantity: 0,
      error: 'Failed to sell card' 
    };
  } finally {
    // Always release the connection back to the pool
    connection.release();
  }
}

// Get user's selling history
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
    const [totalStats] = await executeQuery(`
      SELECT 
        COALESCE(SUM(quantity_sold), 0) as total_sold,
        COALESCE(SUM(credits_earned), 0) as total_credits_earned
      FROM card_sales 
      WHERE user_id = ?
    `, [userId]);

    // Get recent sales (last 20)
    const [recentSales] = await executeQuery(`
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