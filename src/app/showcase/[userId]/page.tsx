'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Trophy, ArrowLeft, Package, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

interface UserShowcaseData {
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

export default function PublicShowcase() {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params.userId as string;
  
  const [showcaseData, setShowcaseData] = useState<UserShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(100);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);

  useEffect(() => {
    if (userId) {
      fetchShowcaseData();
    }
    if (session?.user?.id) {
      fetchCredits();
    }
  }, [userId, session]);

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

  const fetchShowcaseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/showcase/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setShowcaseData(data);
      } else {
        setError(data.error || 'Failed to fetch showcase');
      }
    } catch (error) {
      console.error('Error fetching showcase:', error);
      setError('Failed to load showcase');
    } finally {
      setLoading(false);
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

  const getPositionTitle = (position: number) => {
    switch (position) {
      case 1: return 'Position 1';
      case 2: return 'Position 2';
      case 3: return 'Position 3';
      default: return 'Showcase';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !showcaseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
        <BackgroundBeams className="z-0" />
        
        <div className="relative z-10 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Showcase Not Found</h1>
            <p className="text-gray-400 mb-6">{error || 'This user doesn\'t have a showcase yet.'}</p>
            <div className="space-x-4">
              <Link 
                href="/leaderboard"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View Leaderboard
              </Link>
              <Link 
                href="/"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
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
        className="relative z-10 max-w-7xl mx-auto p-6"
      >
        <div className="flex items-center space-x-4 mb-6">
          <Link 
            href="/leaderboard"
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Leaderboard</span>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Crown className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">{showcaseData.user.name}'s Showcase</h1>
            <Crown className="w-10 h-10 text-purple-400" />
          </div>
          
          {showcaseData.stats && (
            <div className="flex items-center justify-center space-x-8 text-gray-300">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-400" />
                <span>{showcaseData.stats.totalCards} Total Cards</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-purple-400" />
                <span>{showcaseData.stats.uniqueCards} Unique Players</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Showcase Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 max-w-7xl mx-auto px-6 pb-12"
      >
        {showcaseData.showcase.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Showcase Set</h3>
            <p className="text-gray-400 mb-6">{showcaseData.user.name} hasn't set up their showcase yet.</p>
            <Link 
              href="/leaderboard"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Other Showcases
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((position) => {
              const showcasePlayer = showcaseData.showcase.find(s => s.position === position);
              return (
                <motion.div
                  key={position}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + position * 0.1 }}
                  className={`relative rounded-2xl p-8 text-center min-h-[400px] flex flex-col items-center justify-center transition-all duration-500 hover:scale-105 ${
                    showcasePlayer 
                      ? `bg-gradient-to-br ${rarityColors[showcasePlayer.player.rarity]} ${rarityBorder[showcasePlayer.player.rarity]} border-4 ${rarityGlow[showcasePlayer.player.rarity]}`
                      : 'border-gray-600 bg-gray-600/10 border-4'
                  }`}
                >
                  {/* Position Badge */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 flex items-center space-x-2">
                    <span className="text-2xl">{getPositionIcon(position)}</span>
                    <span className="text-white font-semibold">{getPositionTitle(position)}</span>
                  </div>

                  {showcasePlayer ? (
                    <>
                      {/* Player Image Placeholder */}
                      <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-full mb-6 flex items-center justify-center border-2 border-current">
                        <Users className="w-16 h-16 text-white opacity-60" />
                      </div>

                      {/* Player Info */}
                      <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {showcasePlayer.player.name}
                        </h3>
                        
                        <div className="text-lg text-white/80 mb-4">
                          {showcasePlayer.player.team}
                        </div>

                        <div className="bg-black/30 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white/80 mr-4">Overall Rating</span>
                            <span className="text-3xl font-bold text-white">
                              {showcasePlayer.player.overall_rating}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-white/80">Rarity</span>
                            <span className={`font-bold text-lg px-2 py-1 rounded ${rarityBadgeStyle[showcasePlayer.player.rarity]}`}>
                              {showcasePlayer.player.rarity}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-white/80">Region</span>
                            <span className="text-white font-semibold">
                              {showcasePlayer.player.region}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-32 h-32 bg-gray-600/20 rounded-full mb-6 flex items-center justify-center border-2 border-gray-600">
                        <Package className="w-16 h-16 text-gray-500" />
                      </div>
                      <div className="text-gray-500">
                        <div className="text-lg font-semibold mb-2">Position {position}</div>
                        <div className="text-sm">Empty Slot</div>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 space-x-4 mb-20"
        >
          <Link 
            href="/leaderboard"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            View More Showcases
          </Link>
          
          {session?.user?.id && (
            <Link 
              href="/inventory"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Manage Your Showcase
            </Link>
          )}
        </motion.div>
      </motion.div>
      <Footer />
    </div>
  );
}