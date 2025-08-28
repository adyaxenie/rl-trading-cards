'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, Package, Timer, User, Star, Trophy, Zap, LogIn, Play } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import PackOpening from '@/components/PackOpening';
import Navbar from '@/components/Navbar';
import UsernameModal from '@/components/UsernameModal';
import { BackgroundBeams } from '@/components/BackgroundBeams';
import Footer from '@/components/Footer';

export default function Home() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number>(0);
  const [lastEarned, setLastEarned] = useState<Date | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0);
  const [showUsernameModal, setShowUsernameModal] = useState<boolean>(false);

  useEffect(() => {
    if (session) {
      fetchCredits();
      const interval = setInterval(updateCredits, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Check if user needs to set username after signing in
  useEffect(() => {
    if (session?.user) {
      // Check if username is a temporary one (contains timestamp or is undefined/null)
      const username = session.user.username;
      const needsUsername = !username || 
                           username.includes('_') && /\d{13}$/.test(username) || // ends with timestamp
                           username === session.user.email?.split('@')[0]; // default email username
      
      if (needsUsername) {
        setShowUsernameModal(true);
      }
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

  const handleUsernameSet = (username: string) => {
    // Optionally refresh credits or user data after username is set
    return;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden pb-20">
      <BackgroundBeams className="z-0" />

      {/* Username Modal */}
      <UsernameModal 
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onUsernameSet={handleUsernameSet}
      />

      <section className="relative max-w-7xl mx-auto px-6 pt-20 ,b">
        {/* Hero Section with Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sm:flex justify-between mb-32"
        >
        {/* Header Content */}
        <div className="text-center lg:text-left w-full lg:w-2/3">
          <h1 className="text-4xl md:text-7xl font-bold h-28 md:h-40 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6">
            Rocket League
            <br />
            Trading Cards
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Collect your favorite Rocket League pros, open thrilling packs, and build the ultimate esports showcase. 
            Climb leaderboards, sell cards for profit, and become the top collector.
          </p>

          {/* Credits/Sign-in UI under header */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {session ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-lg border border-yellow-400/20">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">{credits?.toLocaleString() || 0} Credits</span>
                </div>
                <Link 
                  href="/packs" 
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2"
                >
                  <Package className="w-5 h-5" />
                  <span>Open Packs</span>
                </Link>
              </div>
            ) : (
              <div className="w-full md:w-3/4 flex flex-col sm:flex-row gap-4 items-center">
                <button
                  onClick={() => signIn('google', { callbackUrl: '/packs' })}
                  className="w-full flex md:w-1/2 h-12 items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  <img src="/google_logo.svg" alt="Google logo" className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
                <div className="md:w-1/2 text-center">
                  <div className="text-green-300 font-semibold">✨ 3500 Starter Pack Credits</div>
                  <div className="text-sm text-gray-400">+ 480 Daily Credits</div>
                </div>
              </div>
            )}
          </motion.div>
          </div>

          {/* Card Hand Showcase */}
          <div className="relative h-96 w-[400px] flex justify-center mt-20 md:mt-0">
          {/* Rare Card - Bottom/Back */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: -5 }}
            transition={{ delay: 0.3 }}
            className="absolute w-40 h-60 rounded-lg bg-gradient-to-br from-slate-200 via-gray-300 to-slate-400 border border-slate-300 shadow-glow-rare overflow-hidden"
            style={{ top: '80px', left: '30px' }}
          >
            <div className="absolute top-1 right-1 bg-slate-600 text-white font-bold px-1 py-0.5 rounded text-xs">
              Rare
            </div>
            <div className="absolute top-1 left-1 bg-black/80 text-white px-1 py-0.5 rounded text-xs font-bold border border-white/20">
              25%
            </div>
            <div className="w-full h-16 flex items-center justify-center">
              <User size={20} className="text-black" />
            </div>
            <div className="p-2 text-white">
              <h3 className="font-bold text-xs mb-1">Pro</h3>
              <p className="text-xs text-gray-300 mb-1">Team</p>
              <div className="text-center mb-2">
                <span className="text-sm font-bold">75</span>
                <span className="text-xs ml-1">OVR</span>
              </div>
              {/* Condensed Stats */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>DEF</span>
                  <span>72</span>
                </div>
                <div className="flex justify-between">
                  <span>OFF</span>
                  <span>78</span>
                </div>
                <div className="flex justify-between">
                  <span>MEC</span>
                  <span>74</span>
                </div>
                <div className="flex justify-between">
                  <span>CHA</span>
                  <span>76</span>
                </div>
                <div className="flex justify-between">
                  <span>IQ</span>
                  <span>75</span>
                </div>
                <div className="flex justify-between">
                  <span>SYNC</span>
                  <span>75</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Epic Card - Middle */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 5 }}
            transition={{ delay: 0.5 }}
            className="absolute w-48 h-72 rounded-lg bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-500 border-2 border-yellow-400 shadow-glow-epic overflow-hidden"
            style={{ top: '50px', left: '20%', transform: 'translateX(-50%)' }}
          >
            <div className="absolute top-1 right-1 bg-yellow-600 text-black font-bold px-1 py-0.5 rounded text-xs">
              Epic
            </div>
            <div className="absolute top-1 left-1 bg-black/80 text-white px-1 py-0.5 rounded text-xs font-bold border border-white/20">
              13%
            </div>
            <div className="w-full h-20 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div className="p-3 text-white">
              <h3 className="font-bold text-sm mb-1">Elite Pro</h3>
              <p className="text-xs text-gray-300 mb-1">Team • NA</p>
              <div className="text-center mb-2">
                <span className="text-lg font-bold">87</span>
                <span className="text-xs ml-1">OVR</span>
              </div>
              {/* Condensed Stats */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>DEF</span>
                  <span>85</span>
                </div>
                <div className="flex justify-between">
                  <span>OFF</span>
                  <span>89</span>
                </div>
                <div className="flex justify-between">
                  <span>MEC</span>
                  <span>87</span>
                </div>
                <div className="flex justify-between">
                  <span>CHA</span>
                  <span>86</span>
                </div>
                <div className="flex justify-between">
                  <span>IQ</span>
                  <span>88</span>
                </div>
                <div className="flex justify-between">
                  <span>SYNC</span>
                  <span>87</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Super Rare Card - Top/Front */}
          <motion.div
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 15 }}
            transition={{ delay: 0.7 }}
            className="absolute w-60 h-96 rounded-xl bg-gradient-to-br from-black via-gray-900 to-black border-2 border-white shadow-glow-super overflow-hidden"
            style={{ top: '20px', right: '40px' }}
          >
            <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
            <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
            <div className="absolute top-2 right-2 bg-white text-black font-bold px-2 py-1 rounded-full text-xs z-10">
              Super
            </div>
            <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-bold border border-white/20 z-10">
              2%
            </div>
            <div className="w-full h-32 flex items-center justify-center text-white">
              <User size={32} className="text-white" />
            </div>
            <div className="p-4 text-white">
              <h3 className="font-bold text-lg mb-2">Zen</h3>
              <p className="text-sm text-gray-300 mb-3">Vitality • EU</p>
              <div className="text-center mb-3">
                <span className="text-2xl font-bold">99</span>
                <span className="text-sm text-gray-400 ml-1">OVR</span>
              </div>
              {/* Condensed Stats */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="flex justify-between">
                  <span>DEF</span>
                  <span>99</span>
                </div>
                <div className="flex justify-between">
                  <span>OFF</span>
                  <span>99</span>
                </div>
                <div className="flex justify-between">
                  <span>MEC</span>
                  <span>99</span>
                </div>
                <div className="flex justify-between">
                  <span>CHA</span>
                  <span>99</span>
                </div>
                <div className="flex justify-between">
                  <span>IQ</span>
                  <span>99</span>
                </div>
                <div className="flex justify-between">
                  <span>SYNC</span>
                  <span>99</span>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section className="relative z-0 max-w-7xl mx-auto px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
                onClick={() => signIn('google', { callbackUrl: '/packs' })}
                className="w-full md:w-1/2 flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
              >
                <img src="/google_logo.svg" alt="Google logo" className="w-5 h-5" />
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
        </motion.div>
      </section>
      <Footer />
    </div>
  );
}