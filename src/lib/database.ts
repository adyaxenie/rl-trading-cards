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

export async function getRandomCards(count: number = 5): Promise<Player[]> {
  const db = await getDb();
  const [players] = await db.execute('SELECT * FROM players');
  const playersArray = players as Player[];
  
  // Weighted random selection based on rarity
  const weightedPlayers: Player[] = [];
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

export async function recordPackOpening(userId: number = 1, creditsSpent: number, cards: Player[]): Promise<void> {
  const db = await getDb();
  await db.execute(`
    INSERT INTO pack_openings (user_id, pack_type, credits_spent, cards_obtained) 
    VALUES (?, 'Standard', ?, ?)
  `, [userId, creditsSpent, JSON.stringify(cards.map(c => c.id))]);
  
  // Update total packs opened
  await db.execute(`
    UPDATE users SET total_packs_opened = total_packs_opened + 1 WHERE id = ?
  `, [userId]);
}