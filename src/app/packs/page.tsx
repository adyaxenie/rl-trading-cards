'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Package, Timer, ArrowLeft, Trophy, User, TrendingUp, Box } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import PackOpening from '@/components/PackOpening';
import Navbar from '@/components/Navbar';
import { BackgroundBeams } from '@/components/BackgroundBeams';
import Footer from '@/components/Footer';

export default function Packs() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number>(0);
  const [lastEarned, setLastEarned] = useState<Date | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);

  useEffect(() => {
    if (session) {
      fetchCredits();
      const interval = setInterval(updateCredits, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchCredits = async (): Promise<void> => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setLastEarned(new Date(data.lastEarned));
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const updateCredits = async (): Promise<void> => {
    if (!lastEarned || !session) return;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastEarned.getTime();
    const hoursSinceLastEarn = timeDiff / (1000 * 60 * 60);
    
    if (hoursSinceLastEarn >= 1) {
      try {
        const response = await fetch('/api/credits', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          setCredits(data.credits);
          setLastEarned(new Date());
        }
      } catch (error) {
        console.error('Error earning credits:', error);
      }
    }
    
    const nextEarnTime = new Date(lastEarned.getTime() + 60 * 60 * 1000);
    const timeLeft = Math.max(0, nextEarnTime.getTime() - now.getTime());
    setTimeUntilNext(Math.ceil(timeLeft / 1000));
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

    if (status === 'unauthenticated') {
        return (
        <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
            <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view your inventory</h1>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors" onClick={() => signIn('google')}>
                Sign In
            </button>
            </div>
        </div>
        );
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />

      <div className="relative z-0 max-w-7xl mx-auto p-6">
        {/* Header */}

        <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
            <Box className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Packs</h1>
            <Box className="w-10 h-10 text-yellow-400" />
            </div>
            <p className="text-blue-200 text-lg">Choose your pack and discover legendary players</p>
        </div>


        {/* Pack Opening - Centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex justify-center mb-12"
        >
          <PackOpening onPackOpened={setCredits} />
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Link 
            href="/inventory"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
          >
            <Package className="w-5 h-5" />
            <span>View Collection</span>
          </Link>
          
          <Link 
            href="/leaderboard"
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 border border-white/20"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Leaderboard</span>
          </Link>
        </motion.div>

      </div>

      <Footer />
    </div>
  );
}