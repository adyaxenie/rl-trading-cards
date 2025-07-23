// components/Navbar.tsx - Updated for App Router
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Timer, User, Menu, X, Package, Trophy, Settings, CheckCircle, Clock, Gift, Target, RefreshCw, CreditCard, ShoppingCart } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCredits } from '@/contexts/CreditsContext';

interface Task {
  id: number;
  user_id: number;
  task_id: number;
  progress: number;
  completed: boolean;
  completed_at: Date | null;
  claimed: boolean;
  claimed_at: Date | null;
  task: {
    id: number;
    title: string;
    description: string;
    task_type: string;
    target_value: number;
    reward_credits: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    is_repeatable: boolean;
    category: string;
  };
}

interface CreditPackage {
  id: string;
  price: number;
  credits: number;
  bonus: number;
  popular?: boolean;
  value: string;
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    price: 5,
    credits: 500,
    bonus: 0,
    value: 'Good value'
  },
  {
    id: 'popular',
    price: 10,
    credits: 1000,
    bonus: 200,
    popular: true,
    value: 'Most popular'
  },
  {
    id: 'premium',
    price: 25,
    credits: 2500,
    bonus: 700,
    value: 'Great value'
  },
  {
    id: 'mega',
    price: 50,
    credits: 5000,
    bonus: 2000,
    value: 'Best value'
  },
  {
    id: 'ultimate',
    price: 100,
    credits: 10000,
    bonus: 5000,
    value: 'Ultimate deal'
  }
];

export default function Navbar() {
  const { credits, setCredits, refreshCredits, availableCredits, setAvailableCredits } = useCredits();
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tasksDropdownOpen, setTasksDropdownOpen] = useState(false);
  const [creditsDropdownOpen, setCreditsDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [isRefreshingTasks, setIsRefreshingTasks] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [isClaimingCredits, setIsClaimingCredits] = useState(false);
  const [isClaimingTask, setIsClaimingTask] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [isClaimingAllTasks, setIsClaimingAllTasks] = useState(false);

  const pathname = usePathname();

  // Calculate countdown locally
  const calculateTimeUntilReset = (): number => {
    const now = new Date();
    const nextReset = new Date();
    
    // Set to 8 AM UTC (reset time)
    nextReset.setUTCHours(2, 0, 0, 0);
    
    // If reset time has passed today, move to tomorrow
    if (now >= nextReset) {
      nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    }
    
    return Math.max(0, Math.floor((nextReset.getTime() - now.getTime()) / 1000));
  };

  // Load credits and tasks
  useEffect(() => {
    if (session?.user) {
      loadCreditsAndTasks();
      
      const interval = setInterval(() => {
        loadCreditsAndTasks();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [session]);

  // Update countdown every second
  useEffect(() => {
    if (timeUntilNext > 0) {
      const interval = setInterval(() => {
        setTimeUntilNext(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Reset happened, reload data with delay
            setTimeout(() => {
              loadCreditsAndTasks();
            }, 1000);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [timeUntilNext]);

  const loadCreditsAndTasks = async () => {
    // Debounce API calls
    const now = Date.now();
    if (now - lastApiCall < 5000) {
      return;
    }
    setLastApiCall(now);

    try {
      // Use context refresh instead
      await refreshCredits();

      // Set the timer after refreshing credits
      if (availableCredits === 0) {
        setTimeUntilNext(calculateTimeUntilReset());
      } else {
        setTimeUntilNext(0);
      }

      // Load tasks
      const tasksResponse = await fetch('/api/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks);
        setUnclaimedCount(tasksData.unclaimedCount);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleClaimAllTasks = async () => {
    if (isClaimingAllTasks || completedTasks.length === 0) return;
    
    setIsClaimingAllTasks(true);
    try {
      const response = await fetch('/api/tasks/claim-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`Successfully claimed ${data.claimedTasks} tasks for ${data.totalCredits} total credits!`);        
        
        // Update credits if you have the setter available
        if (setCredits && data.newBalance) {
          setCredits(data.newBalance);
        }
        
        // Refresh both credits and tasks
        await loadCreditsAndTasks();
        
        // Force refresh tasks specifically if you have the function
        if (refreshTasks) {
          await refreshTasks();
        }
      } else {
        console.error('Failed to claim all tasks:', data.error);
      }
    } catch (error) {
      console.error('Error claiming all tasks:', error);
    } finally {
      setIsClaimingAllTasks(false);
    }
  };

  const handleClaimCredits = async () => {
    if (isClaimingCredits || availableCredits <= 0) return;
    
    setIsClaimingCredits(true);
    try {
      const response = await fetch('/api/credits', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok) {
        setCredits(data.credits); // Updates globally via context
        setAvailableCredits(0);
        setTimeUntilNext(calculateTimeUntilReset()); // Set timer after claiming
      } else {
        console.error('Failed to claim credits:', data.error);
      }
    } catch (error) {
      console.error('Error claiming credits:', error);
    } finally {
      setIsClaimingCredits(false);
    }
  };

  const handlePurchaseCredits = async (packageId: string) => {
    if (!session || isPurchasing) return;
    
    setIsPurchasing(packageId);
    
    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/`,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error('Payment error:', error);
        alert('Failed to initiate payment. Please try again.');
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsPurchasing(null);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-400/30';
      case 'medium': return 'text-yellow-400 border-yellow-400/30';
      case 'hard': return 'text-orange-400 border-orange-400/30';
      case 'expert': return 'text-red-400 border-red-400/30';
      default: return 'text-gray-400 border-gray-400/30';
    }
  };

  const refreshTasks = async () => {
    setIsRefreshingTasks(true);
    try {
      const tasksResponse = await fetch('/api/tasks');
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks);
        setUnclaimedCount(tasksData.unclaimedCount);
      }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setTimeout(() => setIsRefreshingTasks(false), 500); // Small delay for visual feedback
    }
  };

  const handleSignIn = () => {
    signIn('google');
  };

  const handleSignOut = () => {
    signOut();
    setUserDropdownOpen(false);
  };

  const handleClaimTask = async (userTaskId: number) => {
    if (isClaimingTask) return;
    
    setIsClaimingTask(userTaskId);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userTaskId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadCreditsAndTasks(); // Refresh both credits and tasks
      } else {
        console.error('Failed to claim task reward:', data.error);
      }
    } catch (error) {
      console.error('Error claiming task reward:', error);
    } finally {
      setIsClaimingTask(null);
    }
  };

  const navItems = [
    { name: 'Packs', href: '/', icon: Package },
    { name: 'Collection', href: '/inventory', icon: User },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  const completedTasks = tasks.filter(t => t.completed && !t.claimed);
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 5);

  function formatTime(timeUntilNext: number) {
    const hours = Math.floor(timeUntilNext / 3600);
    const minutes = Math.floor((timeUntilNext % 3600) / 60);
    const seconds = timeUntilNext % 60;
    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      `${seconds}s`
    ].filter(Boolean).join(' ');
  }

  return (
    <nav className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          {/* Mobile menu button */}
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <button
              type="button"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/50 transition-all duration-200"
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
          <div className="flex flex-1 items-center ml-10 md:ml-0 md:mr-10 md:justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/">
                <motion.h1 className="text-xl font-black bg-white bg-clip-text text-transparent cursor-pointer tracking-wide">
                  <em>RL.TCG</em>
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
                      className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30 -z-10"
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

          {/* Right side - Tasks, Credits, Purchase, and User */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <div className="flex items-center space-x-4">
              {/* Tasks Dropdown */}
              {session && (
                <div className="relative">
                  <motion.button
                    onClick={() => setTasksDropdownOpen(!tasksDropdownOpen)}
                    className="relative flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-purple-400/20 hover:border-purple-400/40 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="font-semibold text-purple-400 text-sm hidden sm:inline">Tasks</span>
                    {unclaimedCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unclaimedCount}
                      </div>
                    )}
                  </motion.button>

                  {/* Tasks Dropdown Menu */}
                  <AnimatePresence>
                    {tasksDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-2 w-screen sm:w-96 max-w-sm sm:max-w-none bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto mx-2 sm:mx-0"
                      >
                        <div className="py-2">
                          {/* Header with refresh button */}
                          <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white">Tasks & Progression</h3>
                            <motion.button
                              onClick={refreshTasks}
                              disabled={isRefreshingTasks}
                              className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="Refresh tasks"
                            >
                              <RefreshCw 
                                className={`w-3 h-3 text-gray-300 ${isRefreshingTasks ? 'animate-spin' : ''}`} 
                              />
                            </motion.button>
                          </div>

                          {/* Completed Tasks */}
                          {completedTasks.length > 0 && (
                            <div className="px-4 py-2 border-b border-white/10">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-medium text-green-400">Ready to Claim</h4>
                                {completedTasks.length > 1 && (
                                  <motion.button
                                    onClick={handleClaimAllTasks}
                                    disabled={isClaimingAllTasks}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {isClaimingAllTasks ? (
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Gift className="w-3 h-3" />
                                        <span>Claim All ({completedTasks.reduce((sum, task) => sum + task.task.reward_credits, 0).toLocaleString()})</span>
                                      </>
                                    )}
                                  </motion.button>
                                )}
                              </div>
                              {completedTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between py-2 px-2 bg-green-500/10 rounded mb-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{task.task.title}</p>
                                    <p className="text-xs text-gray-300 truncate">{task.task.description}</p>
                                  </div>
                                  <button
                                    onClick={() => handleClaimTask(task.id)}
                                    disabled={isClaimingTask === task.id || isClaimingAllTasks}
                                    className="ml-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1 flex-shrink-0"
                                  >
                                    {(isClaimingTask === task.id || isClaimingAllTasks) ? (
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Gift className="w-3 h-3" />
                                        <span>{task.task.reward_credits.toLocaleString()}</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Active Tasks */}
                          <div className="px-4 py-2">
                            <h4 className="text-xs font-medium text-blue-400 mb-2">Active Tasks</h4>
                            {activeTasks.length > 0 ? (
                              activeTasks.map((task) => (
                                <div key={task.id} className="py-2 px-2 hover:bg-white/5 rounded mb-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{task.task.title}</p>
                                      <p className="text-xs text-gray-300 truncate">{task.task.description}</p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div className="bg-gray-700 rounded-full h-2 flex-1 max-w-16 sm:max-w-24">
                                          <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((task.progress / task.task.target_value) * 100, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{task.progress}/{task.task.target_value}</span>
                                      </div>
                                    </div>
                                    <div className="ml-2 text-right flex-shrink-0">
                                      <div className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(task.task.difficulty)}`}>
                                        {task.task.difficulty}
                                      </div>
                                      <div className="text-xs text-yellow-400 mt-1">+{task.task.reward_credits.toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400">No active tasks</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Credits Display with Purchase Option */}
              <div className="relative">
                <motion.button
                  onClick={availableCredits > 0 ? handleClaimCredits : () => setCreditsDropdownOpen(!creditsDropdownOpen)}
                  disabled={availableCredits > 0 ? isClaimingCredits : false}
                  className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg border transition-all duration-300 ${
                    availableCredits > 0 
                      ? 'bg-green-500/20 border-green-400/40 hover:border-green-400/60 cursor-pointer' 
                      : 'bg-black/30 border-yellow-400/20 hover:border-yellow-400/40 cursor-pointer'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={availableCredits > 0 ? "Click to claim 480 daily credits!" : `Credits: ${credits?.toLocaleString() || 0} - Click to buy more`}
                >
                  {availableCredits > 0 ? (
                    <>
                      <Gift className="w-4 h-4 text-green-400" />
                      <span className="font-semibold text-green-400 text-sm">
                        {isClaimingCredits ? 'Claiming...' : 'Daily 480 Credits'}
                      </span>
                    </>
                  ) : (
                    <>
                      {session && (
                        <div className="w-4 h-4 bg-yellow-400/20 border border-yellow-400/40 text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                          +
                        </div>
                      )}
                      <span className="font-semibold text-yellow-400 text-sm">{credits?.toLocaleString() || 0}</span>
                      <Coins className="w-4 h-4 text-yellow-400" />
                      {timeUntilNext > 0 && (
                        <span className="w-24 text-xs text-gray-400 hidden sm:inline">
                          ({formatTime(timeUntilNext)})
                        </span>
                      )}
                    </>
                  )}
                </motion.button>

                {/* Credits Purchase Dropdown - only show when not claiming daily credits */}
                {session && availableCredits <= 0 && (
                  <AnimatePresence>
                    {creditsDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50"
                      >
                        <div className="py-3">
                          <div className="px-4 py-2 border-b border-white/10">
                            <h3 className="text-sm font-medium text-white flex items-center">
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Purchase Credits
                            </h3>
                          </div>
                          
                          <div className="px-2 py-2 space-y-2 max-h-80 overflow-y-auto">
                            {creditPackages.map((pkg) => (
                              <motion.div
                                key={pkg.id}
                                className="relative p-3 rounded-lg border bg-white/5 border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handlePurchaseCredits(pkg.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="text-white font-semibold">
                                    {(pkg.credits + pkg.bonus).toLocaleString()} Credits
                                  </div>
                                  
                                  <div className="text-lg font-bold text-white">
                                    ${pkg.price}
                                  </div>
                                </div>
                                
                                {isPurchasing === pkg.id && (
                                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                          
                          <div className="px-4 py-2 border-t border-white/10">
                            <p className="text-xs text-gray-400 text-center">
                              Secure payments powered by Stripe
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* User Authentication */}
              {status === 'loading' ? (
                <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
              ) : session ? (
                <div className="relative">
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="relative flex rounded-full bg-white/10 p-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200"
                    >
                      <span className="sr-only">Open user menu</span>
                      <img
                        src={session.user.image || '/default-avatar.png'}
                        alt="Profile"
                        className="h-8 w-8 rounded-full"
                      />
                    </button>
                  </motion.div>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50"
                      >
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-white/10">
                            <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                            <p className="text-xs text-gray-300 truncate">{session.user?.email}</p>
                          </div>
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <motion.button
                  onClick={handleSignIn}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Click outside to close dropdowns */}
      {(userDropdownOpen || tasksDropdownOpen || creditsDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserDropdownOpen(false);
            setTasksDropdownOpen(false);
            setCreditsDropdownOpen(false);
          }}
        />
      )}

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

              {/* Mobile Credit Purchase */}
              {session && (
                <div className="px-3 py-2 mt-4">
                  <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                    <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase Credits
                    </h4>
                    <div className="space-y-2">
                      {creditPackages.slice(0, 3).map((pkg) => (
                        <button
                          key={pkg.id}
                          onClick={() => handlePurchaseCredits(pkg.id)}
                          disabled={isPurchasing === pkg.id}
                          className="w-full flex items-center justify-between py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <div className="text-left">
                            <span className="text-sm text-white font-medium">
                              {pkg.credits.toLocaleString()} Credits
                            </span>
                            {pkg.bonus > 0 && (
                              <span className="ml-2 text-xs text-green-400">
                                +{pkg.bonus.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-white font-bold">
                            {isPurchasing === pkg.id ? '...' : `${pkg.price}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Authentication */}
              {session ? (
                <div className="px-3 py-2 mt-4">
                  <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                    <div className="flex items-center space-x-2 mb-2">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="w-8 h-8 rounded-full bg-gray-700 object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg">
                          {session.user.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-white font-medium">{session.user.name}</p>
                        <p className="text-xs text-gray-300 truncate">{session.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 mt-4">
                  <button
                    onClick={handleSignIn}
                    className="w-full flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In with Google</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}