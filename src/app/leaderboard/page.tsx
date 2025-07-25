'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Crown, 
  Star, 
  Package, 
  TrendingUp, 
  Users, 
  Medal,
  Sparkles,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { BackgroundBeams } from '@/components/BackgroundBeams';
import { useSession } from 'next-auth/react';
import Footer from '@/components/Footer';

interface Player {
  id: number;
  name: string;
  team: string;
  region: string;
  overall_rating: number;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Super';
  image_url: string;
}

interface ShowcasePlayer {
  id: number;
  player: Player;
  position: number;
}

interface UserShowcase {
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

interface UserStats {
  user: {
    id: number;
    name: string;
  };
  totalCards: number;
  uniqueCards: number;
  totalPacks: number;
  superCards: number;
  averageRating: number;
}

interface LeaderboardData {
  showcases: UserShowcase[];
  topCollectors: UserStats[];
  topPackOpeners: UserStats[];
  superCollectors: UserStats[];
}

// Rarity styling constants
const rarityColors = {
  'Super': 'from-black via-gray-900 to-black',
  'Epic': 'from-yellow-200 via-amber-300 to-yellow-500',
  'Rare': 'from-slate-200 via-gray-300 to-slate-400',
  'Common': 'from-gray-500 via-gray-400 to-gray-500',
};

const rarityGlow = {
  'Super': 'shadow-glow-super',
  'Epic': 'shadow-glow-epic',
  'Rare': 'shadow-glow-rare',
  'Common': 'shadow-glow-common',
};

const rarityBorder = {
  'Super': 'border-white',
  'Epic': 'border-yellow-400',
  'Rare': 'border-slate-300',
  'Common': 'border-gray-400',
};

const rarityBadgeStyle = {
  'Super': 'bg-white text-black font-bold',
  'Epic': 'bg-yellow-600 text-black font-bold',
  'Rare': 'bg-slate-600 text-white font-bold',
  'Common': 'bg-gray-500 text-white font-medium',
};

export default function Leaderboard() {
  const { data: session } = useSession();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    showcases: [],
    topCollectors: [],
    topPackOpeners: [],
    superCollectors: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'showcases' | 'collectors' | 'packs' | 'supers'>('showcases');
  const [credits, setCredits] = useState<number>(100);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);

  useEffect(() => {
    fetchLeaderboardData();
    if (session?.user?.id) {
      fetchCredits();
    }
  }, [session]);

  const fetchCredits = async (): Promise<void> => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      setCredits(session?.user?.credits || data.credits || 100);
      const lastEarned = new Date(data.lastEarned);
      const now = new Date();
      const nextEarnTime = new Date(lastEarned.getTime() + 60 * 60 * 1000);
      const timeLeft = Math.max(0, nextEarnTime.getTime() - now.getTime());
      setTimeUntilNext(Math.ceil(timeLeft / 1000));
    } catch (error) {
      console.error('Error fetching credits:', error);
      setCredits(session?.user?.credits || 100);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all leaderboard data in parallel
      const [showcasesRes, collectorsRes, packsRes, supersRes] = await Promise.all([
        fetch('/api/showcases/leaderboard?limit=10'),
        fetch('/api/leaderboard/collectors?limit=10'),
        fetch('/api/leaderboard/packs?limit=10'),
        fetch('/api/leaderboard/supers?limit=10')
      ]);

      const [showcasesData, collectorsData, packsData, supersData] = await Promise.all([
        showcasesRes.json(),
        collectorsRes.json(),
        packsRes.json(),
        supersRes.json()
      ]);

      setLeaderboardData({
        showcases: showcasesData.success ? showcasesData.showcases : [],
        topCollectors: collectorsData.success ? collectorsData.users : [],
        topPackOpeners: packsData.success ? packsData.users : [],
        superCollectors: supersData.success ? supersData.users : []
      });
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'super': return 'text-yellow-300 border-yellow-300/30 bg-yellow-300/10';
      case 'epic': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'rare': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'common': return 'text-gray-300 border-gray-300/30 bg-gray-300/10';
      default: return 'text-gray-300 border-gray-300/30 bg-gray-300/10';
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getCurrentUserRank = (data: UserStats[], userId?: number) => {
    if (!userId) return null;
    const userIndex = data.findIndex(user => user.user.id === userId);
    return userIndex !== -1 ? userIndex + 1 : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative z-0 max-w-7xl mx-auto p-6"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <p className="text-gray-300 text-lg">See who's dominating the trading card game!</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-2 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('showcases')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'showcases' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Crown className="w-5 h-5" />
              <span>Top Showcases</span>
            </button>
            <button
              onClick={() => setActiveTab('collectors')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'collectors' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Package className="w-5 h-5" />
              <span>Top Collectors</span>
            </button>
            <button
              onClick={() => setActiveTab('packs')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'packs' 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Pack Openers</span>
            </button>
            <button
              onClick={() => setActiveTab('supers')}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'supers' 
                  ? 'bg-yellow-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Super Hunters</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-0 max-w-7xl mx-auto px-6 pb-12 mb-20"
      >
        {/* Top Showcases Tab */}
        {activeTab === 'showcases' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Featured Showcases</h2>
              <p className="text-gray-300">Check out the most impressive player showcases from our community</p>
            </div>
            
            {leaderboardData.showcases.length === 0 ? (
              <div className="text-center py-12">
                <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Showcases Yet</h3>
                <p className="text-gray-400 mb-6">Be the first to set up your showcase!</p>
                <Link 
                  href="/inventory" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Set Up Your Showcase
                </Link>
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-600/20 border-b border-purple-400/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Showcase Owner</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Avg Rating</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-white">🥇 Position 1</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-white">🥈 Position 2</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-white">🥉 Position 3</th>
                        {/* <th className="px-6 py-4 text-right text-sm font-semibold text-white">Collection Stats</th> */}
                        <th className="px-6 py-4 text-center text-sm font-semibold text-white">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.showcases
                        .map((userShowcase) => {
                          const showcaseCards = userShowcase.showcase.filter(s => s.player);
                          const avgRating = showcaseCards.length > 0 
                            ? showcaseCards.reduce((sum, s) => sum + s.player.overall_rating, 0) / showcaseCards.length 
                            : 0;
                          return { ...userShowcase, calculatedAvgRating: avgRating };
                        })
                        .sort((a, b) => b.calculatedAvgRating - a.calculatedAvgRating)
                        .map((userShowcase, index) => {
                        const showcaseCards = userShowcase.showcase.filter(s => s.player);
                        const avgRating = userShowcase.calculatedAvgRating;
                        
                        return (
                          <motion.tr
                            key={userShowcase.user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-white/10 hover:bg-purple-600/10 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                {getRankIcon(index + 1)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white text-lg">{userShowcase.user.name}</div>
                              {userShowcase.stats && (
                                <div className="text-sm text-gray-300">
                                  {userShowcase.stats.totalCards} total • {userShowcase.stats.uniqueCards} unique
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-2xl text-orange-400 font-bold">
                                {avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}
                              </div>
                            </td>
                            {[1, 2, 3].map((position) => {
                              const player = userShowcase.showcase.find(s => s.position === position);
                              return (
                                <td key={position} className="px-4 py-2 text-center group">
                                  <div className="h-[60px] flex items-center justify-center">
                                    {player ? (
                                      <div className="relative">
                                        {/* Simplified view - just name with rarity color */}
                                        <div className={`bg-gradient-to-br ${rarityColors[player.player.rarity]} ${rarityBorder[player.player.rarity]} border-2 rounded-lg p-2 w-[100px] h-[30px] flex items-center justify-center transition-all duration-300 group-hover:opacity-0 ${rarityGlow[player.player.rarity]}`}>
                                          <div className="text-xs font-semibold text-white truncate">
                                            {player.player.name}
                                          </div>
                                        </div>
                                        
                                        {/* Detailed view on hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${rarityColors[player.player.rarity]} ${rarityBorder[player.player.rarity]} border-2 rounded-lg p-3 w-[120px] h-[130px] flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110 z-10 ${rarityGlow[player.player.rarity]}`}>
                                          <div className="flex-1 flex flex-col justify-center">
                                            <div className="text-xs font-semibold text-white mb-1 truncate">
                                              {player.player.name}
                                            </div>
                                            <div className="text-xs text-white/80 mb-1 truncate">
                                              {player.player.team}
                                            </div>
                                            <div className="text-lg font-bold text-white mb-1">
                                              {player.player.overall_rating}
                                            </div>
                                          </div>
                                          <div className={`px-2 py-1 rounded text-xs ${rarityBadgeStyle[player.player.rarity]}`}>
                                            {player.player.rarity}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-gray-600/20 border-2 border-gray-600 rounded-lg p-2 w-[100px] h-[30px] flex items-center justify-center">
                                        <div className="text-xs text-gray-500">Empty</div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {/* <td className="px-6 py-4 text-right">
                              {userShowcase.stats && (
                                <div className="space-y-1">
                                  <div className="text-sm text-blue-400 font-semibold">
                                    {userShowcase.stats.totalCards.toLocaleString()} cards
                                  </div>
                                  <div className="text-sm text-purple-400 font-semibold">
                                    {userShowcase.stats.uniqueCards.toLocaleString()} unique
                                  </div>
                                </div>
                              )}
                            </td> */}
                            <td className="px-6 py-4 text-center">
                              <Link
                                href={`/showcase/${userShowcase.user.id}`}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                View Full
                              </Link>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top Collectors Tab */}
        {activeTab === 'collectors' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Top Collectors</h2>
              <p className="text-gray-300">Players with the most extensive card collections</p>
              {session?.user?.id && (
                <div className="mt-4 text-sm text-gray-400">
                  Your rank: {getCurrentUserRank(leaderboardData.topCollectors, session.user.id) || 'Unranked'}
                </div>
              )}
            </div>
            
            {leaderboardData.topCollectors.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Collectors Yet</h3>
                <p className="text-gray-400 mb-6">Start collecting to appear on the leaderboard!</p>
                <Link 
                  href="/" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Open Packs
                </Link>
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-600/20 border-b border-blue-400/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Collector</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Total Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Unique Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Packs Opened</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Super Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.topCollectors.map((user, index) => (
                        <motion.tr
                          key={user.user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-white/10 hover:bg-blue-600/10 transition-colors ${
                            session?.user?.id === user.user.id ? 'ring-2 ring-blue-500/50' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getRankIcon(index + 1)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{user.user.name}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-blue-400 font-semibold">{user.totalCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-purple-400 font-semibold">{user.uniqueCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-green-400 font-semibold">{user.totalPacks.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-yellow-400 font-semibold">{user.superCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-orange-400 font-semibold">{user.averageRating?.toFixed(1) || 'N/A'}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pack Openers Tab */}
        {activeTab === 'packs' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Top Pack Openers</h2>
              <p className="text-gray-300">Players who've opened the most packs</p>
              {session?.user?.id && (
                <div className="mt-4 text-sm text-gray-400">
                  Your rank: {getCurrentUserRank(leaderboardData.topPackOpeners, session.user.id) || 'Unranked'}
                </div>
              )}
            </div>
            
            {leaderboardData.topPackOpeners.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Pack Openers Yet</h3>
                <p className="text-gray-400 mb-6">Open some packs to appear on the leaderboard!</p>
                <Link 
                  href="/" 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Open Packs
                </Link>
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-600/20 border-b border-green-400/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Pack Opener</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Packs Opened</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Total Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Unique Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Super Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Cards/Pack</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.topPackOpeners.map((user, index) => (
                        <motion.tr
                          key={user.user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-white/10 hover:bg-green-600/10 transition-colors ${
                            session?.user?.id === user.user.id ? 'ring-2 ring-green-500/50' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getRankIcon(index + 1)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{user.user.name}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-green-400 font-semibold">{user.totalPacks.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-blue-400 font-semibold">{user.totalCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-purple-400 font-semibold">{user.uniqueCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-yellow-400 font-semibold">{user.superCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-orange-400 font-semibold">
                              {user.totalPacks > 0 ? (user.totalCards / user.totalPacks).toFixed(1) : '0'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Super Hunters Tab */}
        {activeTab === 'supers' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Super Card Hunters</h2>
              <p className="text-gray-300">Players with the most Super rarity cards</p>
              {session?.user?.id && (
                <div className="mt-4 text-sm text-gray-400">
                  Your rank: {getCurrentUserRank(leaderboardData.superCollectors, session.user.id) || 'Unranked'}
                </div>
              )}
            </div>
            
            {leaderboardData.superCollectors.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Super Hunters Yet</h3>
                <p className="text-gray-400 mb-6">Collect Super cards to appear on the leaderboard!</p>
                <Link 
                  href="/" 
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Hunt for Supers
                </Link>
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-yellow-600/20 border-b border-yellow-400/30">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rank</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Super Hunter</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Super Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Total Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Unique Cards</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Packs Opened</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white">Super %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.superCollectors.map((user, index) => (
                        <motion.tr
                          key={user.user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-white/10 hover:bg-yellow-600/10 transition-colors ${
                            session?.user?.id === user.user.id ? 'ring-2 ring-yellow-500/50' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {getRankIcon(index + 1)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">{user.user.name}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-yellow-400 font-semibold">{user.superCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-blue-400 font-semibold">{user.totalCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-purple-400 font-semibold">{user.uniqueCards.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-green-400 font-semibold">{user.totalPacks.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-orange-400 font-semibold">
                              {user.totalCards > 0 ? ((user.superCards / user.totalCards) * 100).toFixed(1) : '0'}%
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {(activeTab === 'showcases' && leaderboardData.showcases.length === 0) ||
         (activeTab === 'collectors' && leaderboardData.topCollectors.length === 0) ||
         (activeTab === 'packs' && leaderboardData.topPackOpeners.length === 0) ||
         (activeTab === 'supers' && leaderboardData.superCollectors.length === 0) ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Data Yet</h3>
            <p className="text-gray-400 mb-6">Be the first to make it to the leaderboard!</p>
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Open Packs
            </Link>
          </div>
        ) : null}
      </motion.div>
      <Footer />
    </div>
  );
}