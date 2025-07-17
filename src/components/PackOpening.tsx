import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn } from 'next-auth/react';
import { ExpandableCard } from './ExpandableCard';
import { Player } from '@/lib/database';
import { User } from 'lucide-react';

interface PackOpeningProps {
  onPackOpened: (remainingCredits: number) => void;
  userCredits: number;
}

export default function PackOpening({ onPackOpened, userCredits }: PackOpeningProps) {
  const { data: session, status } = useSession();
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [cards, setCards] = useState<Player[]>([]);
  const [showCards, setShowCards] = useState<boolean>(false);
  const [selectedPack, setSelectedPack] = useState<string>('standard');

  const packTypes = {
    standard: {
      name: 'Standard Pack',
      cost: 500,
      description: '5 cards with standard odds - broad collection building',
      foilType: 'silver',
      odds: {
        'Super': '1.5%',
        'Epic': '8%', 
        'Rare': '28%',
        'Common': '62.5%'
      },
      efficiency: '0.3 Super/1000 credits',
      recommendation: 'Best for early collection building'
    },
    premium: {
      name: 'Premium Pack',
      cost: 1000,
      description: '5 cards with boosted rates - efficient Super hunting!',
      foilType: 'gold',
      odds: {
        'Super': '6%',
        'Epic': '22%',
        'Rare': '35%', 
        'Common': '37%'
      },
      efficiency: '0.6 Super/1000 credits',
      recommendation: 'Optimal rate per credit'
    },
    ultimate: {
      name: 'Ultimate Pack',
      cost: 2000,
      description: 'Premium efficiency - best for completing Super collection!',
      foilType: 'black',
      odds: {
        'Super': '15%',
        'Epic': '40%',
        'Rare': '35%', 
        'Common': '10%'
      },
      efficiency: '0.75 Super/1000 credits',
      recommendation: 'Best for targeting high-rarity cards'
    }
  };

  const openPack = async (packType: string): Promise<void> => {
    if (!session) {
      signIn('google');
      return;
    }

    const pack = packTypes[packType as keyof typeof packTypes];
    if (userCredits < pack.cost) {
      alert(`Not enough credits! You need ${pack.cost} credits but only have ${userCredits}.`);
      return;
    }

    setIsOpening(true);
    setSelectedPack(packType);
    
    try {
      const response = await fetch('/api/open-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packType })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards);
        
        // Delay showing cards for dramatic effect
        setTimeout(() => {
          setShowCards(true);
          setIsOpening(false);
        }, 1500);
        
        onPackOpened(data.remainingCredits);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to open pack');
        setIsOpening(false);
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      alert('Error opening pack. Please try again.');
      setIsOpening(false);
    }
  };

  const resetPack = (): void => {
    setCards([]);
    setShowCards(false);
    setSelectedPack('standard');
  };

  const FoilPack = ({ type, pack, onClick }: { type: string, pack: any, onClick: () => void }) => {
    const isSilver = pack.foilType === 'silver';
    const isGold = pack.foilType === 'gold';
    const isBlack = pack.foilType === 'black';
    const canAfford = session && userCredits >= pack.cost;
    const isDisabled = !session || !canAfford;
    
    return (
      <motion.div
        className={`relative w-64 h-96 cursor-pointer group perspective-1000 ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={!isDisabled ? { scale: 1.05, y: -10 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        onClick={!isDisabled ? onClick : undefined}
      >
        {/* RL.TCG text repeating along left edge */}
        <div className="absolute left-0 top-8 bottom-8 flex flex-col justify-between items-center z-20">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i}
              className={`text-base font-bold tracking-widest opacity-50 ${
                isSilver ? 'text-slate-700' :
                isGold ? 'text-amber-800' :
                'text-gray-400'
              }`}
              style={{ 
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              <em>RL.TCG</em>
            </div>
          ))}
        </div>
        
        {/* Main pack body with foil effect */}
        <div className={`
          w-full h-full rounded-xl relative overflow-hidden shadow-2xl
          ${isSilver 
            ? 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-400 border-slate-300' 
            : isGold 
            ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-500 border-yellow-400'
            : 'bg-gradient-to-br from-black via-gray-900 to-black border-white'
          }
        `}>
          
          {/* Holographic/foil overlay effects */}
          <div className={`
            absolute inset-0 opacity-60 animate-pulse
            ${isSilver 
              ? 'bg-gradient-to-tr from-blue-200/30 via-purple-200/30 to-pink-200/30' 
              : isGold
              ? 'bg-gradient-to-tr from-orange-200/40 via-red-200/40 to-pink-200/40'
              : 'bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20'
            }
          `} />
          
          {/* Shimmer effect */}
          <div className={`
            absolute inset-0 opacity-40 transform -skew-x-12 ${!isDisabled ? 'group-hover:animate-shimmer' : ''}
            bg-gradient-to-r from-transparent to-transparent
            ${isSilver 
              ? 'via-slate-100/80' 
              : isGold
              ? 'via-yellow-100/80'
              : 'via-white/60'
            }
          `} />
          

          {/* Embossed edges */}
          <div className={`
            absolute inset-0 rounded-xl shadow-inner
            ${isSilver 
              ? 'border-slate-400' 
              : isGold
              ? 'border-yellow-600'
              : 'border-gray-600'
            }
          `} />

          {/* Not enough credits overlay */}
          {session && !canAfford && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
              <div className="text-center text-white">
                <div className="text-sm font-bold mb-1">Not Enough Credits</div>
                <div className="text-xs">Need {(pack.cost).toLocaleString()} have {(userCredits).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Sign in required overlay */}
          {!session && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
              <div className="text-center text-white">
                <User className="w-8 h-8 mx-auto mb-2" />
                <div className="text-sm font-bold">Sign In Required</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Large RL.TCG bottom right */}
        <div className="absolute bottom-6 right-6 z-20">
          <div 
            className={`text-4xl font-bold tracking-wider opacity-50 ${
              isSilver ? 'text-slate-700' :
              isGold ? 'text-amber-800' :
              'text-gray-400'
            }`}
          >
            <em>RL.TCG</em>
          </div>
        </div>
        
        {/* Enhanced floating info panel on hover */}
        <motion.div
          className={`absolute -bottom-20 left-0 right-0 bg-black/95 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 z-40 ${
            !isDisabled ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
          }`}
          initial={false}
        >
          <div className="text-center text-white">
            <div className="font-bold text-sm mb-1">{pack.name}</div>
            <div className="text-xs text-gray-300 mb-2">{pack.description}</div>
            <div className={`text-lg font-bold mb-2 ${
              canAfford ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {(pack.cost).toLocaleString() || 0} Credits
            </div>
            
            {/* Strategy recommendation */}
            <div className="text-xs text-blue-300 mb-2 font-medium">
              {pack.recommendation}
            </div>
            
            {/* Efficiency indicator */}
            {/* <div className="text-xs text-green-300 mb-2">
              Efficiency: {pack.efficiency}
            </div>
             */}
            {!canAfford && session && (
              <div className="text-xs text-red-400 mb-2">
                Need {pack.cost - userCredits} more credits
              </div>
            )}
            
            {/* <div className="mt-2 text-xs">
              <div className="font-semibold mb-1">Drop Rates:</div>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(pack.odds).map(([rarity, rate]) => (
                  <div key={rarity} className="flex justify-between">
                    <span className={
                      rarity === 'Super' ? 'text-yellow-300' :
                      rarity === 'Epic' ? 'text-purple-300' :
                      rarity === 'Rare' ? 'text-blue-300' :
                      'text-gray-400'
                    }>{rarity}:</span>
                    <span className="font-bold">{String(rate)}</span>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Show sign in prompt if not authenticated
  if (status === 'loading') {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
      
      {/* Pack strategy guide */}
      {!showCards && !isOpening && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-black/40 backdrop-blur-sm rounded-lg p-4 max-w-4xl mx-auto"
        >
          <div className="text-white text-sm">
            <div className="font-bold mb-2">💡 Pack Strategy Guide</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="font-semibold text-slate-300">Early Game (0-30% collection)</div>
                <div className="text-gray-400">Choose Standard packs for collection building</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-300">Mid Game (30-70% collection)</div>
                <div className="text-gray-400">Premium packs offer best rate efficiency</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-purple-300">Late Game (70%+ collection)</div>
                <div className="text-gray-400">Ultimate packs for missing high-rarity cards</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      <AnimatePresence mode="wait">
        {!showCards ? (
          <motion.div
            key="pack-selection"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            {!isOpening ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  {Object.entries(packTypes).map(([type, pack]) => (
                    <FoilPack 
                      key={type}
                      type={type}
                      pack={pack}
                      onClick={() => openPack(type)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <motion.div className="flex flex-col items-center">
                <div className="relative w-64 h-96 mb-6">
                  <motion.div
                    className={`
                      w-full h-full rounded-xl relative overflow-hidden shadow-2xl
                      ${packTypes[selectedPack as keyof typeof packTypes].foilType === 'silver'
                        ? 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-400 border-slate-300' 
                        : packTypes[selectedPack as keyof typeof packTypes].foilType === 'gold'
                        ? 'bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-500 border-yellow-400'
                        : 'bg-gradient-to-br from-black via-gray-900 to-black border-white'
                      }
                    `}
                    animate={{ 
                      rotateY: [0, 180, 360],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  >
                    {/* Intense opening effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-pulse" />
                    <div className={`absolute inset-0 animate-pulse ${
                      packTypes[selectedPack as keyof typeof packTypes].foilType === 'black'
                        ? 'bg-gradient-to-tr from-blue-500/60 via-purple-500/60 to-pink-500/60'
                        : 'bg-gradient-to-tr from-blue-200/60 via-purple-200/60 to-pink-200/60'
                    }`} />
                  </motion.div>
                </div>
                <div className="text-white text-center">
                  <div className="text-xl font-bold animate-pulse">Opening Pack...</div>
                  <div className="text-sm text-gray-300">
                    {packTypes[selectedPack as keyof typeof packTypes].name}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                {packTypes[selectedPack as keyof typeof packTypes].name} Results!
              </h3>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                {Object.entries(
                  cards.reduce((acc, card) => {
                    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([rarity, count]) => (
                  <span key={rarity} className={`font-semibold ${
                    rarity === 'Super' ? 'text-white' :
                    rarity === 'Epic' ? 'text-yellow-400' :
                    rarity === 'Rare' ? 'text-gray-200' :
                    'text-gray-400'
                  }`}>
                    {count}x {rarity}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, rotateY: 180 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                  className="w-48"
                >
                  <ExpandableCard 
                    player={card} 
                    quantity={1}
                    firstObtained={new Date()}
                  />
                </motion.div>
              ))}
            </div>
            
            <motion.button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg
                         font-semibold transition-colors"
              onClick={resetPack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Open Another Pack
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}