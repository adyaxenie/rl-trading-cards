'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from './Navbar';

export default function NavbarWrapper() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);

  // Load user credits
  useEffect(() => {
    if (session?.user) {
      loadCredits();
      
      // Refresh credits every 30 seconds
      const interval = setInterval(loadCredits, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadCredits = async () => {
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  return <Navbar credits={credits} />;
}