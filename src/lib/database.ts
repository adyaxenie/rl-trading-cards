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
  password: process.env.DB_PASSWORD || '', // Add your MySQL password here
  database: process.env.DB_NAME || 'rl_trading_cards',
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

export async function getUserCredits(userId: number = 1): Promise<{ credits: number; last_credit_earn: Date }> {
  const db = await getDb();
  const [rows] = await db.execute('SELECT credits, last_credit_earn FROM users WHERE id = ?', [userId]);
  const result = rows as any[];
  return result[0] || { credits: 100, last_credit_earn: new Date() };
}

export async function updateUserCredits(userId: number = 1, newCredits: number): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE users SET credits = ? WHERE id = ?', [newCredits, userId]);
}

export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDb();
  const [rows] = await db.execute('SELECT * FROM players ORDER BY overall_rating DESC');
  return rows as Player[];
}

export async function getRandomCards(count: number = 5, packType: string = 'standard'): Promise<Player[]> {
  const db = await getDb();
  const [players] = await db.execute('SELECT * FROM players');
  const playersArray = players as Player[];
  
  // Different weighted selection based on pack type
  const weightedPlayers: Player[] = [];
  
  if (packType === 'premium') {
    // Premium pack: Much higher odds for Super and Epic cards
    playersArray.forEach(player => {
      let weight: number;
      switch(player.rarity) {
        case 'Super': weight = 25; break;   // 25x higher chance than standard
        case 'Epic': weight = 15; break;    // 3x higher chance than standard  
        case 'Rare': weight = 8; break;     // Slightly lower than standard
        case 'Common': weight = 2; break;   // Much lower than standard
        default: weight = 2;
      }
      
      for (let i = 0; i < weight; i++) {
        weightedPlayers.push(player);
      }
    });
  } else {
    // Standard pack: Original odds
    playersArray.forEach(player => {
      let weight: number;
      switch(player.rarity) {
        case 'Super': weight = 1; break;
        case 'Epic': weight = 5; break;
        case 'Rare': weight = 15; break;
        case 'Common': weight = 30; break;
        default: weight = 30;
      }
      
      for (let i = 0; i < weight; i++) {
        weightedPlayers.push(player);
      }
    });
  }
  
  const selectedCards: Player[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * weightedPlayers.length);
    selectedCards.push(weightedPlayers[randomIndex]);
  }
  
  return selectedCards;
}

export async function addCardsToUser(userId: number = 1, cards: Player[]): Promise<void> {
  const db = await getDb();
  
  for (const card of cards) {
    await db.execute(`
      INSERT INTO user_cards (user_id, player_id, quantity) 
      VALUES (?, ?, 1) 
      ON DUPLICATE KEY UPDATE quantity = quantity + 1
    `, [userId, card.id]);
  }
}

export async function recordPackOpening(userId: number = 1, creditsSpent: number, cards: Player[], packType: string = 'Standard'): Promise<void> {
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

export async function getUserInventory(userId: number = 1): Promise<UserCard[]> {
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

export async function getUserStats(userId: number = 1): Promise<{
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  rarityBreakdown: { [key: string]: number };
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
  
  const cardStatsResult = cardStats as any[];
  const userStatsResult = userStats as any[];
  const rarityStatsResult = rarityStats as any[];
  
  const rarityBreakdown: { [key: string]: number } = {};
  rarityStatsResult.forEach((row: any) => {
    rarityBreakdown[row.rarity] = row.count;
  });
  
  return {
    totalCards: cardStatsResult[0]?.total_cards || 0,
    uniqueCards: cardStatsResult[0]?.unique_cards || 0,
    totalPacks: userStatsResult[0]?.total_packs_opened || 0,
    rarityBreakdown
  };
}