'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Timer, User, Menu, X, Package, Trophy, Settings, CheckCircle, Clock, Gift, Target } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

interface NavbarProps {
  credits: number;
  timeUntilNext?: number;
}

export default function Navbar({ credits = 0, timeUntilNext }: NavbarProps) {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [tasksDropdownOpen, setTasksDropdownOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [dailyTimeUntilNext, setDailyTimeUntilNext] = useState(0);
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [isClaimingTask, setIsClaimingTask] = useState<number | null>(null);
  const pathname = usePathname();

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Load tasks and daily claim status
  useEffect(() => {
    if (session?.user) {
      loadTasks();
      loadDailyClaimStatus();
      
      const interval = setInterval(() => {
        loadDailyClaimStatus();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setUnclaimedCount(data.unclaimedCount);
        console.log('Loaded tasks:', data.tasks);
      }
      else {
        console.error('Failed to load tasks:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadDailyClaimStatus = async () => {
    try {
      const response = await fetch('/api/daily-credits');
      if (response.ok) {
        const data = await response.json();
        setCanClaimDaily(data.canClaim);
        setDailyTimeUntilNext(data.timeUntilNext);
      }
    } catch (error) {
      console.error('Error loading daily claim status:', error);
    }
  };

  const handleSignIn = () => {
    signIn('google');
  };

  const handleSignOut = () => {
    signOut();
    setUserDropdownOpen(false);
  };

  const handleClaimDaily = async () => {
    if (isClaimingDaily || !canClaimDaily) return;
    
    setIsClaimingDaily(true);
    try {
      const response = await fetch('/api/daily-credits', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setCanClaimDaily(false);
        // Trigger a page refresh to update credits
        window.location.reload();
      } else {
        console.error('Failed to claim daily credits:', data.error);
      }
    } catch (error) {
      console.error('Error claiming daily credits:', error);
    } finally {
      setIsClaimingDaily(false);
    }
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
        await loadTasks(); // Refresh tasks
        // Trigger a page refresh to update credits
        window.location.reload();
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
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 5); // Show 5 active tasks

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

          {/* Right side - Tasks, Credits, Timer, and User */}
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
                        className="absolute right-0 top-full mt-2 w-96 bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                      >
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-white/10">
                            <h3 className="text-sm font-medium text-white">Tasks & Progression</h3>
                          </div>

                          {/* Completed Tasks */}
                          {completedTasks.length > 0 && (
                            <div className="px-4 py-2 border-b border-white/10">
                              <h4 className="text-xs font-medium text-green-400 mb-2">Ready to Claim</h4>
                              {completedTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between py-2 px-2 bg-green-500/10 rounded mb-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-white font-medium">{task.task.title}</p>
                                    <p className="text-xs text-gray-300">{task.task.description}</p>
                                  </div>
                                  <button
                                    onClick={() => handleClaimTask(task.id)}
                                    disabled={isClaimingTask === task.id}
                                    className="ml-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-3 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                                  >
                                    {isClaimingTask === task.id ? (
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
                                    <div className="flex-1">
                                      <p className="text-sm text-white font-medium">{task.task.title}</p>
                                      <p className="text-xs text-gray-300">{task.task.description}</p>
                                      <div className="flex items-center space-x-2 mt-1">
                                        <div className="bg-gray-700 rounded-full h-2 flex-1 max-w-24">
                                          <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((task.progress / task.task.target_value) * 100, 100)}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-400">{task.progress}/{task.task.target_value}</span>
                                      </div>
                                    </div>
                                    <div className="ml-2 text-right">
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

              {/* Daily Credits */}
              <motion.button
                onClick={handleClaimDaily}
                disabled={!canClaimDaily || isClaimingDaily}
                className={`flex items-center space-x-2 backdrop-blur-sm px-3 py-2 rounded-lg border transition-all duration-300 ${
                  canClaimDaily 
                    ? 'bg-green-500/20 border-green-400/40 hover:border-green-400/60 cursor-pointer' 
                    : 'bg-black/30 border-yellow-400/20 hover:border-yellow-400/40 cursor-default'
                }`}
                whileHover={canClaimDaily ? { scale: 1.05 } : {}}
                whileTap={canClaimDaily ? { scale: 0.95 } : {}}
                title={canClaimDaily ? "Click to claim 250 daily credits!" : `Next claim in ${formatTime(dailyTimeUntilNext)}`}
              >
                {canClaimDaily ? (
                  <>
                    <Gift className="w-4 h-4 text-green-400" />
                    <span className="font-semibold text-green-400 text-sm">
                      {isClaimingDaily ? 'Claiming...' : 'Claim 250'}
                    </span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-yellow-400 text-sm">{credits?.toLocaleString() || 0}</span>
                    {dailyTimeUntilNext > 0 && (
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        ({formatTime(dailyTimeUntilNext)})
                      </span>
                    )}
                  </>
                )}
              </motion.button>

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
                            <p className="text-sm font-medium text-white truncate">{session.user.username}</p>
                            <p className="text-xs text-gray-300 truncate">{session.user.email}</p>
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
      {(userDropdownOpen || tasksDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserDropdownOpen(false);
            setTasksDropdownOpen(false);
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

              {/* Mobile Tasks */}
              {session && completedTasks.length > 0 && (
                <div className="px-3 py-2 mt-4">
                  <div className="bg-black/30 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                    <h4 className="text-sm font-medium text-green-400 mb-2">Ready to Claim</h4>
                    {completedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center justify-between py-1">
                        <span className="text-xs text-white">{task.task.title}</span>
                        <button
                          onClick={() => handleClaimTask(task.id)}
                          disabled={isClaimingTask === task.id}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-2 py-1 rounded text-xs"
                        >
                          {isClaimingTask === task.id ? '...' : task.task.reward_credits}
                        </button>
                      </div>
                    ))}
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