'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Package, 
  Coins, 
  Edit3, 
  Save, 
  X,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import UsernameModal from '@/components/UsernameModal';
import { BackgroundBeams } from '@/components/BackgroundBeams';

interface UserStats {
  credits: number;
  totalPacks: number;
  cardsCollected: number;
  joinDate: string;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats>({
    credits: 0,
    totalPacks: 0,
    cardsCollected: 0,
    joinDate: ''
  });
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (session) {
      fetchUserStats();
    }
  }, [session, status, router]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user-stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = () => {
    setShowUsernameModal(true);
  };

  const handleUsernameSet = async (newUsername: string) => {
    // Update the session to reflect the new username
    await update();
    setShowUsernameModal(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and you will lose all your cards and progress.'
    );
    
    if (confirmed) {
      try {
        const response = await fetch('/api/delete-account', { method: 'DELETE' });
        if (response.ok) {
          await signOut({ callbackUrl: '/' });
        } else {
          alert('Failed to delete account. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('An error occurred while deleting your account.');
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden">
      <BackgroundBeams className="z-0" />
      
      {/* Username Modal */}
      <UsernameModal 
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        onUsernameSet={handleUsernameSet}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-8 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <SettingsIcon className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-gray-300">Manage your profile and account preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                <User className="w-6 h-6 text-blue-400" />
                <span>Profile</span>
              </h2>

              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={session.user.image || '/default-avatar.png'}
                    alt="Profile"
                    className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white/10"
                  />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {session.user.name}
                </h3>
                <p className="text-gray-300 text-sm">{session.user.email}</p>
              </div>

              {/* Profile Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Username</p>
                      <p className="text-white font-medium">
                        {session.user.username || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUsernameChange}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    title="Change username"
                  >
                    <Edit3 className="w-4 h-4 text-blue-400" />
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white text-sm">{session.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Member since</p>
                    <p className="text-white text-sm">
                      {userStats.joinDate ? formatDate(userStats.joinDate) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats & Settings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Stats Card */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>Statistics</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Coins className="w-6 h-6 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{userStats.credits.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Credits</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{userStats.totalPacks}</p>
                  <p className="text-sm text-gray-400">Packs Opened</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{userStats.cardsCollected}</p>
                  <p className="text-sm text-gray-400">Cards Collected</p>
                </div>
              </div>
            </div>

            {/* Settings Options */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                <SettingsIcon className="w-6 h-6 text-blue-400" />
                <span>Preferences</span>
              </h2>

              <div className="space-y-4">
                {/* Username Setting */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-blue-400" />
                    <div>
                      <h3 className="text-white font-medium">Username</h3>
                      <p className="text-sm text-gray-400">Change your display name</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUsernameChange}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Change
                  </button>
                </div>

                {/* Notifications (placeholder) */}
                {/* <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg opacity-50">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Notifications</h3>
                      <p className="text-sm text-gray-400">Email preferences (Coming soon)</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Soon</div>
                </div> */}

                {/* Theme (placeholder) */}
                {/* <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg opacity-50">
                  <div className="flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="text-white font-medium">Theme</h3>
                      <p className="text-sm text-gray-400">Customize appearance (Coming soon)</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Soon</div>
                </div> */}
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center space-x-2">
                <Shield className="w-6 h-6 text-red-400" />
                <span>Account</span>
              </h2>

              <div className="space-y-4">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Warning: This action cannot be undone
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}