'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Trophy, Star, Filter } from 'lucide-react';
import Link from 'next/link';
import { ExpandableCard } from '@/components/ExpandableCard';
import Navbar from '@/components/Navbar';
import { BackgroundBeams } from '@/components/BackgroundBeams';
import { UserCard } from '@/lib/database';

interface InventoryStats {
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  rarityBreakdown: { [key: string]: number };
}

export default function Inventory() {
  const [inventory, setInventory] = useState<UserCard[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [credits, setCredits] = useState<number>(100);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);

  useEffect(() => {
    fetchInventory();
    fetchCredits();
  }, []);

  const fetchCredits = async (): Promise<void> => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      setCredits(data.credits);
      // Calculate time until next for navbar
      const lastEarned = new Date(data.lastEarned);
      const now = new Date();
      const nextEarnTime = new Date(lastEarned.getTime() + 60 * 60 * 1000);
      const timeLeft = Math.max(0, nextEarnTime.getTime() - now.getTime());
      setTimeUntilNext(Math.ceil(timeLeft / 1000));
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      setInventory(data.inventory);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedInventory = () => {
    let filtered = inventory;

    // Apply rarity filter
    if (filter !== 'all') {
      filtered = filtered.filter(item => item.player.rarity.toLowerCase() === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.player.overall_rating - a.player.overall_rating;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'recent':
          return new Date(b.first_obtained).getTime() - new Date(a.first_obtained).getTime();
        case 'name':
          return a.player.name.localeCompare(b.player.name);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'super': return 'text-yellow-300';
      case 'epic': return 'text-purple-400';
      case 'rare': return 'text-blue-400';
      case 'common': return 'text-gray-300';
      default: return 'text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />
      
      {/* Header */}
      <Navbar credits={credits} timeUntilNext={timeUntilNext} />

      {/* Stats Section */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-7xl mx-auto p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-blue-400/30 transition-all duration-300">
              <Package className="w-10 h-10 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">{stats.totalCards}</div>
              <div className="text-sm text-blue-200">Total Cards</div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-purple-400/30 transition-all duration-300">
              <Star className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">{stats.uniqueCards}</div>
              <div className="text-sm text-purple-200">Unique Players</div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-yellow-400/30 transition-all duration-300">
              <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white">{stats.totalPacks}</div>
              <div className="text-sm text-yellow-200">Packs Opened</div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-yellow-400/30 transition-all duration-300">
              <div className="text-5xl mb-2">✨</div>
              <div className="text-3xl font-bold text-white">
                {stats.rarityBreakdown.Super || 0}
              </div>
              <div className="text-sm text-yellow-200">Super Cards</div>
            </div>
          </div>

          {/* Rarity Breakdown */}
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Collection Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-black/20 rounded-lg p-4 text-center border border-yellow-400/20">
                <div className="text-2xl font-bold text-yellow-300 mb-1">
                  {stats.rarityBreakdown.Super || 0}
                </div>
                <div className="text-sm text-yellow-200">Super</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center border border-purple-400/20">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {stats.rarityBreakdown.Epic || 0}
                </div>
                <div className="text-sm text-purple-200">Epic</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center border border-blue-400/20">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {stats.rarityBreakdown.Rare || 0}
                </div>
                <div className="text-sm text-blue-200">Rare</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center border border-gray-400/20">
                <div className="text-2xl font-bold text-gray-300 mb-1">
                  {stats.rarityBreakdown.Common || 0}
                </div>
                <div className="text-sm text-gray-200">Common</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Sorting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 max-w-7xl mx-auto px-6 mb-6"
      >
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-blue-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="all">All Rarities</option>
              <option value="super">Super</option>
              <option value="epic">Epic</option>
              <option value="rare">Rare</option>
              <option value="common">Common</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-white text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
            >
              <option value="rating">Overall Rating</option>
              <option value="quantity">Quantity</option>
              <option value="recent">Recently Obtained</option>
              <option value="name">Player Name</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 max-w-7xl mx-auto px-6 pb-12"
      >
        {inventory?.length === 0 || inventory === undefined ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Cards Yet</h3>
            <p className="text-gray-400 mb-6">Open some packs to start your collection!</p>
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Open Packs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {filteredAndSortedInventory().map((item, index) => (
              <motion.div
                key={`${item.player.id}-${item.quantity}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ExpandableCard 
                  player={item.player} 
                  quantity={item.quantity}
                  firstObtained={item.first_obtained}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}