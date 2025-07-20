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
      
      <Navbar credits={credits} timeUntilNext={timeUntilNext} />

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
        className="relative z-0 max-w-7xl mx-auto px-6 pb-12"
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
              leaderboardData.showcases.map((userShowcase, index) => (
              <motion.div
                key={userShowcase.user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-400/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-600/20 rounded-full border border-purple-400/30">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{userShowcase.user.name}</h3>
                      {userShowcase.stats && (
                        <div className="flex items-center space-x-4 text-sm text-gray-300">
                          <span>{userShowcase.stats.totalCards} total cards</span>
                          <span>{userShowcase.stats.uniqueCards} unique</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/showcase/${userShowcase.user.id}`}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    View Full
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((position) => {
                    const player = userShowcase.showcase.find(s => s.position === position);
                    return (
                      <div
                        key={position}
                        className={`border rounded-lg p-4 text-center min-h-[140px] flex flex-col items-center justify-center transition-all duration-300 ${
                          player ? getRarityColor(player.player.rarity) : 'border-gray-600 bg-gray-600/10'
                        }`}
                      >
                        <div className="text-2xl mb-2">{getPositionIcon(position)}</div>
                        {player ? (
                          <>
                            <div className="text-sm font-semibold text-white mb-1">
                              {player.player.name}
                            </div>
                            <div className="text-xs text-gray-300 mb-1">
                              {player.player.team}
                            </div>
                            <div className="text-lg font-bold text-yellow-400">
                              {player.player.overall_rating}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500">Empty</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
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
    </div>
  );
}