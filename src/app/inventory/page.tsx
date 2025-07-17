'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Trophy, Star, Filter, Eye, BarChart3, Settings, Crown } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ExpandableCard } from '@/components/ExpandableCard';
import Navbar from '@/components/Navbar';
import { BackgroundBeams } from '@/components/BackgroundBeams';

// Update interfaces to match your database structure
interface Player {
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

interface UserCard {
  id: number;
  user_id: number;
  player_id: number;
  quantity: number;
  first_obtained: Date;
  player: Player;
}

interface InventoryStats {
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  rarityBreakdown: { [key: string]: number };
}

interface ShowcasePlayer {
  id: number;
  player: Player;
  position: number; // 1, 2, or 3
}

export default function Inventory() {
  const { data: session, status } = useSession();
  const [inventory, setInventory] = useState<UserCard[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [showcase, setShowcase] = useState<ShowcasePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [credits, setCredits] = useState<number>(100);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'stats' | 'showcase'>('stats');
  const [isEditingShowcase, setIsEditingShowcase] = useState(false);
  const [tempShowcase, setTempShowcase] = useState<ShowcasePlayer[]>([]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchInventory();
      fetchCredits();
      fetchShowcase();
    }
  }, [session, status]);

  const fetchCredits = async (): Promise<void> => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      // Update credits from session if available, otherwise use API response
      setCredits(session?.user?.credits || data.credits || 100);
      const lastEarned = new Date(data.lastEarned);
      const now = new Date();
      const nextEarnTime = new Date(lastEarned.getTime() + 60 * 60 * 1000);
      const timeLeft = Math.max(0, nextEarnTime.getTime() - now.getTime());
      setTimeUntilNext(Math.ceil(timeLeft / 1000));
    } catch (error) {
      console.error('Error fetching credits:', error);
      // Fallback to session credits
      setCredits(session?.user?.credits || 100);
    }
  };

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

  const fetchShowcase = async () => {
    try {
      const response = await fetch('/api/showcase');
      const data = await response.json();
      if (data.success) {
        setShowcase(data.showcase);
      }
    } catch (error) {
      console.error('Error fetching showcase:', error);
    }
  };

  const updateShowcase = async (newShowcase: ShowcasePlayer[]) => {
    try {
      const response = await fetch('/api/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showcase: newShowcase })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowcase(newShowcase);
        setIsEditingShowcase(false);
        setTempShowcase([]);
      }
    } catch (error) {
      console.error('Error updating showcase:', error);
    }
  };

  const handleInventoryUpdate = async () => {
    try {
      await Promise.all([
        fetchInventory(),
        fetchCredits()
      ]);
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleSellCard = async (playerId: number, quantity: number): Promise<{ 
    success: boolean; 
    creditsEarned: number; 
    remainingQuantity?: number;
    error?: string 
  }> => {
    try {
      const response = await fetch('/api/sell-card', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          playerId, 
          quantity 
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCredits(data.newBalance);
        
        setInventory(prevInventory => {
          return prevInventory.reduce((acc, item) => {
            if (item.player.id === playerId) {
              const newQuantity = item.quantity - quantity;
              if (newQuantity > 0) {
                acc.push({ ...item, quantity: newQuantity });
              }
            } else {
              acc.push(item);
            }
            return acc;
          }, [] as UserCard[]);
        });

        if (stats) {
          setStats(prevStats => {
            if (!prevStats) return null;
            
            const soldCard = inventory.find(item => item.player.id === playerId);
            if (soldCard) {
              const rarity = soldCard.player.rarity;
              const uniqueDecrease = inventory.some(item => item.player.id === playerId && item.quantity === quantity) ? 1 : 0;
              
              return {
                ...prevStats,
                totalCards: prevStats.totalCards - quantity,
                uniqueCards: prevStats.uniqueCards - uniqueDecrease,
                rarityBreakdown: {
                  ...prevStats.rarityBreakdown,
                  [rarity]: Math.max(0, (prevStats.rarityBreakdown[rarity] || 0) - quantity)
                }
              };
            }
            return prevStats;
          });
        }

        return {
          success: true,
          creditsEarned: data.creditsEarned,
          remainingQuantity: data.remainingQuantity
        };
      } else {
        return {
          success: false,
          creditsEarned: 0,
          error: data.error || 'Failed to sell card'
        };
      }
    } catch (error) {
      console.error('Error selling card:', error);
      return {
        success: false,
        creditsEarned: 0,
        error: 'Network error. Please try again.'
      };
    }
  };

  const handleAddToShowcase = (player: Player, position: number) => {
    const newShowcase = [...tempShowcase];
    // Remove player if already in showcase
    const existingIndex = newShowcase.findIndex(s => s.player.id === player.id);
    if (existingIndex !== -1) {
      newShowcase.splice(existingIndex, 1);
    }
    
    // Remove player from the position if occupied
    const positionIndex = newShowcase.findIndex(s => s.position === position);
    if (positionIndex !== -1) {
      newShowcase.splice(positionIndex, 1);
    }
    
    // Add player to position
    newShowcase.push({ id: player.id, player, position });
    setTempShowcase(newShowcase);
  };

  const handleRemoveFromShowcase = (playerId: number) => {
    setTempShowcase(tempShowcase.filter(s => s.player.id !== playerId));
  };

  const startEditingShowcase = () => {
    setIsEditingShowcase(true);
    setTempShowcase([...showcase]);
  };

  const cancelEditingShowcase = () => {
    setIsEditingShowcase(false);
    setTempShowcase([]);
  };

  const saveShowcase = () => {
    updateShowcase(tempShowcase);
  };

  const filteredAndSortedInventory = () => {
    let filtered = inventory;

    if (filter !== 'all') {
      filtered = filtered.filter(item => item.player.rarity.toLowerCase() === filter);
    }

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

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '⭐';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view your inventory</h1>
          <Link href="/auth/signin" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />
      
      <Navbar credits={credits} timeUntilNext={timeUntilNext} />

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-10 max-w-7xl mx-auto p-6"
      >
        <div className="flex items-center justify-center mb-8">
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'stats' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Collection Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('showcase')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'showcase' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Crown className="w-5 h-5" />
              <span>Showcase</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Tab Content */}
      {activeTab === 'stats' && stats && (
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
              <div className="text-sm text-white">Super Cards</div>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Collection Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-black/20 rounded-lg p-4 text-center border border-white/20 shadow-[0_0_16px_4px_rgba(255,255,255,0.3)]">
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.rarityBreakdown.Super || 0}
                </div>
                <div className="text-sm text-white">Super</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center border border-yellow-400/20">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {stats.rarityBreakdown.Epic || 0}
                </div>
                <div className="text-sm text-yellow-200">Epic</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center border border-gray-200/20">
                <div className="text-2xl font-bold text-gray-200 mb-1">
                  {stats.rarityBreakdown.Rare || 0}
                </div>
                <div className="text-sm text-gray-200">Rare</div>
              </div>
              <div className="bg-black/20 rounded-lg p-4 text-center border border-gray-400/20">
                <div className="text-2xl font-bold text-gray-400 mb-1">
                  {stats.rarityBreakdown.Common || 0}
                </div>
                <div className="text-sm text-gray-200">Common</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Showcase Tab Content */}
      {activeTab === 'showcase' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 max-w-7xl mx-auto p-6"
        >
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white">Your Showcase</h3>
              {!isEditingShowcase ? (
                <button
                  onClick={startEditingShowcase}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Edit Showcase</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={saveShowcase}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditingShowcase}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((position) => {
                const showcasePlayer = (isEditingShowcase ? tempShowcase : showcase).find(s => s.position === position);
                return (
                  <div
                    key={position}
                    className="bg-black/30 border border-white/20 rounded-xl p-6 text-center min-h-[200px] flex flex-col items-center justify-center"
                  >
                    <div className="text-4xl mb-2">{getPositionIcon(position)}</div>
                    {showcasePlayer ? (
                      <div className="w-full">
                        <div className="text-lg font-semibold text-white mb-1">
                          {showcasePlayer.player.name}
                        </div>
                        <div className="text-sm text-gray-300 mb-2">
                          {showcasePlayer.player.team}
                        </div>
                        <div className="text-2xl font-bold text-yellow-400 mb-2">
                          {showcasePlayer.player.overall_rating}
                        </div>
                        <div className={`text-sm ${getRarityColor(showcasePlayer.player.rarity)}`}>
                          {showcasePlayer.player.rarity}
                        </div>
                        {isEditingShowcase && (
                          <button
                            onClick={() => handleRemoveFromShowcase(showcasePlayer.player.id)}
                            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <div className="text-sm">Position {position}</div>
                        <div className="text-xs mt-1">Empty</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Sorting - Show for both tabs */}
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
                className="relative"
              >
                <ExpandableCard
                  player={item.player}
                  quantity={item.quantity}
                  firstObtained={item.first_obtained}
                  onInventoryUpdate={handleInventoryUpdate}
                  onSell={handleSellCard}
                  userCredits={credits}
                />
                
                {/* Showcase Edit Mode - Add to showcase buttons */}
                {isEditingShowcase && (
                  <div className="absolute top-10 right-2 flex flex-col space-y-1">
                    {[1, 2, 3].map((position) => {
                      const isInPosition = tempShowcase.some(s => s.position === position && s.player.id === item.player.id);
                      const isPositionFilled = tempShowcase.some(s => s.position === position);
                      
                      return (
                        <button
                          key={position}
                          onClick={() => handleAddToShowcase(item.player, position)}
                          disabled={isPositionFilled && !isInPosition}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            isInPosition 
                              ? 'bg-green-600 text-white'
                              : isPositionFilled 
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          {getPositionIcon(position)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}