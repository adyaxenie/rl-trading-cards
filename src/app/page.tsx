'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Package, Timer, User, Star, Trophy, Zap, LogIn, Play } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import PackOpening from '@/components/PackOpening';
import Navbar from '@/components/Navbar';
import { BackgroundBeams } from '@/components/BackgroundBeams';

export default function Home() {
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
    
    // Earn 10 credits every hour
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
    
    // Update countdown
    const nextEarnTime = new Date(lastEarned.getTime() + 60 * 60 * 1000);
    const timeLeft = Math.max(0, nextEarnTime.getTime() - now.getTime());
    setTimeUntilNext(Math.ceil(timeLeft / 1000));
  };

  const features = [
    {
      icon: Star,
      title: "Pro Player Cards",
      description: "Collect cards featuring your favorite Rocket League esports professionals with unique stats and abilities."
    },
    {
      icon: Trophy,
      title: "Multiple Rarities",
      description: "From Common to Super rare cards, each with different drop rates and special visual effects."
    },
    {
      icon: Zap,
      title: "Pack Opening",
      description: "Experience the thrill of opening packs with dramatic animations and exciting reveals."
    }
  ];

  function handleSignIn(event: React.MouseEvent<HTMLButtonElement>): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />
      
      {/* Header */}
      <Navbar credits={credits} timeUntilNext={timeUntilNext} />

      {/* Hero Section - Instant Load */}
      {!session && (
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-black h-20 mb-6 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            RL Trading Cards
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Collect your favorite Rocket League pros with unique stats and rarities. 
            Experience the thrill of opening packs and building your ultimate esports team.
          </motion.p>

          {/* Instant CTA based on session */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {session ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-400/20">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">{credits} Credits</span>
                </div>
                <Link 
                  href="/inventory" 
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                >
                  <Package className="w-5 h-5" />
                  <span>View Collection</span>
                </Link>
              </div>
            ) : (
              <div className="flex justify-center flex-col sm:flex-row gap-4 items-center w-full">
                <button
                  onClick={() => signIn('google')}
                  className="w-full md:w-1/4 flex h-12 items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  <img src="/google_logo.svg" alt="Google logo" className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
                <div className="text-center">
                  <div className="text-green-300 font-semibold">✨ 2500 Starter Pack Credits</div>
                  <div className="text-sm text-gray-400">+ 250 Daily Credits</div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </section>
      )}

      {/* Pack Opening Section - Moved Up */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            {session ? "Choose Your Pack" : "Try Opening a Pack"}
          </h2>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            {session 
              ? "Each pack contains 5 cards with different rarity distributions. Will you get the legendary Super rare you're looking for?"
              : "See what you could get! Each pack contains 5 cards with different rarities. Sign in to start collecting for real."
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="flex justify-center mb-16"
        >
          <PackOpening onPackOpened={setCredits} userCredits={credits} />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-blue-400/30 transition-all duration-300"
              >
                <Icon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
        >
          <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Pack Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-green-400 mb-2">60%</div>
              <div className="text-gray-300">Common Cards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-2">25%</div>
              <div className="text-gray-300">Rare Cards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400 mb-2">13%</div>
              <div className="text-gray-300">Epic Cards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400 mb-2">2%</div>
              <div className="text-gray-300">Super Rare</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="relative max-w-4xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-8 text-center"
        >
          <h3 className="text-3xl font-bold mb-4 text-white">
            {session ? "Keep Building Your Collection!" : "Ready to Start Your Collection?"}
          </h3>
          <p className="text-blue-200 mb-6 text-lg">
            {session 
              ? "You're earning credits automatically. Keep opening packs and collecting your favorite pros!"
              : "Join to start building your dream Rocket League roster today."
            }
          </p>
          {!session && (
            <div className="flex justify-center px-3 py-2 mt-4">
              <button
                onClick={() => signIn('google')}
                className="w-full md:w-1/2 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                <img src="/google_logo.svg" alt="Google logo" className="w-5 h-5" />
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}