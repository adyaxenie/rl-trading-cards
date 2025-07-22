// app/purchase-success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { CheckCircle, Coins, ArrowRight, Home, Package, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import { useCredits } from '@/contexts/CreditsContext';
import { BackgroundBeams } from '@/components/BackgroundBeams';
import Footer from '@/components/Footer';

export default function PurchaseSuccess() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { refreshCredits } = useCredits();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [creditsAdded, setCreditsAdded] = useState(0);
  const [packageName, setPackageName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);
  const session_id = searchParams.get('session_id');

  useEffect(() => {
    if (session_id && session) {
      verifyAndProcessPayment();
    }
  }, [session_id, session]);

  const verifyAndProcessPayment = async () => {
    try {
      const response = await fetch(`/api/payments/verify?session_id=${session_id}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCreditsAdded(data.credits);
        setPackageName(data.package);
        setAlreadyProcessed(data.alreadyProcessed || false);
        setPaymentStatus('success');
        
        // Only refresh credits if this is a new payment (not already processed)
        if (!data.alreadyProcessed) {
          await refreshCredits();
        }
      } else {
        setErrorMessage(data.error || 'Payment verification failed');
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      setErrorMessage('Failed to verify payment');
      setPaymentStatus('error');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden flex items-center justify-center">
        <BackgroundBeams className="z-0" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view this page</h1>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden flex items-center justify-center">
        <BackgroundBeams className="z-0" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verifying your payment...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we process your purchase</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 relative overflow-hidden flex items-center justify-center p-4">
      <BackgroundBeams className="z-0" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-0 max-w-md w-full bg-black/40 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <AlertCircle className="w-12 h-12 text-red-400" />
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-4">Payment Error</h1>
          <p className="text-gray-300 mb-6">{errorMessage}</p>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
        <div className="min-h-screen bg-gradient-to-br from-metal-900 via-metal-800 to-metal-700 s overflow-hidden flex items-center justify-center p-4">
        <BackgroundBeams className="z-0" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-0 max-w-md w-full bg-black/40 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
          className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold text-white mb-4"
        >
          {alreadyProcessed ? 'Payment Confirmed' : 'Payment Successful!'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-300 mb-6"
        >
          {alreadyProcessed 
            ? 'Your payment was already processed and credits were added to your account.'
            : 'Thank you for your purchase! Your credits have been added to your account.'
          }
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`bg-gradient-to-r ${alreadyProcessed ? 'from-blue-500/10 to-purple-500/10 border-blue-400/20' : 'from-green-500/10 to-blue-500/10 border-green-400/20'} rounded-lg p-4 mb-6 border`}
        >
          <div className="flex items-center justify-center space-x-2 mb-2">
            {alreadyProcessed ? (
              <Info className="w-6 h-6 text-blue-400" />
            ) : (
              <Coins className="w-6 h-6 text-yellow-400" />
            )}
            <span className="text-2xl font-bold text-white">
              {creditsAdded.toLocaleString()} Credits
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {alreadyProcessed ? 'were previously processed' : 'purchased successfully'}
          </p>
        </motion.div>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Package className="w-5 h-5 mr-2" />
              Open Card Packs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href="/inventory"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              View Collection
            </Link>
          </motion.div>
        </div>

        {!alreadyProcessed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-gray-500 mt-6"
          >
            You will receive an email receipt from Stripe shortly.
          </motion.p>
        )}
      </motion.div>
      <Footer />
    </div>
  );
}
