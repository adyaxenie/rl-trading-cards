'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface CreditsContextType {
  credits: number
  availableCredits: number
  timeUntilNext: number
  isLoading: boolean
  claimCredits: () => Promise<boolean>
  refreshCredits: () => Promise<void>
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export function useCredits() {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}

interface CreditsProviderProps {
  children: ReactNode
}

export function CreditsProvider({ children }: CreditsProviderProps) {
  const { data: session } = useSession()
  const [credits, setCredits] = useState<number>(0)
  const [availableCredits, setAvailableCredits] = useState<number>(0)
  const [timeUntilNext, setTimeUntilNext] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [lastEarned, setLastEarned] = useState<Date | null>(null)

  // Fetch credits from API
  const fetchCredits = async (): Promise<void> => {
    if (!session) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/credits')
      if (response.ok) {
        const data = await response.json()
        setCredits(data.credits)
        setAvailableCredits(data.availableCredits)
        setTimeUntilNext(data.timeUntilNextCredit)
        setLastEarned(new Date(data.lastEarned))
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          localStorage.setItem('credits-update', JSON.stringify({
            credits: data.credits,
            availableCredits: data.availableCredits,
            timeUntilNext: data.timeUntilNextCredit,
            timestamp: Date.now()
          }))
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Claim available credits
  const claimCredits = async (): Promise<boolean> => {
    if (!session || availableCredits <= 0) return false

    try {
      const response = await fetch('/api/credits', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setCredits(data.credits)
        setAvailableCredits(0)
        setLastEarned(new Date(data.lastEarned))
        
        // Broadcast to other tabs
        if (typeof window !== 'undefined') {
          localStorage.setItem('credits-update', JSON.stringify({
            credits: data.credits,
            availableCredits: 0,
            timeUntilNext: 3600, // Reset to 1 hour
            timestamp: Date.now()
          }))
        }
        
        return true
      } else {
        console.log(data.error)
        return false
      }
    } catch (error) {
      console.error('Error claiming credits:', error)
      return false
    }
  }

  // Update countdown timer
  const updateTimer = () => {
    if (!lastEarned) return

    const now = new Date()
    const timeSinceLastClaim = now.getTime() - lastEarned.getTime()
    const hoursSince = timeSinceLastClaim / (1000 * 60 * 60)
    
    // Calculate available credits based on time passed
    const newAvailableCredits = Math.min(Math.floor(hoursSince) * 10, 240)
    setAvailableCredits(newAvailableCredits)
    
    if (newAvailableCredits > 0) {
      setTimeUntilNext(0)
    } else {
      // Time until next credit (next full hour)
      const minutesSinceLastClaim = (timeSinceLastClaim / (1000 * 60)) % 60
      const secondsUntilNextCredit = (60 - minutesSinceLastClaim) * 60
      setTimeUntilNext(Math.max(0, Math.floor(secondsUntilNextCredit)))
    }
  }

  // Listen for cross-tab updates
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'credits-update' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          setCredits(data.credits)
          setAvailableCredits(data.availableCredits)
          setTimeUntilNext(data.timeUntilNext)
        } catch (error) {
          console.error('Error parsing credits update:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Initial fetch and timer setup
  useEffect(() => {
    if (session) {
      fetchCredits()
      
      // Set up timer that updates every second
      const interval = setInterval(() => {
        updateTimer()
        
        // Refresh credits data every 5 minutes
        const now = Date.now()
        if (now % 300000 < 1000) { // Roughly every 5 minutes
          fetchCredits()
        }
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // Reset state when not authenticated
      setCredits(0)
      setAvailableCredits(0)
      setTimeUntilNext(0)
      setLastEarned(null)
      setIsLoading(false)
    }
  }, [session, lastEarned]) // Add lastEarned as dependency

  const value: CreditsContextType = {
    credits,
    availableCredits,
    timeUntilNext,
    isLoading,
    claimCredits,
    refreshCredits: fetchCredits
  }

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  )
}