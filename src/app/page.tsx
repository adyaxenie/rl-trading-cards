'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Package, Timer, User } from 'lucide-react';
import Link from 'next/link';
import PackOpening from '@/components/PackOpening';
import Navbar from '@/components/Navbar';
import { BackgroundBeams } from '@/components/BackgroundBeams';

export default function Home() {
  const [credits, setCredits] = useState<number>(100);
  const [lastEarned, setLastEarned] = useState<Date | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);

  useEffect(() => {
    fetchCredits();
    const interval = setInterval(updateCredits, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchCredits = async (): Promise<void> => {
    try {
      const response = await fetch('/api/credits');
      const data = await response.json();
      setCredits(data.credits);
      setLastEarned(new Date(data.lastEarned));
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const updateCredits = async (): Promise<void> => {
    if (!lastEarned) return;
    
    const now = new Date();
    const timeDiff = now.getTime() - lastEarned.getTime();
    const hoursSinceLastEarn = timeDiff / (1000 * 60 * 60);
    
    // Earn 10 credits every hour
    if (hoursSinceLastEarn >= 1) {
      try {
        const response = await fetch('/api/credits', { method: 'POST' });
        const data = await response.json();
        setCredits(data.credits);
        setLastEarned(new Date());
      } catch (error) {
        console.error('Error earning credits:', error);
      }
    }
    
    // Update countdown
    const nextEarnTime = new Date(lastEarned.getTime() + 60 * 60 * 1000);
    const timeLeft = Math.max(0, nextEarnTime.getTime() - now.getTime());
    setTimeUntilNext(Math.ceil(timeLeft / 1000));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <BackgroundBeams className="z-0" />
      
      {/* Header */}
      <Navbar credits={credits} timeUntilNext={timeUntilNext} />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Open Packs & Collect Pro Players
          </h2>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Collect your favorite Rocket League pros with unique stats and rarities. 
            Experience the thrill of opening packs and building your ultimate team!
          </p>
        </motion.div>

        {/* Pack Opening Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-12"
        >
          <PackOpening onPackOpened={setCredits} />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-yellow-400/30 transition-all duration-300">
            <Package className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-white">Standard Pack</h3>
            <p className="text-yellow-200 mb-4">5 cards with standard odds</p>
            <div className="text-2xl font-bold text-yellow-400 mb-3">50 Credits</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Super:</span> <span className="text-yellow-300">2%</span>
              </div>
              <div className="flex justify-between">
                <span>Epic:</span> <span className="text-purple-400">10%</span>
              </div>
              <div className="flex justify-between">
                <span>Rare:</span> <span className="text-blue-400">29%</span>
              </div>
              <div className="flex justify-between">
                <span>Common:</span> <span className="text-gray-400">59%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 backdrop-blur-sm border border-purple-400/20 rounded-xl p-6 text-center hover:border-purple-400/50 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              HOT!
            </div>
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Premium Pack</h3>
            <p className="text-purple-200 mb-4">5 cards with BOOSTED Super odds!</p>
            <div className="text-2xl font-bold text-purple-400 mb-3">200 Credits</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Super:</span> <span className="text-yellow-300 font-bold">50%</span>
              </div>
              <div className="flex justify-between">
                <span>Epic:</span> <span className="text-purple-400">30%</span>
              </div>
              <div className="flex justify-between">
                <span>Rare:</span> <span className="text-blue-400">16%</span>
              </div>
              <div className="flex justify-between">
                <span>Common:</span> <span className="text-gray-400">4%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}