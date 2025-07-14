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

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1212',
  database: process.env.DB_NAME || 'rltcg',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;

export async function getDb(): Promise<mysql.Pool> {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Updated to work with authenticated users
export async function getUserCredits(userId: number): Promise<{ credits: number; last_credit_earn: Date }> {
  const db = await getDb();
  const [rows] = await db.execute('SELECT credits, last_credit_earn FROM users WHERE id = ?', [userId]);
  const result = rows as any[];
  return result[0] || { credits: 100, last_credit_earn: new Date() };
}

export async function updateUserCredits(userId: number, newCredits: number): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE users SET credits = ?, last_credit_earn = NOW() WHERE id = ?', [newCredits, userId]);
}

export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDb();
  const [rows] = await db.execute('SELECT * FROM players ORDER BY overall_rating DESC');
  return rows as Player[];
}

// Updated pack rates based on collection size (24 Supers out of 200 total cards)
export async function getRandomCards(count: number = 5, packType: string = 'standard'): Promise<Player[]> {
  const db = await getDb();
  const [players] = await db.execute('SELECT * FROM players');
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
}

export async function addCardsToUser(userId: number, cards: Player[]): Promise<void> {
  const db = await getDb();
  
  for (const card of cards) {
    await db.execute(`
      INSERT INTO user_cards (user_id, player_id, quantity) 
      VALUES (?, ?, 1) 
      ON DUPLICATE KEY UPDATE quantity = quantity + 1
    `, [userId, card.id]);
  }
}

export async function recordPackOpening(userId: number, creditsSpent: number, cards: Player[], packType: string = 'Standard'): Promise<void> {
  const db = await getDb();
  await db.execute(`
    INSERT INTO pack_openings (user_id, pack_type, credits_spent, cards_obtained) 
    VALUES (?, ?, ?, ?)
  `, [userId, packType, creditsSpent, JSON.stringify(cards.map(c => c.id))]);
  
  // Update total packs opened
  await db.execute(`
    UPDATE users SET total_packs_opened = total_packs_opened + 1 WHERE id = ?
  `, [userId]);
}

export interface UserCard {
  id: number;
  user_id: number;
  player_id: number;
  quantity: number;
  first_obtained: Date;
  player: Player;
}

export async function getUserInventory(userId: number): Promise<UserCard[]> {
  const db = await getDb();
  const [rows] = await db.execute(`
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
}

export async function getUserStats(userId: number): Promise<{
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  rarityBreakdown: { [key: string]: number };
  superProgress: { collected: number; total: number; percentage: number };
}> {
  const db = await getDb();
  
  // Get total cards and unique cards
  const [cardStats] = await db.execute(`
    SELECT 
      SUM(quantity) as total_cards,
      COUNT(*) as unique_cards
    FROM user_cards 
    WHERE user_id = ?
  `, [userId]);
  
  // Get total packs opened
  const [userStats] = await db.execute(`
    SELECT total_packs_opened FROM users WHERE id = ?
  `, [userId]);
  
  // Get rarity breakdown
  const [rarityStats] = await db.execute(`
    SELECT 
      p.rarity,
      SUM(uc.quantity) as count
    FROM user_cards uc
    JOIN players p ON uc.player_id = p.id
    WHERE uc.user_id = ?
    GROUP BY p.rarity
  `, [userId]);
  
  // Get Super collection progress
  const [totalSupers] = await db.execute(`
    SELECT COUNT(*) as total FROM players WHERE rarity = 'Super'
  `);
  
  const [collectedSupers] = await db.execute(`
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
}

// Get user by email (for NextAuth)
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  const result = rows as any[];
  return result[0] || null;
}

// Create new user with first-time bonus (2500 credits for opening loop)
export async function createUser(name: string, email: string): Promise<User> {
  const db = await getDb();
  const [result] = await db.execute(`
    INSERT INTO users (username, email, credits, last_credit_earn, total_packs_opened)
    VALUES (?, ?, 2500, NOW(), 0)
  `, [name, email]);
  
  const insertResult = result as any;
  const userId = insertResult.insertId;
  
  const [newUser] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return (newUser as any[])[0];
}