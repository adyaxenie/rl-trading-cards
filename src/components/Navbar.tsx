'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Timer, User, Menu, X, Package, Trophy, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  credits: number;
  timeUntilNext: number;
}

export default function Navbar({ credits, timeUntilNext }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const navItems = [
    { name: 'Packs', href: '/', icon: Package },
    { name: 'Collection', href: '/inventory', icon: User },
    // { name: 'Leaderboard', href: '#', icon: Trophy },
    // { name: 'Settings', href: '#', icon: Settings },
  ];

  return (
    <nav className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 transition-all duration-200"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Logo and Navigation */}
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/">
                <motion.h1 
                  className="text-xl font-black bg-white bg-clip-text text-transparent cursor-pointer tracking-wide"
                >
                  RL.TCG
                </motion.h1>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:block">
              <div className="flex space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30"
                          layoutId="navbar-active"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side - Credits and Timer */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="flex items-center space-x-4">
              {/* Credits */}
              <motion.div 
                className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-yellow-400/20 hover:border-yellow-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-yellow-400 text-sm">{credits}</span>
              </motion.div>

              {/* Timer - Hidden on mobile */}
              <motion.div 
                className="hidden sm:flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-400/20 hover:border-green-400/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
              >
                <Timer className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">
                  {formatTime(timeUntilNext)}
                </span>
              </motion.div>

              {/* Profile Avatar */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  type="button"
                  className="relative flex rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
                  id="user-menu-button"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">U1</span>
                  </div>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="sm:hidden"
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-1 px-2 pb-3 pt-2 bg-black/40 backdrop-blur-sm border-t border-white/10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center space-x-3 ${
                      isActive
                        ? 'bg-white/10 text-white border border-blue-400/30'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Timer */}
              <div className="px-3 py-2 mt-4">
                <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-green-400/20">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Next credits</span>
                  </div>
                  <span className="text-sm font-semibold text-green-400">
                    {formatTime(timeUntilNext)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 