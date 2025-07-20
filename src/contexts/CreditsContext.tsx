// Create: /contexts/CreditsContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface CreditsContextType {
  credits: number;
  setCredits: (credits: number) => void;
  refreshCredits: () => Promise<void>;
  availableCredits: number;
  setAvailableCredits: (available: number) => void;
  canClaim: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [canClaim, setCanClaim] = useState(false);

  const refreshCredits = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        const newCanClaim = data.canClaim;
        setCanClaim(newCanClaim);
        setAvailableCredits(newCanClaim ? 240 : 0);
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  };

  // Initial load
  useEffect(() => {
    if (session?.user) {
      refreshCredits();
    }
  }, [session]);

  return (
    <CreditsContext.Provider value={{
      credits,
      setCredits,
      refreshCredits,
      availableCredits,
      setAvailableCredits,
      canClaim
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
}