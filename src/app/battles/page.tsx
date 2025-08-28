'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Swords, Zap, Users, Clock, Trophy, Star, Target, Shield, Crown, Link, Car } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { BackgroundBeams } from '@/components/BackgroundBeams';
import Footer from '@/components/Footer';

export default function Battles() {
  const { data: session, status } = useSession();

  const navigate = useRouter();

//   if (status === 'unauthenticated') {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view battles</h1>
//           <button 
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors" 
//             onClick={() => signIn('google')}
//           >
//             Sign In
//           </button>
//         </div>
//       </div>
//     );
//   }

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />

      <div className="relative z-0 max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
            <Swords className="w-10 h-10 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Showcase Battles</h1>
            <Swords className="w-10 h-10 text-yellow-400" />
            </div>
        </div>

        {/* Coming Soon Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-orange-400/30 rounded-2xl p-12 text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Coming Soon</h2>
          <p className="text-xl text-orange-200 mb-6 max-w-2xl mx-auto">
            Working hard to bring you a system where your cards come to life in simulated 3v3s.
          </p>
          {/* <div className="bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 rounded-lg px-6 py-3 inline-block">
            <Clock className="w-5 h-5 text-orange-400 inline mr-2" />
            <span className="text-orange-300 font-semibold">Expected: Q2 2025</span>
          </div> */}
        </motion.div>

        {/* Planned Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Planned Battle Features
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-blue-400/30 transition-all duration-300">
              <Car className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">1v1 Battles</h4>
              <p className="text-gray-300">Challenge other collectors to battles using your favorite pro players.</p>
            </div>

            {/* <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-purple-400/30 transition-all duration-300">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Tournament Mode</h4>
              <p className="text-gray-300">Enter weekly tournaments with entry fees and exclusive card rewards for winners.</p>
            </div> */}

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-green-400/30 transition-all duration-300">
              <Target className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Team Building</h4>
              <p className="text-gray-300">Create your custom 3v3 team by adding players to your showcase lineup.</p>
            </div>

            {/* <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-yellow-400/30 transition-all duration-300">
              <Shield className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Card Abilities</h4>
              <p className="text-gray-300">Each pro card will have unique abilities based on their real-world playstyle and skills.</p>
            </div> */}

            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-red-400/30 transition-all duration-300">
              <Crown className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Ranked System</h4>
              <p className="text-gray-300">Climb through ranked tiers from Bronze to Grand Champion (Top 10 for SSL).</p>
            </div>

            {/* <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center hover:border-orange-400/30 transition-all duration-300">
              <Zap className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-3">Special Events</h4>
              <p className="text-gray-300">Limited-time battle events with unique rules and exclusive rewards.</p>
            </div> */}
          </div>
        </motion.div>

        {/* Battle Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-8 mb-16"
        >
          <h3 className="text-2xl font-bold mb-6 text-center text-white">Battle System Preview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Player 1 */}
            <div className="text-center">
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-4">
                <div className="w-16 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg mx-auto mb-3"></div>
                <div className="text-white font-semibold">Your Deck</div>
                <div className="text-blue-300 text-sm">3 Cards</div>
              </div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">VS</div>
              <div className="text-orange-400 font-semibold">Coming Soon!</div>
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-4">
                <div className="w-16 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-lg mx-auto mb-3"></div>
                <div className="text-white font-semibold">Opponent</div>
                <div className="text-red-300 text-sm">3 Cards</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Get Ready Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-8 text-center"
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-3xl font-bold mb-4 text-white">Start Building Your Battle Deck</h3>
          <p className="text-blue-200 mb-6 text-lg max-w-2xl mx-auto">
            While battles are in development, keep collecting and building your roster. The stronger your collection, 
            the better prepared you'll be for epic card battles!
          </p>
            <motion.button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg
                         font-semibold transition-colors"
                onClick={() => navigate.push('/inventory')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Build Your Showcase
            </motion.button>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}