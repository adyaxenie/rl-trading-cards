// lib/pack-config.ts - Pack configurations for the game

export interface PackType {
  id: string;
  name: string;
  price: number;
  cardCount: number;
  description: string;
  rarity_rates: {
    super: number;
    epic: number;
    rare: number;
    common: number;
  };
  gradient: string;
  border: string;
  icon: string;
}

export const PACK_TYPES: Record<string, PackType> = {
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    price: 500,
    cardCount: 5,
    description: 'Basic pack with balanced card distribution',
    rarity_rates: {
      super: 1.5,
      epic: 8,
      rare: 28,
      common: 62.5
    },
    gradient: 'from-gray-500 to-gray-700',
    border: 'border-gray-400/30',
    icon: '📦'
  },
  premium: {
    id: 'premium',
    name: 'Premium Pack',
    price: 1000,
    cardCount: 5,
    description: 'Enhanced pack with better rare card chances',
    rarity_rates: {
      super: 6,
      epic: 22,
      rare: 35,
      common: 37
    },
    gradient: 'from-blue-500 to-purple-600',
    border: 'border-blue-400/50',
    icon: '💎'
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Pack',
    price: 2000,
    cardCount: 5,
    description: 'Premium pack with 15% Super card rate!',
    rarity_rates: {
      super: 15,
      epic: 40,
      rare: 35,
      common: 10
    },
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
    border: 'border-yellow-400/60',
    icon: '🏆'
  }
};

export const DAILY_CREDIT_AMOUNT = 250;
export const DAILY_RESET_HOUR_UTC = 2; // 6 PM PT = 2 AM UTC next day

// Helper function to get pack type
export function getPackType(packId: string): PackType | null {
  return PACK_TYPES[packId] || null;
}

// Helper function to get all pack types
export function getAllPackTypes(): PackType[] {
  return Object.values(PACK_TYPES);
}

// Helper function to calculate pack affordability
export function getAffordablePackCount(credits: number, packType: PackType): number {
  return Math.floor(credits / packType.price);
}

// Helper function to format pack description with rates
export function getPackRateDescription(packType: PackType): string {
  const rates = packType.rarity_rates;
  return `Super: ${rates.super}% | Epic: ${rates.epic}% | Rare: ${rates.rare}% | Common: ${rates.common}%`;
}