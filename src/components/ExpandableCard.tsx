import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Player } from "@/lib/database";
import { X, User, DollarSign, AlertTriangle, Lock } from "lucide-react";

interface ExpandableCardProps {
  player: Player;
  quantity: number;
  firstObtained: Date;
  onSell?: (playerId: number, quantity: number) => Promise<{ 
    success: boolean; 
    creditsEarned: number; 
    remainingQuantity?: number;
    error?: string 
  }>;
  onInventoryUpdate?: () => void; // New prop to notify parent of inventory changes
  userCredits?: number;
}

const rarityColors = {
  'Super': 'from-black via-gray-900 to-black',
  'Epic': 'from-yellow-200 via-amber-300 to-yellow-500',
  'Rare': 'from-slate-200 via-gray-300 to-slate-400',
  'Common': 'from-gray-500 via-gray-400 to-gray-500',
};

const rarityGlow = {
  'Super': 'shadow-glow-super',
  'Epic': 'shadow-glow-epic',
  'Rare': 'shadow-glow-rare',
  'Common': 'shadow-glow-common',
};

const rarityBorder = {
  'Super': 'border-white',
  'Epic': 'border-yellow-400',
  'Rare': 'border-slate-300',
  'Common': 'border-gray-400',
};

const rarityBadgeStyle = {
  'Super': 'bg-white text-black font-bold',
  'Epic': 'bg-yellow-600 text-black font-bold',
  'Rare': 'bg-slate-600 text-white font-bold',
  'Common': 'bg-gray-500 text-white font-medium',
};

// Balanced sell values (conservative approach) with OVR multipliers
const baseSellValues = {
  'Super': 250,    // 50% of Standard pack cost
  'Epic': 100,      // 20% of Standard pack cost
  'Rare': 30,      // 6% of Standard pack cost
  'Common': 12     // 2.4% of Standard pack cost
};

// Calculate sell value based on OVR rating directly
function calculateSellValue(rarity: keyof typeof baseSellValues, overallRating: number): number {
  const baseValue = baseSellValues[rarity];
  
  // OVR multiplier tiers
  let multiplier = 1.0;
  
  if (overallRating >= 95) {
    multiplier = 2.0;     // Elite players: 100% bonus
  } else if (overallRating >= 90) {
    multiplier = 1.75;    // Superstar players: 75% bonus
  } else if (overallRating >= 85) {
    multiplier = 1.5;     // All-Star players: 50% bonus
  } else if (overallRating >= 80) {
    multiplier = 1.25;    // Star players: 25% bonus
  } else if (overallRating >= 75) {
    multiplier = 1.1;     // Above average players: 10% bonus
  }
  // Below 75 OVR: no bonus (1.0x multiplier)
  
  return Math.floor(baseValue * multiplier);
}

export function ExpandableCard({ player, quantity, firstObtained, onSell, onInventoryUpdate, userCredits }: ExpandableCardProps) {
  const [active, setActive] = useState<boolean>(false);
  const [showSellConfirm, setShowSellConfirm] = useState<boolean>(false);
  const [sellQuantity, setSellQuantity] = useState<number>(1);
  const [isSelling, setIsSelling] = useState<boolean>(false);
  const [sellMessage, setSellMessage] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<number>(quantity); // Track quantity locally
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  // Update local quantity when prop changes
  useEffect(() => {
    setCurrentQuantity(quantity);
  }, [quantity]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
        setShowSellConfirm(false);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    
    // Cleanup function to ensure body overflow is always reset
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [active]);

  useOutsideClick(ref, () => {
    setActive(false);
    setShowSellConfirm(false);
  });

  const canSell = currentQuantity > 0; // Use local quantity state
  const sellValue = calculateSellValue(player.rarity, player.overall_rating);
  const totalSellValue = sellValue * sellQuantity;

  // Default sell function if none provided
  const handleSellCard = onSell || (async (playerId: number, quantity: number) => {
    // This would typically call your API
    try {
      const response = await fetch('/api/sell-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, quantity })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, creditsEarned: 0, error: 'Failed to sell card' };
    }
  });

  const handleSellClick = () => {
    if (!canSell) return;
    setShowSellConfirm(true);
  };

  const confirmSell = async () => {
    if (!canSell || isSelling) return;
    
    setIsSelling(true);
    setSellMessage('');
    
    try {
      const result = await handleSellCard(player.id, sellQuantity);
      
      if (result.success) {
        setSellMessage(`Sold ${sellQuantity}x ${player.name} for ${result.creditsEarned} credits!`);
        setShowSellConfirm(false);
        
        // Update local quantity state
        const newQuantity = currentQuantity - sellQuantity;
        setCurrentQuantity(newQuantity);
        
        // Reset sell quantity for next time
        setSellQuantity(1);
        
        // Notify parent component to refresh inventory
        if (onInventoryUpdate) {
          onInventoryUpdate();
        }
        
        // Close modal after successful sell, especially if no cards left
        setTimeout(() => {
          if (newQuantity <= 0) {
            // Ensure body overflow is reset before component unmounts
            document.body.style.overflow = "auto";
            setActive(false);
          }
          setSellMessage('');
        }, 1500); // Reduced timeout to close faster
      } else {
        setSellMessage(result.error || 'Failed to sell card');
      }
    } catch (error) {
      setSellMessage('Error selling card. Please try again.');
    } finally {
      setIsSelling(false);
    }
  };

  // Clean up body overflow and close modal if no cards left
  useEffect(() => {
    if (currentQuantity <= 0 && active) {
      // Restore body overflow before component disappears
      document.body.style.overflow = "auto";
      setActive(false);
    }
  }, [currentQuantity, active]);

  // Don't render if no cards left
  if (currentQuantity <= 0) {
    return null;
  }

  const StatBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-200">{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            value >= 90 ? 'bg-gradient-to-r from-yellow-400 to-yellow-200' :
            value >= 80 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300' :
            value >= 70 ? 'bg-gradient-to-r from-slate-500 to-slate-300' :
            'bg-gradient-to-r from-gray-500 to-gray-300'
          }`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
      
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md h-full w-full z-50"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-50 p-4">
            <motion.div
              layoutId={`card-${player.id}-${id}`}
              ref={ref}
              className="w-full max-w-2xl h-full md:h-fit md:max-h-[90%] flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-white/20"
            >
              <motion.div className="flex justify-between items-start p-6">
                <div className="flex flex-col">
                  <motion.h3
                    layoutId={`title-${player.id}-${id}`}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    {player.name}
                  </motion.h3>
                  <motion.p
                    layoutId={`team-${player.id}-${id}`}
                    className="text-lg text-gray-300"
                  >
                    {player.team || 'N/A'} • {player.region || 'N/A'}
                  </motion.p>
                </div>
                <motion.button
                  layoutId={`close-${player.id}-${id}`}
                  onClick={() => setActive(false)}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
              </motion.div>

              {/* Sell Success/Error Message */}
              {sellMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-6 mb-4 p-3 rounded-lg text-center font-medium ${
                    sellMessage.includes('Sold') 
                      ? 'bg-green-600/20 border border-green-500/30 text-green-300'
                      : 'bg-red-600/20 border border-red-500/30 text-red-300'
                  }`}
                >
                  {sellMessage}
                </motion.div>
              )}

              <div className="px-6 pb-6 flex-1 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Card Visual */}
                  <div className="space-y-4">
                    <motion.div
                      layoutId={`card-visual-${player.id}-${id}`}
                      className={`relative w-full aspect-[3/4] rounded-xl border-2 ${rarityBorder[player.rarity]} 
                                  bg-gradient-to-br ${rarityColors[player.rarity]} 
                                  bg-metal-800 overflow-hidden ${rarityGlow[player.rarity]}`}
                    >
                      {/* Foil effect for Super cards */}
                      {player.rarity === 'Super' && (
                        <>
                          {/* Holographic overlay */}
                          <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
                          
                          {/* Shimmer effect */}
                          <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
                          
                          {/* Reflective highlights */}
                          <div className="absolute top-4 left-4 right-4 h-16 rounded-lg opacity-20 bg-gradient-to-b from-white/60 to-transparent" />
                        </>
                      )}
                      
                      {/* Rarity Badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm z-10 ${rarityBadgeStyle[player.rarity]}`}>
                        {player.rarity}
                      </div>

                      {/* Quantity Badge */}
                      {currentQuantity > 1 && (
                        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20 z-10">
                          x{currentQuantity}
                        </div>
                      )}

                      {/* Player Image Placeholder */}
                      <div className="w-full h-48 flex items-center justify-center relative z-0 overflow-hidden">
                        <img 
                          src={`/players/${player.name.toLowerCase()}.jpg`}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to profile icon if image doesn't exist
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        
                        <div className="text-6xl font-bold text-white w-full h-full items-center justify-center hidden">
                          <User size={64} className="text-white" />
                        </div>
                      </div>

                      {/* Overall Rating */}
                      <div className="absolute bottom-4 left-4 right-4 text-center z-10">
                        <div className="text-4xl font-bold text-white mb-1">{player.overall_rating}</div>
                        <div className="text-sm text-gray-200">OVERALL</div>
                      </div>
                    </motion.div>

                    {/* Collection Info & Selling */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-3">Collection Info</h4>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Quantity:</span>
                          <span className="text-white font-bold">x{currentQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">First Obtained:</span>
                          <span className="text-white">{new Date(firstObtained).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Rarity:</span>
                          <span className={`font-bold ${
                            player.rarity === 'Super' ? 'text-yellow-300' :
                            player.rarity === 'Epic' ? 'text-yellow-400' :
                            player.rarity === 'Rare' ? 'text-slate-400' :
                            'text-gray-400'
                          }`}>
                            {player.rarity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Sell Value:</span>
                          <span className="text-green-400 font-bold">{sellValue} credits</span>
                        </div>
                      </div>

                      {/* Selling Section - Always show sell button */}
                      <div className="border-t border-white/10 pt-4">
                        {!showSellConfirm ? (
                          <div>
                            <button
                              onClick={handleSellClick}
                              disabled={!canSell}
                              className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all ${
                                canSell
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-gray-600 cursor-not-allowed text-gray-400'
                              }`}
                            >
                              {canSell ? (
                                <>
                                  <DollarSign size={16} />
                                  Sell Card
                                </>
                              ) : (
                                <>
                                  <DollarSign size={16} />
                                  No Cards to Sell
                                </>
                              )}
                            </button>
                            {!canSell && (
                              <p className="text-xs text-gray-400 mt-2 text-center">
                                You don't have any copies of this card
                              </p>
                            )}
                          </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-yellow-400">
                                <AlertTriangle size={16} />
                                <span className="font-medium">Confirm Sale</span>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm text-gray-300">Quantity to sell:</label>
                                  <input
                                    type="range"
                                    min="1"
                                    max={currentQuantity} // Use current quantity
                                    value={Math.min(sellQuantity, currentQuantity)} // Ensure sell quantity doesn't exceed current
                                    onChange={(e) => setSellQuantity(parseInt(e.target.value))}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-xs text-gray-400">
                                    <span>1</span>
                                    <span className="text-white font-medium">
                                      Selling: {Math.min(sellQuantity, currentQuantity)}x for {sellValue * Math.min(sellQuantity, currentQuantity)} credits
                                    </span>
                                    <span>{currentQuantity}</span>
                                  </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowSellConfirm(false)}
                                  className="flex-1 py-2 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 text-white font-medium transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={confirmSell}
                                  disabled={isSelling}
                                  className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition-colors"
                                >
                                  {isSelling ? 'Selling...' : 'Confirm'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                    </div>
                  </div>

                  {/* Right Column - Stats */}
                  <div className="space-y-6">
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="text-xl font-semibold text-white mb-6">Player Stats</h4>
                      <div className="space-y-4">
                        <StatBar label="Defense" value={player.defense} />
                        <StatBar label="Offense" value={player.offense} />
                        <StatBar label="Mechanics" value={player.mechanics} />
                        <StatBar label="Challenges" value={player.challenges} />
                        <StatBar label="Game IQ" value={player.game_iq} />
                        <StatBar label="Team Sync" value={player.team_sync} />
                      </div>
                    </div>

                    {/* Performance Breakdown */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="text-xl font-semibold text-white mb-4">Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {Math.round((player.defense + player.challenges) / 2)}
                          </div>
                          <div className="text-sm text-gray-300">Defensive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {Math.round((player.offense + player.mechanics) / 2)}
                          </div>
                          <div className="text-sm text-gray-300">Offensive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {player.game_iq}
                          </div>
                          <div className="text-sm text-gray-300">IQ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {player.team_sync}
                          </div>
                          <div className="text-sm text-gray-300">Teamwork</div>
                        </div>
                      </div>
                    </div>

                    {/* Market Value Info - Always show */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="text-xl font-semibold text-white mb-4">Market Value</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Current Value:</span>
                          <span className="text-green-400 font-bold">{sellValue} credits</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Max Sellable:</span>
                          <span className="text-green-400 font-bold">{sellValue * currentQuantity} credits</span>
                        </div>
                        <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
                          💡 Tip: Higher OVR players are worth more credits! Value increases with overall rating.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed Card */}
      <motion.div
        layoutId={`card-${player.id}-${id}`}
        onClick={() => setActive(true)}
        className={`relative w-full h-80 cursor-pointer rounded-xl 
                    bg-gradient-to-br ${rarityColors[player.rarity]} 
                    bg-metal-800 overflow-hidden hover:scale-105 transition-all duration-300 ${rarityGlow[player.rarity]}`}
      >
        {/* Foil effect for Super cards */}
        {player.rarity === 'Super' && (
          <>
            {/* Holographic overlay */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
            
            {/* Reflective highlights */}
            <div className="absolute top-4 left-4 right-4 h-16 rounded-lg opacity-20 bg-gradient-to-b from-white/60 to-transparent" />
          </>
        )}
        
        {/* Rarity Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs z-10 ${rarityBadgeStyle[player.rarity]}`}>
          {player.rarity}
        </div>

        {/* Quantity Badge */}
        {currentQuantity > 1 && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold border border-white/20 z-10">
            x{currentQuantity}
          </div>
        )}

        {/* Player Image Placeholder */}
        <motion.div 
          layoutId={`card-visual-${player.id}-${id}`}
          className="w-full h-36 flex items-center justify-center relative z-0 overflow-hidden"
        >
          <img 
            src={`/players/${player.name.toLowerCase()}.jpg`}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to profile icon if image doesn't exist
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
          
          <div className="text-4xl font-bold text-white w-full h-full items-center justify-center hidden">
            <User size={48} className="text-white" />
          </div>
        </motion.div>

        {/* Player Info */}
        <div className="p-4 text-white relative z-10">
          <motion.h3 
            layoutId={`title-${player.id}-${id}`}
            className="font-bold text-lg mb-1"
          >
            {player.name}
          </motion.h3>
          <motion.p 
            layoutId={`team-${player.id}-${id}`}
            className="text-sm text-gray-400 mb-2"
          >
            {player.team || 'N/A'} • {player.region || 'N/A'}
          </motion.p>
          <div className="text-center mb-2">
            <span className="text-2xl font-bold">{player.overall_rating}</span>
            <span className="text-sm text-gray-400 ml-1">OVR</span>
          </div>
          
          {/* Condensed Stats */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>DEF</span>
              <span>{player.defense}</span>
            </div>
            <div className="flex justify-between">
              <span>OFF</span>
              <span>{player.offense}</span>
            </div>
            <div className="flex justify-between">
              <span>MEC</span>
              <span>{player.mechanics}</span>
            </div>
            <div className="flex justify-between">
              <span>CHA</span>
              <span>{player.challenges}</span>
            </div>
            <div className="flex justify-between">
              <span>IQ</span>
              <span>{player.game_iq}</span>
            </div>
            <div className="flex justify-between">
              <span>SYNC</span>
              <span>{player.team_sync}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}