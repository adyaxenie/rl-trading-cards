'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Package, Timer } from 'lucide-react';
import PackOpening from '@/components/PackOpening';

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
    <div className="min-h-screen bg-metal-900">
      {/* Header */}
      <motion.header 
        className="bg-metal-800 border-b border-metal-700 p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 
                         bg-clip-text text-transparent">
            RL Trading Cards
          </h1>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-metal-700 px-4 py-2 rounded-lg">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">{credits}</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-metal-700 px-4 py-2 rounded-lg">
              <Timer className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">
                Next credits: {formatTime(timeUntilNext)}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold mb-4">
            Open Packs & Collect Pro Players
          </h2>
          <p className="text-gray-400 text-lg">
            Collect your favorite Rocket League pros with unique stats and rarities
          </p>
        </motion.div>

        {/* Pack Opening Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center mb-8"
        >
          <PackOpening onPackOpened={setCredits} />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-metal-800 border border-metal-700 rounded-lg p-6 text-center">
            <Package className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Standard Pack</h3>
            <p className="text-gray-400 mb-4">5 cards guaranteed</p>
            <div className="text-2xl font-bold text-yellow-400">50 Credits</div>
          </div>
          
          <div className="bg-metal-800 border border-metal-700 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Rarity System</h3>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Common: &lt;70 OVR</div>
              <div>Rare: 70-79 OVR</div>
              <div>Epic: 80-89 OVR</div>
              <div className="text-white font-semibold">Super: 90+ OVR</div>
            </div>
          </div>
          
          <div className="bg-metal-800 border border-metal-700 rounded-lg p-6 text-center">
            <Coins className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Earn Credits</h3>
            <p className="text-gray-400 mb-4">+10 credits every hour</p>
            <div className="text-lg font-semibold text-green-400">
              Next: {formatTime(timeUntilNext)}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}