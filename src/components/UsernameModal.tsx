'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Check, X, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameSet: (username: string) => void;
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    usernameTimeout?: NodeJS.Timeout;
  }
}

export default function UsernameModal({ isOpen, onClose, onUsernameSet }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  
  const { update } = useSession();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setError('');
      setIsAvailable(null);
      setIsChecking(false);
    } else {
      // Clear timeout when modal closes
      if (window.usernameTimeout) {
        clearTimeout(window.usernameTimeout);
      }
    }
  }, [isOpen]);

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (usernameToCheck.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(usernameToCheck)}`);
      const data = await response.json();
      setIsAvailable(data.available);
      
      // Set specific error message if username is not available
      if (!data.available && data.reason) {
        setError(data.reason);
      } else if (!data.available) {
        setError('Username not available');
      } else {
        setError(''); // Clear error if available
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(null);
      setError('Error checking username availability');
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow letters (no numbers or special characters)
    const sanitized = value.replace(/[^a-zA-Z]/g, '');
    setUsername(sanitized);
    setError('');
    
    // Clear any existing timeout
    if (window.usernameTimeout) {
      clearTimeout(window.usernameTimeout);
    }
    
    // Debounce the availability check
    window.usernameTimeout = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First check availability
      setIsChecking(true);
      const checkResponse = await fetch(`/api/check-username?username=${encodeURIComponent(username.trim())}`);
      const checkData = await checkResponse.json();
      setIsChecking(false);
      
      if (!checkData.available) {
        setError(checkData.reason || 'Username not available');
        setIsAvailable(false);
        setIsLoading(false);
        return;
      }
      
      setIsAvailable(true);

      // If available, proceed to set username
      const response = await fetch('/api/set-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the session with the new username
        await update();
        onUsernameSet(username.trim());
        onClose();
      } else {
        setError(data.error || 'Failed to set username');
        setIsAvailable(false);
      }
    } catch (error) {
      console.error('Error setting username:', error);
      setError('Something went wrong. Please try again.');
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsernameStatus = () => {
    if (username.length === 0) return null;
    if (username.length < 3) return { icon: AlertCircle, color: 'text-yellow-400', message: 'Too short' };
    if (isChecking) return { icon: null, color: 'text-blue-400', message: 'Checking...' };
    if (isAvailable === true) return { icon: Check, color: 'text-green-400', message: 'Available!' };
    if (isAvailable === false) return { icon: X, color: 'text-red-400', message: 'Not available' };
    return null;
  };

  const status = getUsernameStatus();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative bg-black/90 backdrop-blur-sm border border-white/20 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Choose Your Username</h2>
              <p className="text-gray-300 text-sm">
                This will be your display name in the game. You can't change it later!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter username..."
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  maxLength={20}
                  disabled={isLoading}
                />
                
                {/* Status indicator */}
                {status && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {status.icon && <status.icon className={`w-4 h-4 ${status.color}`} />}
                    <span className={`text-xs ${status.color}`}>{status.message}</span>
                  </div>
                )}
              </div>

              {/* Username requirements */}
              <div className="text-xs text-gray-400 space-y-1">
                <div className={username.length >= 3 ? 'text-green-400' : 'text-gray-400'}>
                  ✓ At least 3 characters
                </div>
                <div className={username.length <= 20 ? 'text-green-400' : 'text-red-400'}>
                  ✓ Less than 20 characters
                </div>
                <div className={/^[a-zA-Z]*$/.test(username) && username.length > 0 ? 'text-green-400' : 'text-gray-400'}>
                  ✓ Only letters (no numbers or symbols)
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || username.length < 3}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoading || isChecking ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}